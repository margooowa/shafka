import { db } from '../../data/db'
import { supabase } from '../../data/supabase'
import { thumbFor } from '../photos/compress'

// Push sync (SHA-8): upload local changes to Supabase. Offline-first — the
// local Dexie DB stays the source of truth; this mirrors it upward.
//
// Watermark strategy: `lastPushAt` (a settings row) marks the last successful
// push. Each run uploads rows changed since then, then advances the watermark.
// If a push fails (offline / error) the watermark does NOT advance, so the same
// changes retry next time — an implicit offline queue. Upserts are idempotent,
// so an overlapping retry never duplicates.

const EPOCH = '1970-01-01T00:00:00.000Z'
const LAST_PUSH_KEY = 'lastPushAt'
const LAST_PULL_KEY = 'lastPullAt'

// Normalize any timestamp (cloud timestamptz can be "+00:00", local is "Z")
// to a canonical ISO string so string/time comparisons are consistent.
const iso = (t: string) => new Date(t).toISOString()

export interface PushResult {
  items: number
  photos: number
  deletes: number
}

export interface PullResult {
  children: number
  photos: number
  items: number
}

/** Push everything changed since the last successful push. No-op when signed out. */
export async function pushChanges(): Promise<PushResult | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  const userId = session.user.id

  const since = ((await db.settings.get(LAST_PUSH_KEY))?.value as string) ?? EPOCH
  const startedAt = new Date().toISOString()

  // Children — tiny (seeded set); upsert all.
  const children = await db.children.toArray()
  if (children.length) {
    const { error } = await supabase.from('children').upsert(
      children.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        accent_color: c.accentColor,
        soft_bg: c.softBg,
        sort_order: c.sortOrder,
        updated_at: startedAt,
        deleted: false,
      })),
    )
    if (error) throw error
  }

  // Photos are immutable once created — push those newer than the watermark.
  // Blob → private bucket at <userId>/<photoId>.jpg, then the metadata row.
  const photos = await db.photos.where('createdAt').above(since).toArray()
  for (const p of photos) {
    const up = await supabase.storage.from('photos').upload(`${userId}/${p.id}.jpg`, p.full, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (up.error) throw up.error
    const { error } = await supabase.from('photos_meta').upsert({
      id: p.id,
      user_id: userId,
      width: p.width,
      height: p.height,
      created_at: p.createdAt,
      updated_at: startedAt,
      deleted: false,
    })
    if (error) throw error
  }

  // Items — updatedAt isn't a Dexie index, so filter in memory (catalog-sized).
  const items = (await db.items.toArray()).filter((it) => it.updatedAt > since)
  if (items.length) {
    const { error } = await supabase.from('items').upsert(
      items.map((it) => ({
        id: it.id,
        user_id: userId,
        child_id: it.childId,
        section: it.section,
        category: it.category,
        size: it.size,
        season: it.season,
        color: it.color,
        status: it.status,
        tags: it.tags,
        note: it.note,
        photo_id: it.photoId,
        created_at: it.createdAt,
        updated_at: it.updatedAt,
        deleted: false,
      })),
    )
    if (error) throw error
  }

  // Tombstones — mark deleted rows in the cloud and remove their photo files.
  // UPDATE (not upsert) so an item deleted before it ever pushed is simply a
  // no-op upstream instead of failing NOT NULL on insert.
  const tombstones = (await db.tombstones.toArray()).filter((t) => t.deletedAt > since)
  for (const t of tombstones) {
    const { error } = await supabase.from('items').update({ deleted: true, updated_at: t.deletedAt }).eq('id', t.id)
    if (error) throw error
    if (t.photoId) {
      await supabase.storage.from('photos').remove([`${userId}/${t.photoId}.jpg`])
      const { error: pmErr } = await supabase
        .from('photos_meta')
        .update({ deleted: true, updated_at: t.deletedAt })
        .eq('id', t.photoId)
      if (pmErr) throw pmErr
    }
  }

  await db.settings.put({ key: LAST_PUSH_KEY, value: startedAt })
  return { items: items.length, photos: photos.length, deletes: tombstones.length }
}

/**
 * Pull cloud changes into local Dexie (SHA-9). Fetches rows changed since the
 * last pull, merges by id with last-write-wins (updatedAt), downloads any photo
 * blobs not held locally (regenerating the thumbnail), and honours `deleted`
 * tombstones. The UI keeps reading from Dexie, so this just refreshes it.
 */
export async function pullChanges(): Promise<PullResult | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  const userId = session.user.id

  const since = ((await db.settings.get(LAST_PULL_KEY))?.value as string) ?? EPOCH
  const startedAt = new Date().toISOString()
  let nChildren = 0
  let nPhotos = 0
  let nItems = 0

  // Children
  const { data: children, error: cErr } = await supabase.from('children').select('*').gt('updated_at', since)
  if (cErr) throw cErr
  for (const row of children ?? []) {
    await db.children.put({
      id: row.id,
      name: row.name,
      accentColor: row.accent_color,
      softBg: row.soft_bg,
      sortOrder: row.sort_order,
    })
    nChildren++
  }

  // Photos — download blobs we don't already have; regenerate the thumbnail.
  const { data: photos, error: pErr } = await supabase.from('photos_meta').select('*').gt('updated_at', since)
  if (pErr) throw pErr
  for (const row of photos ?? []) {
    if (row.deleted) {
      await db.photos.delete(row.id)
      continue
    }
    if (await db.photos.get(row.id)) continue
    const dl = await supabase.storage.from('photos').download(`${userId}/${row.id}.jpg`)
    if (dl.error || !dl.data) throw dl.error ?? new Error('photo download failed')
    const full = dl.data
    await db.photos.put({
      id: row.id,
      full,
      thumb: await thumbFor(full),
      width: row.width,
      height: row.height,
      createdAt: iso(row.created_at),
    })
    nPhotos++
  }

  // Items — last-write-wins by updatedAt.
  const { data: items, error: iErr } = await supabase.from('items').select('*').gt('updated_at', since)
  if (iErr) throw iErr
  for (const row of items ?? []) {
    if (row.deleted) {
      await db.items.delete(row.id)
      continue
    }
    const local = await db.items.get(row.id)
    if (local && new Date(local.updatedAt).getTime() >= new Date(row.updated_at).getTime()) continue
    await db.items.put({
      id: row.id,
      childId: row.child_id,
      section: row.section,
      category: row.category,
      size: row.size,
      season: row.season,
      color: row.color,
      status: row.status,
      tags: row.tags ?? [],
      note: row.note,
      photoId: row.photo_id,
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    })
    nItems++
  }

  await db.settings.put({ key: LAST_PULL_KEY, value: startedAt })
  return { children: nChildren, photos: nPhotos, items: nItems }
}

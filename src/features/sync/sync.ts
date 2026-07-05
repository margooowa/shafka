import { db } from '../../data/db'
import { supabase } from '../../data/supabase'

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

export interface PushResult {
  items: number
  photos: number
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

  await db.settings.put({ key: LAST_PUSH_KEY, value: startedAt })
  return { items: items.length, photos: photos.length }
}

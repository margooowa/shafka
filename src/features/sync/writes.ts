import { db, newId, nowISO, type Item, type ItemDraft, type ProcessedPhoto } from '../../data/db'
import { supabase } from '../../data/supabase'

// Cloud-first writes (per VK's decision): an add / edit / delete is committed to
// Supabase FIRST and only then reflected in the local cache. If the user is
// signed out or offline, the write throws and nothing changes locally — so the
// database is always the source of truth. Reads still come from Dexie (fast,
// and viewable offline); only writes require the DB.

export class SyncWriteError extends Error {
  constructor(public reason: 'auth' | 'offline' | 'server', message?: string) {
    super(message ?? reason)
    this.name = 'SyncWriteError'
  }
}

/** User-facing (Ukrainian) message for a failed write. */
export function writeErrorMessage(e: unknown): string {
  if (e instanceof SyncWriteError && e.reason === 'auth') return 'Спочатку увійдіть в акаунт, щоб зберігати зміни.'
  return 'Немає зʼєднання з базою — зміни не збережено. Спробуйте ще раз.'
}

async function requireUser(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new SyncWriteError('auth')
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new SyncWriteError('offline')
  return session.user.id
}

function toCloudItem(it: Item, userId: string) {
  return {
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
  }
}

function patchToCloud(p: Partial<Item>): Record<string, unknown> {
  const m: Record<string, unknown> = {}
  if ('childId' in p) m.child_id = p.childId
  if ('section' in p) m.section = p.section
  if ('category' in p) m.category = p.category
  if ('size' in p) m.size = p.size
  if ('season' in p) m.season = p.season
  if ('color' in p) m.color = p.color
  if ('status' in p) m.status = p.status
  if ('tags' in p) m.tags = p.tags
  if ('note' in p) m.note = p.note
  if ('photoId' in p) m.photo_id = p.photoId
  return m
}

async function uploadPhoto(userId: string, photoId: string, photo: ProcessedPhoto, now: string): Promise<void> {
  const up = await supabase.storage.from('photos').upload(`${userId}/${photoId}.jpg`, photo.full, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (up.error) throw new SyncWriteError('server', up.error.message)
  const { error } = await supabase.from('photos_meta').insert({
    id: photoId,
    user_id: userId,
    width: photo.width,
    height: photo.height,
    created_at: now,
    updated_at: now,
    deleted: false,
  })
  if (error) throw new SyncWriteError('server', error.message)
}

async function deleteCloudPhoto(userId: string, photoId: string, now: string): Promise<void> {
  await supabase.storage.from('photos').remove([`${userId}/${photoId}.jpg`])
  await supabase.from('photos_meta').update({ deleted: true, updated_at: now }).eq('id', photoId)
}

/** Create an item (+ optional photo) in the cloud, then cache locally. */
export async function createItem(draft: ItemDraft, photo?: ProcessedPhoto): Promise<Item> {
  const userId = await requireUser()
  const now = nowISO()
  let photoId: string | null = null
  if (photo) {
    photoId = newId()
    await uploadPhoto(userId, photoId, photo, now)
  }
  const item: Item = {
    season: null,
    color: null,
    status: 'new_with_tag',
    tags: [],
    note: null,
    ...draft,
    photoId,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  }
  const { error } = await supabase.from('items').insert(toCloudItem(item, userId))
  if (error) throw new SyncWriteError('server', error.message)
  await db.transaction('rw', db.items, db.photos, async () => {
    if (photo && photoId) await db.photos.put({ id: photoId, ...photo, createdAt: now })
    await db.items.put(item)
  })
  return item
}

/** Edit an item (optionally swapping the photo) in the cloud, then locally. */
export async function editItem(
  id: string,
  patch: Partial<Omit<Item, 'id' | 'createdAt'>>,
  photo?: ProcessedPhoto,
): Promise<void> {
  const userId = await requireUser()
  const now = nowISO()
  const existing = await db.items.get(id)
  const oldPhotoId = existing?.photoId ?? null
  let photoId = oldPhotoId
  if (photo) {
    photoId = newId()
    await uploadPhoto(userId, photoId, photo, now)
  }
  const cloudPatch = { ...patchToCloud(patch), updated_at: now, ...(photo ? { photo_id: photoId } : {}) }
  const { error } = await supabase.from('items').update(cloudPatch).eq('id', id)
  if (error) throw new SyncWriteError('server', error.message)
  if (photo && oldPhotoId) await deleteCloudPhoto(userId, oldPhotoId, now)
  await db.transaction('rw', db.items, db.photos, async () => {
    if (photo && photoId) await db.photos.put({ id: photoId, ...photo, createdAt: now })
    if (photo && oldPhotoId) await db.photos.delete(oldPhotoId)
    await db.items.update(id, { ...patch, ...(photo ? { photoId } : {}), updatedAt: now })
  })
}

/** Delete an item (mark deleted in the cloud), then remove locally. */
export async function removeItem(id: string): Promise<void> {
  const userId = await requireUser()
  const now = nowISO()
  const item = await db.items.get(id)
  const { error } = await supabase.from('items').update({ deleted: true, updated_at: now }).eq('id', id)
  if (error) throw new SyncWriteError('server', error.message)
  if (item?.photoId) await deleteCloudPhoto(userId, item.photoId, now)
  await db.transaction('rw', db.items, db.photos, async () => {
    if (item?.photoId) await db.photos.delete(item.photoId)
    await db.items.delete(id)
  })
}

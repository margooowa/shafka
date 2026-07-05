import Dexie, { type EntityTable } from 'dexie'
import { CHILDREN, type ChildId, type SectionSlug } from './catalog'
import { requestSync } from '../features/sync/syncBus'

// Data model per PLAN.md §3. IDs are UUIDs (sync-safe for Phase 4),
// catalog references are stable slugs, status is an open enum (string).

export interface Child {
  id: ChildId
  name: string
  accentColor: string
  softBg: string
  sortOrder: number
}

export interface Item {
  id: string
  childId: ChildId
  section: SectionSlug
  category: string
  size: string
  season: string | null
  color: string | null
  status: string
  tags: string[]
  note: string | null
  photoId: string | null
  createdAt: string
  updatedAt: string
}

export interface Photo {
  id: string
  full: Blob
  thumb: Blob
  width: number
  height: number
  createdAt: string
}

export interface Setting {
  key: string
  value: unknown
}

// Records a local deletion so it can propagate to the cloud (SHA-10). The item
// is hard-removed from `items` (UI updates immediately); this remembers what to
// mark deleted upstream, incl. the photo to clean out of storage.
export interface Tombstone {
  id: string
  photoId: string | null
  deletedAt: string
}

export const db = new Dexie('shafka') as Dexie & {
  children: EntityTable<Child, 'id'>
  items: EntityTable<Item, 'id'>
  photos: EntityTable<Photo, 'id'>
  settings: EntityTable<Setting, 'key'>
  tombstones: EntityTable<Tombstone, 'id'>
}

db.version(1).stores({
  children: 'id, sortOrder',
  items: 'id, [childId+section], childId, section, category, size, status, createdAt',
  photos: 'id, createdAt',
  settings: 'key',
})

// v2: tombstones table for delete propagation (SHA-10). Additive — no data rewrite.
db.version(2).stores({
  children: 'id, sortOrder',
  items: 'id, [childId+section], childId, section, category, size, status, createdAt',
  photos: 'id, createdAt',
  settings: 'key',
  tombstones: 'id, deletedAt',
})

// First-run seed: the two profiles from the catalog
db.on('populate', (tx) => {
  const rows: Child[] = Object.values(CHILDREN).map((c, i) => ({
    id: c.id,
    name: c.label,
    accentColor: c.accent,
    softBg: c.soft,
    sortOrder: i,
  }))
  void tx.table('children').bulkAdd(rows)
})

export const newId = () => crypto.randomUUID()
export const nowISO = () => new Date().toISOString()

export type ItemDraft = Pick<Item, 'childId' | 'section' | 'category' | 'size'> &
  Partial<Pick<Item, 'season' | 'color' | 'status' | 'tags' | 'note' | 'photoId'>>

/** Output of the photo pipeline (features/photos/compress.ts) */
export interface ProcessedPhoto {
  full: Blob
  thumb: Blob
  width: number
  height: number
}

export async function addItem(draft: ItemDraft): Promise<Item> {
  const now = nowISO()
  const item: Item = {
    season: null,
    color: null,
    status: 'new_with_tag',
    tags: [],
    note: null,
    photoId: null,
    ...draft,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  }
  await db.items.add(item)
  requestSync()
  return item
}

/** Photo row + item in one transaction — no orphaned blobs if either write fails */
export async function addItemWithPhoto(draft: ItemDraft, photo?: ProcessedPhoto): Promise<Item> {
  if (!photo) return addItem(draft)
  const item = await db.transaction('rw', db.items, db.photos, async () => {
    const photoId = newId()
    await db.photos.add({ id: photoId, ...photo, createdAt: nowISO() })
    return addItem({ ...draft, photoId })
  })
  requestSync()
  return item
}

export async function updateItem(id: string, patch: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<void> {
  await db.items.update(id, { ...patch, updatedAt: nowISO() })
  requestSync()
}

/** Update an item; when a new photo is supplied, swap the blob atomically */
export async function updateItemWithPhoto(
  id: string,
  patch: Partial<Omit<Item, 'id' | 'createdAt'>>,
  photo?: ProcessedPhoto,
): Promise<void> {
  if (!photo) return updateItem(id, patch)
  await db.transaction('rw', db.items, db.photos, async () => {
    const existing = await db.items.get(id)
    if (existing?.photoId) await db.photos.delete(existing.photoId)
    const photoId = newId()
    await db.photos.add({ id: photoId, ...photo, createdAt: nowISO() })
    await db.items.update(id, { ...patch, photoId, updatedAt: nowISO() })
  })
  requestSync()
}

export async function deleteItem(id: string): Promise<void> {
  await db.transaction('rw', db.items, db.photos, db.tombstones, async () => {
    const item = await db.items.get(id)
    if (item?.photoId) await db.photos.delete(item.photoId)
    await db.items.delete(id)
    // Remember the deletion so sync can mark it deleted in the cloud (SHA-10).
    await db.tombstones.put({ id, photoId: item?.photoId ?? null, deletedAt: nowISO() })
  })
  requestSync()
}

import Dexie, { type EntityTable } from 'dexie'
import { CHILDREN, type ChildId, type SectionSlug } from './catalog'

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

export const db = new Dexie('shafka') as Dexie & {
  children: EntityTable<Child, 'id'>
  items: EntityTable<Item, 'id'>
  photos: EntityTable<Photo, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  children: 'id, sortOrder',
  items: 'id, [childId+section], childId, section, category, size, status, createdAt',
  photos: 'id, createdAt',
  settings: 'key',
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
  return item
}

export async function updateItem(id: string, patch: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<void> {
  await db.items.update(id, { ...patch, updatedAt: nowISO() })
}

export async function deleteItem(id: string): Promise<void> {
  await db.transaction('rw', db.items, db.photos, async () => {
    const item = await db.items.get(id)
    if (item?.photoId) await db.photos.delete(item.photoId)
    await db.items.delete(id)
  })
}

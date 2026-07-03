import { strFromU8, strToU8, unzip, zip, type Zippable } from 'fflate'
import { db, nowISO, type Child, type Item, type Photo } from '../../data/db'
import { thumbFor } from '../photos/compress'

// Backup format per PLAN §4.3: zip with human-readable manifest.json
// (children + items + photo metadata) and photos/<id>.jpg full-size blobs.
// Thumbs are NOT stored — they're regenerated on import.
const SCHEMA_VERSION = 1

interface ManifestPhoto {
  id: string
  width: number
  height: number
  createdAt: string
}

interface Manifest {
  app: 'shafka'
  schemaVersion: number
  exportedAt: string
  children: Child[]
  items: Item[]
  photos: ManifestPhoto[]
}

export class BackupError extends Error {}

const zipAsync = (entries: Zippable) =>
  new Promise<Uint8Array>((res, rej) => zip(entries, { level: 0 }, (err, data) => (err ? rej(err) : res(data))))

const unzipAsync = (data: Uint8Array) =>
  new Promise<Record<string, Uint8Array>>((res, rej) => unzip(data, (err, files) => (err ? rej(err) : res(files))))

export async function exportBackup(): Promise<{ blob: Blob; fileName: string }> {
  const [children, items, photos] = await Promise.all([
    db.children.toArray(),
    db.items.toArray(),
    db.photos.toArray(),
  ])
  const manifest: Manifest = {
    app: 'shafka',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowISO(),
    children,
    items,
    photos: photos.map(({ id, width, height, createdAt }) => ({ id, width, height, createdAt })),
  }
  const entries: Zippable = { 'manifest.json': strToU8(JSON.stringify(manifest, null, 1)) }
  for (const p of photos) {
    entries[`photos/${p.id}.jpg`] = new Uint8Array(await p.full.arrayBuffer())
  }
  const zipped = await zipAsync(entries)
  await db.settings.put({ key: 'lastExportAt', value: nowISO() })
  const fileName = `shafka-backup-${new Date().toISOString().slice(0, 10)}.zip`
  return { blob: new Blob([zipped as BlobPart], { type: 'application/zip' }), fileName }
}

export interface ImportResult {
  children: number
  items: number
  photos: number
  skippedItems: number
}

// Merge by id: only records missing locally are added, so re-importing your
// own backup never duplicates, and importing into an empty app is a full restore.
export async function importBackup(file: File): Promise<ImportResult> {
  let files: Record<string, Uint8Array>
  try {
    files = await unzipAsync(new Uint8Array(await file.arrayBuffer()))
  } catch {
    throw new BackupError('Це не zip-архів')
  }
  const manifestRaw = files['manifest.json']
  if (!manifestRaw) throw new BackupError('У архіві немає manifest.json — це не архів Шафки')

  let manifest: Manifest
  try {
    manifest = JSON.parse(strFromU8(manifestRaw)) as Manifest
  } catch {
    throw new BackupError('manifest.json пошкоджено')
  }
  if (manifest.app !== 'shafka' || !Array.isArray(manifest.items) || !Array.isArray(manifest.children)) {
    throw new BackupError('Це не архів Шафки')
  }
  if (typeof manifest.schemaVersion !== 'number' || manifest.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError('Архів створено новішою версією Шафки — онови застосунок')
  }

  const [childIds, itemIds, photoIds] = await Promise.all([
    db.children.toCollection().primaryKeys(),
    db.items.toCollection().primaryKeys(),
    db.photos.toCollection().primaryKeys(),
  ])
  const hasChild = new Set(childIds)
  const hasItem = new Set(itemIds)
  const hasPhoto = new Set(photoIds)

  const newChildren = manifest.children.filter((c) => !hasChild.has(c.id))
  const newItems = manifest.items.filter((i) => !hasItem.has(i.id))

  // Decode photos before the transaction — Dexie transactions must not await
  // non-Dexie work, and thumb regeneration goes through canvas.
  const newPhotos: Photo[] = []
  for (const meta of manifest.photos ?? []) {
    if (hasPhoto.has(meta.id)) continue
    const bytes = files[`photos/${meta.id}.jpg`]
    if (!bytes) continue
    const full = new Blob([bytes as BlobPart], { type: 'image/jpeg' })
    newPhotos.push({ id: meta.id, full, thumb: await thumbFor(full), width: meta.width, height: meta.height, createdAt: meta.createdAt })
  }

  await db.transaction('rw', db.children, db.items, db.photos, async () => {
    if (newChildren.length) await db.children.bulkAdd(newChildren)
    if (newPhotos.length) await db.photos.bulkAdd(newPhotos)
    if (newItems.length) await db.items.bulkAdd(newItems)
  })

  return {
    children: newChildren.length,
    items: newItems.length,
    photos: newPhotos.length,
    skippedItems: manifest.items.length - newItems.length,
  }
}

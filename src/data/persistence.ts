import { db } from './db'

// Ask the browser to protect IndexedDB from eviction (PLAN.md §4.3).
// On Android Chrome with an installed PWA this is granted silently.
export async function ensurePersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  let granted = await navigator.storage.persisted()
  if (!granted) {
    try {
      granted = await navigator.storage.persist()
    } catch {
      granted = false
    }
  }
  await db.settings.put({ key: 'persistentStorage', value: granted })
  return granted
}

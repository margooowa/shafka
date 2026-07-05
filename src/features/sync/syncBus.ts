// Tiny change signal so the data layer can nudge the sync controller without
// importing it (keeps db.ts free of any Supabase dependency / import cycle).
type Listener = () => void
const listeners = new Set<Listener>()

export function onSyncRequest(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Called by db.ts after every local mutation. */
export function requestSync(): void {
  for (const l of listeners) l()
}

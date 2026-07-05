import { createClient } from '@supabase/supabase-js'

// Cloud backend for Phase 2 sync (SHA-5+). The app stays offline-first:
// Dexie/IndexedDB (db.ts) remains the source of truth the UI reads from;
// this client only pushes/pulls in the background once sync lands (SHA-8+).
// No tables or data flow yet — schema + RLS arrive in SHA-7.

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Supabase config missing. Add VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY to .env.local (see Linear SHA-5).',
  )
}

// Single shared browser client. Auth session persists in localStorage by default,
// so a signed-in device stays signed in across reloads (used from SHA-6 onward).
export const supabase = createClient(url, key)

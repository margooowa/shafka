import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../data/supabase'

/**
 * Tracks the Supabase auth session. Offline-first: the initial read is
 * getSession() (localStorage, no network), so an already-signed-in device
 * opens fine with no signal. onAuthStateChange keeps it live — including the
 * moment a magic-link redirect lands back in the app.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, email: session?.user.email ?? null, loading }
}

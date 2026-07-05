import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { onSyncRequest } from './syncBus'
import { pushChanges } from './sync'

// Drives push sync while signed in: on sign-in, on every local mutation
// (via the sync bus), and when the network comes back. A running/pending
// guard coalesces bursts (e.g. add item + photo fire several signals) into
// at most one in-flight push plus one trailing run.
export function useCloudSync(): void {
  const { session } = useAuth()

  useEffect(() => {
    if (!session) return
    let cancelled = false
    let running = false
    let pending = false
    let debounce: ReturnType<typeof setTimeout> | undefined

    const run = async () => {
      if (running) {
        pending = true
        return
      }
      running = true
      try {
        await pushChanges()
      } catch (e) {
        // Left in place on failure (watermark not advanced) → retried later.
        console.warn('[shafka] push sync failed, will retry', e)
      }
      running = false
      if (!cancelled && pending) {
        pending = false
        void run()
      }
    }

    const schedule = () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => void run(), 300)
    }

    const off = onSyncRequest(schedule)
    const onOnline = () => void run()
    window.addEventListener('online', onOnline)
    void run() // initial reconcile on sign-in

    return () => {
      cancelled = true
      clearTimeout(debounce)
      off()
      window.removeEventListener('online', onOnline)
    }
  }, [session])
}

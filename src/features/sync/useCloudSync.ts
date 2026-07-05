import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { onSyncRequest } from './syncBus'
import { pullChanges, pushChanges } from './sync'

// Drives sync while signed in:
//  • pull + push on sign-in, on tab focus, and on reconnect (bring the latest
//    from other devices down, then send anything local up)
//  • push on every local mutation (via the sync bus), debounced
// Local Dexie stays the source of truth the UI reads from (offline-first).
export function useCloudSync(): void {
  const { session } = useAuth()

  useEffect(() => {
    if (!session) return
    let cancelled = false
    let running = false
    let rerun = false
    let wantPull = false
    let debounce: ReturnType<typeof setTimeout> | undefined

    const cycle = async () => {
      if (running) {
        rerun = true
        return
      }
      running = true
      do {
        rerun = false
        const pull = wantPull
        wantPull = false
        try {
          if (pull) {
            const pulled = await pullChanges()
            if (import.meta.env.DEV) console.info('[shafka] pull result:', pulled)
          }
          const pushed = await pushChanges()
          if (import.meta.env.DEV) console.info('[shafka] push result:', pushed)
        } catch (e) {
          // Watermarks not advanced on failure → retried on the next trigger.
          console.warn('[shafka] sync failed, will retry', e)
        }
      } while (rerun && !cancelled)
      running = false
    }

    const triggerPush = () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => void cycle(), 300)
    }
    const triggerPull = () => {
      wantPull = true
      void cycle()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') triggerPull()
    }

    const off = onSyncRequest(triggerPush)
    window.addEventListener('online', triggerPull)
    document.addEventListener('visibilitychange', onVisible)
    triggerPull() // initial reconcile on sign-in: pull then push

    return () => {
      cancelled = true
      clearTimeout(debounce)
      off()
      window.removeEventListener('online', triggerPull)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [session])
}

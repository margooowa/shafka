import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/unbounded/500.css'
import '@fontsource/unbounded/600.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/600.css'
import './index.css'
import { App } from './app/App'
import { supabase } from './data/supabase'

// SHA-5 boot check: confirm the Supabase client constructs with env config
// loaded. Local-only call (no network, no tables yet) — sync lands in SHA-8+.
if (import.meta.env.DEV) {
  void supabase.auth.getSession().then(() => {
    console.info('[shafka] Supabase client ready:', import.meta.env.VITE_SUPABASE_URL)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { useState } from 'react'
import { LogOut, Mail } from 'lucide-react'
import { supabase } from '../../data/supabase'
import { CARD_BORDER, CHIP_BG, MUTED } from '../../app/theme'
import { Field, Sheet } from '../../ui/Sheet'

/**
 * Email magic-link sign-in (SHA-6). No password: Supabase emails a one-tap
 * link that redirects back to the app already authenticated. Same email =
 * same account on every device — the identity that owns the synced wardrobe.
 */
export function AuthSheet({
  accent,
  email,
  onClose,
  onDone,
}: {
  accent: string
  email: string | null
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const sendLink = async () => {
    const addr = value.trim()
    if (!addr) return
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      setSent(true)
    } catch {
      setError('Не вдалося надіслати лист — перевір адресу та зʼєднання')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    setBusy(true)
    await supabase.auth.signOut()
    setBusy(false)
    onDone('Ви вийшли з облікового запису')
  }

  // Signed in — show account + sign out
  if (email) {
    return (
      <Sheet onClose={onClose} title="Обліковий запис" accent={accent}>
        <div className="rounded-2xl p-4 text-[15px]" style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}>
          <p className="text-sm" style={{ color: MUTED }}>
            Ви увійшли як
          </p>
          <p className="font-semibold break-all">{email}</p>
        </div>
        <p className="text-xs" style={{ color: MUTED }}>
          Ваша шафка синхронізується між усіма пристроями з цим входом.
        </p>
        <button
          onClick={() => void signOut()}
          disabled={busy}
          className="w-full rounded-2xl py-3.5 font-medium text-[15px] flex items-center justify-center gap-2"
          style={{ background: CHIP_BG }}
        >
          <LogOut size={18} />
          Вийти
        </button>
      </Sheet>
    )
  }

  // Link sent — check your email
  if (sent) {
    return (
      <Sheet onClose={onClose} title="Перевірте пошту" accent={accent}>
        <div className="rounded-2xl p-4 text-[15px] space-y-1" style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}>
          <p>
            Посилання для входу надіслано на <b className="break-all">{value.trim()}</b>.
          </p>
          <p className="text-sm" style={{ color: MUTED }}>
            Відкрийте лист на цьому пристрої й натисніть кнопку — ви увійдете автоматично.
          </p>
        </div>
      </Sheet>
    )
  }

  // Signed out — email form
  return (
    <Sheet onClose={onClose} title="Вхід" accent={accent}>
      <p className="text-[15px]" style={{ color: MUTED }}>
        Увійдіть, щоб синхронізувати шафку між пристроями. Пароль не потрібен — надішлемо посилання на пошту.
      </p>
      <Field label="Електронна пошта">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
          style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
        />
      </Field>
      <button
        onClick={() => void sendLink()}
        disabled={busy || !value.trim()}
        className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px] flex items-center justify-center gap-2"
        style={{ background: accent, opacity: busy || !value.trim() ? 0.6 : 1 }}
      >
        <Mail size={18} />
        {busy ? 'Надсилаю…' : 'Надіслати посилання'}
      </button>
      {error && (
        <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
          {error}
        </p>
      )}
    </Sheet>
  )
}

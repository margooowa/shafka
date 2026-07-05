import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../../data/supabase'
import { CARD_BORDER, CHIP_BG, MUTED } from '../../app/theme'
import { Field, Sheet } from '../../ui/Sheet'

/**
 * Email + password sign-in (SHA-14). Works on every device with no emailed
 * link/code — sidesteps the mail-app in-app-browser problem on phones. A user
 * signed in on one device sets a password here; other devices log in with it.
 * Emailed 6-digit code is kept as a fallback (e.g. first sign-in / lost password).
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
  const [value, setValue] = useState('') // email
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const inputStyle = { background: '#fff', border: `1px solid ${CARD_BORDER}` }

  const signIn = async () => {
    const addr = value.trim()
    if (!addr || password.length < 6) return
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: addr, password })
      if (error) throw error
      onDone('Ви увійшли ✓')
    } catch {
      setError('Невірний email або пароль. Якщо ви ще не створили пароль — встановіть його на пристрої, де вже увійшли.')
    } finally {
      setBusy(false)
    }
  }

  const sendCode = async () => {
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
      setError('Не вдалося надіслати код — перевір адресу та зʼєднання')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async () => {
    const token = code.trim()
    if (token.length < 6) return
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.auth.verifyOtp({ email: value.trim(), token, type: 'email' })
      if (error) throw error
      onDone('Ви увійшли ✓')
    } catch {
      setError('Невірний або протермінований код')
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async () => {
    if (password.length < 6) {
      setError('Пароль має містити щонайменше 6 символів')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword('')
      setOk('Пароль збережено. Тепер входьте ним на інших пристроях.')
    } catch {
      setError('Не вдалося зберегти пароль')
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

  // ── Signed in — account + set password + sign out ──────────────────────
  if (email) {
    return (
      <Sheet onClose={onClose} title="Обліковий запис" accent={accent}>
        <div className="rounded-2xl p-4 text-[15px]" style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}>
          <p className="text-sm" style={{ color: MUTED }}>
            Ви увійшли як
          </p>
          <p className="font-semibold break-all">{email}</p>
        </div>

        <Field label="Пароль для входу на інших пристроях">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Мінімум 6 символів"
            className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </Field>
        <button
          onClick={() => void savePassword()}
          disabled={busy || password.length < 6}
          className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px]"
          style={{ background: accent, opacity: busy || password.length < 6 ? 0.6 : 1 }}
        >
          {busy ? 'Зберігаю…' : 'Зберегти пароль'}
        </button>
        <p className="text-xs" style={{ color: MUTED }}>
          Встановіть пароль тут, потім на телефоні входьте цим email і паролем — шафка синхронізується.
        </p>
        {ok && (
          <p className="text-sm text-center font-medium" style={{ color: accent }}>
            {ok}
          </p>
        )}

        <button
          onClick={() => void signOut()}
          disabled={busy}
          className="w-full rounded-2xl py-3.5 font-medium text-[15px] flex items-center justify-center gap-2"
          style={{ background: CHIP_BG }}
        >
          <LogOut size={18} />
          Вийти
        </button>
        {error && (
          <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
            {error}
          </p>
        )}
      </Sheet>
    )
  }

  // ── Fallback: emailed 6-digit code ─────────────────────────────────────
  if (sent) {
    return (
      <Sheet onClose={onClose} title="Введіть код" accent={accent}>
        <div className="rounded-2xl p-4 text-[15px] space-y-1" style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}>
          <p>
            Ми надіслали код на <b className="break-all">{value.trim()}</b>.
          </p>
          <p className="text-sm" style={{ color: MUTED }}>
            Введіть <b>6-значний код</b> із листа.
          </p>
        </div>
        <Field label="Код із листа">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-2xl px-4 py-3 text-[17px] tracking-[0.3em] text-center outline-none"
            style={inputStyle}
          />
        </Field>
        <button
          onClick={() => void verifyCode()}
          disabled={busy || code.trim().length < 6}
          className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px]"
          style={{ background: accent, opacity: busy || code.trim().length < 6 ? 0.6 : 1 }}
        >
          {busy ? 'Перевіряю…' : 'Увійти'}
        </button>
        <button onClick={() => setSent(false)} disabled={busy} className="w-full text-sm py-1" style={{ color: MUTED }}>
          Назад
        </button>
        {error && (
          <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
            {error}
          </p>
        )}
      </Sheet>
    )
  }

  // ── Signed out — email + password ──────────────────────────────────────
  return (
    <Sheet onClose={onClose} title="Вхід" accent={accent}>
      <p className="text-[15px]" style={{ color: MUTED }}>
        Увійдіть, щоб синхронізувати шафку між пристроями.
      </p>
      <Field label="Пошта">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
      </Field>
      <Field label="Пароль">
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ваш пароль"
          className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
      </Field>
      <button
        onClick={() => void signIn()}
        disabled={busy || !value.trim() || password.length < 6}
        className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px]"
        style={{ background: accent, opacity: busy || !value.trim() || password.length < 6 ? 0.6 : 1 }}
      >
        {busy ? 'Входжу…' : 'Увійти'}
      </button>

      <div className="text-center text-xs" style={{ color: MUTED }}>
        або
      </div>
      <button
        onClick={() => void sendCode()}
        disabled={busy || !value.trim()}
        className="w-full rounded-2xl py-3 font-medium text-[15px]"
        style={{ background: CHIP_BG, opacity: busy || !value.trim() ? 0.6 : 1 }}
      >
        Надіслати код на пошту
      </button>
      {error && (
        <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
          {error}
        </p>
      )}
    </Sheet>
  )
}

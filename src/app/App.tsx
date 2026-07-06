import { useEffect, useRef, useState } from 'react'
import { Archive, Plus, ScanLine, Shirt, UserRound } from 'lucide-react'
import { CHILDREN, SECTIONS, SECTION_ORDER, type ChildId, type SectionSlug } from '../data/catalog'
import { ensurePersistentStorage } from '../data/persistence'
import { INK, CARD_BORDER, MUTED } from './theme'
import { PillChip } from '../ui/chips'
import { DebugPanel } from './DebugPanel'
import { ItemFormSheet } from '../features/item/ItemFormSheet'
import { DetailSheet } from '../features/item/DetailSheet'
import { Storefront } from '../features/wardrobe/Storefront'
import { BackupSheet } from '../features/backup/BackupSheet'
import { AuthSheet } from '../features/auth/AuthSheet'
import { useAuth } from '../features/auth/useAuth'
import { useCloudSync } from '../features/sync/useCloudSync'
import { recognizeScreenshot, RecognizeError, type RecognizedItem } from '../features/ai/recognize'
import { AiReviewSheet } from '../features/ai/AiReviewSheet'

export function App() {
  const [child, setChild] = useState<ChildId>('daughter')
  const [section, setSection] = useState<SectionSlug>('clothes')
  const [showAdd, setShowAdd] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const { email } = useAuth()
  useCloudSync()
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // AI recognition (Phase 2): screenshot → detected items → review sheet.
  const aiFileRef = useRef<HTMLInputElement>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiItems, setAiItems] = useState<RecognizedItem[] | null>(null)

  useEffect(() => {
    void ensurePersistentStorage()
  }, [])

  const accent = CHILDREN[child].accent

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  const handleAiFile = async (file: File | undefined) => {
    if (!file || aiBusy) return
    setAiBusy(true)
    try {
      const items = await recognizeScreenshot(file)
      if (!items.length) {
        showToast('Нічого не розпізнано')
        return
      }
      setAiItems(items)
    } catch (e) {
      showToast(
        e instanceof RecognizeError && e.message === 'no-key'
          ? 'AI ще не налаштовано'
          : 'Не вдалося розпізнати — спробуйте ще раз',
      )
    } finally {
      setAiBusy(false)
    }
  }

  return (
    // Roomy on desktop (shop-like), centred. The grid auto-fills columns to this
    // width so previews stay crisp; the child switcher stays a comfortable width.
    <div className="min-h-screen pb-28 mx-auto max-w-[960px]">
      {/* Шапка */}
      <header className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Shirt size={22} strokeWidth={2.2} style={{ color: accent }} />
          <h1 className="font-display" style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' }}>
            Шафка
          </h1>
          <input
            ref={aiFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleAiFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button
            onClick={() => aiFileRef.current?.click()}
            disabled={aiBusy}
            className="ml-auto p-2 rounded-full"
            aria-label="Розпізнати зі скріншота"
            style={{ color: accent }}
          >
            <ScanLine size={20} />
          </button>
          <button
            onClick={() => setShowAuth(true)}
            className="p-2 rounded-full"
            aria-label="Обліковий запис"
            style={{ color: email ? accent : MUTED }}
          >
            <UserRound size={20} />
          </button>
          <button
            onClick={() => setShowBackup(true)}
            className="p-2 rounded-full"
            aria-label="Резервна копія"
            style={{ color: MUTED }}
          >
            <Archive size={20} />
          </button>
        </div>

        {/* Перемикач дітей */}
        <div className="flex gap-2 mt-4 max-w-[560px]">
          {Object.values(CHILDREN).map((c) => {
            const active = child === c.id
            return (
              <button
                key={c.id}
                onClick={() => setChild(c.id)}
                className="flex-1 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-transform active:scale-[0.97]"
                style={{
                  background: active ? c.soft : '#fff',
                  border: `2px solid ${active ? c.accent : CARD_BORDER}`,
                }}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-left leading-tight">
                  <span className="block font-semibold text-[15px]" style={{ color: active ? c.accent : INK }}>
                    {c.label}
                  </span>
                  <span className="block text-xs" style={{ color: MUTED }}>
                    {c.age}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Секції */}
        <div className="flex gap-2 mt-3">
          {SECTION_ORDER.map((slug) => (
            <PillChip key={slug} active={section === slug} accent={accent} onClick={() => setSection(slug)}>
              {SECTIONS[slug].label}
            </PillChip>
          ))}
        </div>
      </header>

      {/* Вітрина */}
      <main className="px-4 pt-2">
        <Storefront child={child} section={section} onItemClick={(it) => setDetailId(it.id)} />
      </main>

      {/* Кнопка додавання */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
        style={{ background: accent, color: '#fff', right: 'max(1.25rem, calc(50% - 460px))' }}
        aria-label="Додати річ"
      >
        <Plus size={28} />
      </button>

      {showAdd && (
        <ItemFormSheet
          defaultChild={child}
          defaultSection={section}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            showToast('Додано в шафку ✓')
          }}
        />
      )}

      {aiItems && (
        <AiReviewSheet
          items={aiItems}
          defaultChild={child}
          onClose={() => setAiItems(null)}
          onDone={(n) => {
            setAiItems(null)
            showToast(`Додано ${n} ✓`)
          }}
        />
      )}

      {showBackup && (
        <BackupSheet
          accent={accent}
          onClose={() => setShowBackup(false)}
          onDone={(msg) => {
            setShowBackup(false)
            showToast(msg)
          }}
        />
      )}

      {showAuth && (
        <AuthSheet
          accent={accent}
          email={email}
          onClose={() => setShowAuth(false)}
          onDone={(msg) => {
            setShowAuth(false)
            showToast(msg)
          }}
        />
      )}

      {detailId && (
        <DetailSheet
          itemId={detailId}
          onClose={() => setDetailId(null)}
          onDeleted={() => {
            setDetailId(null)
            showToast('Видалено')
          }}
          onEdited={() => showToast('Збережено ✓')}
        />
      )}

      {import.meta.env.DEV && <DebugPanel child={child} section={section} />}

      {aiBusy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(30,26,20,0.45)' }}>
          <div
            className="rounded-2xl px-5 py-4 text-[15px] font-medium shadow-lg flex items-center gap-3"
            style={{ background: '#fff', color: INK }}
          >
            <ScanLine size={20} className="animate-pulse" style={{ color: accent }} />
            Розпізнаю зі скріншота…
          </div>
        </div>
      )}

      {/* Тост */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white shadow-lg"
          style={{ background: INK }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

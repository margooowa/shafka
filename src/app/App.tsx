import { useEffect, useRef, useState } from 'react'
import { Plus, Shirt } from 'lucide-react'
import { CHILDREN, SECTIONS, SECTION_ORDER, type ChildId, type SectionSlug } from '../data/catalog'
import { ensurePersistentStorage } from '../data/persistence'
import { INK, CARD_BORDER, MUTED } from './theme'
import { PillChip } from '../ui/chips'
import { DebugPanel } from './DebugPanel'
import { ItemFormSheet } from '../features/item/ItemFormSheet'
import { DetailSheet } from '../features/item/DetailSheet'
import { Storefront } from '../features/wardrobe/Storefront'

export function App() {
  const [child, setChild] = useState<ChildId>('daughter')
  const [section, setSection] = useState<SectionSlug>('clothes')
  const [showAdd, setShowAdd] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    void ensurePersistentStorage()
  }, [])

  const accent = CHILDREN[child].accent

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Шапка */}
      <header className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Shirt size={22} strokeWidth={2.2} style={{ color: accent }} />
          <h1 className="font-display" style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' }}>
            Шафка
          </h1>
        </div>

        {/* Перемикач дітей */}
        <div className="flex gap-2 mt-4">
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
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
        style={{ background: accent, color: '#fff' }}
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

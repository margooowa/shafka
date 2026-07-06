import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import {
  CHILDREN,
  SECTIONS,
  sizeLabel,
  type ChildId,
  type SectionSlug,
} from '../../data/catalog'
import { createItem, writeErrorMessage } from '../sync/writes'
import { CARD_BORDER, MUTED } from '../../app/theme'
import { Sheet } from '../../ui/Sheet'
import { PillChip, TagChip } from '../../ui/chips'
import type { RecognizedItem } from './recognize'

interface Row {
  item: RecognizedItem
  section: SectionSlug
  category: string
  size: string
  include: boolean
}

const validSection = (s: string): SectionSlug => (SECTIONS[s as SectionSlug] ? (s as SectionSlug) : 'clothes')

function buildRow(item: RecognizedItem): Row {
  const section = validSection(item.section)
  const def = SECTIONS[section]
  const category = def.categories.some((c) => c.slug === item.category)
    ? item.category
    : def.categories.length === 1
      ? def.categories[0].slug
      : ''
  const size = def.sizes.includes(item.size) ? item.size : ''
  return { item, section, category, size, include: true }
}

// Review sheet for AI-recognized items (Phase 2, multi-item). Each detected
// item shows its cropped photo + guessed type; the user confirms type/size,
// toggles which to add, and saves them all in one go (cloud-first).
export function AiReviewSheet({
  items,
  defaultChild,
  onClose,
  onDone,
}: {
  items: RecognizedItem[]
  defaultChild: ChildId
  onClose: () => void
  onDone: (added: number) => void
}) {
  const [child, setChild] = useState<ChildId>(defaultChild)
  const [rows, setRows] = useState<Row[]>(() => items.map(buildRow))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const urls = useMemo(() => items.map((it) => URL.createObjectURL(it.photo.full)), [items])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  const accent = CHILDREN[child].accent
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const ready = rows.filter((r) => r.include && r.category && r.size)

  const add = async () => {
    if (!ready.length || busy) return
    setBusy(true)
    setError('')
    try {
      for (const r of ready) {
        await createItem(
          {
            childId: child,
            section: r.section,
            category: r.category,
            size: r.size,
            season: r.item.season || null,
            color: r.item.color || null,
            note: r.item.note || null,
            status: 'new_with_tag',
            tags: [],
          },
          r.item.photo,
        )
      }
      onDone(ready.length)
    } catch (e) {
      setError(writeErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const catLabel = (section: SectionSlug, slug: string) =>
    SECTIONS[section].categories.find((c) => c.slug === slug)?.label

  return (
    <Sheet onClose={onClose} title={`Розпізнано: ${items.length}`} accent={accent}>
      <div className="flex gap-2">
        {Object.values(CHILDREN).map((c) => (
          <PillChip key={c.id} active={child === c.id} accent={c.accent} onClick={() => setChild(c.id)}>
            {c.emoji} {c.label}
          </PillChip>
        ))}
      </div>

      {rows.map((r, i) => {
        const def = SECTIONS[r.section]
        const showCats = def.categories.length > 1
        return (
          <div key={i} className="rounded-2xl p-3 space-y-2" style={{ background: '#fff', border: `1px solid ${CARD_BORDER}`, opacity: r.include ? 1 : 0.55 }}>
            <div className="flex items-center gap-3">
              <img src={urls[i]} alt="" className="w-16 h-16 rounded-xl object-cover" style={{ border: `1px solid ${CARD_BORDER}` }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px] truncate">
                  {catLabel(r.section, r.category) ?? r.item.label ?? 'Річ'}
                </p>
                <p className="text-xs truncate" style={{ color: MUTED }}>
                  {[r.item.color, r.item.season].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <button onClick={() => setRow(i, { include: !r.include })} aria-label="Додати цю річ" style={{ color: r.include ? accent : MUTED }}>
                {r.include ? <CheckCircle2 size={26} /> : <Circle size={26} />}
              </button>
            </div>

            {r.include && showCats && (
              <div className="flex gap-1.5 flex-wrap">
                {def.categories.map((c) => (
                  <PillChip key={c.slug} active={r.category === c.slug} accent={accent} onClick={() => setRow(i, { category: c.slug })}>
                    {c.label}
                  </PillChip>
                ))}
              </div>
            )}

            {r.include && (
              <div className="flex gap-1.5 flex-wrap">
                {def.sizes.map((s) => (
                  <TagChip key={s} active={r.size === s} accent={accent} onClick={() => setRow(i, { size: s })}>
                    {sizeLabel(def, s)}
                  </TagChip>
                ))}
              </div>
            )}
            {r.include && !r.size && (
              <p className="text-xs" style={{ color: MUTED }}>
                Обери розмір, щоб додати
              </p>
            )}
          </div>
        )
      })}

      <button
        onClick={() => void add()}
        disabled={!ready.length || busy}
        className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px]"
        style={{ background: ready.length ? accent : '#CFC9BD' }}
      >
        {busy ? 'Додаю…' : ready.length ? `Додати ${ready.length}` : 'Обери розмір'}
      </button>
      {error && (
        <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
          {error}
        </p>
      )}
    </Sheet>
  )
}

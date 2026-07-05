import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Tag } from 'lucide-react'
import { db, type Item } from '../../data/db'
import { CHILDREN, SECTIONS, sizeLabel, type ChildId, type SectionSlug } from '../../data/catalog'
import { CARD_BORDER, MUTED } from '../../app/theme'
import { PillChip, TagChip } from '../../ui/chips'
import { PhotoView } from '../../ui/PhotoView'

// Storefront per PLAN §4.2 and reference/shafka.jsx: swing-tag size chips +
// category pills, both with live counters, only for non-empty values.
// Size and category are independent AND-filters that BOTH persist (pick Штани,
// then browse 110 → 116 without losing Штани). Each facet's counts reflect the
// other's current selection, so a chip always answers "how many will I see".
export function Storefront({
  child,
  section,
  onItemClick,
}: {
  child: ChildId
  section: SectionSlug
  onItemClick: (item: Item) => void
}) {
  const [sizeFilter, setSizeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    setSizeFilter('all')
    setCatFilter('all')
  }, [child, section])

  const scoped = useLiveQuery(
    () => db.items.where('[childId+section]').equals([child, section]).sortBy('createdAt'),
    [child, section],
  )

  const def = SECTIONS[section]
  const accent = CHILDREN[child].accent

  // Each facet is counted against the OTHER facet's current selection, so the
  // size chips reflect the chosen category and vice-versa.
  const catScoped = useMemo(
    () => (catFilter === 'all' ? (scoped ?? []) : (scoped ?? []).filter((it) => it.category === catFilter)),
    [scoped, catFilter],
  )
  const sizeScoped = useMemo(
    () => (sizeFilter === 'all' ? (scoped ?? []) : (scoped ?? []).filter((it) => it.size === sizeFilter)),
    [scoped, sizeFilter],
  )

  const sizesPresent = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of catScoped) counts.set(it.size, (counts.get(it.size) ?? 0) + 1)
    return def.sizes.filter((s) => counts.has(s)).map((s) => ({ size: s, count: counts.get(s)! }))
  }, [catScoped, def])

  const catsPresent = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of sizeScoped) counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
    return def.categories.filter((c) => counts.has(c.slug)).map((c) => ({ ...c, count: counts.get(c.slug)! }))
  }, [sizeScoped, def])

  const effectiveSize = sizesPresent.some((s) => s.size === sizeFilter) ? sizeFilter : 'all'
  const effectiveCat = catsPresent.some((c) => c.slug === catFilter) ? catFilter : 'all'

  const visible = useMemo(() => {
    let its = scoped ?? []
    if (effectiveSize !== 'all') its = its.filter((it) => it.size === effectiveSize)
    if (effectiveCat !== 'all') its = its.filter((it) => it.category === effectiveCat)
    return its
  }, [scoped, effectiveSize, effectiveCat])

  if (!scoped) return null

  if (scoped.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">👕</div>
        <p className="font-medium">Тут поки порожньо</p>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Натисни «+», щоб додати першу річ
        </p>
      </div>
    )
  }

  const catLabel = (slug: string) => def.categories.find((c) => c.slug === slug)?.label ?? slug

  return (
    <div>
      {/* Розміри-бірочки */}
      <div className="flex gap-2 -mx-4 px-4 py-1 overflow-x-auto no-scrollbar">
        <TagChip active={effectiveSize === 'all'} accent={accent} onClick={() => setSizeFilter('all')}>
          Всі · {catScoped.length}
        </TagChip>
        {sizesPresent.map(({ size, count }) => (
          <TagChip key={size} active={effectiveSize === size} accent={accent} onClick={() => setSizeFilter(size)}>
            {sizeLabel(def, size)} · {count}
          </TagChip>
        ))}
      </div>

      {/* Категорії */}
      {catsPresent.length > 1 && (
        <div className="flex gap-2 -mx-4 px-4 py-2 overflow-x-auto no-scrollbar">
          <PillChip active={effectiveCat === 'all'} accent={accent} onClick={() => setCatFilter('all')}>
            Всі
          </PillChip>
          {catsPresent.map((c) => (
            <PillChip key={c.slug} active={effectiveCat === c.slug} accent={accent} onClick={() => setCatFilter(c.slug)}>
              {c.label} · {c.count}
            </PillChip>
          ))}
        </div>
      )}

      {/* Сітка-вітрина */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {visible.map((it) => (
          <button key={it.id} onClick={() => onItemClick(it)} className="text-left transition-transform active:scale-[0.97]">
            <div
              className="relative aspect-square rounded-xl overflow-hidden"
              style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
            >
              <PhotoView photoId={it.photoId} alt={catLabel(it.category)} className="w-full h-full object-cover text-3xl" />
              {it.status === 'new_with_tag' && (
                <span className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: '#FFF6DE' }}>
                  <Tag size={12} style={{ color: '#B8860B' }} />
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-medium truncate">
              {sizeLabel(def, it.size)} · {catLabel(it.category)}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

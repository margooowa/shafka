import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Grid2x2, Grid3x3, LayoutGrid, Tag } from 'lucide-react'
import { db, type Item } from '../../data/db'
import { CHILDREN, SEASONS, SECTIONS, sizeLabel, type ChildId, type SectionSlug } from '../../data/catalog'
import { CARD_BORDER, CHIP_BG, MUTED } from '../../app/theme'
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
  const [seasonFilter, setSeasonFilter] = useState('all')

  // Preview size (Zara-style): the grid auto-fills columns to the width, so a
  // wide desktop shows many crisp cells and a phone shows a few. The toggle sets
  // the min cell size — big / medium / small. Remembered.
  const [cellMin, setCellMin] = useState<number>(() => {
    const v = Number(localStorage.getItem('shafka.cellMin'))
    return v === 170 || v === 90 ? v : 120
  })
  useEffect(() => {
    localStorage.setItem('shafka.cellMin', String(cellMin))
  }, [cellMin])

  useEffect(() => {
    setSizeFilter('all')
    setCatFilter('all')
    setSeasonFilter('all')
  }, [child, section])

  const scoped = useLiveQuery(
    () => db.items.where('[childId+section]').equals([child, section]).sortBy('createdAt'),
    [child, section],
  )

  const def = SECTIONS[section]
  const accent = CHILDREN[child].accent

  // Three independent AND-facets (size · category · season). Each facet's chips
  // are counted against the OTHER two facets' current selections, so a chip
  // always says how many items you'll see and no combination is ever empty.
  const sizesPresent = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of scoped ?? [])
      if ((catFilter === 'all' || it.category === catFilter) && (seasonFilter === 'all' || it.season === seasonFilter))
        counts.set(it.size, (counts.get(it.size) ?? 0) + 1)
    return def.sizes.filter((s) => counts.has(s)).map((s) => ({ size: s, count: counts.get(s)! }))
  }, [scoped, catFilter, seasonFilter, def])

  const catsPresent = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of scoped ?? [])
      if ((sizeFilter === 'all' || it.size === sizeFilter) && (seasonFilter === 'all' || it.season === seasonFilter))
        counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
    return def.categories.filter((c) => counts.has(c.slug)).map((c) => ({ ...c, count: counts.get(c.slug)! }))
  }, [scoped, sizeFilter, seasonFilter, def])

  const seasonsPresent = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of scoped ?? [])
      if (it.season && (sizeFilter === 'all' || it.size === sizeFilter) && (catFilter === 'all' || it.category === catFilter))
        counts.set(it.season, (counts.get(it.season) ?? 0) + 1)
    return SEASONS.filter((s) => counts.has(s.slug)).map((s) => ({ ...s, count: counts.get(s.slug)! }))
  }, [scoped, sizeFilter, catFilter])

  const effectiveSize = sizesPresent.some((s) => s.size === sizeFilter) ? sizeFilter : 'all'
  const effectiveCat = catsPresent.some((c) => c.slug === catFilter) ? catFilter : 'all'
  const effectiveSeason = seasonsPresent.some((s) => s.slug === seasonFilter) ? seasonFilter : 'all'
  const sizeAllCount = sizesPresent.reduce((n, s) => n + s.count, 0)

  const visible = useMemo(
    () =>
      (scoped ?? []).filter(
        (it) =>
          (effectiveSize === 'all' || it.size === effectiveSize) &&
          (effectiveCat === 'all' || it.category === effectiveCat) &&
          (effectiveSeason === 'all' || it.season === effectiveSeason),
      ),
    [scoped, effectiveSize, effectiveCat, effectiveSeason],
  )

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
          Всі · {sizeAllCount}
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
            Всі типи
          </PillChip>
          {catsPresent.map((c) => (
            <PillChip key={c.slug} active={effectiveCat === c.slug} accent={accent} onClick={() => setCatFilter(c.slug)}>
              {c.label} · {c.count}
            </PillChip>
          ))}
        </div>
      )}

      {/* Сезони — show as soon as any item has a season (many items leave it blank) */}
      {seasonsPresent.length > 0 && (
        <div className="flex gap-2 -mx-4 px-4 pb-1 overflow-x-auto no-scrollbar">
          <PillChip active={effectiveSeason === 'all'} accent={accent} onClick={() => setSeasonFilter('all')}>
            Всі сезони
          </PillChip>
          {seasonsPresent.map((s) => (
            <PillChip key={s.slug} active={effectiveSeason === s.slug} accent={accent} onClick={() => setSeasonFilter(s.slug)}>
              {s.label} · {s.count}
            </PillChip>
          ))}
        </div>
      )}

      {/* Перемикач розміру прев'ю */}
      <div className="flex justify-end gap-1 pt-2">
        {([
          [170, Grid2x2],
          [120, Grid3x3],
          [90, LayoutGrid],
        ] as const).map(([min, Icon]) => (
          <button
            key={min}
            onClick={() => setCellMin(min)}
            aria-label="Розмір прев'ю"
            className="p-1.5 rounded-lg transition-transform active:scale-90"
            style={{ background: cellMin === min ? accent : CHIP_BG, color: cellMin === min ? '#fff' : MUTED }}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Сітка-вітрина — авто-заповнення колонок за шириною екрана */}
      <div className="grid gap-2 pt-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cellMin}px, 1fr))` }}>
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

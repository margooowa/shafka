import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db'
import { SEASONS, SECTIONS, sizeLabel, type ChildId, type SectionSlug } from '../../data/catalog'
import { CARD_BORDER, MUTED } from '../../app/theme'
import { PhotoView } from '../../ui/PhotoView'

// Plain list for step 3 — replaced by the storefront grid + filters in step 5.
export function ItemList({ child, section }: { child: ChildId; section: SectionSlug }) {
  const items = useLiveQuery(
    () => db.items.where('[childId+section]').equals([child, section]).sortBy('createdAt'),
    [child, section],
  )

  if (!items) return null
  if (items.length === 0) {
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

  const def = SECTIONS[section]
  const catLabel = (slug: string) => def.categories.find((c) => c.slug === slug)?.label ?? slug
  const seasonLabel = (slug: string | null) => SEASONS.find((s) => s.slug === slug)?.label

  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const sub = [seasonLabel(it.season), it.color].filter(Boolean).join(' · ')
        return (
          <li
            key={it.id}
            className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <PhotoView
              photoId={it.photoId}
              alt={catLabel(it.category)}
              className="w-12 h-12 shrink-0 rounded-lg object-cover text-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[15px] truncate">
                {catLabel(it.category)}
                {it.status === 'new_with_tag' && ' 🏷️'}
              </p>
              {sub && (
                <p className="text-xs truncate" style={{ color: MUTED }}>
                  {sub}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold">{sizeLabel(def, it.size)}</span>
          </li>
        )
      })}
    </ul>
  )
}

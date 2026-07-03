import { useLiveQuery } from 'dexie-react-hooks'
import { addItem, db } from '../data/db'
import { SECTIONS, type ChildId, type SectionSlug } from '../data/catalog'
import { MUTED } from './theme'

// Dev-only smoke-test panel for step 2 — replaced by the real add form in step 3.
export function DebugPanel({ child, section }: { child: ChildId; section: SectionSlug }) {
  const persisted = useLiveQuery(async () => (await db.settings.get('persistentStorage'))?.value, [])
  const childrenCount = useLiveQuery(() => db.children.count(), [])
  const scopedCount = useLiveQuery(
    () => db.items.where('[childId+section]').equals([child, section]).count(),
    [child, section],
  )
  const totalCount = useLiveQuery(() => db.items.count(), [])

  const addTestItem = async () => {
    const def = SECTIONS[section]
    const category = def.categories[Math.floor(Math.random() * def.categories.length)].slug
    const size = def.sizes[Math.floor(Math.random() * def.sizes.length)]
    await addItem({ childId: child, section, category, size })
  }

  return (
    <div
      className="fixed bottom-6 left-4 rounded-xl px-3 py-2 text-xs space-y-1 shadow-lg"
      style={{ background: '#fff', border: '1px dashed #C9C2B4', color: MUTED }}
    >
      <p className="font-semibold" style={{ color: '#8A6D1A' }}>
        DEV · крок 2
      </p>
      <p>💾 persist: {persisted === undefined ? '…' : persisted ? 'так' : 'ні'}</p>
      <p>
        👨‍👩‍👧‍👦 діти: {childrenCount ?? '…'} · речі тут: {scopedCount ?? '…'} · всього: {totalCount ?? '…'}
      </p>
      <div className="flex gap-2 pt-1">
        <button className="rounded-md px-2 py-1 font-medium" style={{ background: '#EFECE5', color: '#2A2622' }} onClick={() => void addTestItem()}>
          ➕ тестова річ
        </button>
        <button className="rounded-md px-2 py-1" style={{ background: '#EFECE5' }} onClick={() => void db.items.clear()}>
          🗑 очистити
        </button>
      </div>
    </div>
  )
}

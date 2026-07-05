import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Trash2 } from 'lucide-react'
import { db } from '../../data/db'
import { editItem, removeItem, writeErrorMessage } from '../sync/writes'
import { CHILDREN, SEASONS, SECTIONS, STATUSES, sizeLabel } from '../../data/catalog'
import { CARD_BORDER, CHIP_BG, MUTED } from '../../app/theme'
import { Sheet } from '../../ui/Sheet'
import { PhotoView } from '../../ui/PhotoView'
import { ItemFormSheet } from './ItemFormSheet'

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ color: MUTED }}>{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  )
}

export function DetailSheet({
  itemId,
  onClose,
  onDeleted,
  onEdited,
}: {
  itemId: string
  onClose: () => void
  onDeleted: () => void
  onEdited: () => void
}) {
  const item = useLiveQuery(() => db.items.get(itemId), [itemId])
  const [confirmDel, setConfirmDel] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!item) return null

  const toggleStatus = async () => {
    setBusy(true)
    setErr('')
    try {
      await editItem(item.id, { status: item.status === 'new_with_tag' ? 'wearing' : 'new_with_tag' })
    } catch (e) {
      setErr(writeErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    setBusy(true)
    setErr('')
    try {
      await removeItem(item.id)
      onDeleted()
    } catch (e) {
      setErr(writeErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const c = CHILDREN[item.childId]
  const def = SECTIONS[item.section]
  const catLabel = def.categories.find((cat) => cat.slug === item.category)?.label ?? item.category
  const seasonLabel = SEASONS.find((s) => s.slug === item.season)?.label
  const statusLabel = STATUSES.find((s) => s.slug === item.status)?.label ?? item.status
  const tagLabels = (item.tags ?? [])
    .map((t) => def.tagOptions?.find((o) => o.slug === t)?.label ?? t)
    .join(', ')
  const cardStyle = { background: '#fff', border: `1px solid ${CARD_BORDER}` }

  return (
    <>
      <Sheet onClose={onClose} title={catLabel} accent={c.accent}>
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <PhotoView
            photoId={item.photoId}
            kind="full"
            alt={catLabel}
            className={item.photoId ? 'w-full max-h-80 object-contain' : 'h-40 w-full text-5xl'}
          />
        </div>

        <div className="rounded-2xl p-4 space-y-2 text-[15px]" style={cardStyle}>
          <Row k="Дитина" v={`${c.emoji} ${c.label} (${c.age})`} />
          <Row k="Розмір" v={sizeLabel(def, item.size)} />
          {seasonLabel && <Row k="Сезон" v={seasonLabel} />}
          {item.color && <Row k="Колір" v={item.color} />}
          {tagLabels && <Row k="Теги" v={tagLabels} />}
          <Row k="Статус" v={statusLabel} />
          {item.note && <Row k="Нотатка" v={item.note} />}
        </div>

        <button
          onClick={() => setShowEdit(true)}
          className="w-full rounded-2xl py-3 font-medium text-[15px] flex items-center justify-center gap-2"
          style={{ background: CHIP_BG }}
        >
          <Pencil size={16} /> Редагувати
        </button>

        <button
          onClick={() => void toggleStatus()}
          disabled={busy}
          className="w-full rounded-2xl py-3 font-medium text-[15px]"
          style={{ background: c.soft, color: c.accent }}
        >
          {item.status === 'new_with_tag' ? 'Позначити «вже носить»' : 'Повернути «нове з етикеткою»'}
        </button>

        {confirmDel ? (
          <div className="flex gap-2">
            <button
              onClick={() => void doDelete()}
              disabled={busy}
              className="flex-1 rounded-2xl py-3 font-medium text-white"
              style={{ background: '#C0392B' }}
            >
              {busy ? 'Видаляю…' : 'Так, видалити'}
            </button>
            <button onClick={() => setConfirmDel(false)} className="flex-1 rounded-2xl py-3 font-medium" style={{ background: CHIP_BG }}>
              Скасувати
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            className="w-full rounded-2xl py-3 font-medium flex items-center justify-center gap-2"
            style={{ background: CHIP_BG, color: '#8A3A30' }}
          >
            <Trash2 size={17} /> Видалити річ
          </button>
        )}
        {err && (
          <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
            {err}
          </p>
        )}
      </Sheet>

      {showEdit && (
        <ItemFormSheet
          item={item}
          defaultChild={item.childId}
          defaultSection={item.section}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            onEdited()
          }}
        />
      )}
    </>
  )
}

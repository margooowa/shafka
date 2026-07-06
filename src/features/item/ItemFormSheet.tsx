import { useEffect, useRef, useState } from 'react'
import { Camera, RotateCw } from 'lucide-react'
import {
  CHILDREN,
  SEASONS,
  SECTIONS,
  SECTION_ORDER,
  STATUSES,
  sizeLabel,
  type ChildId,
  type SectionSlug,
} from '../../data/catalog'
import { db, type Item, type ProcessedPhoto } from '../../data/db'
import { createItem, editItem, writeErrorMessage } from '../sync/writes'
import { processPhotoFile, rotatePhoto } from '../photos/compress'
import { MUTED, CARD_BORDER, CHIP_BG, INK } from '../../app/theme'
import { Field, Sheet } from '../../ui/Sheet'
import { PillChip, TagChip } from '../../ui/chips'
import { PhotoView } from '../../ui/PhotoView'

export interface Draft {
  childId: ChildId
  section: SectionSlug
  category: string
  size: string
  season: string
  color: string
  note: string
  status: string
  tags: string[]
}

// One form for three flows: no `item` = add; `item` = edit (prefilled, photo
// swappable); `suggested` + `initialPhoto` = AI pre-fill (add, user reviews).
export function ItemFormSheet({
  item,
  defaultChild,
  defaultSection,
  suggested,
  initialPhoto,
  onClose,
  onSaved,
}: {
  item?: Item
  defaultChild: ChildId
  defaultSection: SectionSlug
  suggested?: Partial<Draft>
  initialPhoto?: ProcessedPhoto | null
  onClose: () => void
  onSaved: (item: Item) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => {
    if (item) {
      return {
        childId: item.childId,
        section: item.section,
        category: item.category,
        size: item.size,
        season: item.season ?? '',
        color: item.color ?? '',
        note: item.note ?? '',
        status: item.status,
        tags: item.tags,
      }
    }
    // AI suggestion (if any) seeds the add form; user can change anything.
    const section = suggested?.section && SECTIONS[suggested.section] ? suggested.section : defaultSection
    return {
      childId: defaultChild,
      section,
      category: suggested?.category ?? (section === 'shoes' ? 'shoes' : ''),
      size: suggested?.size ?? '',
      season: suggested?.season ?? '',
      color: suggested?.color ?? '',
      note: suggested?.note ?? '',
      status: suggested?.status ?? 'new_with_tag',
      tags: suggested?.tags ?? [],
    }
  })
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(initialPhoto ?? null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(undefined)
      return
    }
    const u = URL.createObjectURL(photo.full)
    setPreviewUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photo])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setPhotoBusy(true)
    try {
      setPhoto(await processPhotoFile(file))
    } catch {
      setPhoto(null)
    } finally {
      setPhotoBusy(false)
    }
  }

  // Rotate 90° — the just-added photo, or an existing item's stored photo
  const rotate = async () => {
    if (photoBusy) return
    setPhotoBusy(true)
    try {
      const base = photo?.full ?? (item?.photoId ? (await db.photos.get(item.photoId))?.full : undefined)
      if (base) setPhoto(await rotatePhoto(base))
    } catch {
      /* keep current photo on failure */
    } finally {
      setPhotoBusy(false)
    }
  }

  const accent = CHILDREN[draft.childId].accent
  const sectionDef = SECTIONS[draft.section]
  const showCategories = sectionDef.categories.length > 1

  const setField = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const pickSection = (s: SectionSlug) =>
    setDraft((d) => ({ ...d, section: s, category: s === 'shoes' ? 'shoes' : '', size: '', tags: [] }))

  const toggleTag = (slug: string) =>
    setDraft((d) => ({ ...d, tags: d.tags.includes(slug) ? d.tags.filter((t) => t !== slug) : [...d.tags, slug] }))

  const canSave = Boolean(draft.size && draft.category)

  const save = async () => {
    if (!canSave || busy) return
    setBusy(true)
    setSaveError('')
    try {
      const fields = {
        childId: draft.childId,
        section: draft.section,
        category: draft.category,
        size: draft.size,
        season: draft.season || null,
        color: draft.color.trim() || null,
        note: draft.note.trim() || null,
        status: draft.status,
        tags: draft.tags,
      }
      if (item) {
        await editItem(item.id, fields, photo ?? undefined)
        onSaved({ ...item, ...fields })
      } else {
        onSaved(await createItem(fields, photo ?? undefined))
      }
    } catch (e) {
      // Cloud-first: nothing saved locally if the DB write failed.
      setSaveError(writeErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = { background: '#fff', border: `1.5px solid ${CARD_BORDER}` }

  return (
    <Sheet onClose={onClose} title={item ? 'Редагувати річ' : 'Нова річ'} accent={accent}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ border: '2px dashed #D8D2C6', background: '#fff', height: previewUrl || item?.photoId ? 'auto' : 120 }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Фото речі" className="w-full max-h-64 object-contain" />
        ) : item?.photoId ? (
          <PhotoView photoId={item.photoId} kind="full" alt="Фото речі" className="w-full max-h-64 object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-sm" style={{ color: MUTED }}>
            <Camera size={26} />
            {photoBusy ? 'Стискаю фото…' : 'Додати фото або скріншот'}
          </span>
        )}
      </button>
      {item && (
        <p className="text-xs text-center -mt-2" style={{ color: MUTED }}>
          Торкнись фото, щоб замінити
        </p>
      )}
      {(photo || item?.photoId) && (
        <button
          onClick={() => void rotate()}
          disabled={photoBusy}
          className="w-fit mx-auto flex items-center gap-1.5 text-sm rounded-full px-3.5 py-1.5 transition-transform active:scale-95"
          style={{ background: CHIP_BG, color: INK }}
        >
          <RotateCw size={16} />
          {photoBusy ? 'Обробляю…' : 'Повернути'}
        </button>
      )}

      <Field label="Чия річ">
        <div className="flex gap-2">
          {Object.values(CHILDREN).map((c) => (
            <PillChip key={c.id} active={draft.childId === c.id} accent={c.accent} onClick={() => setField('childId', c.id)}>
              {c.emoji} {c.label}
            </PillChip>
          ))}
        </div>
      </Field>

      <Field label="Секція">
        <div className="flex gap-2 flex-wrap">
          {SECTION_ORDER.map((slug) => (
            <PillChip key={slug} active={draft.section === slug} accent={accent} onClick={() => pickSection(slug)}>
              {SECTIONS[slug].label}
            </PillChip>
          ))}
        </div>
      </Field>

      {showCategories && (
        <Field label="Категорія">
          <div className="flex gap-2 flex-wrap">
            {sectionDef.categories.map((c) => (
              <PillChip key={c.slug} active={draft.category === c.slug} accent={accent} onClick={() => setField('category', c.slug)}>
                {c.label}
              </PillChip>
            ))}
          </div>
        </Field>
      )}

      <Field label="Розмір">
        <div className="flex gap-2 flex-wrap">
          {sectionDef.sizes.map((s) => (
            <TagChip key={s} active={draft.size === s} accent={accent} onClick={() => setField('size', s)}>
              {sizeLabel(sectionDef, s)}
            </TagChip>
          ))}
        </div>
      </Field>

      {sectionDef.tagOptions && (
        <Field label="Теги (необовʼязково)">
          <div className="flex gap-2 flex-wrap">
            {sectionDef.tagOptions.map((t) => (
              <PillChip key={t.slug} active={draft.tags.includes(t.slug)} accent={accent} onClick={() => toggleTag(t.slug)}>
                {t.label}
              </PillChip>
            ))}
          </div>
        </Field>
      )}

      <Field label="Сезон (необовʼязково)">
        <div className="flex gap-2 flex-wrap">
          {SEASONS.map((s) => (
            <PillChip
              key={s.slug}
              active={draft.season === s.slug}
              accent={accent}
              onClick={() => setField('season', draft.season === s.slug ? '' : s.slug)}
            >
              {s.label}
            </PillChip>
          ))}
        </div>
      </Field>

      <Field label="Колір (необовʼязково)">
        <input
          value={draft.color}
          onChange={(e) => setField('color', e.target.value)}
          placeholder="напр. рожевий з квіточками"
          className="w-full rounded-xl px-3.5 py-2.5 text-[15px] outline-none"
          style={inputStyle}
        />
      </Field>

      <Field label="Нотатка (необовʼязково)">
        <input
          value={draft.note}
          onChange={(e) => setField('note', e.target.value)}
          placeholder="напр. подарунок від бабусі"
          className="w-full rounded-xl px-3.5 py-2.5 text-[15px] outline-none"
          style={inputStyle}
        />
      </Field>

      <Field label="Статус">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <PillChip key={s.slug} active={draft.status === s.slug} accent={accent} onClick={() => setField('status', s.slug)}>
              {s.label}
            </PillChip>
          ))}
        </div>
      </Field>

      <button
        disabled={!canSave || busy || photoBusy}
        onClick={() => void save()}
        className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px] mt-1 transition-transform active:scale-[0.98]"
        style={{ background: canSave ? accent : '#CFC9BD' }}
      >
        {item ? 'Зберегти зміни' : 'Зберегти в шафку'}
      </button>
      {!canSave && (
        <p className="text-xs text-center -mt-1" style={{ color: MUTED }}>
          Обери {showCategories && !draft.category ? 'категорію і ' : ''}розмір
        </p>
      )}
      {saveError && (
        <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
          {saveError}
        </p>
      )}
    </Sheet>
  )
}

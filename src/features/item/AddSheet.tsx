import { useState } from 'react'
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
import { addItem, type Item } from '../../data/db'
import { MUTED, CARD_BORDER } from '../../app/theme'
import { Field, Sheet } from '../../ui/Sheet'
import { PillChip, TagChip } from '../../ui/chips'

interface Draft {
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

export function AddSheet({
  defaultChild,
  defaultSection,
  onClose,
  onSaved,
}: {
  defaultChild: ChildId
  defaultSection: SectionSlug
  onClose: () => void
  onSaved: (item: Item) => void
}) {
  const [draft, setDraft] = useState<Draft>({
    childId: defaultChild,
    section: defaultSection,
    category: defaultSection === 'shoes' ? 'shoes' : '',
    size: '',
    season: '',
    color: '',
    note: '',
    status: 'new_with_tag',
    tags: [],
  })
  const [busy, setBusy] = useState(false)

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
    try {
      const item = await addItem({
        childId: draft.childId,
        section: draft.section,
        category: draft.category,
        size: draft.size,
        season: draft.season || null,
        color: draft.color.trim() || null,
        note: draft.note.trim() || null,
        status: draft.status,
        tags: draft.tags,
      })
      onSaved(item)
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = { background: '#fff', border: `1.5px solid ${CARD_BORDER}` }

  return (
    <Sheet onClose={onClose} title="Нова річ" accent={accent}>
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
        disabled={!canSave || busy}
        onClick={() => void save()}
        className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px] mt-1 transition-transform active:scale-[0.98]"
        style={{ background: canSave ? accent : '#CFC9BD' }}
      >
        Зберегти в шафку
      </button>
      {!canSave && (
        <p className="text-xs text-center -mt-1" style={{ color: MUTED }}>
          Обери {showCategories && !draft.category ? 'категорію і ' : ''}розмір
        </p>
      )}
    </Sheet>
  )
}

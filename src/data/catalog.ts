// Catalogs live in code (PLAN.md §3.5). Items reference entries by stable slug;
// Ukrainian labels are UI-only and may change without touching stored data.

export type ChildId = 'son' | 'daughter'

export interface ChildDef {
  id: ChildId
  label: string
  age: string
  emoji: string
  accent: string
  soft: string
}

export const CHILDREN: Record<ChildId, ChildDef> = {
  son: { id: 'son', label: 'Син', age: '8 р.', emoji: '🧒', accent: '#2456C7', soft: '#E9EFFB' },
  daughter: { id: 'daughter', label: 'Донька', age: '3 р.', emoji: '👧', accent: '#D8447C', soft: '#FBE9F1' },
}

export type SectionSlug = 'clothes' | 'shoes' | 'accessories'

export interface CatalogEntry {
  slug: string
  label: string
}

export interface SectionDef {
  slug: SectionSlug
  label: string
  /** Size slugs in display order — never sort sizes lexicographically */
  sizes: string[]
  /** UI labels for size slugs that aren't displayed as-is */
  sizeLabels?: Record<string, string>
  categories: CatalogEntry[]
  /** Shoes only: tags refine the single category */
  tagOptions?: CatalogEntry[]
}

export const SECTIONS: Record<SectionSlug, SectionDef> = {
  clothes: {
    slug: 'clothes',
    label: 'Одяг',
    sizes: ['86', '92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152'],
    categories: [
      { slug: 'tshirts', label: 'Футболки' },
      { slug: 'longsleeves', label: 'Лонгсліви' },
      { slug: 'sweatshirts', label: 'Світшоти й светри' },
      { slug: 'pants', label: 'Штани' },
      { slug: 'shorts', label: 'Шорти' },
      { slug: 'dresses', label: 'Сукні та спідниці' },
      { slug: 'outerwear', label: 'Верхній одяг' },
      { slug: 'pajamas', label: 'Піжами' },
    ],
  },
  shoes: {
    slug: 'shoes',
    label: 'Взуття',
    sizes: ['22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'],
    categories: [{ slug: 'shoes', label: 'Взуття' }],
    tagOptions: [
      { slug: 'summer', label: 'літнє' },
      { slug: 'winter', label: 'зимове' },
      { slug: 'sport', label: 'спортивне' },
      { slug: 'dressy', label: 'святкове' },
    ],
  },
  accessories: {
    slug: 'accessories',
    label: 'Аксесуари',
    sizes: ['1-3', '4-7', '8plus', 'onesize'],
    sizeLabels: { '1-3': '1–3 р.', '4-7': '4–7 р.', '8plus': '8+ р.', onesize: 'Один розмір' },
    categories: [
      { slug: 'hats', label: 'Шапки' },
      { slug: 'mittens', label: 'Рукавиці' },
      { slug: 'scarves', label: 'Шарфи' },
      { slug: 'other', label: 'Інше' },
    ],
  },
}

export const SECTION_ORDER: SectionSlug[] = ['clothes', 'shoes', 'accessories']

export const SEASONS: CatalogEntry[] = [
  { slug: 'summer', label: 'Літо' },
  { slug: 'demi', label: 'Демі' },
  { slug: 'winter', label: 'Зима' },
  { slug: 'all', label: 'Всесезон' },
]

/** Open enum — more statuses (e.g. outgrown) will be added later */
export const STATUSES: CatalogEntry[] = [
  { slug: 'new_with_tag', label: '🏷️ Нове з етикеткою' },
  { slug: 'wearing', label: 'Вже носить' },
]

export function sizeLabel(section: SectionDef, sizeSlug: string): string {
  return section.sizeLabels?.[sizeSlug] ?? sizeSlug
}

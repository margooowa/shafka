import type { ProcessedPhoto } from '../../data/db'
import { SECTIONS, SECTION_ORDER, SEASONS, STATUSES } from '../../data/catalog'

// Client side of AI recognition (Phase 2). Sends the compressed screenshot to
// our serverless /api/recognize function (which holds the secret key) and gets
// back a structured suggestion for the item form. Nothing is saved here — the
// user reviews and approves in the normal Add-item form.

export interface Suggestion {
  section: string
  category: string
  color: string
  season: string
  status: string
  size: string
  note: string
  confidence: 'high' | 'medium' | 'low'
}

/** 'no-key' → server has no ANTHROPIC_API_KEY; 'failed' → anything else. */
export class RecognizeError extends Error {}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result)
      resolve(s.slice(s.indexOf(',') + 1)) // strip the "data:...;base64," prefix
    }
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

export async function recognizeItem(photo: ProcessedPhoto): Promise<Suggestion> {
  const imageBase64 = await blobToBase64(photo.full)
  const sections = SECTION_ORDER.map((slug) => ({
    slug,
    label: SECTIONS[slug].label,
    categories: SECTIONS[slug].categories.map((c) => ({ slug: c.slug, label: c.label })),
  }))

  let res: Response
  try {
    res = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mediaType: 'image/jpeg', // processPhotoFile always outputs JPEG
        sections,
        seasons: SEASONS.map((s) => ({ slug: s.slug, label: s.label })),
        statuses: STATUSES.map((s) => ({ slug: s.slug, label: s.label })),
      }),
    })
  } catch {
    throw new RecognizeError('failed')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new RecognizeError(body?.error === 'auth' ? 'no-key' : 'failed')
  }
  const data = await res.json().catch(() => null)
  if (!data?.suggestion) throw new RecognizeError('failed')
  return data.suggestion as Suggestion
}

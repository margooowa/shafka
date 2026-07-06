import { cropPhoto, processPhotoFile, whitenBackground } from '../photos/compress'
import type { ProcessedPhoto } from '../../data/db'
import { SECTIONS, SECTION_ORDER, SEASONS } from '../../data/catalog'

// Client side of AI recognition (Phase 2). Sends a screenshot to our serverless
// /api/recognize function (which holds the secret key), gets back a list of
// detected items with bounding boxes, and crops each into its own photo. Nothing
// is saved here — the user reviews and approves in the AI review sheet.

export interface Box {
  x: number
  y: number
  w: number
  h: number
}
export interface Detected {
  label: string
  section: string
  category: string
  color: string
  season: string
  size: string
  note: string
  confidence: 'high' | 'medium' | 'low'
  box: Box
}

/** A detected item with its cropped photo ready for the form. */
export interface RecognizedItem extends Detected {
  photo: ProcessedPhoto
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

/**
 * Compress the screenshot, ask Claude to find every item, and crop each one.
 * Returns the recognized items (each with its own cropped photo), newest boxes
 * first is not meaningful — order follows the model.
 */
export async function recognizeScreenshot(file: File): Promise<RecognizedItem[]> {
  const screenshot = await processPhotoFile(file)
  const imageBase64 = await blobToBase64(screenshot.full)

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
  const detected: Detected[] = Array.isArray(data?.items) ? data.items : []
  if (!detected.length) return []

  // Crop each detected item out of the screenshot into its own photo, then
  // cut the garment out and re-composite it onto white (shop backdrops vary).
  const items: RecognizedItem[] = []
  for (const d of detected.slice(0, 12)) {
    try {
      const photo = await cropPhoto(screenshot.full, d.box)
      try {
        items.push({ ...d, photo: await whitenBackground(photo) })
      } catch {
        // Fallback: keep the plain crop if background removal fails.
        items.push({ ...d, photo })
      }
    } catch {
      // Fallback: use the whole screenshot if the crop fails.
      items.push({ ...d, photo: screenshot })
    }
  }
  return items
}

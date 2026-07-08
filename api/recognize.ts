import Anthropic from '@anthropic-ai/sdk'

// Vercel serverless function (Phase 2 — AI recognition). Runs on the server, so
// the ANTHROPIC_API_KEY env var stays secret and never reaches the browser.
// Takes a screenshot + the catalog, asks Claude (vision) to find EVERY wearable
// item and classify each into the app's own slugs, with a bounding box so the
// client can crop each item into its own photo. Typed loosely (any) — Vercel
// bundles this with esbuild, separate from the app's tsc build.

const client = new Anthropic() // reads ANTHROPIC_API_KEY

interface CatEntry {
  slug: string
  label: string
}
interface Section {
  slug: string
  label: string
  categories: CatEntry[]
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  try {
    const { imageBase64, mediaType, sections, seasons } = req.body ?? {}
    if (!imageBase64 || !mediaType || !Array.isArray(sections) || !sections.length) {
      res.status(400).json({ error: 'bad_request' })
      return
    }

    const sectionList = sections as Section[]
    const seasonList = (seasons ?? []) as CatEntry[]

    const sectionSlugs = sectionList.map((s) => s.slug)
    const categorySlugs = sectionList.flatMap((s) => (s.categories ?? []).map((c) => c.slug))
    const seasonSlugs = seasonList.map((s) => s.slug)

    // Force the model's answer into the app's exact slugs. '' = "unsure / leave to user".
    const itemSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        label: { type: 'string' },
        section: { type: 'string', enum: sectionSlugs },
        category: { type: 'string', enum: categorySlugs },
        color: { type: 'string' },
        season: { type: 'string', enum: [...seasonSlugs, ''] },
        size: { type: 'string' },
        note: { type: 'string' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        box: {
          type: 'object',
          additionalProperties: false,
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            w: { type: 'number' },
            h: { type: 'number' },
          },
          required: ['x', 'y', 'w', 'h'],
        },
      },
      required: ['label', 'section', 'category', 'color', 'season', 'size', 'note', 'confidence', 'box'],
    }
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: { items: { type: 'array', items: itemSchema } },
      required: ['items'],
    }

    const catalogText = sectionList
      .map((s) => `- ${s.slug} (${s.label}): ${(s.categories ?? []).map((c) => `${c.slug}=${c.label}`).join(', ')}`)
      .join('\n')
    const seasonText = seasonList.map((s) => `${s.slug}=${s.label}`).join(', ')

    const prompt = `Identify EVERY distinct wearable item (clothing, footwear, accessory) shown in this screenshot from an online shop. Classify each using ONLY the provided slugs, and give a bounding box for each.

Sections and their categories:
${catalogText}

Seasons: ${seasonText}

For each item return:
- label: a short Ukrainian phrase to tell items apart (e.g. "рожева сукня", "сині кросівки").
- section: the best-fitting section slug.
- category: a category slug that belongs to that section.
- color: dominant colour in Ukrainian, lowercase, short. Empty string if unclear.
- season: a season slug only if strongly implied (coat → winter, shorts → summer); otherwise empty string.
- size: if a single size is shown as plain text near the item, use it. If a size-picker with several options is visible (e.g. a row of buttons like 86 92 98 104) and ONE is visually marked as selected/active (distinct fill colour, border, checkmark, or bold vs. the others), use that selected value — do not leave it empty just because multiple options are shown. If several options are visible with none clearly selected, leave it empty.
- note: a short Ukrainian note (brand/pattern/material) or empty string.
- confidence: your confidence in the category.
- box: {x, y, w, h} as FRACTIONS of the image (x,y = top-left corner; w,h = width/height; all between 0 and 1). Must fully enclose the ENTIRE garment/item — every edge (collar to hem, waist to ankle, etc.), not just its most visible or decorated part. Only shrink the box where the item is genuinely cut off by the photo itself or hidden behind another item.

Ignore human faces, backgrounds, prices, and logos — only actual wearable products. If there is only one item, return a single-element list.`

    const response: any = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    } as any)

    if (response.stop_reason === 'refusal') {
      res.status(422).json({ error: 'refused' })
      return
    }
    const textBlock = (response.content ?? []).find((b: any) => b.type === 'text')
    if (!textBlock) {
      res.status(502).json({ error: 'no_output' })
      return
    }
    const parsed = JSON.parse(textBlock.text)
    res.status(200).json({ items: Array.isArray(parsed?.items) ? parsed.items : [] })
  } catch (e: any) {
    const status = e?.status
    if (status === 401 || status === 403) {
      res.status(500).json({ error: 'auth' })
      return
    }
    res.status(500).json({ error: 'server', message: String(e?.message ?? e) })
  }
}

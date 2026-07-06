import Anthropic from '@anthropic-ai/sdk'

// Vercel serverless function (Phase 2 — AI recognition). Runs on the server, so
// the ANTHROPIC_API_KEY env var stays secret and never reaches the browser.
// Takes a screenshot + the catalog, asks Claude (vision) to classify the item
// into the app's own slugs, and returns a structured suggestion the user then
// reviews and approves. Typed loosely (any) — Vercel bundles this with esbuild,
// separate from the app's tsc build.

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
    const { imageBase64, mediaType, sections, seasons, statuses } = req.body ?? {}
    if (!imageBase64 || !mediaType || !Array.isArray(sections) || !sections.length) {
      res.status(400).json({ error: 'bad_request' })
      return
    }

    const sectionList = sections as Section[]
    const seasonList = (seasons ?? []) as CatEntry[]
    const statusList = (statuses ?? []) as CatEntry[]

    const sectionSlugs = sectionList.map((s) => s.slug)
    const categorySlugs = sectionList.flatMap((s) => (s.categories ?? []).map((c) => c.slug))
    const seasonSlugs = seasonList.map((s) => s.slug)
    const statusSlugs = statusList.map((s) => s.slug)

    // Force the model's answer into the app's exact slugs. '' = "unsure / leave to user".
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        section: { type: 'string', enum: sectionSlugs },
        category: { type: 'string', enum: categorySlugs },
        color: { type: 'string' },
        season: { type: 'string', enum: [...seasonSlugs, ''] },
        status: { type: 'string', enum: [...statusSlugs, ''] },
        size: { type: 'string' },
        note: { type: 'string' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      },
      required: ['section', 'category', 'color', 'season', 'status', 'size', 'note', 'confidence'],
    }

    const catalogText = sectionList
      .map((s) => `- ${s.slug} (${s.label}): ${(s.categories ?? []).map((c) => `${c.slug}=${c.label}`).join(', ')}`)
      .join('\n')
    const seasonText = seasonList.map((s) => `${s.slug}=${s.label}`).join(', ')

    const prompt = `You are cataloguing a child's clothing item from a screenshot of an online shop. Identify the SINGLE main garment/item shown and classify it using ONLY the provided slugs.

Sections and their categories:
${catalogText}

Seasons: ${seasonText}

Rules:
- section: the best-fitting section slug for the item.
- category: a category slug that belongs to that section.
- color: the dominant colour, in Ukrainian, lowercase and short (e.g. "синій", "рожевий з квіточками"). Empty string if unclear.
- season: a season slug only if the item strongly implies one (a coat → winter, shorts → summer); otherwise empty string.
- size: only if a size is clearly shown as text in the screenshot; otherwise empty string.
- status: always empty string (the user sets this).
- note: a short helpful note in Ukrainian (brand, pattern, or material) or empty string.
- confidence: how confident you are in the category.`

    const response: any = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
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
    const suggestion = JSON.parse(textBlock.text)
    res.status(200).json({ suggestion })
  } catch (e: any) {
    const status = e?.status
    if (status === 401 || status === 403) {
      res.status(500).json({ error: 'auth' })
      return
    }
    res.status(500).json({ error: 'server', message: String(e?.message ?? e) })
  }
}

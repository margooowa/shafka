# "Shafka" Project — Kickoff Prompt for Claude Code

Copy everything below the line and paste it as your first message in Claude Code.

---

# Project "Shafka" (Шафка) — Kids' Wardrobe Catalog

## Who I am and how to work with me
I'm an architect of automated systems. I fluently read JSON, XML, Swagger/OpenAPI, understand SQL query logic and architectural decisions, and I've managed pipelines and releases. But I do NOT write code and cannot read functions.

Therefore:
- Explain decisions at the level of architecture, data flows, and models — not through code
- Give me all terminal commands ready to copy-paste, with a note on "what this will do"
- I've never deployed a project online — when we get there, you'll walk me through it step by step

## The problem we're solving
I buy kids' clothes on sales in different stores and forget what I've already bought — I end up with duplicates. I need a catalog of purchases: open a child's profile, size 110 — and see all the items like a storefront in a shop.

## What we're building (Phase 1 — MVP)
A local web app, mobile-first, with the UI **in Ukrainian**.

1. **Two child profiles**: Son (8 y.o.) and Daughter (3 y.o.), each with their own accent color so it's instantly clear whose profile is open
2. **Three sections with different size grids**:
   - Clothes (Одяг): 86, 92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152
   - Shoes (Взуття): 22–38
   - Accessories (Аксесуари): "1–3 р.", "4–7 р.", "8+ р.", "Один розмір" (one size)
3. **Categories** (UI labels in Ukrainian as given):
   - Clothes: Футболки (t-shirts), Лонгсліви (long sleeves), Світшоти й светри (sweatshirts & sweaters), Штани (pants), Шорти (shorts), Сукні та спідниці (dresses & skirts), Верхній одяг (outerwear), Піжами (pajamas)
   - Shoes: a single category, detailed via tags (літнє/зимове/спортивне/святкове = summer/winter/sport/dressy)
   - Accessories: Шапки (hats), Рукавиці (mittens), Шарфи (scarves), Інше (other)
4. **Item card**: photo, child, section, category, size, season (Літо/Демі/Зима/Всесезон = summer/mid-season/winter/all-season), color (free text), status (🏷️ "нове з етикеткою" = new with tag / "вже носить" = already wearing), note. Only section + category + size are required
5. **Photos**: upload from camera or gallery (store screenshots), client-side compression to ~700 px on the longer side, JPEG ~0.72 quality
6. **Storefront gallery**: 3-column thumbnail grid; filter chips by size and category with counters ("110 · 7", "Шорти · 4"); show only sizes/categories that actually contain items
7. **Storage**: fully local in the browser (IndexedDB), photos included. No servers, no accounts in Phase 1
8. **Primary scenario**: I'm standing in a store with my phone and within 20 seconds I check whether my daughter already has shorts in size 110

## Technical constraints
- Propose the stack yourself and justify it in the plan. My starting point: Vite + React + Dexie (IndexedDB) + PWA (so I can add an icon to my phone's home screen), but I'm open to arguments
- Design the data model so that future phases can be added painlessly:
  - Phase 2: AI photo recognition via the Anthropic API (photo → JSON: category, color, size read from the tag/screenshot; a human confirms before saving; API key in .env)
  - Phase 3: outfit combinator — pick a t-shirt + shorts and see them side by side
  - Phase 4: hosting, sync across devices, accounts, monetization
- In Phase 1 build ONLY Phase 1, but don't make decisions that would block the later phases

## Design (already agreed — follow it)
- Background #FAF9F6, text #2A2622, muted #8B8478
- Accents: son #2456C7 (soft bg #E9EFFB), daughter #D8447C (soft bg #FBE9F1)
- Fonts: Unbounded (headings/wordmark), Rubik (body) — both support Cyrillic
- Signature detail: size filter chips shaped like clothing swing tags (clipped corner + punched hole)
- The `reference/` folder contains a prototype `shafka.jsx` — use it as the reference for design, UI copy, and UX logic

## Collaboration rules
1. **Plan first, code second.** Create `PLAN.md`: architecture, folder structure, data model (show it as JSON schemas — I read those fluently), and a breakdown of Phase 1 into steps. Wait for my explicit "ok" before writing any code
2. **Small increments.** One step = one working feature I can open in the browser and touch. After each step, tell me how to verify it
3. **Git from day one.** Initialize a repository, commit after every working step with a clear message
4. **Maintain `PROJECT.md`**: what's done, what's next, which decisions were made and why. This is our shared logbook between sessions
5. **Ask me** at forks that affect the product or future phases. Decide minor technical details yourself and record them in PROJECT.md
6. **Testing**: show me how to run the app locally and how to open it from my phone on the home network — this is critical for validating the primary scenario

## Additional constraints
- Primary device: Samsung S26 Ultra, Chrome on Android. Optimize PWA behavior for that
- Data safety is non-negotiable: request persistent storage (`navigator.storage.persist()`), and include export/import (JSON + photos as a zip) in Phase 1. IndexedDB eviction or an origin change must never mean data loss
- Note that IndexedDB is tied to device+origin: propose in PLAN.md how I get a stable HTTPS URL for my phone (free static hosting of the built app is acceptable — it's not a server; data stays local)
- Status is an open enum — more states (e.g. "outgrown / handed down") will come later; don't hardcode two values into the data model
- Phase 2 note: a client-only app can't hide an API key; don't architect yourself into a corner — assume a tiny proxy may be added later
- If this prompt and `reference/shafka.jsx` conflict, this prompt wins

Start by creating PLAN.md.

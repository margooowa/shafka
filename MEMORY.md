# MEMORY — Shafka logbook

Shared log between sessions: what's done, what's next, which decisions were made
and why. Read alongside CLAUDE.md at session start (same convention as TravCozy).

## Status

- **2026-07-03** — Project folder created. PLAN.md drafted (architecture, data
  model, 9-step Phase 1 breakdown). Git initialized.
- **2026-07-03** — **PLAN.md approved by VK ("ok").** Open items resolved: shoes
  whole sizes 22–38 only; Vercel as static host. Linear tracking set up: team
  **Shafka (SHF)** + project **"Shafka Phase 1 — MVP"**, issues SHF-1…SHF-10.
  CLAUDE.md extended with tracking rules.

- **2026-07-03** — `shafka.jsx` delivered (SHF-1 done). **Step 1 done (SHF-2,
  `df21e25`)**: scaffold + design tokens + shell (child switcher, section pills,
  empty state, FAB + toast). Build green; self-verified in Chrome: accent flips
  pink↔blue, Cyrillic font subsets bundled.

- **2026-07-03** — **Step 2 done (SHF-3, `f2bd0ee`)**: Dexie schema (4 tables,
  compound [childId+section] index), children seeded, persist() requested +
  recorded, CRUD helpers. Self-verified: test item survives reload, live
  counters react. Note: persist = "ні" on desktop Chrome is expected — real
  grant happens on Android once the PWA is installed (step 7/9).

- **2026-07-03** — **Step 3 done (SHF-4, `c086f59`)**: AddSheet bottom sheet
  (cascade + optional fields + shoe tags), FAB wired, temporary plain list.
  Self-verified: Шорти 110 for daughter saved → toast → row shown → survives
  reload. Note: shoe tags UI added per kickoff prompt (prototype lacked it —
  prompt wins); note input likewise.

- **2026-07-03** — **Step 4 done (SHF-5, `bad291c`)**: photo pipeline (EXIF-safe
  decode → 700px full + 240px thumb JPEGs), photo+item in one transaction,
  PhotoView blob renderer, thumbs in list. Self-verified: 1600×1200 → 700×525
  (7KB gradient test), thumbnail survives reload.

- **2026-07-03** — **Step 5 done (SHF-6, `eafcd12`)**: storefront grid + faceted
  swing-tag/pill chips with live counters. Self-verified the 20-second scenario:
  "110 · 5" → "Шорти · 3" → three shorts on screen, category counters recompute
  under the size filter. Demo items cleaned after verification; VK's first real
  item (Штани 122 + photo) kept. Note: VK started entering real data during
  step-4 verification.

- **2026-07-03** — **Step 6 done (SHF-7, `cd03bbd`)**: DetailSheet (photo, rows,
  status toggle, delete w/ confirm) + ItemFormSheet now serves add & edit with
  atomic photo swap. Self-verified: toggle round-trip, edit 134→146 live,
  delete w/ confirm + live counters. Fixed: DEV-panel "очистити" orphaned photo
  blobs (found 1 orphan from real usage — cleaned; now clears photos too).
  Gotcha for tests: Dexie liveQuery doesn't see raw-IndexedDB writes — seed via
  Dexie or reload after seeding.

- **2026-07-03** — **Step 7 done (SHF-8, `07b3444`)**: PWA wired — uk manifest,
  brand icon (vector swing-tag+Ш, sharp-generated PNGs, regen via
  `node scripts/gen-icons.mjs`), SW precaches shell, fonts CacheFirst at
  runtime. Offline-verified via server-kill on `npm run preview` (:4173).
  Gotchas: SW is prod-build only (dev :5173 has none); :4173 is a separate
  origin → separate empty IndexedDB — don't confuse with :5173 data.

- **2026-07-03** — **Step 8 done (SHF-9, `00646ef`)**: backup zip via fflate
  (manifest.json + photos/<id>.jpg; thumbs regenerated on import; merge by id,
  missing-only). Archive button in header → BackupSheet. Self-verified full
  disaster recovery on live data: export (33KB) → wipe 0/0/0 → import →
  2 children/1 item/1 photo back, thumb regenerated. Dedup re-import = 0 added.

- **2026-07-03** — **Step 9 deployed (SHF-10)**: **https://shafka.vercel.app**
  live (project `shafka` in VK's personal Vercel scope; clean alias was free).
  Verified: HTTPS, SW active, manifest ok. Gotcha: `vercel --yes` auto-name
  failed on capitalized dir → `vercel link --project shafka` first.
  **Left on VK**: export at :5173 → import at shafka.vercel.app (one-time data
  move), install PWA on S26 Ultra, real in-store 20-second acceptance test.

- **2026-07-03** — GitHub remote created and pushed: private repo
  `kozub88/shafka`. **Marharyta (VK's wife) joins development** from a Windows
  laptop. She has her own GitHub account — username NOT yet provided.

## Next

1. **Marharyta onboarding (blocked on her GitHub username):** invite as
   collaborator (`gh api repos/kozub88/shafka/collaborators/<username> -X PUT`),
   she accepts → clone → `npm install` → `npm run dev` (steps already given:
   winget Git+Node, git config identity). Decide: add her to Linear team Shafka?
   PR workflow / branch protection wanted?
2. **VK, to close SHF-10 + Phase 1:** one-time data move (export at :5173 →
   import at https://shafka.vercel.app), install PWA on S26 Ultra (Chrome ⋮ →
   Add to Home screen), then the real in-store 20-second acceptance test.
3. Two-person git rule until protection exists: pull before work, pull before push.

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-07-03 | Stack: Vite + React + TS + Tailwind + Dexie + vite-plugin-pwa | See PLAN §1; matches prototype (React), Dexie versioning protects Phases 2–4 |
| 2026-07-03 | Catalogs in code, data in DB; items reference catalogs by slug | Labels can change without data migration |
| 2026-07-03 | Photos in separate table, full (~700px) + thumb (~240px) blobs | Fast grid, clean export, reusable by Phases 2–3 |
| 2026-07-03 | UUIDs + createdAt/updatedAt on items | Phase 4 sync-proofing, costs nothing now |
| 2026-07-03 | Export/import zip is a Phase 1 feature, not Phase 4 | Only insurance against IndexedDB eviction / origin change / device loss |
| 2026-07-03 | Phone uses one canonical deployed HTTPS URL; localhost data is disposable | IndexedDB is bound to device+origin; LAN http can't install a PWA |
| 2026-07-03 | Shoes: whole sizes 22–38 only | VK confirmed |
| 2026-07-03 | Vercel as free static host | VK confirmed; he knows the flow from TravCozy |
| 2026-07-03 | Tasks in Linear: team Shafka (SHF), project "Shafka Phase 1 — MVP" | Separate area from TravCozy (TRA); one issue per step, IDs in commits |
| 2026-07-03 | PROJECT.md renamed to MEMORY.md | VK's cross-repo convention (as in TravCozy); one logbook file, role unchanged |
| 2026-07-03 | Fonts self-hosted via Fontsource, not Google Fonts CDN | Offline PWA must not depend on external font requests; Cyrillic subsets verified in build |
| 2026-07-03 | lucide-react for icons; Tailwind v4 via @tailwindcss/vite | Matches prototype's icon set; v4 needs no config file |
| 2026-07-03 | FAB shows placeholder toast until step 3 | Dead buttons confuse; toast says where the feature lands |

## Remote

- GitHub: https://github.com/kozub88/shafka (private, created 2026-07-03)

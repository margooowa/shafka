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

## Next

1. VK drops `shafka.jsx` into `reference/` (SHF-1 — blocks steps 1 & 5 visuals)
2. Step 1: scaffold (SHF-2)

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

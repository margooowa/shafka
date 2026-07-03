# CLAUDE.md — Shafka (Шафка)

Kids' wardrobe catalog. Local-first PWA, mobile-first, UI in Ukrainian.
Full plan: PLAN.md. Logbook: PROJECT.md (keep it current).

## Who you're working with

VK — architect of automated systems. Reads JSON, schemas, OpenAPI, SQL fluently;
does **not** read code. Therefore:

- Explain decisions via architecture, data flows, and models — never via code
- Every terminal command ready to copy-paste, with a note on what it will do
- VK has never deployed a project — deployment steps get a guided walkthrough

## Workflow rules (non-negotiable)

- **Plan first.** No code without VK's explicit "ok" on the plan for that work
- **Small increments.** One step = one touchable feature. Before telling VK a step
  is done, verify it yourself in a browser; then tell VK how to verify it too
- **Commit after every working step** with a clear message
- **PROJECT.md is the shared logbook**: done / next / decisions + why
- **Ask VK** at forks affecting the product or future phases; decide minor
  technical details alone and log them in PROJECT.md
- UI copy: Ukrainian. Code, docs, commits: English

## Product guardrails

- **Data safety is non-negotiable**: persistent storage requested, export/import
  zip is a Phase 1 feature; nothing may risk IndexedDB data loss
- Primary device: Samsung S26 Ultra, Chrome on Android. localhost is dev-only;
  the phone uses one canonical deployed HTTPS URL
- Catalogs (sections / categories / size grids) live in code; items reference
  them by stable slug; Ukrainian labels are UI-only
- `status` is an open enum; UUIDs everywhere; `createdAt`/`updatedAt` on items
- Build Phase 1 only, but never block Phases 2–4 (PLAN.md §7)

## Design tokens (agreed — follow)

- Background #FAF9F6, text #2A2622, muted #8B8478
- Son #2456C7 (soft #E9EFFB), Daughter #D8447C (soft #FBE9F1)
- Fonts: Unbounded (headings/wordmark), Rubik (body)
- Signature: size chips shaped like clothing swing tags (clipped corner + hole)
- `reference/shafka.jsx` is the visual source of truth; on conflict with the
  kickoff prompt, the prompt wins

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

- **2026-07-04** — **Marharyta onboarded on her Windows 11 laptop.** Repo lives
  at `C:\шафка\Shafka\Shafka`; Node 24.16 / npm 11.13. **Plan changed: instead of
  collaborating on `kozub88/shafka` (VK's private repo, unreachable from her
  machine), her code goes to her own personal GitHub `margooowa/shafka`** — full
  history pushed (`77fe78d`), local↔remote in sync. Remotes on her machine:
  `origin` = `https://margooowa@github.com/margooowa/shafka.git`, `kozub` =
  `kozub88/shafka`. Auth gotcha: this laptop's global Git is her **work** identity
  (GitLab; cached github.com token = work account `marharytaKozub`), so pushing
  as `margooowa` requires the username in the origin URL to force GCM to auth the
  personal account (browser sign-in). Also fixed: transferred `node_modules` had
  flattened Unix-only `.bin` shims (no Windows `.cmd`) → `'tsc' not recognized`;
  ran `npm ci` (375 pkgs, 0 vuln) → `npm run build` green.

- **2026-07-05** — **Linear connected on Marharyta's laptop** (her own
  `linear.app/shafka`, team **Shafka / SHA**). Board previously held only the 4
  default Linear onboarding cards (SHA-1…SHA-4) — no real work. **Phase 2 direction
  chosen: cloud sync so data + photos are reachable from any device.** Backend =
  **Supabase** (Postgres + Storage buckets + Auth); model = **offline-first**
  (Dexie stays the local source of truth, background push/pull to Supabase — the
  zero-signal-in-store guarantee stays intact). Seeded Linear project **"Phase 2 —
  Cloud Sync (Supabase)"** with 8 step issues **SHA-5…SHA-12** (setup → auth →
  schema+RLS → push → pull → delete-propagation → sync-status/offline-queue →
  one-time data migration), each with a verify criterion. **Plan approved.**

- **2026-07-05** — **Step 1 done (SHA-5)**: Supabase project provisioned
  (`bkxnkwijzttvqmciqbfb.supabase.co`, Central-EU/Frankfurt, dashboard signed in
  via Marharyta's GitHub). App wired: `@supabase/supabase-js` added; `.env.local`
  holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_`
  key format — safe in client; gitignored via `.env.*`); `src/data/supabase.ts`
  exports the shared client; env typed in `vite-env.d.ts`; dev-only boot check in
  `main.tsx` (local `auth.getSession()`, no network). `npm run build` green (bundle
  +~200KB from the client → 550KB, chunk-size warning only, defer code-split).
  **Next: SHA-6 (email magic-link sign-in).** Note: DB password was shared in chat
  during setup — rotate in Supabase if concerned (app doesn't use it; anon/publishable
  key only).

- **2026-07-05** — **Step 2 in progress (SHA-6)**: email magic-link sign-in built
  (`src/features/auth/useAuth.ts` session hook — getSession local read, offline-safe;
  `AuthSheet.tsx` sign-in/sent/signed-in states, UI in Ukrainian; header gets a
  `UserRound` account button that tints to the child accent when signed in). Not a
  hard gate — app still opens local-only without login (offline-first preserved);
  sign-in just establishes the identity sync will use. `signInWithOtp` redirects to
  `window.location.origin`. Build green. **Pending runtime verify**: user must add
  redirect URLs in Supabase (localhost:5173, :4173, shafka.vercel.app) then test the
  email round-trip.

- **2026-07-05** — **SHA-13 (photo rotate) in progress** — standalone Phase-1 UX
  fix, not part of the cloud-sync epic. `rotatePhoto(full)` added to
  `features/photos/compress.ts` (redraws the stored ~700px JPEG on a 90°-rotated
  canvas, regenerates full+thumb; `Decoded` type broadened to accept a canvas
  source). `ItemFormSheet` gets a «Повернути» chip below the photo (shown when a
  photo is present); rotates the just-added photo or loads an existing item's full
  blob from Dexie and rotates that, swapping on save. Build green, live on dev via
  HMR. **Pending user visual verify.**

- **2026-07-05** — **SHA-7 (cloud schema) in progress** — `supabase/schema.sql`
  written (version-controlled): tables `children` / `items` / `photos_meta`
  mirroring the Dexie model, each with `updated_at` (last-write-wins) + `deleted`
  tombstone; RLS owner-only (`user_id = auth.uid()`); private Storage bucket
  `photos` (full JPEGs at `<user_id>/<photo_id>.jpg`, thumbs regenerated locally on
  pull); per-user updated_at indexes for incremental pull. Re-runnable script.
  **Done (SHA-7)** — applied directly against the DB via `pg` from the schema file
  (verified: 3 tables, `photos` bucket private, owner-only policies on all tables +
  bucket). **Gotcha: project region is `eu-west-3` (Paris), NOT Frankfurt** — pooler
  host `aws-0-eu-west-3.pooler.supabase.com` (only relevant for direct DB access; the
  app uses the JS client over HTTPS, so region is irrelevant there). Blocker for
  SHA-8 verify: RLS ties every row to `auth.uid()`, so **SHA-6 sign-in must work first**.

- **2026-07-05** — **Step 2 done (SHA-6)**: email magic-link sign-in verified by VK
  (person icon tints to accent, shows email). Redirect URLs added in Supabase
  (localhost:5173, :4173; Site URL = shafka.vercel.app placeholder).

- **2026-07-05** — **SHA-8 (push sync) in progress**: `features/sync/` added —
  `syncBus.ts` (change signal so `db.ts` nudges sync with no Supabase import/cycle),
  `sync.ts` `pushChanges()` (watermark `lastPushAt` in settings; uploads children +
  photos-newer-than-watermark to the `photos` bucket at `<uid>/<id>.jpg` + rows to
  Postgres; upserts idempotent; on failure the watermark doesn't advance → implicit
  offline retry queue), `useCloudSync.ts` (runs on sign-in, on each mutation via bus,
  and on `online`; running/pending guard + 300ms debounce coalesces bursts). `db.ts`
  mutation helpers call `requestSync()` post-commit; `App` calls `useCloudSync()`.
  First push on sign-in also uploads all pre-existing local data (covers most of
  SHA-12). Build green. **Pending verify: add an item on localhost → row in Supabase
  `items` table + file in `photos` bucket.** Delete propagation still deferred to SHA-10.

- **2026-07-05** — **Step 4 done (SHA-8)**: push verified — items row + photo landed
  in Supabase. **Bug found & fixed:** cloud `children.id` / `items.child_id` were
  declared `uuid` but the app keys children by catalog slug ('son'/'daughter') →
  `22P02 invalid input syntax for type uuid: "daughter"`. Changed both cols to `text`
  (live DB + `schema.sql`). Item/photo ids stay uuid.

- **2026-07-05** — **SHA-9 (pull sync) in progress**: `pullChanges()` added —
  fetches children/photos_meta/items changed since `lastPullAt`, merges into Dexie
  by id with LWW (`updatedAt`, compared via getTime so cloud `+00:00` vs local `Z`
  formats don't break it; timestamps normalized with `iso()` on store), downloads
  photo blobs not held locally and regenerates the thumb via `thumbFor`, honours
  `deleted` tombstones. `useCloudSync` rewritten: pull+push on sign-in / tab focus /
  reconnect, push on mutations (debounced); single-flight cycle w/ rerun flag.
  Build green. **Verify by wiping local IndexedDB (data is safe in cloud) → reload →
  wardrobe rebuilds from cloud; console shows `pull result {items>0}`.**

- **2026-07-05** — **Cloud sync verified end-to-end on PC** via the deployed site.
  **Deployed:** `https://shafka-alpha.vercel.app` (Marharyta's own Vercel project,
  imported `margooowa/shafka`, env vars `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_PUBLISHABLE_KEY` set; auto-deploys on push to `main`). Phase 2 code
  pushed to `origin/main` (was local-only before deploy). Email friction: Supabase
  built-in email is rate-limited (429) → guided **Resend** custom SMTP as the fix.
- **2026-07-05** — **Mobile login bug + fix (SHA-14, in progress)**: magic **link**
  fails on phones (opens in mail-app in-app browser ≠ initiating browser/PWA). Added
  **6-digit OTP code** entry to `AuthSheet` (`verifyOtp type:'email'`), link kept for
  desktop. **Needs dashboard step: Magic Link email template must include
  `{{ .Token }}`** so the code shows in the email. Build green; pending push+redeploy.
  **Superseded same day** — Supabase now requires custom SMTP to edit email
  templates, so the code path needed Resend. VK chose to **switch auth to
  email + password** instead (SHA-14): no email service / SMTP / templates /
  dashboard steps, works on every device. `AuthSheet` rewritten:
  `signInWithPassword` (signed-out), `updateUser({password})` to set a password
  from a signed-in device, emailed 6-digit code (`verifyOtp`) kept as fallback.
  No dashboard change needed (existing OTP account already confirmed). **Flow: set
  a password on the laptop where she's signed in → log in on phone with email+password.**
  Build green; pending push+redeploy + set-password + phone test.
  **Deployed** (commit `ec38924`). **Lockout hit:** VK/Marharyta got signed out on all
  devices before setting a password, and the "set password" UI needs a signed-in
  session (chicken-and-egg) while emailed OTP was rate-limited. **Recovery:** set the
  account password directly in `auth.users` via pgcrypto bcrypt (`crypt(pw,
  gen_salt('bf'))`) over the pooler, at her request; verified with a password-grant
  call (HTTP 200). She now logs in with email + password. **Follow-up wanted: add a
  proper sign-up form** so new accounts don't need this workaround (needs
  email-confirmation OFF in Supabase, or first-user bootstrap). Login password NOT
  recorded here (secret).

## Next

1. **Marharyta onboarding — DONE** (see 2026-07-04). Code on `margooowa/shafka`,
   app builds & runs on her laptop. Resolved: **`margooowa/shafka` is now the
   canonical/main repo** the team works from; **her Shafka commits use personal
   identity `margooowa <margooowa@ukr.net>`** (set per-repo, work global identity
   untouched). Open follow-ups: (b) add her to Linear team Shafka? (c) PR workflow
   / branch protection wanted? (d) VK to pull `margooowa/shafka` as the source of
   truth going forward (his `kozub88/shafka` no longer primary).
   Resolved (2026-07-05): she uses her **own** Linear (`linear.app/shafka`), not
   VK's. Phase 2 (AI photo recognition) backlog drafted — 7 issues ready to seed
   her board (source-field migration + key-handling decision unblock the rest).
   Optional: connect the Linear connector on her laptop so Claude can drive her board.
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
| 2026-07-04 | Canonical repo moves to `margooowa/shafka` (Marharyta's personal GitHub) | She couldn't access VK's private `kozub88/shafka`; team now works from her repo |
| 2026-07-04 | Shafka commits use per-repo identity `margooowa <margooowa@ukr.net>` | Laptop's global Git is her work account; personal identity keeps Shafka history attributed to her GitHub without touching work config |
| 2026-07-05 | Marharyta runs Shafka **fully separate** from VK: own repo, own commit identity, and her **own Linear workspace** (`linear.app/shafka`) — she does NOT join VK's Linear | Her preference for full independence; each tracks their own side |
| 2026-07-05 | Phase 2 = **cloud sync on Supabase**, **offline-first** (Dexie local cache + background push/pull, last-write-wins by updatedAt, tombstone deletes) | Data/photos must be reachable from any device without breaking the store-with-no-signal guarantee; app already UUID+timestamp ready (PLAN §7) |
| 2026-07-05 | Kids' photos → **private Storage bucket + RLS**, owner-only account | Privacy of children's images; only the signed-in account reads its own data |
| 2026-07-05 | Marharyta deploys her **own Vercel project** (import `margooowa/shafka`, GitHub auto-deploy, her Supabase env vars) — NOT VK's `shafka.vercel.app` | Local `.vercel` link points to VK's org; keeps her stack fully separate (own repo/Supabase/Vercel), consistent with the separation decision |
| 2026-07-05 | **First Vercel deploy waits until sync (SHA-9) is built** | So the first phone deploy shows the full cross-device experience, not a half-wired sign-in with no sync |

## Remote

- GitHub (VK): https://github.com/kozub88/shafka (private, created 2026-07-03)
- GitHub (Marharyta): https://github.com/margooowa/shafka (her personal account;
  full history pushed 2026-07-04). Her laptop: `origin` → margooowa, `kozub` →
  kozub88.

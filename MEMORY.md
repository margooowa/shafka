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

- **2026-07-05** — **SHA-10 (delete propagation) in progress**: Dexie **v2** adds a
  `tombstones` table `{id, photoId, deletedAt}` (additive migration). `deleteItem`
  hard-removes locally (UI updates now) AND records a tombstone. `pushChanges`
  processes tombstones with `deletedAt > lastPushAt`: **UPDATE** (not upsert) the
  cloud item to `deleted:true` (update = no-op if it never pushed, avoids NOT NULL
  insert failure), removes the storage object, marks `photos_meta` deleted.
  `pullChanges` already deletes items/photos whose cloud row is `deleted:true`, so a
  delete on one device removes it on others; no re-propagation loop (pull uses raw
  `db.items.delete`, not `deleteItem`). Build green. **Pending push+deploy + verify:
  delete on device A → gone on device B after sync, no ghost re-appears.**

- **2026-07-05** — **DIRECTION CHANGE → cloud-first writes (reverses offline-first).**
  VK: "delete and upload must not work as local — must sync with DB." New model:
  add/edit/delete commit to **Supabase first**, and only then update the local Dexie
  cache; if signed out or offline the write **throws and nothing changes locally**
  (DB is the single source of truth). **Reads still come from Dexie** (fast, viewable
  offline) — only writes require the DB. This **drops the "works in a store with no
  signal" non-negotiable** for writing (VK chose this explicitly). New module
  `features/sync/writes.ts` (`createItem`/`editItem`/`removeItem`, `requireUser`
  checks session + `navigator.onLine`, `SyncWriteError` + `writeErrorMessage`).
  `ItemFormSheet` + `DetailSheet` now call these and show an error on failure
  (nothing saved). Pull still runs for receiving other devices' changes; the old
  offline-first push/tombstone path is now dormant (kept for dev/backup reconcile).
  SHA-10 delete propagation satisfied via cloud-first delete + pull. **SHA-11
  (offline queue) is now obsolete.** Build green; pending push+deploy + verify.

- **2026-07-05** — **Storefront filters reworked** (`Storefront.tsx`): **SHA-15** —
  size + category are now independent AND-facets that BOTH persist (old code reset
  category when a size was tapped); **+ season added** as a third facet. All three
  cross-count (each chip reflects the other two selections; no empty combos). Labels:
  «Всі типи» / «Всі сезони». Season row shows when >1 season present. **SHA-16** — PWA
  auto-update: manual SW registration (`injectRegister:false`) + `registration.update()`
  poll (60s + on focus) so deploys self-refresh — one final manual cache-clear needed
  to adopt the fix, automatic after. All deployed to shafka-alpha.vercel.app.

- **2026-07-06** — **Phase 2 (AI recognition) built (SHA-19).** Screenshot → Claude
  vision → suggested item → user approves. Decision: **Anthropic API, model
  `claude-opus-4-8`** (VK's pick; ChatGPT *subscription* can't be used — API access
  is separate metered billing; ~1–2¢/scan). Key handling: **Vercel serverless
  function `api/recognize.ts`** holds `ANTHROPIC_API_KEY` (server-only env var, NO
  `VITE_` prefix — never reaches browser); `@anthropic-ai/sdk` added (used only by
  the function; app's `tsc` excludes `/api` via `tsconfig.app.json` include:["src"]).
  Function uses `output_config.format` json_schema constrained to catalog slugs.
  Client: `features/ai/recognize.ts` (base64 `photo.full` → POST /api/recognize);
  header **ScanLine** button → image picker → `ItemFormSheet` gains `suggested` +
  `initialPhoto` props (exported `Draft` type) → pre-filled add form, screenshot
  becomes the photo. Build green. Deployed & function verified live (`/api/recognize`
  → 405 for GET). **Then extended to MULTI-ITEM** (VK asked "what if several products
  in one screenshot"): `api/recognize.ts` now returns `items[]`, each with a
  normalized bounding `box` + label; Claude finds every wearable item. Client
  `recognizeScreenshot(file)` compresses the shot, calls the function, and
  `cropPhoto(full, box)` (new in `compress.ts`) crops each item into its own photo.
  New `AiReviewSheet` lists detected items (cropped thumb + guessed type), per-item
  category+size chips + include toggle + shared child selector → "Додати N"
  batch-creates via cloud-first `createItem`. App scan button now opens the review
  sheet. Single-item `suggested`/`initialPhoto` props on ItemFormSheet kept but
  unused by AI path now. Build green. **Pending push+deploy+test.**

- **2026-07-06** — **Bug fix (SHA-19 follow-up): AI-cropped photos looked bad in
  the storefront grid.** Root cause: `cropPhoto` cropped the AI's tight bounding
  box as-is (often tall/narrow — pants, dresses), but the grid tile is a deliberate
  `object-cover` square (per `reference/shafka.jsx`), so a non-square photo got its
  ends chopped off to fill the square. Fixed at the source in `compress.ts`:
  `cropPhoto` now pads the box to a square (centred on the detected box, ~10%
  breathing room, clamped to image bounds) before cropping, so the stored photo is
  already square — no view ever has to crop it again. Verified in-browser: seeded a
  test item via a synthetic tall crop box (console, throwaway dev origin, no real
  data touched) — output photo came back square (748×748 full, 320×320 thumb) and
  the grid tile showed the full garment with no cut-off edges. Build green.

- **2026-07-06** — **Bug fix (SHA-19 follow-up #2): square-pad clamp still chopped
  very tall items.** The 2026-07-06 pad-to-square fix clamped the crop square to
  `min(screenshot width, screenshot height)`, so an item taller than the screenshot
  is wide (pants, a dress) still lost its ends. Fixed in `cropPhoto`: pads with
  white beyond the screenshot's own edges instead of shrinking to fit. Also
  loosened the recognition prompt (`api/recognize.ts`) — no longer asks for a
  "tight" box, now explicitly requires the box to enclose the whole garment
  edge-to-edge. Build green. **Deployed** (commit `e02f006`) to
  `https://shafka-alpha.vercel.app` (see Vercel note below).

- **2026-07-06** — **Marharyta's local Vercel link pointed at VK's team**
  (`.vercel/project.json` had VK's org id — likely a stale copy from early setup),
  so deploys from her machine failed with "Not authorized". Found she already has
  her own project (`shafka` in her own Vercel team, matching the 2026-07-05 decision
  below); relinked local `.vercel/project.json` to it (`vercel link --scope shafka
  --project shafka`). Old link backed up to `.vercel/project.json.old-vitalii-backup`.
  Confirmed her project already has all three env vars set (`ANTHROPIC_API_KEY`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) — nothing else to migrate.

- **2026-07-06** — **Background removal added for AI-scanned photos (SHA-19
  follow-up #3).** Marharyta reported scanned items still showed their
  original shop-photo backdrop (e.g. a black studio background) once the crop
  itself stopped chopping them. Added `@imgly/background-removal` (client-side,
  WASM, no new server/API key/cost) — new `whitenBackground()` in `compress.ts`
  runs right after `cropPhoto`, cuts the garment out and re-composites it onto
  plain white, then re-encodes full+thumb through the existing pipeline. Wired
  into `features/ai/recognize.ts` only (manual camera photos untouched, by
  Marharyta's choice), with a fallback to the plain crop if removal throws.
  Build + prod build green. **Caveat: the ONNX runtime engine bundled for this
  is ~24MB (gzip ~5.6MB)**, lazy-loaded on first scan (not in the PWA precache),
  cached by the browser after. Scanning already requires being online, so this
  fits, but makes the first post-deploy scan noticeably heavier on mobile data.
  **Pending: Marharyta to test a real scan on a dark-backdrop shop photo and
  confirm the white background looks right** (imperfect edges on fuzzy/sheer
  fabric are expected — same class of limitation as any background-removal tool).

- **2026-07-08** — **Swimwear category + AI size-picker fix.** Added `swimwear` /
  "Купальники" to the clothes catalog (`data/catalog.ts`, purely additive — no
  migration). Recognition prompt fix: `size` was left blank whenever a screenshot
  showed a multi-option size-picker even when one option was visually selected;
  prompt now explicitly says to use the selected/highlighted value instead of
  treating it as ambiguous. Build green, deployed (commit `9e80802`).
  **Pending: real-scan test on a product with a size-picker** to confirm it
  actually picks the selected size (and that swimwear classifies correctly).

## Next

**Status (2026-07-06): shipped & live at https://shafka-alpha.vercel.app** (Marharyta's
own Vercel project, imported `margooowa/shafka`, auto-deploy on push to `main`).
Phase 1 (local PWA) + Phase 2 (cloud sync) + AI recognition are all done and deployed.

What's live now:
- **Cloud sync across devices** on Supabase (project `bkxnkwijzttvqmciqbfb`, region
  **eu-west-3**). **Cloud-first writes** — the DB is the source of truth; add/edit/
  delete require the DB and block offline with a message (Dexie is a read cache).
- **Email + password** login (`sanmarso` set for `margooowa91@gmail.com`); emailed
  6-digit code kept as a fallback. Auth session in localStorage → offline viewing OK.
- **Filters:** size · type · season, independent faceted (SHA-15). **Grid density
  toggle** (SHA-18). **Higher photo quality** (1600px/q0.85) + desktop-width layout
  (SHA-17). **PWA auto-update** — deploys self-refresh, no cache-clearing (SHA-16).
- **Photo rotate** in the form (SHA-13). Export/import zip backup (Phase 1).
- **AI recognition (SHA-19):** header scan icon → Claude `opus-4-8` **vision** via a
  Vercel serverless function `api/recognize.ts` (server-only `ANTHROPIC_API_KEY`, VK's
  own key, ~1–2¢/scan) → **multi-item** detect with bounding boxes → each cropped
  (`cropPhoto`, white-padded to a square, no clamp) → background removed and
  re-composited onto white (`whitenBackground`, `@imgly/background-removal`,
  client-side) → `AiReviewSheet` (pick which, per-item type/size, shared child) →
  cloud-first batch add.

Deploy = commit → push `origin/main` → Vercel auto-builds the app + `/api` functions.

Open / optional follow-ups:
1. **Rotate the Supabase DB password** `sanmarso123` if desired (shared in chat during
   setup; the app never uses it — publishable key only).
2. AI crops on busy grids can be loose — could add manual re-crop / box nudge later.
3. Resend custom-email domain — only needed if magic-link/reset emails matter again
   (password login is primary, so optional).
4. Two-person git rule until branch protection exists: pull before work, pull before push.
5. Background-removal engine (~24MB, gzip ~5.6MB) downloads once on first scan per
   browser — could self-host/pin a smaller model tier later if that proves annoying.
6. Linear MCP added to Marharyta's local Claude Code (project-scoped `.mcp.json`,
   `https://mcp.linear.app/sse`) — **still needs her to authenticate via `/mcp`**
   (OAuth to her own `linear.app/shafka` workspace) before it's usable.

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

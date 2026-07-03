# PLAN — Shafka (Шафка), Phase 1 MVP

Kids' wardrobe catalog. Local-first PWA, mobile-first, UI in Ukrainian.
This plan covers architecture, data model, and the Phase 1 step breakdown.
**No code is written until VK says "ok" to this plan.**

---

## 1. Stack (proposed) and why

| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast dev server, standard for React SPAs, first-class PWA plugin |
| UI | React 18 + TypeScript | The `reference/shafka.jsx` prototype is React, so design transfers 1:1. TypeScript catches data-shape mistakes early — important since the data model must survive 4 phases |
| Styling | Tailwind CSS v4 | Fast iteration, easy to encode the agreed design tokens (colors, fonts) as a theme; will be aligned with whatever the prototype uses once `reference/shafka.jsx` is in place |
| Local DB | Dexie 4 (IndexedDB wrapper) | Mature, has **schema versioning built in** (critical: Phases 2–4 will add fields without data loss), and `liveQuery` gives reactive UI updates when data changes |
| PWA | vite-plugin-pwa | Generates manifest + service worker; app shell fully cached → works offline in a store with no signal |
| Zip (backup) | small client-side zip lib | For export/import of JSON + photos. Exact library is a minor detail — decided during implementation, logged in PROJECT.md |

No server, no accounts, no backend of any kind in Phase 1. The only "online" piece is
static file delivery (see §4.5 — stable HTTPS origin).

**Primary target device:** Samsung S26 Ultra, Chrome on Android. Desktop browser is
the dev environment, not the target.

---

## 2. Architecture overview

Single-page app, three layers, all inside the browser:

```
┌───────────────────────────────────────────────┐
│  UI layer (React)                             │
│  storefront grid · filter chips · item form   │
│  child switcher · export/import screen        │
├───────────────────────────────────────────────┤
│  Domain layer                                 │
│  catalogs (sections/categories/size grids)    │
│  photo pipeline (resize → JPEG → thumb)       │
│  backup pipeline (zip in / zip out)           │
├───────────────────────────────────────────────┤
│  Storage layer (Dexie / IndexedDB)            │
│  tables: children · items · photos · settings │
└───────────────────────────────────────────────┘
```

Key principle: **catalogs are code, data is DB.** Size grids, category lists and
section definitions live as versioned constants in the code (they change only with
releases). Items, photos, children live in IndexedDB. Items reference catalog
entries by stable slug, so a UI label can be reworded later without touching data.

---

## 3. Data model (JSON Schema style)

### 3.1 `children`

```json
{
  "id": "uuid",
  "name": "string",
  "accentColor": "string (hex, e.g. #2456C7)",
  "softBg": "string (hex, e.g. #E9EFFB)",
  "sortOrder": "integer"
}
```

Seeded with two rows: Son (#2456C7 / #E9EFFB) and Daughter (#D8447C / #FBE9F1).
A table (not hardcoded) so Phase 4 accounts/sharing don't require a migration of concept.

### 3.2 `items` — the core entity

```json
{
  "id": "uuid",
  "childId": "uuid → children.id",
  "section": "string enum: clothes | shoes | accessories",
  "category": "string slug from the catalog, e.g. 'shorts', 'hats'",
  "size": "string, e.g. '110', '27', '1-3'",
  "season": "string enum | null: summer | demi | winter | all",
  "color": "string | null (free text)",
  "status": "string (open enum): new_with_tag | wearing",
  "tags": "string[] (shoes: summer/winter/sport/dressy; empty otherwise)",
  "note": "string | null",
  "photoId": "uuid | null → photos.id",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

Required: `childId`, `section`, `category`, `size`. Everything else optional.

Design decisions baked in for future phases:

- **`status` is an open string enum** — "outgrown / handed down" and others can be
  added later without migration. UI maps slugs to Ukrainian labels.
- **`size` is always a string**, even for shoes. Sorting is done by the catalog's
  declared order, never lexicographically (so "9" doesn't sort after "110", and
  accessory ranges like "1–3 р." sort correctly).
- **UUIDs everywhere, no autoincrement integers** — Phase 4 sync across devices
  merges without ID collisions.
- **`createdAt` / `updatedAt`** — Phase 4 sync needs them; costs nothing now.
- Phase 2 will add a field like `source: "manual" | "ai"` via a Dexie version bump —
  additive, no data rewrite.

### 3.3 `photos` — separate table, blobs live here

```json
{
  "id": "uuid",
  "full": "Blob (JPEG, ~700 px longest side, quality ~0.72)",
  "thumb": "Blob (JPEG, ~240 px longest side)",
  "width": "integer (of full)",
  "height": "integer (of full)",
  "createdAt": "ISO 8601 string"
}
```

Why a separate table and a pre-generated thumbnail:

- Item list queries never drag megabytes of blobs through memory; the grid loads
  ~10–20 KB thumbs, the full image loads only on the item card.
- Phase 2 (AI recognition) reads the photo independently of the item.
- Phase 3 (outfit combinator) composes photos side by side without touching items.
- Export/import maps cleanly: photos become files in the zip.

### 3.4 `settings` — key/value

```json
{ "key": "string", "value": "any JSON" }
```

Holds: active child, schema version stamp, "persistent storage granted" flag,
last-export date (used to nudge about backups).

### 3.5 Catalogs (code constants, not DB)

```json
{
  "sections": [
    {
      "slug": "clothes", "label": "Одяг",
      "sizes": ["86","92","98","104","110","116","122","128","134","140","146","152"],
      "categories": [
        {"slug":"tshirts","label":"Футболки"},
        {"slug":"longsleeves","label":"Лонгсліви"},
        {"slug":"sweatshirts","label":"Світшоти й светри"},
        {"slug":"pants","label":"Штани"},
        {"slug":"shorts","label":"Шорти"},
        {"slug":"dresses","label":"Сукні та спідниці"},
        {"slug":"outerwear","label":"Верхній одяг"},
        {"slug":"pajamas","label":"Піжами"}
      ]
    },
    {
      "slug": "shoes", "label": "Взуття",
      "sizes": ["22","23","…","38"],
      "categories": [{"slug":"shoes","label":"Взуття"}],
      "tagOptions": [
        {"slug":"summer","label":"літнє"},
        {"slug":"winter","label":"зимове"},
        {"slug":"sport","label":"спортивне"},
        {"slug":"dressy","label":"святкове"}
      ]
    },
    {
      "slug": "accessories", "label": "Аксесуари",
      "sizes": ["1-3","4-7","8plus","onesize"],
      "sizeLabels": {"1-3":"1–3 р.","4-7":"4–7 р.","8plus":"8+ р.","onesize":"Один розмір"},
      "categories": [
        {"slug":"hats","label":"Шапки"},
        {"slug":"mittens","label":"Рукавиці"},
        {"slug":"scarves","label":"Шарфи"},
        {"slug":"other","label":"Інше"}
      ]
    }
  ]
}
```

Shoe sizes: whole sizes 22–38 (no half sizes) — flag if that's wrong.

---

## 4. Key flows

### 4.1 Photo intake
Camera/gallery `file` input → decode (EXIF orientation respected) → downscale to
~700 px longest side → JPEG q≈0.72 (**full**) + ~240 px (**thumb**) → both blobs
into `photos`, `photoId` onto the item. Expected size: ~60–120 KB per item —
hundreds of items are no problem for IndexedDB.

### 4.2 Storefront filtering (the 20-second scenario)
Scope = active child + active section. Within scope:
- chips are rendered **only** for sizes/categories that have ≥1 item;
- each chip shows a live counter ("110 · 7", "Шорти · 4");
- size and category filters combine (AND);
- counters on size chips reflect the category filter and vice versa, so numbers
  always answer "how many will I see if I tap this".
Grid: 3-column thumbnails from `photos.thumb`.

### 4.3 Data safety (non-negotiable)
1. On first launch: request `navigator.storage.persist()` — on Android Chrome with
   an installed PWA this is granted silently, and eviction is effectively off.
2. **Export**: one tap → zip containing `manifest.json` (schema version, export
   date, children, items) + `photos/<id>.jpg` → Android share sheet / download.
   Human-readable format — it doubles as the migration vehicle for any future
   origin change or device swap.
3. **Import**: pick zip → validate manifest → merge by item `id` (re-importing
   your own backup never duplicates). Import into an empty app = full restore.

### 4.4 Offline
Service worker precaches the app shell. In a store with zero signal the app opens
from the home screen and reads IndexedDB — nothing requires the network.

### 4.5 Stable HTTPS origin (decision to confirm)
IndexedDB data is bound to *device + browser + origin*, and a real PWA install
requires HTTPS. Therefore:

- **Dev happens on the Mac** at `localhost` (that data is disposable).
- **The phone uses one canonical URL from day one**: the static build deployed to
  free hosting (recommendation: **Vercel** — no server, no accounts *in the app*,
  data still lives only on the phone; hosting delivers files, nothing else).
- The home-network option (`npm run dev -- --host`, open `http://<mac-ip>:5173`)
  remains available for quick look-and-feel checks from the phone, but is
  explicitly *not* where real data lives: no HTTPS → no install, and its origin is
  throwaway.

This is the one plan item that touches "I've never deployed": step 9 below is a
guided, copy-paste walkthrough. Rollback is trivial (it's just static files).

---

## 5. Folder structure

```
Shafka/
├── PLAN.md              ← this file
├── PROJECT.md           ← logbook: done / next / decisions
├── reference/           ← shafka.jsx prototype (design source of truth for UI)
├── public/              ← PWA icons, favicon
└── src/
    ├── app/             ← shell, child switcher, theming (accent colors)
    ├── data/            ← Dexie schema, catalogs, seed
    ├── features/
    │   ├── wardrobe/    ← storefront grid + filter chips
    │   ├── item/        ← add/edit form, item card
    │   ├── photos/      ← capture + compression pipeline
    │   └── backup/      ← export/import
    └── ui/              ← shared pieces (swing-tag chip, buttons, empty states)
```

---

## 6. Phase 1 — step breakdown

Each step ends with something you can open and touch. Verify instructions given at
each step; commit after each.

| # | Step | You verify by |
|---|---|---|
| 1 | Scaffold: Vite + React + TS + Tailwind, fonts (Unbounded/Rubik), design tokens, app shell with Son/Daughter switcher | `npm run dev` → colors, fonts, accent switching per child |
| 2 | Data layer: Dexie schema, catalogs, seeded children; persistent-storage request | Add-item smoke via a temporary debug panel; reload → data survives |
| 3 | Add-item form (no photo): section → category → size cascade, optional fields; items in a plain list | Add "Шорти 110" for daughter, reload, it's there |
| 4 | Photo pipeline: camera/gallery, compression, thumbs on cards | Photo appears on the card; DevTools shows ~700px JPEG in DB |
| 5 | Storefront: 3-column grid, swing-tag filter chips with counters, only non-empty chips | The 20-second scenario works on desktop |
| 6 | Item card: view, edit, delete, status/season/color/note | Edit and delete an item; counters update live |
| 7 | PWA: manifest, icons, service worker, offline | Airplane-mode reload on localhost still opens the app |
| 8 | Export/import zip | Export → wipe site data → import → everything is back |
| 9 | Deploy to Vercel (guided walkthrough) + install on S26 Ultra | **Acceptance test: the real 20-second scenario, standing at a shelf** |

Steps 1 and 5 lean on `reference/shafka.jsx` for exact visuals and UI copy —
**the file needs to be in `reference/` before step 1 starts.**

---

## 7. What Phase 1 deliberately does NOT block

- **Phase 2 (AI recognition):** photo is a standalone entity; `source` field is an
  additive migration; the confirm-before-save UI slots into the existing add-item
  form. Note: a client-only app cannot hide an API key — Phase 2 will either accept
  a local-only key or add a tiny proxy function. Nothing in Phase 1 assumes either.
- **Phase 3 (outfit combinator):** photos are addressable by ID with known
  dimensions; combining two images is a pure-UI feature.
- **Phase 4 (sync/accounts):** UUIDs, timestamps, per-table export format — a sync
  engine can be added without rewriting local data. The export zip is also the
  escape hatch for any origin/device migration.

## 8. Open items (need VK)

1. **`reference/shafka.jsx` is missing** — drop it into `reference/`. Blocks the
   visual side of steps 1 and 5; everything else can proceed.
2. Shoes: whole sizes 22–38 only — confirm.
3. Vercel as the free static host (you already know its flow from TravCozy) — or
   prefer GitHub Pages / Netlify?

## 9. Minor decisions I'll make alone (and log in PROJECT.md)

Zip library choice, exact thumbnail size, icon generation, Tailwind config details,
form validation messages, empty-state illustrations.

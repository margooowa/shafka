-- Shafka Phase 2 — Cloud schema (SHA-7)
-- Mirrors the local Dexie model (src/data/db.ts). Run once in the Supabase
-- SQL Editor. Safe to re-run: guarded with "if not exists" / "on conflict
-- do nothing" / "drop policy if exists".
--
-- Sync model: every row carries updated_at (last-write-wins) + a `deleted`
-- tombstone flag so deletes propagate across devices (SHA-10). Photo FULL
-- JPEGs live in the private Storage bucket 'photos' at
-- <user_id>/<photo_id>.jpg; thumbnails are regenerated locally on pull.

-- ── Tables ──────────────────────────────────────────────────────────────
create table if not exists public.children (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null,
  accent_color text not null,
  soft_bg      text not null,
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now(),
  deleted      boolean not null default false
);

create table if not exists public.items (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  child_id   uuid not null,
  section    text not null,
  category   text not null,
  size       text not null,
  season     text,
  color      text,
  status     text not null,
  tags       text[] not null default '{}',
  note       text,
  photo_id   uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false
);

create table if not exists public.photos_meta (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  width      integer,
  height     integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false
);

-- Incremental-pull helpers (fetch only rows changed since last sync)
create index if not exists items_user_updated_idx      on public.items       (user_id, updated_at);
create index if not exists children_user_updated_idx   on public.children    (user_id, updated_at);
create index if not exists photos_meta_user_updated_idx on public.photos_meta (user_id, updated_at);

-- ── Row-Level Security: each account sees only its own rows ──────────────
alter table public.children    enable row level security;
alter table public.items       enable row level security;
alter table public.photos_meta enable row level security;

drop policy if exists "children owner"    on public.children;
drop policy if exists "items owner"       on public.items;
drop policy if exists "photos_meta owner" on public.photos_meta;

create policy "children owner" on public.children
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "items owner" on public.items
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "photos_meta owner" on public.photos_meta
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Private Storage bucket for the full-size photo JPEGs ─────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "photos bucket owner" on storage.objects;

create policy "photos bucket owner" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

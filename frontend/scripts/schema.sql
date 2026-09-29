-- Product catalog. Filled by scripts/import-products.mts (idempotent: safe to re-run).
-- The schema's source of truth is now the Alembic baseline (backend/migrations/versions/0001_baseline.py).
-- This file only stays until the importer moves to the backend (architecture plan, phase 7): keep the two in sync.
create extension if not exists pg_trgm;

-- "6205" < "6210" < "62010" when ordering designations
do $$ begin
  create collation natural_sort (provider = icu, locale = 'en-u-kn-true');
exception when duplicate_object then null;
end $$;

create table if not exists products (
  slug           text primary key,
  designation    text not null,
  brand          text not null default 'SKF',
  type           text not null,          -- app type slug (lib/data.ts bearingTypes)
  classification text,                   -- original SKF classification, e.g. "Radial deep groove"
  bore_type      text,                   -- cylindrical | tapered
  seal           text,                   -- app seal code (lib/data.ts SealCode)
  sealing        text,                   -- original SKF sealing text
  d              double precision,       -- bore diameter, mm
  outer_d        double precision,       -- outside diameter, mm
  width          double precision,       -- width, mm
  industries     text[] not null default '{}',
  source         text not null,          -- bbunikoop | bearingworld | both
  search_key     text generated always as (upper(regexp_replace(designation, '[^A-Za-z0-9]', '', 'g'))) stored,
  updated_at     timestamptz not null default now()
);

create index if not exists products_search_key_trgm on products using gin (search_key gin_trgm_ops);
create index if not exists products_type on products (type);
create index if not exists products_d on products (d);
create index if not exists products_industries on products using gin (industries);

-- Supabase exposes the public schema over its REST API; allow reads only. The app connects as postgres, which bypasses RLS.
alter table products enable row level security;
do $$ begin
  create policy "public read" on products for select using (true);
exception when duplicate_object then null;
end $$;
-- RLS doesn't cover TRUNCATE, and Supabase grants anon/authenticated everything by default: make them read-only.
revoke insert, update, delete, truncate, references, trigger on products from anon, authenticated;
grant select on products to anon, authenticated;

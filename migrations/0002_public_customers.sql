-- Public mirror of customer stats, read by the separate como-menu site.
-- The POS pushes stats here via /api/public/sync; guests read their own row
-- via /api/public/customer. The menu itself is served live from code
-- (src/lib/catalog.ts) and needs no table.
create table if not exists public_customers (
  phone text primary key,
  name text not null default '',
  points integer not null default 0,
  stamps integer not null default 0,
  visits integer not null default 0,
  spent bigint not null default 0,
  last_visit bigint not null default 0,
  birthday text not null default '',
  updated_at timestamptz not null default now()
);

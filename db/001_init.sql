-- PAZMUN 2026 tracker — initial schema
-- participants holds everyone who needs a QR credential: delegados, pajes,
-- asesores, and autoridades de comité.

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  qr_code text not null unique,
  full_name text not null,
  role text not null check (role in ('delegado', 'paje', 'asesor', 'autoridad')),
  authority_role text, -- Presidencia / Moderación / Relatoría, only set when role = 'autoridad'
  committee text,
  institution text,
  city text,
  diet text,
  allergy text,
  food_status text not null default 'Pendiente' check (food_status in ('Pendiente', 'Alimentado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists participants_qr_code_idx on participants (qr_code);

alter table participants enable row level security;
-- No policies for anon/authenticated on this table: it's fully locked down.
-- Public reads only happen through the public_profile view below, which
-- exposes non-sensitive columns and runs with the view owner's privileges
-- (default Postgres view behavior), bypassing RLS on the base table while
-- anon still cannot query `participants` directly.

drop view if exists public_profile;
create view public_profile as
  select
    qr_code,
    full_name,
    role,
    authority_role,
    committee,
    institution,
    city
  from participants;

grant select on public_profile to anon;
grant select on public_profile to authenticated;

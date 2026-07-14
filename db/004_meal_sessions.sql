-- Two things the PDF spec calls for that 003 didn't cover:
--
-- 1. "Diferenciación de permisos (visualización vs. edición)" — not every
--    staff account should be able to create meal sessions, so we add a role
--    per account (staff vs admin).
--
-- 2. The event runs multiple days with an unknown number of meals per day,
--    so a single sticky food_status flag can't tell "fed lunch today" from
--    "fed yesterday". Replaced with a check-in log against admin-created
--    meal sessions (e.g. "Día 1 - Almuerzo"), so tracking adapts to however
--    many days/meals the event actually ends up having.

create table if not exists staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table staff_profiles enable row level security;

create policy "staff can read own profile"
  on staff_profiles for select
  to authenticated
  using (id = auth.uid());

create table if not exists meal_sessions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

alter table meal_sessions enable row level security;

create policy "staff can read meal sessions"
  on meal_sessions for select
  to authenticated
  using (true);

create table if not exists meal_checkins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete cascade,
  meal_session_id uuid not null references meal_sessions (id) on delete cascade,
  checked_at timestamptz not null default now(),
  checked_by uuid references auth.users (id),
  unique (participant_id, meal_session_id)
);

alter table meal_checkins enable row level security;

create policy "staff can read meal checkins"
  on meal_checkins for select
  to authenticated
  using (true);

-- Only admins may open a new meal session.
create or replace function staff_create_meal_session(p_label text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_id uuid;
begin
  select role into v_role from staff_profiles where id = auth.uid();
  if v_role is distinct from 'admin' then
    raise exception 'only admins can create meal sessions';
  end if;

  insert into meal_sessions (label, created_by)
  values (p_label, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function staff_create_meal_session(text) from public;
grant execute on function staff_create_meal_session(text) to authenticated;

-- Any staff account can check a participant into an existing session.
-- Idempotent: returns false (no error) if already checked in.
create or replace function staff_checkin_meal(p_qr_code text, p_meal_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id uuid;
begin
  select id into v_participant_id from participants where qr_code = p_qr_code;
  if v_participant_id is null then
    raise exception 'participant not found';
  end if;

  insert into meal_checkins (participant_id, meal_session_id, checked_by)
  values (v_participant_id, p_meal_session_id, auth.uid())
  on conflict (participant_id, meal_session_id) do nothing;

  return found;
end;
$$;

revoke all on function staff_checkin_meal(text, uuid) from public;
grant execute on function staff_checkin_meal(text, uuid) to authenticated;

-- Notes are now the only thing staff_update_food_status covered that still
-- needs a direct editor; food status itself is derived from meal_checkins.
create or replace function staff_update_notes(p_qr_code text, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update participants
  set notes = p_notes, updated_at = now()
  where qr_code = p_qr_code;
end;
$$;

revoke all on function staff_update_notes(text, text) from public;
grant execute on function staff_update_notes(text, text) to authenticated;

drop function if exists staff_update_food_status(text, text, text);

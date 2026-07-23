-- 4.6 pide "diferenciación de permisos (visualización vs. edición)". Hoy
-- cualquier cuenta de staff autenticada puede marcar comidas y editar notas;
-- solo la creación de sesiones está restringida a admin. Agregamos un tercer
-- rol, 'viewer', que puede leer todo (ya cubierto por la policy de select)
-- pero no puede ejecutar las funciones que escriben datos.

alter table staff_profiles drop constraint if exists staff_profiles_role_check;
alter table staff_profiles
  add constraint staff_profiles_role_check
  check (role in ('viewer', 'staff', 'admin'));

create or replace function staff_checkin_meal(p_qr_code text, p_meal_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_participant_id uuid;
begin
  select role into v_role from staff_profiles where id = auth.uid();
  if v_role is null or v_role = 'viewer' then
    raise exception 'not authorized to check in participants';
  end if;

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

create or replace function staff_update_notes(p_qr_code text, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from staff_profiles where id = auth.uid();
  if v_role is null or v_role = 'viewer' then
    raise exception 'not authorized to edit notes';
  end if;

  update participants
  set notes = p_notes, updated_at = now()
  where qr_code = p_qr_code;
end;
$$;

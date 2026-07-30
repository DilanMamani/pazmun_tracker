-- Dashboard y Comidas elegían "la comida actual" cada uno por su cuenta
-- según la hora del cronograma, así que si el staff cambiaba la comida a
-- mano en Comidas (porque el evento va antes/después de lo programado), el
-- Dashboard de todo el resto del staff seguía mostrando otra. is_current es
-- un override compartido: cuando alguien lo activa a mano, gana sobre el
-- cálculo por horario en todas las pantallas y para todo el staff.
alter table meal_sessions add column if not exists is_current boolean not null default false;

-- A lo sumo una comida puede estar marcada como actual a la vez.
create unique index if not exists meal_sessions_one_current
  on meal_sessions (is_current)
  where is_current;

create or replace function staff_set_current_meal_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from staff_profiles where id = auth.uid();
  if v_role is distinct from 'admin' and v_role is distinct from 'staff' then
    raise exception 'no autorizado';
  end if;

  update meal_sessions set is_current = false where is_current;
  update meal_sessions set is_current = true where id = p_session_id;
end;
$$;

revoke all on function staff_set_current_meal_session(uuid) from public;
grant execute on function staff_set_current_meal_session(uuid) to authenticated;

-- Queremos poder ver quién marcó a cada participante como alimentado.
-- checked_by (uuid) ya existía, pero staff_profiles solo permite que cada
-- cuenta lea su propio perfil (RLS), así que un staff no podría resolver el
-- email de otro staff a partir de ese uuid. En vez de abrir esa tabla,
-- guardamos el email directamente en el check-in al momento de crearlo.
alter table meal_checkins add column if not exists checked_by_email text;

create or replace function staff_checkin_meal(p_qr_code text, p_meal_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id uuid;
  v_email text;
begin
  select id into v_participant_id from participants where qr_code = p_qr_code;
  if v_participant_id is null then
    raise exception 'participant not found';
  end if;

  select email into v_email from staff_profiles where id = auth.uid();

  insert into meal_checkins (participant_id, meal_session_id, checked_by, checked_by_email)
  values (v_participant_id, p_meal_session_id, auth.uid(), v_email)
  on conflict (participant_id, meal_session_id) do nothing;

  return found;
end;
$$;

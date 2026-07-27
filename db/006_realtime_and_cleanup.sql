-- 1. food_status quedó muerto desde 004: nadie lo lee ni lo escribe, el
-- estado real vive en meal_checkins (necesario porque el evento tiene
-- varias comidas/días). Dejarlo es engañoso: un valor congelado que
-- parece estado alimentario pero no lo es.
alter table participants drop column if exists food_status;

-- 2. Habilita Postgres Changes (Supabase Realtime) sobre meal_checkins,
-- para que el estado alimentario se actualice en vivo entre dispositivos
-- de staff sin refrescar. Respeta la RLS existente ("staff can read meal
-- checkins"), no requiere policies nuevas.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'meal_checkins'
  ) then
    alter publication supabase_realtime add table meal_checkins;
  end if;
end $$;

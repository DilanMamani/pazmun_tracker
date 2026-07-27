-- El cronograma real tiene varias comidas por día (refrigerios + almuerzos
-- con horarios propios), no una sola comida diaria como se asumió en 007.
-- session_date (solo fecha) no alcanza para elegir automáticamente "la
-- comida actual" entre varias del mismo día — se necesita hora de inicio y
-- fin de cada una.
alter table meal_sessions drop column if exists session_date;
alter table meal_sessions add column if not exists starts_at timestamptz;
alter table meal_sessions add column if not exists ends_at timestamptz;

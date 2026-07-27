-- El evento dura varios días (29 jul - 1 ago) y hasta ahora "la comida
-- actual" en Dashboard/Comidas se elegía por created_at más reciente. Con
-- las 4 fechas precargadas de una sola vez, ese orden ya no refleja qué día
-- es hoy. session_date permite que la app elija automáticamente la sesión
-- del día calendario actual, sin intervención manual del staff.
alter table meal_sessions add column if not exists session_date date;

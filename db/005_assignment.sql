-- What a delegate represents (a country, or for the Nacional/CIJ committees a
-- Bolivian institution or ICJ litigant team) or which outlet a press-corps
-- member covers. Mesa positions (Presidencia/Moderación/Relatoría) already
-- have this via authority_role, so this only gets populated for delegates
-- and press.

alter table participants add column if not exists assignment text;

drop view if exists public_profile;
create view public_profile as
  select
    qr_code,
    full_name,
    role,
    authority_role,
    committee,
    institution,
    city,
    photo_url,
    assignment
  from participants;

grant select on public_profile to anon;
grant select on public_profile to authenticated;

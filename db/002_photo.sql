-- Add photo_url (public: it's an ID-badge headshot, same sensitivity tier as
-- name/committee, already exposed via public_profile).

alter table participants add column if not exists photo_url text;

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
    photo_url
  from participants;

grant select on public_profile to anon;
grant select on public_profile to authenticated;

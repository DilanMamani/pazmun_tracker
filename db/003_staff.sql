-- Staff panel: same /p/:code page shows extra sensitive fields when the
-- viewer is an authenticated staff member (Supabase Auth), instead of a
-- separate route. `authenticated` here means "has a staff account" — there's
-- no public sign-up, accounts are created by hand for real staff.

-- Staff can read every column of every participant.
create policy "staff can read all participants"
  on participants for select
  to authenticated
  using (true);

-- Staff can update food status / notes, but only through this function —
-- not a blanket UPDATE policy — so a staff account can never rewrite a
-- participant's name, committee, role, etc.
create or replace function staff_update_food_status(
  p_qr_code text,
  p_food_status text,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update participants
  set
    food_status = p_food_status,
    notes = p_notes,
    updated_at = now()
  where qr_code = p_qr_code;
end;
$$;

revoke all on function staff_update_food_status(text, text, text) from public;
grant execute on function staff_update_food_status(text, text, text) to authenticated;

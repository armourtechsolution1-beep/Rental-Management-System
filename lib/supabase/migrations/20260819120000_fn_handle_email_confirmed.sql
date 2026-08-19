-- Migration: fn_handle_email_confirmed
-- Ref: RMS Backend Development Plan v1.2, §2.11 addendum (email confirmation gate)
-- Depends on: 20260725130000_core_schema.sql, 20260725140000_triggers.sql
--
-- Closes a gap the frontend plan itself flagged and left open: Supabase's own
-- "Confirm email" setting correctly blocks sign-in at the Auth layer
-- (auth.users.email_confirmed_at), but nothing was ever written to sync that
-- into public.profiles.account_status. fn_handle_new_user only ever *creates*
-- the profiles row at 'pending-verification' (§3.2 default) — no trigger
-- existed to move it forward from there. Since authorize() in
-- lib/auth/auth.config.ts independently re-checks
-- `profile.account_status === 'pending-verification'` as a defensive
-- second gate (intended to be unreachable, per its own comment), a
-- genuinely-confirmed account stayed stuck reporting EMAIL_NOT_CONFIRMED
-- forever — the defensive check was, in practice, the only one that ever
-- fired, because it never had anything to flip it forward.

begin;

-- ============================================================================
-- Auth confirmation -> profiles.account_status (closes the flagged gap)
-- ============================================================================
-- Only ever moves 'pending-verification' -> 'active'. Deliberately guarded so
-- this can never resurrect an account an admin has since suspended/
-- deactivated (§3.2 Layer 1) — those states take precedence over a stale
-- email-confirmation event replaying (e.g. Supabase re-sending the same
-- webhook, or this trigger firing on an unrelated column update matched by
-- the same UPDATE statement).

create function public.fn_handle_email_confirmed() returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
      set account_status = 'active'
      where id = new.id
        and account_status = 'pending-verification';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger trg_on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.fn_handle_email_confirmed();

-- ============================================================================
-- One-off backfill
-- ============================================================================
-- The trigger above only fires on a future UPDATE of email_confirmed_at.
-- Any account confirmed BEFORE this migration ran (e.g. accounts created
-- and confirmed while this gap was still open) had that transition happen
-- with no trigger listening — it will never re-fire on its own. Run once,
-- safe to run again later (idempotent: only touches rows still stuck in
-- 'pending-verification' despite already being confirmed at the Auth layer).

update public.profiles p
set account_status = 'active'
from auth.users u
where p.id = u.id
  and u.email_confirmed_at is not null
  and p.account_status = 'pending-verification';

commit;

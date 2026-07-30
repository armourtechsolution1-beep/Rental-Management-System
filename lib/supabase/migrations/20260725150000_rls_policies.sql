-- Migration: Row Level Security — staged rollout per §2.5
-- Ref: RMS Backend Development Plan v1.2, §2.5, §3.2, §3.11, §6
-- Depends on: 20260725140000_triggers.sql
--
-- RLS is enabled on every table, everywhere — but only public.profiles and
-- public.notifications get real policies in this migration, matching §2.5:
-- those are the two tables a browser client (via supabase-js, under the
-- `anon`/`authenticated` Data API roles) legitimately needs to reach directly
-- — self-read for both, self-update for notifications.is_read (marking read
-- from the NotificationDrawer without a Route Handler round trip).
--
-- Every other table (the eleven across the seven backend-only schemas) gets
-- RLS enabled with zero policies — default-deny. This is intentionally
-- redundant with the schema-level REVOKEs already in place (migration 1):
-- `anon`/`authenticated` have no USAGE on those schemas at all, so they can't
-- even name the tables to be denied by RLS. Enabling RLS here anyway is the
-- second, independent layer described in §6 — it holds even if a schema is
-- ever (mis)exposed later.
--
-- The connection lib/db uses (Supabase's `postgres` role, direct/pooler) has
-- BYPASSRLS, so none of this affects trusted server-side access — it only
-- gates the anon-key/authenticated-key Data API path.

begin;

-- ============================================================================
-- Default-deny: RLS on, no policies, on every backend-only table
-- ============================================================================

alter table people.landlords enable row level security;
alter table people.tenancies enable row level security;
alter table property.properties enable row level security;
alter table property.units enable row level security;
alter table leasing.leases enable row level security;
alter table leasing.rent_schedules enable row level security;
alter table billing.payments enable row level security;
alter table maintenance.maintenance_requests enable row level security;
alter table maintenance.maintenance_request_photos enable row level security;
alter table audit.audit_logs enable row level security;
alter table platform.platform_alerts enable row level security;

-- ============================================================================
-- public.profiles — self-read only (writes go through Route Handlers, §1)
-- ============================================================================

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
-- No insert/update/delete grants: profile creation is the fn_handle_new_user
-- trigger (runs as the bypasses-RLS table owner); profile edits go through
-- an authenticated Route Handler, which validates with Zod and can enforce
-- rules a client-side write couldn't (e.g. a user can never set is_admin).

-- ============================================================================
-- public.notifications — self-read + self-update(is_read) only
-- ============================================================================

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy notifications_update_own on public.notifications
  for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

grant select on public.notifications to authenticated;
-- Column-level grant, not just the row-level policy above: even a crafted
-- request that satisfies the USING/WITH CHECK clause still can't touch
-- title/message/type/etc. — only is_read is writable by the client at all.
grant update (is_read) on public.notifications to authenticated;
-- No insert/delete grants: notifications are written by Route
-- Handlers/triggers, never created or removed by the client.

commit;

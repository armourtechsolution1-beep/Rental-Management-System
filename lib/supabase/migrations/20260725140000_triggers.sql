-- Migration: Triggers and trigger functions
-- Ref: RMS Backend Development Plan v1.2, §3.14
-- Depends on: 20260725130000_core_schema.sql
--
-- Three things, all deliberately deferred out of the previous migration:
--   1. A generic updated_at bump, applied to every table that has the column.
--   2. fn_handle_new_user — auth.users signup -> public.profiles row (§2.1,
--      closes the frontend's originally-open "profiles migration +
--      role-assignment flow" item).
--   3. fn_handle_tenancy_vacated — the vacate workflow (§2.3): archive the
--      lease, free the unit, write a system-attributed audit entry.
--
-- Both SECURITY DEFINER functions set search_path = '' and fully schema-
-- qualify every relation, per Supabase's own guidance for such functions —
-- load-bearing here since fn_handle_tenancy_vacated spans three schemas.

begin;

-- ============================================================================
-- 1. Generic updated_at trigger
-- ============================================================================

create function public.fn_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';

create trigger trg_set_updated_at before update on public.profiles
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on people.landlords
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on property.properties
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on property.units
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on leasing.leases
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on people.tenancies
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on leasing.rent_schedules
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on billing.payments
  for each row execute function public.fn_set_updated_at();
create trigger trg_set_updated_at before update on maintenance.maintenance_requests
  for each row execute function public.fn_set_updated_at();

-- Deliberately NOT applied to: maintenance_request_photos, notifications,
-- audit_logs, platform_alerts — none of these have an updated_at column
-- (§3.10/§3.11/§3.12/§3.13); they're append-only or single-field-toggle
-- tables where the plan didn't call for change tracking.

-- ============================================================================
-- 2. Signup -> profile (§2.1)
-- ============================================================================
-- Assumes the signup form collects f_name / m_name / l_name separately and
-- passes them through raw_user_meta_data (Supabase Auth's per-user metadata
-- bag), per the naming convention in §3.2.

create function public.fn_handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, f_name, m_name, l_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'f_name',
    new.raw_user_meta_data->>'m_name',
    new.raw_user_meta_data->>'l_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ============================================================================
-- 3. The vacated workflow (§2.3)
-- ============================================================================

create function people.fn_handle_tenancy_vacated() returns trigger as $$
begin
  if new.status = 'vacated' and old.status is distinct from 'vacated' then
    update leasing.leases set archived_at = now() where id = new.lease_id;
    update property.units set occupancy_status = 'vacant' where id = new.unit_id;
    insert into audit.audit_logs (actor_type, actor_profile_id, action_type, entity_type, entity_id, before_data, after_data)
      values ('system', null, 'tenancy.vacated', 'tenancies', new.id,
              jsonb_build_object('status', old.status), jsonb_build_object('status', new.status));
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger trg_tenancy_vacated
  after update of status on people.tenancies
  for each row execute function people.fn_handle_tenancy_vacated();

commit;

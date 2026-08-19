-- Migration: Core schema — enums, tables, indexes, constraints
-- Ref: RMS Backend Development Plan v1.2, §3 (all subsections)
-- Depends on: 20260725120000_create_custom_schemas.sql
--
-- Scope: this migration covers exactly what its Phase 1 checklist line says —
-- enums + tables + indexes + constraints. Triggers (fn_handle_new_user,
-- fn_handle_tenancy_vacated, the generic updated_at trigger) are deliberately
-- left for the next migration, matching the plan's own separate checklist item.
--
-- ON DELETE behavior below isn't spelled out in the plan's markdown tables, so
-- it's decided here, table by table, using one consistent policy:
--   - CASCADE  where the child row is meaningless without the parent (a photo
--     without its request, a rent schedule row without its lease).
--   - RESTRICT where deleting the parent would silently destroy load-bearing
--     business/financial history (properties, units, leases, tenancies,
--     tenant/landlord identity links) — force an explicit decision instead.
--   - SET NULL where the reference is informational rather than load-bearing
--     (who reviewed a payment, who created an alert, who acted in an audit
--     entry) — the record should outlive the referenced profile.

begin;

-- ============================================================================
-- Enums (kept in public regardless of which schema uses them — see §3.1)
-- ============================================================================

create type public.account_status        as enum ('active','suspended','pending-verification','deactivated');
create type public.landlord_status       as enum ('active','inactive','suspended');
create type public.tenancy_status        as enum ('upcoming','active','expiring-soon','expired','renewed','terminated','vacated');
create type public.lease_status          as enum ('upcoming','active','expiring-soon','expired','renewed','terminated');
create type public.occupancy_status      as enum ('occupied','vacant','maintenance');
create type public.property_type         as enum ('residential','commercial');
create type public.payment_cycle         as enum ('monthly','yearly');
create type public.rent_schedule_status  as enum ('pending','pending-review','partial-payment','paid','overdue');
create type public.payment_method        as enum ('mpesa','cash','bank-transfer');
create type public.payment_status        as enum ('pending-review','approved','rejected','refunded','failed');
create type public.maintenance_status    as enum ('open','acknowledged','in-progress','resolved');
create type public.maintenance_category  as enum ('plumbing','electrical','structural','appliance','pest-control','general','other');
create type public.notification_type     as enum ('rent-reminder','payment-confirmation','payment-rejected','payment-overdue','maintenance-update','announcement');
create type public.alert_severity        as enum ('info','warning','critical');
create type public.lease_type            as enum ('fixed-term','month-to-month');
create type public.actor_type            as enum ('user','system','cron','webhook');

-- ============================================================================
-- 3.2 public.profiles — Layer 1: identity + access
-- ============================================================================

create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  f_name             text not null,
  m_name             text,
  l_name             text not null,
  email              text not null,
  phone              text,
  avatar_url         text,
  account_status     public.account_status not null default 'pending-verification',
  is_admin           boolean not null default false,
  last_active_role   text,
  last_login_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint uq_profiles_email unique (email),
  constraint chk_profiles_last_active_role
    check (last_active_role is null or last_active_role in ('LANDLORD','TENANT','ADMIN'))
);

create index idx_profiles_account_status on public.profiles (account_status);
create index idx_profiles_is_admin on public.profiles (is_admin);

-- ============================================================================
-- 3.3 people.landlords — Layer 3: person ↔ portfolio
-- ============================================================================

create table people.landlords (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  status         public.landlord_status not null default 'active',
  business_name  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint uq_landlords_profile_id unique (profile_id)
);

-- ============================================================================
-- 3.4 property.properties
-- ============================================================================

create table property.properties (
  id             uuid primary key default gen_random_uuid(),
  landlord_id    uuid not null references people.landlords (id) on delete restrict,
  name           text not null,
  property_type  public.property_type not null,
  address_line   text,
  city           text,
  county         text,
  country        text not null default 'Kenya',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_properties_landlord_id on property.properties (landlord_id);

-- ============================================================================
-- 3.5 property.units
-- ============================================================================

create table property.units (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references property.properties (id) on delete restrict,
  unit_number       text not null,
  unit_type         text,
  bedrooms          int,
  bathrooms         int,
  rent_amount       numeric(12,2) not null,
  occupancy_status  public.occupancy_status not null default 'vacant',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint uq_units_property_unit_number unique (property_id, unit_number)
);

create index idx_units_occupancy_status on property.units (occupancy_status);

-- ============================================================================
-- 3.6 leasing.leases
-- ============================================================================

create table leasing.leases (
  id                      uuid primary key default gen_random_uuid(),
  property_id             uuid not null references property.properties (id) on delete restrict,
  unit_id                 uuid not null references property.units (id) on delete restrict,
  tenant_profile_id       uuid not null references public.profiles (id) on delete restrict,
  landlord_id             uuid not null references people.landlords (id) on delete restrict,
  rental_amount           numeric(12,2) not null,
  payment_cycle           public.payment_cycle not null,
  late_fee_amount         numeric(12,2),
  lease_type              public.lease_type not null default 'fixed-term',
  start_date              date not null,
  end_date                date,
  status                  public.lease_status not null default 'upcoming',
  renewed_from_lease_id   uuid references leasing.leases (id) on delete set null,
  archived_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint chk_leases_end_date_by_type check (
    (lease_type = 'fixed-term' and end_date is not null) or
    (lease_type = 'month-to-month' and end_date is null)
  )
);

create index idx_leases_unit_id on leasing.leases (unit_id);
create index idx_leases_tenant_profile_id on leasing.leases (tenant_profile_id);
create index idx_leases_status on leasing.leases (status);
create index idx_leases_lease_type on leasing.leases (lease_type);

-- ============================================================================
-- 3.7 people.tenancies — Layer 2: person ↔ unit
-- ============================================================================

create table people.tenancies (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles (id) on delete restrict,
  unit_id         uuid not null references property.units (id) on delete restrict,
  lease_id        uuid not null references leasing.leases (id) on delete restrict,
  status          public.tenancy_status not null default 'upcoming',
  move_in_date    date,
  move_out_date   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Prevents two tenants being simultaneously "current" on the same unit —
-- a gap the source documents don't spell out but the schema must enforce.
create unique index uq_tenancies_one_current_per_unit
  on people.tenancies (unit_id)
  where status in ('upcoming','active','expiring-soon');

-- ============================================================================
-- 3.8 leasing.rent_schedules
-- ============================================================================

create table leasing.rent_schedules (
  id                  uuid primary key default gen_random_uuid(),
  lease_id            uuid not null references leasing.leases (id) on delete cascade,
  unit_id             uuid not null references property.units (id) on delete restrict,
  tenant_profile_id   uuid not null references public.profiles (id) on delete restrict,
  period_start        date not null,
  period_end          date not null,
  due_date            date not null,
  amount_due          numeric(12,2) not null,
  amount_paid         numeric(12,2) not null default 0,
  late_fee_applied    numeric(12,2) not null default 0,
  status              public.rent_schedule_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint uq_rent_schedules_lease_period unique (lease_id, period_start)
);

create index idx_rent_schedules_due_date on leasing.rent_schedules (due_date);
create index idx_rent_schedules_status on leasing.rent_schedules (status);
create index idx_rent_schedules_tenant_profile_id on leasing.rent_schedules (tenant_profile_id);

-- ============================================================================
-- 3.9 billing.payments
-- ============================================================================

create table billing.payments (
  id                       uuid primary key default gen_random_uuid(),
  rent_schedule_id         uuid not null references leasing.rent_schedules (id) on delete cascade,
  tenant_profile_id        uuid not null references public.profiles (id) on delete restrict,
  amount                   numeric(12,2) not null,
  method                   public.payment_method not null,
  status                   public.payment_status not null default 'pending-review',
  transaction_reference    text,
  proof_url                text,
  submitted_at             timestamptz not null default now(),
  reviewed_by              uuid references public.profiles (id) on delete set null,
  reviewed_at              timestamptz,
  rejection_reason         text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_payments_rent_schedule_id on billing.payments (rent_schedule_id);
create index idx_payments_status on billing.payments (status);
create index idx_payments_tenant_profile_id on billing.payments (tenant_profile_id);

-- ============================================================================
-- 3.10 maintenance.maintenance_requests + maintenance.maintenance_request_photos
-- ============================================================================

create table maintenance.maintenance_requests (
  id                  uuid primary key default gen_random_uuid(),
  unit_id             uuid not null references property.units (id) on delete restrict,
  tenant_profile_id   uuid not null references public.profiles (id) on delete restrict,
  category            public.maintenance_category not null,
  title               text not null,
  description         text not null,
  status              public.maintenance_status not null default 'open',
  resolved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_maintenance_requests_unit_id on maintenance.maintenance_requests (unit_id);
create index idx_maintenance_requests_tenant_profile_id on maintenance.maintenance_requests (tenant_profile_id);
create index idx_maintenance_requests_status on maintenance.maintenance_requests (status);
create index idx_maintenance_requests_category on maintenance.maintenance_requests (category);

create table maintenance.maintenance_request_photos (
  id                          uuid primary key default gen_random_uuid(),
  maintenance_request_id      uuid not null references maintenance.maintenance_requests (id) on delete cascade,
  storage_path                text not null,
  created_at                  timestamptz not null default now()
);

create index idx_maintenance_request_photos_request_id
  on maintenance.maintenance_request_photos (maintenance_request_id);

-- ============================================================================
-- 3.11 public.notifications
-- ============================================================================

create table public.notifications (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles (id) on delete cascade,
  type                  public.notification_type not null,
  title                 text not null,
  message               text not null,
  related_entity_type   text,
  related_entity_id     uuid,
  is_read               boolean not null default false,
  created_at            timestamptz not null default now()
);

create index idx_notifications_profile_id_is_read on public.notifications (profile_id, is_read);

-- ============================================================================
-- 3.12 audit.audit_logs
-- ============================================================================

create table audit.audit_logs (
  id                  uuid primary key default gen_random_uuid(),
  actor_type          public.actor_type not null,
  actor_profile_id    uuid references public.profiles (id) on delete set null,
  action_type         text not null,
  entity_type         text not null,
  entity_id           uuid not null,
  before_data         jsonb,
  after_data          jsonb,
  metadata            jsonb,
  created_at          timestamptz not null default now(),
  constraint chk_audit_logs_actor_type_profile_pairing
    check ((actor_type = 'user') = (actor_profile_id is not null))
);

create index idx_audit_logs_entity on audit.audit_logs (entity_type, entity_id);
create index idx_audit_logs_actor_profile_id on audit.audit_logs (actor_profile_id);
create index idx_audit_logs_actor_type on audit.audit_logs (actor_type);
create index idx_audit_logs_created_at on audit.audit_logs (created_at);

-- ============================================================================
-- 3.13 platform.platform_alerts
-- ============================================================================

create table platform.platform_alerts (
  id            uuid primary key default gen_random_uuid(),
  message       text not null,
  severity      public.alert_severity not null,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz
);

commit;

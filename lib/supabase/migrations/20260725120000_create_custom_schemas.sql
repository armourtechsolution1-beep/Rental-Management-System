-- Migration: Create custom Postgres schemas for domain separation
-- Ref: RMS Backend Development Plan v1.2, §2.10 / §3.1
--
-- `public` is Supabase's default schema and already exists. In this project it is
-- reserved for exactly two tables (`profiles`, `notifications`) that need direct
-- client access via the Data API (RLS + Realtime). Everything else — landlords,
-- tenancies, properties, units, leases, rent schedules, payments, maintenance,
-- audit logs, platform alerts — lives in one of the seven schemas created below.
--
-- These seven are intentionally NEVER added to
--   Project Settings → Data API → Exposed Schemas
-- and NEVER granted to `anon` / `authenticated` / `service_role`. They are reachable
-- only via a trusted, direct Postgres connection from server-side code — never
-- through PostgREST/supabase-js. See plan §2.10 for the full rationale.
--
-- Two manual, non-SQL steps that pair with this migration (Dashboard, not code):
--   1. Settings → Data API → Exposed schemas: confirm it lists ONLY `public`
--      (and Supabase's own `graphql_public` if GraphQL is enabled). Do not add
--      people / property / leasing / billing / maintenance / audit / platform.
--   2. Settings → Data API → "Automatically expose new tables": confirm this
--      project's setting rather than assume it — Supabase's 2026 default changed
--      to opt-in-only, but existing projects may still be on the old behavior.

begin;

create schema if not exists people;
comment on schema people is
  'Layer 2/3 lifecycle records: landlords, tenancies. Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

create schema if not exists property;
comment on schema property is
  'Properties and units. Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

create schema if not exists leasing;
comment on schema leasing is
  'Leases and rent schedules. Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

create schema if not exists billing;
comment on schema billing is
  'Payments. Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

create schema if not exists maintenance;
comment on schema maintenance is
  'Maintenance requests and photos. Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

create schema if not exists audit;
comment on schema audit is
  'Audit log. Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

create schema if not exists platform;
comment on schema platform is
  'Platform-wide admin broadcasts (alerts). Backend-only, direct-connection access only — RMS Backend Plan §2.10.';

-- Belt-and-suspenders, not a strict requirement: Postgres does not auto-grant USAGE
-- on newly created non-public schemas to anyone, so this statement should be a
-- no-op today. It's included anyway to make the "no Data API access, ever" intent
-- an explicit, self-documenting guarantee in the migration history itself, rather
-- than something that only holds because nobody has granted it yet.
revoke all on schema people, property, leasing, billing, maintenance, audit, platform
  from public, anon, authenticated, service_role;

commit;

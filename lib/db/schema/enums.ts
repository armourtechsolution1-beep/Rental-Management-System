// All enum types live in the `public` Postgres schema regardless of which
// schema's table uses them (RMS Backend Plan §3.1) — so every enum here is
// declared with the top-level `pgEnum`, never a schema-scoped `.enum()`.
//
// These must match `supabase/migrations/20260725130000_core_schema.sql`
// exactly (name + value list + order). This file does not create the types —
// the hand-written SQL migration is the source of truth (§2.10 decision log,
// item 5) — it only describes them so Drizzle can type queries against them.

import { pgEnum } from 'drizzle-orm/pg-core';

export const accountStatus = pgEnum('account_status', [
  'active',
  'suspended',
  'pending-verification',
  'deactivated',
]);

export const landlordStatus = pgEnum('landlord_status', [
  'active',
  'inactive',
  'suspended',
]);

export const tenancyStatus = pgEnum('tenancy_status', [
  'upcoming',
  'active',
  'expiring-soon',
  'expired',
  'renewed',
  'terminated',
  'vacated',
]);

export const leaseStatus = pgEnum('lease_status', [
  'upcoming',
  'active',
  'expiring-soon',
  'expired',
  'renewed',
  'terminated',
]);

export const occupancyStatus = pgEnum('occupancy_status', [
  'occupied',
  'vacant',
  'maintenance',
]);

export const propertyType = pgEnum('property_type', ['residential', 'commercial']);

export const paymentCycle = pgEnum('payment_cycle', ['monthly', 'yearly']);

export const rentScheduleStatus = pgEnum('rent_schedule_status', [
  'pending',
  'pending-review',
  'partial-payment',
  'paid',
  'overdue',
]);

export const paymentMethod = pgEnum('payment_method', ['mpesa', 'cash', 'bank-transfer']);

export const paymentStatus = pgEnum('payment_status', [
  'pending-review',
  'approved',
  'rejected',
  'refunded',
  'failed',
]);

export const maintenanceStatus = pgEnum('maintenance_status', [
  'open',
  'acknowledged',
  'in-progress',
  'resolved',
]);

export const maintenanceCategory = pgEnum('maintenance_category', [
  'plumbing',
  'electrical',
  'structural',
  'appliance',
  'pest-control',
  'general',
  'other',
]);

export const notificationType = pgEnum('notification_type', [
  'rent-reminder',
  'payment-confirmation',
  'payment-rejected',
  'payment-overdue',
  'maintenance-update',
  'announcement',
]);

export const alertSeverity = pgEnum('alert_severity', ['info', 'warning', 'critical']);

export const leaseType = pgEnum('lease_type', ['fixed-term', 'month-to-month']);

export const actorType = pgEnum('actor_type', ['user', 'system', 'cron', 'webhook']);

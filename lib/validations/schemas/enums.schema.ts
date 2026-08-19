import { z } from "zod";

/**
 * Mirrors `lib/db/schema/enums.ts` exactly — same name, same value list,
 * same order. That file is itself a description of
 * `supabase/migrations/20260725130000_core_schema.sql` (the actual source
 * of truth, per Backend Plan §2.10), so if the SQL migration ever adds or
 * reorders a value, `enums.ts` updates first and this file follows it, not
 * the other way around.
 */

export const accountStatusSchema = z.enum([
  "active",
  "suspended",
  "pending-verification",
  "deactivated",
]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

export const landlordStatusSchema = z.enum(["active", "inactive", "suspended"]);
export type LandlordStatus = z.infer<typeof landlordStatusSchema>;

export const tenancyStatusSchema = z.enum([
  "upcoming",
  "active",
  "expiring-soon",
  "expired",
  "renewed",
  "terminated",
  "vacated",
]);
export type TenancyStatus = z.infer<typeof tenancyStatusSchema>;

export const leaseStatusSchema = z.enum([
  "upcoming",
  "active",
  "expiring-soon",
  "expired",
  "renewed",
  "terminated",
]);
export type LeaseStatus = z.infer<typeof leaseStatusSchema>;

export const occupancyStatusSchema = z.enum(["occupied", "vacant", "maintenance"]);
export type OccupancyStatus = z.infer<typeof occupancyStatusSchema>;

export const propertyTypeSchema = z.enum(["residential", "commercial"]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const paymentCycleSchema = z.enum(["monthly", "yearly"]);
export type PaymentCycle = z.infer<typeof paymentCycleSchema>;

export const rentScheduleStatusSchema = z.enum([
  "pending",
  "pending-review",
  "partial-payment",
  "paid",
  "overdue",
]);
export type RentScheduleStatus = z.infer<typeof rentScheduleStatusSchema>;

export const paymentMethodSchema = z.enum(["mpesa", "cash", "bank-transfer"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const paymentStatusSchema = z.enum([
  "pending-review",
  "approved",
  "rejected",
  "refunded",
  "failed",
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const maintenanceStatusSchema = z.enum([
  "open",
  "acknowledged",
  "in-progress",
  "resolved",
]);
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;

export const maintenanceCategorySchema = z.enum([
  "plumbing",
  "electrical",
  "structural",
  "appliance",
  "pest-control",
  "general",
  "other",
]);
export type MaintenanceCategory = z.infer<typeof maintenanceCategorySchema>;

export const notificationTypeSchema = z.enum([
  "rent-reminder",
  "payment-confirmation",
  "payment-rejected",
  "payment-overdue",
  "maintenance-update",
  "announcement",
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const alertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const leaseTypeSchema = z.enum(["fixed-term", "month-to-month"]);
export type LeaseType = z.infer<typeof leaseTypeSchema>;

export const actorTypeSchema = z.enum(["user", "system", "cron", "webhook"]);
export type ActorType = z.infer<typeof actorTypeSchema>;

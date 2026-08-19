/**
 * Shared Zod schema package (Backend Plan §7 Phase 1 / Frontend Plan Phase
 * 1 checklist) — one file per `lib/db/schema/*.ts` domain, mirrored
 * field-for-field. This is the single contract both plans reference: the
 * backend validates Route Handler input/output against these, and the
 * frontend drives RHF forms off the same `create*`/`update*` schemas
 * instead of either side maintaining its own separate copy.
 */

export * from "./common.schema";
export * from "./enums.schema";
export * from "./profile.schema";
export * from "./landlord.schema";
export * from "./tenancy.schema";
export * from "./property.schema";
export * from "./lease.schema";
export * from "./payment.schema";
export * from "./maintenance.schema";
export * from "./platform-alert.schema";
export * from "./audit-log.schema";

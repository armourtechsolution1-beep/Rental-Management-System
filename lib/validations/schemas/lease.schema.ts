import { z } from "zod";
import {
  uuidString,
  numericString,
  dateOnlyString,
  timestampString,
} from "./common.schema";
import { paymentCycleSchema, leaseTypeSchema, leaseStatusSchema, rentScheduleStatusSchema } from "./enums.schema";

/** Mirrors `leasing.leases` (Backend Plan §3.6). */
export const leaseSchema = z.object({
  id: uuidString,
  propertyId: uuidString,
  unitId: uuidString,
  tenantProfileId: uuidString,
  landlordId: uuidString,
  rentalAmount: numericString,
  paymentCycle: paymentCycleSchema,
  lateFeeAmount: numericString.nullable(),
  leaseType: leaseTypeSchema,
  startDate: dateOnlyString,
  // nullable only when leaseType = 'month-to-month' — enforced by
  // chk_leases_end_date_by_type in SQL; mirrored client-side by
  // createLeaseSchema's refine below.
  endDate: dateOnlyString.nullable(),
  status: leaseStatusSchema,
  renewedFromLeaseId: uuidString.nullable(),
  archivedAt: timestampString.nullable(),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Lease = z.infer<typeof leaseSchema>;

/**
 * Lease Creator Wizard input (Frontend Plan §2A View 3, 4-step
 * `MultiStepForm`). `landlordId` is derived server-side from the session,
 * same principle as `createPropertySchema`. Only covers the
 * already-unblocked existing-tenant path (`tenantProfileId` known up
 * front) — the new-tenant/invite-on-create path is still blocked on a
 * backend `POST /api/leases` contract update (§2.11's flagged gap), so
 * this schema doesn't attempt to model that path yet.
 */
export const createLeaseSchema = z
  .object({
    propertyId: uuidString,
    unitId: uuidString,
    tenantProfileId: uuidString,
    rentalAmount: z.coerce.number().positive("Rent must be a positive number"),
    paymentCycle: paymentCycleSchema,
    lateFeeAmount: z.coerce.number().nonnegative().optional(),
    leaseType: leaseTypeSchema,
    startDate: dateOnlyString,
    endDate: dateOnlyString.optional(),
  })
  .refine(
    (data) =>
      data.leaseType === "fixed-term"
        ? Boolean(data.endDate)
        : data.endDate === undefined,
    {
      message:
        "End date is required for a fixed-term lease and must be omitted for month-to-month",
      path: ["endDate"],
    }
  );
export type CreateLeasePayload = z.infer<typeof createLeaseSchema>;

/**
 * Mirrors `leasing.rent_schedules` (Backend Plan §3.8). System-generated
 * from a lease's payment cycle — no create schema, since the frontend
 * never constructs a rent schedule row directly.
 */
export const rentScheduleSchema = z.object({
  id: uuidString,
  leaseId: uuidString,
  unitId: uuidString,
  tenantProfileId: uuidString,
  periodStart: dateOnlyString,
  periodEnd: dateOnlyString,
  dueDate: dateOnlyString,
  amountDue: numericString,
  amountPaid: numericString,
  lateFeeApplied: numericString,
  status: rentScheduleStatusSchema,
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type RentSchedule = z.infer<typeof rentScheduleSchema>;

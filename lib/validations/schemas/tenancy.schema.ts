import { z } from "zod";
import { uuidString, dateOnlyString, timestampString } from "./common.schema";
import { tenancyStatusSchema } from "./enums.schema";

/**
 * Mirrors `people.tenancies` (Backend Plan §3.7) — Layer 3 of the
 * three-layer lifecycle model (`RMS_Description_v2.1`). No
 * `createTenancySchema` here: a tenancy is created as a side effect of
 * lease creation (Lease Creator Wizard, Phase 2 — `tenancies.profile_id`
 * is `NOT NULL`, so a profile has to exist first), not from a standalone
 * "create tenancy" form of its own.
 */
export const tenancySchema = z.object({
  id: uuidString,
  profileId: uuidString,
  unitId: uuidString,
  leaseId: uuidString,
  status: tenancyStatusSchema,
  // nullable at the column level — populated once move-in/move-out
  // actually happens, not necessarily at row creation.
  moveInDate: dateOnlyString.nullable(),
  moveOutDate: dateOnlyString.nullable(),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Tenancy = z.infer<typeof tenancySchema>;

/**
 * Covers the two things a tenancy legitimately gets updated for after
 * creation: status transitions (including the `vacated` trigger from
 * `RMS_Description_v2.1`) and recording move-in/move-out dates.
 */
export const updateTenancySchema = z.object({
  status: tenancyStatusSchema.optional(),
  moveInDate: dateOnlyString.nullable().optional(),
  moveOutDate: dateOnlyString.nullable().optional(),
});
export type UpdateTenancyPayload = z.infer<typeof updateTenancySchema>;

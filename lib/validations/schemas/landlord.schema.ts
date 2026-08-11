import { z } from "zod";
import { uuidString, timestampString } from "./common.schema";
import { landlordStatusSchema } from "./enums.schema";

/**
 * Mirrors `people.landlords` (Backend Plan §3.3). No `createLandlordSchema`
 * — the only path that creates a landlord row is the Register Route
 * Handler's `INSERT INTO people.landlords` (`app/api/auth/register/route.ts`),
 * which needs only `profileId` and is simple enough not to warrant its own
 * schema separate from the record shape below.
 */
export const landlordSchema = z.object({
  id: uuidString,
  // unique — one landlord record per person; status mutates, doesn't
  // multiply (Backend Plan §2.1).
  profileId: uuidString,
  status: landlordStatusSchema,
  businessName: z.string().nullable(),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Landlord = z.infer<typeof landlordSchema>;

/** Editable subset — `profileId` never changes after creation. */
export const updateLandlordSchema = z.object({
  status: landlordStatusSchema.optional(),
  businessName: z.string().nullable().optional(),
});
export type UpdateLandlordPayload = z.infer<typeof updateLandlordSchema>;

import { z } from "zod";
import { uuidString, numericString, timestampString } from "./common.schema";
import { propertyTypeSchema, occupancyStatusSchema } from "./enums.schema";

/** Mirrors `property.properties` (Backend Plan §3.4). */
export const propertySchema = z.object({
  id: uuidString,
  landlordId: uuidString,
  name: z.string().min(1),
  propertyType: propertyTypeSchema,
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  county: z.string().nullable(),
  country: z.string().min(1),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Property = z.infer<typeof propertySchema>;

/**
 * `PropertyFormModal` input (Frontend Plan §3, 3-step `MultiStepForm`,
 * Phase 2). `landlordId` isn't collected here — the Route Handler derives
 * it from the authenticated session, never trusts a client-supplied one.
 */
export const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  propertyType: propertyTypeSchema,
  addressLine: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  county: z.string().trim().min(1).optional(),
  // Defaults to 'Kenya' at the DB level — optional here for the same reason.
  country: z.string().trim().min(1).optional(),
});
export type CreatePropertyPayload = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial();
export type UpdatePropertyPayload = z.infer<typeof updatePropertySchema>;

/** Mirrors `property.units` (Backend Plan §3.5). */
export const unitSchema = z.object({
  id: uuidString,
  propertyId: uuidString,
  unitNumber: z.string().min(1),
  unitType: z.string().nullable(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  rentAmount: numericString,
  occupancyStatus: occupancyStatusSchema,
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Unit = z.infer<typeof unitSchema>;

/**
 * `UnitFormDrawer` input (Frontend Plan §2A View 2) — rent price validated
 * as a positive number, matching the spec exactly. Numbers here (not
 * `numericString`) because this is what RHF hands back from a form input,
 * not what the DB returns — see `common.schema.ts`'s note on the split.
 */
export const createUnitSchema = z.object({
  propertyId: uuidString,
  unitNumber: z.string().trim().min(1, "Unit number is required"),
  unitType: z.string().trim().min(1).optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  rentAmount: z.coerce.number().positive("Rent must be a positive number"),
});
export type CreateUnitPayload = z.infer<typeof createUnitSchema>;

export const updateUnitSchema = createUnitSchema
  .omit({ propertyId: true })
  .partial()
  .extend({
    occupancyStatus: occupancyStatusSchema.optional(),
  });
export type UpdateUnitPayload = z.infer<typeof updateUnitSchema>;

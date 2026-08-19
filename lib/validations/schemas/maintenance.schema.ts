import { z } from "zod";
import { uuidString, timestampString } from "./common.schema";
import { maintenanceCategorySchema, maintenanceStatusSchema } from "./enums.schema";

/** Mirrors `maintenance.maintenance_requests` (Backend Plan §3.10). */
export const maintenanceRequestSchema = z.object({
  id: uuidString,
  unitId: uuidString,
  tenantProfileId: uuidString,
  category: maintenanceCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  status: maintenanceStatusSchema,
  resolvedAt: timestampString.nullable(),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>;

/**
 * Tenant Maintenance Request Portal input (Frontend Plan §2A Tenant View
 * 4). `unitId`/`tenantProfileId` are derived server-side from the tenant's
 * active tenancy, not submitted by the client.
 */
export const createMaintenanceRequestSchema = z.object({
  category: maintenanceCategorySchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required"),
});
export type CreateMaintenanceRequestPayload = z.infer<
  typeof createMaintenanceRequestSchema
>;

/** Landlord Maintenance Board status transition (Frontend Plan §2A Landlord View 5). */
export const updateMaintenanceRequestStatusSchema = z.object({
  status: maintenanceStatusSchema,
});
export type UpdateMaintenanceRequestStatusPayload = z.infer<
  typeof updateMaintenanceRequestStatusSchema
>;

/** Mirrors `maintenance.maintenance_request_photos` (Backend Plan §3.10). */
export const maintenanceRequestPhotoSchema = z.object({
  id: uuidString,
  maintenanceRequestId: uuidString,
  storagePath: z.string().min(1),
  createdAt: timestampString,
});
export type MaintenanceRequestPhoto = z.infer<typeof maintenanceRequestPhotoSchema>;

/** Populated after upload via `FileUploader` → storage bucket (Backend Plan §2.9). */
export const attachMaintenanceRequestPhotoSchema = z.object({
  storagePath: z.string().trim().min(1),
});
export type AttachMaintenanceRequestPhotoPayload = z.infer<
  typeof attachMaintenanceRequestPhotoSchema
>;

import { z } from "zod";
import { uuidString, timestampString } from "./common.schema";
import { alertSeveritySchema } from "./enums.schema";

/** Mirrors `platform.platform_alerts` (Backend Plan §3.13). */
export const platformAlertSchema = z.object({
  id: uuidString,
  message: z.string().min(1),
  severity: alertSeveritySchema,
  isActive: z.boolean(),
  // Nullable at the column level (required by the app at insert time, but
  // must permit null so `on delete set null` can fire) — matches the
  // schema comment in lib/db/schema/platform.ts exactly.
  createdBy: uuidString.nullable(),
  createdAt: timestampString,
  expiresAt: timestampString.nullable(),
});
export type PlatformAlert = z.infer<typeof platformAlertSchema>;

/**
 * Admin System Dashboard input (Frontend Plan §2A Admin View 1).
 * `createdBy` is derived server-side from the session (required at insert
 * time per the schema comment above), never submitted by the client.
 */
export const createPlatformAlertSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  severity: alertSeveritySchema,
  expiresAt: timestampString.optional(),
});
export type CreatePlatformAlertPayload = z.infer<typeof createPlatformAlertSchema>;

export const updatePlatformAlertSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: timestampString.nullable().optional(),
});
export type UpdatePlatformAlertPayload = z.infer<typeof updatePlatformAlertSchema>;

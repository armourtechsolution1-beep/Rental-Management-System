import { z } from "zod";
import { uuidString, timestampString } from "./common.schema";
import { actorTypeSchema } from "./enums.schema";

/**
 * Mirrors `audit.audit_logs` (Backend Plan §3.12). System-written only —
 * no create schema, since nothing in the frontend ever constructs an audit
 * log entry directly; it's read-only for the Admin Audit Logs view
 * (Frontend Plan §2A Admin View 3).
 *
 * `chk_audit_logs_actor_type_profile_pairing` (actorProfileId required iff
 * actorType = 'user') is a DB-level invariant on already-written rows, not
 * something a client-side schema validates on the way in — mirrored here
 * with a `superRefine` anyway so a Route Handler reading rows back out can
 * catch a DB/schema drift early rather than silently accepting a malformed
 * row.
 */
export const auditLogSchema = z
  .object({
    id: uuidString,
    actorType: actorTypeSchema,
    actorProfileId: uuidString.nullable(),
    actionType: z.string().min(1),
    entityType: z.string().min(1),
    entityId: uuidString,
    beforeData: z.record(z.string(), z.unknown()).nullable(),
    afterData: z.record(z.string(), z.unknown()).nullable(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    createdAt: timestampString,
  })
  .superRefine((data, ctx) => {
    const hasProfile = data.actorProfileId !== null;
    const isUser = data.actorType === "user";
    if (hasProfile !== isUser) {
      ctx.addIssue({
        code: "custom",
        path: ["actorProfileId"],
        message:
          "actorProfileId must be set if and only if actorType is 'user'",
      });
    }
  });
export type AuditLog = z.infer<typeof auditLogSchema>;

import { z } from "zod";
import { uuidString, numericString, timestampString } from "./common.schema";
import { paymentMethodSchema, paymentStatusSchema } from "./enums.schema";

/** Mirrors `billing.payments` (Backend Plan §3.9). */
export const paymentSchema = z.object({
  id: uuidString,
  rentScheduleId: uuidString,
  tenantProfileId: uuidString,
  amount: numericString,
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  transactionReference: z.string().nullable(),
  proofUrl: z.string().nullable(),
  submittedAt: timestampString,
  reviewedBy: uuidString.nullable(),
  reviewedAt: timestampString.nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Payment = z.infer<typeof paymentSchema>;

/**
 * Tenant payment submission (Frontend Plan §2A Tenant View 2, Rent Schedule
 * & Payment Submission). `tenantProfileId` is derived server-side from the
 * session — never trusted from the client. `status`/`reviewedBy`/
 * `reviewedAt`/`rejectionReason` are landlord-review-only fields, not part
 * of submission at all.
 */
export const submitPaymentSchema = z.object({
  rentScheduleId: uuidString,
  amount: z.coerce.number().positive("Amount must be a positive number"),
  method: paymentMethodSchema,
  transactionReference: z.string().trim().min(1).optional(),
  // Populated after upload via the FileUploader → storage bucket flow
  // (Backend Plan §2.9), not submitted as a raw file in this JSON payload.
  proofUrl: z.string().trim().min(1).optional(),
});
export type SubmitPaymentPayload = z.infer<typeof submitPaymentSchema>;

/**
 * Landlord review action (Payment Ledger, Frontend Plan §2A Landlord View
 * 4) — approve/reject a pending-review payment.
 */
export const reviewPaymentSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("approved") }),
  z.object({
    status: z.literal("rejected"),
    rejectionReason: z.string().trim().min(1, "A rejection reason is required"),
  }),
]);
export type ReviewPaymentPayload = z.infer<typeof reviewPaymentSchema>;

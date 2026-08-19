import { z } from "zod";

/**
 * Login only validates *presence*, not password strength/complexity — those
 * rules belong to Register (new credentials), never to an existing-password
 * login form.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Register is landlord-only (Frontend Plan §D View 2 / §2.11 Q2) — fields
 * deliberately mirror `public.profiles`'s `f_name`/`m_name`(optional)/`l_name`
 * split exactly (Backend Plan §3.2), so no name-splitting/joining logic is
 * ever needed between this form and the database.
 *
 * Split into a base payload schema (what the Route Handler actually
 * receives and persists) and a form schema (base + `confirmPassword` + the
 * match `refine`) so the client-only confirmation field never has to be
 * stripped out by hand before hitting the API.
 */
const registerBaseFields = z.object({
  fName: z.string().trim().min(1, "First name is required"),
  mName: z.string().trim().optional(),
  lName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  // Baseline length check client-side; Supabase's own project password
  // policy is still the authority server-side (§D View 2 note).
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** What `POST /api/auth/register` receives and validates — no `confirmPassword`. */
export const registerPayloadSchema = registerBaseFields;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;

/** Form-only schema — adds `confirmPassword` + client-side match validation. */
export const registerSchema = registerBaseFields
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Forgot/Reset Password (Frontend Plan §D View 3). Standard Supabase
 * recovery flow operating on `auth.users` directly — no schema/role
 * dependency, so these two schemas are self-contained and don't share
 * fields with the register schemas above beyond the password-match shape.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/**
 * Accept Invite (Frontend Plan §D View 4). Same shape as Reset Password —
 * new password + confirm only, name/email already set by the landlord when
 * the lease was created — so this is a plain alias rather than a
 * duplicated schema.
 */
export const acceptInviteSchema = resetPasswordSchema;

export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

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

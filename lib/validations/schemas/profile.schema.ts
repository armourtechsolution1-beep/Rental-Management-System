import { z } from "zod";
import { uuidString, timestampString } from "./common.schema";
import { accountStatusSchema, notificationTypeSchema } from "./enums.schema";

/**
 * Mirrors `public.profiles` (Backend Plan §3.2). No `role` field and no
 * single `name` field — matches `types/user.types.ts`'s `AppUser` exactly,
 * for the same reason: role is a derived relationship, never a stored
 * column, and name is split into `fName`/`mName`(nullable)/`lName`.
 *
 * There's no `createProfileSchema` here — profile rows are only ever
 * created by `fn_handle_new_user` (Backend Plan §3.2) or by the Register
 * Route Handler's `signUp()` call (see `lib/validations/auth.schema.ts`),
 * never by a direct client-facing "create profile" form.
 */
export const profileSchema = z.object({
  id: uuidString,
  fName: z.string().min(1),
  mName: z.string().nullable(),
  lName: z.string().min(1),
  email: z.email(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  accountStatus: accountStatusSchema,
  isAdmin: z.boolean(),
  // 'LANDLORD' | 'TENANT' | 'ADMIN' | null — a plain string column in
  // Postgres (chk_profiles_last_active_role enforces the value set at the
  // DB level, not a pg enum), so this stays a string here too rather than
  // reusing the `Role` union and risking the two silently drifting apart.
  lastActiveRole: z.string().nullable(),
  lastLoginAt: timestampString.nullable(),
  createdAt: timestampString,
  updatedAt: timestampString,
});
export type Profile = z.infer<typeof profileSchema>;

/** Editable subset — everything else on `profiles` is system-managed. */
export const updateProfileSchema = z.object({
  fName: z.string().min(1).optional(),
  mName: z.string().nullable().optional(),
  lName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;

/**
 * Mirrors `public.notifications` (Backend Plan §3.11). System/trigger-
 * generated — no `createNotificationSchema`, since the frontend never
 * constructs one directly; it only reads and marks them read.
 */
export const notificationSchema = z.object({
  id: uuidString,
  profileId: uuidString,
  type: notificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  relatedEntityType: z.string().nullable(),
  relatedEntityId: uuidString.nullable(),
  isRead: z.boolean(),
  createdAt: timestampString,
});
export type Notification = z.infer<typeof notificationSchema>;

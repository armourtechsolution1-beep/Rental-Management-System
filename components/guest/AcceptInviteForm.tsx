"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/guest/PasswordInput";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  acceptInviteSchema,
  type AcceptInviteFormValues,
} from "@/lib/validations/auth.schema";

interface AcceptInviteFormProps {
  /**
   * Personalizes the "You've been invited by ..." copy. Sourced from the
   * invite session's `user_metadata` by `AcceptInviteFlow` — undefined
   * falls back to generic copy, since the exact metadata key landlords'
   * names get stored under isn't a settled contract yet (the
   * `admin.inviteUserByEmail()` call itself is Phase 2 work — see the
   * flagged backend gap in §2.11).
   */
  landlordName?: string;
}

/**
 * New password + confirm only — name/email are already set (provided by
 * the landlord when creating the lease), not re-collected here (§D View 4).
 * Updates the password directly against the session Supabase's invite link
 * already established — no Route Handler, same reasoning as Reset
 * Password: the browser legitimately holds a scoped, single-purpose
 * Supabase session already.
 */
export function AcceptInviteForm({ landlordName }: AcceptInviteFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const onSubmit = async ({ password }: AcceptInviteFormValues) => {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(
        "Could not set your password. Please ask your landlord to resend your invite."
      );
      return;
    }

    // Consistent with Register/Reset Password's "confirm, then log in
    // separately" pattern — no auto-established full session here either.
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {landlordName
            ? `You've been invited to RMS by ${landlordName}`
            : "You've been invited to RMS"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Set a password to activate your account.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Activate account
        </Button>
      </form>
    </div>
  );
}

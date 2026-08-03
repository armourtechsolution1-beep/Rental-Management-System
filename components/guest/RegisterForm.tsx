"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/guest/PasswordInput";
import { apiClient, ApiError } from "@/lib/api";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth.schema";

/**
 * Self-service signup — landlord-only (Frontend Plan §D View 2 / §2.11 Q2).
 * Tenants never reach this form; they come in via Accept Invite (§D View 4)
 * instead, since `tenancies.profile_id` is `NOT NULL` and a lease has to
 * exist before a tenant profile can reference it.
 *
 * Deliberately does not sign the person in on success — Register's pattern
 * is "confirm your email, then log in separately," not an auto-established
 * session, since `account_status` starts `pending-verification` and
 * Supabase's own "Confirm email" project setting blocks sign-in until then.
 */
export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);

    // confirmPassword is a client-only match check — the payload schema
    // (and therefore the Route Handler) never sees it.
    const payload = {
      fName: values.fName,
      mName: values.mName,
      lName: values.lName,
      email: values.email,
      password: values.password,
    };

    try {
      await apiClient.post("/auth/register", payload, { silent: true });
      setSubmittedEmail(values.email);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  };

  if (submittedEmail) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>.
            Confirm your account, then sign in below.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Create your landlord account
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your properties, leases, and rent collection in one place.
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="fName" className="text-sm font-medium text-foreground">
              First name
            </label>
            <Input
              id="fName"
              autoComplete="given-name"
              placeholder="Jane"
              aria-invalid={Boolean(errors.fName)}
              {...register("fName")}
            />
            {errors.fName && (
              <p className="text-xs text-destructive">{errors.fName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lName" className="text-sm font-medium text-foreground">
              Last name
            </label>
            <Input
              id="lName"
              autoComplete="family-name"
              placeholder="Doe"
              aria-invalid={Boolean(errors.lName)}
              {...register("lName")}
            />
            {errors.lName && (
              <p className="text-xs text-destructive">{errors.lName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="mName" className="text-sm font-medium text-foreground">
            Middle name{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="mName"
            autoComplete="additional-name"
            placeholder="Wanjiru"
            aria-invalid={Boolean(errors.mName)}
            {...register("mName")}
          />
          {errors.mName && (
            <p className="text-xs text-destructive">{errors.mName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

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
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

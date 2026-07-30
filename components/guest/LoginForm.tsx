"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/guest/PasswordInput";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth.schema";
import { ROLE_HOME } from "@/lib/constants/routes";

export interface LoginFormProps {
  /**
   * Where to send the user after a successful sign-in. Populated by
   * middleware's `?callbackUrl=` when it redirected an unauthenticated
   * visitor here from a protected route. Falls back to `ROLE_HOME[activeRole]`
   * when absent — e.g. someone arriving at /login directly.
   */
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      // authorize() throws a distinct EmailNotConfirmedError (code
      // "EMAIL_NOT_CONFIRMED") when Supabase reports the account's email
      // isn't confirmed yet — surfaced here as a specific, actionable
      // message rather than the generic invalid-credentials one (Frontend
      // Plan §D View 1). Every other authorize() failure (wrong password,
      // unknown email, suspended account) collapses to the same generic
      // message by design — it never leaks which one.
      if (result?.error === "EMAIL_NOT_CONFIRMED") {
        setFormError(
          "Please confirm your email before signing in. Check your inbox for the confirmation link."
        );
      } else {
        setFormError("Incorrect email or password. Please try again.");
      }
      return;
    }

    // redirect:false means NextAuth never navigated for us — the session
    // cookie is set, so re-read it to get availableRoles/activeRole written
    // by the jwt/session callbacks, then decide where "home" is.
    const session = await getSession();
    const activeRole = session?.user?.activeRole;
    const destination = callbackUrl || (activeRole ? ROLE_HOME[activeRole] : "/");

    router.push(destination);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your properties, rent, and maintenance requests.
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

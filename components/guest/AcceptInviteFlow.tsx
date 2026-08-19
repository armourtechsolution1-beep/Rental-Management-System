"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AcceptInviteForm } from "@/components/guest/AcceptInviteForm";

type Mode = "verifying" | "ready" | "invalid";

/**
 * `/invite/[token]` (Frontend Plan §D View 4). Same underlying mechanism as
 * Reset Password's `ForgotPasswordFlow`: Supabase's client parses the
 * invite link's tokens from the URL fragment and establishes a scoped
 * session — there's no `SIGNED_UP`/`INVITE`-specific auth event to key off
 * (Supabase's own `AuthChangeEvent` union only special-cases
 * `PASSWORD_RECOVERY`; an accepted invite fires the ordinary `SIGNED_IN`),
 * so this checks for an established session directly instead.
 *
 * Unlike Forgot Password, an invalid/expired token gets its own error
 * state rather than falling back to anything resembling the normal form —
 * the person needs to know to ask their landlord to resend the invite,
 * not assume they mistyped a password (§D View 4).
 */
export function AcceptInviteFlow() {
  const [mode, setMode] = useState<Mode>("verifying");
  const [landlordName, setLandlordName] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Supabase appends `error=...&error_code=...` to the fragment for an
    // expired or already-used invite link — checked before anything else.
    if (window.location.hash.includes("error=")) {
      setMode("invalid");
      return;
    }

    const applySession = (userMetadata: Record<string, unknown> | undefined) => {
      // ASSUMPTION, flagged: the actual key a landlord's display name gets
      // stored under isn't a settled contract yet — `admin.inviteUserByEmail()`
      // itself is Phase 2 work (§2.11's flagged backend gap). `landlord_name`
      // is a placeholder; update this once that contract lands.
      const name = userMetadata?.landlord_name;
      setLandlordName(typeof name === "string" ? name : undefined);
      setMode("ready");
    };

    // Covers the case where the session was already established (e.g. the
    // SIGNED_IN event fired before this listener attached).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        applySession(session.user.user_metadata);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        applySession(session.user.user_metadata);
      }
    });

    // A genuine invite link resolves near-instantly. If nothing's landed
    // after a few seconds, treat it the same as an explicit error param —
    // most likely a stale/direct visit to this URL with no active invite.
    const timeout = window.setTimeout(() => {
      setMode((current) => (current === "verifying" ? "invalid" : current));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  if (mode === "invalid") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            This invite link is no longer valid
          </h1>
          <p className="text-sm text-muted-foreground">
            It may have expired or already been used. Ask your landlord to
            resend your invite.
          </p>
        </div>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  if (mode === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Verifying your invite…
      </div>
    );
  }

  return <AcceptInviteForm landlordName={landlordName} />;
}

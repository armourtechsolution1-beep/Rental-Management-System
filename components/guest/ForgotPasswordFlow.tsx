"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ForgotPasswordForm } from "@/components/guest/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/guest/ResetPasswordForm";

type Mode = "forgot" | "reset";

/**
 * `/forgot-password` is a single route serving both halves of the recovery
 * flow (Frontend Plan §2.11/§D View 3) — there is deliberately no separate
 * `/reset-password` page, and `PUBLIC_PATHS` has exactly one entry for this
 * flow, not two.
 *
 * `ForgotPasswordForm` renders by default. Once Supabase's client detects
 * the person arrived via a recovery link (it parses the `type=recovery`
 * token in the URL fragment and establishes a scoped session), this swaps
 * in `ResetPasswordForm` instead.
 */
export function ForgotPasswordFlow() {
  const [mode, setMode] = useState<Mode>("forgot");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Same-tick hint from the URL fragment itself, so someone arriving from
    // a real recovery email doesn't briefly see ForgotPasswordForm flash
    // before the auth event below confirms it.
    if (window.location.hash.includes("type=recovery")) {
      setMode("reset");
    }

    // The authoritative signal: Supabase fires PASSWORD_RECOVERY via
    // onAuthStateChange once it's parsed the link and established the
    // recovery session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return mode === "reset" ? <ResetPasswordForm /> : <ForgotPasswordForm />;
}

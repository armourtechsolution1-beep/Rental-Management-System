"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiClient, ApiError } from "@/lib/api";
import { ROLE_HOME } from "@/lib/constants/routes";
import type { Role } from "@/types/user.types";

const ROLE_WORKSPACE_LABEL: Record<Role, string> = {
  LANDLORD: "Landlord workspace",
  TENANT: "Tenant workspace",
  ADMIN: "Admin workspace",
};

/**
 * Instagram-style workspace switcher (Frontend Plan §2.11/§3) — meant to be
 * rendered as a fragment of `DropdownMenuItem`s inside `TopHeader`'s avatar
 * `DropdownMenuContent`. Only ever mounted by the caller when
 * `session.user.availableRoles.length > 1`; this component doesn't gate on
 * that itself, since `TopHeader` already decides whether to include it at
 * all — it isn't responsible for its own visibility.
 *
 * KNOWN GAP: `PATCH /api/profiles/active-role` is not yet built server-side
 * (Backend Plan §7 Phase 1 checklist — still open). Wired against that
 * contract now so nothing here needs to change once it lands; until then,
 * selecting a workspace surfaces an error via `apiClient`'s normal
 * error-toast handling.
 */
export function AccountSwitcher() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [switchingTo, setSwitchingTo] = useState<Role | null>(null);

  if (!session?.user) return null;

  const { availableRoles, activeRole } = session.user;

  const handleSwitch = async (role: Role) => {
    if (role === activeRole || switchingTo) return;

    setSwitchingTo(role);
    try {
      await apiClient.patch("/profiles/active-role", { role });
      // Forces the jwt callback's trigger === 'update' branch, re-running
      // lib/db's role query so activeRole (and availableRoles, in the rare
      // case it changed server-side since login) is reflected immediately.
      await update();
      router.push(ROLE_HOME[role]);
    } catch (err) {
      // Swallow here rather than re-throw — apiClient's own response
      // interceptor already toasts non-validation errors, so surfacing a
      // second error here would just be redundant.
      if (!(err instanceof ApiError)) {
        console.error("[AccountSwitcher] Unexpected error switching role:", err);
      }
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Switch workspace
      </DropdownMenuLabel>
      {availableRoles.map((role) => (
        <DropdownMenuItem
          key={role}
          onSelect={(event) => {
            event.preventDefault();
            void handleSwitch(role);
          }}
          disabled={Boolean(switchingTo)}
          className="flex items-center justify-between gap-2"
        >
          <span>{ROLE_WORKSPACE_LABEL[role]}</span>
          {switchingTo === role ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : role === activeRole ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
    </>
  );
}

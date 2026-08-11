import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import type { Role } from "@/types/user.types";

export interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

/**
 * Root layout for every authenticated route (Frontend Plan §3 Layout
 * Components) — fixed desktop sidebar + sticky top header + scrollable
 * main content. Mounted once per role group
 * (`app/(landlord|tenant|admin)/layout.tsx`), each passing its own literal
 * `role` rather than reading `session.activeRole` — middleware's
 * `PROTECTED_PREFIXES` already guarantees the two agree for any request
 * that reaches this far, so there's no risk of the nav briefly showing the
 * wrong role's links while a role switch is still in flight.
 *
 * Wraps in its own `TooltipProvider` (collapsed-sidebar icon labels need
 * one) rather than adding it to the root `AppProviders` — no other part of
 * the app currently needs tooltips, so scoping it here keeps that
 * dependency visible at the point it's actually used.
 */
export function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden md:block">
          <Sidebar role={role} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader role={role} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

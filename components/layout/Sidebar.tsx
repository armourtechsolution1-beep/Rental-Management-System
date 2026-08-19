"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { ROLE_NAV_ITEMS } from "@/lib/constants/nav";
import type { Role } from "@/types/user.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SidebarProps {
  role: Role;
  /**
   * `desktop` (default) is the fixed, collapsible rail. `mobile` renders
   * the same nav content for use inside `TopHeader`'s `Sheet` drawer —
   * always full-width, no collapse control, and calls `onNavigate` after a
   * link is clicked so the drawer closes.
   */
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

/**
 * Role-aware nav (Frontend Plan §3 Layout Components). Collapsed state is
 * `ui.store`'s `sidebarCollapsed` (persisted) — only meaningful for the
 * desktop variant; the mobile drawer variant ignores it and always renders
 * full-width, since a collapsed icon-only rail inside a Sheet has no room
 * to save.
 */
export function Sidebar({ role, variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const items = ROLE_NAV_ITEMS[role];
  const isCollapsed = variant === "desktop" && collapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        variant === "desktop" && "transition-[width] duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border px-4",
          isCollapsed && "justify-center px-0"
        )}
      >
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          {!isCollapsed && (
            <span className="text-base font-semibold tracking-tight">RMS</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          const link = (
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          if (!isCollapsed) {
            return <div key={item.href}>{link}</div>;
          }

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {variant === "desktop" && (
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronsLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

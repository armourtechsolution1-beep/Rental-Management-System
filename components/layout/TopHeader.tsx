"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/stores/notification.store";
import { ROLE_LABELS, ROLE_NAV_ITEMS } from "@/lib/constants/nav";
import { AccountSwitcher } from "@/components/shared/AccountSwitcher/AccountSwitcher";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Role } from "@/types/user.types";

export interface TopHeaderProps {
  role: Role;
}

/**
 * Breadcrumb, notification bell, avatar area (Frontend Plan §3 Layout
 * Components). Avatar area hosts `AccountSwitcher` when
 * `session.user.availableRoles.length > 1`, otherwise a plain profile menu
 * (§2.11) — both live inside the same dropdown, `AccountSwitcher` just
 * conditionally prepended.
 *
 * The bell wires straight to `notification.store.ts` (already built) but
 * doesn't render `NotificationDrawer` itself — that component isn't built
 * yet (§3 Layout Components table still lists it "not started"), so
 * clicking the bell currently just opens/closes the store's boolean with
 * nothing listening for it yet.
 */
export function TopHeader({ role }: TopHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const toggleDrawer = useNotificationStore((s) => s.toggleDrawer);

  const currentItem = ROLE_NAV_ITEMS[role].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const user = session?.user;
  const initials = user
    ? `${user.fName?.[0] ?? ""}${user.lName?.[0] ?? ""}`.toUpperCase()
    : "";
  const showAccountSwitcher = (user?.availableRoles.length ?? 0) > 1;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile drawer variant — Sidebar's fixed desktop rail is hidden below md */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              role={role}
              variant="mobile"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex items-center gap-1.5">
            <li className="text-muted-foreground">{ROLE_LABELS[role]}</li>
            {currentItem && (
              <>
                <li aria-hidden="true" className="text-muted-foreground">
                  /
                </li>
                <li className="font-medium text-foreground">
                  {currentItem.label}
                </li>
              </>
            )}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          onClick={toggleDrawer}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive"
              aria-hidden="true"
            />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-muted"
              aria-label="Account menu"
            >
              <Avatar size="sm">
                {user?.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{initials || "?"}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {user?.fName} {user?.lName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {showAccountSwitcher && <AccountSwitcher />}
            <DropdownMenuItem
              onSelect={() => void signOut({ redirect: true, redirectTo: "/login" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

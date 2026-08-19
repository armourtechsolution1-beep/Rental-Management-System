import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  FileText,
  Wallet,
  Wrench,
  BarChart3,
  Receipt,
  Bell,
  Users,
  ShieldCheck,
  Settings,
  ScrollText,
} from "lucide-react";
import type { Role } from "@/types/user.types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Human-readable label for each workspace — used in TopHeader's breadcrumb root. */
export const ROLE_LABELS: Record<Role, string> = {
  LANDLORD: "Landlord",
  TENANT: "Tenant",
  ADMIN: "Admin",
};

/**
 * Drives `Sidebar`'s nav links (Frontend Plan §3 Layout Components).
 * One entry per View from §2A's Module-by-Module Breakdown, in the same
 * order the views are documented there, and matching the existing
 * `app/(landlord|tenant|admin)/**` directory structure exactly.
 */
export const ROLE_NAV_ITEMS: Record<Role, NavItem[]> = {
  LANDLORD: [
    { label: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
    { label: "Properties", href: "/landlord/properties", icon: Building2 },
    { label: "Units", href: "/landlord/units", icon: DoorOpen },
    { label: "Leases", href: "/landlord/leases", icon: FileText },
    { label: "Payments", href: "/landlord/payments", icon: Wallet },
    { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench },
    { label: "Reports", href: "/landlord/reports", icon: BarChart3 },
  ],
  TENANT: [
    { label: "Dashboard", href: "/tenant/dashboard", icon: LayoutDashboard },
    { label: "Rent", href: "/tenant/rent", icon: Receipt },
    { label: "Payments", href: "/tenant/payments", icon: Wallet },
    { label: "Maintenance", href: "/tenant/maintenance", icon: Wrench },
    { label: "Notifications", href: "/tenant/notifications", icon: Bell },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Landlords", href: "/admin/landlords", icon: ShieldCheck },
    { label: "System", href: "/admin/system", icon: Settings },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  ],
};

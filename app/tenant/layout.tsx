import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="TENANT">{children}</DashboardShell>;
}

import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="LANDLORD">{children}</DashboardShell>;
}

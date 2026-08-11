import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Landlords | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 5 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function LandlordsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Landlords" description="Manage landlord accounts and status." icon={ShieldCheck} />
      <EmptyState
        icon={ShieldCheck}
        title="Coming in Phase 5"
        description="Manage landlord accounts and status."
      />
    </div>
  );
}

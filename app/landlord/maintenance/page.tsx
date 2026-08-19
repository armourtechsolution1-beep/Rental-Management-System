import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Maintenance Board | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 4 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance Board" description="Track maintenance requests across your units." icon={Wrench} />
      <EmptyState
        icon={Wrench}
        title="Coming in Phase 4"
        description="Track maintenance requests across your units."
      />
    </div>
  );
}

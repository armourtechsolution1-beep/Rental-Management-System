import type { Metadata } from "next";
import { DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Units | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 2 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function UnitsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Units" description="Manage units across your properties." icon={DoorOpen} />
      <EmptyState
        icon={DoorOpen}
        title="Coming in Phase 2"
        description="Manage units across your properties."
      />
    </div>
  );
}

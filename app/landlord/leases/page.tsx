import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Leases | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 2 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function LeasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leases" description="Create and manage tenant leases." icon={FileText} />
      <EmptyState
        icon={FileText}
        title="Coming in Phase 2"
        description="Create and manage tenant leases."
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Properties | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 2 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Properties" description="Manage your property directory." icon={Building2} />
      <EmptyState
        icon={Building2}
        title="Coming in Phase 2"
        description="Manage your property directory."
      />
    </div>
  );
}

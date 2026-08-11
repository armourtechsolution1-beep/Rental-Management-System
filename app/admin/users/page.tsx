import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "User Management | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 5 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage every profile on the platform." icon={Users} />
      <EmptyState
        icon={Users}
        title="Coming in Phase 5"
        description="Manage every profile on the platform."
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Notifications | RMS",
};

/**
 * Placeholder — Dashboard shell Phase 1 (Frontend Plan §4 checklist).
 * Real content lands in Phase 3 per the Module-by-Module Breakdown
 * (§2A); this page exists now so the route, layout, and nav link are all
 * wired end-to-end ahead of that.
 */
export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Rent reminders, payment updates, and announcements." icon={Bell} />
      <EmptyState
        icon={Bell}
        title="Coming in Phase 3"
        description="Rent reminders, payment updates, and announcements."
      />
    </div>
  );
}

import { cn } from "@/lib/utils";

/**
 * Every status value StatusBadge knows how to render.
 *
 * IMPORTANT — naming convention:
 * This is one flat union shared by every domain, so variant *names* must be
 * unambiguous on their own — the badge only ever receives a bare string, with
 * no surrounding context to disambiguate it.
 *
 * Most domains only ever render in one table, so their statuses stay short
 * (e.g. "active" for a lease document). But Account Status, Tenancy Status,
 * and Landlord Status are designed to sit side-by-side as separate columns
 * in the same admin table row (e.g. "Account: Active | Tenancy: Vacated"),
 * so their variants are explicitly prefixed (`account-active`,
 * `tenancy-active`, `landlord-active`) to stay distinct from each other and
 * from the unprefixed lease-document "active".
 *
 * See RMS_Description_v2.md, "User, Tenancy & Landlord Lifecycle Model" for
 * the business rules behind the three-layer (Account / Tenancy / Landlord)
 * design and why they are modeled as independent lifecycles rather than a
 * single user-role status.
 */
export type StatusVariant =
  // Payments
  | "paid"
  | "pending"
  | "pending-review"
  | "overdue"
  | "rejected"
  | "approved"
  | "partial-payment"
  | "refunded"
  | "failed"
  // Maintenance
  | "open"
  | "in-progress"
  | "resolved"
  | "acknowledged"
  // Leases (the lease document itself)
  | "upcoming"
  | "active"
  | "expiring-soon"
  | "expired"
  | "renewed"
  | "terminated"
  // Tenancy record (person ↔ unit relationship lifecycle — distinct from
  // the lease document; only the tenancy relationship can be "vacated")
  | "tenancy-upcoming"
  | "tenancy-active"
  | "tenancy-expiring-soon"
  | "tenancy-expired"
  | "tenancy-renewed"
  | "tenancy-terminated"
  | "tenancy-vacated"
  // Units / occupancy
  | "occupied"
  | "vacant"
  | "maintenance"
  // Landlord record (person ↔ portfolio relationship lifecycle)
  | "landlord-active"
  | "landlord-inactive"
  | "landlord-suspended"
  // User account (identity + platform access only — never implies a role)
  | "account-active"
  | "account-suspended"
  | "account-pending-verification"
  | "account-deactivated";

interface StatusConfig {
  label: string;
  className: string;
}

/**
 * Color tokens reference the shadcn "Nova" semantic palette (oklch-based)
 * rather than hardcoded Tailwind colors, so the badge stays correct across
 * light/dark mode without a separate dark: variant on every entry.
 *
 * If a status conceptually maps to an existing color (e.g. "resolved" reads
 * the same as "paid" — both are a successful terminal state), they intentionally
 * reuse the same className string rather than duplicating a near-identical class.
 */
const STATUS_CONFIG: Record<StatusVariant, StatusConfig> = {
  // Payments
  paid: {
    label: "Paid",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  pending: {
    label: "Pending",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  "pending-review": {
    label: "Pending Review",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  overdue: {
    label: "Overdue",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },
  approved: {
    label: "Approved",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  "partial-payment": {
    // Distinct from "pending": money has landed, but not the full amount
    // due — still needs attention, so it shares the warning tone rather
    // than reading as a fully resolved success state.
    label: "Partial Payment",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  refunded: {
    // Neutral/informational terminal state — money moved, but it's not a
    // "good" (paid) or "bad" (failed) outcome, so it gets its own info tone.
    label: "Refunded",
    className: "bg-info/15 text-info border-info/20 dark:bg-info/10",
  },
  failed: {
    // Reserved for gateway-side failures (e.g. a future Daraja API decline),
    // distinct from "rejected" which is a landlord's manual review decision.
    label: "Failed",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },

  // Maintenance
  open: {
    label: "Open",
    className: "bg-info/15 text-info border-info/20 dark:bg-info/10",
  },
  "in-progress": {
    label: "In Progress",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  acknowledged: {
    label: "Acknowledged",
    className: "bg-info/15 text-info border-info/20 dark:bg-info/10",
  },

  // Leases (lease document — appears only in the lease management table,
  // where "active"/"expired"/etc. are unambiguous without a prefix)
  upcoming: {
    label: "Upcoming",
    className: "bg-info/15 text-info border-info/20 dark:bg-info/10",
  },
  active: {
    label: "Active",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  "expiring-soon": {
    label: "Expiring Soon",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  expired: {
    // Terminal document state — informational, not itself an action item
    // (the actionable equivalent lives on the tenancy record instead).
    label: "Expired",
    className: "bg-muted text-muted-foreground border-border",
  },
  renewed: {
    label: "Renewed",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  terminated: {
    label: "Terminated",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },

  // Tenancy record (person ↔ unit relationship — appears in the admin
  // User Management table's "Tenancy" column, alongside Account Status,
  // hence the `tenancy-` prefix)
  "tenancy-upcoming": {
    label: "Upcoming",
    className: "bg-info/15 text-info border-info/20 dark:bg-info/10",
  },
  "tenancy-active": {
    label: "Active",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  "tenancy-expiring-soon": {
    label: "Expiring Soon",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  "tenancy-expired": {
    // Unlike the lease document's "expired" (informational/muted), an
    // expired tenancy is an open action item — the tenant hasn't renewed
    // or vacated yet — so this stays in the warning tone.
    label: "Expired — Pending Evacuation",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  "tenancy-renewed": {
    label: "Renewed",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  "tenancy-terminated": {
    label: "Terminated",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },
  "tenancy-vacated": {
    // Terminal state reached after the vacate workflow completes (unit
    // flips back to vacant, lease archives, audit entry written). Muted
    // because by this point it's a historical record, not an action item.
    label: "Vacated",
    className: "bg-muted text-muted-foreground border-border",
  },

  // Units / occupancy
  occupied: {
    label: "Occupied",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  vacant: {
    label: "Vacant",
    className: "bg-muted text-muted-foreground border-border",
  },
  maintenance: {
    label: "Maintenance",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },

  // Landlord record (person ↔ portfolio relationship — appears in the
  // admin table's "Landlord Status" column, hence the `landlord-` prefix)
  "landlord-active": {
    label: "Active",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  "landlord-inactive": {
    // All properties sold/transferred — no current portfolio, but not a
    // penalty, so it reads neutral (muted) rather than negative.
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
  },
  "landlord-suspended": {
    label: "Suspended",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },

  // User account (identity + platform access ONLY — never implies a role
  // or a business relationship; appears in the admin table's "Account"
  // column, hence the `account-` prefix)
  "account-active": {
    label: "Active",
    className:
      "bg-success/15 text-success border-success/20 dark:bg-success/10",
  },
  "account-suspended": {
    label: "Suspended",
    className:
      "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/10",
  },
  "account-pending-verification": {
    label: "Pending Verification",
    className:
      "bg-warning/15 text-warning border-warning/20 dark:bg-warning/10",
  },
  "account-deactivated": {
    // Soft-deleted / archived — all business relationships have ended.
    // Distinct from "suspended" (temporary, admin-imposed) — this is a
    // terminal, usually voluntary or lifecycle-driven end state.
    label: "Deactivated",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export interface StatusBadgeProps {
  /** Status key — see StatusVariant for the full list. */
  status: StatusVariant;
  /**
   * Override the default label text (e.g. show "3 days overdue" instead of
   * just "Overdue"). The color/variant styling still comes from `status`.
   */
  label?: string;
  /** Render a small leading dot indicator instead of/alongside text emphasis. */
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showDot = false,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  // Defensive fallback: if an unmapped status string ever reaches this
  // component (e.g. a new backend status not yet wired into STATUS_CONFIG),
  // render it neutrally instead of throwing — bad data shouldn't crash a table row.
  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          "bg-muted text-muted-foreground border-border",
          className
        )}
      >
        {label ?? status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        config.className,
        className
      )}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {label ?? config.label}
    </span>
  );
}
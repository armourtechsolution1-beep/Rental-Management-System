import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/shared/SkeletonLoader/SkeletonLoader";
import { cn } from "@/lib/utils";

export interface KPITrend {
  /**
   * Pre-formatted delta, e.g. "+12%" or "-3 units". The component doesn't
   * compute this itself — "trend" means different things across payments
   * (currency delta), occupancy (percentage), maintenance (count) — so the
   * caller owns the formatting.
   */
  value: string;
  direction: "up" | "down" | "neutral";
  /**
   * Whether this direction is actually a GOOD or BAD thing for this specific
   * metric. "Up" is positive for Monthly Rental Income but negative for
   * Overdue Payments — the arrow direction alone can't carry that, so it's
   * a separate field. Defaults from `direction` (up → positive, down →
   * negative) when omitted, which covers the common case.
   */
  sentiment?: "positive" | "negative" | "neutral";
  /** e.g. "vs last month" */
  label?: string;
}

export interface KPIStatCardProps {
  title: string;
  /** Already formatted for display, e.g. "KES 450,000" or "24". */
  value: string | number;
  icon?: LucideIcon;
  trend?: KPITrend;
  /** Optional line under the value, e.g. "8 of 10 units occupied". */
  description?: string;
  /** Wraps the card in a Next.js Link when provided (e.g. link to the full report). */
  href?: string;
  /** Initial load — no value has ever rendered. Swaps the value/trend/description region for a skeleton. */
  isLoading?: boolean;
  /**
   * Background refetch — a value is already on screen (TanStack Query's
   * `isFetching && !isLoading` case: the Landlord Dashboard's 5-minute KPI
   * refresh, a window-focus refetch, etc). Keeps the existing value fully
   * visible rather than swapping to a skeleton — a full skeleton on every
   * silent 5-minute refresh would be a distracting flash for a number that
   * usually hasn't even changed. Deliberately lighter than SectionCard/
   * DataTable's corner-spinner-badge treatment, since a KPI card is small
   * enough that an absolutely-positioned badge would risk overlapping the
   * trend line: instead, a small pulse dot appears on the icon badge and
   * the value/trend/description region dims slightly, both reverting the
   * instant fresh data arrives.
   */
  isRefetching?: boolean;
  className?: string;
}

const SENTIMENT_CLASSES: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

const TREND_ICON: Record<KPITrend["direction"], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function KPIStatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  href,
  isLoading = false,
  isRefetching = false,
  className,
}: KPIStatCardProps) {
  const sentiment: "positive" | "negative" | "neutral" =
    trend?.sentiment ??
    (trend?.direction === "up"
      ? "positive"
      : trend?.direction === "down"
        ? "negative"
        : "neutral");
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;
  const showRefetchIndicator = isRefetching && !isLoading;

  const card = (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors",
        href && !isLoading && "hover:bg-accent/50",
        className
      )}
      aria-busy={showRefetchIndicator || isLoading}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {Icon && (
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {showRefetchIndicator && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-2 w-2"
                aria-hidden="true"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <div
          className={cn(
            "transition-opacity",
            showRefetchIndicator && "opacity-60"
          )}
        >
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
          </div>

          {trend && TrendIcon && (
            <div
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                SENTIMENT_CLASSES[sentiment]
              )}
            >
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              <span>{trend.value}</span>
              {trend.label && (
                <span className="font-normal text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}

          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );

  // Loading cards are never clickable — there's nothing to navigate to yet,
  // and a hover/focus affordance on a skeleton reads as broken, not "loading".
  // Refetching cards stay clickable — the existing value is still valid.
  if (href && !isLoading) {
    return (
      <Link
        href={href}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {card}
      </Link>
    );
  }

  return card;
}

// Re-exported so consumers building a KPI row don't need to know the
// underlying grid classes — mirrors SkeletonLoader's "stat-bar" variant
// spacing so a loading row and a loaded row line up pixel-for-pixel.
export function KPIStatCardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
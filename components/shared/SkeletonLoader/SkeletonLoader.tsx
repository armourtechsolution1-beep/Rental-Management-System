import { cn } from "@/lib/utils";

/**
 * Base pulsing skeleton block. Exported on its own because some
 * components (e.g. SectionCard's loading overlay) just need a single
 * rectangle rather than a full named layout pattern.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
}

export type SkeletonVariant = "table" | "card-grid" | "stat-bar" | "chart";

export interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  /**
   * Meaning depends on variant:
   * - table: number of rows
   * - card-grid: number of cards
   * - stat-bar: number of stat cards
   * - chart: ignored
   */
  count?: number;
  /** table-only: number of columns per row */
  columns?: number;
  className?: string;
}

export function SkeletonLoader({
  variant,
  count,
  columns = 4,
  className,
}: SkeletonLoaderProps) {
  switch (variant) {
    case "table":
      return <TableSkeleton rows={count ?? 6} columns={columns} className={className} />;
    case "card-grid":
      return <CardGridSkeleton count={count ?? 6} className={className} />;
    case "stat-bar":
      return <StatBarSkeleton count={count ?? 4} className={className} />;
    case "chart":
      return <ChartSkeleton className={className} />;
    default:
      return null;
  }
}

function TableSkeleton({
  rows,
  columns,
  className,
}: {
  rows: number;
  columns: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border", className)}>
      {/* Header row */}
      <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Body rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`r-${rowIdx}`} className="flex gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={`r-${rowIdx}-c-${colIdx}`}
                className={cn("h-4 flex-1", colIdx === 0 && "max-w-[40%]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGridSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBarSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-7 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <Skeleton className="mb-4 h-4 w-1/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

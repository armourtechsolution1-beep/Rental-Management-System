import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SkeletonLoader,
  type SkeletonVariant,
} from "@/components/shared/SkeletonLoader/SkeletonLoader";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: string;
  description?: string;
  /** Rendered top-right of the header — e.g. a "View All" link or a filter control. */
  headerActions?: ReactNode;
  footer?: ReactNode;
  /**
   * Initial load — no data has ever rendered yet. Swaps `children` out
   * entirely for a `SkeletonLoader` matching `skeletonVariant`. Header and
   * footer still render normally, since a section's title is known before
   * its data is.
   */
  isLoading?: boolean;
  /** Which SkeletonLoader pattern to show while `isLoading` is true. */
  skeletonVariant?: SkeletonVariant;
  skeletonCount?: number;
  /**
   * Background refetch — data already exists on screen (TanStack Query's
   * `isFetching && !isLoading` case: the 60s staleTime refresh, a
   * window-focus refetch, etc). Keeps existing content visible and layers a
   * small spinner in the corner instead of tearing it down for a full
   * skeleton on every background refresh.
   */
  isRefetching?: boolean;
  /**
   * Drops the default CardContent padding — useful when embedding a
   * component that manages its own spacing, like DataTable.
   */
  noContentPadding?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  headerActions,
  footer,
  isLoading = false,
  skeletonVariant = "card-grid",
  skeletonCount,
  isRefetching = false,
  noContentPadding = false,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || headerActions);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            {title && (
              <CardTitle className="text-base font-semibold">
                {title}
              </CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerActions && (
            <div className="flex shrink-0 items-center gap-2">
              {headerActions}
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className={cn(noContentPadding && "p-0", contentClassName)}>
        {isLoading ? (
          <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />
        ) : (
          children
        )}
      </CardContent>

      {footer && !isLoading && <CardFooter>{footer}</CardFooter>}

      {isRefetching && !isLoading && (
        <div
          className="pointer-events-none absolute inset-0 flex items-start justify-end p-3"
          aria-live="polite"
          aria-label="Refreshing"
        >
          <span className="flex items-center justify-center rounded-full border border-border bg-background/90 p-1.5 shadow-sm">
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </span>
        </div>
      )}
    </Card>
  );
}

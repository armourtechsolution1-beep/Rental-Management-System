"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, type EmptyStateAction } from "@/components/shared/EmptyState/EmptyState";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader/SkeletonLoader";
import { cn } from "@/lib/utils";

/**
 * Lets a column def carry a friendly label for the column-visibility
 * dropdown, for cases where `column.id` isn't already readable on its own
 * (e.g. an id derived from an accessor function). Optional — falls back to
 * `column.id` when omitted. Mirrors the `types/next-auth.d.ts` module
 * augmentation pattern already used elsewhere in this project.
 */
declare module "@tanstack/react-table" {
  // TValue is required here to match the original ColumnMeta<TData, TValue>
  // signature from @tanstack/react-table — module augmentation must repeat
  // the exact generic parameter list even though this augmentation only
  // adds a TData-independent, TValue-independent field.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
  }
}

// ---------------------------------------------------------------------------
// Controlled-or-uncontrolled state helper
// ---------------------------------------------------------------------------

/**
 * Every piece of table state (sorting, selection, visibility, pagination)
 * can be driven by the parent (controlled) or left to DataTable itself
 * (uncontrolled) — same hybrid pattern as ConfirmDialog's `isLoading`.
 * Internal state always updates so the table works out of the box with zero
 * config; if the caller also passes a value + onChange, that value wins on
 * every render, letting them own it (e.g. server-side pagination synced to
 * a TanStack Query key).
 */
function useControllableState<T>(
  controlledValue: T | undefined,
  onChange: ((value: T) => void) | undefined,
  initialValue: T
): [T, OnChangeFn<T>] {
  const [internalValue, setInternalValue] = useState<T>(initialValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const setValue: OnChangeFn<T> = (updaterOrValue) => {
    const resolved =
      typeof updaterOrValue === "function"
        ? (updaterOrValue as (old: T) => T)(value)
        : updaterOrValue;
    setInternalValue(resolved);
    onChange?.(resolved);
  };

  return [value, setValue];
}

// ---------------------------------------------------------------------------
// Row-selection checkbox
// ---------------------------------------------------------------------------

/**
 * There's no `ui/checkbox.tsx` in this project yet, so this is a minimal
 * native checkbox styled to match the Nova token set rather than a shadcn
 * `Checkbox` import. Swap this out if `@radix-ui/react-checkbox` gets added
 * to the design system later.
 */
function SelectionCheckbox({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean | "indeterminate";
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === "indeterminate";
  }, [checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked === true}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "h-4 w-4 cursor-pointer rounded border-border accent-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50"
      )}
    />
  );
}

function buildSelectionColumn<TData, TValue>(): ColumnDef<TData, TValue> {
  return {
    id: "__select__",
    header: ({ table }) => (
      <SelectionCheckbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onChange={(value) => table.toggleAllPageRowsSelected(value)}
        ariaLabel="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <SelectionCheckbox
        checked={row.getIsSelected()}
        onChange={(value) => row.toggleSelected(value)}
        disabled={!row.getCanSelect()}
        ariaLabel="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
  };
}

// ---------------------------------------------------------------------------
// DataTableColumnHeader — companion for sortable column defs
// ---------------------------------------------------------------------------

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

/**
 * Use inside a `columnDef.header` when that column should be sortable:
 *
 * ```ts
 * {
 *   accessorKey: "amount",
 *   header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
 * }
 * ```
 *
 * Columns that don't use this (a plain string/node header) simply render as
 * non-interactive labels — DataTable never auto-injects sorting UI into
 * arbitrary header content.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn("text-sm font-medium", className)}>{title}</div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 gap-1.5 px-2", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      ) : sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <ArrowUpDown
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Column visibility dropdown
// ---------------------------------------------------------------------------

function DataTableViewOptions<TData>({ table }: { table: TanstackTable<TData> }) {
  const hideableColumns = table.getAllColumns().filter((c) => c.getCanHide());
  if (!hideableColumns.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {column.columnDef.meta?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------

function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  enableRowSelection,
}: {
  table: TanstackTable<TData>;
  pageSizeOptions: number[];
  enableRowSelection: boolean;
}) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {enableRowSelection && (
          <span>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageCount || 1}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  /** Initial load — swaps the table body for a SkeletonLoader "table" pattern. */
  isLoading?: boolean;
  skeletonRowCount?: number;
  /**
   * Background refetch — data already exists on screen (TanStack Query's
   * `isFetching && !isLoading` case). Keeps existing rows fully visible and
   * interactive, and layers a small spinner badge in the corner instead of
   * swapping to a skeleton. Mirrors SectionCard's isLoading/isRefetching
   * split for the same reason: most post-first-visit "loading" moments are
   * background refreshes (60s staleTime, window-focus refetch), not blank
   * states, and shouldn't cause a visual flash every time.
   */
  isRefetching?: boolean;

  // Empty state — customize copy, or override the slot entirely.
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: EmptyStateAction;
  renderEmptyState?: () => ReactNode;

  // Row selection
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /**
   * Fires alongside every selection change with the actual row objects
   * already resolved from `rowSelection` — so a bulk-action toolbar
   * ("Suspend Selected", "Approve Selected Payments", "Export Selected")
   * can just read this instead of re-deriving rows from `rowSelection` +
   * `data` itself every time. `rowSelection`/`onRowSelectionChange` are
   * unchanged and still the source of truth if you need the raw id map.
   */
  onSelectedRowsChange?: (rows: TData[]) => void;
  getRowId?: (row: TData, index: number) => string;

  // Column visibility
  enableColumnVisibility?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;

  // Sorting — column-level sortability is controlled per-column via
  // `columnDef.enableSorting` (default true); this is the table-level switch.
  enableSorting?: boolean;
  /** Set true when the caller sorts server-side; DataTable then trusts
   * `data` to already be in order instead of sorting client-side. */
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Pagination
  enablePagination?: boolean;
  /** Set true when `data` is already just the current page (server-paginated). */
  manualPagination?: boolean;
  /** Required when manualPagination is true. */
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  pageSizeOptions?: number[];

  onRowClick?: (row: TData) => void;
  /** Slot above the table — search input, filter bar, bulk-action buttons, etc. */
  toolbar?: ReactNode;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  skeletonRowCount = 6,
  isRefetching = false,
  emptyIcon,
  emptyTitle = "No results",
  emptyDescription = "There's nothing to show here yet.",
  emptyAction,
  renderEmptyState,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  onSelectedRowsChange,
  getRowId,
  enableColumnVisibility = true,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  enableSorting = true,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange,
  enablePagination = true,
  manualPagination = false,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  toolbar,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useControllableState<SortingState>(
    controlledSorting,
    onSortingChange,
    []
  );
  const [rowSelection, setRowSelectionState] = useControllableState<RowSelectionState>(
    controlledRowSelection,
    onRowSelectionChange,
    {}
  );

  /**
   * Wraps the normal controlled-or-uncontrolled rowSelection setter to also
   * resolve `onSelectedRowsChange`. Row ids follow TanStack Table's own
   * default (`getRowId ? getRowId(row, index) : String(index)`) so this
   * stays correct whether or not the caller supplies a custom `getRowId`.
   */
  const setRowSelection: OnChangeFn<RowSelectionState> = (updaterOrValue) => {
    setRowSelectionState(updaterOrValue);
    if (onSelectedRowsChange) {
      const resolved =
        typeof updaterOrValue === "function"
          ? (updaterOrValue as (old: RowSelectionState) => RowSelectionState)(rowSelection)
          : updaterOrValue;
      const selected = data.filter((row, index) => {
        const id = getRowId ? getRowId(row, index) : String(index);
        return !!resolved[id];
      });
      onSelectedRowsChange(selected);
    }
  };
  const [columnVisibility, setColumnVisibility] = useControllableState<VisibilityState>(
    controlledColumnVisibility,
    onColumnVisibilityChange,
    {}
  );
  const [pagination, setPagination] = useControllableState<PaginationState>(
    controlledPagination,
    onPaginationChange,
    { pageIndex: 0, pageSize: pageSizeOptions[0] ?? 10 }
  );

  const resolvedColumns = useMemo<ColumnDef<TData, TValue>[]>(
    () => (enableRowSelection ? [buildSelectionColumn<TData, TValue>(), ...columns] : columns),
    [columns, enableRowSelection]
  );

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, rowSelection, columnVisibility, pagination },
    enableRowSelection,
    enableSorting,
    manualSorting,
    manualPagination,
    pageCount: manualPagination ? (pageCount ?? -1) : undefined,
    getRowId,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className={cn("space-y-4", className)}>
      {(toolbar || enableColumnVisibility) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">{toolbar}</div>
          {enableColumnVisibility && <DataTableViewOptions table={table} />}
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader
          variant="table"
          count={skeletonRowCount}
          columns={visibleColumnCount || 4}
        />
      ) : (
        <div className="relative">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={
                          header.column.columnDef.size !== 150
                            ? { width: header.getSize() }
                            : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn(onRowClick && "cursor-pointer")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={visibleColumnCount} className="p-0">
                      {renderEmptyState ? (
                        renderEmptyState()
                      ) : (
                        <EmptyState
                          icon={emptyIcon}
                          title={emptyTitle}
                          description={emptyDescription}
                          action={emptyAction}
                          className="border-0"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {isRefetching && (
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
        </div>
      )}

      {!isLoading && enablePagination && rows.length > 0 && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          enableRowSelection={enableRowSelection}
        />
      )}
    </div>
  );
}
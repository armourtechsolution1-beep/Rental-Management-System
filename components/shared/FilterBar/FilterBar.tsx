"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
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
import { cn } from "@/lib/utils";

export type FilterFieldType = "select" | "multi-select" | "date-range" | "text";

export interface FilterOption {
  label: string;
  value: string;
}

export interface DateRangeValue {
  from?: string;
  to?: string;
}

export interface FilterFieldConfig {
  /** Also used as the URL query param name when `syncToUrl` is on. */
  key: string;
  label: string;
  type: FilterFieldType;
  /** Required for "select" and "multi-select". */
  options?: FilterOption[];
  placeholder?: string;
}

export type FilterValue = string | string[] | DateRangeValue | undefined;
export type FilterState = Record<string, FilterValue>;

export interface FilterBarProps {
  filters: FilterFieldConfig[];
  /** Controlled filter state — omit to let FilterBar manage it. */
  value?: FilterState;
  onChange?: (value: FilterState) => void;
  /**
   * When true (default), reads initial state from the URL's query string on
   * mount and pushes updates back via `router.replace` (no history entry,
   * no scroll jump). Matches the plan's "filter state persists in URL query
   * params" requirement for the Property/Payment/Maintenance filter bars.
   */
  syncToUrl?: boolean;
  className?: string;
}

function isEmptyValue(value: FilterValue): boolean {
  if (value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return !value.from && !value.to;
  return false;
}

function stateFromSearchParams(
  searchParams: URLSearchParams,
  filters: FilterFieldConfig[]
): FilterState {
  const state: FilterState = {};
  filters.forEach((f) => {
    const raw = searchParams.get(f.key);
    if (raw === null) return;
    if (f.type === "multi-select") {
      state[f.key] = raw.split(",").filter(Boolean);
    } else if (f.type === "date-range") {
      const [from, to] = raw.split("_");
      state[f.key] = { from: from || undefined, to: to || undefined };
    } else {
      state[f.key] = raw;
    }
  });
  return state;
}

function searchParamsFromState(
  current: URLSearchParams,
  state: FilterState,
  filters: FilterFieldConfig[]
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  filters.forEach((f) => {
    const val = state[f.key];
    if (isEmptyValue(val)) {
      next.delete(f.key);
      return;
    }
    if (f.type === "multi-select" && Array.isArray(val)) {
      next.set(f.key, val.join(","));
    } else if (f.type === "date-range" && typeof val === "object" && !Array.isArray(val)) {
      next.set(f.key, `${val.from ?? ""}_${val.to ?? ""}`);
    } else if (typeof val === "string") {
      next.set(f.key, val);
    }
  });
  return next;
}

export function FilterBar({
  filters,
  value: controlledValue,
  onChange,
  syncToUrl = true,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [internalValue, setInternalValue] = useState<FilterState>(() =>
    syncToUrl ? stateFromSearchParams(searchParams, filters) : {}
  );
  const value = controlledValue ?? internalValue;

  const setValue = useCallback(
    (updater: FilterState | ((prev: FilterState) => FilterState)) => {
      setInternalValue((prevInternal) => {
        const base = controlledValue ?? prevInternal;
        const resolved = typeof updater === "function" ? updater(base) : updater;
        onChange?.(resolved);
        if (syncToUrl) {
          const nextParams = searchParamsFromState(searchParams, resolved, filters);
          router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
        }
        return resolved;
      });
    },
    [controlledValue, onChange, syncToUrl, searchParams, filters, router, pathname]
  );

  const handleFieldChange = (key: string, fieldValue: FilterValue) => {
    setValue((prev) => ({ ...prev, [key]: fieldValue }));
  };

  const handleClearAll = () => setValue({});

  const activeCount = Object.values(value).filter((v) => !isEmptyValue(v)).length;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((f) => (
        <FilterField
          key={f.key}
          config={f}
          value={value[f.key]}
          onChange={(v) => handleFieldChange(f.key, v)}
        />
      ))}
      {activeCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-8 gap-1.5 text-xs"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear filters ({activeCount})
        </Button>
      )}
    </div>
  );
}

function FilterField({
  config,
  value,
  onChange,
}: {
  config: FilterFieldConfig;
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}) {
  if (config.type === "select") {
    return (
      <Select
        value={(value as string) ?? ""}
        onValueChange={(v) => onChange(v || undefined)}
      >
        <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
          <SelectValue placeholder={config.placeholder ?? config.label} />
        </SelectTrigger>
        <SelectContent>
          {config.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (config.type === "multi-select") {
    const selected = (value as string[]) ?? [];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            {config.label}
            {selected.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                {selected.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {config.options?.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selected.includes(opt.value)}
              onCheckedChange={(checked) => {
                onChange(
                  checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value)
                );
              }}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (config.type === "date-range") {
    // Provisional: no ui/DatePicker exists yet (see RMS_Frontend_Development_Plan_v3.md
    // §3 — DatePicker/DateRangePicker is listed "Not yet in ui/"). Native
    // <input type="date"> keeps this fully functional in the meantime;
    // swap for a real DateRangePicker once that primitive is built, without
    // changing FilterBar's public props or FilterState shape.
    const range = (value as DateRangeValue) ?? {};
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{config.label}</span>
        <input
          type="date"
          value={range.from ?? ""}
          onChange={(e) => onChange({ ...range, from: e.target.value || undefined })}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          aria-label={`${config.label} from`}
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          type="date"
          value={range.to ?? ""}
          onChange={(e) => onChange({ ...range, to: e.target.value || undefined })}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          aria-label={`${config.label} to`}
        />
      </div>
    );
  }

  // "text"
  return (
    <input
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={config.placeholder ?? config.label}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
    />
  );
}

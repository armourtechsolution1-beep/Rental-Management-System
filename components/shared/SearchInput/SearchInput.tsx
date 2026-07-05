"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  /** Controlled raw (non-debounced) input value. */
  value?: string;
  defaultValue?: string;
  /** Fires on every keystroke with the raw value — for callers that want to
   * mirror the live input elsewhere (e.g. a URL param) without waiting for
   * the debounce. Most callers only need `onSearch`. */
  onValueChange?: (value: string) => void;
  /** Fires with the debounced value — this is the actual "go fetch" trigger. */
  onSearch: (value: string) => void;
  /** Default 300ms, matching the Admin User Management search spec. */
  debounceMs?: number;
  placeholder?: string;
  disabled?: boolean;
  /** Optional area for active filter pills, rendered after the input. */
  filterChips?: ReactNode;
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  disabled = false,
  filterChips,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const debouncedValue = useDebounce(value, debounceMs);

  const setValue = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  useEffect(() => {
    onSearch(debouncedValue);
    // Only the debounced value should re-trigger this — onSearch is expected
    // to be referentially stable-ish (a TanStack Query fetcher/setState), and
    // including it would risk firing on every parent render instead of only
    // on actual value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  const handleClear = () => {
    setValue("");
    // Bypass the debounce for a clear — should feel instant, not delayed.
    onSearch("");
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-8 pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {filterChips && (
        <div className="flex flex-wrap items-center gap-1.5">{filterChips}</div>
      )}
    </div>
  );
}
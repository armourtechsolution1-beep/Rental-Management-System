import { useEffect, useState } from "react";

/**
 * Debounces a changing value, returning it only after `delayMs` has passed
 * without another change. `SearchInput` (`components/shared/SearchInput/`)
 * was built ahead of schedule against this exact signature — Frontend Plan
 * §2.8: `useDebounce<T>(value: T, delayMs: number): T` — a debounced
 * *value*, not a debounced callback. Nothing in `SearchInput` needs to
 * change now that this exists.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui.store';

/**
 * Applies the persisted theme preference from `ui.store` to <html class="dark">.
 * Mount once near the root, inside AppProviders. Pairs with the inline
 * no-flash script in layout.tsx, which sets the class before hydration.
 */
export function ThemeSync() {
  const activeTheme = useUIStore((s) => s.activeTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, [activeTheme]);

  return null;
}

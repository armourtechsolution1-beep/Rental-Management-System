'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { SessionSync } from './session-sync';
import { ThemeSync } from './theme-sync';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <SessionSync />
        <ThemeSync />
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </SessionProvider>
  );
}

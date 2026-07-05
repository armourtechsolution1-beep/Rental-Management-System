import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'RMS — Rental Management System',
  description: 'Manage properties, leases, rent, and maintenance in one place.',
};

/**
 * Runs before React hydrates so the correct theme class is present on first paint —
 * prevents a light-mode flash for users with a saved 'dark' preference.
 * Reads the same persisted key that `stores/ui.store.ts` (Zustand `persist`) writes to.
 */
const noFlashThemeScript = `
(function () {
  try {
    var raw = localStorage.getItem('rms-ui-preferences');
    var theme = raw ? JSON.parse(raw).state?.activeTheme : null;
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn('font-sans', GeistSans.variable, GeistMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

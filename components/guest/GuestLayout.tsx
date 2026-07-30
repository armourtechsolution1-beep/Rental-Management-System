import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

export interface GuestLayoutProps {
  children: ReactNode;
}

/**
 * Shared chrome for every unauthenticated page — Login, Register, Forgot/
 * Reset Password (one route, per Frontend Plan v5.1 §D View 3), and Accept
 * Invite. Owns the centered card frame, brand mark, and footer; each page
 * supplies its own heading/description/form as `children` inside the card
 * body. Mounted once via app/(guest)/layout.tsx.
 */
export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2 text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">RMS</span>
        </Link>

        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>

      <footer className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RMS. All rights reserved.
      </footer>
    </div>
  );
}

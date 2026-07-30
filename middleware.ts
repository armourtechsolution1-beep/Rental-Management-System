import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';
import { PROTECTED_PREFIXES, PUBLIC_PATHS, ROLE_HOME } from '@/lib/constants/routes';

/**
 * IMPORTANT: middleware runs on the Edge runtime, so we instantiate NextAuth here
 * with `authConfig` directly rather than importing the Node-runtime `auth.ts`.
 * The Credentials provider's `authorize` callback never actually runs inside
 * middleware (only `jwt`/`session` callbacks do), so this is safe even though
 * `authConfig` references a Supabase service-role client and lib/db.
 *
 * v5.0: reads `activeRole` instead of the old single `role` field — the
 * matching/redirect logic below is otherwise identical to v4.0 (Frontend Plan
 * v5.0 §2.11: "no change to its logic, just its input source").
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const activeRole = req.auth?.user?.activeRole;
  const path = nextUrl.pathname;

  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Already logged in and trying to hit a guest-only page → bounce to their dashboard.
  if (isAuthenticated && isPublicPath) {
    const home = activeRole ? ROLE_HOME[activeRole] : '/login';
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  // Not logged in and the route isn't public → send to login with a callback.
  if (!isAuthenticated && !isPublicPath && path !== '/') {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but trying to access a route owned by a role other than the
  // current activeRole — even if that role is in availableRoles. Reaching it
  // requires switching activeRole first (AccountSwitcher), not a deep link.
  const matchedProtection = PROTECTED_PREFIXES.find((p) => path.startsWith(p.prefix));
  if (isAuthenticated && matchedProtection && activeRole !== matchedProtection.role) {
    const home = activeRole ? ROLE_HOME[activeRole] : '/login';
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets, images, and Next internals.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};

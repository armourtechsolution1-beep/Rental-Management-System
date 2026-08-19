import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { Role } from "@/types/user.types";
import type { Session } from "next-auth";

/**
 * Route Handler auth guard.
 *
 * `middleware.ts`'s matcher deliberately excludes `/api/**` (it must — see
 * the comment on `config.matcher` there: NextAuth's own `/api/auth/session`
 * has to be reachable unauthenticated, or session bootstrapping breaks
 * circularly). That means **no Route Handler is protected unless it checks
 * the session itself.** This is also just correct per Backend Plan §1
 * Guiding Principle #4 ("Object-level authorization is a backend
 * responsibility, not a middleware one") — middleware was only ever
 * responsible for *page* redirects, not API auth.
 *
 * Every mutating/read Route Handler that isn't intentionally public (like
 * `/api/auth/register` or the NextAuth catch-all itself) should start with
 * one of these two calls before touching any data.
 *
 * Usage:
 * ```ts
 * export async function GET(request: Request) {
 *   const session = await requireSession();
 *   if (session instanceof NextResponse) return session; // 401, short-circuit
 *   // ...session.user.id, session.user.activeRole, etc. are safe to use below
 * }
 * ```
 */
export async function requireSession(): Promise<Session | NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { message: "You must be signed in to do that.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  return session;
}

/**
 * Same as `requireSession`, but additionally checks the caller's current
 * `activeRole` — matching `middleware.ts`'s page-level behavior (§2.1: role
 * gating checks `activeRole`, the workspace currently in view, not whether
 * that role merely appears somewhere in `availableRoles`).
 *
 * This is still only the *route-level* check. It does not replace an
 * object-level ownership check (e.g. "is this Landlord's `landlord_id` the
 * one on this specific property row") — that's a separate, per-resource
 * concern each handler still owns, per Backend Plan §1 Guiding Principle #4.
 *
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const session = await requireRole('LANDLORD');
 *   if (session instanceof NextResponse) return session; // 401 or 403
 *   // ...
 * }
 * ```
 */
export async function requireRole(role: Role): Promise<Session | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  if (session.user.activeRole !== role) {
    return NextResponse.json(
      {
        message: "You don't have access to do that.",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return session;
}

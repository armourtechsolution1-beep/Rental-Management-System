// RMS Backend Plan v1.2 §2.1, Frontend Plan v5.0 §2.11
//
// Two exports, deliberately different shapes, for two different callers:
//
//   - resolveUserRoles(profileId, isAdmin, lastActiveRole) — the pure core.
//     Touches lib/db only, no Supabase Auth/Data API dependency at all,
//     which is what makes it fully unit-testable against a real database
//     independent of NextAuth/Supabase machinery — see
//     lib/auth/scripts/test-resolve-roles.ts (8 scenarios, all passing,
//     unchanged by this merge). Used by authorize(), which already has
//     is_admin/last_active_role from its own single combined profiles query
//     and would otherwise waste a redundant round trip re-fetching them.
//
//   - resolveRoleDataByProfileId(profileId) — convenience wrapper for
//     callers that only have a profileId and haven't already fetched
//     is_admin/last_active_role themselves (the jwt callback's
//     trigger === 'update' branch; a future Route Handler that only has an
//     id in hand). Fetches those two fields via supabase-js (public.profiles
//     — same access path used everywhere else profiles is read), then
//     delegates to resolveUserRoles. Not used by authorize() itself.
//
// people.landlords / people.tenancies are lib/db-only either way — never
// Data-API-reachable at all (§2.10).

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { landlords, tenancies } from '@/lib/db/schema';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type { Role } from '@/types/user.types';

const ACTIVE_TENANCY_STATUSES = ['upcoming', 'active', 'expiring-soon'] as const;

export interface ResolvedRoles {
  availableRoles: Role[];
  activeRole: Role;
}

/**
 * Thrown when a non-admin profile has no active landlord or tenancy
 * relationship at all — e.g. a landlord record that's been suspended, or a
 * tenancy that's ended with no new one started. Treated by authorize() as a
 * distinct login failure (NO_ACTIVE_ROLE), not a silent default into a role
 * that doesn't actually apply, and not collapsed into a generic
 * invalid-credentials failure either.
 *
 * Scoped deliberately narrow for this reconciliation pass: a suspended
 * landlord being flatly denied login (rather than let in to see a "your
 * workspace is suspended" screen) is a real UX gap, flagged here rather than
 * solved — it needs its own product decision, not one made silently inside
 * an auth bugfix.
 */
export class NoActiveRoleError extends Error {
  constructor() {
    super('NO_ACTIVE_ROLE');
    this.name = 'NoActiveRoleError';
  }
}

export async function resolveUserRoles(
  profileId: string,
  isAdmin: boolean,
  lastActiveRole: string | null
): Promise<ResolvedRoles> {
  if (isAdmin) {
    return { availableRoles: ['ADMIN'], activeRole: 'ADMIN' };
  }

  const [landlordRow] = await db
    .select({ id: landlords.id })
    .from(landlords)
    .where(and(eq(landlords.profileId, profileId), eq(landlords.status, 'active')))
    .limit(1);

  const [tenancyRow] = await db
    .select({ id: tenancies.id })
    .from(tenancies)
    .where(
      and(
        eq(tenancies.profileId, profileId),
        inArray(tenancies.status, ACTIVE_TENANCY_STATUSES)
      )
    )
    .limit(1);

  const availableRoles: Role[] = [];
  if (landlordRow) availableRoles.push('LANDLORD');
  if (tenancyRow) availableRoles.push('TENANT');

  if (availableRoles.length === 0) {
    throw new NoActiveRoleError();
  }

  let activeRole: Role;
  if (lastActiveRole && availableRoles.includes(lastActiveRole as Role)) {
    activeRole = lastActiveRole as Role;
  } else if (availableRoles.length === 1) {
    activeRole = availableRoles[0];
  } else {
    // Tie-break for a dual-role profile with no prior selection — not specified
    // by the backend plan (Frontend Plan §2.11 calls this out as a gap filled
    // here, not there).
    activeRole = 'LANDLORD';
  }

  return { availableRoles, activeRole };
}

/**
 * Convenience wrapper for callers that only have a profileId. Throws (does
 * not return null) if the profile lookup itself fails — that's a different
 * failure mode than "no active role" and callers should not conflate the
 * two. NoActiveRoleError still propagates through unchanged from
 * resolveUserRoles.
 */
export async function resolveRoleDataByProfileId(profileId: string): Promise<ResolvedRoles> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin, last_active_role')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    throw new Error(`Could not load profile ${profileId} for role resolution`);
  }

  return resolveUserRoles(profileId, profile.is_admin, profile.last_active_role);
}

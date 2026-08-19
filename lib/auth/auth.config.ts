import type { NextAuthConfig } from 'next-auth';
import { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { resolveUserRoles, resolveRoleDataByProfileId, NoActiveRoleError } from '@/lib/auth/resolve-roles';
import type { Role } from '@/types/user.types';

/**
 * NextAuth owns the session (JWT strategy, httpOnly cookie, middleware-readable).
 * Supabase Auth (via the service-role client) verifies the password inside the
 * Credentials provider — identity fields come from `public.profiles` (also via
 * the service-role client, since `profiles` lives in `public` and is reachable
 * through the Data API). Role is NOT stored anywhere: `availableRoles`/
 * `activeRole` are computed from `people.landlords`/`people.tenancies` via
 * `lib/db` (direct Postgres — those two schemas are never Data-API-reachable
 * at all, Backend Plan §2.10). See resolve-roles.ts for that logic, kept
 * separate so it's unit-testable outside NextAuth/Supabase Auth.
 *
 * Kept import-light (no Node-only APIs at the top level) so it can be safely
 * referenced by `middleware.ts`, which runs on the Edge runtime.
 */

/** Distinguishable authorize() failures — LoginForm branches on `error.code` (Frontend Plan v5.0 §D). */
class AuthorizeError extends CredentialsSignin {
  constructor(code: 'EMAIL_NOT_CONFIRMED' | 'ACCOUNT_SUSPENDED' | 'NO_ACTIVE_ROLE') {
    super(code);
    this.code = code;
  }
}

function buildDisplayName(fName: string, mName: string | null, lName: string): string {
  return mName ? `${fName} ${mName} ${lName}` : `${fName} ${lName}`;
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const supabase = createSupabaseServiceRoleClient();

        // 1. Verify the password against Supabase Auth.
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
          // Distinguish "right password, unconfirmed email" from everything else.
          // Every other Supabase error (invalid_credentials, user_not_found, ...)
          // collapses to a generic failure deliberately — don't leak account
          // existence via a more specific message.
          //
          // VERIFY IN DEV before relying on this in production: this assumes
          // supabase-js's signInWithPassword surfaces an unconfirmed-email
          // failure as error.code === 'email_not_confirmed'. This matches
          // Supabase's documented Auth error codes as of this writing, but
          // that field has not stayed identical across every gotrue-js
          // release historically — confirm against the actual error shape
          // returned by this project's installed @supabase/supabase-js
          // version with a real unconfirmed-account login attempt, don't
          // just trust the docs or this comment.
          if (authError.code === 'email_not_confirmed') {
            throw new AuthorizeError('EMAIL_NOT_CONFIRMED');
          }
          return null;
        }
        if (!authData.user) return null;

        // 2. Identity fields from public.profiles (no name/role columns — §3.2).
        // One combined query — is_admin/account_status/last_active_role are
        // fetched here too, not re-fetched later, since resolveUserRoles takes
        // them as arguments rather than looking them up itself.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, f_name, m_name, l_name, email, avatar_url, is_admin, account_status, last_active_role')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) return null;

        // 3. account_status gate — Supabase Auth has no idea this field exists,
        // so an admin's "suspend user" action (Backend Plan §7 Admin module)
        // would otherwise have zero effect on whether the person can still log in.
        if (profile.account_status === 'suspended' || profile.account_status === 'deactivated') {
          throw new AuthorizeError('ACCOUNT_SUSPENDED');
        }
        // Defensive: normally unreachable, since Supabase's own "Confirm email"
        // gate (§2.11 Q3) should already block sign-in before account_status
        // ever flips to 'active'. If it's somehow reached anyway, treat it the
        // same as the primary email-confirmation failure.
        if (profile.account_status === 'pending-verification') {
          throw new AuthorizeError('EMAIL_NOT_CONFIRMED');
        }

        // 4. Role resolution — the one query in this function that hits lib/db
        // instead of supabase-js. Calls the pure core directly (not the
        // profileId-only wrapper) since steps 2-3 already fetched is_admin/
        // last_active_role — no reason to pay for a second profiles query.
        let resolved;
        try {
          resolved = await resolveUserRoles(profile.id, profile.is_admin, profile.last_active_role);
        } catch (err) {
          if (err instanceof NoActiveRoleError) {
            throw new AuthorizeError('NO_ACTIVE_ROLE');
          }
          throw err;
        }

        return {
          id: profile.id,
          email: profile.email,
          fName: profile.f_name,
          mName: profile.m_name,
          lName: profile.l_name,
          name: buildDisplayName(profile.f_name, profile.m_name, profile.l_name),
          image: profile.avatar_url ?? null,
          availableRoles: resolved.availableRoles,
          activeRole: resolved.activeRole,
        };
      },
    }),
  ],
  callbacks: {
    // Persist identity + role onto the JWT at sign-in; refresh role resolution
    // only on an explicit trigger, never on every ordinary request.
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        // Fresh sign-in — `user` is authorize()'s full return value already.
        token.id = user.id;
        token.fName = (user as { fName: string }).fName;
        token.mName = (user as { mName: string | null }).mName;
        token.lName = (user as { lName: string }).lName;
        token.availableRoles = (user as { availableRoles: Role[] }).availableRoles;
        token.activeRole = (user as { activeRole: Role }).activeRole;
      } else if (trigger === 'update' && token.id) {
        // AccountSwitcher already wrote the new last_active_role via
        // PATCH /api/profiles/active-role before calling NextAuth's update() —
        // re-resolve from the DB rather than trusting client-supplied data,
        // since this is also the path that picks up a role added/removed
        // server-side since the token was issued. Uses the profileId-only
        // wrapper here, since this branch (unlike authorize()) doesn't
        // already have is_admin/last_active_role in hand.
        //
        // Fails soft, deliberately: if this throws for any reason — including
        // NoActiveRoleError, e.g. a landlord suspended mid-session — the
        // existing (possibly now-stale) token values are kept rather than
        // breaking the whole session refresh. A stale-but-was-valid role
        // surviving until next login is an accepted, flagged gap (see
        // NoActiveRoleError's own doc comment) — full mid-session
        // revalidation is a separate piece of work, not solved here.
        try {
          const resolved = await resolveRoleDataByProfileId(token.id as string);
          token.availableRoles = resolved.availableRoles;
          token.activeRole = resolved.activeRole;
        } catch {
          // intentionally swallowed — see comment above
        }
      }
      return token;
    },
    // Expose identity/role on the client-facing session object.
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.fName = token.fName as string;
        session.user.mName = token.mName as string | null;
        session.user.lName = token.lName as string;
        session.user.availableRoles = token.availableRoles as Role[];
        session.user.activeRole = token.activeRole as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type { Role } from '@/types/user.types';

/**
 * NextAuth owns the session (JWT strategy, httpOnly cookie, middleware-readable).
 * Supabase Auth (via the service-role client) is used purely as the password/identity
 * verifier inside the Credentials provider — Supabase Postgres remains the source of
 * truth for the `profiles` table (id, email, name, role, avatar_url).
 *
 * Kept import-light (no Node-only APIs at the top level) so it can be safely
 * referenced by `middleware.ts`, which runs on the Edge runtime.
 */
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

        if (authError || !authData.user) return null;

        // 2. Pull role/profile from our own `profiles` table (id, name, role, avatar_url).
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, role, avatar_url')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) return null;

        return {
          id: profile.id,
          email: authData.user.email,
          name: profile.name,
          role: profile.role as Role,
          image: profile.avatar_url ?? null,
        };
      },
    }),
  ],
  callbacks: {
    // Persist role onto the JWT at sign-in.
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    // Expose role/id on the client-facing session object.
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

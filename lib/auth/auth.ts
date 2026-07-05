import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

/**
 * Node-runtime NextAuth instance. Import `auth()` from here in Server Components,
 * Route Handlers, and Server Actions to read the current session.
 *
 * `middleware.ts` does NOT import from this file — it uses `authConfig` directly,
 * since middleware runs on the Edge runtime and this file may pull in Node APIs
 * transitively through the Credentials provider's Supabase service-role client.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

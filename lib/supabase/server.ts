import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
/**
 * Server-side Supabase client (Server Components, Route Handlers, Server Actions).
 * Not used for auth identity here — NextAuth owns the session.
 * This is for querying Postgres via Supabase's client/RLS as the app's data layer.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore if middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — server-only, bypasses RLS.
 * Used by the NextAuth Credentials provider to verify passwords via Supabase Admin API,
 * and by trusted server code (e.g. admin actions). NEVER import this in client code.
 */
export function createSupabaseServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
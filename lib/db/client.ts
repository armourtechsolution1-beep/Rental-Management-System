// Direct Postgres connection for Route Handler queries against the seven
// backend-only schemas (people, property, leasing, billing, maintenance,
// audit, platform) — RMS Backend Plan §2.10.
//
// This deliberately does NOT go through Supabase's Data API / supabase-js.
// Those seven schemas are never added to Exposed Schemas and never granted
// to anon/authenticated/service_role (see the schema-creation migration), so
// there is no Data API route to them at all — this is the only way in.
//
// `public.profiles` / `public.notifications` remain reachable both here (for
// server-side joins against the backend-only schemas) and via the existing
// `lib/supabase/` clients (for RLS-scoped browser reads and Realtime).

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Use the Supabase Transaction Pooler connection ' +
      'string (port 6543), not the Data API URL — see lib/db/README.md.'
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __rmsPgClient: ReturnType<typeof postgres> | undefined;
}

// Reuse the connection across Next.js dev-server hot reloads instead of
// opening a new pool on every file change.
const queryClient =
  global.__rmsPgClient ??
  postgres(connectionString, {
    // Required when connecting through Supabase's Transaction Pooler
    // (Supavisor/PgBouncer in transaction mode does not support prepared
    // statements shared across a pooled connection). If DATABASE_URL instead
    // points at the Session Pooler or a direct connection, this is harmless.
    prepare: false,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__rmsPgClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

export { schema };

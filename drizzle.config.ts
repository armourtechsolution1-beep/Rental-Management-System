// drizzle-kit config — INTROSPECTION ONLY.
//
// Hand-written SQL migrations in supabase/migrations/ are the source of truth
// for this schema (RMS Backend Plan §2.10 decision log, item 5). Do not run
// `drizzle-kit generate` or `drizzle-kit push` against this config — they
// would try to make the database match lib/db/schema/*.ts, which is backwards
// for this project.
//
// The one legitimate use of this config is `drizzle-kit introspect` (or
// `drizzle-kit check`) as an occasional manual drift check: does the live
// database still match what lib/db/schema/*.ts claims it looks like, after
// the last few migrations landed.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema/index.ts',
  schemaFilter: [
    'public',
    'people',
    'property',
    'leasing',
    'billing',
    'maintenance',
    'audit',
    'platform',
  ],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

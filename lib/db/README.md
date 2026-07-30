# lib/db — direct Postgres connection

Ref: RMS Backend Development Plan v1.2, §2.10.

## Why this exists alongside `lib/supabase/`

Supabase's Data API (PostgREST/GraphQL, what `supabase-js` talks to) only reaches
schemas listed under **Exposed Schemas**, and only tables explicitly granted to
`anon`/`authenticated`/`service_role`. Seven of our eight Postgres schemas
(`people`, `property`, `leasing`, `billing`, `maintenance`, `audit`, `platform`)
are deliberately kept off both lists — see
`supabase/migrations/20260725120000_create_custom_schemas.sql`. That means
`supabase-js` **cannot reach them at all**, by design, regardless of key used.

Route Handlers reach those seven schemas through `db` exported from
`lib/db/client.ts`, a direct Postgres connection via
[`postgres.js`](https://github.com/porsager/postgres) + [Drizzle ORM](https://orm.drizzle.team/).

`lib/supabase/` is untouched and still the right tool for exactly two things:
- `public.profiles` / `public.notifications` read from the **browser** under RLS.
- Realtime subscriptions on `public.notifications`.

Server-side Route Handlers are free to use `lib/db` for `public.profiles` /
`public.notifications` too (it's in the schema here as well) — mainly so a
single query can join across `public` and a backend-only schema, e.g. a
landlord dashboard query joining `leasing.leases` to `public.profiles`.

## Source of truth: SQL migrations, not Drizzle

`supabase/migrations/*.sql` is authoritative. `lib/db/schema/*.ts` is a typed
mirror of that SQL, kept in sync by hand. **Never run `drizzle-kit generate`
or `drizzle-kit push`** — both would try to make the database match the
TypeScript files, which is backwards here. The only legitimate `drizzle-kit`
use is `introspect`/`check` as an occasional manual drift check
(`drizzle.config.ts` is scoped for exactly that).

This split exists because Supabase-specific pieces — the `auth.users` signup
trigger, `SECURITY DEFINER` functions, `RLS` policies, `pg_cron` jobs — are
easiest to express as plain SQL, and are outside what an ORM's migration DSL
models well. If a table definition here and the SQL ever disagree, the SQL
is right and this file has drifted — fix the `.ts` file, not the database.

## Connecting through Supabase's pooler

`DATABASE_URL` should point at Supabase's **Transaction Pooler** (port 6543),
not the direct connection — Route Handlers are short-lived serverless
invocations, and pooling avoids exhausting Postgres' connection limit under
concurrent requests. This requires `{ prepare: false }` in the `postgres()`
client options (already set in `client.ts`), because PgBouncer/Supavisor in
transaction mode doesn't support prepared statements shared across a pooled
connection. If you ever switch `DATABASE_URL` to a direct connection instead,
`prepare: false` is harmless there too, just unnecessary.

## Adding a new table

1. Add the DDL to a new file in `supabase/migrations/`. Apply it.
2. Add or update the matching table definition in `lib/db/schema/<schema>.ts`
   (create the file if it's a new Postgres schema), matching column names,
   types, nullability, and constraints exactly.
3. Re-export it from `lib/db/schema/index.ts` if it's a new file.
4. Run `npx tsc --noEmit` — Drizzle's types will catch most mismatches
   (wrong column name, wrong nullability) at compile time before they ever
   reach a query.

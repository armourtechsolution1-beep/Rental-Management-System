# Setup Notes for This Scaffold

## 1. Install dependencies

```bash
npm install next-auth@beta @supabase/supabase-js @supabase/ssr \
  zustand @tanstack/react-query @tanstack/react-query-devtools \
  sonner geist
```

(`next-auth@beta` = NextAuth v5, required for the `NextAuth(authConfig)` pattern used here.)

## 2. Environment variables

Copy `.env.example` → `.env.local` and fill in your Supabase project URL + keys
(Project Settings → API in the Supabase dashboard) and a generated `AUTH_SECRET`.

## 3. Supabase `profiles` table

The Credentials provider in `lib/auth/auth.config.ts` expects a `profiles` table
keyed by the Supabase Auth user id:

```sql
create table profiles (
  id uuid references auth.users(id) primary key,
  name text not null,
  role text not null check (role in ('LANDLORD', 'TENANT', 'ADMIN')),
  avatar_url text,
  created_at timestamptz default now()
);
```

Populate `role` on signup (e.g. via a Postgres trigger on `auth.users` insert, or
from your `/register` flow after `supabase.auth.signUp`).

## 4. What's wired up vs. what's a stub

**Fully wired:**
- Folder structure (role segments are real path segments, not route groups — see note below)
- `middleware.ts` — role-based redirect logic, runs on Edge
- `lib/auth/auth.config.ts` + `auth.ts` — Credentials provider backed by Supabase
- `stores/auth.store.ts`, `ui.store.ts`, `notification.store.ts` — Zustand, `ui.store` persists to localStorage
- `providers/query-provider.tsx` — TanStack Query with retry/staleTime defaults
- `lib/api/client.ts` — fetch wrapper with request interceptor (auth header) and
  response interceptor (401 → forced sign-out, 5xx/4xx → toast, ApiError typed throw)

**Stubs you still need to fill in:**
- `app/api/**` route handlers that `apiClient` actually calls (only the NextAuth
  catch-all route exists so far)
- Actual page content in each `app/<role>/<feature>/page.tsx` (currently empty dirs)
- `lib/auth/auth.config.ts`'s `accessToken` — if you want Supabase RLS to recognize
  the logged-in user server-side, you'll need to mint a Supabase-compatible JWT
  (signed with your Supabase JWT secret) inside the `jwt` callback and attach it
  as `token.accessToken`. Until then, server code should use the service-role
  client for trusted operations and treat NextAuth's session as the identity/role
  source of truth.

## 5. Important structural correction from the original plan

The original folder plan used `(landlord)/`, `(tenant)/`, `(admin)/` as Next.js
**route groups** (parentheses). Route groups are stripped from the URL, so all
three would have produced colliding routes (`/dashboard`, `/payments`, etc.).
This scaffold uses real segments — `landlord/`, `tenant/`, `admin/` — so URLs are
properly namespaced (`/landlord/dashboard`, `/tenant/payments`, `/admin/users`).
Only `(guest)/` stays a route group, since `/login` and `/register` are meant to
sit at root with no prefix.

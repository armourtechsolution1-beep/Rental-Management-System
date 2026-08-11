import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { ROLE_HOME } from "@/lib/constants/routes";

/**
 * `/` has no content of its own — it only decides where to send the
 * visitor. `middleware.ts` deliberately exempts `path === '/'` from its
 * "not authenticated → redirect to /login" rule specifically so this page
 * can own that decision itself rather than middleware forcing it upstream;
 * this doesn't change or duplicate that middleware behavior, it's what the
 * exemption was leaving room for.
 *
 * A Server Component reading `auth()` directly (not a client-side
 * `useSession()` redirect) so there's no flash of blank/loading content
 * before the redirect fires.
 */
export default async function RootPage() {
  const session = await auth();
  const activeRole = session?.user?.activeRole;

  redirect(activeRole ? ROLE_HOME[activeRole] : "/login");
}

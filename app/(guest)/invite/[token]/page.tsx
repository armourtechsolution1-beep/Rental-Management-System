import type { Metadata } from "next";
import { AcceptInviteFlow } from "@/components/guest/AcceptInviteFlow";

export const metadata: Metadata = {
  title: "Accept your invite | RMS",
};

// `token` isn't read here — Supabase's invite mechanism establishes the
// session from the URL fragment (same as password recovery), not from a
// path param. This dynamic segment exists to match the route Supabase's
// `admin.inviteUserByEmail({ redirectTo })` will target once that Phase 2
// call is built (§2.11's flagged backend gap); it's a placeholder shape,
// not a value this page currently depends on.
export default function AcceptInvitePage() {
  return <AcceptInviteFlow />;
}

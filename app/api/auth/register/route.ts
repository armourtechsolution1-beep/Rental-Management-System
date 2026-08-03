import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { landlords } from "@/lib/db/schema";
import { registerPayloadSchema } from "@/lib/validations/auth.schema";

/**
 * Landlord-only self-signup (Frontend Plan §D View 2 / §2.11 Q2, Q4). The
 * browser never calls Supabase directly for signup — this Route Handler is
 * the only door, per Backend Plan §1.1.
 *
 * 1. Validate the body with Zod (server-side — never trust the client form's
 *    own validation).
 * 2. `supabase.auth.signUp()` via the service-role client — deliberately NOT
 *    `admin.createUser()`, since `signUp()` already sends Supabase's own
 *    confirmation email using the project's built-in template, so no
 *    separate email-send step is needed here. This fires the existing
 *    `fn_handle_new_user` trigger, which creates the `public.profiles` row
 *    by reading `f_name`/`m_name`/`l_name` straight out of
 *    `raw_user_meta_data` — the keys in `options.data` below must match
 *    that trigger's column names exactly, not this file's camelCase fields.
 * 3. On success, an explicit `INSERT INTO people.landlords (profile_id)` via
 *    `lib/db` — NOT part of the generic signup trigger, since that trigger
 *    fires for every signup (including future tenant invites, §D View 4) and
 *    has no way to know this particular one should become a landlord.
 * 4. If step 3 fails, compensate by deleting the just-created auth user so a
 *    failed registration fails cleanly rather than leaving an orphaned
 *    account with a profile but no landlord record.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = registerPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Please check the form for errors.",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { fName, mName, lName, email, password } = parsed.data;
  const supabase = createSupabaseServiceRoleClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        f_name: fName,
        m_name: mName || null,
        l_name: lName,
      },
    },
  });

  if (signUpError) {
    // VERIFY IN DEV: this assumes a duplicate-email signup surfaces as
    // status 422 (supabase-js's documented behavior as of this writing, same
    // caveat as the one already flagged in lib/auth/auth.config.ts about
    // gotrue-js error shapes not staying identical across releases).
    // Collapsed to a generic-sounding but still accurate message either way
    // — same account-existence-leak principle as authorize()'s login
    // failures, though a confirmed-duplicate case is safe to be explicit
    // about since it doesn't reveal password-guessing information.
    const isDuplicate =
      signUpError.status === 422 || signUpError.code === "user_already_exists";

    return NextResponse.json(
      {
        message: isDuplicate
          ? "An account with this email already exists."
          : "Could not create your account. Please try again.",
        code: signUpError.code,
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return NextResponse.json(
      { message: "Could not create your account. Please try again." },
      { status: 500 }
    );
  }

  try {
    await db.insert(landlords).values({ profileId: userId });
  } catch (err) {
    // Compensate: don't leave an orphaned auth user (with a profiles row via
    // fn_handle_new_user) but no landlord record.
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(userId);
    if (cleanupError) {
      // Cleanup itself failing is a known, visible gap — surfaced in logs
      // for manual follow-up rather than swallowed silently.
      console.error(
        `[register] Failed to clean up orphaned auth user ${userId} after landlords insert failure:`,
        cleanupError
      );
    }

    console.error("[register] people.landlords insert failed:", err);

    return NextResponse.json(
      { message: "Could not create your account. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message:
        "Account created. Please check your email to confirm your account.",
    },
    { status: 201 }
  );
}

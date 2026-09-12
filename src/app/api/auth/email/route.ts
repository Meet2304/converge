import { type NextRequest, NextResponse } from "next/server";
import { getAnonSessionId } from "@/lib/auth/anon";
import { safeReturnTo } from "@/lib/auth/paths";
import { displayNameFromAuthUser, ensureAppUser } from "@/lib/auth/session";
import { requestOrigin } from "@/lib/http/request-origin";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function emailRedirectTo(req: NextRequest, redirectTo: string) {
  return `${requestOrigin(req)}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    displayName?: string;
    mode?: string;
    redirectTo?: string;
  };

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : email.split("@")[0] || "Organizer";
  const mode = body.mode === "signin" || body.mode === "resend" ? body.mode : "signup";
  const redirectTo = safeReturnTo(body.redirectTo, "/org");

  if (!email.includes("@") || email.length < 5) {
    return jsonError("Enter a valid email address.");
  }

  const supabase = await createClient();
  const confirmRedirect = emailRedirectTo(req, redirectTo);

  if (mode === "resend") {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: confirmRedirect },
    });
    if (error) {
      console.error("Supabase resend failed", error.message);
      return jsonError(error.message);
    }
    return NextResponse.json({ ok: true, needsEmail: true });
  }

  if (password.length < 6) {
    return jsonError("Password must be at least 6 characters.");
  }

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: confirmRedirect,
      },
    });
    if (error) {
      const already = /already registered|already been registered|user already/i.test(
        error.message,
      );
      const mailerDown = /sending confirmation email|error sending/i.test(error.message);
      if (!already && !mailerDown) {
        console.error("Supabase signUp failed", error.message);
        return jsonError(error.message);
      }
      // Mailer is not configured on this project — fall through to password sign-in
      // after the autoconfirm trigger has marked the user confirmed.
    } else if (data.session && data.user) {
      const anonSessionId = await getAnonSessionId();
      await ensureAppUser(
        {
          ...data.user,
          user_metadata: { ...data.user.user_metadata, display_name: displayName },
        },
        anonSessionId,
      );
      return NextResponse.json({ ok: true, redirectTo });
    } else {
      return NextResponse.json({
        ok: true,
        needsEmail: true,
        message: "Check your email for a confirmation link from Supabase.",
      });
    }
  }

  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signedIn.user) {
    const confirmRequired = /confirm|not confirmed|email not confirmed/i.test(
      signInError?.message ?? "",
    );
    if (confirmRequired) {
      return NextResponse.json(
        {
          error: "Confirm your email first. Check your inbox, or resend the link.",
          needsEmail: true,
        },
        { status: 401 },
      );
    }
    console.error("Supabase signIn failed", signInError?.message);
    return jsonError(
      mode === "signup"
        ? "Could not create that account. Try signing in if you already registered."
        : "Incorrect email or password.",
      401,
    );
  }

  const anonSessionId = await getAnonSessionId();
  const authUser = signedIn.user;
  if (!displayNameFromAuthUser(authUser) && displayName) {
    await supabase.auth.updateUser({ data: { display_name: displayName } });
  }
  await ensureAppUser(
    {
      ...authUser,
      user_metadata: { ...authUser.user_metadata, display_name: displayName },
    },
    anonSessionId,
  );

  return NextResponse.json({ ok: true, redirectTo });
}

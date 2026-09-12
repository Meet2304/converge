import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getAnonSessionId } from "@/lib/auth/anon";
import { safeReturnTo } from "@/lib/auth/paths";
import { ensureAppUser } from "@/lib/auth/session";
import { requestOrigin } from "@/lib/http/request-origin";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  const next = safeReturnTo(
    req.nextUrl.searchParams.get("next") || req.nextUrl.searchParams.get("returnTo"),
    "/org",
  );
  const code = req.nextUrl.searchParams.get("code");
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const typeRaw = req.nextUrl.searchParams.get("type");
  const login = new URL("/login", origin);
  login.searchParams.set("returnTo", next);

  const supabase = await createClient();
  let user = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      console.error("Supabase code exchange failed", error?.message);
      login.searchParams.set("error", "auth");
      return NextResponse.redirect(login);
    }
    user = data.user;
  } else if (tokenHash && typeRaw && OTP_TYPES.has(typeRaw as EmailOtpType)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: typeRaw as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error || !data.user) {
      console.error("Supabase OTP verify failed", error?.message);
      login.searchParams.set("error", "auth");
      return NextResponse.redirect(login);
    }
    user = data.user;
  } else {
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  try {
    const anonSessionId = await getAnonSessionId();
    await ensureAppUser(user, anonSessionId);
  } catch (err) {
    console.error("Failed to create app user after Supabase login", err);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(next, origin));
}

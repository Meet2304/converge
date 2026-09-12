import { type NextRequest, NextResponse } from "next/server";
import { getAnonSessionId } from "@/lib/auth/anon";
import { safeReturnTo } from "@/lib/auth/paths";
import { ensureAppUser } from "@/lib/auth/session";
import { requestOrigin } from "@/lib/http/request-origin";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  const next = safeReturnTo(req.nextUrl.searchParams.get("next"), "/org");
  const code = req.nextUrl.searchParams.get("code");
  const login = new URL("/login", origin);
  login.searchParams.set("returnTo", next);

  if (!code) {
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("Supabase auth callback failed", error?.message);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  try {
    const anonSessionId = await getAnonSessionId();
    await ensureAppUser(data.user, anonSessionId);
  } catch (err) {
    console.error("Failed to create app user after Supabase login", err);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(next, origin));
}

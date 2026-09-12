import { type NextRequest, NextResponse } from "next/server";
import { safeReturnTo } from "@/lib/auth/paths";
import { googleAuthEnabled } from "@/lib/auth/session";
import { requestOrigin } from "@/lib/http/request-origin";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"), "/org");
  const origin = requestOrigin(req);
  const login = new URL("/login", origin);
  login.searchParams.set("returnTo", returnTo);

  if (!googleAuthEnabled()) {
    login.searchParams.set("error", "google");
    return NextResponse.redirect(login);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error("Supabase Google OAuth failed", error?.message);
    login.searchParams.set("error", "google");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(data.url);
}

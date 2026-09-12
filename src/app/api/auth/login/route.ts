import { type NextRequest, NextResponse } from "next/server";
import { auth0Configured, authDevBypassEnabled } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "/org";

  if (!auth0Configured()) {
    const page = new URL("/login", req.url);
    page.searchParams.set("returnTo", returnTo);
    if (!authDevBypassEnabled()) {
      page.searchParams.set("error", "auth-unavailable");
    }
    return NextResponse.redirect(page);
  }

  const issuer = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, "");
  const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
  const url = new URL(`${issuer}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", process.env.AUTH0_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("connection", "google-oauth2");
  url.searchParams.set("state", Buffer.from(JSON.stringify({ returnTo })).toString("base64url"));
  return NextResponse.redirect(url);
}

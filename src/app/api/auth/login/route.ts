import { type NextRequest, NextResponse } from "next/server";
import { auth0Configured, authDevBypassEnabled } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "/org";

  if (!auth0Configured()) {
    if (authDevBypassEnabled()) {
      const page = new URL("/", req.url);
      page.searchParams.set("login", "1");
      page.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(page);
    }
    return NextResponse.json(
      { error: "Auth0 is not configured and AUTH_DEV_BYPASS is false" },
      { status: 503 },
    );
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

import { type NextRequest, NextResponse } from "next/server";
import { auth0CallbackUri, normalizeAuth0Issuer, requestOrigin } from "@/lib/auth/auth0";
import { safeReturnTo } from "@/lib/auth/paths";
import { auth0Configured, authDevBypassEnabled } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"), "/org");

  if (!auth0Configured()) {
    const page = new URL("/login", requestOrigin(req));
    page.searchParams.set("returnTo", returnTo);
    if (!authDevBypassEnabled()) {
      page.searchParams.set("error", "auth-unavailable");
    }
    return NextResponse.redirect(page);
  }

  try {
    const issuer = normalizeAuth0Issuer(process.env.AUTH0_ISSUER_BASE_URL);
    const clientId = process.env.AUTH0_CLIENT_ID;
    if (!issuer || !clientId) {
      throw new Error("Auth0 issuer or client id missing");
    }

    const url = new URL(`${issuer}/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", auth0CallbackUri(req));
    url.searchParams.set("scope", "openid profile email");
    url.searchParams.set("connection", "google-oauth2");
    url.searchParams.set("state", Buffer.from(JSON.stringify({ returnTo })).toString("base64url"));
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Auth0 login failed", error);
    const page = new URL("/login", requestOrigin(req));
    page.searchParams.set("returnTo", returnTo);
    page.searchParams.set("error", "auth0");
    return NextResponse.redirect(page);
  }
}

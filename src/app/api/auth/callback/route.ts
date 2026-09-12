import { type NextRequest, NextResponse } from "next/server";
import { getAnonSessionId } from "@/lib/auth/anon";
import { upsertUserAndMergeAnon } from "@/lib/auth/merge";
import { auth0Configured, setSessionCookie } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  if (!auth0Configured()) {
    return NextResponse.json({ error: "Auth0 not configured" }, { status: 503 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  let returnTo = "/org";
  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
      if (typeof parsed.returnTo === "string" && parsed.returnTo.startsWith("/")) {
        returnTo = parsed.returnTo;
      }
    }
  } catch {
    /* ignore */
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=auth", req.url));
  }

  const issuer = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, "");
  const tokenRes = await fetch(`${issuer}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token", req.url));
  }
  const tokens = await tokenRes.json();
  const userRes = await fetch(`${issuer}/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/?error=userinfo", req.url));
  }
  const profile = await userRes.json();
  const anonSessionId = await getAnonSessionId();
  const user = await upsertUserAndMergeAnon({
    auth0Sub: profile.sub,
    email: profile.email ?? null,
    displayName: profile.name ?? profile.nickname ?? null,
    anonSessionId,
  });
  await setSessionCookie(user);
  return NextResponse.redirect(new URL(returnTo, req.url));
}

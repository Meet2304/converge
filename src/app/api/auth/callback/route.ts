import { type NextRequest, NextResponse } from "next/server";
import { getAnonSessionId } from "@/lib/auth/anon";
import { auth0CallbackUri, normalizeAuth0Issuer, requestOrigin } from "@/lib/auth/auth0";
import { upsertUserAndMergeAnon } from "@/lib/auth/merge";
import { safeReturnTo } from "@/lib/auth/paths";
import { auth0Configured, setSessionCookie } from "@/lib/auth/session";

function loginError(req: NextRequest, code: string) {
  const page = new URL("/login", requestOrigin(req));
  page.searchParams.set("error", code);
  return NextResponse.redirect(page);
}

export async function GET(req: NextRequest) {
  if (!auth0Configured()) {
    return loginError(req, "auth-unavailable");
  }

  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  let returnTo = "/org";
  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
        returnTo?: string;
      };
      returnTo = safeReturnTo(parsed.returnTo, "/org");
    }
  } catch {
    /* ignore */
  }

  if (!code) {
    return loginError(req, "auth");
  }

  const issuer = normalizeAuth0Issuer(process.env.AUTH0_ISSUER_BASE_URL);
  if (!issuer) {
    return loginError(req, "auth0");
  }

  try {
    const tokenRes = await fetch(`${issuer}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: auth0CallbackUri(req),
      }),
    });
    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("Auth0 token exchange failed", tokenRes.status, detail);
      return loginError(req, "token");
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return loginError(req, "token");
    }

    const userRes = await fetch(`${issuer}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) {
      console.error("Auth0 userinfo failed", userRes.status);
      return loginError(req, "userinfo");
    }
    const profile = (await userRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      nickname?: string;
    };
    if (!profile.sub) {
      return loginError(req, "userinfo");
    }

    const anonSessionId = await getAnonSessionId();
    const user = await upsertUserAndMergeAnon({
      auth0Sub: profile.sub,
      email: profile.email ?? null,
      displayName: profile.name ?? profile.nickname ?? null,
      anonSessionId,
    });
    await setSessionCookie(user);
    return NextResponse.redirect(new URL(returnTo, requestOrigin(req)));
  } catch (error) {
    console.error("Auth0 callback failed", error);
    return loginError(req, "auth0");
  }
}

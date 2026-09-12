import type { NextRequest } from "next/server";

export function normalizeAuth0Issuer(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let issuer = raw
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/$/, "");
  if (!issuer) return null;
  if (!/^https?:\/\//i.test(issuer)) issuer = `https://${issuer}`;
  try {
    const url = new URL(issuer);
    if (!url.hostname) return null;
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

export function requestOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.headers.get("host") || req.nextUrl.host;
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    req.nextUrl.protocol.replace(":", "") ||
    "https";
  if (!host) return req.nextUrl.origin;
  return `${proto}://${host}`;
}

export function auth0CallbackUri(req: NextRequest): string {
  return `${requestOrigin(req)}/api/auth/callback`;
}

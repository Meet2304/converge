import type { NextRequest } from "next/server";

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

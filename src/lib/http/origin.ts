import { headers } from "next/headers";

export async function getAppOrigin(): Promise<string> {
  const configured = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

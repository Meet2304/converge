import { headers } from "next/headers";

export async function getAppOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

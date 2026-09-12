import { type NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", req.url));
}

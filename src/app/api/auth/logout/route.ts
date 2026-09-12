import { type NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { requestOrigin } from "@/lib/http/request-origin";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  await clearSession();
  return NextResponse.redirect(new URL("/", requestOrigin(req)));
}

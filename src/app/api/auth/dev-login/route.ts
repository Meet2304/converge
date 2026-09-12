import { type NextRequest, NextResponse } from "next/server";
import { getAnonSessionId } from "@/lib/auth/anon";
import { upsertUserAndMergeAnon } from "@/lib/auth/merge";
import { authDevBypassEnabled, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  if (!authDevBypassEnabled()) {
    return NextResponse.json({ error: "AUTH_DEV_BYPASS disabled" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "dev@converge.local";
  const displayName = typeof body.displayName === "string" ? body.displayName : "Dev Organizer";
  const auth0Sub =
    typeof body.sub === "string" && body.sub.length > 0 ? body.sub : `dev|${email.toLowerCase()}`;

  const anonSessionId = await getAnonSessionId();
  const user = await upsertUserAndMergeAnon({
    auth0Sub,
    email,
    displayName,
    anonSessionId,
  });
  await setSessionCookie(user);

  const redirectTo =
    typeof body.redirectTo === "string" && body.redirectTo.startsWith("/")
      ? body.redirectTo
      : "/org";

  return NextResponse.json({ ok: true, user, redirectTo });
}

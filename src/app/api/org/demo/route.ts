import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/context";
import { createDemoEventRecord } from "@/lib/org/mutations";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await createDemoEventRecord(user);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      redirectTo: `/org/${result.orgId}/events/${result.eventId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create demo event";
    const status = message === "Sign in required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

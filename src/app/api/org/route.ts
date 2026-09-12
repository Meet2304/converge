import { type NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/context";
import { createOrganizationRecord } from "@/lib/org/mutations";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      website?: string;
    };
    const result = await createOrganizationRecord(user, {
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : undefined,
      website: typeof body.website === "string" ? body.website : undefined,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, redirectTo: `/org/${result.orgId}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create organization";
    const status = message === "Sign in required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

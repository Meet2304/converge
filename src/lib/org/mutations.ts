import type { SessionUser } from "@/lib/auth/types";
import { makeShareCode, slugify } from "@/lib/codes";
import { createAdminClient } from "@/lib/supabase/admin";

async function uniqueSlug(base: string): Promise<string> {
  const db = createAdminClient();
  let slug = slugify(base);
  const { data: clash } = await db
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) slug = `${slug}-${makeShareCode().slice(0, 3).toLowerCase()}`;
  return slug;
}

async function uniqueShareCode(): Promise<string> {
  const db = createAdminClient();
  let shareCode = makeShareCode();
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await db
      .from("events")
      .select("id")
      .eq("share_code", shareCode)
      .maybeSingle();
    if (!exists) return shareCode;
    shareCode = makeShareCode();
  }
  return shareCode;
}

export async function createOrganizationRecord(
  user: SessionUser,
  input: { name: string; description?: string; website?: string },
): Promise<{ orgId: string } | { error: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Organization name required" };

  const db = createAdminClient();
  const slug = await uniqueSlug(name);
  const website = input.website?.trim();
  const { data: org, error } = await db
    .from("organizations")
    .insert({
      name,
      slug,
      owner_user_id: user.id,
      contact_email: user.email,
      description: input.description?.trim() || null,
      website: website && website !== "https://" ? website : null,
    })
    .select("id")
    .single();
  if (error || !org) {
    console.error("createOrganizationRecord failed", error);
    return { error: error?.message ?? "Failed to create organization" };
  }

  const { error: memberError } = await db.from("org_memberships").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) {
    console.error("org membership insert failed", memberError);
    return { error: memberError.message };
  }

  return { orgId: org.id };
}

export async function createDemoEventRecord(
  user: SessionUser,
): Promise<{ orgId: string; eventId: string } | { error: string }> {
  const db = createAdminClient();

  const { data: memberships, error: membershipError } = await db
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1);
  if (membershipError) {
    console.error("demo membership lookup failed", membershipError);
    return { error: membershipError.message };
  }

  let orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) {
    const created = await createOrganizationRecord(user, {
      name: user.displayName ? `${user.displayName}'s org` : "Demo organization",
      description: "Created from one-click demo setup.",
    });
    if ("error" in created) return created;
    orgId = created.orgId;
  }

  const starts = new Date();
  const ends = new Date(starts.getTime() + 48 * 60 * 60 * 1000);
  const shareCode = await uniqueShareCode();

  const { data: event, error } = await db
    .from("events")
    .insert({
      org_id: orgId,
      name: "Demo hackathon",
      slug: slugify(`demo-hackathon-${shareCode}`),
      short_description: "Looking is open. Share the code and start matching.",
      venue_name: "Demo venue",
      timezone: "America/New_York",
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      looking_opens_at: starts.toISOString(),
      max_team_size: 4,
      min_team_size: 1,
      share_code: shareCode,
      created_by: user.id,
      map_enabled: true,
      chat_enabled: true,
    })
    .select("id")
    .single();
  if (error || !event) {
    console.error("createDemoEventRecord failed", error);
    return { error: error?.message ?? "Failed to create event" };
  }

  return { orgId, eventId: event.id };
}

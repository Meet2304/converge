"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/auth/context";
import { DEFAULT_AVATAR } from "@/lib/display";
import { createAdminClient } from "@/lib/supabase/admin";

const NICKS = [
  "Signal Fox",
  "Quiet Comet",
  "Neon Relay",
  "Copper Finch",
  "Amber Grid",
  "Pixel Heron",
  "Volt Moth",
  "Cache Wren",
  "Prism Hare",
  "Delta Kite",
];

function randomNick() {
  return `${NICKS[Math.floor(Math.random() * NICKS.length)]} ${Math.floor(10 + Math.random() * 89)}`;
}

export async function enterEventCode(formData: FormData) {
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  if (!code) throw new Error("Enter an event code");
  const db = createAdminClient();
  const { data } = await db
    .from("events")
    .select("id, share_code")
    .eq("share_code", code)
    .maybeSingle();
  if (!data) throw new Error("No event found for that code");
  redirect(`/event/${data.share_code}`);
}

export async function joinEvent(formData: FormData) {
  const ctx = await getRequestContext();
  const eventId = String(formData.get("eventId") || "");
  const role = String(formData.get("role") || "").trim();
  const experience = String(formData.get("experience") || "some");
  const desiredTeamSize = Number(formData.get("desiredTeamSize") || 4);
  const looking = formData.get("looking") !== "false";
  const skillsRaw = String(formData.get("skills") || "");
  const bio = String(formData.get("bio") || "").trim() || null;
  const affiliation = String(formData.get("affiliation") || "").trim() || null;

  if (!eventId || !role) throw new Error("Role is required");
  if (!["first", "some", "experienced"].includes(experience)) {
    throw new Error("Invalid experience");
  }

  const db = createAdminClient();
  const { data: event } = await db
    .from("events")
    .select("id, share_code, max_team_size")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) throw new Error("Event not found");

  let existing: { id: string; nickname: string; avatar_url: string } | null = null;
  if (ctx.user) {
    const { data } = await db
      .from("participations")
      .select("id, nickname, avatar_url")
      .eq("event_id", eventId)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    existing = data;
  }
  if (!existing) {
    const { data } = await db
      .from("participations")
      .select("id, nickname, avatar_url")
      .eq("event_id", eventId)
      .eq("anon_session_id", ctx.anonSessionId)
      .maybeSingle();
    existing = data;
  }

  const payload = {
    event_id: eventId,
    user_id: ctx.user?.id ?? null,
    anon_session_id: ctx.anonSessionId,
    looking,
    role,
    experience,
    desired_team_size: Math.min(Math.max(desiredTeamSize, 1), event.max_team_size),
    affiliation,
    bio,
    nickname: existing?.nickname || randomNick(),
    avatar_url: existing?.avatar_url || DEFAULT_AVATAR,
    updated_at: new Date().toISOString(),
  };

  let participationId = existing?.id;
  if (existing) {
    const { error } = await db.from("participations").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db.from("participations").insert(payload).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Join failed");
    participationId = data.id;
  }

  await db.from("participation_skills").delete().eq("participation_id", participationId!);
  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (skills.length) {
    await db.from("participation_skills").insert(
      skills.map((label) => ({
        participation_id: participationId!,
        label,
        kind: "chip",
      })),
    );
  }

  // Join-before-location: create consent row without sharing
  await db.from("location_state").upsert(
    {
      participation_id: participationId!,
      sharing_enabled: false,
      want_to_be_found: false,
    },
    { onConflict: "participation_id" },
  );

  // Grok / resume stubs — fire-and-forget, never block Join
  void Promise.resolve();

  revalidatePath(`/event/${event.share_code}`);
  redirect(`/event/${event.share_code}/looking`);
}

export async function setLooking(formData: FormData) {
  const ctx = await getRequestContext();
  const participationId = String(formData.get("participationId") || "");
  const looking = formData.get("looking") === "true";
  const db = createAdminClient();
  const { data: part } = await db
    .from("participations")
    .select("id, event_id, user_id, anon_session_id, events(share_code)")
    .eq("id", participationId)
    .maybeSingle();
  if (!part) throw new Error("Participation not found");
  const mine =
    (ctx.user && part.user_id === ctx.user.id) || part.anon_session_id === ctx.anonSessionId;
  if (!mine) throw new Error("Not authorized");
  await db
    .from("participations")
    .update({ looking, updated_at: new Date().toISOString() })
    .eq("id", participationId);
  const share = (part as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}/looking`);
}

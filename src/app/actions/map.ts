"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext, requireUser } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";

export async function consentAndEnableSharing(formData: FormData) {
  const ctx = await getRequestContext();
  const participationId = String(formData.get("participationId") || "");
  const wantToBeFound = formData.get("wantToBeFound") === "true";
  const db = createAdminClient();

  const { data: part } = await db
    .from("participations")
    .select("id, user_id, anon_session_id, event_id, events(share_code, map_enabled)")
    .eq("id", participationId)
    .maybeSingle();
  if (!part) throw new Error("Participation not found");
  const event = (part as unknown as { events: { share_code: string; map_enabled: boolean } })
    .events;
  if (!event.map_enabled) throw new Error("Map is not enabled for this event");

  const mine =
    (ctx.user && part.user_id === ctx.user.id) || part.anon_session_id === ctx.anonSessionId;
  if (!mine) throw new Error("Not authorized");

  await db.from("location_state").upsert(
    {
      participation_id: participationId,
      consent_at: new Date().toISOString(),
      sharing_enabled: true,
      want_to_be_found: wantToBeFound,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participation_id" },
  );

  revalidatePath(`/event/${event.share_code}/map`);
}

export async function upsertSparseLocation(formData: FormData) {
  const ctx = await getRequestContext();
  const participationId = String(formData.get("participationId") || "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Invalid coordinates");

  const db = createAdminClient();
  const { data: part } = await db
    .from("participations")
    .select("id, user_id, anon_session_id")
    .eq("id", participationId)
    .maybeSingle();
  if (!part) throw new Error("Participation not found");
  const mine =
    (ctx.user && part.user_id === ctx.user.id) || part.anon_session_id === ctx.anonSessionId;
  if (!mine) throw new Error("Not authorized");

  const { data: state } = await db
    .from("location_state")
    .select("consent_at, sharing_enabled")
    .eq("participation_id", participationId)
    .maybeSingle();
  if (!state?.consent_at || !state.sharing_enabled) {
    throw new Error("Enable location sharing first");
  }

  await db
    .from("location_state")
    .update({
      last_lat: lat,
      last_lng: lng,
      last_located_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("participation_id", participationId);

  return { ok: true };
}

export async function dropMeetupPin(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const label = String(formData.get("label") || "").trim() || null;
  const visibility = String(formData.get("visibility") || "team");
  if (!["team", "self", "matches"].includes(visibility)) throw new Error("Invalid visibility");

  const db = createAdminClient();
  const { data: mine } = await db
    .from("participations")
    .select("id, current_team_id, events(share_code)")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mine) throw new Error("Join required");

  await db.from("meetup_pins").insert({
    event_id: eventId,
    created_by_participation_id: mine.id,
    team_id: visibility === "team" ? mine.current_team_id : null,
    lat,
    lng,
    label,
    visibility,
  });

  const share = (mine as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}/map`);
}

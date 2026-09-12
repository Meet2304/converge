"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/context";
import { makeShareCode, slugify } from "@/lib/codes";
import { createDemoEventRecord, createOrganizationRecord } from "@/lib/org/mutations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createOrganization(formData: FormData) {
  const user = await requireUser();
  const result = await createOrganizationRecord(user, {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    website: String(formData.get("website") || ""),
  });
  if ("error" in result) throw new Error(result.error);
  redirect(`/org/${result.orgId}`);
}

export async function createDemoEvent() {
  const user = await requireUser();
  const result = await createDemoEventRecord(user);
  if ("error" in result) throw new Error(result.error);
  revalidatePath(`/org/${result.orgId}`);
  redirect(`/org/${result.orgId}/events/${result.eventId}`);
}

export async function createEvent(formData: FormData) {
  const user = await requireUser();
  const orgId = String(formData.get("orgId") || "");
  const name = String(formData.get("name") || "").trim();
  const shortDescription = String(formData.get("shortDescription") || "").trim();
  const venueName = String(formData.get("venueName") || "").trim();
  const timezone = String(formData.get("timezone") || "America/New_York").trim();
  const startsAt = String(formData.get("startsAt") || "");
  const endsAt = String(formData.get("endsAt") || "");
  const lookingOpensAt = String(formData.get("lookingOpensAt") || startsAt);
  const maxTeamSize = Number(formData.get("maxTeamSize") || 4);
  const minTeamSize = Number(formData.get("minTeamSize") || 1);

  if (!orgId || !name || !shortDescription || !venueName || !startsAt || !endsAt) {
    throw new Error("Missing required event fields");
  }

  const db = createAdminClient();
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Not an organizer for this org");

  let shareCode = makeShareCode();
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await db
      .from("events")
      .select("id")
      .eq("share_code", shareCode)
      .maybeSingle();
    if (!exists) break;
    shareCode = makeShareCode();
  }

  const { data: event, error } = await db
    .from("events")
    .insert({
      org_id: orgId,
      name,
      slug: slugify(name),
      short_description: shortDescription,
      long_description: String(formData.get("longDescription") || "").trim() || null,
      venue_name: venueName,
      venue_address: String(formData.get("venueAddress") || "").trim() || null,
      timezone,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      looking_opens_at: new Date(lookingOpensAt).toISOString(),
      max_team_size: maxTeamSize,
      min_team_size: minTeamSize,
      expected_attendance: Number(formData.get("expectedAttendance") || 0) || null,
      share_code: shareCode,
      created_by: user.id,
      map_enabled: false,
      chat_enabled: true,
    })
    .select("id, share_code")
    .single();
  if (error || !event) throw new Error(error?.message ?? "Failed to create event");

  revalidatePath(`/org/${orgId}`);
  redirect(`/org/${orgId}/events/${event.id}`);
}

export async function updateEventToggles(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const db = createAdminClient();

  const { data: event } = await db
    .from("events")
    .select("id, org_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) throw new Error("Event not found");
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", event.org_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Not authorized");

  const patch: Record<string, unknown> = {
    map_enabled: formData.get("mapEnabled") === "on" || formData.get("mapEnabled") === "true",
    chat_enabled: formData.get("chatEnabled") === "on" || formData.get("chatEnabled") === "true",
    updated_at: new Date().toISOString(),
  };
  const lookingOpensAt = String(formData.get("lookingOpensAt") || "");
  if (lookingOpensAt) patch.looking_opens_at = new Date(lookingOpensAt).toISOString();

  if (formData.get("publishTracks") === "true") {
    patch.tracks_published_at = new Date().toISOString();
  }
  if (formData.get("lockTracks") === "true") {
    patch.track_selection_locked_at = new Date().toISOString();
  }

  const lat = formData.get("mapCenterLat");
  const lng = formData.get("mapCenterLng");
  if (lat) patch.map_center_lat = Number(lat);
  if (lng) patch.map_center_lng = Number(lng);
  const geo = formData.get("geofenceRadiusM");
  const hide = formData.get("geofenceHideRadiusM");
  if (geo) patch.geofence_radius_m = Number(geo);
  if (hide) patch.geofence_hide_radius_m = Number(hide);

  await db.from("events").update(patch).eq("id", eventId);
  revalidatePath(`/org/${event.org_id}/events/${eventId}`);
  revalidatePath(`/event/${eventId}`);
}

export async function addTimelineItem(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const label = String(formData.get("label") || "").trim();
  const occursAt = String(formData.get("occursAt") || "");
  if (!label || !occursAt) throw new Error("Timeline label and time required");

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("org_id").eq("id", eventId).maybeSingle();
  if (!event) throw new Error("Event not found");
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", event.org_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Not authorized");

  await db.from("event_timeline_items").insert({
    event_id: eventId,
    label,
    occurs_at: new Date(occursAt).toISOString(),
    sort_order: Number(formData.get("sortOrder") || 0),
  });
  revalidatePath(`/org/${event.org_id}/events/${eventId}`);
}

export async function addTrack(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Track name required");
  const db = createAdminClient();
  const { data: event } = await db.from("events").select("org_id").eq("id", eventId).maybeSingle();
  if (!event) throw new Error("Event not found");
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", event.org_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Not authorized");

  await db.from("event_tracks").insert({
    event_id: eventId,
    name,
    sort_order: Number(formData.get("sortOrder") || 0),
  });
  revalidatePath(`/org/${event.org_id}/events/${eventId}`);
}

export async function resolveReport(formData: FormData) {
  const user = await requireUser();
  const reportId = String(formData.get("reportId") || "");
  const status = String(formData.get("status") || "resolved");
  const moderationStatus = String(formData.get("moderationStatus") || "");
  const db = createAdminClient();

  const { data: report } = await db
    .from("reports")
    .select("id, event_id, target_participation_id, events!inner(org_id)")
    .eq("id", reportId)
    .maybeSingle();
  if (!report) throw new Error("Report not found");

  const orgId = (report as unknown as { events: { org_id: string } }).events.org_id;
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Not authorized");

  await db.from("reports").update({ status }).eq("id", reportId);

  if (moderationStatus && report.target_participation_id) {
    const { data: target } = await db
      .from("participations")
      .select("user_id")
      .eq("id", report.target_participation_id)
      .maybeSingle();
    if (target?.user_id) {
      await db
        .from("users")
        .update({ moderation_status: moderationStatus, updated_at: new Date().toISOString() })
        .eq("id", target.user_id);
    }
  }

  revalidatePath(`/org/${orgId}/events/${report.event_id}`);
}

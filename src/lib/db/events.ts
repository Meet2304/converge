import { createAdminClient } from "@/lib/supabase/admin";

export async function getEventByKey(eventKey: string) {
  const db = createAdminClient();
  const upper = eventKey.toUpperCase();
  const byCode = await db
    .from("events")
    .select("*, organizations(*)")
    .eq("share_code", upper)
    .maybeSingle();
  if (byCode.data) return byCode.data;

  const byId = await db
    .from("events")
    .select("*, organizations(*)")
    .eq("id", eventKey)
    .maybeSingle();
  return byId.data;
}

export async function getMyParticipation(
  eventId: string,
  opts: { userId?: string | null; anonSessionId: string },
) {
  const db = createAdminClient();
  if (opts.userId) {
    const { data } = await db
      .from("participations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", opts.userId)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await db
    .from("participations")
    .select("*")
    .eq("event_id", eventId)
    .eq("anon_session_id", opts.anonSessionId)
    .maybeSingle();
  return data;
}

// Aliases used by pages
export const getEventByKeyAlias = getEventByKey;
export const getMyParticipationAlias = getMyParticipation;

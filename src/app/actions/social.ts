"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequestContext, requireUser } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";

async function getMine(eventId: string) {
  const ctx = await getRequestContext();
  const db = createAdminClient();
  if (ctx.user) {
    const { data } = await db
      .from("participations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (data) return { ctx, db, mine: data };
  }
  const { data } = await db
    .from("participations")
    .select("*")
    .eq("event_id", eventId)
    .eq("anon_session_id", ctx.anonSessionId)
    .maybeSingle();
  if (!data) throw new Error("Join the event before liking");
  return { ctx, db, mine: data };
}

function orderedPair(a: string, b: string) {
  return a < b ? ([a, b] as const) : ([b, a] as const);
}

export async function likeParticipation(formData: FormData) {
  const eventId = String(formData.get("eventId") || "");
  const toParticipationId = String(formData.get("toParticipationId") || "");
  const { ctx, db, mine } = await getMine(eventId);
  if (mine.id === toParticipationId) throw new Error("Cannot like yourself");

  const { error } = await db.from("likes").upsert(
    {
      event_id: eventId,
      from_participation_id: mine.id,
      to_participation_id: toParticipationId,
      from_anon_session_id: ctx.user ? null : ctx.anonSessionId,
    },
    { onConflict: "event_id,from_participation_id,to_participation_id" },
  );
  if (error) throw new Error(error.message);

  // Mutual like → match + DM conversation (app transaction style)
  const { data: reciprocal } = await db
    .from("likes")
    .select("id")
    .eq("event_id", eventId)
    .eq("from_participation_id", toParticipationId)
    .eq("to_participation_id", mine.id)
    .maybeSingle();

  let matchId: string | null = null;
  if (reciprocal) {
    const [a, b] = orderedPair(mine.id, toParticipationId);
    const { data: existing } = await db
      .from("matches")
      .select("id, conversation_id")
      .eq("event_id", eventId)
      .eq("participation_a_id", a)
      .eq("participation_b_id", b)
      .maybeSingle();

    if (existing) {
      matchId = existing.id;
    } else {
      const { data: match, error: matchErr } = await db
        .from("matches")
        .insert({
          event_id: eventId,
          participation_a_id: a,
          participation_b_id: b,
        })
        .select("id")
        .single();
      if (matchErr || !match) throw new Error(matchErr?.message ?? "Match failed");
      matchId = match.id;

      const { data: convo, error: convoErr } = await db
        .from("conversations")
        .insert({
          event_id: eventId,
          kind: "dm",
          match_id: match.id,
        })
        .select("id")
        .single();
      if (convoErr || !convo) throw new Error(convoErr?.message ?? "Conversation failed");

      await db.from("conversation_members").insert([
        { conversation_id: convo.id, participation_id: a },
        { conversation_id: convo.id, participation_id: b },
      ]);
      await db.from("matches").update({ conversation_id: convo.id }).eq("id", match.id);
    }
  }

  const { data: event } = await db.from("events").select("share_code").eq("id", eventId).single();
  revalidatePath(`/event/${event?.share_code}/looking`);
  if (matchId) {
    redirect(`/event/${event?.share_code}/match/${matchId}`);
  }
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("Message required");

  const db = createAdminClient();
  const { data: convo } = await db
    .from("conversations")
    .select("id, event_id, events(share_code)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) throw new Error("Conversation not found");

  const { data: mine } = await db
    .from("participations")
    .select("id")
    .eq("event_id", convo.event_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mine) throw new Error("Join required");

  const { data: member } = await db
    .from("conversation_members")
    .select("participation_id")
    .eq("conversation_id", conversationId)
    .eq("participation_id", mine.id)
    .maybeSingle();
  if (!member) throw new Error("Not a member of this chat");

  await db.from("messages").insert({
    conversation_id: conversationId,
    sender_participation_id: mine.id,
    body,
  });

  const share = (convo as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}/chat/${conversationId}`);
}

export async function reportParticipation(formData: FormData) {
  const ctx = await getRequestContext();
  const eventId = String(formData.get("eventId") || "");
  const targetParticipationId = String(formData.get("targetParticipationId") || "");
  const context = String(formData.get("context") || "profile");
  const body = String(formData.get("body") || "").trim() || null;
  if (!["profile", "chat", "map"].includes(context)) throw new Error("Invalid context");

  const db = createAdminClient();
  let reporterParticipationId: string | null = null;
  if (ctx.user) {
    const { data } = await db
      .from("participations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    reporterParticipationId = data?.id ?? null;
  } else {
    const { data } = await db
      .from("participations")
      .select("id")
      .eq("event_id", eventId)
      .eq("anon_session_id", ctx.anonSessionId)
      .maybeSingle();
    reporterParticipationId = data?.id ?? null;
  }

  const { error } = await db.from("reports").insert({
    event_id: eventId,
    reporter_participation_id: reporterParticipationId,
    reporter_anon_session_id: ctx.user ? null : ctx.anonSessionId,
    target_participation_id: targetParticipationId,
    context,
    body,
    status: "open",
  });
  if (error) throw new Error(error.message);

  const { data: event } = await db.from("events").select("share_code").eq("id", eventId).single();
  revalidatePath(`/event/${event?.share_code}`);
}

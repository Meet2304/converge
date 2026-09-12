"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/context";
import { makeInviteCode } from "@/lib/codes";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireMyParticipation(eventId: string, userId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("participations")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Join the event first");
  return { db, mine: data };
}

export async function createTeam(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Team name required");

  const { db, mine } = await requireMyParticipation(eventId, user.id);
  if (mine.current_team_id) throw new Error("Already on a team for this event");

  const { data: team, error } = await db
    .from("teams")
    .insert({
      event_id: eventId,
      name,
      creator_participation_id: mine.id,
    })
    .select("id")
    .single();
  if (error || !team) throw new Error(error?.message ?? "Failed to create team");

  await db.from("team_members").insert({
    team_id: team.id,
    participation_id: mine.id,
    role: "creator",
  });
  await db
    .from("participations")
    .update({ current_team_id: team.id, looking: false, updated_at: new Date().toISOString() })
    .eq("id", mine.id);

  const { data: convo } = await db
    .from("conversations")
    .insert({ event_id: eventId, kind: "team", team_id: team.id })
    .select("id")
    .single();
  if (convo) {
    await db.from("conversation_members").insert({
      conversation_id: convo.id,
      participation_id: mine.id,
    });
  }

  const inviteCode = makeInviteCode();
  await db.from("team_invites").insert({
    team_id: team.id,
    code: inviteCode,
    created_by_participation_id: mine.id,
  });

  const { data: event } = await db.from("events").select("share_code").eq("id", eventId).single();
  revalidatePath(`/event/${event?.share_code}`);
  redirect(`/event/${event?.share_code}/team/${team.id}`);
}

export async function renameTeam(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name required");
  const db = createAdminClient();
  const { data: team } = await db
    .from("teams")
    .select("id, event_id, creator_participation_id, dissolved_at, events(share_code)")
    .eq("id", teamId)
    .maybeSingle();
  if (!team || team.dissolved_at) throw new Error("Team not found");

  const { data: mine } = await db
    .from("participations")
    .select("id")
    .eq("event_id", team.event_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mine || mine.id !== team.creator_participation_id) {
    throw new Error("Only the creator can rename");
  }

  await db.from("teams").update({ name, updated_at: new Date().toISOString() }).eq("id", teamId);
  const share = (team as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}/team/${teamId}`);
}

export async function createInvite(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") || "");
  const db = createAdminClient();
  const { data: team } = await db
    .from("teams")
    .select("id, event_id, dissolved_at, events(share_code, max_team_size)")
    .eq("id", teamId)
    .maybeSingle();
  if (!team || team.dissolved_at) throw new Error("Team not found");

  const { data: mine } = await db
    .from("participations")
    .select("id")
    .eq("event_id", team.event_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: member } = await db
    .from("team_members")
    .select("participation_id")
    .eq("team_id", teamId)
    .eq("participation_id", mine?.id ?? "")
    .maybeSingle();
  if (!member) throw new Error("Only members can invite");

  const code = makeInviteCode();
  await db.from("team_invites").insert({
    team_id: teamId,
    code,
    created_by_participation_id: mine?.id,
  });
  const share = (team as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}/team/${teamId}`);
}

export async function acceptInvite(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const db = createAdminClient();
  const { data: invite } = await db
    .from("team_invites")
    .select("*, teams(*, events(share_code, max_team_size))")
    .eq("code", code)
    .maybeSingle();
  if (!invite || invite.revoked_at || invite.accepted_at) throw new Error("Invite invalid");
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error("Invite expired");
  }

  const team = invite.teams as {
    id: string;
    event_id: string;
    dissolved_at: string | null;
    events: { share_code: string; max_team_size: number };
  };
  if (team.dissolved_at) throw new Error("Team dissolved");

  const { data: mine } = await db
    .from("participations")
    .select("*")
    .eq("event_id", team.event_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mine) throw new Error("Join the event first");
  if (mine.current_team_id && mine.current_team_id !== team.id) {
    throw new Error("Leave your current team before joining another");
  }

  const { count } = await db
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);
  if ((count ?? 0) >= team.events.max_team_size) throw new Error("Team is full");

  await db.from("team_members").upsert({
    team_id: team.id,
    participation_id: mine.id,
    role: "member",
  });
  await db
    .from("participations")
    .update({ current_team_id: team.id, looking: false, updated_at: new Date().toISOString() })
    .eq("id", mine.id);
  await db
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString(), invited_participation_id: mine.id })
    .eq("id", invite.id);

  const { data: convo } = await db
    .from("conversations")
    .select("id")
    .eq("team_id", team.id)
    .eq("kind", "team")
    .maybeSingle();
  if (convo) {
    await db.from("conversation_members").upsert({
      conversation_id: convo.id,
      participation_id: mine.id,
    });
  }

  // Auto-off looking when full
  const { count: after } = await db
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);
  if ((after ?? 0) >= team.events.max_team_size) {
    const { data: members } = await db
      .from("team_members")
      .select("participation_id")
      .eq("team_id", team.id);
    for (const m of members ?? []) {
      await db
        .from("participations")
        .update({ looking: false, updated_at: new Date().toISOString() })
        .eq("id", m.participation_id);
    }
  }

  redirect(`/event/${team.events.share_code}/team/${team.id}`);
}

export async function kickMember(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") || "");
  const targetParticipationId = String(formData.get("targetParticipationId") || "");
  const db = createAdminClient();
  const { data: team } = await db
    .from("teams")
    .select("*, events(share_code)")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) throw new Error("Team not found");

  const { data: mine } = await db
    .from("participations")
    .select("id")
    .eq("event_id", team.event_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mine || mine.id !== team.creator_participation_id) {
    throw new Error("Only creator can kick");
  }
  if (targetParticipationId === mine.id) throw new Error("Cannot kick yourself");

  await db
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("participation_id", targetParticipationId);
  await db
    .from("participations")
    .update({ current_team_id: null, updated_at: new Date().toISOString() })
    .eq("id", targetParticipationId);

  const share = (team as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}/team/${teamId}`);
}

export async function leaveTeam(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") || "");
  const transferTo = String(formData.get("transferTo") || "");
  const db = createAdminClient();
  const { data: team } = await db
    .from("teams")
    .select("*, events(share_code)")
    .eq("id", teamId)
    .maybeSingle();
  if (!team || team.dissolved_at) throw new Error("Team not found");

  const { data: mine } = await db
    .from("participations")
    .select("id")
    .eq("event_id", team.event_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mine) throw new Error("Not a participant");

  const { data: members } = await db
    .from("team_members")
    .select("participation_id")
    .eq("team_id", teamId);
  const memberIds = (members ?? []).map((m) => m.participation_id);
  if (!memberIds.includes(mine.id)) throw new Error("Not on this team");

  const isCreator = team.creator_participation_id === mine.id;
  const remaining = memberIds.filter((id) => id !== mine.id);

  if (remaining.length === 0) {
    await db
      .from("teams")
      .update({ dissolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", teamId);
  } else if (isCreator) {
    if (!transferTo || !remaining.includes(transferTo)) {
      throw new Error("Pick a remaining member to transfer creator to");
    }
    await db
      .from("teams")
      .update({ creator_participation_id: transferTo, updated_at: new Date().toISOString() })
      .eq("id", teamId);
    await db
      .from("team_members")
      .update({ role: "creator" })
      .eq("team_id", teamId)
      .eq("participation_id", transferTo);
  }

  await db.from("team_members").delete().eq("team_id", teamId).eq("participation_id", mine.id);
  await db
    .from("participations")
    .update({ current_team_id: null, updated_at: new Date().toISOString() })
    .eq("id", mine.id);

  const share = (team as unknown as { events: { share_code: string } }).events.share_code;
  revalidatePath(`/event/${share}`);
  redirect(`/event/${share}`);
}

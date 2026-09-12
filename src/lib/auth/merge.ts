import { createAdminClient } from "@/lib/supabase/admin"
import type { SessionUser } from "./types"

export async function upsertUserAndMergeAnon(opts: {
  auth0Sub: string
  email?: string | null
  displayName?: string | null
  anonSessionId?: string | null
}): Promise<SessionUser> {
  const db = createAdminClient()

  const { data: user, error } = await db
    .from("users")
    .upsert(
      {
        auth0_sub: opts.auth0Sub,
        email: opts.email ?? null,
        display_name: opts.displayName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "auth0_sub" }
    )
    .select("id, auth0_sub, email, display_name, moderation_status")
    .single()

  if (error || !user) throw new Error(error?.message ?? "Failed to upsert user")

  if (opts.anonSessionId) {
    await mergeAnonIntoUser(user.id, opts.anonSessionId)
  }

  return {
    id: user.id,
    auth0Sub: user.auth0_sub,
    email: user.email,
    displayName: user.display_name,
    moderationStatus: user.moderation_status,
  }
}

export async function mergeAnonIntoUser(userId: string, anonSessionId: string) {
  const db = createAdminClient()

  await db
    .from("anon_sessions")
    .update({ merged_user_id: userId, last_seen_at: new Date().toISOString() })
    .eq("id", anonSessionId)

  const { data: anonParts } = await db
    .from("participations")
    .select("id, event_id")
    .eq("anon_session_id", anonSessionId)
    .is("user_id", null)

  for (const part of anonParts ?? []) {
    const { data: existing } = await db
      .from("participations")
      .select("id")
      .eq("event_id", part.event_id)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      await db
        .from("likes")
        .update({ from_participation_id: existing.id })
        .eq("from_participation_id", part.id)
      await db
        .from("likes")
        .update({ to_participation_id: existing.id })
        .eq("to_participation_id", part.id)
      await db.from("participations").delete().eq("id", part.id)
    } else {
      await db
        .from("participations")
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", part.id)
    }
  }

  await db
    .from("likes")
    .update({ from_anon_session_id: null })
    .eq("from_anon_session_id", anonSessionId)

  await db
    .from("reports")
    .update({ reporter_anon_session_id: null })
    .eq("reporter_anon_session_id", anonSessionId)
}

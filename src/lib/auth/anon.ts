import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { ANON_COOKIE, SESSION_MAX_AGE } from "./constants"

export async function ensureAnonSessionId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(ANON_COOKIE)?.value
  const db = createAdminClient()

  if (existing) {
    const { data } = await db
      .from("anon_sessions")
      .select("id")
      .eq("id", existing)
      .maybeSingle()
    if (data?.id) {
      await db
        .from("anon_sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", data.id)
      return data.id
    }
  }

  const { data, error } = await db
    .from("anon_sessions")
    .insert({})
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Failed to create anon session")

  jar.set(ANON_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return data.id
}

/** Alias used by auth routes — always ensures a row exists. */
export async function getAnonSessionId(): Promise<string> {
  return ensureAnonSessionId()
}

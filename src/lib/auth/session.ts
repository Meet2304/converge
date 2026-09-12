import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAppUserByAuthSub, upsertUserAndMergeAnon } from "./merge";
import type { AppSession, SessionUser } from "./types";

function metadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function displayNameFromAuthUser(user: User): string | null {
  return (
    metadataString(user, "display_name") ??
    metadataString(user, "full_name") ??
    metadataString(user, "name")
  );
}

export async function getSession(): Promise<AppSession | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const existing = await getAppUserByAuthSub(data.user.id);
    const user = existing ?? (await ensureAppUser(data.user));
    return { user, issuedAt: 0 };
  } catch {
    return null;
  }
}

export async function ensureAppUser(
  authUser: User,
  anonSessionId?: string | null,
): Promise<SessionUser> {
  return upsertUserAndMergeAnon({
    auth0Sub: authUser.id,
    email: authUser.email ?? null,
    displayName: displayNameFromAuthUser(authUser),
    anonSessionId,
  });
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export function googleAuthEnabled() {
  return process.env.NEXT_PUBLIC_SUPABASE_GOOGLE === "true";
}

import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseAnonKey, getSupabaseUrl } from "./env";

/** Prefer service role when present; otherwise anon (RLS currently permissive for MVP). */
export function createAdminClient() {
  const key = getServiceRoleKey() ?? getSupabaseAnonKey();
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

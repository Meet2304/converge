import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl } from "./env"

export function createBrowserSupabase() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
}

const FALLBACK_SUPABASE_URL = "https://cxhfmsnkcketqdlcqdic.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aGZtc25rY2tldHFkbGNxZGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODc1MDQsImV4cCI6MjEwNDc2MzUwNH0.X358x5Ow8oTRhXlGoD9PQN-1KPfuS9QosgPT5DSMz6w";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

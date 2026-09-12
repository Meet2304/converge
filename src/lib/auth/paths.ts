export function loginPath(returnTo = "/org"): string {
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/org";
  return `/login?returnTo=${encodeURIComponent(safe)}`;
}

export function safeReturnTo(value: string | null | undefined, fallback = "/org"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

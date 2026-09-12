import { ensureAnonSessionId } from "./anon";
import { getSession } from "./session";
import type { SessionUser } from "./types";

export type RequestContext = {
  anonSessionId: string;
  user: SessionUser | null;
  signedIn: boolean;
};

export async function getRequestContext(): Promise<RequestContext> {
  const anonSessionId = await ensureAnonSessionId();
  const session = await getSession();
  return {
    anonSessionId,
    user: session?.user ?? null,
    signedIn: Boolean(session?.user),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) throw new Error("Sign in required");
  if (session.user.moderationStatus === "suspended" || session.user.moderationStatus === "banned") {
    throw new Error("Account restricted");
  }
  return session.user;
}

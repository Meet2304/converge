import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./constants";
import type { AppSession, SessionUser } from "./types";

const DEMO_AUTH_SECRET = "converge-demo-auth-secret-min16";

function secretKey() {
  const secret = process.env.AUTH_SECRET || process.env.AUTH0_SECRET || DEMO_AUTH_SECRET;
  return new TextEncoder().encode(secret.length >= 16 ? secret : DEMO_AUTH_SECRET);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const user = payload.user as SessionUser | undefined;
    if (!user?.id || !user.auth0Sub) return null;
    return { user, issuedAt: Number(payload.iat ?? 0) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AppSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function auth0Configured() {
  return Boolean(
    process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_BASE_URL,
  );
}

export function authDevBypassEnabled() {
  if (process.env.AUTH_DEV_BYPASS === "false") return false;
  if (process.env.AUTH_DEV_BYPASS === "true") return true;
  // No Auth0 yet — keep the product usable with demo sign-in.
  return !auth0Configured();
}

export const isAuth0Configured = auth0Configured;
export const isAuthDevBypassEnabled = authDevBypassEnabled;

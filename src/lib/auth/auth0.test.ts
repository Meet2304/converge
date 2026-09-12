import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { auth0CallbackUri, normalizeAuth0Issuer, requestOrigin } from "./auth0";

describe("normalizeAuth0Issuer", () => {
  test("adds https when the protocol is missing", () => {
    expect(normalizeAuth0Issuer("dev-abc.us.auth0.com")).toBe("https://dev-abc.us.auth0.com");
  });

  test("strips a trailing slash", () => {
    expect(normalizeAuth0Issuer("https://dev-abc.us.auth0.com/")).toBe(
      "https://dev-abc.us.auth0.com",
    );
  });

  test("strips wrapping quotes from pasted env values", () => {
    expect(normalizeAuth0Issuer('"https://dev-abc.us.auth0.com"')).toBe(
      "https://dev-abc.us.auth0.com",
    );
  });

  test("rejects empty values", () => {
    expect(normalizeAuth0Issuer("")).toBeNull();
    expect(normalizeAuth0Issuer("   ")).toBeNull();
  });
});

describe("requestOrigin", () => {
  test("prefers the public host over a Vercel preview AUTH0_BASE_URL", () => {
    const req = new NextRequest("https://converge.meetbhatt.com/api/auth/login", {
      headers: {
        host: "converge.meetbhatt.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(requestOrigin(req)).toBe("https://converge.meetbhatt.com");
    expect(auth0CallbackUri(req)).toBe("https://converge.meetbhatt.com/api/auth/callback");
  });
});

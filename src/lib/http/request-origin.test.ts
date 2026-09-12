import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { requestOrigin } from "./request-origin";

describe("requestOrigin", () => {
  test("uses the public host", () => {
    const req = new NextRequest("https://converge.meetbhatt.com/login", {
      headers: {
        host: "converge.meetbhatt.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(requestOrigin(req)).toBe("https://converge.meetbhatt.com");
  });
});

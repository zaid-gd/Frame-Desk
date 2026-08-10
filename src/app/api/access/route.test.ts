import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { POST } from "./route";

describe("access wall session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("sets a session cookie without a persistent lifetime", async () => {
    vi.stubEnv("ACCESS_WALL_PASSWORD", "test-access-password");

    const response = await POST(new NextRequest("http://localhost/api/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ password: "test-access-password" }),
    }));

    const setCookie = response.headers.get("set-cookie") || "";
    expect(response.status).toBe(200);
    expect(setCookie).toContain("cutlab_access=");
    expect(setCookie).not.toMatch(/max-age=/i);
    expect(setCookie).not.toMatch(/expires=/i);
  });
});

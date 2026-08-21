import { describe, expect, test } from "vitest";
import { isRetiredFrameDeskPath } from "../../lib/relay-runtime-boundary";

describe("Relay runtime boundary", () => {
  test.each([
    "/account",
    "/calendar",
    "/client-portal",
    "/clients",
    "/projects",
    "/profile/edit",
    "/sample-studio",
    "/settings",
    "/team",
    "/u/old-profile",
  ])("retires the Frame Desk route %s", (pathname) => {
    expect(isRetiredFrameDeskPath(pathname)).toBe(true);
  });

  test.each([
    "/",
    "/access",
    "/api/access",
    "/relay",
    "/relay/dashboard",
    "/client-portal/invite-token",
    "/sign-in",
    "/sign-up",
  ])("leaves the Relay route %s active", (pathname) => {
    expect(isRetiredFrameDeskPath(pathname)).toBe(false);
  });
});

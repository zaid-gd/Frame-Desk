import { describe, expect, it } from "vitest";
import { clientPortalAccessState } from "./client-portal";

describe("Client Portal access", () => {
  it("keeps invalid, closed, expired, and PIN-protected access states distinct", () => {
    const now = Date.parse("2026-08-18T12:00:00.000Z");

    expect(clientPortalAccessState(null, now, false)).toBe("invalid");
    expect(clientPortalAccessState({ status: "closed", expiresAt: null, pinProtected: false }, now, false)).toBe("closed");
    expect(clientPortalAccessState({ status: "open", expiresAt: "2026-08-18T11:59:59.000Z", pinProtected: false }, now, false)).toBe("expired");
    expect(clientPortalAccessState({ status: "open", expiresAt: null, pinProtected: true }, now, false)).toBe("pin-required");
    expect(clientPortalAccessState({ status: "open", expiresAt: null, pinProtected: true }, now, true)).toBe("open");
  });
});

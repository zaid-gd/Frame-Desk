import { afterEach, describe, expect, test, vi } from "vitest";
import { POST } from "./route";

describe("Relay telemetry endpoint", () => {
  afterEach(() => vi.restoreAllMocks());

  test("accepts only the privacy-safe analytics contract", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(new Request("http://localhost/api/relay-telemetry", {
      method: "POST",
      body: JSON.stringify({ category: "analytics", event: { name: "project_delivered", count: 1, projectName: "Secret Film" } }),
    }));

    expect(response.status).toBe(202);
    expect(info).toHaveBeenCalledWith("relay_analytics", { category: "analytics", event: { name: "project_delivered", count: 1 } });
  });

  test("rejects malformed reports", async () => {
    const response = await POST(new Request("http://localhost/api/relay-telemetry", { method: "POST", body: JSON.stringify({ comment: "private" }) }));
    expect(response.status).toBe(400);
  });
});

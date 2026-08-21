import { describe, expect, test, vi } from "vitest";
import { createBrowserTelemetryPreferences } from "./browser-telemetry";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
  };
}

describe("browser telemetry preferences", () => {
  test("requires an explicit Local Mode choice and remembers a decline", () => {
    const target = storage();
    const preferences = createBrowserTelemetryPreferences(target);

    expect(preferences.localConsent()).toBe("unknown");
    preferences.setLocalConsent(false);

    expect(preferences.localConsent()).toBe("declined");
    expect(preferences.analyticsEnabled("local")).toBe(false);
  });

  test("lets signed-in users opt out without disabling essential reports", () => {
    const target = storage();
    const preferences = createBrowserTelemetryPreferences(target);

    expect(preferences.analyticsEnabled("cloud")).toBe(true);
    preferences.setCloudAnalytics(false);

    expect(preferences.analyticsEnabled("cloud")).toBe(false);
  });
});

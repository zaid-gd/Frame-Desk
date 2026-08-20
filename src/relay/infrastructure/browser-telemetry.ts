import type { TelemetryTransport } from "../domain/telemetry";
import type { TelemetryPayload } from "../domain/telemetry-contract";

export const RELAY_LOCAL_ANALYTICS_KEY = "relay:analytics:local:v1";
export const RELAY_CLOUD_ANALYTICS_KEY = "relay:analytics:cloud:v1";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export function createBrowserTelemetryPreferences(storage: PreferenceStorage) {
  return {
    localConsent() {
      const stored = storage.getItem(RELAY_LOCAL_ANALYTICS_KEY);
      return stored === "enabled" ? "accepted" as const : stored === "disabled" ? "declined" as const : "unknown" as const;
    },
    setLocalConsent(enabled: boolean) {
      storage.setItem(RELAY_LOCAL_ANALYTICS_KEY, enabled ? "enabled" : "disabled");
    },
    setCloudAnalytics(enabled: boolean) {
      storage.setItem(RELAY_CLOUD_ANALYTICS_KEY, enabled ? "enabled" : "disabled");
    },
    analyticsEnabled(mode: "local" | "cloud" | "sample") {
      if (mode === "sample") return false;
      if (mode === "local") return storage.getItem(RELAY_LOCAL_ANALYTICS_KEY) === "enabled";
      return storage.getItem(RELAY_CLOUD_ANALYTICS_KEY) !== "disabled";
    },
  };
}

export const sendBrowserTelemetry: TelemetryTransport = async (payload: TelemetryPayload) => {
  await fetch("/api/relay-telemetry", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
};

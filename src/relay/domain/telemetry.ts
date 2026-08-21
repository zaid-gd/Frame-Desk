import { analyticsEventSchema, type AnalyticsEvent, type TelemetryPayload } from "./telemetry-contract";

export type TelemetryTransport = (payload: TelemetryPayload) => Promise<void>;

type AnalyticsInput = AnalyticsEvent & Record<string, unknown>;

function safeErrorName(error: unknown): "Error" | "TypeError" | "RangeError" | "UnknownError" {
  if (error instanceof TypeError) return "TypeError";
  if (error instanceof RangeError) return "RangeError";
  if (error instanceof Error) return "Error";
  return "UnknownError";
}

export function createTelemetryBoundary({ analyticsEnabled, send }: { analyticsEnabled: boolean; send: TelemetryTransport }) {
  return {
    async track(input: AnalyticsInput) {
      if (!analyticsEnabled) return;
      await send({ category: "analytics", event: analyticsEventSchema.parse(input) });
    },
    async reportError(error: unknown, context: { operation: string } & Record<string, unknown>) {
      await send({
        category: "essential_error",
        error: { name: safeErrorName(error), operation: context.operation },
      });
    },
  };
}

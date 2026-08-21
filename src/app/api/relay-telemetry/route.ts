import { telemetrySchema } from "@/relay/domain/telemetry-contract";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid telemetry report." }, { status: 400 });
  }
  const parsed = telemetrySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid telemetry report." }, { status: 400 });
  if (parsed.data.category === "analytics") console.info("relay_analytics", parsed.data);
  else console.error("relay_essential_error", parsed.data);
  return new Response(null, { status: 202 });
}

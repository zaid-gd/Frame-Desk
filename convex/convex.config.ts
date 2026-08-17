import aggregate from "@convex-dev/aggregate/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({ env: {
  RELAY_FILE_SIGNING_SECRET: v.string(),
  RELAY_STORAGE_CAPACITY_BYTES: v.string(),
  RELAY_STORAGE_RESERVE_BYTES: v.optional(v.string()),
} });
app.use(aggregate, { name: "relayStorageUsage" });

export default app;

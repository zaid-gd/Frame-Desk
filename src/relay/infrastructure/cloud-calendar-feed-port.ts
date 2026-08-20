"use client";

import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";

const feedUrlRef = makeFunctionReference<"query", { appOrigin: string }, string | null>("relayCalendar:feedUrl");

export function useCloudCalendarFeedUrl(enabled: boolean, appOrigin: string | null) {
  return useQuery(feedUrlRef, enabled && appOrigin ? { appOrigin } : "skip") ?? null;
}

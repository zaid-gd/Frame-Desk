import { describe, expect, test } from "vitest";
import { serializeCalendarFeed } from "./calendar-feed";

describe("read-only calendar feed", () => {
  test("omits records without a calendar date", () => {
    expect(serializeCalendarFeed({
      name: "Relay commitments",
      events: [{ id: "project:draft", date: "Not set", title: "Draft due", url: "/relay/projects/draft" }],
    })).not.toContain("project:draft");
  });

  test("serializes all-day events as a valid subscribed calendar", () => {
    const feed = serializeCalendarFeed({
      name: "Relay commitments",
      events: [
        { id: "project:alpha", date: "2026-09-12", title: "Launch, film; due", url: "https://relay.example/relay/projects/alpha" },
        { id: "review:main", date: "2026-09-10", title: "Main cut review", url: "https://relay.example/relay/projects/alpha#outputs" },
      ],
    });

    expect(feed).toContain("BEGIN:VCALENDAR\r\nVERSION:2.0");
    expect(feed).toContain("METHOD:PUBLISH");
    expect(feed).toContain("X-WR-CALNAME:Relay commitments");
    expect(feed).toContain("DTSTART;VALUE=DATE:20260912");
    expect(feed).toContain("SUMMARY:Launch\\, film\\; due");
    expect(feed).toContain("URL:https://relay.example/relay/projects/alpha");
    expect(feed).toContain("END:VCALENDAR\r\n");
  });
});

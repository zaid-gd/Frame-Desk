type CalendarFeedEvent = {
  id: string;
  date: string;
  title: string;
  url: string;
};

function escapeText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function compactDate(value: string) {
  return value.replaceAll("-", "");
}

function nextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Produces a publish-only iCalendar feed. Relay does not accept calendar writes. */
export function serializeCalendarFeed({ name, events, generatedAt = "19700101T000000Z" }: { name: string; events: readonly CalendarFeedEvent[]; generatedAt?: string }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Relay//Workspace Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    ...events.filter((event) => isCalendarDate(event.date)).flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${escapeText(event.id)}@relay`,
      `DTSTAMP:${generatedAt}`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDate(event.date))}`,
      `SUMMARY:${escapeText(event.title)}`,
      `URL:${event.url}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ];
  return lines.join("\r\n");
}

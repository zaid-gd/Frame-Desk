export const integrationServices = [
  { id: "googleDrive", name: "Google Drive", shortName: "Drive", description: "Project folders, briefs, exports, and shared deliverables.", color: "#4285f4", icon: "G" },
  { id: "frameIo", name: "Frame.io", shortName: "Frame", description: "Review links, client comments, and approval pages.", color: "#8b5cf6", icon: "F" },
  { id: "dropbox", name: "Dropbox", shortName: "Dropbox", description: "Shared file folders and delivery packages.", color: "#0061ff", icon: "D" },
  { id: "oneDrive", name: "OneDrive", shortName: "OneDrive", description: "Microsoft cloud folders and client handoff links.", color: "#0078d4", icon: "O" },
  { id: "googleCalendar", name: "Google Calendar", shortName: "Calendar", description: "Delivery schedules, review calls, and deadline calendars.", color: "#34a853", icon: "C" },
  { id: "slack", name: "Slack", shortName: "Slack", description: "Workspace, channel, and project discussion links.", color: "#4a154b", icon: "S" }
] as const;

export type IntegrationServiceId = (typeof integrationServices)[number]["id"];

export type IntegrationLink = {
  url: string;
  label: string;
  notes: string;
  updatedAt: string;
};

export type IntegrationLinks = Partial<Record<IntegrationServiceId, IntegrationLink>>;

export const emptyIntegrationLink: IntegrationLink = {
  url: "",
  label: "",
  notes: "",
  updatedAt: ""
};

export function emptyIntegrationLinks(): IntegrationLinks {
  return {};
}

export function integrationServiceById(id: string) {
  return integrationServices.find((service) => service.id === id);
}

export function integrationServiceName(id: string) {
  return integrationServiceById(id)?.name ?? id;
}

export function isIntegrationServiceId(value: string): value is IntegrationServiceId {
  return integrationServices.some((service) => service.id === value);
}

export function normalizeUrl(value: string) {
  return value.trim();
}

export function isValidIntegrationUrl(value: string) {
  const trimmed = normalizeUrl(value);
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeIntegrationLink(value: unknown): IntegrationLink {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...emptyIntegrationLink };
  const record = value as Record<string, unknown>;
  return {
    url: typeof record.url === "string" ? normalizeUrl(record.url) : "",
    label: typeof record.label === "string" ? record.label.trim() : "",
    notes: typeof record.notes === "string" ? record.notes.trim() : "",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : ""
  };
}

export function normalizeIntegrationLinks(value: unknown): IntegrationLinks {
  const links: IntegrationLinks = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return links;
  const record = value as Record<string, unknown>;
  for (const service of integrationServices) {
    const link = normalizeIntegrationLink(record[service.id]);
    if (link.url || link.label || link.notes) {
      links[service.id] = link;
    }
  }
  return links;
}

export function hasIntegrationLink(link: IntegrationLink | undefined) {
  return Boolean(link?.url && isValidIntegrationUrl(link.url));
}

export function configuredIntegrationCount(links: IntegrationLinks | undefined) {
  if (!links) return 0;
  return integrationServices.filter((service) => hasIntegrationLink(links[service.id])).length;
}

export function integrationStatusLabel(link: IntegrationLink | undefined) {
  return hasIntegrationLink(link) ? "Link saved" : "No link";
}

export function integrationDisplayText(link: IntegrationLink | undefined, fallback: string) {
  if (!link) return fallback;
  return link.label || link.url || fallback;
}

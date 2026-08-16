export const relaySections = ["dashboard", "projects", "clients", "templates", "calendar", "files", "reports", "team", "settings"] as const;
export type RelaySection = (typeof relaySections)[number];

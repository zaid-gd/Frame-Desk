const RETIRED_FRAME_DESK_PATHS = new Set([
  "/accessibility",
  "/account",
  "/calendar",
  "/client-portal",
  "/clients",
  "/contact",
  "/feedback",
  "/integrations",
  "/media",
  "/organization",
  "/privacy",
  "/privacy-policy",
  "/profile",
  "/projects",
  "/reports",
  "/resources",
  "/sample-studio",
  "/settings",
  "/team",
  "/team-chat",
  "/templates",
  "/terms",
  "/timeline",
]);

const RETIRED_FRAME_DESK_PREFIXES = [
  "/client-portal/",
  "/profile/",
  "/prototype/",
  "/u/",
];

export function isRetiredFrameDeskPath(pathname: string) {
  return RETIRED_FRAME_DESK_PATHS.has(pathname)
    || RETIRED_FRAME_DESK_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

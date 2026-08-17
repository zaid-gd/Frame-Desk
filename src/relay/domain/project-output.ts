import type { ProjectRecord } from "./project";

export const outputReviewStates = ["draft", "in_review", "changes_requested", "approved", "final_delivered"] as const;
export type OutputReviewState = (typeof outputReviewStates)[number];

export type MediaSource = {
  provider: "youtube" | "vimeo" | "link";
  providerId: string | null;
  url: string;
};

export type MediaComment = {
  id: string;
  body: string;
  resolved: boolean;
};

export type MediaVersion = {
  id: string;
  number: number;
  source: MediaSource;
  addedAt: string;
  comments: MediaComment[];
};

export type ProjectOutput = {
  id: string;
  projectId: string;
  name: string;
  reviewState: OutputReviewState;
  archived: boolean;
  roleId?: string;
  relativeDeadlineDays?: number;
  versions: MediaVersion[];
  currentVersionId?: string;
  unresolvedPreviousComments?: number;
};

export type NewMediaVersionInput = { id: string; url: string; addedAt: string };

export function projectOutputNameError(name: string) {
  return !name.trim() || name.length > 200 ? "Enter a Project Output name." : null;
}

export function normalizeMediaSource(value: string): MediaSource | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLocaleLowerCase().replace(/^www\./, "");
  const youtubeId = host === "youtu.be"
    ? url.pathname.split("/").filter(Boolean)[0]
    : host === "youtube.com" || host === "m.youtube.com"
      ? url.searchParams.get("v") ?? (/^\/(?:embed|shorts)\/([^/]+)/.exec(url.pathname)?.[1] ?? null)
      : null;
  if (youtubeId && /^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    return { provider: "youtube", providerId: youtubeId, url: `https://www.youtube.com/watch?v=${youtubeId}` };
  }
  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") return null;

  const vimeoId = host === "vimeo.com" || host === "player.vimeo.com"
    ? /(?:^|\/)(\d+)(?:$|\/)/.exec(url.pathname)?.[1] ?? null
    : null;
  if (vimeoId) return { provider: "vimeo", providerId: vimeoId, url: `https://vimeo.com/${vimeoId}` };
  if (host === "vimeo.com" || host === "player.vimeo.com") return null;

  return { provider: "link", providerId: null, url: url.href };
}

export function addMediaVersion(output: ProjectOutput, input: NewMediaVersionInput): ProjectOutput | null {
  const source = normalizeMediaSource(input.url);
  if (!source) return null;
  const version: MediaVersion = {
    id: input.id,
    number: output.versions.reduce((highest, item) => Math.max(highest, item.number), 0) + 1,
    source,
    addedAt: input.addedAt,
    comments: [],
  };
  const unresolvedPreviousComments = output.versions.flatMap(({ comments }) => comments).filter(({ resolved }) => !resolved).length;
  return {
    ...output,
    reviewState: "in_review",
    currentVersionId: version.id,
    versions: [...output.versions, version],
    unresolvedPreviousComments,
  };
}

export function salaryProjectCount(projects: readonly ProjectRecord[]) {
  return projects.filter((project) => project.financialType === "salaryPlan" && project.completedAt !== undefined).length;
}

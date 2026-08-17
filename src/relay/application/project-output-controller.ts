import { outputReviewStates, projectOutputNameError, type OutputReviewState } from "../domain/project-output";
import type { ProjectOutputPort } from "../ports/project-output-port";
import type { ProjectWriteResult } from "../ports/project-port";

const reviewStateLabels: Record<OutputReviewState, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  final_delivered: "Final delivered",
};

function message<T>(result: ProjectWriteResult<T>, success: string) {
  return result.ok ? { ok: true as const, message: success } : { ok: false as const, kind: result.error.kind, message: result.error.message };
}

export function createProjectOutputController({ port }: { port: ProjectOutputPort }) {
  return {
    model: {
      reviewStateOptions: outputReviewStates.map((value) => ({ value, label: reviewStateLabels[value] })),
    },
    actions: {
      view() {
        return {
          state: port.outputState(),
          rows: port.loadOutputs().map((output) => ({
            ...output,
            reviewStateLabel: reviewStateLabels[output.reviewState],
            versions: output.versions.map((version) => ({
              ...version,
              current: version.id === output.currentVersionId,
              providerLabel: version.source.provider === "youtube" ? "YouTube" : version.source.provider === "vimeo" ? "Vimeo" : "Link",
              addedLabel: new Date(version.addedAt).toLocaleString(),
            })),
          })),
        };
      },
      async add(input: { name: string }) {
        const error = projectOutputNameError(input.name);
        if (error) return { ok: false as const, kind: "invalid" as const, message: error };
        return message(await port.addOutput(input), "Project Output added.");
      },
      async edit(id: string, input: { name: string }) {
        const error = projectOutputNameError(input.name);
        if (error) return { ok: false as const, kind: "invalid" as const, message: error };
        return message(await port.editOutput(id, input), "Project Output saved.");
      },
      async setArchived(id: string, archived: boolean) { return message(await port.setOutputArchived(id, archived), archived ? "Project Output archived." : "Project Output restored."); },
      async setReviewState(id: string, reviewState: OutputReviewState) { return message(await port.setOutputReviewState(id, reviewState), "Project Output review state saved."); },
      async addVersion(outputId: string, input: { url: string }) { return message(await port.addMediaVersion(outputId, input), "Media Version added and set as current."); },
      async resolveComment(id: string) { return message(await port.resolveComment(id), "Comment resolved."); },
    },
  };
}

export type ProjectOutputController = ReturnType<typeof createProjectOutputController>;

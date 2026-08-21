import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import type { ProjectPort } from "../ports/project-port";
import { projectWriteRefusal } from "../ports/project-port";
import type { ProjectOutputPort } from "../ports/project-output-port";

const template = createDefaultWorkflowTemplate("template_sample", "Sample workflow");
const setup = copyProjectSetup(template);

export function createSampleProjectPort(): ProjectPort & ProjectOutputPort {
  const outputs = [{ id: "output_demo_main", projectId: "demo_alpha", name: "Main video", reviewState: "in_review" as const, archived: false, currentVersionId: "version_demo_2", unresolvedPreviousComments: 1, relativeDeadlineDays: -1, versions: [
    { id: "version_demo_1", number: 1, source: { provider: "youtube" as const, providerId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, addedAt: "2026-08-10T09:00:00.000Z", comments: [{ id: "comment_demo", authorName: "Client", body: "Shorten the logo hold.", resolved: false, createdAt: "2026-08-10T10:00:00.000Z" }] },
    { id: "version_demo_2", number: 2, source: { provider: "vimeo" as const, providerId: "987654321", url: "https://vimeo.com/987654321" }, addedAt: "2026-08-14T09:00:00.000Z", comments: [] },
  ] }];
  return {
    projectId: "demo_alpha",
    loadClients: () => [{ id: "client_demo", name: "Demo Client", archived: false }],
    loadGroups: () => [{ id: "group_demo", name: "Launch campaign", clientId: "client_demo", startDate: "2026-08-01", endDate: "2026-08-31", notes: "Read-only sample", archived: false, projectCount: 1, progress: 60, money: 2400 }],
    loadTemplates: () => [template],
    loadProjects: () => [{ id: "demo_alpha", name: "Demo Project Alpha", clientId: "client_demo", projectGroupId: "group_demo", stage: "Client Review", dueDate: "2026-08-15", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Demo Editor", assignees: ["Demo Editor"], progress: 60, money: 2400, workflowSetup: setup }],
    loadOutputCounts: () => [{ projectId: "demo_alpha", count: 1 }],
    outputState: () => ({ kind: "ready" }),
    loadOutputs: () => outputs,
    loadWorkspaceOutputs: () => outputs,
    async createProject() { return projectWriteRefusal; },
    async createGroup() { return projectWriteRefusal; },
    async editGroup() { return projectWriteRefusal; },
    async setGroupArchived() { return projectWriteRefusal; },
    async setProjectArchived() { return projectWriteRefusal; },
    async setProjectPayment() { return projectWriteRefusal; },
    async moveProjectStage() { return projectWriteRefusal; },
    async addOutput() { return projectWriteRefusal; },
    async editOutput() { return projectWriteRefusal; },
    async setOutputArchived() { return projectWriteRefusal; },
    async setOutputReviewState() { return projectWriteRefusal; },
    async addMediaVersion() { return projectWriteRefusal; },
    async resolveComment() { return projectWriteRefusal; },
    async deleteProject() { return projectWriteRefusal; },
  };
}

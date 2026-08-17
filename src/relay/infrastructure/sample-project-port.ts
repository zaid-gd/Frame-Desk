import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import type { ProjectPort } from "../ports/project-port";
import { projectWriteRefusal } from "../ports/project-port";

const template = createDefaultWorkflowTemplate("template_sample", "Sample workflow");
const setup = copyProjectSetup(template);

export function createSampleProjectPort(): ProjectPort {
  return {
    loadClients: () => [{ id: "client_demo", name: "Demo Client", archived: false }],
    loadGroups: () => [{ id: "group_demo", name: "Launch campaign", clientId: "client_demo", startDate: "2026-08-01", endDate: "2026-08-31", notes: "Read-only sample", archived: false, projectCount: 1, progress: 60, money: 2400 }],
    loadTemplates: () => [template],
    loadProjects: () => [{ id: "demo_alpha", name: "Demo Project Alpha", clientId: "client_demo", projectGroupId: "group_demo", stage: "Client Review", dueDate: "2026-08-15", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Demo Editor", assignees: ["Demo Editor"], progress: 60, money: 2400, workflowSetup: setup }],
    async createProject() { return projectWriteRefusal; },
    async createGroup() { return projectWriteRefusal; },
    async editGroup() { return projectWriteRefusal; },
    async setGroupArchived() { return projectWriteRefusal; },
    async setProjectArchived() { return projectWriteRefusal; },
    async deleteProject() { return projectWriteRefusal; },
  };
}

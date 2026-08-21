"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { WorkspaceProject } from "../domain/workspace-project";
import type { WorkflowTemplate, WorkflowTemplateInput } from "../domain/workflow-template";
import type { WorkflowTemplatePort } from "../ports/workflow-template-port";

const functions = {
  list: makeFunctionReference<"query", { includeArchived?: boolean }, WorkflowTemplate[]>("relayWorkflowTemplates:list"),
  create: makeFunctionReference<"mutation", WorkflowTemplateInput, { id: string }>("relayWorkflowTemplates:create"),
  edit: makeFunctionReference<"mutation", WorkflowTemplateInput & { id: string }, null>("relayWorkflowTemplates:edit"),
  reorder: makeFunctionReference<"mutation", { ids: string[] }, null>("relayWorkflowTemplates:reorder"),
  setArchived: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayWorkflowTemplates:setArchived"),
};

export function useCloudWorkflowTemplatePort(enabled: boolean, projects: readonly WorkspaceProject[] = []): WorkflowTemplatePort {
  const templates = useQuery(functions.list, enabled ? { includeArchived: true } : "skip") ?? [];
  const createMutation = useMutation(functions.create);
  const editMutation = useMutation(functions.edit);
  const reorderMutation = useMutation(functions.reorder);
  const archiveMutation = useMutation(functions.setArchived);
  return useMemo(() => ({
    loadTemplates: () => templates,
    isStageInUse: (templateId, stageId) => projects.some((project) => project.workflowTemplateId === templateId && project.workflowStageId === stageId),
    async createTemplate(input) {
      try { const { id } = await createMutation(input); return { ok: true as const, template: { id, archived: false, ...input } }; }
      catch (error) { return failure(error); }
    },
    async editTemplate(id, input) {
      try { await editMutation({ id, ...input }); return { ok: true as const, template: { id, archived: templates.find((row) => row.id === id)?.archived ?? false, ...input } }; }
      catch (error) { return failure(error); }
    },
    async reorderTemplates(ids) {
      try { await reorderMutation({ ids: [...ids] }); return { ok: true as const }; }
      catch (error) { return failure(error); }
    },
    async setTemplateArchived(id, archived) {
      try { await archiveMutation({ id, archived }); return { ok: true as const, template: templates.find((row) => row.id === id) }; }
      catch (error) { return failure(error); }
    },
  }), [archiveMutation, createMutation, editMutation, projects, reorderMutation, templates]);
}

function failure(error: unknown) {
  return { ok: false as const, error: { kind: "unavailable" as const, message: error instanceof Error ? error.message : "Relay could not update this Workflow Template." } };
}

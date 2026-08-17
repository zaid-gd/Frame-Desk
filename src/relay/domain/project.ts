import { z } from "zod";
import type { ProjectSetup, WorkflowTemplate } from "./workflow-template";
import { isIsoCalendarDate } from "./calendar-date";
export type { ProjectGroup, ProjectGroupInput } from "./project-group";

export const financialTypes = ["projectValue", "salaryPlan", "nonBillable"] as const;
export type FinancialType = (typeof financialTypes)[number];

export const newProjectSchema = z.object({
  name: z.string().trim().min(1, "Enter a Project name.").max(200),
  clientId: z.string().min(1, "Choose a Client."),
  projectGroupId: z.string(),
  templateId: z.string().min(1, "Choose a Workflow Template."),
  dueDate: z.string().refine(isIsoCalendarDate, "Enter a valid due date."),
  financialType: z.enum(financialTypes),
}).strict();

export type NewProjectInput = z.infer<typeof newProjectSchema>;

export type ProjectRecord = {
  id: string;
  name: string;
  clientId: string;
  projectGroupId?: string;
  stage: string;
  dueDate: string;
  financialType: FinancialType;
  lead: string;
  assignees: string[];
  progress: number;
  money: number;
  workflowSetup: ProjectSetup;
};

export type ProjectChoice = { id: string; name: string; archived: boolean };
export type ProjectTemplate = Pick<WorkflowTemplate, "id" | "name" | "archived" | "stages" | "cancelledLabel" | "starterOutputs" | "roles" | "portalDefaults">;

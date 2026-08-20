import type { WorkspaceMode } from "./entry-controller";
import type { RelaySection } from "./routes";
import type { WorkspacePort } from "../ports/workspace-port";
import type { ProjectSetup } from "../domain/workflow-template";
import type { ProjectRecord } from "../domain/project";
import type { RelayClient } from "../domain/client";
import type { SalaryBatch, SalaryPlan } from "../domain/salary-plan";
import { buildDashboardSummary, buildWorkspaceReport, createReportPeriod, type ProjectOutputCount, type ReportAccess } from "../domain/reporting";

const navigation = [
  { section: "dashboard", label: "Dashboard" },
  { section: "projects", label: "Projects" },
  { section: "clients", label: "Clients" },
  { section: "templates", label: "Templates" },
  { section: "calendar", label: "Calendar" },
  { section: "files", label: "Files" },
  { section: "reports", label: "Reports" },
  { section: "team", label: "Team" },
  { section: "settings", label: "Settings" },
] as const;

export function createWorkspaceController({ mode, workspacePort, clientNames = {}, section = "dashboard", defaultProjectSetup, projects = [], clients = [], salaryPlans = [], salaryBatches = [], outputCounts = [], workspaceName = "Production Desk", currencyCode = "USD", access = { canViewMoney: true, canViewSalary: true } }: { mode: WorkspaceMode; workspacePort: WorkspacePort; clientNames?: Readonly<Record<string, string>>; section?: RelaySection; defaultProjectSetup?: ProjectSetup; projects?: readonly ProjectRecord[]; clients?: readonly RelayClient[]; salaryPlans?: readonly SalaryPlan[]; salaryBatches?: readonly SalaryBatch[]; outputCounts?: readonly ProjectOutputCount[]; workspaceName?: string; currencyCode?: string; access?: ReportAccess }) {
  const title = section[0].toUpperCase() + section.slice(1);
  const periodDate = new Date().toISOString().slice(0, 7);
  const report = buildWorkspaceReport({ period: createReportPeriod({ kind: "month", value: periodDate }), currencyCode, clients, projects, outputCounts, salaryPlans, salaryBatches, access });
  const dashboard = buildDashboardSummary({ today: new Date().toISOString().slice(0, 10), clients, projects, salaryPlans, salaryBatches, outputCounts, access });
  const formatMoney = (value: number) => new Intl.NumberFormat("en", { style: "currency", currency: currencyCode, maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
  const metrics = [
    { label: "Active projects", value: String(dashboard.work.activeProjectCount) },
    { label: "Due soon", value: String(dashboard.dueSoon.length) },
    { label: "Attention", value: String(dashboard.attention.length) },
    { label: "Collected", value: dashboard.money ? formatMoney(dashboard.money.collected) : "Not authorized" },
  ];
  return {
    model: {
      mode,
      readOnly: mode === "sample",
      workspaceLabel: workspaceName,
      workspaceDetail: mode === "sample" ? "Read-only sample" : mode === "cloud" ? "Cloud workspace" : "Private local workspace",
      readOnlyNotice: mode === "sample" ? "Sample Workspace · Read-only demo fixtures" : undefined,
      fallbackIdentity: mode === "sample"
        ? { displayName: "Demo Editor", email: "Sample Workspace", initials: "DE" }
        : { displayName: "Local editor", email: "Local Mode", initials: "LE" },
      navigation: navigation.filter((item) => item.section !== "reports" || access.canViewMoney),
      page: {
        title,
        description: section === "dashboard" ? "What needs your attention across active production." : `Manage ${section} in the shared Relay workspace.`,
        canCreateProject: section === "dashboard" || section === "projects",
      },
      currencyCode,
      metrics,
      projects: workspacePort.loadProjects().map((project) => ({ ...project, clientName: clientNames[project.clientId] ?? "Unknown Client" })),
      dashboard,
      report,
      reporting: { clients, projects, salaryPlans, salaryBatches, outputCounts, access, currencyCode },
      activity: dashboard.activity.map((item) => ({ name: item.projectName, detail: item.detail, age: item.at.slice(0, 10) })),
    },
    actions: {
      async requestNewProject() {
        const result = await workspacePort.requestNewProject(defaultProjectSetup ? structuredClone(defaultProjectSetup) : undefined);
        return result.ok
          ? { ok: true as const, message: "Local draft saved in this browser." }
          : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
    },
  };
}

export type WorkspaceModel = ReturnType<typeof createWorkspaceController>["model"];

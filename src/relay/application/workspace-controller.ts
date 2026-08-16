import type { WorkspaceMode } from "./entry-controller";
import type { RelaySection } from "./routes";
import type { WorkspacePort } from "../ports/workspace-port";
import type { ProjectSetup } from "../domain/workflow-template";

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

export function createWorkspaceController({ mode, workspacePort, clientNames = {}, section = "dashboard", defaultProjectSetup }: { mode: WorkspaceMode; workspacePort: WorkspacePort; clientNames?: Readonly<Record<string, string>>; section?: RelaySection; defaultProjectSetup?: ProjectSetup }) {
  const title = section[0].toUpperCase() + section.slice(1);
  return {
    model: {
      mode,
      readOnly: mode === "sample",
      workspaceLabel: "Production Desk",
      workspaceDetail: mode === "sample" ? "Read-only sample" : mode === "cloud" ? "Cloud workspace" : "Private local workspace",
      readOnlyNotice: mode === "sample" ? "Sample Workspace · Read-only demo fixtures" : undefined,
      fallbackIdentity: mode === "sample"
        ? { displayName: "Demo Editor", email: "Sample Workspace", initials: "DE" }
        : { displayName: "Local editor", email: "Local Mode", initials: "LE" },
      navigation,
      page: {
        title,
        description: section === "dashboard" ? "What needs your attention across active production." : `Manage ${section} in the shared Relay workspace.`,
        canCreateProject: section === "dashboard" || section === "projects",
      },
      metrics: [
        { label: "Active projects", value: "12" },
        { label: "Due this week", value: "4" },
        { label: "Client reviews", value: "3" },
        { label: "Salary due", value: "₹84,000" },
      ],
      projects: workspacePort.loadProjects().map((project) => ({ ...project, clientName: clientNames[project.clientId] ?? "Unknown Client" })),
      activity: [
        { name: "Demo Project Beta", detail: "Marked delivered by Demo Editor", age: "2h" },
        { name: "Demo Project Alpha", detail: "Moved to In review", age: "5h" },
      ],
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

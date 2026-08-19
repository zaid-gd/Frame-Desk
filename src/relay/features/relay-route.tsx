"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOptionalAuth } from "@/lib/optional-auth";
import { createEntryController, type RelaySession, type WorkspaceMode } from "../application/entry-controller";
import { createWorkspaceBackupController } from "../application/workspace-backup-controller";
import { createWorkspaceController } from "../application/workspace-controller";
import { createClientController } from "../application/client-controller";
import { createWorkflowTemplateController } from "../application/workflow-template-controller";
import { createProjectController } from "../application/project-controller";
import { createProjectOutputController } from "../application/project-output-controller";
import { createClientPortalController } from "../application/client-portal-controller";
import type { RelaySection } from "../application/routes";
import { createBrowserEntryPort, RELAY_ENTRY_MODE_KEY } from "../infrastructure/browser-entry-port";
import { useCloudWorkspaceBackupPort } from "../infrastructure/cloud-workspace-backup-port";
import { useCloudWorkspacePort } from "../infrastructure/cloud-workspace-port";
import { createLocalWorkspacePort } from "../infrastructure/local-workspace-port";
import { createLocalWorkspaceBackupPort } from "../infrastructure/local-workspace-backup";
import { createMemoryEntryPort } from "../infrastructure/memory-entry-port";
import { createSampleWorkspacePort } from "../infrastructure/sample-workspace-port";
import { createLocalClientPort } from "../infrastructure/local-client-port";
import { createSampleClientPort } from "../infrastructure/sample-client-port";
import { useCloudClientPort } from "../infrastructure/cloud-client-port";
import { clientRelationships } from "../domain/client-relationships";
import { createLocalWorkflowTemplatePort } from "../infrastructure/local-workflow-template-port";
import { createSampleWorkflowTemplatePort } from "../infrastructure/sample-workflow-template-port";
import { useCloudWorkflowTemplatePort } from "../infrastructure/cloud-workflow-template-port";
import { createLocalProjectPort } from "../infrastructure/local-project-port";
import { createMemoryProjectPort } from "../infrastructure/memory-project-port";
import { createSampleProjectPort } from "../infrastructure/sample-project-port";
import { useCloudProjectPort } from "../infrastructure/cloud-project-port";
import { useCloudSalaryPlanPort } from "../infrastructure/cloud-salary-plan-port";
import { createLocalSalaryPlanPort } from "../infrastructure/local-salary-plan-port";
import { createSampleSalaryPlanPort } from "../infrastructure/sample-salary-plan-port";
import { createMemorySalaryPlanPort } from "../infrastructure/memory-salary-plan-port";
import { createSalaryPlanController } from "../application/salary-plan-controller";
import { useCloudProjectFilePort } from "../infrastructure/cloud-project-file-port";
import { useCloudClientPortalPort } from "../infrastructure/cloud-client-portal-port";
import { RelayExperience } from "../presentation/relay-experience";

const THEME_KEY = "relay:theme:v1";
const SIDEBAR_KEY = "relay:sidebar-collapsed:v1";

function sessionFromAuth(auth: ReturnType<typeof useOptionalAuth>): RelaySession {
  if (!auth.isLoaded) return { status: "loading" };
  if (!auth.isSignedIn || !auth.user) return { status: "signed-out" };
  const email = auth.user.primaryEmailAddress?.emailAddress ?? "Signed-in account";
  const displayName = auth.user.fullName || auth.user.firstName || email;
  const initials = [auth.user.firstName, auth.user.lastName]
    .filter(Boolean)
    .map((part) => part![0])
    .join("")
    .toUpperCase() || displayName.slice(0, 2).toUpperCase();
  return { status: "signed-in", identity: { displayName, email, initials } };
}

function workspacePort(mode: WorkspaceMode, cloudPort: ReturnType<typeof useCloudWorkspacePort>) {
  if (mode === "sample") return createSampleWorkspacePort();
  if (mode === "cloud") return cloudPort;
  return createLocalWorkspacePort();
}

export function RelayRoute({ section, projectId, cloudConfigured }: { section?: RelaySection; projectId?: string; cloudConfigured: boolean }) {
  const router = useRouter();
  const auth = useOptionalAuth();
  const [hydrated, setHydrated] = useState(false);
  const [entryMessage, setEntryMessage] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);
  const [, setWorkspaceVersion] = useState(0);

  useEffect(() => {
    setHydrated(true);
    setTheme(window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
    const tablet = window.matchMedia("(max-width: 1100px) and (min-width: 701px)");
    setCollapsed(tablet.matches || window.localStorage.getItem(SIDEBAR_KEY) === "true");
    const enterTablet = (event: MediaQueryListEvent) => {
      if (event.matches) setCollapsed(true);
    };
    tablet.addEventListener("change", enterTablet);
    return () => tablet.removeEventListener("change", enterTablet);
  }, []);

  const entryPort = useMemo(
    () => hydrated ? createBrowserEntryPort(window.localStorage) : createMemoryEntryPort(),
    [hydrated],
  );
  const entryController = createEntryController({ entryPort, session: sessionFromAuth(auth) });
  const mode = entryController.model.mode ?? "local";
  const cloudPort = useCloudWorkspacePort(mode === "cloud" && Boolean(auth.isSignedIn));
  const cloudBackupPort = useCloudWorkspaceBackupPort();
  const selectedWorkspacePort = useMemo(() => workspacePort(mode, cloudPort), [cloudPort, mode]);
  const cloudClientPort = useCloudClientPort(mode === "cloud" && Boolean(auth.isSignedIn), cloudPort.loadProjects());
  const selectedClientPort = useMemo(() => {
    if (mode === "sample") return createSampleClientPort();
    if (mode === "cloud") return cloudClientPort;
    const relationships = () => clientRelationships(selectedWorkspacePort.loadProjects());
    return createLocalClientPort(undefined, undefined, () => relationships().projects, () => relationships().groups);
  }, [cloudClientPort, mode, selectedWorkspacePort]);
  const cloudTemplatePort = useCloudWorkflowTemplatePort(mode === "cloud" && Boolean(auth.isSignedIn), selectedWorkspacePort.loadProjects());
  const selectedTemplatePort = useMemo(() => {
    if (mode === "sample") return createSampleWorkflowTemplatePort();
    if (mode === "cloud") return cloudTemplatePort;
    return createLocalWorkflowTemplatePort();
  }, [cloudTemplatePort, mode]);
  const templateController = createWorkflowTemplateController({ port: selectedTemplatePort, canManage: mode !== "sample" });
  const projectClients = selectedClientPort.loadClients().map(({ id, name, archived }) => ({ id, name, archived }));
  const projectTemplates = templateController.actions.list(true);
  const cloudProjectPort = useCloudProjectPort(mode === "cloud" && Boolean(auth.isSignedIn), projectClients, projectTemplates, projectId);
  const selectedProjectPort = useMemo(() => {
    if (mode === "sample") return createSampleProjectPort();
    if (mode === "cloud") return cloudProjectPort;
    if (hydrated) return createLocalProjectPort({ storage: window.localStorage, clients: projectClients, templates: projectTemplates, selectedProjectId: projectId });
    return createMemoryProjectPort({ clients: projectClients, templates: projectTemplates, selectedProjectId: projectId });
  }, [cloudProjectPort, hydrated, mode, projectClients, projectId, projectTemplates]);
  const clientViewPort = useMemo(() => ({
    ...selectedClientPort,
    loadProjects: () => selectedProjectPort.loadProjects().map((project) => ({
      id: project.id,
      clientId: project.clientId,
      name: project.name,
      stage: project.stage,
      tone: project.completedAt ? "delivered" as const : project.dueDate < new Date().toISOString().slice(0, 10) ? "overdue" as const : project.workflowSetup.stages.find(({ id }) => id === project.workflowStageId)?.purpose === "clientReview" || project.workflowSetup.stages.find(({ id }) => id === project.workflowStageId)?.purpose === "revisions" ? "review" as const : "planned" as const,
      due: project.dueDate,
      progress: `${project.progress}%`,
      status: project.archived ? "past" as const : "active" as const,
      outstandingAmount: project.completedAt && project.paymentState === "unpaid" && project.financialType === "projectValue" ? project.money : 0,
      ...(project.projectGroupId ? { projectGroupId: project.projectGroupId } : {}),
    })),
    loadProjectGroups: () => selectedProjectPort.loadGroups().map(({ id, clientId, name }) => ({ id, clientId, name })),
  }), [selectedClientPort, selectedProjectPort]);
  const cloudSalaryPlanPort = useCloudSalaryPlanPort(mode === "cloud" && Boolean(auth.isSignedIn));
  const selectedSalaryPlanPort = useMemo(() => {
    if (mode === "sample") return createSampleSalaryPlanPort();
    if (mode === "cloud") return cloudSalaryPlanPort;
    if (hydrated) return createLocalSalaryPlanPort(window.localStorage, projectClients);
    return createMemorySalaryPlanPort();
  }, [cloudSalaryPlanPort, hydrated, mode, projectClients]);
  const projectAccess = selectedProjectPort.projectAccess?.() ?? { role: "owner" as const, memberId: "owner", editorsCanViewAll: true, team: false };
  const salaryPlanController = createSalaryPlanController({ port: selectedSalaryPlanPort, clients: projectClients, canManage: mode !== "sample" && projectAccess.role === "owner" });
  const projectController = createProjectController({ port: selectedProjectPort, canManage: mode !== "sample" && projectAccess.role !== "viewer", access: projectAccess, salaryPlans: salaryPlanController.model.plans });
  const projectOutputController = createProjectOutputController({ port: selectedProjectPort });
  const projectFiles = useCloudProjectFilePort(mode === "cloud" && Boolean(auth.isSignedIn), projectId);
  const selectedProject = selectedProjectPort.loadProjects().find(({ id }) => id === projectId) ?? null;
  const cloudClientPortalPort = useCloudClientPortalPort(
    mode === "cloud" && Boolean(auth.isSignedIn),
    selectedProject ? { id: selectedProject.id, name: selectedProject.name, stage: selectedProject.stage, progress: selectedProject.progress, dueDate: selectedProject.dueDate, completedAt: selectedProject.completedAt } : null,
    selectedProjectPort.loadOutputs(),
  );
  const clientPortalController = cloudClientPortalPort ? createClientPortalController({ port: cloudClientPortalPort }) : undefined;
  const clientNames = Object.fromEntries(selectedClientPort.loadClients().map((client) => [client.id, client.name]));
  const firstTemplate = templateController.actions.list()[0];
  const defaultProjectSetup = firstTemplate ? templateController.actions.copyProjectSetup(firstTemplate.id) ?? undefined : undefined;
  const workspaceController = createWorkspaceController({
    mode,
    workspacePort: selectedWorkspacePort,
    clientNames,
    section,
    defaultProjectSetup,
    projects: selectedProjectPort.loadProjects(),
    clients: selectedClientPort.loadClients(),
    salaryPlans: selectedSalaryPlanPort.loadPlans(),
    salaryBatches: selectedSalaryPlanPort.loadBatches(),
    outputCounts: selectedProjectPort.loadOutputCounts(),
    currencyCode: "USD",
    access: { canViewMoney: selectedClientPort.canViewMoney(), canViewSalary: mode !== "cloud" || projectAccess.role === "owner" },
  });
  const clientMoney = workspaceController.model.dashboard.money?.clientTotals.reduce<Record<string, { earned: number; collected: number; outstanding: number }>>((result, client) => { result[client.clientId] = client; return result; }, {}) ?? {};
  const clientController = createClientController({ port: clientViewPort, currencyCode: workspaceController.model.currencyCode, moneyByClient: clientMoney });
  const localBackupPort = useMemo(
    () => hydrated ? createLocalWorkspaceBackupPort(window.localStorage, undefined, () => setWorkspaceVersion((version) => version + 1)) : null,
    [hydrated],
  );
  const backupController = createWorkspaceBackupController({ mode, backupPort: mode === "cloud" ? cloudBackupPort : localBackupPort });

  useEffect(() => {
    if (hydrated && !section && entryController.model.state === "workspace") router.replace("/relay/dashboard");
  }, [entryController.model.state, hydrated, router, section]);

  function chooseMode(nextMode: "local" | "sample") {
    entryController.actions.chooseMode(nextMode);
    router.push("/relay/dashboard");
  }

  function startAccount(action: "sign-up" | "sign-in") {
    if (auth.isSignedIn) {
      router.push("/relay/dashboard");
      return;
    }
    if (!cloudConfigured) {
      setEntryMessage("Account access is not configured in this local build. Use Local Mode or the Sample Workspace.");
      return;
    }
    if (action === "sign-up") auth.openSignUp();
    else auth.openSignIn();
  }

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  async function leaveWorkspace() {
    if (mode === "cloud") await auth.signOut();
    window.localStorage.removeItem(RELAY_ENTRY_MODE_KEY);
    router.push("/relay");
  }

  async function requestNewProject() {
    const result = await workspaceController.actions.requestNewProject();
    if (result.ok) setWorkspaceVersion((version) => version + 1);
    return result;
  }

  return (
    <RelayExperience
      section={section}
      entry={entryController.model}
      entryMessage={entryMessage}
      shell={{
        collapsed,
        theme,
        mode,
        identity: entryController.model.identity,
        storageWarning: entryController.model.storageWarning,
        workspace: workspaceController.model,
        backup: backupController,
        clients: clientController,
        templates: templateController,
        projects: projectController,
        salaryPlans: salaryPlanController,
        outputs: projectOutputController,
        files: projectFiles,
        portal: clientPortalController,
        projectId,
      }}
      onChooseMode={chooseMode}
      onStartAccount={startAccount}
      onToggleSidebar={toggleSidebar}
      onToggleTheme={toggleTheme}
      onLeaveWorkspace={leaveWorkspace}
      onRequestNewProject={requestNewProject}
      onProjectCreated={(url) => { setWorkspaceVersion((version) => version + 1); router.push(url); }}
      onProjectsChanged={() => setWorkspaceVersion((version) => version + 1)}
      onClientsChanged={() => setWorkspaceVersion((version) => version + 1)}
      onTemplatesChanged={() => setWorkspaceVersion((version) => version + 1)}
      onSalaryPlansChanged={() => setWorkspaceVersion((version) => version + 1)}
    />
  );
}

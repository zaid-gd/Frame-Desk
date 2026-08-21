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
import { useCloudCalendarFeedUrl } from "../infrastructure/cloud-calendar-feed-port";
import { useCloudClientPortalPort } from "../infrastructure/cloud-client-portal-port";
import { RelayExperience } from "../presentation/relay-experience";
import { createWorkspaceDiscoveryController } from "../application/workspace-discovery-controller";
import { buildWorkspaceCalendarEvents } from "../domain/workspace-calendar";
import { serializeCalendarFeed } from "../domain/calendar-feed";
import { buildTeamAccess } from "../domain/team-access";
import { useCloudTeamAccessPort } from "../infrastructure/cloud-team-access-port";
import { createTeamAccessController } from "../application/team-access-controller";
import { createTelemetryBoundary } from "../domain/telemetry";
import { createBrowserTelemetryPreferences, sendBrowserTelemetry } from "../infrastructure/browser-telemetry";
import { useWorkspaceTelemetry } from "../infrastructure/use-workspace-telemetry";

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
  const [privacyVersion, setPrivacyVersion] = useState(0);
  const [showLocalConsent, setShowLocalConsent] = useState(false);

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
  const preferences = useMemo(() => hydrated ? createBrowserTelemetryPreferences(window.localStorage) : null, [hydrated, privacyVersion]);
  const analyticsEnabled = preferences?.analyticsEnabled(mode) ?? false;
  const telemetry = useMemo(() => createTelemetryBoundary({ analyticsEnabled, send: sendBrowserTelemetry }), [analyticsEnabled]);
  const cloudPort = useCloudWorkspacePort(mode === "cloud" && Boolean(auth.isSignedIn));
  const teamAccess = useCloudTeamAccessPort(mode === "cloud" && Boolean(auth.isSignedIn));
  const teamController = createTeamAccessController(teamAccess);
  const teamWorkspace = teamAccess.workspace();
  const currentTeamMember = teamWorkspace?.members.find(({ userId }) => userId === teamWorkspace.currentMemberId);
  const canManageProjectContent = mode !== "sample" && (mode !== "cloud" || (teamAccess.state().kind === "ready" && (!teamWorkspace || (teamWorkspace.role !== "Viewer" && (currentTeamMember?.permissions.projects ?? true)))));
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
  const templateController = createWorkflowTemplateController({ port: selectedTemplatePort, canManage: canManageProjectContent });
  const projectClients = selectedClientPort.loadClients().map(({ id, name, archived }) => ({ id, name, archived }));
  const projectTemplates = templateController.actions.list(true);
  const cloudProjectPort = useCloudProjectPort(mode === "cloud" && Boolean(auth.isSignedIn), projectClients, projectTemplates, projectId);
  const selectedProjectPort = useMemo(() => {
    if (mode === "sample") return createSampleProjectPort();
    if (mode === "cloud") return cloudProjectPort;
    if (hydrated) return createLocalProjectPort({ storage: window.localStorage, clients: projectClients, templates: projectTemplates, selectedProjectId: projectId });
    return createMemoryProjectPort({ clients: projectClients, templates: projectTemplates, selectedProjectId: projectId });
  }, [cloudProjectPort, hydrated, mode, projectClients, projectId, projectTemplates]);
  const clientViewPort = useMemo(() => mode === "sample" ? selectedClientPort : ({
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
  }), [mode, selectedClientPort, selectedProjectPort]);
  const cloudSalaryPlanPort = useCloudSalaryPlanPort(mode === "cloud" && Boolean(auth.isSignedIn));
  const selectedSalaryPlanPort = useMemo(() => {
    if (mode === "sample") return createSampleSalaryPlanPort();
    if (mode === "cloud") return cloudSalaryPlanPort;
    if (hydrated) return createLocalSalaryPlanPort(window.localStorage, projectClients);
    return createMemorySalaryPlanPort();
  }, [cloudSalaryPlanPort, hydrated, mode, projectClients]);
  const projectAccess = selectedProjectPort.projectAccess?.() ?? { ...buildTeamAccess({ role: "owner", memberId: "owner", editorsCanViewAll: true }), team: false };
  const salaryPlanController = createSalaryPlanController({ port: selectedSalaryPlanPort, clients: projectClients, canManage: mode !== "sample" && projectAccess.role === "owner" });
  const projectController = createProjectController({ port: selectedProjectPort, canManage: mode !== "sample" && projectAccess.role !== "viewer" && (projectAccess.permissions?.projects ?? true), access: projectAccess, salaryPlans: salaryPlanController.model.plans, defaultTemplateId: teamWorkspace?.defaultWorkflowTemplateId ?? projectTemplates[0]?.id ?? "" });
  const projectOutputController = createProjectOutputController({ port: selectedProjectPort });
  const projectFiles = useCloudProjectFilePort(mode === "cloud" && Boolean(auth.isSignedIn), projectId);
  const appOrigin = hydrated ? window.location.origin : null;
  const cloudCalendarFeedUrl = useCloudCalendarFeedUrl(mode === "cloud" && Boolean(auth.isSignedIn), appOrigin);
  const selectedProject = selectedProjectPort.loadProjects().find(({ id }) => id === projectId) ?? null;
  const cloudClientPortalPort = useCloudClientPortalPort(
    mode === "cloud" && Boolean(auth.isSignedIn),
    selectedProject ? { id: selectedProject.id, name: selectedProject.name, stage: selectedProject.stage, progress: selectedProject.progress, dueDate: selectedProject.dueDate, completedAt: selectedProject.completedAt } : null,
    selectedProjectPort.loadOutputs(),
  );
  const clientPortalController = cloudClientPortalPort ? createClientPortalController({ port: cloudClientPortalPort, onPortalOpened: () => { void telemetry.track({ name: "client_portal_opened", count: 1 }); } }) : undefined;
  const clientNames = Object.fromEntries(selectedClientPort.loadClients().map((client) => [client.id, client.name]));
  const firstTemplate = templateController.actions.list().find(({ id }) => id === teamWorkspace?.defaultWorkflowTemplateId) ?? templateController.actions.list()[0];
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
    workspaceName: teamWorkspace?.name ?? "Production Desk",
    currencyCode: teamWorkspace?.currencyCode ?? "USD",
    access: { canViewMoney: mode !== "cloud" ? selectedClientPort.canViewMoney() : projectAccess.canViewFinance ?? false, canViewSalary: mode !== "cloud" || projectAccess.role === "owner" },
  });
  const workspaceOutputs = selectedProjectPort.loadWorkspaceOutputs();
  const localCalendarEvents = buildWorkspaceCalendarEvents({ projects: selectedProjectPort.loadProjects(), outputs: workspaceOutputs });
  const localCalendarFeedUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(serializeCalendarFeed({ name: "Relay commitments", events: localCalendarEvents.map(({ id, date, title, href }) => ({ id, date, title, url: appOrigin ? new URL(href, appOrigin).href : href })) }))}`;
  const discoveryController = createWorkspaceDiscoveryController({
    clients: selectedClientPort.loadClients(),
    projects: selectedProjectPort.loadProjects(),
    groups: selectedProjectPort.loadGroups(),
    outputs: workspaceOutputs,
    files: projectFiles?.workspaceFiles() ?? [],
    calendarFeedUrl: mode === "cloud" ? cloudCalendarFeedUrl : localCalendarFeedUrl,
  });
  const clientMoney = workspaceController.model.dashboard.money?.clientTotals.reduce<Record<string, { earned: number; collected: number; outstanding: number }>>((result, client) => { result[client.clientId] = client; return result; }, {}) ?? {};
  const clientController = createClientController({ port: clientViewPort, currencyCode: workspaceController.model.currencyCode, moneyByClient: clientMoney });
  const localBackupPort = useMemo(
    () => hydrated ? createLocalWorkspaceBackupPort(window.localStorage, undefined, () => setWorkspaceVersion((version) => version + 1)) : null,
    [hydrated],
  );
  const backupController = createWorkspaceBackupController({ mode, backupPort: mode === "cloud" ? cloudBackupPort : localBackupPort });
  const measures = useMemo(() => ({
    projects: selectedProjectPort.loadProjects().length,
    delivered: selectedProjectPort.loadProjects().filter(({ completedAt }) => completedAt).length,
    comments: workspaceOutputs.flatMap(({ versions }) => versions).flatMap(({ comments }) => comments).length,
    plans: selectedSalaryPlanPort.loadPlans().length,
    batches: selectedSalaryPlanPort.loadBatches().length,
    storage: projectFiles?.workspaceFiles().reduce((total, file) => total + file.size, 0) ?? 0,
  }), [projectFiles, selectedProjectPort, selectedSalaryPlanPort, workspaceOutputs]);
  useWorkspaceTelemetry({
    analyticsEnabled,
    hydrated,
    mode,
    ready: hydrated && projectController.model.projectState.kind === "ready" && salaryPlanController.model.planState.kind === "ready" && (mode !== "cloud" || projectFiles?.state().kind === "ready"),
    workspaceOpen: entryController.model.state === "workspace",
    measures,
    telemetry,
  });

  useEffect(() => {
    if (hydrated && !section && entryController.model.state === "workspace") router.replace("/relay/dashboard");
  }, [entryController.model.state, hydrated, router, section]);

  function chooseMode(nextMode: "local" | "sample") {
    if (nextMode === "local" && preferences?.localConsent() === "unknown") {
      setShowLocalConsent(true);
      return;
    }
    entryController.actions.chooseMode(nextMode);
    if (nextMode === "local") void telemetry.track({ name: "activation", milestone: "local_workspace_opened" });
    router.push("/relay/dashboard");
  }

  function chooseLocalConsent(enabled: boolean) {
    preferences?.setLocalConsent(enabled);
    if (enabled) void createTelemetryBoundary({ analyticsEnabled: true, send: sendBrowserTelemetry }).track({ name: "activation", milestone: "local_workspace_opened" });
    setPrivacyVersion((version) => version + 1);
    setShowLocalConsent(false);
    entryController.actions.chooseMode("local");
    router.push("/relay/dashboard");
  }

  function setOptionalAnalytics(enabled: boolean) {
    if (mode === "local") preferences?.setLocalConsent(enabled);
    if (mode === "cloud") preferences?.setCloudAnalytics(enabled);
    setPrivacyVersion((version) => version + 1);
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

  async function deleteAccount() {
    const result = await teamController.actions.prepareAccountDeletion();
    if (!result.ok) { setEntryMessage(result.message); return; }
    await auth.deleteAccount();
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
      privacy={{ analyticsEnabled, showLocalConsent }}
      shell={{
        collapsed,
        theme,
        mode,
        identity: entryController.model.identity,
        storageWarning: entryController.model.storageWarning,
        workspace: workspaceController.model,
        backup: backupController,
        team: teamController,
        clients: clientController,
        templates: templateController,
        projects: projectController,
        salaryPlans: salaryPlanController,
        outputs: projectOutputController,
        files: projectFiles,
        portal: clientPortalController,
        discovery: discoveryController,
        projectId,
      }}
      onChooseMode={chooseMode}
      onChooseLocalConsent={chooseLocalConsent}
      onSetOptionalAnalytics={setOptionalAnalytics}
      onStartAccount={startAccount}
      onToggleSidebar={toggleSidebar}
      onToggleTheme={toggleTheme}
      onLeaveWorkspace={leaveWorkspace}
      onDeleteAccount={deleteAccount}
      onRequestNewProject={requestNewProject}
      onProjectCreated={(url) => { setWorkspaceVersion((version) => version + 1); router.push(url); }}
      onProjectsChanged={() => setWorkspaceVersion((version) => version + 1)}
      onClientsChanged={() => setWorkspaceVersion((version) => version + 1)}
      onTemplatesChanged={() => setWorkspaceVersion((version) => version + 1)}
      onSalaryPlansChanged={() => setWorkspaceVersion((version) => version + 1)}
    />
  );
}

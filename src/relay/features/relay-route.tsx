"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOptionalAuth } from "@/lib/optional-auth";
import { createEntryController, type RelaySession, type WorkspaceMode } from "../application/entry-controller";
import { createWorkspaceBackupController } from "../application/workspace-backup-controller";
import { createWorkspaceController } from "../application/workspace-controller";
import { createClientController } from "../application/client-controller";
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

export function RelayRoute({ section, cloudConfigured }: { section?: RelaySection; cloudConfigured: boolean }) {
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
  const clientController = createClientController({ port: selectedClientPort });
  const clientNames = Object.fromEntries(selectedClientPort.loadClients().map((client) => [client.id, client.name]));
  const workspaceController = createWorkspaceController({ mode, workspacePort: selectedWorkspacePort, clientNames, section });
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
      }}
      onChooseMode={chooseMode}
      onStartAccount={startAccount}
      onToggleSidebar={toggleSidebar}
      onToggleTheme={toggleTheme}
      onLeaveWorkspace={leaveWorkspace}
      onRequestNewProject={requestNewProject}
      onClientsChanged={() => setWorkspaceVersion((version) => version + 1)}
    />
  );
}

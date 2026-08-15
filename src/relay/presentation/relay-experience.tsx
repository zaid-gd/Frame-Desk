"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  MonitorDown,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import type { EntryController, WorkspaceMode } from "../application/entry-controller";
import type { RelaySection } from "../application/routes";
import type { WorkspaceModel } from "../application/workspace-controller";
import type { PreparedBackupView, WorkspaceBackupController } from "../application/workspace-backup-controller";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from "./relay.module.css";

const navigationIcons = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  clients: Users,
  calendar: CalendarDays,
  files: FileStack,
  reports: BarChart3,
  team: Users,
  settings: Settings,
} satisfies Record<RelaySection, typeof LayoutDashboard>;

export type RelayExperienceProps = {
  section?: RelaySection;
  entry: EntryController["model"];
  entryMessage: string;
  shell: {
    collapsed: boolean;
    theme: "light" | "dark";
    mode: WorkspaceMode;
    identity?: { displayName: string; email: string; initials: string };
    storageWarning?: string;
    workspace: WorkspaceModel;
    backup: WorkspaceBackupController;
  };
  onChooseMode(mode: "local" | "sample"): void;
  onStartAccount(action: "sign-up" | "sign-in"): void;
  onToggleSidebar(): void;
  onToggleTheme(): void;
  onLeaveWorkspace(): Promise<void>;
  onRequestNewProject(): Promise<{ ok: boolean; message: string }>;
};

export function RelayExperience(props: RelayExperienceProps) {
  if (props.entry.state === "loading") {
    return <main className={styles.relay}><p role="status">Loading Relay</p></main>;
  }

  if (props.entry.state === "welcome") {
    return (
      <main className={styles.relay}>
        <div className={styles.welcome}>
          <section className={styles.welcomeIntro}>
            <div>
              <RelayBrand />
              <h1>Run every edit from one clear workspace</h1>
              <p>Relay keeps video projects, clients, reviews, dates, files, and pay in one calm production view.</p>
            </div>
            <p className={styles.welcomeFoot}>Built for freelance editors and small post-production teams.</p>
          </section>
          <section className={styles.welcomeChoices} aria-labelledby="relay-entry-heading">
            <div className={styles.choicePanel}>
              <p className={styles.eyebrow}>Welcome to Relay</p>
              <h2 id="relay-entry-heading">Choose how to begin</h2>
              <p>Start on this device, set up cloud access, or look around without saving changes.</p>
              <div className={styles.choiceList}>
                <EntryChoice icon={MonitorDown} label={props.entry.primaryChoices[0].label} detail="No account. Solo work stays in this browser." onClick={() => props.onChooseMode("local")} />
                <EntryChoice icon={Cloud} label={props.entry.primaryChoices[1].label} detail="Use cloud sync and enter with your signed-in identity." onClick={() => props.onStartAccount("sign-up")} />
                <EntryChoice icon={FolderKanban} label={props.entry.primaryChoices[2].label} detail="Explore realistic demo work. Every record stays read-only." onClick={() => props.onChooseMode("sample")} />
              </div>
              <button className={styles.signIn} type="button" onClick={() => props.onStartAccount("sign-in")}>{props.entry.secondaryChoice.label}</button>
              {props.entryMessage ? <p className={styles.entryMessage} role="status">{props.entryMessage}</p> : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return <RelayShell section={props.section ?? "dashboard"} {...props.shell} onToggleSidebar={props.onToggleSidebar} onToggleTheme={props.onToggleTheme} onLeaveWorkspace={props.onLeaveWorkspace} onRequestNewProject={props.onRequestNewProject} />;
}

function EntryChoice({ icon: Icon, label, detail, onClick }: { icon: typeof Cloud; label: string; detail: string; onClick: () => void }) {
  return (
    <button className={styles.choice} type="button" onClick={onClick}>
      <span className={styles.choiceIcon}><Icon size={20} aria-hidden="true" /></span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  );
}

function RelayBrand() {
  return <div className={styles.brand} aria-label="Relay"><span className={styles.brandMark} aria-hidden="true"><i /><i /></span><span className={styles.brandName}>Relay</span></div>;
}

function RelayShell({ section, mode, identity, storageWarning, workspace, backup, collapsed, theme, onToggleSidebar, onToggleTheme, onLeaveWorkspace, onRequestNewProject }: RelayExperienceProps["shell"] & { section: RelaySection; onToggleSidebar(): void; onToggleTheme(): void; onLeaveWorkspace(): Promise<void>; onRequestNewProject(): Promise<{ ok: boolean; message: string }> }) {
  const [message, setMessage] = useState("");
  const readOnly = mode === "sample";
  const person = identity ?? workspace.fallbackIdentity;

  async function requestNewProject() {
    const result = await onRequestNewProject();
    setMessage(result.message);
  }

  return (
    <div className={styles.relay} data-theme={theme}>
      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`} aria-label="Relay sidebar">
          <div className={styles.sidebarHead}>
            {!collapsed ? <RelayBrand /> : <span className={styles.brandMark} aria-label="Relay"><i /><i /></span>}
            <button className={styles.iconButton} type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleSidebar}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <div className={styles.workspaceCard}><strong>{workspace.workspaceLabel}</strong><span>{workspace.workspaceDetail}</span></div>
          <nav className={styles.nav} aria-label="Main navigation">
            {workspace.navigation.map(({ section: destination, label }) => {
              const Icon = navigationIcons[destination];
              return <Link key={destination} href={`/relay/${destination}`} aria-label={label} aria-current={section === destination ? "page" : undefined} title={collapsed ? label : undefined}><Icon size={19} aria-hidden="true" /><span className={styles.navLabel}>{label}</span></Link>;
            })}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={styles.account} type="button" aria-label={`Open account menu for ${person.displayName}`}>
                <span className={styles.avatar}>{person.initials}</span>
                <span className={styles.accountCopy}><strong>{person.displayName}</strong><span>{person.email}</span></span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={styles.accountPanel} side="right" align="end" aria-label="Account controls">
              <DropdownMenuLabel>
                <strong>{mode === "cloud" ? "Cloud account" : readOnly ? "Sample Workspace" : "Local Mode"}</strong>
                <span>{person.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuItem className={styles.accountAction} onSelect={() => void onLeaveWorkspace()}>
                {mode === "cloud" ? "Sign out" : "Leave workspace"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </aside>
        <header className={`${styles.topbar} ${collapsed ? styles.topbarCollapsed : ""}`}>
          <div className={styles.search}><Search size={18} aria-hidden="true" /><input aria-label="Search projects and actions" placeholder="Search projects and actions" /></div>
          <button className={`${styles.iconButton} ${styles.themeButton}`} type="button" aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`} onClick={onToggleTheme}>
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>
        <main id="main-content" className={`${styles.main} ${collapsed ? styles.mainCollapsed : ""}`}>
          <div className={styles.content}>
            {storageWarning ? <div className={styles.warning} role="status"><MonitorDown size={18} aria-hidden="true" />{storageWarning}</div> : null}
            {workspace.readOnlyNotice ? <div className={styles.warning}><FolderKanban size={18} aria-hidden="true" />{workspace.readOnlyNotice}</div> : null}
            <PageHeader model={workspace.page} onNewProject={requestNewProject} />
            {section === "dashboard" || section === "projects" ? <Dashboard section={section} workspace={workspace} /> : section === "settings" ? <BackupSettings controller={backup} /> : <SectionPlaceholder section={section} title={workspace.page.title} />}
          </div>
        </main>
        {message ? <div className={styles.toast} role="status">{message}</div> : null}
      </div>
    </div>
  );
}

function BackupSettings({ controller }: { controller: WorkspaceBackupController }) {
  const [preview, setPreview] = useState<PreparedBackupView | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [working, setWorking] = useState(false);

  async function chooseFile(file: File | undefined) {
    setPreview(null);
    setNotice(null);
    if (!file) return;
    if (!controller.actions) return;
    const result = await controller.actions.previewFile(file);
    if (result.ok) setPreview(result.prepared);
    else setNotice({ kind: "error", message: result.error });
  }

  async function apply() {
    if (!preview) return;
    setWorking(true);
    if (!controller.actions) return;
    const result = await controller.actions.applyBackup(preview.backup);
    setWorking(false);
    setNotice({ kind: result.ok ? "success" : "error", message: result.message });
    if (result.ok) {
      setPreview(null);
    }
  }

  if (!controller.model.available) {
    return <section className={`${styles.card} ${styles.backupCard}`}><h2>{controller.model.title}</h2><p>{controller.model.description}</p></section>;
  }

  const model = controller.model;
  return (
    <section className={`${styles.card} ${styles.backupCard}`} aria-labelledby="backup-heading">
      <div className={styles.backupIntro}>
        <span className={styles.backupIcon}><ShieldCheck size={20} aria-hidden="true" /></span>
        <div>
          <p className={styles.eyebrow}>{model.eyebrow}</p>
          <h2 id="backup-heading">{model.title}</h2>
          <p>{model.description}</p>
        </div>
      </div>
      {model.showExport ? <div className={styles.backupAction}><div><strong>{model.exportTitle}</strong><span>{model.exportDescription}</span></div><button type="button" className={styles.secondaryButton} onClick={() => { const result = controller.actions?.exportBackup(); if (result && !result.ok) setNotice({ kind: "error", message: result.error }); }}>{model.exportLabel}</button></div> : null}
      <div className={styles.backupAction}>
        <div><label htmlFor="relay-backup-file"><strong>{model.fileTitle}</strong></label><span>{model.fileDescription}</span></div>
        <input id="relay-backup-file" className={styles.fileInput} type="file" accept=".json,application/json" onChange={(event) => void chooseFile(event.currentTarget.files?.[0])} />
      </div>
      <div className={styles.backupStatus} aria-live="polite" aria-atomic="true">
        {preview ? (
          <div className={styles.preview}>
            <div><strong>{model.applyLead}</strong><span>{preview.fileName} · {preview.recordSummary}</span></div>
            <button type="button" className={styles.primaryButton} disabled={working} onClick={() => void apply()}>{working ? "Working…" : model.applyLabel}</button>
          </div>
        ) : null}
        {notice ? <p className={notice.kind === "error" ? styles.errorNotice : styles.successNotice} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p> : null}
      </div>
    </section>
  );
}

function PageHeader({ model, onNewProject }: { model: WorkspaceModel["page"]; onNewProject: () => void }) {
  return (
    <section className={`${styles.card} ${styles.pageHeader}`}>
      <div><p className={styles.eyebrow}>Production Workspace</p><h1>{model.title}</h1><p>{model.description}</p></div>
      {model.canCreateProject ? <button className={styles.primaryButton} type="button" onClick={onNewProject}><Plus size={18} />New project</button> : null}
    </section>
  );
}

function Dashboard({ section, workspace }: { section: "dashboard" | "projects"; workspace: WorkspaceModel }) {
  return (
    <>
      <section className={`${styles.card} ${styles.metrics}`} aria-label="Workspace metrics">
        {workspace.metrics.map(({ label, value }) => <div className={styles.metric} key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </section>
      <div className={styles.dashboardGrid}>
        <section className={styles.card} aria-labelledby="production-queue-title">
          <div className={styles.cardTitle}><h2 id="production-queue-title">{section === "projects" ? "Projects" : "Production queue"}</h2><Link href="/relay/projects">View all</Link></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Project</th><th>Stage</th><th>Due</th><th>Progress</th></tr></thead>
              <tbody>{workspace.projects.map((project) => <tr key={project.name}><td><span className={styles.projectTitle}>{project.name}</span><span className={styles.projectMeta}>{project.client}</span></td><td><span className={`${styles.status} ${styles[project.tone]}`}>{project.stage}</span></td><td>{project.due}</td><td>{project.progress}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <div className={styles.side}>
          <section className={styles.card} aria-labelledby="due-soon-title"><div className={styles.cardTitle}><h2 id="due-soon-title">Due soon</h2></div><ul className={styles.list}>{workspace.projects.slice(0, 3).map((project) => <li key={project.name}><span>{project.name}<small>{project.stage}</small></span><span>{project.due.replace(", 2026", "")}</span></li>)}</ul></section>
          <section className={styles.card} aria-labelledby="activity-title"><div className={styles.cardTitle}><h2 id="activity-title">Recent activity</h2></div><ul className={styles.list}>{workspace.activity.map((item) => <li key={item.name}><span>{item.name}<small>{item.detail}</small></span><span>{item.age}</span></li>)}</ul></section>
        </div>
      </div>
    </>
  );
}

function SectionPlaceholder({ title }: { section: Exclude<RelaySection, "dashboard" | "projects">; title: string }) {
  return <section className={`${styles.card} ${styles.emptyPage}`}><h2>{title} overview</h2><p>This real Relay route uses the shared App Shell and capability-facing screen contract. Its full behavior belongs to a later ticket.</p></section>;
}

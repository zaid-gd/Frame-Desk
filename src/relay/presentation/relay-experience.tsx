"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
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
import type { ClientController } from "../application/client-controller";
import type { ClientInput } from "../domain/client";
import type { WorkflowTemplateInput } from "../domain/workflow-template";
import type { WorkflowTemplateController } from "../application/workflow-template-controller";
import type { ProjectController } from "../application/project-controller";
import { newProjectSchema, type NewProjectInput, type ProjectGroupInput, type ProjectRecord } from "../domain/project";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from "./relay.module.css";
import { ContentSection, MetricItem, MetricStrip, PageContent, PageHeader as SharedPageHeader, PageToolbar, WorkspacePage } from "@/components/workspace-page";

const navigationIcons = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  clients: Users,
  templates: ListChecks,
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
    clients: ClientController;
    templates: WorkflowTemplateController;
    projects: ProjectController;
    projectId?: string;
  };
  onChooseMode(mode: "local" | "sample"): void;
  onStartAccount(action: "sign-up" | "sign-in"): void;
  onToggleSidebar(): void;
  onToggleTheme(): void;
  onLeaveWorkspace(): Promise<void>;
  onRequestNewProject(): Promise<{ ok: boolean; message: string }>;
  onProjectCreated(url: string): void;
  onProjectsChanged(): void;
  onClientsChanged(): void;
  onTemplatesChanged(): void;
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

  return <RelayShell section={props.section ?? "dashboard"} {...props.shell} onToggleSidebar={props.onToggleSidebar} onToggleTheme={props.onToggleTheme} onLeaveWorkspace={props.onLeaveWorkspace} onRequestNewProject={props.onRequestNewProject} onProjectCreated={props.onProjectCreated} onProjectsChanged={props.onProjectsChanged} onClientsChanged={props.onClientsChanged} onTemplatesChanged={props.onTemplatesChanged} />;
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

function RelayShell({ section, projectId, mode, identity, storageWarning, workspace, backup, clients, templates, projects, collapsed, theme, onToggleSidebar, onToggleTheme, onLeaveWorkspace, onProjectCreated, onProjectsChanged, onClientsChanged, onTemplatesChanged }: RelayExperienceProps["shell"] & { section: RelaySection; onToggleSidebar(): void; onToggleTheme(): void; onLeaveWorkspace(): Promise<void>; onRequestNewProject(): Promise<{ ok: boolean; message: string }>; onProjectCreated(url: string): void; onProjectsChanged(): void; onClientsChanged(): void; onTemplatesChanged(): void }) {
  const [message, setMessage] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const readOnly = mode === "sample";
  const person = identity ?? workspace.fallbackIdentity;

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
            {!projectId && section !== "projects" ? <RelayPageHeader model={workspace.page} onNewProject={() => readOnly ? setMessage("Sample Workspace is read-only. Choose Local Mode or create an account to make changes.") : setShowNewProject(true)} /> : null}
            {projectId ? <ProjectPage controller={projects} projectId={projectId} /> : section === "dashboard" ? <Dashboard section={section} workspace={workspace} /> : section === "projects" ? <ProjectsPage controller={projects} workspace={workspace} readOnly={readOnly} showNewProject={showNewProject} onNewProject={() => readOnly ? setMessage("Sample Workspace is read-only. Choose Local Mode or create an account to make changes.") : setShowNewProject(true)} onCancelNewProject={() => setShowNewProject(false)} onProjectCreated={onProjectCreated} onChanged={onProjectsChanged} /> : section === "clients" ? <ClientsPage controller={clients} readOnly={readOnly} onChanged={onClientsChanged} /> : section === "templates" ? <TemplatesPage controller={templates} onChanged={onTemplatesChanged} /> : section === "settings" ? <BackupSettings controller={backup} /> : <SectionPlaceholder section={section} title={workspace.page.title} />}
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

function RelayPageHeader({ model, onNewProject }: { model: WorkspaceModel["page"]; onNewProject: () => void }) {
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
              <tbody>{workspace.projects.map((project) => <tr key={project.id}><td><Link className={styles.projectTitle} href={`/relay/projects/${project.id}`}>{project.name}</Link><span className={styles.projectMeta}>{project.clientName}</span></td><td><span className={`${styles.status} ${styles[project.tone]}`}>{project.stage}</span></td><td>{project.due}</td><td>{project.progress}</td></tr>)}</tbody>
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

const blankProject: NewProjectInput = { name: "", clientId: "", projectGroupId: "", templateId: "", dueDate: "", financialType: "projectValue" };
const blankGroup: ProjectGroupInput = { name: "", clientId: "", startDate: "", endDate: "", notes: "" };

function NewProjectForm({ controller, onCancel, onCreated }: { controller: ProjectController; onCancel(): void; onCreated(url: string): void }) {
  const [notice, setNotice] = useState("");
  const form = useForm({
    defaultValues: blankProject,
    validators: { onSubmit: newProjectSchema },
    onSubmit: async ({ value }) => {
      const result = await controller.actions.create(value);
      setNotice(result.message);
      if (result.ok) onCreated(result.url);
    },
  });
  return (
    <section className={`${styles.card} ${styles.projectCreate}`} aria-labelledby="new-project-title">
      <div className={styles.cardTitle}><div><p className={styles.eyebrow}>Short setup</p><h2 id="new-project-title">Create Project</h2></div><button type="button" onClick={onCancel}>Close</button></div>
      <form onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }}>
        <form.Field name="name">{(field) => <label>Project name<input autoFocus value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
        <form.Field name="clientId">{(field) => <label>Client<select value={field.state.value} onChange={(event) => field.handleChange(event.target.value)}><option value="">Choose a Client</option>{controller.model.clients.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}</form.Field>
        <form.Subscribe selector={(state) => state.values.clientId}>{(clientId) => <form.Field name="projectGroupId">{(field) => <label>Project Group <span>(optional)</span><select value={field.state.value} onChange={(event) => field.handleChange(event.target.value)}><option value="">No Project Group</option>{controller.actions.groupOptions(clientId).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}</form.Field>}</form.Subscribe>
        <form.Field name="templateId">{(field) => <label>Workflow Template<select value={field.state.value} onChange={(event) => field.handleChange(event.target.value)}><option value="">Choose a Workflow Template</option>{controller.model.templates.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}</form.Field>
        <form.Field name="dueDate">{(field) => <label>Due date<input type="date" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
        <form.Field name="financialType">{(field) => <label>Financial type<select value={field.state.value} onChange={(event) => field.handleChange(event.target.value as NewProjectInput["financialType"])}><option value="projectValue">Project value</option><option value="salaryPlan">Salary Plan</option><option value="nonBillable">Non-billable</option></select></label>}</form.Field>
        <div className={styles.formActions}><button type="button" onClick={onCancel}>Cancel</button><form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className={styles.primaryButton} disabled={!canSubmit || isSubmitting} type="submit">{isSubmitting ? "Creating…" : "Create Project"}</button>}</form.Subscribe></div>
      </form>
      <form.Subscribe selector={(state) => state.errors}>{(errors) => errors.length ? <p className={styles.errorNotice} role="alert">{errors.map((error) => typeof error === "string" ? error : "Check the six Project fields and try again.").join(" ")}</p> : null}</form.Subscribe>
      {notice ? <p role="status">{notice}</p> : null}
    </section>
  );
}

export function ProjectsPage({ controller, workspace, readOnly, showNewProject, onNewProject, onCancelNewProject, onProjectCreated, onChanged }: { controller: ProjectController; workspace: WorkspaceModel; readOnly: boolean; showNewProject: boolean; onNewProject(): void; onCancelNewProject(): void; onProjectCreated(url: string): void; onChanged(): void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState(blankGroup);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const state = {
    query: searchParams.get("query") ?? undefined, client: searchParams.get("client") ?? undefined, stage: searchParams.get("stage") ?? undefined,
    payment: (searchParams.get("payment") as "paid" | "unpaid" | "not-applicable" | null) ?? undefined,
    salary: (searchParams.get("salary") as "salary" | "other" | null) ?? undefined,
    sort: (searchParams.get("sort") as "name" | "client" | "stage" | "due" | "payment" | null) ?? undefined,
    direction: (searchParams.get("direction") as "asc" | "desc" | null) ?? undefined,
    view: (searchParams.get("view") as "table" | "board" | null) ?? undefined,
    archived: (searchParams.get("archived") as "include" | null) ?? undefined,
  };
  const table = controller.actions.table(state);
  useEffect(() => { if (!state.view) { const remembered = window.localStorage.getItem("relay:projects-view:v1"); if (remembered === "board") router.replace(`${pathname}?${controller.actions.viewQuery({ ...state, view: "board" })}`); } }, []);
  function setViewState(next: typeof state) { if (next.view) window.localStorage.setItem("relay:projects-view:v1", next.view); const query = controller.actions.viewQuery(next); router.replace(query ? `${pathname}?${query}` : pathname); }
  const selected = controller.model.groups.find((group) => group.id === selectedId);
  function update(field: keyof ProjectGroupInput, value: string) { setDraft((current) => ({ ...current, [field]: value })); }
  async function saveGroup(event: React.FormEvent) {
    event.preventDefault();
    const result = selected ? await controller.actions.editGroup(selected.id, draft) : await controller.actions.createGroup(draft);
    setNotice(result.message);
    if (result.ok) { setDraft(blankGroup); setSelectedId(null); onChanged(); }
  }
  function inspect(group: typeof selected) { if (!group) return; setSelectedId(group.id); setDraft({ name: group.name, clientId: group.clientId, startDate: group.startDate, endDate: group.endDate, notes: group.notes }); }
  async function toggleGroup() { if (!selected) return; const result = await controller.actions.setGroupArchived(selected.id, !selected.archived); setNotice(result.message); if (result.ok) { setSelectedId(null); setDraft(blankGroup); onChanged(); } }
  const selectedClient = selected ? controller.model.clients.find(({ value }) => value === selected.clientId)?.label ?? "Unknown Client" : "";
  async function archiveProject(id: string, archived: boolean) { const result = archived ? await controller.actions.restore(id) : await controller.actions.archive(id); setNotice(result.message); if (result.ok) onChanged(); }
  async function deleteProject() { if (!deleteId) return; const result = await controller.actions.deletePermanently(deleteId); setNotice(result.message); if (result.ok) { setDeleteId(null); onChanged(); } }
  type ProjectRow = ProjectRecord & { clientName: string };
  const columns: ColumnDef<ProjectRow>[] = [
    { accessorKey: "name", header: "Project", cell: ({ row }) => <Link className={styles.projectTitle} href={`/relay/projects/${row.original.id}`}>{row.original.name}</Link> },
    { accessorKey: "clientName", header: "Client" }, { accessorKey: "stage", header: "Stage" }, { accessorKey: "dueDate", header: "Due" },
    { accessorKey: "paymentState", header: "Payment", cell: ({ row }) => row.original.paymentState === "not-applicable" ? "—" : row.original.paymentState === "paid" ? "Paid" : "Unpaid" },
    { accessorKey: "financialType", header: "Salary", cell: ({ row }) => row.original.financialType === "salaryPlan" ? "Salary Plan" : "—" },
    ...(table.showAssignees ? [{ accessorKey: "assignees", header: "Assignees", cell: ({ row }: { row: { original: ProjectRow } }) => row.original.assignees.join(", ") || "Unassigned" } satisfies ColumnDef<ProjectRow>] : []),
    { id: "actions", header: "Actions", cell: ({ row }) => readOnly ? <span>Read-only</span> : <><button type="button" onClick={() => void archiveProject(row.original.id, row.original.archived)}>{row.original.archived ? "Restore" : "Archive"}</button>{controller.model.canDeletePermanently ? <button type="button" onClick={() => setDeleteId(row.original.id)}>Delete permanently</button> : null}</> },
  ];
  const reactTable = useReactTable({ data: table.rows, columns, getCoreRowModel: getCoreRowModel() });
  const projectTable = controller.model.projectState.kind === "loading" ? <div className={styles.emptyPage} role="status"><h3>Loading Projects…</h3><p>Your current view will appear when the Workspace responds.</p></div> : controller.model.projectState.kind === "error" ? <div className={styles.emptyPage} role="alert"><h3>Projects could not load</h3><p>{controller.model.projectState.message ?? "Refresh the page to try again."}</p></div> : table.rows.length ? <div className={styles.tableWrap}><table className={styles.table}>{reactTable.getHeaderGroups().map((group) => <thead key={group.id}><tr>{group.headers.map((header) => <th scope="col" key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr></thead>)}<tbody>{reactTable.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div> : <div className={styles.emptyPage} role="status"><h3>No Projects found</h3><p>Clear a filter or create a Project to start tracking work.</p></div>;
  const board = <div className={styles.groupGrid}>{[...new Set(table.rows.map((project) => project.stage))].map((stage) => <section className={styles.card} key={stage}><h3>{stage}</h3><ul className={styles.clientRows}>{table.rows.filter((project) => project.stage === stage).map((project) => <li key={project.id}><Link href={`/relay/projects/${project.id}`}>{project.name}<span>{project.clientName} · {project.dueDate}</span></Link></li>)}</ul></section>)}</div>;
  const inspector = selected ? <div className={styles.groupInspector}><h3>{selected.name}</h3><dl><div><dt>Client</dt><dd>{selectedClient}</dd></div><div><dt>Status</dt><dd>{selected.archived ? "Archived" : "Active"}</dd></div><div><dt>Date range</dt><dd>{selected.startDate || "No start"} — {selected.endDate || "No end"}</dd></div><div><dt>Projects</dt><dd>{selected.projectCount}</dd></div><div><dt>Progress</dt><dd>{selected.progress}%</dd></div><div><dt>Money</dt><dd>{selected.money.toLocaleString()}</dd></div></dl><p>{selected.notes || "No notes."}</p></div> : <p className={styles.clientEmpty}>Choose a Project Group to inspect it.</p>;
  return (
    <WorkspacePage family="data-index">
      <SharedPageHeader eyebrow="Production Workspace" title="Projects" description="Create tracked work and group related jobs for one Client." actions={<button className={styles.primaryButton} type="button" onClick={onNewProject}><Plus size={18} />New project</button>} />
      <PageContent>
      {showNewProject ? <NewProjectForm controller={controller} onCancel={onCancelNewProject} onCreated={onProjectCreated} /> : null}
      <MetricStrip aria-label="Workspace metrics">{workspace.metrics.map((metric) => <MetricItem key={metric.label} label={metric.label} value={metric.value} />)}</MetricStrip>
      <ContentSection title="Projects" bodyMode="flush"><PageToolbar className={styles.formActions}><input aria-label="Search Projects" placeholder="Search Projects" value={state.query ?? ""} onChange={(event) => setViewState({ ...state, query: event.target.value || undefined })} /><select aria-label="Filter by Client" value={state.client ?? ""} onChange={(event) => setViewState({ ...state, client: event.target.value || undefined })}><option value="">All Clients</option>{controller.model.clients.map((client) => <option key={client.value} value={client.value}>{client.label}</option>)}</select><select aria-label="Filter by stage" value={state.stage ?? ""} onChange={(event) => setViewState({ ...state, stage: event.target.value || undefined })}><option value="">All stages</option>{[...new Set(controller.model.projects.map((project) => project.stage))].map((stage) => <option key={stage}>{stage}</option>)}</select><select aria-label="Filter by payment" value={state.payment ?? ""} onChange={(event) => setViewState({ ...state, payment: (event.target.value || undefined) as typeof state.payment })}><option value="">All payment states</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="not-applicable">Not applicable</option></select><select aria-label="Filter by salary" value={state.salary ?? ""} onChange={(event) => setViewState({ ...state, salary: (event.target.value || undefined) as typeof state.salary })}><option value="">All financial types</option><option value="salary">Salary Plan</option><option value="other">Other</option></select><select aria-label="Sort Projects" value={state.sort ?? "due"} onChange={(event) => setViewState({ ...state, sort: event.target.value as typeof state.sort })}><option value="due">Due date</option><option value="name">Name</option><option value="client">Client</option><option value="stage">Stage</option><option value="payment">Payment</option></select><button type="button" aria-label={`Sort ${state.direction === "desc" ? "ascending" : "descending"}`} onClick={() => setViewState({ ...state, direction: state.direction === "desc" ? "asc" : "desc" })}>{state.direction === "desc" ? "Descending" : "Ascending"}</button><label className={styles.check}><input type="checkbox" checked={state.archived === "include"} onChange={(event) => setViewState({ ...state, archived: event.target.checked ? "include" : undefined })} />Archived</label><button type="button" aria-pressed={table.view === "table"} onClick={() => setViewState({ ...state, view: "table" })}>Table</button><button type="button" aria-pressed={table.view === "board"} onClick={() => setViewState({ ...state, view: "board" })}>Board</button></PageToolbar>{table.view === "board" ? board : projectTable}</ContentSection>
      {deleteId ? <div role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title" className={styles.card}><h3 id="delete-project-title">Permanently delete this Project?</h3><p>{controller.model.deletionEffects}</p><div className={styles.formActions}><button type="button" onClick={() => setDeleteId(null)}>Cancel</button><button type="button" onClick={() => void deleteProject()}>Delete permanently</button></div></div> : null}
      <ContentSection title="Project Groups" description="Campaigns, retainers, and production runs for one Client." actions={<label className={styles.check}><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />Include archived</label>} bodyMode="flush">
        <div className={styles.groupGrid}>
          <ul className={styles.clientRows}>{controller.model.groups.filter((group) => includeArchived || !group.archived).map((group) => <li key={group.id}><button type="button" aria-pressed={selectedId === group.id} onClick={() => inspect(group)}><strong>{group.name}</strong><span>{group.projectCount} Projects · {group.progress}% · {group.money.toLocaleString()}</span>{group.archived ? <small>Archived</small> : null}</button></li>)}</ul>
          <div>{inspector}{!readOnly ? <form className={styles.groupForm} onSubmit={(event) => void saveGroup(event)}><h3>{selected ? "Edit Project Group" : "Create Project Group"}</h3><label>Name<input required value={draft.name} onChange={(event) => update("name", event.target.value)} /></label><label>Client<select required value={draft.clientId} onChange={(event) => update("clientId", event.target.value)}><option value="">Choose a Client</option>{controller.model.clients.map((client) => <option key={client.value} value={client.value}>{client.label}</option>)}</select></label><label>Start date <span>(optional)</span><input type="date" value={draft.startDate} onChange={(event) => update("startDate", event.target.value)} /></label><label>End date <span>(optional)</span><input type="date" value={draft.endDate} onChange={(event) => update("endDate", event.target.value)} /></label><label className={styles.fullField}>Notes<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label><div className={styles.formActions}>{selected ? <><button type="button" onClick={() => { setSelectedId(null); setDraft(blankGroup); }}>Cancel</button><button type="button" onClick={() => void toggleGroup()}>{selected.archived ? "Restore" : "Archive"}</button></> : null}<button className={styles.primaryButton} type="submit">{selected ? "Save Project Group" : "Create Project Group"}</button></div></form> : null}</div>
        </div>
      </ContentSection>
      {notice ? <p className={styles.toast} role="status">{notice}</p> : null}
      </PageContent>
    </WorkspacePage>
  );
}

function ProjectPage({ controller, projectId }: { controller: ProjectController; projectId: string }) {
  const project = controller.actions.inspectProject(projectId);
  if (!project) return <WorkspacePage family="data-index"><SharedPageHeader title="Project not found" description="This Project is unavailable in the current Workspace." actions={<Link href="/relay/projects">Back to Projects</Link>} /></WorkspacePage>;
  const client = controller.model.clients.find(({ value }) => value === project.clientId)?.label ?? "Unknown Client";
  const headerFacts = <dl className={styles.projectFacts}><div><dt>Stage</dt><dd>{project.stage}</dd></div><div><dt>Client</dt><dd>{client}</dd></div><div><dt>Due date</dt><dd>{project.dueDate}</dd></div><div><dt>Lead</dt><dd>{project.lead}</dd></div><div><dt>Assignees</dt><dd>{project.assignees.length ? project.assignees.join(", ") : "Unassigned"}</dd></div></dl>;
  return <WorkspacePage family="data-index"><SharedPageHeader eyebrow="Project" title={project.name} description={headerFacts} /><PageContent>{["Overview", "Outputs and Versions", "Client Review", "Files and Links", "Activity"].map((title) => <ContentSection title={title} key={title}><p>{title === "Overview" ? `Financial type: ${project.financialType}. Workflow: ${project.workflowSetup.templateName}.` : `${title} will stay attached to this Project as its work grows.`}</p></ContentSection>)}</PageContent></WorkspacePage>;
}

const blankClient: ClientInput = { name: "", company: "", contactName: "", email: "", phone: "", notes: "" };

function ClientsPage({ controller, readOnly, onChanged }: { controller: ClientController; readOnly: boolean; onChanged(): void }) {
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClientInput>(blankClient);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const copy = controller.model.copy;
  const clientRows = controller.actions.searchRows(query, { includeArchived });
  const detail = selectedId ? controller.actions.inspect(selectedId) : null;

  function update(field: keyof ClientInput, value: string) { setDraft((current) => ({ ...current, [field]: value })); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const result = editing ? await controller.actions.edit(editing, draft) : await controller.actions.create(draft);
    setNotice(result.message);
    if (result.ok) { setDraft(blankClient); setEditing(null); setSelectedId(result.client?.id ?? editing); onChanged(); }
  }
  function startEdit() {
    if (!detail) return;
    const { name, company, contactName, email, phone, notes } = detail.client;
    setDraft({ name, company, contactName, email, phone, notes });
    setEditing(detail.client.id);
  }
  async function setArchived(archived: boolean) {
    if (!detail) return;
    const result = archived ? await controller.actions.archive(detail.client.id) : await controller.actions.restore(detail.client.id);
    setNotice(result.message);
    if (result.ok) { if (archived && !includeArchived) setSelectedId(null); onChanged(); }
  }

  return (
    <div className={styles.clientsGrid}>
      <section className={`${styles.card} ${styles.clientList}`} aria-labelledby="client-list-title">
        <div className={styles.cardTitle}><h2 id="client-list-title">{copy.listTitle}</h2><span>{clientRows.length}</span></div>
        <div className={styles.clientTools}>
          <label><span>{copy.searchLabel}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>
          <label className={styles.check}><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />{copy.includeArchivedLabel}</label>
        </div>
        {clientRows.length ? <ul className={styles.clientRows}>{clientRows.map(({ client, secondary, archivedText }) => <li key={client.id}><button type="button" aria-pressed={selectedId === client.id} onClick={() => setSelectedId(client.id)}><strong>{client.name}</strong><span>{secondary}</span>{archivedText ? <small>{archivedText}</small> : null}</button></li>)}</ul> : <p className={styles.clientEmpty}>{copy.emptyList}</p>}
      </section>
      <div className={styles.clientPane}>
        {!readOnly ? <section className={`${styles.card} ${styles.clientForm}`} aria-labelledby="client-form-title"><div className={styles.cardTitle}><h2 id="client-form-title">{editing ? copy.editTitle : copy.createTitle}</h2></div><form onSubmit={(event) => void save(event)}><label>{copy.fieldLabels.name}<input required value={draft.name} onChange={(event) => update("name", event.target.value)} /></label><label>{copy.fieldLabels.company}<input value={draft.company} onChange={(event) => update("company", event.target.value)} /></label><label>{copy.fieldLabels.contactName}<input value={draft.contactName} onChange={(event) => update("contactName", event.target.value)} /></label><label>{copy.fieldLabels.email}<input type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label><label>{copy.fieldLabels.phone}<input type="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label><label className={styles.fullField}>{copy.fieldLabels.notes}<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label><div className={styles.formActions}>{editing ? <button type="button" onClick={() => { setEditing(null); setDraft(blankClient); }}>{copy.cancelLabel}</button> : null}<button className={styles.primaryButton} type="submit">{editing ? copy.saveLabel : copy.createLabel}</button></div></form></section> : null}
        {detail ? <section className={`${styles.card} ${styles.clientDetail}`} aria-labelledby="client-detail-title"><div className={styles.cardTitle}><h2 id="client-detail-title">{detail.client.name}</h2><div className={styles.formActions}>{!readOnly ? <><button type="button" onClick={startEdit}>{copy.editLabel}</button><button type="button" onClick={() => void setArchived(!detail.client.archived)}>{detail.client.archived ? copy.restoreLabel : copy.archiveLabel}</button></> : null}</div></div><dl>{detail.display.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.kind === "email" && field.href ? <a href={field.href}>{field.value}</a> : field.value}</dd></div>)}</dl><p>{detail.display.notes}</p>{detail.display.relationships.map((relationship) => <Relationship key={relationship.title} title={relationship.title} rows={relationship.rows} empty={copy.none} />)}<div><h3>{detail.display.portalTitle}</h3>{detail.portalLinks.length ? <ul>{detail.portalLinks.map((link) => <li key={link.projectId}><Link href={link.url}>{link.projectName}</Link></li>)}</ul> : <p>{detail.display.portalsEmpty}</p>}</div></section> : <section className={`${styles.card} ${styles.clientEmpty}`}><h2>{copy.inspectTitle}</h2><p>{copy.inspectEmpty}</p></section>}
      </div>
      {notice ? <p className={styles.toast} role="status">{notice}</p> : null}
    </div>
  );
}

function Relationship({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <div><h3>{title}</h3>{rows.length ? <ul>{rows.map((row) => <li key={row}>{row}</li>)}</ul> : <p>{empty}</p>}</div>;
}

function TemplatesPage({ controller, onChanged }: { controller: WorkflowTemplateController; onChanged(): void }) {
  const canManage = controller.model.canManage;
  const copy = controller.model.copy;
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(controller.actions.list()[0]?.id ?? null);
  const [draft, setDraft] = useState<WorkflowTemplateInput | null>(() => {
    const first = controller.actions.list()[0];
    return first ? controller.actions.inspectView(first.id)?.draft ?? null : null;
  });
  const [notice, setNotice] = useState("");
  const rows = controller.actions.listRows(includeArchived);
  const selected = selectedId ? controller.actions.inspectView(selectedId) : null;

  function choose(id: string) {
    const view = controller.actions.inspectView(id);
    if (!view) return;
    setSelectedId(view.id);
    setDraft(view.draft);
    setNotice("");
  }
  async function create() {
    const result = await controller.actions.create();
    setNotice(result.message);
    if (result.ok && result.template) { choose(result.template.id); onChanged(); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !draft) return;
    const result = await controller.actions.edit(selected.id, draft);
    setNotice(result.message);
    if (result.ok) onChanged();
  }
  async function archive() {
    if (!selected) return;
    const result = await controller.actions.toggleArchived(selected.id);
    setNotice(result.message);
    if (result.ok) { setSelectedId(null); setDraft(null); onChanged(); }
  }
  async function moveTemplate(direction: -1 | 1) {
    if (!selected) return;
    const result = await controller.actions.moveTemplate(selected.id, direction);
    setNotice(result.message);
    if (result.ok) onChanged();
  }
  function moveStage(index: number, direction: -1 | 1) {
    if (!draft) return;
    setDraft(controller.actions.moveStage(draft, index, direction));
  }

  return (
    <div className={styles.templatesGrid}>
      <section className={`${styles.card} ${styles.templateList}`} aria-labelledby="template-list-title">
        <div className={styles.cardTitle}><h2 id="template-list-title">{copy.listTitle}</h2>{canManage ? <button className={styles.primaryButton} type="button" onClick={() => void create()}><Plus size={16} />{copy.createLabel}</button> : null}</div>
        <label className={styles.templateArchiveFilter}><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />{copy.includeArchivedLabel}</label>
        <ul className={styles.clientRows}>{rows.map((template) => <li key={template.id}><button type="button" aria-pressed={selectedId === template.id} onClick={() => choose(template.id)}><strong>{template.name}</strong><span>{template.summary}</span>{template.archivedText ? <small>{template.archivedText}</small> : null}</button></li>)}</ul>
      </section>
      {selected && draft ? (
        <form className={`${styles.card} ${styles.templateEditor}`} onSubmit={(event) => void save(event)}>
          <div className={styles.cardTitle}><div><h2>{selected.name}</h2><span>{copy.inspectLead}</span></div>{canManage ? <div className={styles.formActions}><button type="button" aria-label={copy.moveTemplateUp} onClick={() => void moveTemplate(-1)}><ArrowUp size={16} /></button><button type="button" aria-label={copy.moveTemplateDown} onClick={() => void moveTemplate(1)}><ArrowDown size={16} /></button><button type="button" onClick={() => void archive()}>{selected.archiveActionLabel}</button></div> : null}</div>
          <div className={styles.templateFields}>
            <label>{copy.fields.name}<input disabled={!canManage} value={draft.name} onChange={(event) => setDraft(controller.actions.setName(draft, event.target.value))} /></label>
            <label>{copy.fields.cancelled}<input disabled={!canManage} value={draft.cancelledLabel} onChange={(event) => setDraft(controller.actions.setCancelledLabel(draft, event.target.value))} /><small>{copy.cancelledHelp}</small></label>
            <fieldset><legend>{copy.sections.stages}</legend>{controller.actions.stageRows(draft).map(({ stage, purposeLabel, canRemove }, index) => <div className={styles.templateRow} key={stage.id}><span>{index + 1}</span><input aria-label={`${purposeLabel} stage label`} disabled={!canManage} value={stage.label} onChange={(event) => setDraft(controller.actions.setStageLabel(draft, stage.id, event.target.value))} /><code>{purposeLabel}</code>{canManage ? <><button type="button" aria-label={controller.actions.moveStageActionLabel(stage.label, -1)} onClick={() => moveStage(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={controller.actions.moveStageActionLabel(stage.label, 1)} onClick={() => moveStage(index, 1)}><ArrowDown size={15} /></button>{canRemove ? <button type="button" onClick={() => setDraft(controller.actions.removeStage(draft, stage.id))}>{copy.actions.remove}</button> : null}</> : null}</div>)}{canManage ? <button type="button" onClick={() => setDraft(controller.actions.addStage(draft))}><Plus size={15} />{copy.actions.addStage}</button> : null}</fieldset>
            <fieldset><legend>{copy.sections.roles}</legend>{draft.roles.map((role) => <div className={styles.templateRow} key={role.id}><input aria-label={copy.fields.roleLabel} disabled={!canManage} value={role.label} onChange={(event) => setDraft(controller.actions.setRoleLabel(draft, role.id, event.target.value))} />{canManage ? <button type="button" onClick={() => setDraft(controller.actions.removeRole(draft, role.id))}>{copy.actions.remove}</button> : null}</div>)}{canManage ? <button type="button" onClick={() => setDraft(controller.actions.addRole(draft))}><Plus size={15} />{copy.actions.addRole}</button> : null}</fieldset>
            <fieldset><legend>{copy.sections.outputs}</legend>{draft.starterOutputs.map((output) => <div className={`${styles.templateRow} ${styles.outputRow}`} key={output.id}><input aria-label={copy.fields.outputName} disabled={!canManage} value={output.name} onChange={(event) => setDraft(controller.actions.setOutputName(draft, output.id, event.target.value))} /><label>{copy.fields.deadline}<input type="number" disabled={!canManage} value={output.relativeDeadlineDays} onChange={(event) => setDraft(controller.actions.setOutputDeadline(draft, output.id, Number(event.target.value)))} /></label><label>{copy.fields.role}<select disabled={!canManage} value={output.roleId ?? ""} onChange={(event) => setDraft(controller.actions.setOutputRole(draft, output.id, event.target.value || null))}><option value="">{copy.fields.unassigned}</option>{draft.roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>{canManage ? <button type="button" onClick={() => setDraft(controller.actions.removeOutput(draft, output.id))}>{copy.actions.remove}</button> : null}</div>)}{canManage ? <button type="button" onClick={() => setDraft(controller.actions.addOutput(draft))}><Plus size={15} />{copy.actions.addOutput}</button> : null}</fieldset>
            <fieldset><legend>{copy.sections.portal}</legend><div className={styles.portalDefaults}>{(["enabled", "showDates", "showNotes", "allowComments"] as const).map((key) => <label key={key}><input type="checkbox" disabled={!canManage} checked={draft.portalDefaults[key]} onChange={(event) => setDraft(controller.actions.setPortalDefault(draft, key, event.target.checked))} />{copy.portalLabels[key]}</label>)}</div></fieldset>
          </div>
          {canManage ? <div className={styles.templateSave}><button className={styles.primaryButton} type="submit">{copy.actions.save}</button></div> : null}
        </form>
      ) : <section className={`${styles.card} ${styles.clientEmpty}`}><h2>{copy.inspectLead}</h2><p>{copy.inspectEmpty}</p></section>}
      {notice ? <p className={styles.toast} role="status">{notice}</p> : null}
    </div>
  );
}

function SectionPlaceholder({ title }: { section: Exclude<RelaySection, "dashboard" | "projects">; title: string }) {
  return <section className={`${styles.card} ${styles.emptyPage}`}><h2>{title} overview</h2><p>This real Relay route uses the shared App Shell and capability-facing screen contract. Its full behavior belongs to a later ticket.</p></section>;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useData } from "@/lib/data-context";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MovieCreationOutlinedIcon from "@mui/icons-material/MovieCreationOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ViewTimelineOutlinedIcon from "@mui/icons-material/ViewTimelineOutlined";
import Link from "next/link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { DEFAULT_PROFILE_ID, getProfile } from "@/lib/profiles";
import type { WorkItem, WorkTypeConfig, IntegrationConfig } from "@/lib/types";

const SALARY_BATCH_SIZE = 20;
const SALARY_BATCH_AMOUNT = 10000;
const AUTH_MODE_STORAGE_KEY = "cutlab-studio:auth-mode:v1";
const sidebarWidth = 264;
const headingFont = "Georgia, 'Times New Roman', serif";
const defaultAccent = "#5b3fa0";
const accent = "var(--app-accent, #5b3fa0)";
const ink = "var(--app-ink, #19171f)";
const muted = "var(--app-muted, #6f6a78)";
const border = "var(--app-border, #dedbe5)";
const panel = "var(--app-panel, #ffffff)";
const canvas = "var(--app-canvas, #fbfaf8)";
const activeBg = "var(--app-active, #f0eafa)";
const hoverBg = "var(--app-hover, #f7f4fc)";
const softPanel = "var(--app-soft-panel, #fbfafc)";
const headerPanel = "var(--app-header-panel, #f6f3f8)";
const controlPanel = "var(--app-control, #ffffff)";
const progressTrack = "var(--app-progress-track, #ece8f4)";
const avatarSurface = "var(--app-avatar-surface, #dfe7ef)";
const thumbIcon = "var(--app-thumb-icon, rgba(25,23,31,0.34))";
const panelSx = { bgcolor: panel, border: `1px solid ${border}`, borderRadius: "6px", overflow: "hidden" };
const tableHeadingSx = { color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase" };
const outlineButtonSx = {
  borderColor: border,
  color: accent,
  bgcolor: panel,
  height: 44,
  px: 2,
  borderRadius: "6px",
  fontSize: 14,
  fontWeight: 720,
  whiteSpace: "nowrap",
  "&:hover": { borderColor: accent, bgcolor: hoverBg }
};

type PageKey = "dashboard" | "projects" | "clients" | "timeline" | "calendar" | "media" | "feedback" | "templates" | "reports" | "team" | "settings" | "profile" | "profile-edit" | "organization-profile";
type ProjectStatus = "Planned" | "In Progress" | "Delivered" | "Cancelled";
type ProjectKind = "ALL" | "Job / Salary" | "Freelance" | "Personal Channel";
type DueFilter = "ALL" | "This Week" | "Overdue" | "Delivered";
type SortKey = "createdAt_desc" | "createdAt_asc" | "dueDate_asc" | "earnings_desc" | "earnings_asc";
type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
};
type SettingsState = {
  studioName: string;
  profileName: string;
  profileUsername: string;
  profileTitle: string;
  profileBio: string;
  profileLocation: string;
  profileImageUrl: string;
  timeZone: string;
  dateFormat: string;
  weekStart: string;
  currencyCode: string;
  projectStages: string[];
  notifications: Record<string, boolean>;
  integrations: Record<string, boolean>;
  integrationAccounts: Record<string, string>;
  integrationConfigs: Record<string, IntegrationConfig>;
  teamRole: string;
  teamMembers: TeamMember[];
  editorPermissions: Record<string, boolean>;
  rolePermissions: Record<string, Record<string, boolean>>;
  theme: string;
  accentColor: string;
  density: string;
};
type ToastState = {
  message: string;
  tone: "success" | "info" | "warning";
};

const profile = getProfile(DEFAULT_PROFILE_ID);

const statusOptions: ProjectStatus[] = ["Planned", "In Progress", "Delivered", "Cancelled"];
const kindOptions: ProjectKind[] = ["ALL", "Job / Salary", "Freelance", "Personal Channel"];
const billingOptions = ["ALL", "Paid", "Unpaid"];
const dueOptions: DueFilter[] = ["ALL", "This Week", "Overdue", "Delivered"];
const sortOptions: SortKey[] = ["createdAt_desc", "createdAt_asc", "dueDate_asc", "earnings_desc", "earnings_asc"];
const teamRoleOptions = ["Owner", "Editor", "Reviewer", "Client"];
const currencyOptions = ["USD", "EUR", "GBP", "INR", "AED", "SAR"];
const currencyLabels: Record<string, string> = {
  USD: "USD ($)",
  EUR: "EUR (€)",
  GBP: "GBP (£)",
  INR: "INR (Rs)",
  AED: "AED (Dh)",
  SAR: "SAR (SR)"
};
const sortLabels: Record<SortKey, string> = {
  createdAt_desc: "Newest",
  createdAt_asc: "Oldest",
  dueDate_asc: "Due soon",
  earnings_desc: "High earn",
  earnings_asc: "Low earn"
};

const permissionKeys = [
  "Create and edit projects",
  "Upload media and assets",
  "Manage project stages",
  "Invite team members",
  "Manage app settings"
];

const defaultRolePermissions: Record<string, Record<string, boolean>> = {
  Owner: Object.fromEntries(permissionKeys.map((k) => [k, true])),
  Editor: Object.fromEntries(permissionKeys.map((k) => [k, ["Create and edit projects", "Upload media and assets"].includes(k)])),
  Reviewer: Object.fromEntries(permissionKeys.map((k) => [k, false])),
  Client: Object.fromEntries(permissionKeys.map((k) => [k, false]))
};

const emptyIntegrationConfig: IntegrationConfig = {
  connected: false,
  account: "",
  folder: "",
  channel: "",
  workspace: "",
  webhookUrl: "",
  connectedAt: "",
  lastSyncAt: ""
};

const integrationNames = ["Google Drive", "Dropbox", "Slack", "Frame.io"];

const defaultIntegrationConfigs: Record<string, IntegrationConfig> = Object.fromEntries(
  integrationNames.map((name) => [name, { ...emptyIntegrationConfig }])
);

const integrationDescriptions: Record<string, string> = {
  "Google Drive": "Sync project files and assets to a Google Drive folder.",
  Dropbox: "Store deliverables and raw footage in Dropbox.",
  Slack: "Send project notifications and updates to a Slack channel.",
  "Frame.io": "Connect video review and approval workflows."
};

const integrationIcons: Record<string, string> = {
  "Google Drive": "G",
  Dropbox: "D",
  Slack: "S",
  "Frame.io": "F"
};

const integrationColors: Record<string, string> = {
  "Google Drive": "#4285f4",
  Dropbox: "#0061ff",
  Slack: "#4a154b",
  "Frame.io": "#8b5cf6"
};

const navigationItems: Array<{ key: PageKey; href: string; label: string; icon: React.ReactNode }> = [
  { key: "dashboard", href: "/", label: "Dashboard", icon: <GridViewOutlinedIcon /> },
  { key: "projects", href: "/projects", label: "Projects", icon: <FolderOpenOutlinedIcon /> },
  { key: "clients", href: "/clients", label: "Clients", icon: <PeopleAltOutlinedIcon /> },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: <ViewTimelineOutlinedIcon /> },
  { key: "calendar", href: "/calendar", label: "Calendar", icon: <CalendarMonthOutlinedIcon /> },
  { key: "media", href: "/media", label: "Media", icon: <CollectionsOutlinedIcon /> },
  { key: "feedback", href: "/feedback", label: "Feedback", icon: <ChatBubbleOutlineOutlinedIcon /> },
  { key: "templates", href: "/templates", label: "Templates", icon: <InsertDriveFileOutlinedIcon /> },
  { key: "reports", href: "/reports", label: "Reports", icon: <InsertChartOutlinedIcon /> },
  { key: "team", href: "/team", label: "Team", icon: <PeopleAltOutlinedIcon /> },
  { key: "settings", href: "/settings", label: "Settings", icon: <SettingsOutlinedIcon /> }
];

const defaultSettings: SettingsState = {
  studioName: "CutLab Studio",
  profileName: "Your Profile",
  profileUsername: "editor",
  profileTitle: "Video Editor",
  profileBio: "Track active edits, delivery dates, feedback, and salary batches in one focused workspace.",
  profileLocation: "Local workspace",
  profileImageUrl: "",
  timeZone: "Asia/Dubai",
  dateFormat: "Month Day, Year",
  weekStart: "Mon",
  currencyCode: "INR",
  projectStages: ["Planned", "In Progress", "Client Review", "Delivered"],
  notifications: {
    "Project updates": false,
    "Feedback received": false,
    "Upcoming deadlines": false,
    Mentions: false,
    "Weekly summary": false
  },
  integrations: {
    "Google Drive": false,
    Dropbox: false,
    Slack: false,
    "Frame.io": false
  },
  integrationAccounts: {
    "Google Drive": "",
    Dropbox: "",
    Slack: "",
    "Frame.io": ""
  },
  integrationConfigs: JSON.parse(JSON.stringify(defaultIntegrationConfigs)),
  teamRole: "Editor",
  teamMembers: [],
  editorPermissions: {
    "Create and edit projects": false,
    "Upload media and assets": false,
    "Manage project stages": false,
    "Invite team members": false,
    "Manage app settings": false
  },
  rolePermissions: JSON.parse(JSON.stringify(defaultRolePermissions)),
  theme: "Light",
  accentColor: defaultAccent,
  density: "Comfortable"
};

const SettingsContext = createContext<SettingsState>(defaultSettings);

function useTrackerSettings() {
  return useContext(SettingsContext);
}

const emptyForm = (): WorkItem => ({
  id: "",
  profileId: profile.id,
  title: "",
  client: "",
  status: "Planned",
  workType: "Freelance",
  startDate: "",
  dueDate: "",
  earnings: 0,
  notes: ""
});

export function TrackerApp({ page }: { page: PageKey }) {
  const { items, setItems, settings, setSettings, isSignedIn, isAuthLoaded, toast, setToast, reconcileSalaryBatches } = useData();
  const { openSignIn, openSignUp } = useClerk();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WorkItem | null>(null);
  const [form, setForm] = useState<WorkItem>(emptyForm);
  const [formError, setFormError] = useState("");
  const [authChoiceOpen, setAuthChoiceOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">("All");
  const [kindFilter, setKindFilter] = useState<ProjectKind>("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [dueFilter, setDueFilter] = useState<DueFilter>("ALL");
  const [billingFilter, setBillingFilter] = useState<"ALL" | "Paid" | "Unpaid">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt_desc");

  useEffect(() => {
    reconcileSalaryBatches(items);
  }, [items, reconcileSalaryBatches]);

  useEffect(() => {
    applyRootThemeVariables(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined" || !isAuthLoaded) return;
    if (isSignedIn) {
      window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, "account");
      setAuthChoiceOpen(false);
      return;
    }

    const savedMode = window.localStorage.getItem(AUTH_MODE_STORAGE_KEY);
    setAuthChoiceOpen(!savedMode);
  }, [isAuthLoaded, isSignedIn]);

  const projects = useMemo(() => items.filter((item) => (item.profileId || DEFAULT_PROFILE_ID) === profile.id), [items]);
  const clientOptions = useMemo(() => ["ALL", ...Array.from(new Set(projects.map((item) => item.client?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))], [projects]);
  const filteredProjects = useMemo(() => {
    const searched = projects.filter((item) => {
      const haystack = `${item.title} ${item.client || ""} ${item.notes} ${item.workType}`.toLowerCase();
      const matchesSearch = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesKind = kindFilter === "ALL" || item.workType === kindFilter;
      const matchesClient = clientFilter === "ALL" || item.client?.trim() === clientFilter;
      const matchesDue = dueFilter === "ALL" || dueBucket(item) === dueFilter;
      const isPaid = isDoneStatus(item.status) && safeMoneyValue(item.earnings) > 0;
      const isUnpaid = !isPaid;
      const matchesBilling =
        billingFilter === "ALL" ||
        (billingFilter === "Paid" && isPaid) ||
        (billingFilter === "Unpaid" && isUnpaid);
      return matchesSearch && matchesStatus && matchesKind && matchesClient && matchesDue && matchesBilling;
    });

    return [...searched].sort((a, b) => {
      if (sortKey === "createdAt_asc") return createdTime(a) - createdTime(b);
      if (sortKey === "dueDate_asc") return dateTime(a.dueDate || "9999-12-31") - dateTime(b.dueDate || "9999-12-31");
      if (sortKey === "earnings_desc") return safeMoneyValue(b.earnings) - safeMoneyValue(a.earnings);
      if (sortKey === "earnings_asc") return safeMoneyValue(a.earnings) - safeMoneyValue(b.earnings);
      return createdTime(b) - createdTime(a);
    });
  }, [billingFilter, clientFilter, dueFilter, kindFilter, projects, query, sortKey, statusFilter]);

  const stats = useMemo(() => {
    const earned = projects.filter((item) => isDoneStatus(item.status)).reduce((total, item) => total + safeMoneyValue(item.earnings), 0);
    const unpaid = projects.filter((item) => !isDoneStatus(item.status) && safeMoneyValue(item.earnings) > 0).length;
    const active = projects.filter((item) => !isDoneStatus(item.status)).length;
    const salaryEdits = projects.filter((item) => item.workType === "Job / Salary" && isDoneStatus(item.status)).length;
    const salaryBatches = Math.floor(salaryEdits / SALARY_BATCH_SIZE);
    const delivered = projects.filter((item) => isDoneStatus(item.status));
    const avgTurnaroundDays = delivered.length
      ? Math.round(delivered.reduce((total, item) => total + daysBetween(item.startDate, item.dueDate), 0) / delivered.length)
      : 0;
    return {
      total: projects.length,
      active,
      unpaid,
      earned: earned + salaryBatches * SALARY_BATCH_AMOUNT,
      salaryEdits,
      salaryBatchProgress: salaryEdits % SALARY_BATCH_SIZE,
      delivered: delivered.length,
      avgTurnaroundDays
    };
  }, [projects]);

  function openNewProject() {
    setEditingId("");
    setForm({ ...emptyForm(), notes: defaultProjectNotes(settings) });
    setFormError("");
    setDialogOpen(true);
  }

  function notify(message: string, tone: ToastState["tone"] = "success") {
    setToast({ message, tone });
  }

  function chooseLocalMode() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, "local");
    }
    setAuthChoiceOpen(false);
    notify("Using local mode on this device.", "info");
  }

  function launchAccountFlow(mode: "sign-up" | "sign-in") {
    setAuthChoiceOpen(false);
    if (mode === "sign-up") {
      openSignUp();
      return;
    }
    openSignIn();
  }

  function openTemplateProject(template: { title: string; workType: string; notes: string }) {
    setEditingId("");
    setForm({
      ...emptyForm(),
      title: template.title,
      workType: template.workType,
      startDate: iso(todayDate()),
      dueDate: iso(addDays(todayDate(), 7)),
      notes: [template.notes, defaultProjectNotes(settings)].filter(Boolean).join("\n\n")
    });
    setFormError("");
    setDialogOpen(true);
  }

  function openEditProject(item: WorkItem) {
    setEditingId(item.id);
    setForm(item);
    setFormError("");
    setDialogOpen(true);
  }

  function requestDeleteProject(id: string) {
    const target = items.find((item) => item.id === id);
    if (target) setDeleteTarget(target);
  }

  function confirmDeleteProject() {
    if (!deleteTarget) return;
    setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    notify("Project deleted.", "warning");
  }

  function saveProject() {
    const typeConfig = getTypeConfig(form.workType);
    const error = validateProject(form, typeConfig);
    if (error) {
      setFormError(error);
      return;
    }
    const payload: WorkItem = {
      ...form,
      id: editingId || createId(),
      createdAt: form.createdAt || new Date().toISOString(),
      profileId: profile.id,
      client: form.client?.trim() || "",
      earnings: typeConfig.earningsMode === "batch" ? 0 : safeMoneyValue(form.earnings)
    };
    setItems((current) => (editingId ? current.map((item) => (item.id === editingId ? payload : item)) : [payload, ...current]));
    setDialogOpen(false);
    setEditingId("");
    setForm(emptyForm());
    notify(editingId ? "Project updated." : "Project created.");
  }

  function handleAddClientProject(clientName: string, projectTitle: string, workType: string) {
    const payload: WorkItem = {
      id: createId(),
      profileId: profile.id,
      createdAt: new Date().toISOString(),
      title: projectTitle.trim() || "Onboarding & Planning",
      client: clientName.trim(),
      status: "Planned",
      workType: workType,
      startDate: iso(todayDate()),
      dueDate: iso(todayDate()),
      earnings: 0,
      notes: "Auto-generated project for new client onboarding."
    };
    setItems((current) => [payload, ...current]);
    notify(`Client "${clientName}" added.`);
  }

  const pageContent = page === "dashboard" ? (
    <DashboardPage
      stats={stats}
      projects={filteredProjects}
      query={query}
      setQuery={setQuery}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      kindFilter={kindFilter}
      setKindFilter={setKindFilter}
      clientFilter={clientFilter}
      setClientFilter={setClientFilter}
      clientOptions={clientOptions}
      dueFilter={dueFilter}
      setDueFilter={setDueFilter}
      billingFilter={billingFilter}
      setBillingFilter={setBillingFilter}
      sortKey={sortKey}
      setSortKey={setSortKey}
      onNewProject={openNewProject}
      onEditProject={openEditProject}
      onDeleteProject={requestDeleteProject}
    />
  ) : page === "projects" ? (
    <ProjectDirectoryPage projects={projects} onNewProject={openNewProject} onEditProject={openEditProject} onDeleteProject={requestDeleteProject} />
  ) : page === "clients" ? (
    <ClientsDesignPage projects={projects} onNewProject={openNewProject} onAddClientProject={handleAddClientProject} />
  ) : page === "timeline" ? (
    <TimelineDesignPage projects={projects} />
  ) : page === "calendar" ? (
    <CalendarDesignPage projects={projects} settings={settings} />
  ) : page === "media" ? (
    <MediaDesignPage projects={projects} />
  ) : page === "feedback" ? (
    <FeedbackDesignPage projects={projects} />
  ) : page === "templates" ? (
    <TemplatesDesignPage onUseTemplate={openTemplateProject} />
  ) : page === "reports" ? (
    <ReportsDesignPage projects={projects} stats={stats} />
  ) : page === "team" ? (
    <TeamDesignPage projects={projects} settings={settings} setSettings={setSettings} />
  ) : page === "settings" ? (
    <SettingsDesignPage settings={settings} setSettings={setSettings} onNewProject={openNewProject} notify={notify} />
  ) : page === "profile" ? (
    <ProfileDesignPage projects={projects} stats={stats} settings={settings} />
  ) : page === "profile-edit" ? (
    <ProfileEditPage settings={settings} setSettings={setSettings} />
  ) : (
    <OrganizationProfilePage projects={projects} settings={settings} stats={stats} />
  );

  const projectDialog = (
    <ProjectDialog
      open={dialogOpen}
      editing={Boolean(editingId)}
      form={form}
      setForm={setForm}
      formError={formError}
      onClose={() => setDialogOpen(false)}
      onSave={saveProject}
    />
  );
  const deleteDialog = (
    <DeleteProjectDialog
      project={deleteTarget}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDeleteProject}
    />
  );

  if (page === "profile") {
    return (
      <Box sx={{ ...appSurfaceSx(settings), minHeight: "100dvh", bgcolor: canvas, color: ink }}>
      <SettingsContext.Provider value={settings}>{pageContent}</SettingsContext.Provider>
      {projectDialog}
      {deleteDialog}
      <WelcomeChoiceDialog
        open={authChoiceOpen}
        onChooseLocal={chooseLocalMode}
        onCreateAccount={() => launchAccountFlow("sign-up")}
        onSignIn={() => launchAccountFlow("sign-in")}
      />
    </Box>
  );
}

  return (
    <Box sx={{ ...appSurfaceSx(settings), minHeight: "100dvh", bgcolor: canvas, color: ink, display: "flex" }}>
      <Sidebar page={page} settings={settings} />
      <MobileNav page={page} settings={settings} />
      <Box
        component="main"
        sx={{
          ml: { xs: 0, lg: `${sidebarWidth}px` },
          width: { xs: "100%", lg: `calc(100% - ${sidebarWidth}px)` },
          minHeight: "100dvh",
          pt: { xs: "88px", lg: 0 }
        }}
      >
        <SettingsContext.Provider value={settings}>{pageContent}</SettingsContext.Provider>
      </Box>
      <AppToast toast={toast} onClose={() => setToast(null)} />
      {projectDialog}
      {deleteDialog}
      <WelcomeChoiceDialog
        open={authChoiceOpen}
        onChooseLocal={chooseLocalMode}
        onCreateAccount={() => launchAccountFlow("sign-up")}
        onSignIn={() => launchAccountFlow("sign-in")}
      />
    </Box>
  );
}

function Sidebar({ page, settings }: { page: PageKey; settings: SettingsState }) {
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);
  const { isAuthEnabled } = useData();

  return (
    <Box sx={{ display: { xs: "none", lg: "block" }, position: "fixed", inset: "0 auto 0 0", width: sidebarWidth, bgcolor: panel, borderRight: `1px solid ${border}`, px: 2.5, py: 3 }}>
      <Stack direction="row" alignItems="center" gap={1.2} sx={{ mb: 0.6 }}>
        <Box sx={{ width: 34, height: 34, border: `2px solid ${ink}`, display: "grid", placeItems: "center", borderRadius: "4px" }}>
          <MovieCreationOutlinedIcon sx={{ fontSize: 20, color: ink }} />
        </Box>
        <Typography noWrap sx={{ fontSize: 24, color: ink, fontWeight: 760, lineHeight: 1, fontFamily: headingFont }}>{settings.studioName}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: 0.6, mb: 5 }}>Video editing tracker</Typography>
      <Stack gap="8px">
        {navigationItems.map((item) => (
          <NavButton key={item.key} active={page === item.key} href={item.href} icon={item.icon}>{item.label}</NavButton>
        ))}
      </Stack>
      <Box sx={{ position: "absolute", left: 24, right: 24, bottom: 28, pt: 2, borderTop: `1px solid ${border}` }}>
        <Button
          fullWidth
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen ? "true" : undefined}
          onClick={(event) => setProfileMenuAnchor(event.currentTarget)}
          sx={{
            justifyContent: "space-between",
            p: 0.75,
            borderRadius: "8px",
            color: ink,
            textAlign: "left",
            "&:hover": { bgcolor: hoverBg }
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.1} sx={{ minWidth: 0 }}>
            <ProfileAvatar settings={settings} size={34} fontSize={12} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{profileDisplayName(settings)}</Typography>
              <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.2 }}>{displayUsername(settings) || settings.teamRole}</Typography>
            </Box>
          </Stack>
          <ExpandMoreIcon sx={{ color: muted, fontSize: 18, flexShrink: 0 }} />
        </Button>
        <Menu
          anchorEl={profileMenuAnchor}
          open={profileMenuOpen}
          onClose={() => setProfileMenuAnchor(null)}
          PaperProps={{ sx: { minWidth: 238, bgcolor: panel, color: ink, border: `1px solid ${border}`, boxShadow: "none" } }}
        >
          <MenuItem component={Link} href="/profile" selected={page === "profile"} onClick={() => setProfileMenuAnchor(null)} sx={{ gap: 1.2, color: ink }}>
            <PersonOutlineOutlinedIcon sx={{ color: accent, fontSize: 19 }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 760 }}>Public profile</Typography>
              <Typography sx={{ color: muted, fontSize: 12 }}>What clients can review</Typography>
            </Box>
          </MenuItem>
          <MenuItem component={Link} href="/organization" selected={page === "organization-profile"} onClick={() => setProfileMenuAnchor(null)} sx={{ gap: 1.2, color: ink }}>
            <PeopleAltOutlinedIcon sx={{ color: accent, fontSize: 19 }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 760 }}>Organization profile</Typography>
              <Typography sx={{ color: muted, fontSize: 12 }}>{settings.studioName}</Typography>
            </Box>
          </MenuItem>
          <MenuItem component={Link} href="/profile/edit" selected={page === "profile-edit"} onClick={() => setProfileMenuAnchor(null)} sx={{ gap: 1.2, color: ink }}>
            <EditOutlinedIcon sx={{ color: accent, fontSize: 19 }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 760 }}>Edit Profile</Typography>
              <Typography sx={{ color: muted, fontSize: 12 }}>Customize your public profile</Typography>
            </Box>
          </MenuItem>
          <Divider sx={{ borderColor: border, my: 0.5 }} />
          {isAuthEnabled ? (
            <CloudProfileActions onClose={() => setProfileMenuAnchor(null)} />
          ) : (
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography sx={{ color: muted, fontSize: 12, lineHeight: 1.45 }}>Local mode is active. Add Clerk and Convex environment variables to enable account sync.</Typography>
            </Box>
          )}
        </Menu>
      </Box>
    </Box>
  );
}

function CloudProfileActions({ onClose }: { onClose: () => void }) {
  const { isSignedIn } = useUser();
  const { openSignIn, openSignUp, signOut } = useClerk();

  if (isSignedIn) {
    return (
      <MenuItem
        onClick={() => {
          onClose();
          signOut();
        }}
        sx={{ gap: 1.2, color: ink }}
      >
        <Button fullWidth variant="outlined" sx={{ borderColor: border, color: "#bd3f37", fontSize: 13, fontWeight: 720 }}>
          Sign Out
        </Button>
      </MenuItem>
    );
  }

  return (
    <Stack sx={{ px: 1, py: 0.75, gap: 0.8 }}>
      <Button
        fullWidth
        variant="contained"
        onClick={() => {
          onClose();
          openSignUp();
        }}
        sx={{ bgcolor: accent, color: "#fff", fontSize: 13, fontWeight: 720, "&:hover": { bgcolor: accent } }}
      >
        Create Account
      </Button>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          onClose();
          openSignIn();
        }}
        sx={{ borderColor: border, color: accent, fontSize: 13, fontWeight: 720 }}
      >
        Sign In
      </Button>
    </Stack>
  );
}

function MobileNav({ page, settings }: { page: PageKey; settings: SettingsState }) {
  return (
    <Box sx={{ display: { xs: "block", lg: "none" }, position: "fixed", zIndex: 20, top: 0, left: 0, right: 0, bgcolor: panel, borderBottom: `1px solid ${border}` }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.4 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Box sx={{ width: 30, height: 30, border: `2px solid ${ink}`, display: "grid", placeItems: "center", borderRadius: "4px" }}>
            <MovieCreationOutlinedIcon sx={{ fontSize: 18, color: ink }} />
          </Box>
          <Typography noWrap sx={{ fontSize: 22, color: ink, fontWeight: 760, lineHeight: 1, fontFamily: headingFont, maxWidth: 180 }}>{settings.studioName}</Typography>
        </Stack>
        <NotificationsNoneOutlinedIcon sx={{ color: ink }} />
      </Stack>
      <Box sx={{ px: 1.5, pb: 1.2, overflowX: "auto", scrollbarWidth: "none" }}>
        <Stack direction="row" gap={0.7} sx={{ width: "max-content" }}>
          {navigationItems.map((item) => (
            <Button
              key={item.key}
              component={Link}
              href={item.href}
              startIcon={item.icon}
              sx={{
                height: 34,
                px: 1.2,
                flexShrink: 0,
                borderRadius: "6px",
                color: page === item.key ? accent : muted,
                bgcolor: page === item.key ? activeBg : "transparent",
                fontSize: 12,
                fontWeight: page === item.key ? 760 : 650,
                "& .MuiButton-startIcon": { mr: 0.7 },
                "& .MuiButton-startIcon svg": { fontSize: 17 }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function AppToast({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  if (!toast) return null;
  const palette = toast.tone === "warning"
    ? { bg: "var(--app-warning-bg, #fff4dc)", fg: "#b27616", border }
    : toast.tone === "info"
      ? { bg: activeBg, fg: accent, border }
      : { bg: "var(--app-success-bg, #e9f5e9)", fg: "#3c8c4b", border };

  return (
    <Paper
      role="status"
      sx={{
        position: "fixed",
        right: { xs: 16, md: 24 },
        bottom: { xs: 16, md: 24 },
        zIndex: 50,
        px: 1.5,
        py: 1.1,
        bgcolor: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        maxWidth: 360
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 720 }}>{toast.message}</Typography>
      <Button size="small" aria-label="Dismiss notification" onClick={onClose} sx={{ minWidth: 28, width: 28, height: 28, color: palette.fg, p: 0 }}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </Button>
    </Paper>
  );
}

function NavButton({ active, href, icon, children }: { active: boolean; href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Button
      fullWidth
      component={Link}
      href={href}
      startIcon={icon}
      sx={{
        justifyContent: "flex-start",
        height: 42,
        px: 1.5,
        borderRadius: "6px",
        color: active ? accent : muted,
        bgcolor: active ? activeBg : "transparent",
        fontSize: 14,
        fontWeight: active ? 760 : 600,
        "& .MuiButton-startIcon svg": { fontSize: 19 },
        "&:hover": { bgcolor: hoverBg }
      }}
    >
      {children}
    </Button>
  );
}

function WelcomeChoiceDialog({
  open,
  onChooseLocal,
  onCreateAccount,
  onSignIn
}: {
  open: boolean;
  onChooseLocal: () => void;
  onCreateAccount: () => void;
  onSignIn: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => {}}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown
      PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "10px" } }}
    >
      <DialogTitle sx={{ fontSize: 28, fontWeight: 760, pb: 1 }}>Choose how to start</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography sx={{ color: muted, fontSize: 14 }}>
            Use CutLab locally on this device, or create an account to sync your data. Account setup currently supports username plus email or GitHub.
          </Typography>
          <Paper sx={{ ...panelSx, p: 2 }}>
            <Typography sx={{ color: ink, fontSize: 18, fontWeight: 760 }}>Continue without account</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.7 }}>
              Keep everything in this browser only. Good for personal use on one device.
            </Typography>
            <Button variant="outlined" onClick={onChooseLocal} sx={{ ...outlineButtonSx, mt: 2 }}>
              Use Locally
            </Button>
          </Paper>
          <Paper sx={{ ...panelSx, p: 2 }}>
            <Typography sx={{ color: ink, fontSize: 18, fontWeight: 760 }}>Create or use an account</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.7 }}>
              Sign up with username and email or continue with GitHub. GitHub sign-in will import your GitHub avatar and username into your profile defaults.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={onCreateAccount} sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: accent } }}>
                Create Account
              </Button>
              <Button variant="outlined" onClick={onSignIn} sx={outlineButtonSx}>
                Sign In
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function DashboardPage(props: {
  stats: { total: number; active: number; unpaid: number; earned: number; salaryEdits: number; salaryBatchProgress: number };
  projects: WorkItem[];
  query: string;
  setQuery: (value: string) => void;
  statusFilter: ProjectStatus | "All";
  setStatusFilter: (value: ProjectStatus | "All") => void;
  kindFilter: ProjectKind;
  setKindFilter: (value: ProjectKind) => void;
  clientFilter: string;
  setClientFilter: (value: string) => void;
  clientOptions: string[];
  dueFilter: DueFilter;
  setDueFilter: (value: DueFilter) => void;
  billingFilter: "ALL" | "Paid" | "Unpaid";
  setBillingFilter: (value: "ALL" | "Paid" | "Unpaid") => void;
  sortKey: SortKey;
  setSortKey: (value: SortKey) => void;
  onNewProject: () => void;
  onEditProject: (item: WorkItem) => void;
  onDeleteProject: (id: string) => void;
}) {
  const settings = useTrackerSettings();

  function clearFilters() {
    props.setQuery("");
    props.setStatusFilter("All");
    props.setKindFilter("ALL");
    props.setClientFilter("ALL");
    props.setDueFilter("ALL");
    props.setBillingFilter("ALL");
    props.setSortKey("createdAt_desc");
  }

  return (
    <Box sx={{ px: { xs: 2, md: 5, xl: 6 }, pt: 4, pb: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 36, color: ink, fontWeight: 760, lineHeight: 1.05, fontFamily: headingFont }}>Dashboard</Typography>
          <Typography sx={{ fontSize: 15, color: muted, mt: 1 }}>Overview of your editing pipeline and salary edit progress.</Typography>
        </Box>
        <Stack direction="row" alignItems="center" justifyContent={{ xs: "space-between", sm: "flex-end" }} gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={props.onNewProject}
            sx={{
              borderColor: border,
              color: accent,
              bgcolor: panel,
              height: 44,
              px: 2,
              borderRadius: "6px",
              fontSize: 14,
              fontWeight: 720,
              whiteSpace: "nowrap",
              "&:hover": { borderColor: accent, bgcolor: hoverBg }
            }}
          >
            New Project
          </Button>
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", color: ink }}>
            <NotificationsNoneOutlinedIcon />
          </Box>
        </Stack>
      </Stack>

      <Paper sx={{ bgcolor: panel, border: `1px solid ${border}`, borderRadius: "6px", p: 2, mb: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(240px, 1.15fr) repeat(6, minmax(130px, 1fr)) auto"
            },
            gap: 2,
            alignItems: "end"
          }}
        >
          <LabeledControl label="Search">
            <TextField
              value={props.query}
              onChange={(event) => props.setQuery(event.target.value)}
              placeholder="Search projects..."
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: muted, fontSize: 19, mr: 1 }} />
              }}
              sx={{
                minWidth: 0,
                "& .MuiOutlinedInput-root": { height: 42, bgcolor: panel, borderRadius: "5px", fontSize: 14 }
              }}
            />
          </LabeledControl>
          <LabeledControl label="Project status">
            <CompactSelect value={props.statusFilter} options={["All", ...statusOptions]} onChange={(value) => props.setStatusFilter(value as ProjectStatus | "All")} width="100%" />
          </LabeledControl>
          <LabeledControl label="Editor">
            <CompactSelect value={props.kindFilter} options={kindOptions} labels={{ ALL: "All Editors", "Job / Salary": "Salary Queue", Freelance: "Freelance", "Personal Channel": "Channel" }} onChange={(value) => props.setKindFilter(value as ProjectKind)} width="100%" />
          </LabeledControl>
          <LabeledControl label="Client">
            <CompactSelect value={props.clientFilter} options={props.clientOptions} labels={{ ALL: "All Clients" }} onChange={props.setClientFilter} width="100%" />
          </LabeledControl>
          <LabeledControl label="Due date">
            <CompactSelect value={props.dueFilter} options={dueOptions} labels={{ ALL: "Any Date" }} onChange={(value) => props.setDueFilter(value as DueFilter)} width="100%" />
          </LabeledControl>
          <LabeledControl label="Payment">
            <CompactSelect value={props.billingFilter} options={billingOptions} labels={{ ALL: "All Payments", Paid: "Collected", Unpaid: "Needs Action" }} onChange={(value) => props.setBillingFilter(value as "ALL" | "Paid" | "Unpaid")} width="100%" />
          </LabeledControl>
          <LabeledControl label="Sort">
            <CompactSelect value={props.sortKey} options={sortOptions} labels={sortLabels} onChange={(value) => props.setSortKey(value as SortKey)} width="100%" />
          </LabeledControl>
          <Button size="small" onClick={clearFilters} sx={{ color: muted, height: 42, whiteSpace: "nowrap" }}>
            Clear Filters
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" }, gap: 1.5, mb: 2.5 }}>
        <StatCard label="Active Projects" value={String(props.stats.active)} helper={`${props.stats.total} projects stored`} tone="purple" icon={<PlayArrowRoundedIcon />} />
        <StatCard label="Deadlines This Week" value={String(props.projects.filter((project) => dueBucket(project) === "This Week").length)} helper={`${props.projects.filter((project) => dueBucket(project) === "Overdue").length} overdue`} icon={<CalendarMonthOutlinedIcon />} />
        <StatCard label="Awaiting Feedback" value={String(props.projects.filter((project) => project.status === "In Progress").length)} helper="Active review queue" icon={<ChatBubbleOutlineOutlinedIcon />} />
        <StatCard label="Salary Edits Done" value={String(props.stats.salaryEdits)} helper={`${props.stats.salaryBatchProgress}/${SALARY_BATCH_SIZE} toward next batch`} progress={(props.stats.salaryBatchProgress / SALARY_BATCH_SIZE) * 100} icon={<FileDownloadOutlinedIcon />} />
        <StatCard label="Collected" value={money(props.stats.earned, settings.currencyCode)} helper="Freelance plus salary batches" icon={<AccessTimeOutlinedIcon />} />
      </Box>

      <Box sx={{ width: "100%" }}>
        {props.projects.length ? (
          <Paper sx={{ bgcolor: panel, border: `1px solid ${border}`, borderRadius: "6px", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 2 }}>
              <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Projects</Typography>
              <Typography sx={{ color: muted, fontSize: 13 }}>{props.projects.length} shown</Typography>
            </Stack>
            <ProjectTableHeader />
            <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
              {props.projects.map((project) => (
                <ProjectRow key={project.id} project={project} onEdit={() => props.onEditProject(project)} onDelete={() => props.onDeleteProject(project.id)} />
              ))}
            </Stack>
          </Paper>
        ) : (
          <Typography sx={{ color: muted, fontSize: 14 }}>No projects found. Add a project or clear filters.</Typography>
        )}
      </Box>
    </Box>
  );
}

function ProjectDirectoryPage({ projects, onNewProject, onEditProject, onDeleteProject }: { projects: WorkItem[]; onNewProject: () => void; onEditProject: (item: WorkItem) => void; onDeleteProject: (id: string) => void }) {
  return (
    <PageFrame
      title="Projects"
      subtitle="A focused index for every tracked edit, handoff, and salary batch item."
      action={<Button variant="outlined" startIcon={<AddIcon />} onClick={onNewProject} sx={outlineButtonSx}>New Project</Button>}
    >
      <Paper sx={panelSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 2 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Project Library</Typography>
          <Typography sx={{ color: muted, fontSize: 13 }}>{projects.length} records</Typography>
        </Stack>
        <ProjectTableHeader />
        <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
          {projects.length ? projects.map((project) => (
            <ProjectRow key={project.id} project={project} onEdit={() => onEditProject(project)} onDelete={() => onDeleteProject(project.id)} />
          )) : (
            <Typography sx={{ color: muted, fontSize: 14, p: 2 }}>No projects saved yet.</Typography>
          )}
        </Stack>
      </Paper>
    </PageFrame>
  );
}

function ClientsDesignPage({
  projects,
  onNewProject,
  onAddClientProject
}: {
  projects: WorkItem[];
  onNewProject: () => void;
  onAddClientProject?: (clientName: string, projectTitle: string, workType: string) => void;
}) {
  const settings = useTrackerSettings();
  const clients = buildClientSummaries(projects);
  const [clientQuery, setClientQuery] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [clientWorkFilter, setClientWorkFilter] = useState<ProjectKind>("ALL");
  const [clientFeedbackFilter, setClientFeedbackFilter] = useState<"ALL" | "Awaiting" | "Approved">("ALL");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [selectedClientTab, setSelectedClientTab] = useState("Overview");

  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientProject, setNewClientProject] = useState("Onboarding & Planning");
  const [newClientWorkType, setNewClientWorkType] = useState("Freelance");
  const [addClientError, setAddClientError] = useState("");

  const filteredClients = clients.filter((client) => {
    const clientProjects = projects.filter((project) => project.client?.trim() === client.name);
    const searchText = `${client.name} ${client.latestProject} ${clientProjects.map((project) => `${project.title} ${project.notes} ${project.workType}`).join(" ")}`.toLowerCase();
    const query = clientQuery.trim().toLowerCase();
    const feedback = clientFeedbackStatus(clientProjects);
    const matchesSearch = !query || searchText.includes(query);
    const matchesStatus =
      clientStatusFilter === "ALL" ||
      (clientStatusFilter === "Active" && client.activeCount > 0) ||
      (clientStatusFilter === "Inactive" && client.activeCount === 0);
    const matchesWork = clientWorkFilter === "ALL" || clientProjects.some((project) => project.workType === clientWorkFilter);
    const matchesFeedback = clientFeedbackFilter === "ALL" || feedback === clientFeedbackFilter;
    return matchesSearch && matchesStatus && matchesWork && matchesFeedback;
  });

  const selectedClient = filteredClients.find((client) => client.name === selectedClientName) ?? filteredClients[0] ?? clients[0];
  const selectedProjects = selectedClient ? projects.filter((project) => project.client?.trim() === selectedClient.name) : [];
  const activeProjects = projects.filter((project) => !isDoneStatus(project.status)).length;
  const deliveredProjects = projects.length - activeProjects;
  const selectedFeedbackStatus = selectedProjects.length ? clientFeedbackStatus(selectedProjects) : "Approved";
  const pendingRevisions = selectedProjects.filter((project) => project.status === "In Progress" || project.status === "Planned");

  function handleSaveClient() {
    if (!newClientName.trim()) {
      setAddClientError("Client name is required.");
      return;
    }
    if (projects.some((p) => p.client?.trim().toLowerCase() === newClientName.trim().toLowerCase())) {
      setAddClientError("A client with this name already exists.");
      return;
    }
    if (onAddClientProject) {
      onAddClientProject(newClientName, newClientProject, newClientWorkType);
    }
    setNewClientName("");
    setNewClientProject("Onboarding & Planning");
    setNewClientWorkType("Freelance");
    setAddClientError("");
    setAddClientOpen(false);
    setSelectedClientName(newClientName.trim());
  }

  function clearClientFilters() {
    setClientQuery("");
    setClientStatusFilter("ALL");
    setClientWorkFilter("ALL");
    setClientFeedbackFilter("ALL");
  }

  return (
    <PageFrame
      title="Clients"
      subtitle="Manage client relationships from the client names attached to projects."
      action={
        <Stack direction="row" spacing={1.2}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddClientOpen(true)} sx={outlineButtonSx}>Add Client</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onNewProject} sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: "#4e348d" } }}>New Project</Button>
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Tracked Projects" value={String(projects.length)} helper="Real local project records" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Clients" value={String(clients.length)} helper="Named clients from projects" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Delivered" value={String(deliveredProjects)} helper="Completed projects in storage" /></Grid>
      </Grid>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 390px" }, gap: 2 }}>
        <Paper sx={panelSx}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "end" }} gap={1.2} sx={{ px: 2, py: 2 }}>
            <TextField
              value={clientQuery}
              onChange={(event) => setClientQuery(event.target.value)}
              placeholder="Search clients or projects..."
              size="small"
              InputProps={{ startAdornment: <SearchIcon sx={{ color: muted, fontSize: 18, mr: 1 }} /> }}
              sx={{ width: { xs: "100%", md: 300 }, "& .MuiInputBase-root": { height: 42, borderRadius: "6px", bgcolor: panel } }}
            />
            <CompactSelect value={clientStatusFilter} options={["ALL", "Active", "Inactive"]} labels={{ ALL: "All Clients" }} onChange={(value) => setClientStatusFilter(value as "ALL" | "Active" | "Inactive")} width={{ xs: "100%", md: 150 }} />
            <CompactSelect value={clientWorkFilter} options={kindOptions} labels={{ ALL: "All Work" }} onChange={(value) => setClientWorkFilter(value as ProjectKind)} width={{ xs: "100%", md: 150 }} />
            <CompactSelect value={clientFeedbackFilter} options={["ALL", "Awaiting", "Approved"]} labels={{ ALL: "Any Feedback" }} onChange={(value) => setClientFeedbackFilter(value as "ALL" | "Awaiting" | "Approved")} width={{ xs: "100%", md: 150 }} />
            <Button size="small" onClick={clearClientFilters} sx={{ color: muted, height: 42, px: 1.2, whiteSpace: "nowrap" }}>Clear Filters</Button>
            <Typography sx={{ color: muted, fontSize: 13, ml: { md: "auto" }, whiteSpace: "nowrap" }}>{filteredClients.length} shown</Typography>
          </Stack>
          <Box sx={{ display: { xs: "none", lg: "grid" }, gridTemplateColumns: "1.35fr 1fr 110px 110px 130px 120px minmax(120px, 0.9fr) 34px", gap: 2, px: 2, py: 1.1, bgcolor: headerPanel, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
            {["Client", "Contact", "Projects", "Status", "Next Delivery", "Feedback", "Notes", ""].map((heading) => <Typography key={heading || "actions"} sx={tableHeadingSx}>{heading}</Typography>)}
          </Box>
          <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
            {filteredClients.length ? filteredClients.map((client, index) => {
              const clientProjects = projects.filter((project) => project.client?.trim() === client.name);
              const feedback = clientFeedbackStatus(clientProjects);
              return (
                <Box
                  key={client.name}
                  component="button"
                  type="button"
                  aria-label={`Open ${client.name} client details`}
                  onClick={() => setSelectedClientName(client.name)}
                  sx={{
                    width: "100%",
                    border: 0,
                    font: "inherit",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.35fr 1fr 110px 110px 130px 120px minmax(120px, 0.9fr) 34px" },
                    gap: { xs: 1, lg: 2 },
                    alignItems: "center",
                    px: 2,
                    py: 1.45,
                    cursor: "pointer",
                    bgcolor: selectedClient?.name === client.name ? activeBg : panel,
                    color: "inherit",
                    "&:hover": { bgcolor: hoverBg }
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.3} sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", color: index % 2 ? ink : "#fff", bgcolor: ["#111111", "#f3dfc1", "#e8edf9", "#e9efe4"][index % 4], border: `1px solid ${border}`, fontSize: 14, fontWeight: 760 }}>{initials(client.name)}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{client.name}</Typography>
                      <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{client.latestProject || "No project notes"}</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ minWidth: 0, display: { xs: "none", lg: "block" } }}>
                    <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 700 }}>{client.name}</Typography>
                    <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.35 }}>Project client</Typography>
                  </Box>
                  <Typography sx={{ display: { xs: "none", lg: "block" }, color: ink, fontSize: 18, fontWeight: 660 }}>{client.projectCount}<Box component="span" sx={{ display: "block", color: muted, fontSize: 12, fontWeight: 500 }}>{client.projectCount === 1 ? "project" : "projects"}</Box></Typography>
                  <Stack direction="row" alignItems="center" gap={0.7} sx={{ display: { xs: "none", lg: "flex" } }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: client.activeCount ? "#43a85b" : "#9ba0aa" }} />
                    <Typography sx={{ color: ink, fontSize: 13 }}>{client.activeCount ? "Active" : "Inactive"}</Typography>
                  </Stack>
                  <Typography sx={{ display: { xs: "none", lg: "block" }, color: muted, fontSize: 13 }}>{client.nextDue ? formatDate(client.nextDue, settings.dateFormat) : "-"}</Typography>
                  <Stack direction="row" alignItems="center" gap={0.7} sx={{ display: { xs: "none", lg: "flex" }, color: feedback === "Approved" ? "#3c8c4b" : "#6f6a78" }}>
                    {feedback === "Approved" ? <CheckCircleOutlineIcon sx={{ fontSize: 17 }} /> : <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 17 }} />}
                    <Typography sx={{ color: ink, fontSize: 13 }}>{feedback}</Typography>
                  </Stack>
                  <Typography noWrap sx={{ display: { xs: "none", lg: "block" }, color: muted, fontSize: 13 }}>{clientProjects[0]?.notes || client.latestProject || "No notes"}</Typography>
                  <MoreHorizIcon sx={{ display: { xs: "none", lg: "block" }, color: muted, fontSize: 19 }} />
                  <Stack direction="row" gap={1} sx={{ display: { xs: "flex", lg: "none" }, flexWrap: "wrap" }}>
                    <StatusChip status={client.activeCount ? "In Progress" : "Delivered"} />
                    <Chip label={`${client.projectCount} ${client.projectCount === 1 ? "project" : "projects"}`} size="small" sx={{ bgcolor: softPanel, border: `1px solid ${border}`, borderRadius: "5px" }} />
                    <Chip label={feedback} size="small" sx={{ bgcolor: softPanel, border: `1px solid ${border}`, borderRadius: "5px" }} />
                  </Stack>
                </Box>
              );
            }) : clients.length ? (
              <EmptyPanel title="No clients match these filters" body="Clear filters or edit a project client name to change this list." />
            ) : (
              <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
                <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>No client names yet</Typography>
                <Typography sx={{ color: muted, fontSize: 13, mt: 1, maxWidth: 520, mx: "auto" }}>
                  Add a client name when creating or editing a project, and client records will appear here.
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
        <Paper sx={{ ...panelSx, p: 2 }}>
          {selectedClient ? (
            <>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
                <Stack direction="row" alignItems="center" gap={1.3} sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 54, height: 54, borderRadius: "50%", bgcolor: "#111", color: "#fff", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 760, flexShrink: 0 }}>{initials(selectedClient.name)}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>{selectedClient.name}</Typography>
                    <Typography noWrap sx={{ color: muted, fontSize: 13, mt: 0.35 }}>{selectedProjects[0]?.workType || "Video client"}</Typography>
                  </Box>
                </Stack>
                <Button aria-label="Close client details" onClick={() => setSelectedClientName("")} sx={{ minWidth: 30, width: 30, height: 30, color: muted, p: 0 }}>
                  <CloseIcon sx={{ fontSize: 19 }} />
                </Button>
              </Stack>
              <Stack gap={1.1} sx={{ mt: 2.3, pb: 2, borderBottom: `1px solid ${border}` }}>
                <ClientInfoRow icon={<MailOutlineIcon />} text="Email not saved" />
                <ClientInfoRow icon={<PublicOutlinedIcon />} text="Project-level client record" />
                <ClientInfoRow icon={<PlaceOutlinedIcon />} text="Stored locally in project data" />
              </Stack>
              <Stack direction="row" gap={1} sx={{ mt: 2, mb: 2, overflowX: "auto", scrollbarWidth: "none" }}>
                {["Overview", `Projects (${selectedProjects.length})`, "Files", "Activity"].map((tab) => (
                  <Button key={tab} size="small" onClick={() => setSelectedClientTab(tab)} sx={{ flexShrink: 0, color: selectedClientTab === tab ? accent : muted, borderBottom: selectedClientTab === tab ? `2px solid ${accent}` : "2px solid transparent", borderRadius: 0, px: 0.8, fontSize: 13, fontWeight: 720 }}>{tab}</Button>
                ))}
              </Stack>
              <Grid container spacing={1.2}>
                <Grid size={12}>
                  <Paper sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                      <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>Current Projects</Typography>
                      <Typography sx={{ color: accent, fontSize: 12, fontWeight: 720 }}>{selectedClient.activeCount} active</Typography>
                    </Stack>
                    <Stack gap={1.1}>
                      {selectedProjects.slice(0, 3).map((project) => (
                        <Box key={project.id}>
                          <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mb: 0.5 }}>
                            <Typography noWrap sx={{ color: ink, fontSize: 12, fontWeight: 700 }}>{project.title}</Typography>
                            <Typography sx={{ color: muted, fontSize: 12 }}>{projectProgress(project.status)}%</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6, xl: 12 }}>
                  <Paper sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel, minHeight: 146 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                      <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>Pending Revisions</Typography>
                      <Chip label={pendingRevisions.length} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px", height: 22 }} />
                    </Stack>
                    <Stack gap={1.1}>
                      {pendingRevisions.slice(0, 3).map((project) => (
                        <Box key={project.id} sx={{ pl: 1.2, borderLeft: `2px solid ${deadlineColor(project.status)}` }}>
                          <Typography noWrap sx={{ color: ink, fontSize: 12, fontWeight: 700 }}>{project.title}</Typography>
                          <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{project.notes || project.status}</Typography>
                        </Box>
                      ))}
                      {!pendingRevisions.length ? <Typography sx={{ color: muted, fontSize: 12 }}>No open revisions.</Typography> : null}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6, xl: 12 }}>
                  <Paper sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel, minHeight: 146 }}>
                    <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>Deliverables</Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid size={6}><MiniMetric label="Delivered" value={String(selectedProjects.filter((project) => isDoneStatus(project.status)).length)} /></Grid>
                      <Grid size={6}><MiniMetric label="Packages" value={String(selectedProjects.length)} /></Grid>
                      <Grid size={6}><MiniMetric label="Revisions" value={String(pendingRevisions.length)} /></Grid>
                      <Grid size={6}><MiniMetric label="Feedback" value={selectedFeedbackStatus} /></Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid size={12}>
                  <Paper sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                      <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>Relationship Notes</Typography>
                      <Button size="small" component={Link} href="/projects" sx={{ color: accent, minWidth: 0, px: 1 }}>View Projects</Button>
                    </Stack>
                    <Typography sx={{ color: muted, fontSize: 13, lineHeight: 1.55 }}>
                      {selectedClientTab === "Files"
                        ? `${selectedProjects.length} project package${selectedProjects.length === 1 ? "" : "s"} tracked from current project records.`
                        : selectedClientTab === "Activity"
                          ? `${selectedProjects.length} saved project${selectedProjects.length === 1 ? "" : "s"} for this client; ${pendingRevisions.length} still needs review or delivery.`
                          : selectedProjects.find((project) => project.notes)?.notes || "Project notes attached to this client will appear here."}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>No client selected</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 1 }}>Add a client name to a project to build this view.</Typography>
              </Box>
          )}
        </Paper>
      </Box>
      <Dialog open={addClientOpen} onClose={() => setAddClientOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
        <DialogTitle sx={{ fontSize: 22, fontWeight: 760 }}>Add New Client</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1.5 }}>
            <TextField label="Client Name" placeholder="e.g. Acme Corp" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} fullWidth />
            <TextField label="Initial Project Title" placeholder="e.g. Onboarding & Planning" value={newClientProject} onChange={(e) => setNewClientProject(e.target.value)} fullWidth />
            <DialogSelect label="Project Type" value={newClientWorkType} options={profile.typeOptions.map((t) => t.label)} onChange={setNewClientWorkType} />
            {addClientError ? <Typography sx={{ color: "#bc3d35", fontSize: 13 }}>{addClientError}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddClientOpen(false)} sx={{ color: muted }}>Cancel</Button>
          <Button onClick={handleSaveClient} variant="contained" sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: "#4e348d" } }}>Add Client</Button>
        </DialogActions>
      </Dialog>
    </PageFrame>
  );
}

function CalendarDesignPage({ projects, settings }: { projects: WorkItem[]; settings: SettingsState }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstProjectDate = projects.find((project) => project.dueDate)?.dueDate;
    const date = firstProjectDate ? new Date(`${firstProjectDate}T00:00:00`) : todayDate();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(iso(todayDate()));
  const monthDays = calendarMonthDays(visibleMonth, settings.weekStart);
  const weekdays = orderedWeekdays(settings.weekStart);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth);
  const selectedProjects = projects
    .filter((project) => project.dueDate === selectedDate)
    .sort((a, b) => a.title.localeCompare(b.title));
  const monthProjectCount = projects.filter((project) => {
    const due = new Date(`${project.dueDate}T00:00:00`);
    return due.getFullYear() === visibleMonth.getFullYear() && due.getMonth() === visibleMonth.getMonth();
  }).length;

  function shiftMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function jumpToToday() {
    const today = todayDate();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(iso(today));
  }

  return (
    <PageFrame
      title="Calendar"
      subtitle="A delivery-date calendar for planned, active, and delivered work."
      action={<Button variant="outlined" startIcon={<CalendarTodayOutlinedIcon />} onClick={jumpToToday} sx={outlineButtonSx}>Today</Button>}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 360px" }, gap: 2 }}>
        <Paper sx={panelSx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Button size="small" aria-label="Previous month" onClick={() => shiftMonth(-1)} sx={{ minWidth: 34, color: accent, border: `1px solid ${border}` }}>‹</Button>
              <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>{monthLabel}</Typography>
              <Button size="small" aria-label="Next month" onClick={() => shiftMonth(1)} sx={{ minWidth: 34, color: accent, border: `1px solid ${border}` }}>›</Button>
            </Stack>
            <Chip label={`${monthProjectCount} in month`} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px" }} />
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderTop: `1px solid ${border}`, borderLeft: `1px solid ${border}` }}>
            {weekdays.map((day) => (
              <Typography key={day} sx={{ px: 1, py: 1, color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase", borderRight: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>{day}</Typography>
            ))}
            {monthDays.map((day) => {
              const key = iso(day.date);
              const dayProjects = projects.filter((project) => project.dueDate === key);
              const isCurrentMonth = day.date.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate === key;
              return (
                <Box
                  key={key}
                  component="button"
                  type="button"
                  aria-label={`Select ${formatDate(key, settings.dateFormat)} with ${dayProjects.length} scheduled ${dayProjects.length === 1 ? "delivery" : "deliveries"}`}
                  onClick={() => setSelectedDate(key)}
                  sx={{
                    border: 0,
                    font: "inherit",
                    textAlign: "left",
                    minHeight: { xs: 92, md: 118 },
                    p: 1,
                    cursor: "pointer",
                    borderRight: `1px solid ${border}`,
                    borderBottom: `1px solid ${border}`,
                    bgcolor: isSelected ? activeBg : isCurrentMonth ? panel : softPanel,
                    color: "inherit",
                    opacity: isCurrentMonth ? 1 : 0.55,
                    "&:hover": { bgcolor: hoverBg }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: isSelected ? accent : ink, fontSize: 13, fontWeight: 760 }}>{day.date.getDate()}</Typography>
                    {dayProjects.length ? <Chip label={dayProjects.length} size="small" sx={{ height: 20, minWidth: 22, bgcolor: activeBg, color: accent, borderRadius: "5px", fontSize: 11 }} /> : null}
                  </Stack>
                  <Stack gap={0.5} sx={{ mt: 1 }}>
                    {dayProjects.slice(0, 2).map((project) => (
                      <Typography key={project.id} noWrap sx={{ px: 0.7, py: 0.35, borderRadius: "4px", bgcolor: statusBg(project.status), color: statusFg(project.status), fontSize: 11, fontWeight: 700 }}>
                        {project.title}
                      </Typography>
                    ))}
                    {dayProjects.length > 2 ? <Typography sx={{ color: muted, fontSize: 11 }}>+{dayProjects.length - 2} more</Typography> : null}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Paper>
        <Paper sx={{ ...panelSx, p: 2 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>{formatLongDate(selectedDate)}</Typography>
          <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>{selectedProjects.length} scheduled deliveries</Typography>
          <Stack gap={1.2} sx={{ mt: 2 }}>
            {selectedProjects.length ? selectedProjects.map((project) => (
              <Box key={project.id} sx={{ p: 1.4, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                  <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{project.title}</Typography>
                  <StatusChip status={project.status} />
                </Stack>
                <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.5 }}>{project.client || project.workType}</Typography>
                <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ mt: 1, height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
              </Box>
            )) : <EmptyPanel title="Nothing scheduled" body="Select a date with project deliveries or add a project due date." />}
          </Stack>
        </Paper>
      </Box>
    </PageFrame>
  );
}

function MediaDesignPage({ projects }: { projects: WorkItem[] }) {
  const active = projects.filter((project) => !isDoneStatus(project.status));
  const delivered = projects.filter((project) => isDoneStatus(project.status));
  const mediaGroups = [
    { label: "Project briefs", value: projects.length, helper: "One package per tracked project" },
    { label: "Active exports", value: active.length, helper: "Items still moving through edit or review" },
    { label: "Delivered archives", value: delivered.length, helper: "Completed work ready for handoff" }
  ];

  return (
    <PageFrame title="Media" subtitle="Organize project packages, exports, and handoff assets.">
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {mediaGroups.map((group) => (
          <Grid key={group.label} size={{ xs: 12, md: 4 }}><StatCard label={group.label} value={String(group.value)} helper={group.helper} /></Grid>
        ))}
      </Grid>
      <Paper sx={panelSx}>
        <Stack sx={{ px: 2, py: 2 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Media Packages</Typography>
          <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>Generated from current project records for briefs, exports, and handoff tracking.</Typography>
        </Stack>
        <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
          {projects.length ? projects.slice(0, 10).map((project, index) => (
            <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: { xs: "64px minmax(0, 1fr)", lg: "92px minmax(0, 1fr) 150px 160px 130px" }, gap: 2, alignItems: "center", px: 2, py: 1.5 }}>
              <Box sx={{ width: { xs: 54, lg: 78 }, height: { xs: 40, lg: 48 }, borderRadius: "6px", bgcolor: projectThumbColor(project.id || String(index)), border: `1px solid ${border}`, position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", left: 10, right: 10, bottom: 10, height: 3, borderRadius: 99, bgcolor: "rgba(91,63,160,0.28)" }} />
                <MovieCreationOutlinedIcon sx={{ position: "absolute", right: 9, top: 8, color: thumbIcon, fontSize: 22 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{project.title}</Typography>
                <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{project.notes || "No media notes yet"}</Typography>
              </Box>
              <Typography sx={{ display: { xs: "none", lg: "block" }, color: muted, fontSize: 13 }}>{project.workType}</Typography>
              <Box sx={{ display: { xs: "none", lg: "block" } }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ color: ink, fontSize: 12, fontWeight: 720 }}>Package progress</Typography>
                  <Typography sx={{ color: muted, fontSize: 12 }}>{projectProgress(project.status)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
              </Box>
              <StatusChip status={project.status} />
            </Box>
          )) : <EmptyPanel title="No media packages" body="Projects will appear here as package rows once added." />}
        </Stack>
      </Paper>
    </PageFrame>
  );
}

function FeedbackDesignPage({ projects }: { projects: WorkItem[] }) {
  const settings = useTrackerSettings();
  const feedbackItems = projects.filter((project) => project.status === "In Progress" || project.status === "Planned").slice(0, 8);

  return (
    <PageFrame title="Feedback" subtitle="Track review notes, revisions, and approval states.">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 360px" }, gap: 2 }}>
        <Paper sx={panelSx}>
          <Stack sx={{ px: 2, py: 2 }}>
            <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Review Queue</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>Active and planned projects that may need review attention.</Typography>
          </Stack>
          <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
            {feedbackItems.length ? feedbackItems.map((project) => (
              <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 160px 140px" }, gap: 2, px: 2, py: 1.6, alignItems: "center" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 15, fontWeight: 760 }}>{project.title}</Typography>
                  <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{project.client || project.notes || project.workType}</Typography>
                </Box>
                <Typography sx={{ color: muted, fontSize: 13 }}>{formatDate(project.dueDate, settings.dateFormat)}</Typography>
                <StatusChip status={project.status} />
              </Box>
            )) : <EmptyPanel title="No active feedback" body="In-progress and planned projects will appear here." />}
          </Stack>
        </Paper>
        <Paper sx={{ ...panelSx, p: 2 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Revision Summary</Typography>
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid size={6}><MiniMetric label="Awaiting" value={String(feedbackItems.length)} /></Grid>
            <Grid size={6}><MiniMetric label="Delivered" value={String(projects.filter((project) => isDoneStatus(project.status)).length)} /></Grid>
          </Grid>
          <Typography sx={{ color: muted, fontSize: 13, mt: 2 }}>Project notes serve as the review log for client comments and revision context.</Typography>
        </Paper>
      </Box>
    </PageFrame>
  );
}

function TemplatesDesignPage({ onUseTemplate }: { onUseTemplate: (template: { title: string; workType: string; notes: string }) => void }) {
  const settings = useTrackerSettings();
  const templates: { title: string; body: string; workType: string; notes: string }[] = [];

  return (
    <PageFrame title="Templates" subtitle="Reusable production structures for common editing work.">
      <Grid container spacing={settings.density === "Compact" ? 1 : 1.5}>
        {templates.map((template) => (
          <Grid key={template.title} size={{ xs: 12, md: 6, xl: 3 }}>
            <Paper sx={{ ...panelSx, p: 2.2, minHeight: 190, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box>
                <Box sx={{ width: 44, height: 44, borderRadius: "6px", border: `1px solid ${border}`, display: "grid", placeItems: "center", color: accent, mb: 2 }}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography sx={{ color: ink, fontSize: 18, fontWeight: 760 }}>{template.title}</Typography>
                <Typography sx={{ color: muted, fontSize: 13, mt: 1 }}>{template.body}</Typography>
              </Box>
              <Button onClick={() => onUseTemplate({ title: template.title, workType: template.workType, notes: template.notes })} sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${border}`, borderRadius: 0, px: 0, color: accent, justifyContent: "space-between", fontSize: 13, fontWeight: 720 }}>
                Use template
                <AddIcon sx={{ color: accent, fontSize: 18 }} />
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </PageFrame>
  );
}

function ReportsDesignPage({ projects, stats }: { projects: WorkItem[]; stats: { active: number; delivered: number; earned: number; salaryEdits: number } }) {
  const settings = useTrackerSettings();
  const deliveredRate = projects.length ? Math.round((stats.delivered / projects.length) * 100) : 0;

  return (
    <PageFrame title="Reports" subtitle="A compact view of production volume, delivery, and earnings.">
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Active" value={String(stats.active)} helper="Projects in motion" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Delivered" value={String(stats.delivered)} helper={`${deliveredRate}% completion rate`} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Salary Edits" value={String(stats.salaryEdits)} helper={`${SALARY_BATCH_SIZE} edits per batch`} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Collected" value={money(stats.earned, settings.currencyCode)} helper="Freelance plus salary batches" /></Grid>
      </Grid>
      <Paper sx={{ ...panelSx, p: 2 }}>
        <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Work Mix</Typography>
        <Stack gap={1.2} sx={{ mt: 2 }}>
          {kindOptions.filter((kind) => kind !== "ALL").map((kind) => {
            const count = projects.filter((project) => project.workType === kind).length;
            const percent = projects.length ? (count / projects.length) * 100 : 0;
            return (
              <Box key={kind}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
                  <Typography sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{kind}</Typography>
                  <Typography sx={{ color: muted, fontSize: 13 }}>{count}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={percent} sx={{ height: 7, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </PageFrame>
  );
}

function TeamDesignPage({ projects, settings, setSettings }: { projects: WorkItem[]; settings: SettingsState; setSettings: (settings: SettingsState) => void }) {
  const clients = buildClientSummaries(projects);
  const [memberForm, setMemberForm] = useState({ name: "", role: "Editor", email: "" });

  function addMember() {
    if (!memberForm.name.trim()) return;
    const member: TeamMember = {
      id: createId(),
      name: memberForm.name.trim(),
      role: memberForm.role.trim() || "Editor",
      email: memberForm.email.trim()
    };
    setSettings({ ...settings, teamMembers: [...settings.teamMembers, member] });
    setMemberForm({ name: "", role: "Editor", email: "" });
  }

  function updateMember(id: string, next: Partial<TeamMember>) {
    setSettings({ ...settings, teamMembers: settings.teamMembers.map((member) => (member.id === id ? { ...member, ...next } : member)) });
  }

  function removeMember(id: string) {
    setSettings({ ...settings, teamMembers: settings.teamMembers.filter((member) => member.id !== id) });
  }

  return (
    <PageFrame title="Team" subtitle="Studio people and ownership context for current work.">
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Team Members" value={String(settings.teamMembers.length)} helper="Editable local team members" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Client Contacts" value={String(clients.length)} helper="Generated from project client names" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Active Work" value={String(projects.filter((project) => !isDoneStatus(project.status)).length)} helper="Projects needing ownership" /></Grid>
      </Grid>
      <Paper sx={panelSx}>
        <Stack sx={{ px: 2, py: 2 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Team Members</Typography>
          <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>Add, edit, and remove the people who should appear in this local team list.</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 180px minmax(0, 1fr) 120px" }, gap: 1, mt: 2 }}>
            <TextField label="Name" value={memberForm.name} size="small" onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} />
            <DialogSelect label="Role" value={memberForm.role} options={teamRoleOptions} onChange={(value) => setMemberForm({ ...memberForm, role: value })} />
            <TextField label="Email" value={memberForm.email} size="small" onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addMember} sx={outlineButtonSx}>Add</Button>
          </Box>
        </Stack>
        <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
          {settings.teamMembers.length ? settings.teamMembers.map((member) => (
            <Box key={member.id} sx={{ py: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 180px minmax(0, 1fr) 92px" }, gap: 1, px: 2, py: 0.6, alignItems: "center" }}>
                <TextField value={member.name} size="small" onChange={(event) => updateMember(member.id, { name: event.target.value })} />
                <DialogSelect label="Role" value={member.role} options={teamRoleOptions} onChange={(value) => updateMember(member.id, { role: value })} />
                <TextField value={member.email} placeholder="email optional" size="small" onChange={(event) => updateMember(member.id, { email: event.target.value })} />
                <Button size="small" onClick={() => removeMember(member.id)} sx={{ color: "#bd3f37" }}>Remove</Button>
              </Box>
              <Box sx={{ px: 2.2, pb: 0.6, pt: 0.3 }}>
                <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ gap: 0.6, alignItems: "center" }}>
                  <Typography sx={{ fontSize: 11, color: muted, fontWeight: 700, mr: 0.5 }}>Active permissions:</Typography>
                  {(() => {
                    const rolePerms = settings.rolePermissions[member.role] || {};
                    const activePerms = Object.entries(rolePerms).filter(([_, enabled]) => enabled);
                    if (activePerms.length === 0) {
                      return <Chip label="No permissions" size="small" sx={{ height: 18, fontSize: 10, bgcolor: softPanel, color: muted, borderRadius: "4px" }} />;
                    }
                    return activePerms.map(([perm]) => (
                      <Chip key={perm} label={perm} size="small" sx={{ height: 18, fontSize: 10, bgcolor: activeBg, color: accent, borderRadius: "4px", fontWeight: 500 }} />
                    ));
                  })()}
                </Stack>
              </Box>
            </Box>
          )) : <EmptyPanel title="No team members yet" body="Add a person above to start building the team list." />}
        </Stack>
      </Paper>
    </PageFrame>
  );
}

function SettingsDesignPage({ settings, setSettings, onNewProject, notify }: { settings: SettingsState; setSettings: (settings: SettingsState) => void; onNewProject: () => void; notify: (message: string, tone?: ToastState["tone"]) => void }) {
  const stageColors = ["#6c4db3", "#7eadea", "#d39a27", "#9a75d1", "#6dab55", "#d65f59"];
  const [integrationDialog, setIntegrationDialog] = useState<{ name: string; config: IntegrationConfig } | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const [googleLoginOpen, setGoogleLoginOpen] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState("");
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);

  function selectGoogleAccount(email: string) {
    let finalEmail = email.trim();
    if (!finalEmail.includes("@")) {
      finalEmail = `${finalEmail}@gmail.com`;
    }
    setIntegrationDialog((current) =>
      current
        ? {
            ...current,
            config: {
              ...current.config,
              connected: true,
              account: finalEmail,
              connectedAt: new Date().toISOString()
            }
          }
        : current
    );
    setGoogleLoginOpen(false);
    setShowCustomEmailInput(false);
    setGoogleCustomEmail("");
    notify(`Authenticated as ${finalEmail} via Google.`);
  }
  const activeRole = settings.teamRole || "Owner";
  const activePerms = settings.rolePermissions[activeRole] ?? {};
  const roleCounts = ["Owner", "Editor", "Reviewer", "Client"].map((role) => ({
    role,
    members: settings.teamMembers.filter((member) => member.role === role).length
  }));

  function updateNotification(name: string, enabled: boolean) {
    setSettings({ ...settings, notifications: { ...settings.notifications, [name]: enabled } });
    notify(`${name} notifications ${enabled ? "enabled" : "disabled"}.`, "info");
  }

  function openIntegration(name: string) {
    const existing = settings.integrationConfigs[name] ?? { ...emptyIntegrationConfig };
    setIntegrationDialog({ name, config: { ...existing } });
  }

  function saveIntegration() {
    if (!integrationDialog) return;
    const config = integrationDialog.config;
    const hasAccount = config.account.trim();
    const now = new Date().toISOString();
    const updatedConfig: IntegrationConfig = {
      ...config,
      connected: Boolean(hasAccount),
      account: config.account.trim(),
      connectedAt: hasAccount ? (config.connectedAt || now) : "",
      lastSyncAt: hasAccount ? now : ""
    };
    setSettings({
      ...settings,
      integrations: { ...settings.integrations, [integrationDialog.name]: updatedConfig.connected },
      integrationAccounts: { ...settings.integrationAccounts, [integrationDialog.name]: updatedConfig.account },
      integrationConfigs: { ...settings.integrationConfigs, [integrationDialog.name]: updatedConfig }
    });
    notify(`${integrationDialog.name} ${updatedConfig.connected ? "connected" : "updated"} successfully.`);
    setIntegrationDialog(null);
  }

  function disconnectIntegration(name: string) {
    setDisconnectTarget(name);
  }

  function confirmDisconnect() {
    if (!disconnectTarget) return;
    const cleared: IntegrationConfig = { ...emptyIntegrationConfig };
    setSettings({
      ...settings,
      integrations: { ...settings.integrations, [disconnectTarget]: false },
      integrationAccounts: { ...settings.integrationAccounts, [disconnectTarget]: "" },
      integrationConfigs: { ...settings.integrationConfigs, [disconnectTarget]: cleared }
    });
    notify(`${disconnectTarget} disconnected.`, "warning");
    setDisconnectTarget(null);
  }

  function testConnection() {
    setTestingConnection(true);
    setTimeout(() => {
      setTestingConnection(false);
      if (integrationDialog) {
        const now = new Date().toISOString();
        setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, lastSyncAt: now } } : current);
      }
      notify("Connection test successful!", "success");
    }, 1500);
  }

  function selectRole(role: string) {
    setSettings({ ...settings, teamRole: role });
  }

  function updateRolePermission(perm: string, enabled: boolean) {
    const updated = { ...settings.rolePermissions };
    updated[activeRole] = { ...(updated[activeRole] ?? {}), [perm]: enabled };
    setSettings({ ...settings, rolePermissions: updated });
    notify(`${perm} ${enabled ? "enabled" : "disabled"} for ${activeRole}.`, "info");
  }

  function updateStage(index: number, value: string) {
    const projectStages = [...settings.projectStages];
    projectStages[index] = value;
    setSettings({ ...settings, projectStages });
  }

  function removeStage(index: number) {
    setSettings({ ...settings, projectStages: settings.projectStages.filter((_, stageIndex) => stageIndex !== index) });
  }

  function resetSettings() {
    setSettings({ ...defaultSettings, projectStages: [...defaultSettings.projectStages], notifications: { ...defaultSettings.notifications }, integrations: { ...defaultSettings.integrations }, integrationAccounts: { ...defaultSettings.integrationAccounts }, integrationConfigs: JSON.parse(JSON.stringify(defaultIntegrationConfigs)), teamMembers: defaultSettings.teamMembers.map((m) => ({ ...m })), editorPermissions: { ...defaultSettings.editorPermissions }, rolePermissions: JSON.parse(JSON.stringify(defaultRolePermissions)) });
    notify("Settings reset to defaults.", "warning");
  }

  function formatTimestamp(iso: string) {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
    } catch { return ""; }
  }

  return (
    <PageFrame
      title="Settings"
      subtitle="Manage profile, workflow, notifications, and display preferences."
      action={
        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
          <Button variant="outlined" onClick={resetSettings} sx={{ ...outlineButtonSx, color: "#bd3f37" }}>Reset</Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onNewProject} sx={outlineButtonSx}>New Project</Button>
        </Stack>
      }
    >
      <Stack gap={settings.density === "Compact" ? 1 : 1.5}>
        <SettingsPanel title="Project Stages" subtitle="Default workflow stages for new work.">
            {settings.projectStages.map((stage, index) => (
              <Stack key={`${stage}-${index}`} direction="row" alignItems="center" gap={1.2}>
                <Box sx={{ width: 9, height: 9, borderRadius: "50%", flexShrink: 0, bgcolor: stageColors[index % stageColors.length] }} />
                <TextField
                  value={stage}
                  size="small"
                  fullWidth
                  onChange={(event) => updateStage(index, event.target.value)}
                  inputProps={{ "aria-label": `Workflow stage ${index + 1}` }}
                />
                <Tooltip title="Remove stage">
                  <Button
                    size="small"
                    aria-label={`Remove workflow stage ${index + 1}`}
                    disabled={settings.projectStages.length <= 1}
                    onClick={() => removeStage(index)}
                    sx={{ minWidth: 34, width: 34, height: 34, color: "#bd3f37", p: 0 }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Tooltip>
              </Stack>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => setSettings({ ...settings, projectStages: [...settings.projectStages, "New Stage"] })}
              sx={outlineButtonSx}
            >
              Add Stage
            </Button>
          </SettingsPanel>
        <SettingsPanel title="Notifications" subtitle="Choose when project and team events should surface.">
            {Object.keys(defaultSettings.notifications).map((item) => (
              <Stack key={item} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.05, borderBottom: `1px solid ${border}` }}>
                <Box>
                  <Typography sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{item}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12, mt: 0.2 }}>{notificationCopy(item)}</Typography>
                </Box>
                <Switch checked={Boolean(settings.notifications[item])} onChange={(event) => updateNotification(item, event.target.checked)} color="primary" />
              </Stack>
            ))}
            <SettingsLink label="Manage email preferences" onClick={() => updateNotification("Weekly summary", !settings.notifications["Weekly summary"])} />
          </SettingsPanel>
        <SettingsPanel title="Team Roles & Permissions" subtitle="Select a role to configure what team members with that role can access.">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
                {roleCounts.map(({ role, members }) => (
                  <Stack key={role} component="button" type="button" direction="row" justifyContent="space-between" aria-label={`Select ${role} role permissions`} onClick={() => selectRole(role)} sx={{ width: "100%", border: 0, font: "inherit", textAlign: "left", px: 1, py: 1, borderRadius: "5px", cursor: "pointer", color: "inherit", bgcolor: activeRole === role ? activeBg : "transparent", transition: "background-color 150ms ease" }}>
                    <Stack direction="row" alignItems="center" gap={0.8}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: activeRole === role ? accent : "#c7c3cc" }} />
                      <Typography sx={{ color: activeRole === role ? accent : ink, fontSize: 13, fontWeight: 720 }}>{role}</Typography>
                    </Stack>
                    <Typography sx={{ color: muted, fontSize: 12 }}>{members} {members === 1 ? "member" : "members"}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Stack gap={0.8}>
                <Stack direction="row" alignItems="center" gap={0.8}>
                  <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{activeRole} Permissions</Typography>
                  <Chip label={activeRole} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px", fontSize: 11, height: 20 }} />
                </Stack>
                {permissionKeys.map((perm) => {
                  const enabled = activePerms[perm] ?? false;
                  return (
                    <Stack key={perm} component="button" type="button" direction="row" alignItems="center" gap={0.8} aria-label={`${enabled ? "Disable" : "Enable"} ${perm} permission for ${activeRole}`} onClick={() => updateRolePermission(perm, !enabled)} sx={{ border: 0, font: "inherit", textAlign: "left", color: "inherit", bgcolor: "transparent", p: 0.4, cursor: "pointer", borderRadius: "4px", "&:hover": { bgcolor: hoverBg } }}>
                      <CheckCircleOutlineIcon sx={{ color: enabled ? accent : "#c7c3cc", fontSize: 17, transition: "color 150ms ease" }} />
                      <Typography sx={{ color: enabled ? ink : muted, fontSize: 12 }}>{perm}</Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
            <Button variant="outlined" component={Link} href="/team" sx={{ ...outlineButtonSx, width: "fit-content" }}>Manage Team</Button>
          </SettingsPanel>
        <SettingsPanel title="Integrations" subtitle="Connect local records for storage, messaging, and review tools.">
            <Stack divider={<Divider flexItem sx={{ borderColor: border }} />} sx={{ border: `1px solid ${border}`, borderRadius: "8px", overflow: "hidden" }}>
              {integrationNames.map((name) => {
                const config = settings.integrationConfigs[name] ?? { ...emptyIntegrationConfig };
                const connected = Boolean(settings.integrations[name] || config.connected);
                const account = settings.integrationAccounts[name] || config.account;
                return (
                  <Stack key={name} direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1.2} sx={{ p: 1.4, bgcolor: panel }}>
                    <Stack direction="row" alignItems="center" gap={1.2} sx={{ minWidth: 0 }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: "7px", bgcolor: integrationColors[name], color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 760, flexShrink: 0 }}>
                        {integrationIcons[name]}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" gap={0.8} alignItems="center" sx={{ flexWrap: "wrap" }}>
                          <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{name}</Typography>
                          <Chip
                            label={connected ? "Connected" : "Not connected"}
                            size="small"
                            sx={{
                              height: 20,
                              borderRadius: "5px",
                              bgcolor: connected ? "var(--app-success-bg, #e9f5e9)" : softPanel,
                              color: connected ? "#3c8c4b" : muted,
                              fontSize: 11,
                              fontWeight: 720
                            }}
                          />
                        </Stack>
                        <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3, maxWidth: { xs: "100%", sm: 520 } }}>
                          {account || integrationDescriptions[name]}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" gap={0.8} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
                      {connected ? (
                        <Button variant="outlined" onClick={() => disconnectIntegration(name)} sx={{ ...outlineButtonSx, color: "#bd3f37" }}>
                          Disconnect
                        </Button>
                      ) : null}
                      <Button variant="outlined" onClick={() => openIntegration(name)} sx={outlineButtonSx}>
                        {connected ? "Manage" : "Connect"}
                      </Button>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </SettingsPanel>
        <Paper sx={{ ...panelSx, p: 2.25 }}>
            <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Appearance</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.7, mb: 2 }}>Customize how CutLab looks and feels for your tracker.</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2, alignItems: "end" }}>
              <SegmentedSetting label="Theme" options={["Light", "Dark", "System"]} active={settings.theme} onChange={(value) => setSettings({ ...settings, theme: value })} />
              <Box>
                <Typography sx={{ color: muted, fontSize: 12, fontWeight: 680, mb: 1 }}>Accent Color</Typography>
                <Stack direction="row" gap={1.2}>
                  {[defaultAccent, "#2f6edb", "#4c9a5a", "#d99b20", "#c43d85", "#8b8c92"].map((color) => (
                    <Box key={color} component="button" type="button" aria-label={`Use accent color ${color}`} onClick={() => setSettings({ ...settings, accentColor: color })} sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: color, cursor: "pointer", border: settings.accentColor === color ? `3px solid #d8cef0` : `1px solid ${border}`, p: 0 }} />
                  ))}
                </Stack>
              </Box>
              <SegmentedSetting label="Density" options={["Comfortable", "Compact"]} active={settings.density} onChange={(value) => setSettings({ ...settings, density: value })} />
            </Box>
          </Paper>
        <Paper sx={{ ...panelSx, p: 2.25 }}>
            <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Regional Preferences</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.7, mb: 2 }}>Choose the currency used for earnings and payout totals.</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <DialogSelect
                label="Currency"
                value={currencyLabels[settings.currencyCode] ?? settings.currencyCode}
                options={currencyOptions.map((code) => currencyLabels[code])}
                onChange={(value) => {
                  const nextCode = Object.entries(currencyLabels).find(([, label]) => label === value)?.[0] ?? settings.currencyCode;
                  setSettings({ ...settings, currencyCode: nextCode });
                  notify(`Currency changed to ${nextCode}.`, "info");
                }}
              />
              <TextField label="Preview" value={money(12500, settings.currencyCode)} size="small" InputProps={{ readOnly: true }} />
            </Box>
          </Paper>
      </Stack>

      {/* Integration Config Dialog */}
      <Dialog open={Boolean(integrationDialog)} onClose={() => setIntegrationDialog(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
        <DialogTitle sx={{ fontSize: 22, fontWeight: 760 }}>
          <Stack direction="row" alignItems="center" gap={1.2}>
            <Box sx={{ width: 32, height: 32, borderRadius: "6px", bgcolor: integrationDialog ? integrationColors[integrationDialog.name] : accent, color: "#fff", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 760 }}>{integrationDialog ? integrationIcons[integrationDialog.name] : "?"}</Box>
            {integrationDialog?.name ? `${integrationDialog.config.connected ? "Manage" : "Connect"} ${integrationDialog.name}` : "Connect integration"}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Typography sx={{ color: muted, fontSize: 13 }}>
              {integrationDialog ? integrationDescriptions[integrationDialog.name] : "Configure your integration connection details."}
            </Typography>
            {integrationDialog?.name === "Google Drive" ? (
              <Stack gap={1.5}>
                {integrationDialog.config.connected && integrationDialog.config.account ? (
                  <Paper sx={{ p: 1.5, border: `1px solid ${border}`, bgcolor: softPanel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, color: muted, fontWeight: 700 }}>SIGNED IN AS</Typography>
                      <Typography noWrap sx={{ fontSize: 13.5, color: ink, fontWeight: 760, mt: 0.3 }}>{integrationDialog.config.account}</Typography>
                    </Box>
                    <Button variant="outlined" onClick={() => setGoogleLoginOpen(true)} sx={{ ...outlineButtonSx, fontSize: 12, height: 32, py: 0 }}>Change</Button>
                  </Paper>
                ) : (
                  <Box sx={{ py: 0.5 }}>
                    <Button
                      variant="outlined"
                      startIcon={
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                          <path d="M3.964 10.707a5.416 5.416 0 01-.282-1.707c0-.596.102-1.174.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                      }
                      onClick={() => setGoogleLoginOpen(true)}
                      sx={{
                        color: "#19171f",
                        borderColor: "#dedbe5",
                        bgcolor: "#ffffff",
                        borderRadius: "6px",
                        textTransform: "none",
                        fontWeight: 720,
                        py: 1.2,
                        fontSize: 14,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        "&:hover": { bgcolor: "#f7f4fc", borderColor: accent }
                      }}
                      fullWidth
                    >
                      Sign in with Google
                    </Button>
                  </Box>
                )}
              </Stack>
            ) : (
              <TextField
                label="Account email or name"
                value={integrationDialog?.config.account || ""}
                onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, account: event.target.value } } : current)}
                fullWidth
                autoFocus
                placeholder="you@example.com"
              />
            )}
            {integrationDialog?.name === "Google Drive" || integrationDialog?.name === "Dropbox" ? (
              <TextField
                label="Folder path"
                value={integrationDialog?.config.folder || ""}
                onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, folder: event.target.value } } : current)}
                fullWidth
                placeholder={integrationDialog?.name === "Google Drive" ? "/Projects/Video Edits" : "/Deliverables"}
              />
            ) : null}
            {integrationDialog?.name === "Slack" ? (
              <>
                <TextField
                  label="Workspace name"
                  value={integrationDialog?.config.workspace || ""}
                  onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, workspace: event.target.value } } : current)}
                  fullWidth
                  placeholder="My Studio Workspace"
                />
                <TextField
                  label="Channel"
                  value={integrationDialog?.config.channel || ""}
                  onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, channel: event.target.value } } : current)}
                  fullWidth
                  placeholder="#project-updates"
                />
                <TextField
                  label="Webhook URL (optional)"
                  value={integrationDialog?.config.webhookUrl || ""}
                  onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, webhookUrl: event.target.value } } : current)}
                  fullWidth
                  placeholder="https://hooks.slack.com/services/..."
                />
              </>
            ) : null}
            {integrationDialog?.name === "Frame.io" ? (
              <>
                <TextField
                  label="Workspace"
                  value={integrationDialog?.config.workspace || ""}
                  onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, workspace: event.target.value } } : current)}
                  fullWidth
                  placeholder="Studio Workspace"
                />
                <TextField
                  label="Project folder"
                  value={integrationDialog?.config.folder || ""}
                  onChange={(event) => setIntegrationDialog((current) => current ? { ...current, config: { ...current.config, folder: event.target.value } } : current)}
                  fullWidth
                  placeholder="/Reviews/Active"
                />
              </>
            ) : null}
            {integrationDialog?.config.lastSyncAt ? (
              <Typography sx={{ color: muted, fontSize: 12 }}>Last synced: {formatTimestamp(integrationDialog.config.lastSyncAt)}</Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setIntegrationDialog(null)} sx={{ color: muted }}>Cancel</Button>
          <Button
            onClick={testConnection}
            disabled={testingConnection || !integrationDialog?.config.account.trim()}
            variant="outlined"
            sx={{ borderColor: border, color: accent, borderRadius: "5px", fontSize: 13, "&:hover": { borderColor: accent } }}
          >
            {testingConnection ? <CircularProgress size={16} sx={{ color: accent, mr: 1 }} /> : null}
            {testingConnection ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={saveIntegration} variant="contained" disabled={!integrationDialog?.config.account.trim()} sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: "#4e348d" } }}>Save Connection</Button>
        </DialogActions>
      </Dialog>

      {/* Google Login Dialog */}
      <Dialog
        open={googleLoginOpen}
        onClose={() => setGoogleLoginOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#ffffff",
            color: "#1f2024",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            p: 2.5
          }
        }}
      >
        <Stack alignItems="center" spacing={2} sx={{ pt: 1, pb: 2 }}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: "#202124", fontFamily: "'Google Sans', Roboto, Arial" }}>
            Sign in with Google
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#5f6368", textAlign: "center" }}>
            to continue to <strong style={{ color: "#202124" }}>CutLab Studio</strong>
          </Typography>
        </Stack>

        <DialogContent sx={{ p: 0 }}>
          <Stack gap={1.2} sx={{ mt: 1 }}>
            {!showCustomEmailInput ? (
              <>
                <Box
                  component="button"
                  onClick={() => selectGoogleAccount("jordan.lee@gmail.com")}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    width: "100%",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    bgcolor: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background-color 150ms",
                    "&:hover": { bgcolor: "#f8f9fa" }
                  }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#e8f0fe", color: "#1a73e8", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>JL</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#3c4043" }}>Jordan Lee</Typography>
                    <Typography sx={{ fontSize: 12, color: "#5f6368" }}>jordan.lee@gmail.com</Typography>
                  </Box>
                </Box>

                <Box
                  component="button"
                  onClick={() => setShowCustomEmailInput(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    width: "100%",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    bgcolor: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background-color 150ms",
                    "&:hover": { bgcolor: "#f8f9fa" }
                  }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#f1f3f4", color: "#5f6368", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>+</Box>
                  <Typography sx={{ fontSize: 13.5, color: "#1a73e8", fontWeight: 600 }}>Use another account</Typography>
                </Box>
              </>
            ) : (
              <Stack gap={1.5}>
                <TextField
                  label="Email or phone"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  fullWidth
                  autoFocus
                  placeholder="name@gmail.com"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#fff",
                      color: "#202124",
                      "& fieldset": { borderColor: "#dadce0" }
                    },
                    "& label": { color: "#5f6368" }
                  }}
                />
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button onClick={() => setShowCustomEmailInput(false)} sx={{ color: "#5f6368", textTransform: "none" }}>Back</Button>
                  <Button
                    variant="contained"
                    disabled={!googleCustomEmail.trim()}
                    onClick={() => selectGoogleAccount(googleCustomEmail)}
                    sx={{ bgcolor: "#1a73e8", color: "#fff", textTransform: "none", "&:hover": { bgcolor: "#1557b0" } }}
                  >
                    Next
                  </Button>
                </Stack>
              </Stack>
            )}

            <Typography sx={{ fontSize: 11, color: "#5f6368", mt: 2, lineHeight: 1.4 }}>
              To continue, Google will share your name, email address, and profile picture with CutLab Studio. Before using this app, you can review its privacy policy and terms of service.
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={Boolean(disconnectTarget)} onClose={() => setDisconnectTarget(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
        <DialogTitle sx={{ fontSize: 22, fontWeight: 760 }}>Disconnect {disconnectTarget}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: muted, fontSize: 14 }}>
            This will remove all saved connection details for {disconnectTarget}. You can reconnect it anytime from the Integrations panel.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectTarget(null)} sx={{ color: muted }}>Cancel</Button>
          <Button onClick={confirmDisconnect} variant="contained" sx={{ bgcolor: "#bd3f37", color: "#fff", "&:hover": { bgcolor: "#a9342d" } }}>Disconnect</Button>
        </DialogActions>
      </Dialog>
    </PageFrame>
  );
}

function TimelineDesignPage({ projects }: { projects: WorkItem[] }) {
  const settings = useTrackerSettings();
  const timeline = [...projects].sort((a, b) => dateTime(a.dueDate) - dateTime(b.dueDate));

  return (
    <PageFrame title="Timeline" subtitle="A delivery-date view for every tracked project.">
      <Paper sx={{ ...panelSx, p: { xs: 2, md: 3 } }}>
        <Stack sx={{ mb: 3 }}>
          <Typography sx={{ color: ink, fontSize: 24, fontWeight: 760 }}>Delivery timeline</Typography>
          <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>A dated production rail with status, owner context, and progress.</Typography>
        </Stack>
        <Box sx={{ position: "relative", pl: { xs: 0, md: 5 } }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", left: 18, top: 8, bottom: 8, width: 2, bgcolor: border, borderRadius: 99 }} />
          <Stack gap={1.4}>
            {timeline.length ? timeline.map((project, index) => (
              <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "150px minmax(0, 1fr) 180px" }, gap: 2, p: 1.7, border: `1px solid ${border}`, borderRadius: "8px", bgcolor: panel, position: "relative", alignItems: "center" }}>
                <Box sx={{ display: { xs: "none", md: "grid" }, position: "absolute", left: -34, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", placeItems: "center", bgcolor: panel, border: `1px solid ${border}` }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: projectTimelineColor(project.status) }} />
                </Box>
                <Box>
                  <Typography sx={{ color: projectTimelineColor(project.status), fontSize: 13, fontWeight: 760 }}>{profileStatusLabel(project.status)}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{formatDate(project.dueDate, settings.dateFormat)}</Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>{project.title}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{project.client || project.workType}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12, mt: 0.55 }}>{project.notes || "No project notes saved."}</Typography>
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.65 }}>
                    <Typography sx={{ color: muted, fontSize: 12 }}>Progress</Typography>
                    <Typography sx={{ color: ink, fontSize: 12, fontWeight: 720 }}>{projectProgress(project.status)}%</Typography>
                  </Stack>
                <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ height: 6, borderRadius: 99, bgcolor: headerPanel, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
                </Box>
              </Box>
            )) : (
              <EmptyPanel title="No projects available" body="Projects appear here after you add work with due dates." />
            )}
          </Stack>
        </Box>
      </Paper>
    </PageFrame>
  );
}

function OrganizationProfilePage({ projects, settings, stats }: { projects: WorkItem[]; settings: SettingsState; stats: { active: number; delivered: number; earned: number; salaryEdits: number } }) {
  const membersByRole = settings.teamMembers.reduce<Record<string, number>>((roles, member) => {
    roles[member.role] = (roles[member.role] || 0) + 1;
    return roles;
  }, {});
  const activeProjects = projects.filter((project) => !isDoneStatus(project.status)).slice(0, 6);

  return (
    <PageFrame
      title="Organization Profile"
      subtitle="Studio-level view for team ownership, delivery context, and active work."
      action={<Button component={Link} href="/profile" variant="outlined" startIcon={<PersonOutlineOutlinedIcon />} sx={outlineButtonSx}>Public Profile</Button>}
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Studio" value={settings.studioName} helper="Local tracker" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Team Members" value={String(settings.teamMembers.length)} helper={`${Object.keys(membersByRole).length} active roles`} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Active Work" value={String(stats.active)} helper={`${stats.delivered} delivered`} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Tracked Value" value={money(stats.earned, settings.currencyCode)} helper={`${stats.salaryEdits} salary edits`} /></Grid>
      </Grid>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.2fr) 420px" }, gap: 2 }}>
        <Paper sx={{ ...panelSx, p: 2.25 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Team access</Typography>
          <Typography sx={{ color: muted, fontSize: 13, mt: 0.6 }}>Members and permissions are stored locally for this team.</Typography>
          <Stack gap={1.1} sx={{ mt: 2 }}>
            {settings.teamMembers.map((member) => (
              <Box key={member.id} sx={{ display: "grid", gridTemplateColumns: "38px minmax(0, 1fr) auto", gap: 1.1, alignItems: "center", p: 1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: activeBg, color: accent, display: "grid", placeItems: "center", fontWeight: 760 }}>{initials(member.name)}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{member.name}</Typography>
                  <Typography noWrap sx={{ color: muted, fontSize: 12 }}>{member.email || "No email saved"}</Typography>
                </Box>
                <Chip label={member.role} size="small" sx={{ bgcolor: panel, border: `1px solid ${border}`, color: ink, borderRadius: "5px" }} />
              </Box>
            ))}
          </Stack>
        </Paper>
        <Paper sx={{ ...panelSx, p: 2.25, gridColumn: { xl: "1 / -1" } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 1.5 }}>
            <Box>
              <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Active organization work</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 0.4 }}>Current queue across the studio.</Typography>
            </Box>
            <Button component={Link} href="/projects" variant="outlined" sx={outlineButtonSx}>Open Projects</Button>
          </Stack>
          <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
            {activeProjects.length ? activeProjects.map((project) => (
              <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 160px 130px" }, gap: 2, py: 1.2, alignItems: "center" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{project.title}</Typography>
                  <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{project.client || project.workType}</Typography>
                </Box>
                <Typography sx={{ color: muted, fontSize: 13 }}>{formatDate(project.dueDate, settings.dateFormat)}</Typography>
                <StatusChip status={project.status} />
              </Box>
            )) : <EmptyPanel title="No active organization work" body="Active projects appear here after new work is planned." />}
          </Stack>
        </Paper>
      </Box>
    </PageFrame>
  );
}

function ProfileDesignPage({ projects, stats, settings }: { projects: WorkItem[]; stats: { active: number; delivered: number; avgTurnaroundDays: number }; settings: SettingsState }) {
  const timeline = [...projects]
    .sort((a, b) => dateTime(a.dueDate) - dateTime(b.dueDate))
    .slice(0, 5);
  const currentTurnaround = stats.avgTurnaroundDays ? `${Math.max(1, stats.avgTurnaroundDays - 1)}-${stats.avgTurnaroundDays + 1}` : "2-3";
  const [shareCopied, setShareCopied] = useState(false);

  async function shareProfile() {
    const url = typeof window !== "undefined" ? window.location.href : "/profile";
    const text = `${settings.profileName} - ${settings.profileTitle}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      if (await copyText(url)) {
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 1400);
      }
    } catch {
      setShareCopied(false);
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, bgcolor: canvas, minHeight: "100dvh" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pb: 2.5 }}>
        <Stack direction="row" alignItems="center" gap={1.2}>
          <Box sx={{ width: 32, height: 32, border: `2px solid ${ink}`, display: "grid", placeItems: "center", borderRadius: "4px" }}>
            <MovieCreationOutlinedIcon sx={{ fontSize: 19, color: ink }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 24, color: ink, fontWeight: 760, lineHeight: 1, fontFamily: headingFont }}>CutLab</Typography>
            <Typography sx={{ fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: 0.6, mt: 0.3 }}>Video editing tracker</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" gap={1}>
          <Button component={Link} href="/projects" variant="outlined" sx={outlineButtonSx}>Back to App</Button>
          <Button variant="outlined" startIcon={<PersonOutlineOutlinedIcon />} onClick={shareProfile} sx={outlineButtonSx}>{shareCopied ? "Copied" : "Share Profile"}</Button>
          <Button component={Link} href="/settings" aria-label="Open profile settings" sx={{ minWidth: 36, width: 36, height: 36, color: ink, p: 0 }}><MoreHorizIcon /></Button>
        </Stack>
      </Stack>

      <Paper sx={{ ...panelSx, mt: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "170px minmax(0, 1fr) 560px" }, gap: 4, p: { xs: 2.5, md: 4 }, alignItems: "center" }}>
          <ProfileAvatar settings={settings} size={148} fontSize={40} />
          <Box>
            <Typography sx={{ color: ink, fontSize: 34, fontWeight: 760, lineHeight: 1.1 }}>{profileDisplayName(settings)}</Typography>
            {displayUsername(settings) ? <Typography sx={{ color: accent, fontSize: 14, fontWeight: 720, mt: 0.6 }}>{displayUsername(settings)}</Typography> : null}
            <Typography sx={{ color: ink, fontSize: 15, mt: 0.8 }}>{settings.profileTitle}</Typography>
            <Typography sx={{ color: muted, fontSize: 14, mt: 1.5, maxWidth: 420 }}>{settings.profileBio}</Typography>
            <Stack direction="row" gap={2} sx={{ mt: 2, flexWrap: "wrap", color: muted }}>
              <ClientInfoRow icon={<PlaceOutlinedIcon />} text={settings.profileLocation} />
              <ClientInfoRow icon={<PublicOutlinedIcon />} text={settings.timeZone} />
            </Stack>
          </Box>
          <Grid container spacing={1.5}>
            <Grid size={4}><ProfileMetric icon={<PlayArrowRoundedIcon />} label="Active Projects" sublabel="In progress" value={String(stats.active)} /></Grid>
            <Grid size={4}><ProfileMetric icon={<CheckCircleOutlineIcon />} label="Delivered Edits" sublabel="This year" value={String(stats.delivered)} /></Grid>
            <Grid size={4}><ProfileMetric icon={<AccessTimeOutlinedIcon />} label="Current Turnaround" sublabel="Average" value={`${currentTurnaround} Days`} /></Grid>
          </Grid>
        </Box>
        <Divider sx={{ borderColor: border }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "280px minmax(0, 1fr)" }, gap: 3, p: { xs: 2, md: 3 }, alignItems: "start" }}>
          <Box sx={{ position: { xl: "sticky" }, top: 24 }}>
            <Typography sx={{ color: ink, fontSize: 28, fontWeight: 760, lineHeight: 1.05 }}>Profile timeline</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 1, maxWidth: 230 }}>Recent delivery history and near-term work from the tracker.</Typography>
            <Box sx={{ mt: 3, p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
              <Typography sx={{ color: muted, fontSize: 12 }}>Timezone</Typography>
              <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760, mt: 0.3 }}>{settings.timeZone}</Typography>
            </Box>
          </Box>
          <Box sx={{ position: "relative", pl: { xs: 0, md: 3 } }}>
            <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", left: 8, top: 14, bottom: 14, width: 2, bgcolor: border, borderRadius: 99 }} />
            <Stack gap={1.4}>
              {timeline.length ? timeline.map((project, index) => (
                <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "120px minmax(0, 1fr) 130px" }, gap: 2, alignItems: "start", p: 1.6, border: `1px solid ${border}`, borderRadius: "8px", bgcolor: panel, position: "relative" }}>
                  <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", left: -24, top: 22, width: 14, height: 14, borderRadius: "50%", bgcolor: projectTimelineColor(project.status), border: `3px solid ${panel}`, boxShadow: `0 0 0 1px ${border}` }} />
                  <Box>
                    <Typography sx={{ color: projectTimelineColor(project.status), fontSize: 12, fontWeight: 760 }}>{profileStatusLabel(project.status)}</Typography>
                    <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{formatDate(project.dueDate, settings.dateFormat)}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>{project.title}</Typography>
                    <Typography sx={{ color: muted, fontSize: 13, mt: 0.35 }}>{project.client || project.workType}</Typography>
                    <Typography sx={{ color: muted, fontSize: 13, mt: 0.65, maxWidth: 620 }}>{project.notes || "No notes saved for this project."}</Typography>
                  </Box>
                  <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                    <Typography sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{Math.max(1, daysBetween(project.startDate, project.dueDate))} days</Typography>
                    <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>turnaround</Typography>
                  </Box>
                </Box>
              )) : <EmptyPanel title="No projects available" body="Projects will appear here once the tracker has saved records." />}
            </Stack>
          </Box>
        </Box>
      </Paper>
      <Typography sx={{ color: muted, fontSize: 13, textAlign: "center", mt: 2.5 }}>Shared from {settings.studioName} - Video Editing Tracker &nbsp; | &nbsp; Updated {formatDate(iso(todayDate()), settings.dateFormat)}, {todayDate().getFullYear()}</Typography>
    </Box>
  );
}

function ProfileEditPage({ settings, setSettings }: { settings: SettingsState; setSettings: (settings: SettingsState) => void }) {
  async function uploadProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSettings({ ...settings, profileImageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <Box sx={{ px: { xs: 2, md: 5, xl: 6 }, pt: 4, pb: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 36, color: ink, fontWeight: 760, lineHeight: 1.05, fontFamily: headingFont }}>Edit Profile</Typography>
          <Typography sx={{ fontSize: 15, color: muted, mt: 1 }}>Update the identity shown on your public profile.</Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
          <Button component={Link} href="/profile" variant="outlined" sx={outlineButtonSx}>View Public Profile</Button>
        </Stack>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px 1fr" }, gap: 3 }}>
        <Box>
          <Box sx={{ display: "grid", placeItems: "center" }}>
            <ProfileAvatar settings={settings} size={160} fontSize={48} />
          </Box>
          <Stack direction="row" gap={1} justifyContent="center" sx={{ mt: 2 }}>
            <Button component="label" variant="outlined" sx={outlineButtonSx}>
              Upload Photo
              <input hidden type="file" accept="image/*" onChange={uploadProfileImage} />
            </Button>
            <Button variant="outlined" disabled={!settings.profileImageUrl} onClick={() => setSettings({ ...settings, profileImageUrl: "" })} sx={outlineButtonSx}>Clear</Button>
          </Stack>
          <Typography sx={{ color: muted, fontSize: 13, textAlign: "center", mt: 2, maxWidth: 260, mx: "auto" }}>
            Upload an image or paste an image URL below. The latest saved photo will appear anywhere your profile is shown.
          </Typography>
        </Box>
        <Stack gap={2}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <TextField label="Profile Name" value={settings.profileName} size="small" fullWidth onChange={(event) => setSettings({ ...settings, profileName: event.target.value })} />
            <TextField label="Username" value={settings.profileUsername} size="small" fullWidth placeholder="@yourname" onChange={(event) => setSettings({ ...settings, profileUsername: sanitizeUsername(event.target.value) })} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <TextField label="Profile Title" value={settings.profileTitle} size="small" fullWidth onChange={(event) => setSettings({ ...settings, profileTitle: event.target.value })} />
            <TextField label="Profile Image URL" value={settings.profileImageUrl} size="small" fullWidth placeholder="https://example.com/photo.jpg" onChange={(event) => setSettings({ ...settings, profileImageUrl: event.target.value.trim() })} />
          </Box>
          <TextField label="Profile Bio" value={settings.profileBio} size="small" fullWidth multiline minRows={3} onChange={(event) => setSettings({ ...settings, profileBio: event.target.value })} />
          <TextField label="Profile Location" value={settings.profileLocation} size="small" fullWidth onChange={(event) => setSettings({ ...settings, profileLocation: event.target.value })} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <DialogSelect label="Time Zone" value={settings.timeZone} options={["Asia/Dubai", "Pacific Time", "Eastern Time", "UTC"]} onChange={(value) => setSettings({ ...settings, timeZone: value })} />
            <DialogSelect label="Date Format" value={settings.dateFormat} options={["Month Day, Year", "Day Month Year", "YYYY-MM-DD"]} onChange={(value) => setSettings({ ...settings, dateFormat: value })} />
          </Box>
          <Box>
            <Typography sx={{ color: muted, fontSize: 12, fontWeight: 680, mb: 1 }}>Week Start Day</Typography>
            <Stack direction="row" gap={1}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <Button
                  key={day}
                  onClick={() => setSettings({ ...settings, weekStart: day })}
                  sx={{ flex: 1, py: 1.1, minWidth: 0, border: `1px solid ${border}`, bgcolor: settings.weekStart === day ? activeBg : panel, color: settings.weekStart === day ? accent : ink, borderRadius: "5px", fontSize: 12, fontWeight: 720 }}
                >
                  {day}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

function PageFrame({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ px: { xs: 2, md: 5, xl: 6 }, pt: 4, pb: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 36, color: ink, fontWeight: 760, lineHeight: 1.05, fontFamily: headingFont }}>{title}</Typography>
          <Typography sx={{ fontSize: 15, color: muted, mt: 1 }}>{subtitle}</Typography>
        </Box>
        <Stack direction="row" alignItems="center" justifyContent={{ xs: "space-between", sm: "flex-end" }} gap={1.5} sx={{ flexShrink: 0 }}>
          {action}
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", color: ink }}>
            <NotificationsNoneOutlinedIcon />
          </Box>
        </Stack>
      </Stack>
      {children}
    </Box>
  );
}

function SettingsPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ ...panelSx, p: 2.25, minHeight: 260 }}>
      <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>{title}</Typography>
      <Typography sx={{ color: muted, fontSize: 13, mt: 0.7, mb: 2 }}>{subtitle}</Typography>
      <Stack gap={1.4}>{children}</Stack>
    </Paper>
  );
}

function notificationCopy(item: string) {
  const copy: Record<string, string> = {
    "Project updates": "Status changes, notes, and project activity",
    "Feedback received": "When feedback is added to your projects",
    "Upcoming deadlines": "Daily summary of due dates and overdue items",
    Mentions: "When you are mentioned in comments",
    "Weekly summary": "A recap of projects and tasks every Monday"
  };
  return copy[item] ?? "Tracker notification";
}

function SettingsLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button size="small" onClick={onClick} sx={{ alignSelf: "flex-start", color: accent, px: 0, fontSize: 13, fontWeight: 720 }}>
      {label}
    </Button>
  );
}

function SegmentedSetting({ label, options, active, onChange }: { label: string; options: string[]; active: string; onChange: (value: string) => void }) {
  return (
    <Box>
      <Typography sx={{ color: muted, fontSize: 12, fontWeight: 680, mb: 1 }}>{label}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, border: `1px solid ${border}`, borderRadius: "6px", overflow: "hidden", maxWidth: 330 }}>
        {options.map((option) => (
          <Button key={option} onClick={() => onChange(option)} sx={{ borderRadius: 0, bgcolor: option === active ? activeBg : panel, color: option === active ? accent : ink, fontSize: 12, fontWeight: 720, borderRight: option === options[options.length - 1] ? 0 : `1px solid ${border}` }}>
            {option}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

function ProfileMetric({ icon, label, sublabel, value }: { icon: React.ReactNode; label: string; sublabel: string; value: string }) {
  return (
    <Box sx={{ borderLeft: `1px solid ${border}`, pl: 2, minHeight: 92 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "6px", border: `1px solid ${border}`, display: "grid", placeItems: "center", color: muted, mb: 1, "& svg": { fontSize: 20 } }}>
        {icon}
      </Box>
      <Typography sx={{ color: ink, fontSize: 24, fontWeight: 680, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: ink, fontSize: 12, fontWeight: 720, mt: 0.6 }}>{label}</Typography>
      <Typography sx={{ color: muted, fontSize: 12, mt: 0.2 }}>{sublabel}</Typography>
    </Box>
  );
}

function profileStatusLabel(status: string) {
  if (isDoneStatus(status)) return "Delivered";
  if (status === "In Progress") return "Review";
  if (status === "Planned") return "Scheduled";
  return "Revision";
}

function projectTimelineColor(status: string) {
  if (isDoneStatus(status)) return "#5aa35d";
  if (status === "In Progress") return accent;
  if (status === "Planned") return "#3f6fb2";
  return "#d28a20";
}

function profileThumbColor(index: number) {
  return ["#d9e3e8", "#dfd5c7", "#eee7da", "#dce4dc", "#d6e1ed"][index % 5];
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.3, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
      <Typography sx={{ color: ink, fontSize: 22, fontWeight: 680, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: muted, fontSize: 12, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
      <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>{title}</Typography>
      <Typography sx={{ color: muted, fontSize: 13, mt: 1 }}>{body}</Typography>
    </Box>
  );
}

function buildClientSummaries(projects: WorkItem[]) {
  const groups = new Map<string, WorkItem[]>();
  for (const project of projects) {
    const clientName = project.client?.trim();
    if (!clientName) continue;
    groups.set(clientName, [...(groups.get(clientName) || []), project]);
  }

  return [...groups.entries()]
    .map(([name, clientProjects]) => {
      const active = clientProjects.filter((project) => !isDoneStatus(project.status));
      const nextProject = [...active].sort((a, b) => dateTime(a.dueDate) - dateTime(b.dueDate))[0];
      const latestProject = [...clientProjects].sort((a, b) => createdTime(b) - createdTime(a))[0];
      return {
        name,
        projectCount: clientProjects.length,
        activeCount: active.length,
        nextDue: nextProject?.dueDate || "",
        latestProject: latestProject?.title || ""
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function clientFeedbackStatus(projects: WorkItem[]): "Awaiting" | "Approved" {
  return projects.some((project) => project.status === "In Progress" || project.status === "Planned") ? "Awaiting" : "Approved";
}

function projectProgress(status: string) {
  if (isDoneStatus(status)) return 100;
  if (status === "In Progress") return 60;
  if (status === "Planned") return 25;
  return 10;
}

function projectPriority(project: WorkItem) {
  if (isDoneStatus(project.status)) return "Done";
  if (dueBucket(project) === "Overdue") return "High";
  if (dueBucket(project) === "This Week") return "Med";
  return "Low";
}

function priorityColor(project: WorkItem) {
  const priority = projectPriority(project);
  if (priority === "High") return "#bd3f37";
  if (priority === "Med") return "#b27616";
  if (priority === "Done") return "#3c8c4b";
  return "#5b7f4a";
}

function projectThumbColor(seed: string) {
  const colors = ["#d9e3e8", "#dfd5c7", "#eee7da", "#dce4dc", "#d6e1ed", "#eadfd8"];
  const index = Math.abs(seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0)) % colors.length;
  return colors[index];
}

function ClientInfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ color: muted, minWidth: 0 }}>
      <Box sx={{ width: 20, display: "grid", placeItems: "center", flexShrink: 0, "& svg": { fontSize: 17 } }}>{icon}</Box>
      <Typography noWrap sx={{ color: muted, fontSize: 13 }}>{text}</Typography>
    </Stack>
  );
}

function LabeledControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={0.8}>
      <Typography sx={{ color: muted, fontSize: 12, fontWeight: 680 }}>{label}</Typography>
      {children}
    </Stack>
  );
}

function StatCard({ label, value, helper, progress, tone, icon }: { label: string; value: string; helper: string; progress?: number; tone?: "purple"; icon?: React.ReactNode }) {
  return (
    <Paper sx={{ minHeight: 108, bgcolor: tone === "purple" ? activeBg : panel, border: `1px solid ${border}`, borderRadius: "6px", px: 2, py: 1.75 }}>
      <Stack direction="row" alignItems="center" gap={1.4}>
        {icon ? (
          <Box sx={{ width: 52, height: 52, borderRadius: "6px", display: "grid", placeItems: "center", color: tone === "purple" ? "#ffffff" : ink, bgcolor: tone === "purple" ? accent : panel, border: tone === "purple" ? "none" : `1px solid ${border}`, flexShrink: 0, "& svg": { fontSize: 28 } }}>
            {icon}
          </Box>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ color: muted, fontSize: 13, fontWeight: 700, mb: 0.6 }}>{label}</Typography>
          <Typography sx={{ color: ink, fontSize: 30, fontWeight: 620, lineHeight: 1 }}>{value}</Typography>
          <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.7 }}>{helper}</Typography>
        </Box>
      </Stack>
      {typeof progress === "number" ? (
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.5, height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
      ) : null}
    </Paper>
  );
}

function CompactSelect({ value, options, labels, onChange, width = 104 }: { value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void; width?: number | string | Record<string, number | string> }) {
  return (
    <FormControl size="small" sx={{ width, minWidth: width }}>
      <Select
        value={value}
        onChange={(event: SelectChangeEvent) => onChange(event.target.value)}
        renderValue={(selected) => labels?.[selected as string] ?? selected}
        sx={{
          height: 33,
          borderRadius: "5px",
          color: ink,
          fontSize: 13,
          bgcolor: panel,
          "& .MuiSelect-select": { pr: "26px !important" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accent },
          "& svg": { color: muted }
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>{labels?.[option] ?? option}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function ProjectTableHeader() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", lg: "minmax(300px, 1.6fr) 1fr 150px 130px 130px 140px 120px" },
        gap: 2,
        px: 2,
        py: 1.1,
        bgcolor: headerPanel,
        borderTop: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`
      }}
    >
      {["Project", "Type", "Due Date", "Status", "Amount", "Progress", ""].map((heading) => (
        <Typography key={heading || "actions"} sx={{ display: { xs: heading ? "none" : "block", lg: "block" }, color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase" }}>{heading}</Typography>
      ))}
    </Box>
  );
}

function ProjectRow({ project, onEdit, onDelete }: { project: WorkItem; onEdit: () => void; onDelete: () => void }) {
  const settings = useTrackerSettings();
  const amount = project.workType === "Job / Salary" ? "Batch tracked" : money(project.earnings, settings.currencyCode);
  const progress = projectProgress(project.status);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", lg: "minmax(300px, 1.6fr) 1fr 150px 130px 130px 140px 120px" },
        gap: 2,
        alignItems: "center",
        px: 2,
        py: 1.5,
        bgcolor: panel
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.4} sx={{ minWidth: 0 }}>
        <Box sx={{ display: { xs: "none", sm: "block" }, width: 78, height: 48, flexShrink: 0, borderRadius: "6px", border: `1px solid ${border}`, bgcolor: projectThumbColor(project.id), position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", left: 10, right: 10, bottom: 10, height: 3, borderRadius: 99, bgcolor: "rgba(91,63,160,0.35)" }} />
          <Box sx={{ position: "absolute", left: 20, right: 24, bottom: 10, height: 3, borderRadius: 99, bgcolor: accent }} />
          <MovieCreationOutlinedIcon sx={{ position: "absolute", right: 9, top: 8, color: thumbIcon, fontSize: 22 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{project.title}</Typography>
          <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.4 }}>{project.client ? `${project.client} · ${project.notes || "No notes"}` : project.notes || "No project notes"}</Typography>
          <Box sx={{ display: { xs: "block", lg: "none" }, mt: 1 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
          </Box>
        </Box>
      </Stack>
      <Typography sx={{ display: { xs: "none", lg: "block" }, color: ink, fontSize: 13, fontWeight: 650 }}>{project.workType}</Typography>
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <Typography sx={{ color: ink, fontSize: 13 }}>{formatDate(project.dueDate, settings.dateFormat)}</Typography>
      </Box>
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <StatusChip status={project.status} />
      </Box>
      <Typography sx={{ display: { xs: "none", lg: "block" }, color: ink, fontSize: 13, fontWeight: 650 }}>{amount}</Typography>
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography sx={{ color: muted, fontSize: 12 }}>{progress}%</Typography>
          <Typography sx={{ color: priorityColor(project), fontSize: 12, fontWeight: 720 }}>{projectPriority(project)}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
      </Box>
      <Stack direction="row" gap={0.5} justifyContent="flex-end" sx={{ flexShrink: 0 }}>
        <Tooltip title="Edit project">
          <Button size="small" aria-label={`Edit ${project.title}`} onClick={onEdit} sx={{ minWidth: 34, width: 34, height: 34, color: muted, p: 0 }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </Button>
        </Tooltip>
        <Tooltip title="Delete project">
          <Button size="small" aria-label={`Delete ${project.title}`} onClick={onDelete} sx={{ minWidth: 34, width: 34, height: 34, color: "#bd3f37", p: 0 }}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </Button>
        </Tooltip>
      </Stack>
    </Box>
  );
}



function deadlineColor(status: string) {
  if (status === "In Progress") return "#d39a27";
  if (status === "Cancelled") return "#bc3d35";
  return accent;
}

function dueBucket(project: WorkItem): DueFilter {
  if (isDoneStatus(project.status)) return "Delivered";
  const due = new Date(`${project.dueDate}T00:00:00`);
  const today = todayDate();
  if (due.getTime() < today.getTime()) return "Overdue";
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return due.getTime() <= weekEnd.getTime() ? "This Week" : "ALL";
}

function calendarMonthDays(month: Date, weekStart: string) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  const startIndex = weekdayIndex(weekStart);
  const offset = (first.getDay() - startIndex + 7) % 7;
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date };
  });
}

function orderedWeekdays(weekStart: string) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const start = weekdayIndex(weekStart);
  return [...days.slice(start), ...days.slice(0, start)];
}

function weekdayIndex(day: string) {
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
  return index >= 0 ? index : 1;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function statusPalette(status: string) {
  if (isDoneStatus(status)) return { fg: "#3c8c4b", bg: "var(--app-success-bg, #e9f5e9)" };
  if (status === "In Progress") return { fg: "#b27616", bg: "var(--app-warning-bg, #fff4dc)" };
  if (status === "Cancelled") return { fg: "#bc3d35", bg: "var(--app-danger-bg, #fae8e6)" };
  return { fg: accent, bg: activeBg };
}

function statusFg(status: string) {
  return statusPalette(status).fg;
}

function statusBg(status: string) {
  return statusPalette(status).bg;
}

function StatusChip({ status }: { status: string }) {
  const palette = statusPalette(status);

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 24,
        flexShrink: 0,
        bgcolor: palette.bg,
        color: palette.fg,
        borderRadius: "5px",
        fontSize: 12,
        fontWeight: 720
      }}
    />
  );
}

function ProjectDialog({ open, editing, form, setForm, formError, onClose, onSave }: { open: boolean; editing: boolean; form: WorkItem; setForm: (form: WorkItem) => void; formError: string; onClose: () => void; onSave: () => void }) {
  const typeConfig = getTypeConfig(form.workType);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
      <DialogTitle sx={{ fontSize: 24, fontWeight: 760 }}>{editing ? "Edit Project" : "New Project"}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField label="Project name" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth />
          <TextField label="Client" value={form.client || ""} placeholder="Optional client or account name" onChange={(event) => setForm({ ...form, client: event.target.value })} fullWidth />
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <DialogSelect label="Status" value={form.status} options={statusOptions} onChange={(value) => setForm({ ...form, status: value })} />
            <DialogSelect label="Type" value={form.workType} options={profile.typeOptions.map((type) => type.label)} onChange={(value) => setForm({ ...form, workType: value, earnings: 0 })} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField label="Start date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Due date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField label="Earnings" type="number" value={form.earnings} disabled={typeConfig.earningsMode === "batch"} helperText={typeConfig.earningsMode === "batch" ? "Job / Salary earnings are batch tracked." : ""} onChange={(event) => setForm({ ...form, earnings: Number(event.target.value || 0) })} fullWidth />
          <TextField label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} fullWidth multiline minRows={3} />
          {formError ? <Typography sx={{ color: "#bc3d35", fontSize: 13 }}>{formError}</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: muted }}>Cancel</Button>
        <Button onClick={onSave} variant="contained" sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: "#4e348d" } }}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteProjectDialog({ project, onCancel, onConfirm }: { project: WorkItem | null; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={Boolean(project)} onClose={onCancel} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
      <DialogTitle sx={{ fontSize: 22, fontWeight: 760 }}>Delete project?</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: muted, fontSize: 14 }}>
          {project ? `"${project.title}" will be removed from this browser's local tracker.` : "This project will be removed from this browser's local tracker."}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} sx={{ color: muted }}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" sx={{ bgcolor: "#bd3f37", color: "#fff", "&:hover": { bgcolor: "#a9342d" } }}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event: SelectChangeEvent) => onChange(event.target.value)}>
        {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

function validateProject(item: WorkItem, type: WorkTypeConfig) {
  if (!item.title.trim()) return "Project name is required.";
  if (!item.startDate || !item.dueDate) return "Start and due dates are required.";
  if (!isIsoDate(item.startDate) || !isIsoDate(item.dueDate)) return "Use valid start and due dates.";
  if (dateTime(item.startDate) > dateTime(item.dueDate)) return "Due date must be on or after start date.";
  if (type.earningsMode !== "batch" && safeMoneyValue(item.earnings) < 0) return "Earnings must be zero or higher.";
  return "";
}


async function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}






function getTypeConfig(label: string) {
  return profile.typeOptions.find((type) => type.label === label) ?? profile.typeOptions[0];
}

function appSurfaceSx(settings: SettingsState) {
  const isClient = typeof window !== "undefined";
  const isCompact = settings.density === "Compact";
  const { vars: colorVariables, isDark } = isClient ? themeVariables(settings) : { vars: {}, isDark: false };

  return {
    ...colorVariables,
    transition: "background-color 160ms ease, color 160ms ease",
    "& .MuiPaper-root": {
      color: ink,
      backgroundColor: panel,
      borderColor: border
    },
    "& .MuiButton-root": {
      minHeight: isCompact ? 32 : undefined,
      transition: "background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 120ms ease",
      "&:active": { transform: "translateY(1px)" }
    },
    "& .MuiOutlinedInput-root": {
      minHeight: isCompact ? 36 : undefined,
      backgroundColor: "var(--app-control)",
      color: ink,
      "& fieldset": { borderColor: border },
      "&:hover fieldset": { borderColor: "var(--app-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--app-accent)" }
    },
    "& .MuiInputLabel-root": {
      color: muted
    },
    "& .MuiSelect-icon": {
      color: muted
    },
    "& .MuiSwitch-track": {
      backgroundColor: isDark ? "#3d3947" : undefined
    },
    "& .MuiChip-root": {
      borderColor: border
    },
    "& .MuiDivider-root": {
      borderColor: border
    },
    "& .MuiLinearProgress-root": {
      backgroundColor: headerPanel
    },
    "& [data-density-panel]": {
      padding: isCompact ? "12px !important" : undefined
    },
    "& [data-density-row]": {
      paddingTop: isCompact ? "8px !important" : undefined,
      paddingBottom: isCompact ? "8px !important" : undefined
    }
  };
}

function applyRootThemeVariables(settings: SettingsState) {
  if (typeof document === "undefined") return;
  const { vars, isDark } = themeVariables(settings);
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.style.colorScheme = isDark ? "dark" : "light";
  root.dataset.theme = isDark ? "dark" : "light";
}

function themeVariables(settings: SettingsState) {
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = settings.theme === "Dark" || (settings.theme === "System" && prefersDark);

  return {
    isDark,
    vars: {
      "--app-accent": settings.accentColor || defaultAccent,
      "--app-canvas": isDark ? "#09090b" : "#fbfaf8",
      "--app-panel": isDark ? "#18181b" : "#ffffff",
      "--app-soft-panel": isDark ? "#202024" : "#fbfafc",
      "--app-header-panel": isDark ? "#242428" : "#f6f3f8",
      "--app-active": isDark ? "#27272f" : "#f0eafa",
      "--app-hover": isDark ? "#232329" : "#f7f4fc",
      "--app-success-bg": isDark ? "#14311f" : "#e9f5e9",
      "--app-warning-bg": isDark ? "#342713" : "#fff4dc",
      "--app-danger-bg": isDark ? "#35191d" : "#fae8e6",
      "--app-ink": isDark ? "#f8fafc" : "#19171f",
      "--app-muted": isDark ? "#c4c4cc" : "#6f6a78",
      "--app-border": isDark ? "#3f3f46" : "#dedbe5",
      "--app-control": isDark ? "#111114" : "#ffffff",
      "--app-progress-track": isDark ? "#3a3a42" : "#ece8f4",
      "--app-avatar-surface": isDark ? "#27272f" : "#dfe7ef",
      "--app-thumb-icon": isDark ? "rgba(248,250,252,0.38)" : "rgba(25,23,31,0.34)"
    }
  };
}

function defaultProjectNotes(settings: SettingsState) {
  const stages = settings.projectStages.filter((stage) => stage.trim()).join(" -> ");
  const stageLine = stages ? `Production checklist: ${stages}.` : "";
  return stageLine;
}

function createId() {
  return window.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createdTime(item: WorkItem) {
  const parsed = Date.parse(item.createdAt || "");
  if (Number.isFinite(parsed)) return parsed;
  const legacyMatch = item.id.match(/^item-(\d+)/);
  if (legacyMatch) return Number(legacyMatch[1]);
  return dateTime(item.dueDate);
}

function fallbackCreatedAt(id: unknown, dueDate: string) {
  if (typeof id === "string") {
    const legacyMatch = id.match(/^item-(\d+)/);
    if (legacyMatch) return new Date(Number(legacyMatch[1])).toISOString();
  }
  return new Date(dateTime(dueDate)).toISOString();
}

function safeMoneyValue(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function todayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function iso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function dateTime(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function isDoneStatus(status: string) {
  return ["delivered", "done", "paid", "published", "closed", "archived", "shipped", "completed", "released"].some((word) => status.toLowerCase().includes(word));
}

function formatDate(value: string, dateFormat = defaultSettings.dateFormat) {
  const date = new Date(`${value}T00:00:00`);
  if (dateFormat === "Day Month Year") {
    return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }
  if (dateFormat === "YYYY-MM-DD") return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function profileDisplayName(settings: SettingsState) {
  return settings.profileName.trim() || "Your Profile";
}

function displayUsername(settings: SettingsState) {
  if (!settings.profileUsername.trim()) return "";
  return settings.profileUsername.startsWith("@") ? settings.profileUsername : `@${settings.profileUsername}`;
}

function sanitizeUsername(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "");
  return cleaned.replace(/[^a-z0-9._-]/g, "");
}

function ProfileAvatar({ settings, size, fontSize }: { settings: SettingsState; size: number; fontSize: number }) {
  const imageUrl = settings.profileImageUrl.trim();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: avatarSurface,
        border: `1px solid ${border}`,
        display: "grid",
        placeItems: "center",
        color: ink,
        fontSize,
        fontWeight: 760,
        overflow: "hidden",
        flexShrink: 0
      }}
    >
      {imageUrl ? (
        <Box component="img" src={imageUrl} alt={profileDisplayName(settings)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials(settings.profileName)
      )}
    </Box>
  );
}

function money(value: number, currencyCode = defaultSettings.currencyCode) {
  return new Intl.NumberFormat("en", { style: "currency", currency: currencyCode, maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value || 0);
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}


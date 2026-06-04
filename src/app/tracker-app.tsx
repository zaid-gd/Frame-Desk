"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserProfile, useUser, useClerk } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useData } from "@/lib/data-context";
import { api } from "../../convex/_generated/api";
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
  Typography,
  Autocomplete
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
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { DEFAULT_PROFILE_ID, getProfile } from "@/lib/profiles";
import type { WorkItem, WorkTypeConfig, IntegrationConfig, ResourceLink } from "@/lib/types";
import type { IntegrationLink, IntegrationLinks, IntegrationServiceId } from "@/lib/integrations";
import {
  configuredIntegrationCount,
  emptyIntegrationLink,
  hasIntegrationLink,
  integrationDisplayText,
  integrationServices,
  integrationStatusLabel,
  isIntegrationServiceId,
  isValidIntegrationUrl,
  normalizeIntegrationLink
} from "@/lib/integrations";

const defaultProjectTags = ["Job / Salary", "Freelance", "Personal Channel"];
const defaultSalaryWorkType = "Job / Salary";
const defaultSalaryBatchSize = 20;
const defaultSalaryBatchAmount = 10000;
const AUTH_MODE_STORAGE_KEY = "cutlab-studio:auth-mode:v1";
const TEAM_WORKSPACE_NAME_LIMIT = 80;
const TEAM_CHAT_MESSAGE_LIMIT = 800;
const TEAM_PROJECT_COMMENT_LIMIT = 1000;
const TEAM_INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;
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

type PageKey = "dashboard" | "projects" | "clients" | "timeline" | "calendar" | "media" | "resources" | "feedback" | "templates" | "reports" | "integrations" | "team" | "settings" | "account" | "profile" | "profile-edit" | "organization-profile";
type ProjectStatus = "Planned" | "In Progress" | "Delivered" | "Cancelled";
type ProjectKind = string;
type DueFilter = "ALL" | "This Week" | "Overdue" | "Delivered";
type SortKey = "createdAt_desc" | "createdAt_asc" | "dueDate_asc" | "earnings_desc" | "earnings_asc";
type ClientDetailTab = "Overview" | "Projects" | "Files" | "Activity";
type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
};
type WorkspaceMemberOption = {
  userId: string;
  name: string;
  email: string;
  role: string;
};
type SettingsState = {
  studioName: string;
  profileName: string;
  profileUsername: string;
  profileTitle: string;
  profileBio: string;
  profileLocation: string;
  profileImageUrl: string;
  publicActiveProjects: number;
  publicDeliveredEdits: number;
  publicTurnaroundDays: number;
  timeZone: string;
  dateFormat: string;
  weekStart: string;
  currencyCode: string;
  customClients: string[];
  projectTags: string[];
  salaryWorkType: string;
  salaryBatchSize: number;
  salaryBatchAmount: number;
  projectStages: string[];
  notifications: Record<string, boolean>;
  integrations: Record<string, boolean>;
  integrationAccounts: Record<string, string>;
  integrationConfigs: Record<string, IntegrationConfig>;
  integrationLinks: IntegrationLinks;
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
const resourceCategories = ["Asset Folder", "Raw Footage", "Music / SFX", "Brand Assets", "Review Link", "Reference", "Other"];
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
  { key: "resources", href: "/resources", label: "Resources", icon: <OpenInNewIcon /> },
  { key: "feedback", href: "/feedback", label: "Feedback", icon: <ChatBubbleOutlineOutlinedIcon /> },
  { key: "templates", href: "/templates", label: "Templates", icon: <InsertDriveFileOutlinedIcon /> },
  { key: "reports", href: "/reports", label: "Reports", icon: <InsertChartOutlinedIcon /> },
  { key: "integrations", href: "/integrations", label: "Integrations", icon: <OpenInNewIcon /> },
  { key: "team", href: "/team", label: "Team", icon: <PeopleAltOutlinedIcon /> },
  { key: "settings", href: "/settings", label: "Settings", icon: <SettingsOutlinedIcon /> },
  { key: "account", href: "/account", label: "Account", icon: <PersonOutlineOutlinedIcon /> }
];

const defaultSettings: SettingsState = {
  studioName: "",
  profileName: "",
  profileUsername: "",
  profileTitle: "",
  profileBio: "",
  profileLocation: "",
  profileImageUrl: "",
  publicActiveProjects: 0,
  publicDeliveredEdits: 0,
  publicTurnaroundDays: 3,
  timeZone: "UTC",
  dateFormat: "Month Day, Year",
  weekStart: "Mon",
  currencyCode: "USD",
  customClients: [],
  projectTags: [...defaultProjectTags],
  salaryWorkType: defaultSalaryWorkType,
  salaryBatchSize: defaultSalaryBatchSize,
  salaryBatchAmount: defaultSalaryBatchAmount,
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
  integrationLinks: {},
  teamRole: "",
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
  startDate: iso(todayDate()),
  dueDate: iso(todayDate()),
  earnings: 0,
  notes: "",
  integrationLinks: {}
});

export function TrackerApp({ page }: { page: PageKey }) {
  const { items, setItems, settings, setSettings, resourceLinks, setResourceLinks, isSignedIn, isAuthLoaded, toast, setToast, reconcileSalaryBatches } = useData();
  const { openSignIn, openSignUp } = useClerk();
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const shouldLoadTeamPermissions = Boolean(isSignedIn && isConvexAuthenticated);
  const teamData = useQuery(api.team.getMyWorkspace, shouldLoadTeamPermissions ? {} : "skip");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [detailProjectId, setDetailProjectId] = useState("");
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
  const activeTeamMembers = useMemo(() => teamData?.members.filter((member) => member.status === "active") ?? [], [teamData]);
  const teamDataLoading = Boolean(isSignedIn && (isConvexAuthLoading || (isConvexAuthenticated && teamData === undefined)));
  const teamSyncUnavailable = Boolean(isSignedIn && !isConvexAuthLoading && !isConvexAuthenticated);
  const currentTeamId = teamData?.workspace?._id;
  const projectPermissions = teamData?.currentMember.permissions;
  const canCreateProjects = teamSyncUnavailable || teamDataLoading ? false : !teamData || Boolean(projectPermissions?.createProjects);
  const canEditProjects = teamSyncUnavailable || teamDataLoading ? false : !teamData || Boolean(projectPermissions?.editProjects);
  const canUpdateProjectStatus = teamSyncUnavailable || teamDataLoading ? false : !teamData || Boolean(projectPermissions?.updateStatus);
  const canCommentProjects = teamSyncUnavailable || teamDataLoading ? false : !teamData || Boolean(projectPermissions?.commentProjects);
  const canManageTeamProjects = Boolean(projectPermissions?.manageTeam);
  const detailProject = useMemo(() => items.find((item) => item.id === detailProjectId) ?? null, [detailProjectId, items]);
  const projectTagOptions = useMemo(() => projectWorkTypeOptions(settings, projects), [projects, settings]);
  const filterProjectTagOptions = useMemo(() => ["ALL", ...projectTagOptions], [projectTagOptions]);
  const clientOptions = useMemo(() => buildClientOptions(projects, settings.customClients), [projects, settings.customClients]);
  const clientFilterOptions = useMemo(() => ["ALL", ...clientOptions], [clientOptions]);
  const filteredProjects = useMemo(() => {
    const searched = projects.filter((item) => {
      const haystack = `${item.title} ${item.client || ""} ${item.notes} ${item.workType}`.toLowerCase();
      const matchesSearch = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesKind = kindFilter === "ALL" || item.workType.trim().toLowerCase() === kindFilter.toLowerCase();
      const matchesClient = clientFilter === "ALL" || item.client?.trim().toLowerCase() === clientFilter.toLowerCase();
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
    const salaryBatchSize = normalizedSalaryBatchSize(settings.salaryBatchSize);
    const salaryEdits = projects.filter((item) => isSalaryWorkType(item.workType, settings) && isDoneStatus(item.status)).length;
    const salaryBatches = Math.floor(salaryEdits / salaryBatchSize);
    const delivered = projects.filter((item) => isDoneStatus(item.status));
    const avgTurnaroundDays = delivered.length
      ? Math.round(delivered.reduce((total, item) => total + daysBetween(item.startDate, item.dueDate), 0) / delivered.length)
      : 0;
    return {
      total: projects.length,
      active,
      unpaid,
      earned: earned + salaryBatches * normalizedSalaryBatchAmount(settings.salaryBatchAmount),
      salaryEdits,
      salaryBatchProgress: salaryEdits % salaryBatchSize,
      delivered: delivered.length,
      avgTurnaroundDays
    };
  }, [projects, settings.salaryBatchAmount, settings.salaryBatchSize, settings.salaryWorkType]);

  function openNewProject() {
    if (!canCreateProjects) {
      notify("Your team role cannot create projects.", "warning");
      return;
    }
    setEditingId("");
    setForm({ ...emptyForm(), teamId: currentTeamId, assigneeUserIds: [], notes: defaultProjectNotes(settings) });
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
    if (!canCreateProjects) {
      notify("Your team role cannot create projects.", "warning");
      return;
    }
    setEditingId("");
    setForm({
      ...emptyForm(),
      teamId: currentTeamId,
      assigneeUserIds: [],
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
    if (item.teamId && !canEditProjects) {
      notify("Your team role cannot edit team projects.", "warning");
      return;
    }
    setEditingId(item.id);
    setDetailProjectId("");
    setForm(item);
    setFormError("");
    setDialogOpen(true);
  }

  function openProjectDetails(item: WorkItem) {
    setDetailProjectId(item.id);
  }

  function canDeleteProject(project: WorkItem | null) {
    if (!project) return false;
    if (!project.teamId) return true;
    return (canEditProjects || canManageTeamProjects) && (project.ownerUserId === teamData?.currentMember.userId || canManageTeamProjects);
  }

  function requestDeleteProject(id: string) {
    const target = items.find((item) => item.id === id);
    if (target && !canDeleteProject(target)) {
      notify("Only the project owner or a team owner can delete this team project.", "warning");
      return;
    }
    if (target) setDeleteTarget(target);
  }

  function updateProjectStatus(project: WorkItem, status: string) {
    if (project.teamId && !canUpdateProjectStatus && !canEditProjects) {
      notify("Your team role cannot update project status.", "warning");
      return;
    }
    setItems((current) => current.map((item) => (item.id === project.id ? { ...item, status } : item)));
    notify(`${project.title} status updated.`);
  }

  function confirmDeleteProject() {
    if (!deleteTarget) return;
    setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
    if (detailProjectId === deleteTarget.id) setDetailProjectId("");
    setDeleteTarget(null);
    notify("Project deleted.", "warning");
  }

  function saveProject() {
    const canonicalClient = canonicalClientName(form.client || "", clientOptions);
    const normalizedWorkType = canonicalWorkType(form.workType, projectTagOptions);
    const normalizedForm = { ...form, client: canonicalClient, workType: normalizedWorkType, integrationLinks: normalizeProjectIntegrationLinks(form.integrationLinks) };
    const typeConfig = getTypeConfig(normalizedForm.workType, settings);
    const error = validateProject(normalizedForm, typeConfig, projectTagOptions);
    if (error) {
      setFormError(error);
      return;
    }
    const payload: WorkItem = {
      ...normalizedForm,
      title: normalizedForm.title.trim(),
      id: editingId || createId(),
      teamId: normalizedForm.teamId ?? (editingId ? undefined : currentTeamId),
      ownerUserId: normalizedForm.ownerUserId ?? (!editingId && (normalizedForm.teamId ?? currentTeamId) ? teamData?.currentMember.userId : undefined),
      assigneeUserIds: normalizedForm.assigneeUserIds ?? [],
      createdAt: form.createdAt || new Date().toISOString(),
      profileId: profile.id,
      client: normalizedForm.client?.trim() || "",
      notes: normalizedForm.notes.trim(),
      earnings: typeConfig.earningsMode === "batch" ? 0 : safeMoneyValue(normalizedForm.earnings),
      integrationLinks: normalizedForm.integrationLinks
    };
    setItems((current) => (editingId ? current.map((item) => (item.id === editingId ? payload : item)) : [payload, ...current]));
    setDialogOpen(false);
    setEditingId("");
    setForm(emptyForm());
    notify(editingId ? "Project updated." : "Project created.");
  }

  function handleAddClient(clientName: string) {
    const canonical = canonicalClientName(clientName, clientOptions, false);
    if (!canonical) return;
    setSettings((current) => {
      const existing = findExistingClientName(canonical, [...current.customClients, ...buildClientOptions(projects)]);
      if (existing) return current;
      return { ...current, customClients: [...current.customClients, canonical] };
    });
    notify(`Client "${canonical}" added.`);
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
      projectTagOptions={filterProjectTagOptions}
      dueFilter={dueFilter}
      setDueFilter={setDueFilter}
      billingFilter={billingFilter}
      setBillingFilter={setBillingFilter}
      sortKey={sortKey}
      setSortKey={setSortKey}
      onNewProject={openNewProject}
      onViewProject={openProjectDetails}
      onEditProject={openEditProject}
      onDeleteProject={requestDeleteProject}
      canCreateProjects={canCreateProjects}
      canEditProjects={canEditProjects}
      canDeleteProject={canDeleteProject}
    />
  ) : page === "projects" ? (
    <ProjectDirectoryPage projects={projects} onNewProject={openNewProject} onViewProject={openProjectDetails} onEditProject={openEditProject} onDeleteProject={requestDeleteProject} canCreateProjects={canCreateProjects} canEditProjects={canEditProjects} canDeleteProject={canDeleteProject} />
  ) : page === "clients" ? (
    <ClientsDesignPage projects={projects} projectTagOptions={projectTagOptions} settings={settings} onAddClient={handleAddClient} />
  ) : page === "timeline" ? (
    <TimelineDesignPage projects={projects} />
  ) : page === "calendar" ? (
    <CalendarDesignPage projects={projects} settings={settings} />
  ) : page === "media" ? (
    <MediaDesignPage projects={projects} />
  ) : page === "resources" ? (
    <ResourcesDesignPage resources={resourceLinks} projects={projects} setResources={setResourceLinks} notify={notify} />
  ) : page === "feedback" ? (
    <FeedbackDesignPage projects={projects} />
  ) : page === "templates" ? (
    <TemplatesDesignPage onUseTemplate={openTemplateProject} />
  ) : page === "reports" ? (
    <ReportsDesignPage projects={projects} stats={stats} />
  ) : page === "integrations" ? (
    <IntegrationsDesignPage projects={projects} settings={settings} setSettings={setSettings} notify={notify} onEditProject={openEditProject} />
  ) : page === "team" ? (
    <TeamDesignPage projects={projects} settings={settings} setSettings={setSettings} />
  ) : page === "settings" ? (
    <SettingsDesignPage settings={settings} setSettings={setSettings} onNewProject={openNewProject} notify={notify} />
  ) : page === "account" ? (
    <AccountSettingsPage />
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
      setForm={(next) => {
        setForm(next);
        if (formError) setFormError("");
      }}
      clientOptions={clientOptions}
      workTypeOptions={projectTagOptions}
      settings={settings}
      teamMembers={activeTeamMembers}
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
  const detailDialog = (
    <ProjectDetailDialog
      project={detailProject}
      settings={settings}
      canEdit={canEditProjects || !detailProject?.teamId}
      canDelete={canDeleteProject(detailProject)}
      canUpdateStatus={canUpdateProjectStatus || canEditProjects || !detailProject?.teamId}
      canComment={canCommentProjects}
      teamMembers={activeTeamMembers}
      onClose={() => setDetailProjectId("")}
      onEdit={(project) => openEditProject(project)}
      onDelete={(project) => {
        setDetailProjectId("");
        requestDeleteProject(project.id);
      }}
      onStatusChange={updateProjectStatus}
    />
  );
  const loadingStatus = !isAuthLoaded ? <AppLoadingStatus /> : null;

  if (page === "profile") {
    return (
      <Box sx={{ ...appSurfaceSx(settings), minHeight: "100dvh", bgcolor: canvas, color: ink }}>
      <SettingsContext.Provider value={settings}>{pageContent}</SettingsContext.Provider>
      {projectDialog}
      {deleteDialog}
      {detailDialog}
      {loadingStatus}
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
      {detailDialog}
      {loadingStatus}
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
        <Stack direction="row" gap={1.2} sx={{ mb: 1.2 }}>
          <Link href="/privacy" style={{ color: "var(--app-muted, #6f6a78)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Privacy</Link>
          <Typography component="span" sx={{ color: muted, fontSize: 12 }}>·</Typography>
          <Link href="/terms" style={{ color: "var(--app-muted, #6f6a78)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Terms</Link>
        </Stack>
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
          <MenuItem component={Link} href="/account" selected={page === "account"} onClick={() => setProfileMenuAnchor(null)} sx={{ gap: 1.2, color: ink }}>
            <SettingsOutlinedIcon sx={{ color: accent, fontSize: 19 }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 760 }}>Account Settings</Typography>
              <Typography sx={{ color: muted, fontSize: 12 }}>Email, password, security</Typography>
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

function AccountSettingsPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn, openSignUp } = useClerk();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";
  const connectedAccounts = user?.externalAccounts?.length ?? 0;

  return (
    <PageFrame title="Account Settings" subtitle="Manage your private login details separately from your public CutLab profile.">
      {!isLoaded ? (
        <Paper sx={{ ...panelSx, p: 3, display: "grid", placeItems: "center", minHeight: 280 }}>
          <Stack alignItems="center" gap={1.2}>
            <CircularProgress size={28} sx={{ color: accent }} />
            <Typography sx={{ color: muted, fontSize: 13 }}>Loading account controls...</Typography>
          </Stack>
        </Paper>
      ) : !isSignedIn ? (
        <Paper sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
          <Stack gap={1.4} sx={{ maxWidth: 620 }}>
            <Typography sx={{ color: ink, fontSize: 24, fontWeight: 760 }}>Account required</Typography>
            <Typography sx={{ color: muted, fontSize: 14, lineHeight: 1.6 }}>
              Local mode does not have an account record, email, password, or connected login provider. Sign in or create an account to manage private account settings.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <Button variant="contained" onClick={() => openSignUp()} sx={{ bgcolor: accent, color: "#fff", borderRadius: "6px", fontWeight: 760, "&:hover": { bgcolor: accent } }}>Create Account</Button>
              <Button variant="outlined" onClick={() => openSignIn()} sx={outlineButtonSx}>Sign In</Button>
            </Stack>
          </Stack>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "330px minmax(0, 1fr)" }, gap: 2 }}>
          <Stack gap={2}>
            <Paper sx={{ ...panelSx, p: 2.25 }}>
              <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Private Account</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 0.6, lineHeight: 1.55 }}>
                These details are controlled by Clerk and are not shown on your public profile.
              </Typography>
              <Stack gap={1.1} sx={{ mt: 2 }}>
                <AccountInfoRow label="Signed in as" value={user?.fullName || user?.username || "Account user"} />
                <AccountInfoRow label="Primary email" value={primaryEmail || "No email on account"} />
                <AccountInfoRow label="Connected logins" value={connectedAccounts ? `${connectedAccounts} provider${connectedAccounts === 1 ? "" : "s"}` : "Email / password only"} />
              </Stack>
            </Paper>
            <Paper sx={{ ...panelSx, p: 2.25 }}>
              <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Public Profile Is Separate</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 0.6, lineHeight: 1.55 }}>
                Use Public Profile to change your CutLab display name, username, bio, and portfolio-facing image. Use this Account page for login email, password, connected providers, and security.
              </Typography>
              <Button component={Link} href="/profile/edit" variant="outlined" sx={{ ...outlineButtonSx, width: "fit-content", mt: 1.6 }}>Edit Public Profile</Button>
            </Paper>
          </Stack>
          <Paper sx={{ ...panelSx, p: { xs: 1, md: 1.4 }, bgcolor: softPanel }}>
            <Box
              sx={{
                "& .cl-rootBox": { width: "100%" },
                "& .cl-cardBox": { width: "100%", boxShadow: "none", border: `1px solid ${border}`, borderRadius: "8px" },
                "& .cl-card": { boxShadow: "none" },
                "& .cl-navbar": { borderColor: border },
                "& .cl-pageScrollBox": { paddingBlock: 1 }
              }}
            >
              <UserProfile routing="hash" />
            </Box>
          </Paper>
        </Box>
      )}
    </PageFrame>
  );
}

function AccountInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.2, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
      <Typography sx={{ color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760, mt: 0.35, overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>
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
        <NotificationBell settings={settings} />
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

function AppLoadingStatus() {
  return (
    <Paper
      aria-live="polite"
      sx={{
        position: "fixed",
        right: { xs: 16, md: 24 },
        bottom: { xs: 16, md: 24 },
        zIndex: 1450,
        bgcolor: panel,
        color: ink,
        border: `1px solid ${border}`,
        borderRadius: "6px",
        px: 1.4,
        py: 1,
        boxShadow: "0 12px 32px rgba(0,0,0,0.14)"
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <CircularProgress size={15} sx={{ color: accent }} />
        <Typography sx={{ color: ink, fontSize: 12, fontWeight: 720 }}>Loading workspace</Typography>
      </Stack>
    </Paper>
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
  projectTagOptions: string[];
  dueFilter: DueFilter;
  setDueFilter: (value: DueFilter) => void;
  billingFilter: "ALL" | "Paid" | "Unpaid";
  setBillingFilter: (value: "ALL" | "Paid" | "Unpaid") => void;
  sortKey: SortKey;
  setSortKey: (value: SortKey) => void;
  onNewProject: () => void;
  onViewProject: (item: WorkItem) => void;
  onEditProject: (item: WorkItem) => void;
  onDeleteProject: (id: string) => void;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProject: (project: WorkItem) => boolean;
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
            disabled={!props.canCreateProjects}
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
          <LabeledControl label="Tag">
            <CompactSelect value={props.kindFilter} options={props.projectTagOptions} labels={{ ALL: "All Tags", [settings.salaryWorkType]: "Salary Queue" }} onChange={(value) => props.setKindFilter(value as ProjectKind)} width="100%" />
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
        <StatCard label="Salary Edits Done" value={String(props.stats.salaryEdits)} helper={`${props.stats.salaryBatchProgress}/${normalizedSalaryBatchSize(settings.salaryBatchSize)} toward next batch`} progress={(props.stats.salaryBatchProgress / normalizedSalaryBatchSize(settings.salaryBatchSize)) * 100} icon={<FileDownloadOutlinedIcon />} />
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
                <ProjectRow key={project.id} project={project} canEdit={props.canEditProjects || !project.teamId} canDelete={props.canDeleteProject(project)} onView={() => props.onViewProject(project)} onEdit={() => props.onEditProject(project)} onDelete={() => props.onDeleteProject(project.id)} />
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

function ProjectDirectoryPage({ projects, onNewProject, onViewProject, onEditProject, onDeleteProject, canCreateProjects, canEditProjects, canDeleteProject }: { projects: WorkItem[]; onNewProject: () => void; onViewProject: (item: WorkItem) => void; onEditProject: (item: WorkItem) => void; onDeleteProject: (id: string) => void; canCreateProjects: boolean; canEditProjects: boolean; canDeleteProject: (project: WorkItem) => boolean }) {
  return (
    <PageFrame
      title="Projects"
      subtitle="A focused index for every tracked edit, handoff, and salary batch item."
      action={<Button variant="outlined" startIcon={<AddIcon />} onClick={onNewProject} disabled={!canCreateProjects} sx={outlineButtonSx}>New Project</Button>}
    >
      <Paper sx={panelSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 2 }}>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Project Library</Typography>
          <Typography sx={{ color: muted, fontSize: 13 }}>{projects.length} records</Typography>
        </Stack>
        <ProjectTableHeader />
        <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
          {projects.length ? projects.map((project) => (
            <ProjectRow key={project.id} project={project} canEdit={canEditProjects || !project.teamId} canDelete={canDeleteProject(project)} onView={() => onViewProject(project)} onEdit={() => onEditProject(project)} onDelete={() => onDeleteProject(project.id)} />
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
  projectTagOptions,
  settings,
  onAddClient
}: {
  projects: WorkItem[];
  projectTagOptions: string[];
  settings: SettingsState;
  onAddClient: (clientName: string) => void;
}) {
  const clients = buildClientSummaries(projects, settings.customClients);
  const [clientQuery, setClientQuery] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [clientWorkFilter, setClientWorkFilter] = useState<ProjectKind>("ALL");
  const [clientFeedbackFilter, setClientFeedbackFilter] = useState<"ALL" | "Awaiting" | "Approved">("ALL");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [selectedClientTab, setSelectedClientTab] = useState<ClientDetailTab>("Overview");

  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [addClientError, setAddClientError] = useState("");

  const filteredClients = clients.filter((client) => {
    const clientProjects = projects.filter((project) => isSameClient(project.client, client.name));
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
  const selectedProjects = selectedClient ? projects.filter((project) => isSameClient(project.client, selectedClient.name)) : [];
  const activeProjects = projects.filter((project) => !isDoneStatus(project.status)).length;
  const deliveredProjects = projects.length - activeProjects;
  const selectedFeedbackStatus = selectedProjects.length ? clientFeedbackStatus(selectedProjects) : "Approved";
  const pendingRevisions = selectedProjects.filter((project) => project.status === "In Progress" || project.status === "Planned");
  const clientTabs: { key: ClientDetailTab; label: string }[] = [
    { key: "Overview", label: "Overview" },
    { key: "Projects", label: `Projects (${selectedProjects.length})` },
    { key: "Files", label: "Files" },
    { key: "Activity", label: "Activity" }
  ];

  function handleSaveClient() {
    const clientName = newClientName.trim();
    if (!clientName) {
      setAddClientError("Client name is required.");
      return;
    }
    const existingClient = findExistingClientName(clientName, buildClientOptions(projects, settings.customClients));
    if (existingClient) {
      setAddClientError(`Client already exists as "${existingClient}". Select it from the project client dropdown instead.`);
      setSelectedClientName(existingClient);
      return;
    }
    onAddClient(clientName);
    setNewClientName("");
    setAddClientError("");
    setAddClientOpen(false);
    setSelectedClientName(clientName);
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
      subtitle="Manage saved clients and the client names attached to projects."
      action={
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setAddClientError(""); setAddClientOpen(true); }} sx={outlineButtonSx}>New Client</Button>
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
            <CompactSelect value={clientWorkFilter} options={["ALL", ...projectTagOptions]} labels={{ ALL: "All Work" }} onChange={(value) => setClientWorkFilter(value as ProjectKind)} width={{ xs: "100%", md: 150 }} />
            <CompactSelect value={clientFeedbackFilter} options={["ALL", "Awaiting", "Approved"]} labels={{ ALL: "Any Feedback" }} onChange={(value) => setClientFeedbackFilter(value as "ALL" | "Awaiting" | "Approved")} width={{ xs: "100%", md: 150 }} />
            <Button size="small" onClick={clearClientFilters} sx={{ color: muted, height: 42, px: 1.2, whiteSpace: "nowrap" }}>Clear Filters</Button>
            <Typography sx={{ color: muted, fontSize: 13, ml: { md: "auto" }, whiteSpace: "nowrap" }}>{filteredClients.length} shown</Typography>
          </Stack>
          <Box sx={{ display: { xs: "none", lg: "grid" }, gridTemplateColumns: "1.35fr 1fr 110px 110px 130px 120px minmax(120px, 0.9fr) 34px", gap: 2, px: 2, py: 1.1, bgcolor: headerPanel, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
            {["Client", "Contact", "Projects", "Status", "Next Delivery", "Feedback", "Notes", ""].map((heading) => <Typography key={heading || "actions"} sx={tableHeadingSx}>{heading}</Typography>)}
          </Box>
          <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
            {filteredClients.length ? filteredClients.map((client, index) => {
              const clientProjects = projects.filter((project) => isSameClient(project.client, client.name));
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
                  Create a client here, or type a new client name from the project form.
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
                <ClientInfoRow icon={<MailOutlineIcon />} text="Contact email not set" />
                <ClientInfoRow icon={<PublicOutlinedIcon />} text={selectedProjects.length ? "Project-linked client record" : "Saved client record"} />
                <ClientInfoRow icon={<PlaceOutlinedIcon />} text="Saved with project records" />
              </Stack>
              <Stack direction="row" gap={1} sx={{ mt: 2, mb: 2, overflowX: "auto", scrollbarWidth: "none" }}>
                {clientTabs.map((tab) => (
                  <Button key={tab.key} size="small" onClick={() => setSelectedClientTab(tab.key)} sx={{ flexShrink: 0, color: selectedClientTab === tab.key ? accent : muted, borderBottom: selectedClientTab === tab.key ? `2px solid ${accent}` : "2px solid transparent", borderRadius: 0, px: 0.8, fontSize: 13, fontWeight: 720 }}>{tab.label}</Button>
                ))}
              </Stack>
              <ClientTabPanel
                tab={selectedClientTab}
                projects={selectedProjects}
                activeCount={selectedClient.activeCount}
                pendingRevisions={pendingRevisions}
                feedbackStatus={selectedFeedbackStatus}
                settings={settings}
              />
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
        <DialogTitle sx={{ fontSize: 22, fontWeight: 760 }}>New Client</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1.5 }}>
            <TextField label="Client Name" placeholder="e.g. Acme Corp" value={newClientName} onChange={(e) => { setNewClientName(e.target.value); setAddClientError(""); }} fullWidth />
            <Typography sx={{ color: muted, fontSize: 12 }}>This creates a client option without creating a project. You can attach it to a project later.</Typography>
            {addClientError ? <Typography sx={{ color: "#bc3d35", fontSize: 13 }}>{addClientError}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddClientOpen(false)} sx={{ color: muted }}>Cancel</Button>
          <Button onClick={handleSaveClient} variant="contained" sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: "#4e348d" } }}>Save Client</Button>
        </DialogActions>
      </Dialog>
    </PageFrame>
  );
}

function ClientTabPanel({
  tab,
  projects,
  activeCount,
  pendingRevisions,
  feedbackStatus,
  settings
}: {
  tab: ClientDetailTab;
  projects: WorkItem[];
  activeCount: number;
  pendingRevisions: WorkItem[];
  feedbackStatus: string;
  settings: SettingsState;
}) {
  const sortedProjects = [...projects].sort((a, b) => dateTime(a.dueDate) - dateTime(b.dueDate));
  const recentActivity = [...projects].sort((a, b) => {
    const aTime = Date.parse(a.createdAt || `${a.startDate}T00:00:00`);
    const bTime = Date.parse(b.createdAt || `${b.startDate}T00:00:00`);
    return bTime - aTime;
  });

  if (tab === "Projects") {
    return (
      <Stack gap={1.1}>
        {sortedProjects.length ? sortedProjects.map((project) => (
          <Paper key={project.id} sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.2}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{project.title}</Typography>
                <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{project.workType} · Due {formatDate(project.dueDate, settings.dateFormat)}</Typography>
              </Box>
              <StatusChip status={project.status} />
            </Stack>
            {project.notes ? <Typography sx={{ color: muted, fontSize: 12, lineHeight: 1.45, mt: 1 }}>{project.notes}</Typography> : null}
          </Paper>
        )) : (
          <EmptyPanel title="No projects for this client" body="Assign this client name to a project to fill this list." />
        )}
      </Stack>
    );
  }

  if (tab === "Files") {
    return (
      <Stack gap={1.1}>
        {sortedProjects.length ? sortedProjects.map((project) => (
          <Paper key={project.id} sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                <InsertDriveFileOutlinedIcon sx={{ color: muted, fontSize: 19, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{project.title}</Typography>
                  <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{project.workType} package</Typography>
                </Box>
              </Stack>
              <Typography sx={{ color: muted, fontSize: 12, flexShrink: 0 }}>{projectProgress(project.status)}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ height: 5, borderRadius: 99, bgcolor: progressTrack, mt: 1.1, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
          </Paper>
        )) : (
          <EmptyPanel title="No project packages yet" body="Project file packages are summarized from saved client projects." />
        )}
      </Stack>
    );
  }

  if (tab === "Activity") {
    return (
      <Stack gap={1.1}>
        {recentActivity.length ? recentActivity.map((project) => (
          <Paper key={project.id} sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
            <Stack direction="row" alignItems="flex-start" gap={1.1}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: deadlineColor(project.status), mt: 0.65, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{project.status}: {project.title}</Typography>
                <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>
                  {isDoneStatus(project.status) ? "Delivered" : "Scheduled"} for {formatDate(project.dueDate, settings.dateFormat)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )) : (
          <EmptyPanel title="No client activity yet" body="Saved projects for this client will create an activity trail." />
        )}
      </Stack>
    );
  }

  return (
    <Grid container spacing={1.2}>
      <Grid size={12}>
        <Paper sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
            <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>Current Projects</Typography>
            <Typography sx={{ color: accent, fontSize: 12, fontWeight: 720 }}>{activeCount} active</Typography>
          </Stack>
          <Stack gap={1.1}>
            {projects.slice(0, 3).map((project) => (
              <Box key={project.id}>
                <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mb: 0.5 }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 12, fontWeight: 700 }}>{project.title}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12 }}>{projectProgress(project.status)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ height: 5, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
              </Box>
            ))}
            {!projects.length ? <Typography sx={{ color: muted, fontSize: 12 }}>No current projects.</Typography> : null}
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
            <Grid size={6}><MiniMetric label="Delivered" value={String(projects.filter((project) => isDoneStatus(project.status)).length)} /></Grid>
            <Grid size={6}><MiniMetric label="Packages" value={String(projects.length)} /></Grid>
            <Grid size={6}><MiniMetric label="Revisions" value={String(pendingRevisions.length)} /></Grid>
            <Grid size={6}><MiniMetric label="Feedback" value={feedbackStatus} /></Grid>
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
            {projects.find((project) => project.notes)?.notes || "Project notes attached to this client will appear here."}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
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
              const isToday = key === iso(todayDate());
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
                    boxShadow: isToday && !isSelected ? `inset 0 0 0 2px ${accent}` : "none",
                    color: "inherit",
                    opacity: isCurrentMonth ? 1 : 0.55,
                    "&:hover": { bgcolor: hoverBg }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: isSelected || isToday ? accent : ink, fontSize: 13, fontWeight: 760 }}>{day.date.getDate()}</Typography>
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

function ResourcesDesignPage({ resources, projects, setResources, notify }: { resources: ResourceLink[]; projects: WorkItem[]; setResources: React.Dispatch<React.SetStateAction<ResourceLink[]>>; notify: (message: string, tone?: ToastState["tone"]) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<ResourceLink>(() => emptyResourceForm());
  const [error, setError] = useState("");
  const sortedResources = [...resources].sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));
  const linkedToProjects = resources.filter((resource) => resource.projectId).length;
  const projectOptions = ["General", ...projects.map((project) => project.id)];
  const projectLabels = Object.fromEntries(projects.map((project) => [project.id, project.title]));
  const projectSelectValue = form.projectId || "General";
  const safeProjectOptions = projectSelectValue && !projectOptions.includes(projectSelectValue)
    ? [projectSelectValue, ...projectOptions]
    : projectOptions;
  const safeProjectLabels = projectSelectValue && !projectLabels[projectSelectValue] && projectSelectValue !== "General"
    ? { ...projectLabels, [projectSelectValue]: "Deleted project" }
    : projectLabels;

  function emptyResourceForm(): ResourceLink {
    const now = new Date().toISOString();
    return {
      id: "",
      title: "",
      url: "",
      category: "Asset Folder",
      projectId: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
  }

  function openNewResource() {
    setEditingId("");
    setForm(emptyResourceForm());
    setError("");
    setDialogOpen(true);
  }

  function openEditResource(resource: ResourceLink) {
    setEditingId(resource.id);
    setForm(resource);
    setError("");
    setDialogOpen(true);
  }

  function saveResource() {
    const title = form.title.trim();
    const url = form.url.trim();
    if (!title) {
      setError("Resource title is required.");
      return;
    }
    if (!isValidIntegrationUrl(url)) {
      setError("Enter a valid http or https URL.");
      return;
    }

    const now = new Date().toISOString();
    const payload: ResourceLink = {
      ...form,
      id: editingId || createId(),
      title,
      url,
      category: form.category.trim() || "Other",
      projectId: form.projectId,
      notes: form.notes.trim(),
      createdAt: form.createdAt || now,
      updatedAt: now,
    };
    setResources((current) => (editingId ? current.map((resource) => (resource.id === editingId ? payload : resource)) : [payload, ...current]));
    setDialogOpen(false);
    setEditingId("");
    setForm(emptyResourceForm());
    notify(editingId ? "Resource updated." : "Resource added.");
  }

  function removeResource(id: string) {
    setResources((current) => current.filter((resource) => resource.id !== id));
    notify("Resource removed.", "warning");
  }

  function openResource(url: string) {
    if (typeof window === "undefined" || !isValidIntegrationUrl(url)) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function projectName(projectId: string) {
    return projects.find((project) => project.id === projectId)?.title ?? "";
  }

  return (
    <PageFrame
      title="Resources"
      subtitle="Store asset folders, reference links, review pages, and handoff resources."
      action={<Button variant="outlined" startIcon={<AddIcon />} onClick={openNewResource} sx={outlineButtonSx}>New Resource</Button>}
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Resources" value={String(resources.length)} helper="Saved asset and reference links" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Project Linked" value={String(linkedToProjects)} helper="Attached to tracked projects" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Categories" value={String(new Set(resources.map((resource) => resource.category)).size)} helper="Resource groups in use" /></Grid>
      </Grid>

      <Paper sx={panelSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 2 }}>
          <Box>
            <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Resource Library</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.4 }}>Manual links for now; this can later map to cloud storage APIs or OAuth providers.</Typography>
          </Box>
          <Chip label={`${resources.length} saved`} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px" }} />
        </Stack>
        <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
          {sortedResources.length ? sortedResources.map((resource) => (
            <Box key={resource.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.4fr) 160px minmax(0, 1fr) 140px" }, gap: 2, px: 2, py: 1.5, alignItems: "center" }}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" gap={0.8} alignItems="center" sx={{ mb: 0.4, flexWrap: "wrap" }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{resource.title}</Typography>
                  <Chip label={resource.category} size="small" sx={{ height: 21, bgcolor: softPanel, color: muted, borderRadius: "5px", fontSize: 11 }} />
                </Stack>
                <Typography noWrap sx={{ color: muted, fontSize: 12 }}>{resource.url}</Typography>
                {resource.notes ? <Typography sx={{ color: muted, fontSize: 12, mt: 0.45 }}>{resource.notes}</Typography> : null}
              </Box>
              <Typography sx={{ color: ink, fontSize: 13 }}>{resource.projectId ? projectName(resource.projectId) || "Linked project" : "General"}</Typography>
              <Typography noWrap sx={{ color: muted, fontSize: 12 }}>{formatDate((resource.updatedAt || resource.createdAt).slice(0, 10))}</Typography>
              <Stack direction="row" gap={0.6} justifyContent={{ xs: "flex-start", lg: "flex-end" }}>
                <Tooltip title="Open resource">
                  <Button aria-label={`Open ${resource.title}`} onClick={() => openResource(resource.url)} sx={{ minWidth: 34, width: 34, height: 34, color: accent, p: 0 }}>
                    <OpenInNewIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Tooltip>
                <Tooltip title="Edit resource">
                  <Button aria-label={`Edit ${resource.title}`} onClick={() => openEditResource(resource)} sx={{ minWidth: 34, width: 34, height: 34, color: muted, p: 0 }}>
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Tooltip>
                <Tooltip title="Delete resource">
                  <Button aria-label={`Delete ${resource.title}`} onClick={() => removeResource(resource.id)} sx={{ minWidth: 34, width: 34, height: 34, color: "#bd3f37", p: 0 }}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Tooltip>
              </Stack>
            </Box>
          )) : <EmptyPanel title="No resources yet" body="Add asset folders, reference docs, cloud links, review URLs, or handoff resources." />}
        </Stack>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
        <DialogTitle sx={{ fontSize: 24, fontWeight: 760 }}>{editingId ? "Edit Resource" : "New Resource"}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField label="Resource title" value={form.title} onChange={(event) => { setForm({ ...form, title: event.target.value }); setError(""); }} fullWidth />
            <TextField label="URL" value={form.url} placeholder="https://..." error={Boolean(error && !isValidIntegrationUrl(form.url))} onChange={(event) => { setForm({ ...form, url: event.target.value }); setError(""); }} fullWidth />
            <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
              <DialogSelect label="Category" value={form.category} options={resourceCategories} onChange={(value) => setForm({ ...form, category: value })} />
              <DialogSelect label="Project" value={projectSelectValue} options={safeProjectOptions} labels={safeProjectLabels} onChange={(value) => setForm({ ...form, projectId: value === "General" ? "" : value })} />
            </Stack>
            <TextField label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} fullWidth multiline minRows={3} />
            {error ? <Typography sx={{ color: "#bd3f37", fontSize: 13 }}>{error}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: muted }}>Cancel</Button>
          <Button onClick={saveResource} variant="contained" sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: accent } }}>Save Resource</Button>
        </DialogActions>
      </Dialog>
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
  const freelanceTag = settings.projectTags.find((tag) => tag.toLowerCase().includes("freelance")) ?? settings.projectTags.find((tag) => !isSalaryWorkType(tag, settings)) ?? settings.projectTags[0];
  const channelTag = settings.projectTags.find((tag) => tag.toLowerCase().includes("channel")) ?? freelanceTag;
  const templates: { title: string; body: string; workType: string; notes: string }[] = [
    {
      title: "Client Campaign Edit",
      body: "A standard freelance client cut with review notes and delivery checkpoints.",
      workType: freelanceTag,
      notes: "Scope: assemble cut, sound pass, color pass, client review, final export.\nAssets needed: brief, footage, brand files, delivery specs."
    },
    {
      title: "Salary Batch Edit",
      body: "A job/salary project template that counts toward the batch payout tracker.",
      workType: settings.salaryWorkType,
      notes: "Batch workflow: rough cut, revision pass, thumbnail handoff, publish-ready export.\nTrack completion when delivered."
    },
    {
      title: "Channel Upload",
      body: "A personal channel edit with publishing, thumbnail, and description reminders.",
      workType: channelTag,
      notes: "Publishing checklist: edit lock, thumbnail, title options, description, chapters, upload, post-publish review."
    },
    {
      title: "Revision Sprint",
      body: "A short turnaround project for client changes, fixes, and final delivery.",
      workType: freelanceTag,
      notes: "Revision notes: collect feedback, confirm scope, apply changes, export review copy, deliver final files."
    }
  ];

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
  const workTypeOptions = projectWorkTypeOptions(settings, projects);

  return (
    <PageFrame title="Reports" subtitle="A compact view of production volume, delivery, and earnings.">
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Active" value={String(stats.active)} helper="Projects in motion" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Delivered" value={String(stats.delivered)} helper={`${deliveredRate}% completion rate`} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Salary Edits" value={String(stats.salaryEdits)} helper={`${normalizedSalaryBatchSize(settings.salaryBatchSize)} edits per batch`} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><StatCard label="Collected" value={money(stats.earned, settings.currencyCode)} helper="Freelance plus salary batches" /></Grid>
      </Grid>
      <Paper sx={{ ...panelSx, p: 2 }}>
        <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Work Mix</Typography>
        <Stack gap={1.2} sx={{ mt: 2 }}>
          {workTypeOptions.map((kind) => {
            const count = projects.filter((project) => project.workType.trim().toLowerCase() === kind.toLowerCase()).length;
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

function TeamDesignPage({ projects, settings }: { projects: WorkItem[]; settings: SettingsState; setSettings: (settings: SettingsState) => void }) {
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const { openSignIn, openSignUp } = useClerk();
  const teamData = useQuery(api.team.getMyWorkspace, isConvexAuthenticated ? {} : "skip");
  const createWorkspace = useMutation(api.team.createWorkspace);
  const joinWorkspace = useMutation(api.team.joinWorkspace);
  const inviteMember = useMutation(api.team.inviteMember);
  const updateMemberRole = useMutation(api.team.updateMemberRole);
  const removeMember = useMutation(api.team.removeMember);
  const leaveWorkspace = useMutation(api.team.leaveWorkspace);
  const sendChatMessage = useMutation(api.team.sendChatMessage);
  const addProjectComment = useMutation(api.team.addProjectComment);
  const markNotificationRead = useMutation(api.team.markNotificationRead);
  const markAllNotificationsRead = useMutation(api.team.markAllNotificationsRead);
  const [workspaceName, setWorkspaceName] = useState(settings.studioName || "CutLab Studio Team");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Editor" });
  const [chatBody, setChatBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [teamError, setTeamError] = useState("");
  const [inviteCopyLabel, setInviteCopyLabel] = useState("Copy Invite Code");
  const [busyAction, setBusyAction] = useState("");
  const teamId = teamData?.workspace?._id;
  const teamProjects = useMemo(() => (teamId ? projects.filter((project) => project.teamId === teamId) : []), [projects, teamId]);
  const teamProjectTitles = useMemo(() => Object.fromEntries(teamProjects.map((project) => [project.id, project.title])), [teamProjects]);
  const clients = buildClientSummaries(teamProjects, settings.customClients);
  const selectedProject = teamProjects.find((project) => project.id === selectedProjectId) ?? teamProjects[0] ?? null;
  const projectComments = useQuery(
    api.team.listProjectComments,
    isConvexAuthenticated && teamId && selectedProject ? { teamId, projectId: selectedProject.id } : "skip"
  );
  const activeMembers = teamData?.members.filter((member) => member.status === "active") ?? [];
  const pendingInvites = teamData?.members.filter((member) => member.status === "invited") ?? [];
  const unreadNotifications = teamData?.notifications.filter((notification) => !notification.read).length ?? 0;
  const canManageTeam = Boolean(teamData?.currentMember.permissions.manageTeam);
  const canUseChat = Boolean(teamData?.currentMember.permissions.useChat);
  const canCommentProjects = Boolean(teamData?.currentMember.permissions.commentProjects);
  const canLeaveWorkspace = Boolean(teamData && teamData.currentMember.role !== "Owner");
  const inviteCodeIsValid = TEAM_INVITE_CODE_PATTERN.test(inviteCode.trim());
  const inviteEmailIsValid = isValidEmail(inviteForm.email);

  useEffect(() => {
    if (!teamProjects.length) {
      if (selectedProjectId) setSelectedProjectId("");
      return;
    }
    if (!teamProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(teamProjects[0].id);
    }
  }, [selectedProjectId, teamProjects]);

  async function runTeamAction(label: string, action: () => Promise<unknown>) {
    setBusyAction(label);
    setTeamError("");
    try {
      await action();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "Team action failed.");
    } finally {
      setBusyAction("");
    }
  }

  function formatActivityTime(value: string) {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
  }

  async function copyInviteCode(code: string) {
    const copied = await copyText(code);
    setInviteCopyLabel(copied ? "Copied" : "Copy Failed");
    window.setTimeout(() => setInviteCopyLabel("Copy Invite Code"), 1800);
  }

  function teamProjectLabel(projectId?: string) {
    if (!projectId) return "";
    return teamProjectTitles[projectId] ?? "Deleted team project";
  }

  function showTeamProject(projectId?: string) {
    if (!projectId || !teamProjectTitles[projectId]) return;
    setSelectedProjectId(projectId);
  }

  return (
    <PageFrame title="Team" subtitle="Small-team workspace for shared projects, comments, chat, and activity.">
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Team Members" value={String(activeMembers.length)} helper={`${pendingInvites.length} pending invite${pendingInvites.length === 1 ? "" : "s"} · 5 max`} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Client Contacts" value={String(clients.length)} helper="Generated from project client names" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><StatCard label="Notifications" value={String(unreadNotifications)} helper="Unread mentions and project updates" /></Grid>
      </Grid>

      {teamError ? <Paper sx={{ ...panelSx, p: 1.5, mb: 1.5, borderColor: "#d9675d", bgcolor: "#fff7f5" }}><Typography sx={{ color: "#9f3029", fontSize: 13, fontWeight: 700 }}>{teamError}</Typography></Paper> : null}

      {!isUserLoaded ? (
        <Paper sx={{ ...panelSx, p: 3 }}><Stack direction="row" gap={1.2} alignItems="center"><CircularProgress size={18} /><Typography sx={{ color: muted, fontSize: 14 }}>Checking account status...</Typography></Stack></Paper>
      ) : !isSignedIn ? (
        <Paper sx={{ ...panelSx, p: { xs: 2.25, md: 3 } }}>
          <Box sx={{ maxWidth: 720 }}>
            <Typography sx={{ color: ink, fontSize: { xs: 24, md: 30 }, fontWeight: 780, lineHeight: 1.1 }}>Team workspaces require an account</Typography>
            <Typography sx={{ color: muted, fontSize: 14, mt: 1 }}>
              Local mode is available for solo tracking, but invites, shared projects, comments, notifications, activity, and chat need Clerk sign-in so Convex can sync the right team workspace.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => openSignUp()} sx={{ bgcolor: accent, "&:hover": { bgcolor: accent } }}>Create Account</Button>
              <Button variant="outlined" onClick={() => openSignIn()} sx={outlineButtonSx}>Sign In</Button>
            </Stack>
          </Box>
        </Paper>
      ) : isConvexAuthLoading ? (
        <Paper sx={{ ...panelSx, p: 3 }}><Stack direction="row" gap={1.2} alignItems="center"><CircularProgress size={18} /><Typography sx={{ color: muted, fontSize: 14 }}>Connecting your account to Team sync...</Typography></Stack></Paper>
      ) : !isConvexAuthenticated ? (
        <Paper sx={{ ...panelSx, p: { xs: 2.25, md: 3 }, borderColor: "#d9675d", bgcolor: "#fff7f5" }}>
          <Typography sx={{ color: "#9f3029", fontSize: 20, fontWeight: 780 }}>Team sync is not connected</Typography>
          <Typography sx={{ color: "#9f3029", fontSize: 13, mt: 0.8, lineHeight: 1.55 }}>
            Clerk sign-in is loaded, but Convex did not receive an authenticated token. Check `convex/auth.config.ts`, the Clerk JWT template audience, and the Clerk issuer environment variables before running the two-account Team smoke test.
          </Typography>
        </Paper>
      ) : teamData === undefined ? (
        <Paper sx={{ ...panelSx, p: 3 }}><Stack direction="row" gap={1.2} alignItems="center"><CircularProgress size={18} /><Typography sx={{ color: muted, fontSize: 14 }}>Loading team workspace...</Typography></Stack></Paper>
      ) : !teamData ? (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ ...panelSx, p: 2.25, height: "100%" }}>
              <Typography sx={{ color: ink, fontSize: 22, fontWeight: 780 }}>Create a workspace</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 0.6 }}>Owners can invite up to four more members. Projects, comments, notifications, activity, and chat sync through Convex.</Typography>
              <TextField
                label="Workspace name"
                value={workspaceName}
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                slotProps={{ htmlInput: { maxLength: TEAM_WORKSPACE_NAME_LIMIT } }}
                helperText={`${workspaceName.length}/${TEAM_WORKSPACE_NAME_LIMIT} characters`}
                onChange={(event) => setWorkspaceName(event.target.value)}
              />
              <Button variant="contained" sx={{ mt: 1.4, bgcolor: accent, "&:hover": { bgcolor: accent } }} disabled={Boolean(busyAction)} onClick={() => runTeamAction("create", () => createWorkspace({ name: workspaceName }))}>Create Team Workspace</Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ ...panelSx, p: 2.25, height: "100%" }}>
              <Typography sx={{ color: ink, fontSize: 22, fontWeight: 780 }}>Join with an invite code</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 0.6 }}>Use the six-character code from your team owner. Your signed-in email must match a pending invite.</Typography>
              <TextField
                label="Invite code"
                value={inviteCode}
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                slotProps={{ htmlInput: { maxLength: 6 } }}
                error={Boolean(inviteCode.trim() && !inviteCodeIsValid)}
                helperText="Enter the six-character code from your team owner."
                onChange={(event) => setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              />
              <Button variant="outlined" sx={{ ...outlineButtonSx, mt: 1.4 }} disabled={Boolean(busyAction) || !inviteCodeIsValid} onClick={() => runTeamAction("join", () => joinWorkspace({ inviteCode }))}>Join Workspace</Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack gap={1.5}>
              <Paper sx={panelSx}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.4} sx={{ p: 2 }}>
                  <Box>
                    <Typography sx={{ color: ink, fontSize: 22, fontWeight: 780 }}>{teamData.workspace.name}</Typography>
                    {canManageTeam ? (
                      <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mt: 0.65 }}>
                        <Typography sx={{ color: muted, fontSize: 13 }}>Invite code <Box component="span" sx={{ color: accent, fontWeight: 800, letterSpacing: 1 }}>{teamData.workspace.inviteCode}</Box></Typography>
                        <Button size="small" variant="outlined" onClick={() => copyInviteCode(teamData.workspace.inviteCode)} sx={{ ...outlineButtonSx, height: 30, px: 1.1, fontSize: 11 }}>{inviteCopyLabel}</Button>
                      </Stack>
                    ) : (
                      <Typography sx={{ color: muted, fontSize: 13, mt: 0.45 }}>Invite code is visible to team owners only.</Typography>
                    )}
                  </Box>
                  <Stack direction="row" gap={0.8} alignItems="center" flexWrap="wrap" sx={{ alignSelf: { xs: "flex-start", md: "center" }, justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                    <Chip label={`${teamData.currentMember.role} access`} sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px", fontWeight: 760 }} />
                    {canLeaveWorkspace ? (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={Boolean(busyAction)}
                        onClick={() => runTeamAction("leave", () => leaveWorkspace({ teamId: teamData.workspace._id }))}
                        sx={{ ...outlineButtonSx, height: 32, color: "#bd3f37", borderColor: "#e4b4ae", fontSize: 11 }}
                      >
                        Leave Workspace
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
                <Divider sx={{ borderColor: border }} />
                <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
                  {teamData.members.map((member) => (
                    <Stack key={member._id} direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1} sx={{ p: 1.5 }}>
                      <Box>
                        <Stack direction="row" gap={0.8} alignItems="center" flexWrap="wrap">
                          <Typography sx={{ color: ink, fontSize: 14, fontWeight: 780 }}>{member.name}</Typography>
                          <Chip label={member.role} size="small" sx={{ height: 20, fontSize: 10, bgcolor: softPanel, color: muted, borderRadius: "4px" }} />
                          <Chip label={member.status} size="small" sx={{ height: 20, fontSize: 10, bgcolor: member.status === "active" ? activeBg : "#fff3d8", color: member.status === "active" ? accent : "#996b08", borderRadius: "4px" }} />
                        </Stack>
                        <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{member.email || "No email on profile"}</Typography>
                      </Box>
                      <Stack direction="row" gap={0.6} flexWrap="wrap" sx={{ justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center" }}>
                        {canManageTeam && member.role !== "Owner" ? (
                          <Box sx={{ width: { xs: "100%", sm: 150 } }}>
                            <DialogSelect
                              label="Role"
                              value={member.role}
                              options={teamRoleOptions.filter((role) => role !== "Owner")}
                              onChange={(role) => runTeamAction("role", () => updateMemberRole({ teamId: teamData.workspace._id, memberId: member._id, role: role as "Editor" | "Reviewer" | "Client" }))}
                            />
                          </Box>
                        ) : Object.entries(member.permissions).filter(([, enabled]) => enabled).slice(0, 4).map(([permission]) => (
                          <Chip key={permission} label={permission} size="small" sx={{ height: 21, fontSize: 10, bgcolor: softPanel, color: muted, borderRadius: "4px" }} />
                        ))}
                        {canManageTeam && member.role !== "Owner" ? (
                          <Button
                            size="small"
                            disabled={Boolean(busyAction)}
                            onClick={() => runTeamAction("remove", () => removeMember({ teamId: teamData.workspace._id, memberId: member._id }))}
                            sx={{ color: "#bd3f37", fontSize: 12, fontWeight: 760 }}
                          >
                            {member.status === "invited" ? "Cancel Invite" : "Remove"}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
                {canManageTeam ? (
                  <Box sx={{ p: 2, borderTop: `1px solid ${border}` }}>
                    <Typography sx={{ color: ink, fontSize: 15, fontWeight: 760 }}>Invite member</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 150px 120px" }, gap: 1, mt: 1 }}>
                      <TextField label="Email" value={inviteForm.email} size="small" error={Boolean(inviteForm.email.trim() && !isValidEmail(inviteForm.email))} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} />
                      <DialogSelect label="Role" value={inviteForm.role} options={teamRoleOptions.filter((role) => role !== "Owner")} onChange={(value) => setInviteForm({ ...inviteForm, role: value })} />
                      <Button variant="outlined" sx={outlineButtonSx} disabled={Boolean(busyAction) || !inviteEmailIsValid} onClick={() => runTeamAction("invite", async () => { await inviteMember({ teamId: teamData.workspace._id, email: inviteForm.email, role: inviteForm.role as "Editor" | "Reviewer" | "Client" }); setInviteForm({ email: "", role: "Editor" }); })}>Invite</Button>
                    </Box>
                  </Box>
                ) : null}
              </Paper>

              <Paper sx={{ ...panelSx, p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1} sx={{ mb: 1.4 }}>
                  <Box>
                    <Typography sx={{ color: ink, fontSize: 20, fontWeight: 780 }}>Project Comments</Typography>
                    <Typography sx={{ color: muted, fontSize: 13 }}>Leave notes for the team. Use @name or @emailname to notify someone.</Typography>
                  </Box>
                  <DialogSelect label="Project" value={selectedProject?.id ?? ""} options={teamProjects.map((project) => project.id)} labels={Object.fromEntries(teamProjects.map((project) => [project.id, project.title]))} onChange={setSelectedProjectId} />
                </Stack>
                {selectedProject ? (
                  <Stack gap={1.2}>
                    <Box sx={{ p: 1.2, bgcolor: softPanel, border: `1px solid ${border}`, borderRadius: "6px" }}>
                      <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{selectedProject.title}</Typography>
                      <Typography sx={{ color: muted, fontSize: 12, mt: 0.25 }}>{selectedProject.client || "No client"} · {selectedProject.status} · Due {formatDate(selectedProject.dueDate, settings.dateFormat)}</Typography>
                    </Box>
                    <Stack gap={1} sx={{ maxHeight: 270, overflow: "auto" }}>
                      {projectComments === undefined ? <Typography sx={{ color: muted, fontSize: 13 }}>Loading comments...</Typography> : projectComments.length ? projectComments.map((comment) => (
                        <Box key={comment._id} sx={{ p: 1.2, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
                          <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{comment.authorName} <Box component="span" sx={{ color: muted, fontSize: 11, fontWeight: 500 }}>{formatActivityTime(comment.createdAt)}</Box></Typography>
                          <Typography sx={{ color: ink, fontSize: 13, mt: 0.5, whiteSpace: "pre-wrap" }}>{comment.body}</Typography>
                        </Box>
                      )) : <EmptyPanel title="No project comments yet" body="Team notes for this project will appear here in real time." />}
                    </Stack>
                    {canCommentProjects ? (
                      <Stack direction={{ xs: "column", md: "row" }} gap={1}>
                        <TextField
                          label="Project comment"
                          value={commentBody}
                          size="small"
                          fullWidth
                          multiline
                          minRows={2}
                          slotProps={{ htmlInput: { maxLength: TEAM_PROJECT_COMMENT_LIMIT } }}
                          helperText={`${commentBody.length}/${TEAM_PROJECT_COMMENT_LIMIT} characters`}
                          onChange={(event) => setCommentBody(event.target.value)}
                        />
                        <Button variant="contained" sx={{ bgcolor: accent, minWidth: 112, "&:hover": { bgcolor: accent } }} disabled={Boolean(busyAction) || !commentBody.trim()} onClick={() => runTeamAction("comment", async () => { await addProjectComment({ teamId: teamData.workspace._id, projectId: selectedProject.id, body: commentBody }); setCommentBody(""); })}>Post</Button>
                      </Stack>
                    ) : null}
                  </Stack>
                ) : <EmptyPanel title="No team projects yet" body="Create a team project to start leaving shared comments." />}
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack gap={1.5}>
              <Paper sx={{ ...panelSx, p: 2 }}>
                <Typography sx={{ color: ink, fontSize: 20, fontWeight: 780 }}>Team Chat</Typography>
                <Typography sx={{ color: muted, fontSize: 13, mt: 0.35 }}>Quick workspace messages for small editing teams.</Typography>
                <Stack gap={1} sx={{ mt: 1.4, maxHeight: 310, overflow: "auto" }}>
                  {!canUseChat ? (
                    <EmptyPanel title="Chat unavailable for your role" body="Your team role can use project comments and notifications, but cannot view or send team chat messages." />
                  ) : teamData.chat.length ? teamData.chat.map((message) => (
                    <Box key={message._id} sx={{ p: 1.1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
                      <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{message.authorName} <Box component="span" sx={{ color: muted, fontSize: 11, fontWeight: 500 }}>{formatActivityTime(message.createdAt)}</Box></Typography>
                      <Typography sx={{ color: ink, fontSize: 13, mt: 0.45, whiteSpace: "pre-wrap" }}>{message.body}</Typography>
                    </Box>
                  )) : <EmptyPanel title="No chat messages yet" body="Use chat for quick handoffs, blockers, and delivery updates." />}
                </Stack>
                {canUseChat ? (
                  <Stack direction={{ xs: "column", md: "row" }} gap={1} sx={{ mt: 1.2 }}>
                    <TextField
                      label="Message"
                      value={chatBody}
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { maxLength: TEAM_CHAT_MESSAGE_LIMIT } }}
                      helperText={`${chatBody.length}/${TEAM_CHAT_MESSAGE_LIMIT} characters`}
                      onChange={(event) => setChatBody(event.target.value)}
                    />
                    <Button variant="outlined" sx={outlineButtonSx} disabled={Boolean(busyAction) || !chatBody.trim()} onClick={() => runTeamAction("chat", async () => { await sendChatMessage({ teamId: teamData.workspace._id, body: chatBody }); setChatBody(""); })}>Send</Button>
                  </Stack>
                ) : null}
              </Paper>

              <Paper sx={{ ...panelSx, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Typography sx={{ color: ink, fontSize: 20, fontWeight: 780 }}>Notifications</Typography>
                  {unreadNotifications ? (
                    <Button
                      size="small"
                      disabled={Boolean(busyAction)}
                      onClick={() => runTeamAction("read-all", () => markAllNotificationsRead({ teamId: teamData.workspace._id }))}
                      sx={{ color: accent, fontSize: 12, fontWeight: 760 }}
                    >
                      Mark all read
                    </Button>
                  ) : null}
                </Stack>
                <Stack gap={0.8} sx={{ mt: 1.2 }}>
                  {teamData.notifications.length ? teamData.notifications.map((notification) => (
                    <Stack key={notification._id} direction="row" justifyContent="space-between" gap={1} sx={{ p: 1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: notification.read ? panel : activeBg }}>
                      <Box>
                        <Typography sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{notification.message}</Typography>
                        {notification.projectId ? <Typography sx={{ color: accent, fontSize: 11.5, fontWeight: 760, mt: 0.25 }}>Project: {teamProjectLabel(notification.projectId)}</Typography> : null}
                        <Typography sx={{ color: muted, fontSize: 11, mt: 0.3 }}>{formatActivityTime(notification.createdAt)}</Typography>
                      </Box>
                      <Stack gap={0.35} alignItems="flex-end">
                        {notification.projectId && teamProjectTitles[notification.projectId] ? (
                          <Button
                            size="small"
                            onClick={() => {
                              showTeamProject(notification.projectId);
                              if (!notification.read) {
                                void markNotificationRead({ notificationId: notification._id });
                              }
                            }}
                            sx={{ color: accent }}
                          >
                            View
                          </Button>
                        ) : null}
                        {!notification.read ? <Button size="small" onClick={() => runTeamAction("read", () => markNotificationRead({ notificationId: notification._id }))}>Mark read</Button> : null}
                      </Stack>
                    </Stack>
                  )) : <EmptyPanel title="No notifications" body="Mentions and project notifications will appear here." />}
                </Stack>
              </Paper>

              <Paper sx={{ ...panelSx, p: 2 }}>
                <Typography sx={{ color: ink, fontSize: 20, fontWeight: 780 }}>Activity Feed</Typography>
                <Stack gap={0.8} sx={{ mt: 1.2 }}>
                  {teamData.activity.length ? teamData.activity.map((activity) => (
                    <Box key={activity._id} sx={{ p: 1, borderLeft: `3px solid ${accent}`, bgcolor: softPanel, borderRadius: "5px" }}>
                      <Typography sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{activity.message}</Typography>
                      {activity.projectId ? (
                        <Stack direction="row" alignItems="center" gap={0.8} sx={{ mt: 0.35, flexWrap: "wrap" }}>
                          <Typography sx={{ color: accent, fontSize: 11.5, fontWeight: 760 }}>Project: {teamProjectLabel(activity.projectId)}</Typography>
                          {teamProjectTitles[activity.projectId] ? <Button size="small" onClick={() => showTeamProject(activity.projectId)} sx={{ color: accent, p: 0, minWidth: 0, fontSize: 11 }}>View</Button> : null}
                        </Stack>
                      ) : null}
                      <Typography sx={{ color: muted, fontSize: 11, mt: 0.3 }}>{formatActivityTime(activity.createdAt)}</Typography>
                    </Box>
                  )) : <EmptyPanel title="No activity yet" body="Workspace creation, invites, comments, and project updates will appear here." />}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}
    </PageFrame>
  );
}

function IntegrationsDesignPage({
  projects,
  settings,
  setSettings,
  notify,
  onEditProject
}: {
  projects: WorkItem[];
  settings: SettingsState;
  setSettings: (settings: SettingsState) => void;
  notify: (message: string, tone?: ToastState["tone"]) => void;
  onEditProject: (item: WorkItem) => void;
}) {
  const projectLinks = projects.filter((project) => configuredIntegrationCount(project.integrationLinks) > 0);
  const globalCount = configuredIntegrationCount(settings.integrationLinks);

  return (
    <PageFrame
      title="Integrations"
      subtitle="Save external service links for your workspace and individual projects. Links only; no OAuth, syncing, or API access."
    >
      <Stack gap={1.5}>
        <IntegrationLinkManager
          title="Global Integrations"
          subtitle="Workspace-level service links used across your editing workflow."
          links={settings.integrationLinks}
          emptyTitle="No global integration links"
          emptyBody="Add links to shared folders, calendars, channels, and review spaces your studio uses often."
          onChange={(integrationLinks) => {
            setSettings({ ...settings, integrationLinks });
            notify("Global integration links updated.", "success");
          }}
        />

        <Paper sx={{ ...panelSx, p: 2.25 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.2} sx={{ mb: 1.5 }}>
            <Box>
              <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Project Integrations</Typography>
              <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>Project-specific links stay attached to each project record.</Typography>
            </Box>
            <Chip label={`${projectLinks.length} projects linked`} size="small" sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: globalCount ? activeBg : softPanel, color: globalCount ? accent : muted, borderRadius: "5px" }} />
          </Stack>
          {projectLinks.length ? (
            <Stack divider={<Divider flexItem sx={{ borderColor: border }} />} sx={{ border: `1px solid ${border}`, borderRadius: "8px", overflow: "hidden" }}>
              {projectLinks.map((project) => (
                <Stack key={project.id} direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1.2} sx={{ p: 1.4, bgcolor: panel }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{project.title}</Typography>
                    <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{configuredIntegrationCount(project.integrationLinks)} saved {configuredIntegrationCount(project.integrationLinks) === 1 ? "link" : "links"}</Typography>
                    <Stack direction="row" gap={0.7} flexWrap="wrap" sx={{ mt: 0.8 }}>
                      {integrationServices.map((service) => hasIntegrationLink(project.integrationLinks?.[service.id]) ? (
                        <Chip key={service.id} label={service.shortName} size="small" sx={{ height: 22, borderRadius: "5px", bgcolor: activeBg, color: accent, fontSize: 11 }} />
                      ) : null)}
                    </Stack>
                  </Box>
                  <Button variant="outlined" onClick={() => onEditProject(project)} sx={outlineButtonSx}>Manage Project Links</Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <EmptyPanel title="No project integration links" body="Open a project and add service links for folders, review pages, channels, or calendar events." />
          )}
        </Paper>
      </Stack>
    </PageFrame>
  );
}

function IntegrationLinkManager({
  title,
  subtitle,
  links,
  emptyTitle,
  emptyBody,
  onChange
}: {
  title: string;
  subtitle: string;
  links: IntegrationLinks | undefined;
  emptyTitle: string;
  emptyBody: string;
  onChange: (links: IntegrationLinks) => void;
}) {
  const [editing, setEditing] = useState<{ serviceId: IntegrationServiceId; link: IntegrationLink } | null>(null);
  const [error, setError] = useState("");
  const configuredCount = configuredIntegrationCount(links);

  function openEditor(serviceId: IntegrationServiceId) {
    setEditing({ serviceId, link: { ...emptyIntegrationLink, ...normalizeIntegrationLink(links?.[serviceId]) } });
    setError("");
  }

  function saveLink() {
    if (!editing) return;
    const link = normalizeIntegrationLink(editing.link);
    if (!isValidIntegrationUrl(link.url)) {
      setError("Enter a valid http or https URL.");
      return;
    }
    onChange({
      ...(links ?? {}),
      [editing.serviceId]: {
        ...link,
        updatedAt: new Date().toISOString()
      }
    });
    setEditing(null);
    setError("");
  }

  function removeLink(serviceId: IntegrationServiceId) {
    const next: IntegrationLinks = { ...(links ?? {}) };
    delete next[serviceId];
    onChange(next);
  }

  function openLink(url: string) {
    if (typeof window === "undefined" || !isValidIntegrationUrl(url)) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Paper sx={{ ...panelSx, p: 2.25 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.2} sx={{ mb: 1.5 }}>
        <Box>
          <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>{title}</Typography>
          <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        <Chip label={`${configuredCount} configured`} size="small" sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: configuredCount ? activeBg : softPanel, color: configuredCount ? accent : muted, borderRadius: "5px" }} />
      </Stack>
      {!configuredCount ? <Box sx={{ mb: 1.4 }}><EmptyPanel title={emptyTitle} body={emptyBody} /></Box> : null}
      <Stack divider={<Divider flexItem sx={{ borderColor: border }} />} sx={{ border: `1px solid ${border}`, borderRadius: "8px", overflow: "hidden" }}>
        {integrationServices.map((service) => {
          const link = links?.[service.id];
          const linked = hasIntegrationLink(link);
          return (
            <Stack key={service.id} direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1.2} sx={{ p: 1.4, bgcolor: panel }}>
              <Stack direction="row" alignItems="center" gap={1.2} sx={{ minWidth: 0 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "7px", bgcolor: service.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 760, flexShrink: 0 }}>
                  {service.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" gap={0.8} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{service.name}</Typography>
                    <Chip
                      label={integrationStatusLabel(link)}
                      size="small"
                      sx={{
                        height: 20,
                        borderRadius: "5px",
                        bgcolor: linked ? "var(--app-success-bg, #e9f5e9)" : softPanel,
                        color: linked ? "#3c8c4b" : muted,
                        fontSize: 11,
                        fontWeight: 720
                      }}
                    />
                  </Stack>
                  <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3, maxWidth: { xs: "100%", sm: 520 } }}>
                    {integrationDisplayText(link, service.description)}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={0.8} justifyContent={{ xs: "flex-start", sm: "flex-end" }} flexWrap="wrap">
                {linked && link ? (
                  <Button variant="outlined" startIcon={<OpenInNewIcon sx={{ fontSize: 17 }} />} onClick={() => openLink(link.url)} sx={outlineButtonSx}>Open</Button>
                ) : null}
                {linked ? (
                  <Button variant="outlined" onClick={() => removeLink(service.id)} sx={{ ...outlineButtonSx, color: "#bd3f37" }}>Remove</Button>
                ) : null}
                <Button variant="outlined" onClick={() => openEditor(service.id)} sx={outlineButtonSx}>{linked ? "Edit" : "Add Link"}</Button>
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
        <DialogTitle sx={{ fontSize: 22, fontWeight: 760 }}>
          {editing ? `${hasIntegrationLink(links?.[editing.serviceId]) ? "Edit" : "Add"} ${integrationServices.find((service) => service.id === editing.serviceId)?.name} Link` : "Integration Link"}
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField
              label="URL"
              value={editing?.link.url ?? ""}
              onChange={(event) => {
                setEditing((current) => current ? { ...current, link: { ...current.link, url: event.target.value } } : current);
                setError("");
              }}
              fullWidth
              autoFocus
              placeholder="https://..."
              error={Boolean(error)}
            />
            <TextField
              label="Label"
              value={editing?.link.label ?? ""}
              onChange={(event) => setEditing((current) => current ? { ...current, link: { ...current.link, label: event.target.value } } : current)}
              fullWidth
              placeholder="Client review folder"
            />
            <TextField
              label="Notes"
              value={editing?.link.notes ?? ""}
              onChange={(event) => setEditing((current) => current ? { ...current, link: { ...current.link, notes: event.target.value } } : current)}
              fullWidth
              multiline
              minRows={2}
              placeholder="Optional context for this link"
            />
            {error ? <Typography sx={{ color: "#bd3f37", fontSize: 13 }}>{error}</Typography> : null}
            <Typography sx={{ color: muted, fontSize: 12 }}>This stores a link only. CutLab will not authenticate, browse files, sync data, or call this service.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditing(null)} sx={{ color: muted }}>Cancel</Button>
          <Button onClick={saveLink} variant="contained" sx={{ bgcolor: accent, color: "#fff", "&:hover": { bgcolor: "#4e348d" } }}>Save Link</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function SettingsDesignPage({ settings, setSettings, onNewProject, notify }: { settings: SettingsState; setSettings: (settings: SettingsState) => void; onNewProject: () => void; notify: (message: string, tone?: ToastState["tone"]) => void }) {
  const stageColors = ["#6c4db3", "#7eadea", "#d39a27", "#9a75d1", "#6dab55", "#d65f59"];
  const stageIssues = projectStageIssues(settings.projectStages);
  const tagIssues = projectTagIssues(settings.projectTags);
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

  function updateProjectTag(index: number, value: string) {
    const projectTags = [...settings.projectTags];
    const previous = projectTags[index];
    projectTags[index] = value;
    const nextSalaryWorkType = previous && previous === settings.salaryWorkType ? value : settings.salaryWorkType;
    setSettings({ ...settings, projectTags, salaryWorkType: nextSalaryWorkType });
  }

  function addProjectTag() {
    setSettings({ ...settings, projectTags: [...settings.projectTags, nextProjectTagName(settings.projectTags)] });
  }

  function removeProjectTag(index: number) {
    const removed = settings.projectTags[index];
    const projectTags = settings.projectTags.filter((_, tagIndex) => tagIndex !== index);
    const salaryWorkType = removed === settings.salaryWorkType ? projectTags[0] : settings.salaryWorkType;
    setSettings({ ...settings, projectTags, salaryWorkType });
  }

  function updateSalaryBatchSize(value: string) {
    setSettings({ ...settings, salaryBatchSize: normalizedSalaryBatchSize(Number(value || defaultSalaryBatchSize)) });
  }

  function updateSalaryBatchAmount(value: string) {
    setSettings({ ...settings, salaryBatchAmount: normalizedSalaryBatchAmount(Number(value || defaultSalaryBatchAmount)) });
  }

  function resetSettings() {
    setSettings({ ...defaultSettings, customClients: [...defaultSettings.customClients], projectTags: [...defaultSettings.projectTags], projectStages: [...defaultSettings.projectStages], notifications: { ...defaultSettings.notifications }, integrations: { ...defaultSettings.integrations }, integrationAccounts: { ...defaultSettings.integrationAccounts }, integrationConfigs: JSON.parse(JSON.stringify(defaultIntegrationConfigs)), integrationLinks: {}, teamMembers: defaultSettings.teamMembers.map((m) => ({ ...m })), editorPermissions: { ...defaultSettings.editorPermissions }, rolePermissions: JSON.parse(JSON.stringify(defaultRolePermissions)) });
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
        <SettingsPanel title="Project Tags & Salary" subtitle="Customize project tags, the salary tag, payout amount, and videos needed per batch.">
            <Stack gap={1.1}>
              {settings.projectTags.map((tag, index) => (
                <Stack key={`project-tag-${index}`} direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} gap={1.2}>
                  <TextField
                    label={`Tag ${index + 1}`}
                    value={tag}
                    size="small"
                    fullWidth
                    error={Boolean(tagIssues && !tag.trim())}
                    onChange={(event) => updateProjectTag(index, event.target.value)}
                    inputProps={{ "aria-label": `Project tag ${index + 1}` }}
                  />
                  <Tooltip title="Remove tag">
                    <Button
                      size="small"
                      aria-label={`Remove project tag ${index + 1}`}
                      disabled={settings.projectTags.length <= 1}
                      onClick={() => removeProjectTag(index)}
                      sx={{ minWidth: 34, width: { xs: "100%", sm: 34 }, height: 34, color: "#bd3f37", p: 0 }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </Tooltip>
                </Stack>
              ))}
              <Button variant="outlined" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={addProjectTag} sx={outlineButtonSx}>
                Add Tag
              </Button>
              {tagIssues ? <Typography sx={{ color: "#bd3f37", fontSize: 13 }}>{tagIssues}</Typography> : null}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.2, pt: 0.8 }}>
                <DialogSelect
                  label="Salary Tag"
                  value={canonicalWorkType(settings.salaryWorkType, settings.projectTags)}
                  options={settings.projectTags}
                  onChange={(value) => setSettings({ ...settings, salaryWorkType: value })}
                />
                <TextField
                  label="Videos per salary batch"
                  type="number"
                  size="small"
                  value={normalizedSalaryBatchSize(settings.salaryBatchSize)}
                  onChange={(event) => updateSalaryBatchSize(event.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                  label="Salary per batch"
                  type="number"
                  size="small"
                  value={normalizedSalaryBatchAmount(settings.salaryBatchAmount)}
                  onChange={(event) => updateSalaryBatchAmount(event.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Box>
              <Typography sx={{ color: muted, fontSize: 12 }}>
                Completed projects tagged "{canonicalWorkType(settings.salaryWorkType, settings.projectTags)}" count toward {normalizedSalaryBatchSize(settings.salaryBatchSize)} videos per salary batch worth {money(normalizedSalaryBatchAmount(settings.salaryBatchAmount), settings.currencyCode)}.
              </Typography>
            </Stack>
          </SettingsPanel>
        <SettingsPanel title="Project Stages" subtitle="Default workflow stages for new work.">
            {settings.projectStages.map((stage, index) => (
              <Stack key={`project-stage-${index}`} direction="row" alignItems="center" gap={1.2}>
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
              onClick={() => setSettings({ ...settings, projectStages: [...settings.projectStages, nextStageName(settings.projectStages)] })}
              sx={outlineButtonSx}
            >
              Add Stage
            </Button>
            {stageIssues ? <Typography sx={{ color: "#bd3f37", fontSize: 13 }}>{stageIssues}</Typography> : null}
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
            <SettingsLink label="Toggle weekly summary" onClick={() => updateNotification("Weekly summary", !settings.notifications["Weekly summary"])} />
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
        <IntegrationLinkManager
          title="Integrations"
          subtitle="Save workspace-level links for storage, messaging, calendars, and review tools."
          links={settings.integrationLinks}
          emptyTitle="No integration links configured"
          emptyBody="Add links to shared folders, calendars, review pages, or team channels. This does not connect to external APIs."
          onChange={(integrationLinks) => {
            setSettings({ ...settings, integrationLinks });
            notify("Integration links updated.", "success");
          }}
        />
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
            {settings.teamMembers.length ? settings.teamMembers.map((member) => (
              <Box key={member.id} sx={{ display: "grid", gridTemplateColumns: "38px minmax(0, 1fr) auto", gap: 1.1, alignItems: "center", p: 1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: activeBg, color: accent, display: "grid", placeItems: "center", fontWeight: 760 }}>{initials(member.name)}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{member.name}</Typography>
                  <Typography noWrap sx={{ color: muted, fontSize: 12 }}>{member.email || "No email saved"}</Typography>
                </Box>
                <Chip label={member.role} size="small" sx={{ bgcolor: panel, border: `1px solid ${border}`, color: ink, borderRadius: "5px" }} />
              </Box>
            )) : <EmptyPanel title="No team members yet" body="Add team members from the Team page to populate this organization view." />}
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
  const { isSignedIn } = useData();
  const publishPublicProfile = useMutation(api.publicProfiles.publish);
  const timeline = [...projects]
    .sort((a, b) => dateTime(a.dueDate) - dateTime(b.dueDate))
    .slice(0, 5);
  const publicActiveProjects = publicMetric(settings.publicActiveProjects);
  const publicDeliveredEdits = publicMetric(settings.publicDeliveredEdits);
  const publicTurnaroundDays = Math.max(1, publicMetric(settings.publicTurnaroundDays, 3));
  const currentTurnaround = `${publicTurnaroundDays}`;
  const [shareCopied, setShareCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  async function shareProfile() {
    const slug = publicProfileSlug(settings);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/u/${slug}`;
    const text = `${profileDisplayName(settings)} - ${settings.profileTitle || "Video Editor"}`;
    try {
      if (!isSignedIn) throw new Error("Sign in to publish a public profile.");
      setShareMessage("");
      await publishPublicProfile({
        slug,
        studioName: settings.studioName,
        profileName: profileDisplayName(settings),
        profileUsername: slug,
        profileTitle: settings.profileTitle,
        profileBio: settings.profileBio,
        profileLocation: settings.profileLocation,
        profileImageUrl: settings.profileImageUrl,
        timeZone: settings.timeZone,
        activeProjects: publicActiveProjects,
        deliveredEdits: publicDeliveredEdits,
        avgTurnaroundDays: publicTurnaroundDays,
        projects: timeline.map((project) => ({
          title: project.title,
          status: project.status,
          workType: project.workType,
          dueDate: project.dueDate,
        })),
      });
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      if (await copyText(url)) {
        setShareCopied(true);
        setShareMessage(`Public profile published: /u/${slug}`);
        window.setTimeout(() => setShareCopied(false), 1400);
      }
    } catch (error) {
      setShareCopied(false);
      setShareMessage(error instanceof Error ? error.message : "Could not publish public profile.");
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
          <Button variant="outlined" startIcon={<PersonOutlineOutlinedIcon />} onClick={shareProfile} sx={outlineButtonSx}>{shareCopied ? "Published + Copied" : "Share Profile"}</Button>
          <Button component={Link} href="/settings" aria-label="Open profile settings" sx={{ minWidth: 36, width: 36, height: 36, color: ink, p: 0 }}><MoreHorizIcon /></Button>
        </Stack>
      </Stack>
      {shareMessage ? <Typography sx={{ color: shareMessage.startsWith("Public profile") ? accent : "#bd3f37", fontSize: 13, textAlign: "right", mb: 1 }}>{shareMessage}</Typography> : null}

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
            <Grid size={4}><ProfileMetric icon={<PlayArrowRoundedIcon />} label="Active Projects" sublabel="Public stat" value={String(publicActiveProjects)} /></Grid>
            <Grid size={4}><ProfileMetric icon={<CheckCircleOutlineIcon />} label="Delivered Edits" sublabel="Public stat" value={String(publicDeliveredEdits)} /></Grid>
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
            <TextField
              label="Profile Image URL"
              value={settings.profileImageUrl}
              size="small"
              fullWidth
              placeholder="https://example.com/photo.jpg"
              error={Boolean(settings.profileImageUrl.trim() && !isValidProfileImageSource(settings.profileImageUrl))}
              helperText={settings.profileImageUrl.trim() && !isValidProfileImageSource(settings.profileImageUrl) ? "Use an http(s) image URL or upload an image file." : ""}
              onChange={(event) => setSettings({ ...settings, profileImageUrl: event.target.value.trim() })}
            />
          </Box>
          <TextField label="Profile Bio" value={settings.profileBio} size="small" fullWidth multiline minRows={3} onChange={(event) => setSettings({ ...settings, profileBio: event.target.value })} />
          <TextField label="Profile Location" value={settings.profileLocation} size="small" fullWidth onChange={(event) => setSettings({ ...settings, profileLocation: event.target.value })} />
          <Paper sx={{ ...panelSx, p: 2, boxShadow: "none" }}>
            <Typography sx={{ color: ink, fontSize: 18, fontWeight: 760 }}>Public Profile Stats</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.5, mb: 1.5 }}>
              These are portfolio-facing numbers. They do not need to match your private tracker totals.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField
                label="Active Projects"
                type="number"
                value={publicMetric(settings.publicActiveProjects)}
                size="small"
                inputProps={{ min: 0, step: 1 }}
                onChange={(event) => setSettings({ ...settings, publicActiveProjects: publicMetric(Number(event.target.value)) })}
              />
              <TextField
                label="Delivered Edits"
                type="number"
                value={publicMetric(settings.publicDeliveredEdits)}
                size="small"
                inputProps={{ min: 0, step: 1 }}
                onChange={(event) => setSettings({ ...settings, publicDeliveredEdits: publicMetric(Number(event.target.value)) })}
              />
              <TextField
                label="Turnaround Days"
                type="number"
                value={Math.max(1, publicMetric(settings.publicTurnaroundDays, 3))}
                size="small"
                inputProps={{ min: 1, step: 1 }}
                onChange={(event) => setSettings({ ...settings, publicTurnaroundDays: Math.max(1, publicMetric(Number(event.target.value), 3)) })}
              />
            </Box>
          </Paper>
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
  const settings = useTrackerSettings();
  return (
    <Box sx={{ px: { xs: 2, md: 5, xl: 6 }, pt: 4, pb: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 36, color: ink, fontWeight: 760, lineHeight: 1.05, fontFamily: headingFont }}>{title}</Typography>
          <Typography sx={{ fontSize: 15, color: muted, mt: 1 }}>{subtitle}</Typography>
        </Box>
        <Stack direction="row" alignItems="center" justifyContent={{ xs: "space-between", sm: "flex-end" }} gap={1.5} sx={{ flexShrink: 0 }}>
          {action}
          <NotificationBell settings={settings} />
        </Stack>
      </Stack>
      {children}
    </Box>
  );
}

function NotificationBell({ settings }: { settings: SettingsState }) {
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const teamData = useQuery(api.team.getMyWorkspace, isConvexAuthenticated ? {} : "skip");
  const markNotificationRead = useMutation(api.team.markNotificationRead);
  const markAllNotificationsRead = useMutation(api.team.markAllNotificationsRead);
  const notificationOpen = Boolean(notificationAnchor);
  const enabledNotifications = Object.entries(settings.notifications).filter(([, enabled]) => enabled);
  const teamNotifications = teamData?.notifications ?? [];
  const unreadCount = teamNotifications.filter((notification) => !notification.read).length;
  const teamNotificationSyncUnavailable = Boolean(isUserLoaded && isSignedIn && !isConvexAuthLoading && !isConvexAuthenticated);

  return (
    <>
      <Tooltip title="Notifications">
        <Button
          aria-label="Open notifications"
          aria-haspopup="menu"
          aria-expanded={notificationOpen ? "true" : undefined}
          onClick={(event) => setNotificationAnchor(event.currentTarget)}
          sx={{ minWidth: 36, width: 36, height: 36, p: 0, color: ink, borderRadius: "6px", position: "relative" }}
        >
          <NotificationsNoneOutlinedIcon sx={{ color: ink }} />
          {unreadCount || enabledNotifications.length ? (
            <Box sx={{ position: "absolute", top: 6, right: 7, width: 8, height: 8, borderRadius: "50%", bgcolor: accent, border: `1px solid ${panel}` }} />
          ) : null}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={notificationAnchor}
        open={notificationOpen}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{ sx: { width: 290, bgcolor: panel, color: ink, border: `1px solid ${border}`, boxShadow: "none" } }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>Notifications</Typography>
            {teamData && unreadCount ? (
              <Button
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  markAllNotificationsRead({ teamId: teamData.workspace._id }).catch(() => undefined);
                }}
                sx={{ color: accent, fontSize: 11, fontWeight: 760, p: 0, minWidth: 0 }}
              >
                Mark all read
              </Button>
            ) : null}
          </Stack>
          <Typography sx={{ color: muted, fontSize: 12, mt: 0.25 }}>
            {isConvexAuthLoading ? "Connecting team notifications..." : teamNotificationSyncUnavailable ? "Team notifications are not connected" : teamNotifications.length ? `${unreadCount} unread team notification${unreadCount === 1 ? "" : "s"}` : enabledNotifications.length ? `${enabledNotifications.length} notification types enabled` : "No notifications yet"}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: border }} />
        {isConvexAuthLoading ? (
          <Box sx={{ px: 1.5, py: 1.2 }}>
            <Typography sx={{ color: muted, fontSize: 12, lineHeight: 1.45 }}>Waiting for Convex auth before loading Team notifications.</Typography>
          </Box>
        ) : teamNotificationSyncUnavailable ? (
          <Box sx={{ px: 1.5, py: 1.2 }}>
            <Typography sx={{ color: "#9f3029", fontSize: 12, lineHeight: 1.45 }}>Clerk is signed in, but Convex auth is not connected. Check Team sync before relying on shared notifications.</Typography>
          </Box>
        ) : teamNotifications.length ? teamNotifications.slice(0, 8).map((notification) => (
          <MenuItem key={notification._id} sx={{ display: "block", color: ink, py: 1, bgcolor: notification.read ? panel : activeBg }}>
            <Typography sx={{ fontSize: 13, fontWeight: 720 }}>{notification.message}</Typography>
            <Typography sx={{ color: muted, fontSize: 12, mt: 0.25 }}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(notification.createdAt))}</Typography>
            <Button
              component={Link}
              href="/team"
              size="small"
              onClick={() => {
                setNotificationAnchor(null);
                if (!notification.read) {
                  void markNotificationRead({ notificationId: notification._id });
                }
              }}
              sx={{ color: accent, fontSize: 11, fontWeight: 760, mt: 0.4, mr: 1, p: 0, minWidth: 0 }}
            >
              Open Team
            </Button>
            {!notification.read ? (
              <Button
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  markNotificationRead({ notificationId: notification._id }).catch(() => undefined);
                }}
                sx={{ color: accent, fontSize: 11, fontWeight: 760, mt: 0.4, p: 0, minWidth: 0 }}
              >
                Mark read
              </Button>
            ) : null}
          </MenuItem>
        )) : enabledNotifications.length ? enabledNotifications.map(([name]) => (
          <MenuItem key={name} sx={{ display: "block", color: ink, py: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 720 }}>{name}</Typography>
            <Typography sx={{ color: muted, fontSize: 12 }}>{notificationCopy(name)}</Typography>
          </MenuItem>
        )) : (
          <Box sx={{ px: 1.5, py: 1.2 }}>
            <Typography sx={{ color: muted, fontSize: 12, lineHeight: 1.45 }}>Turn on deadline, feedback, or weekly summary notifications from Settings.</Typography>
          </Box>
        )}
        <Divider sx={{ borderColor: border }} />
        <MenuItem component={Link} href="/settings" onClick={() => setNotificationAnchor(null)} sx={{ color: accent, fontSize: 13, fontWeight: 760 }}>
          Manage Notifications
        </MenuItem>
      </Menu>
    </>
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

function buildClientSummaries(projects: WorkItem[], savedClients: string[] = []) {
  const groups = new Map<string, { name: string; projects: WorkItem[] }>();
  for (const client of savedClients) {
    const clientName = client.trim();
    if (!clientName) continue;
    groups.set(clientName.toLowerCase(), { name: clientName, projects: [] });
  }
  for (const project of projects) {
    const clientName = project.client?.trim();
    if (!clientName) continue;
    const key = clientName.toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.projects.push(project);
    } else {
      groups.set(key, { name: clientName, projects: [project] });
    }
  }

  return [...groups.values()]
    .map(({ name, projects: clientProjects }) => {
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

function ProjectRow({ project, canEdit, canDelete, onView, onEdit, onDelete }: { project: WorkItem; canEdit: boolean; canDelete: boolean; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const settings = useTrackerSettings();
  const amount = isSalaryWorkType(project.workType, settings) ? "Batch tracked" : money(project.earnings, settings.currencyCode);
  const progress = projectProgress(project.status);

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`View details for ${project.title}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView();
        }
      }}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", lg: "minmax(300px, 1.6fr) 1fr 150px 130px 130px 140px 120px" },
        gap: 2,
        alignItems: "center",
        px: 2,
        py: 1.5,
        bgcolor: panel,
        cursor: "pointer",
        outline: "none",
        transition: "background-color 140ms ease",
        "&:hover": { bgcolor: hoverBg },
        "&:focus-visible": { boxShadow: `inset 0 0 0 2px ${accent}` }
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
        <Tooltip title={canEdit ? "Edit project" : "Your role can view this project only"}>
          <Button size="small" aria-label={`Edit ${project.title}`} disabled={!canEdit} onClick={(event) => { event.stopPropagation(); onEdit(); }} onKeyDown={(event) => event.stopPropagation()} sx={{ minWidth: 34, width: 34, height: 34, color: muted, p: 0 }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </Button>
        </Tooltip>
        <Tooltip title={canDelete ? "Delete project" : "Only project owners or team owners can delete this project"}>
          <Button size="small" aria-label={`Delete ${project.title}`} disabled={!canDelete} onClick={(event) => { event.stopPropagation(); onDelete(); }} onKeyDown={(event) => event.stopPropagation()} sx={{ minWidth: 34, width: 34, height: 34, color: "#bd3f37", p: 0 }}>
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

function ProjectDetailDialog({ project, settings, canEdit, canDelete, canUpdateStatus, canComment, teamMembers, onClose, onEdit, onDelete, onStatusChange }: { project: WorkItem | null; settings: SettingsState; canEdit: boolean; canDelete: boolean; canUpdateStatus: boolean; canComment: boolean; teamMembers: WorkspaceMemberOption[]; onClose: () => void; onEdit: (project: WorkItem) => void; onDelete: (project: WorkItem) => void; onStatusChange: (project: WorkItem, status: string) => void }) {
  if (!project) {
    return null;
  }

  const progress = projectProgress(project.status);
  const amount = isSalaryWorkType(project.workType, settings) ? "Batch tracked" : money(project.earnings, settings.currencyCode);
  const configuredLinks = integrationServices
    .map((service) => ({ service, link: project.integrationLinks?.[service.id] }))
    .filter(({ link }) => hasIntegrationLink(link));

  function openLink(url: string) {
    if (typeof window === "undefined" || !isValidIntegrationUrl(url)) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "10px", overflow: "hidden" } }}>
      <DialogTitle sx={{ p: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ px: { xs: 2, md: 3 }, py: 2.2, borderBottom: `1px solid ${border}` }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 0.9, flexWrap: "wrap" }}>
              <StatusChip status={project.status} />
              <Chip label={project.workType} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px", fontWeight: 720 }} />
              {configuredLinks.length ? <Chip label={`${configuredLinks.length} links`} size="small" sx={{ bgcolor: softPanel, color: muted, borderRadius: "5px", fontWeight: 720 }} /> : null}
            </Stack>
            <Typography sx={{ color: ink, fontSize: { xs: 24, md: 30 }, fontWeight: 760, lineHeight: 1.1 }}>{project.title}</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 0.7 }}>{project.client || "No client saved"}</Typography>
          </Box>
          <Button aria-label="Close project details" onClick={onClose} sx={{ minWidth: 34, width: 34, height: 34, color: muted, p: 0 }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.2, mb: 2 }}>
          <ProjectDetailMetric label="Start" value={formatDate(project.startDate, settings.dateFormat)} />
          <ProjectDetailMetric label="Due" value={formatDate(project.dueDate, settings.dateFormat)} />
          <ProjectDetailMetric label="Amount" value={amount} />
        </Box>
        <Paper sx={{ ...panelSx, p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>Progress</Typography>
            <Typography sx={{ color: priorityColor(project), fontSize: 13, fontWeight: 760 }}>{projectPriority(project)}</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 7, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.2} sx={{ mt: 1 }}>
            <Typography sx={{ color: muted, fontSize: 12 }}>{progress}% complete</Typography>
            {canUpdateStatus ? <CompactSelect value={project.status} options={statusOptions} onChange={(status) => onStatusChange(project, status)} width={{ xs: "100%", sm: 170 }} /> : null}
          </Stack>
        </Paper>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" }, gap: 2 }}>
          <Paper sx={{ ...panelSx, p: 2 }}>
            <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>Notes</Typography>
            <Typography sx={{ color: project.notes ? ink : muted, fontSize: 13, mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {project.notes || "No notes saved for this project yet."}
            </Typography>
          </Paper>
          <Paper sx={{ ...panelSx, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
              <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>Resources</Typography>
              <Chip label={configuredIntegrationCount(project.integrationLinks)} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px" }} />
            </Stack>
            <Stack gap={1}>
              {configuredLinks.length ? configuredLinks.map(({ service, link }) => link ? (
                <Box key={service.id} sx={{ p: 1.1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{integrationDisplayText(link, service.name)}</Typography>
                      <Typography noWrap sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{service.name}</Typography>
                    </Box>
                    <Tooltip title={`Open ${service.name}`}>
                      <Button aria-label={`Open ${service.name} link`} onClick={() => openLink(link.url)} sx={{ minWidth: 34, width: 34, height: 34, color: accent, p: 0 }}>
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </Button>
                    </Tooltip>
                  </Stack>
                  {link.notes ? <Typography sx={{ color: muted, fontSize: 12, mt: 0.8, lineHeight: 1.45 }}>{link.notes}</Typography> : null}
                </Box>
              ) : null) : (
                <Typography sx={{ color: muted, fontSize: 13 }}>No project links saved yet.</Typography>
              )}
            </Stack>
          </Paper>
        </Box>
        <ProjectDetailCollaborationPanel project={project} teamMembers={teamMembers} canComment={canComment} />
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: `1px solid ${border}` }}>
        {canDelete ? <Button onClick={() => onDelete(project)} sx={{ color: "#bd3f37" }}>Delete</Button> : null}
        {canEdit ? <Button onClick={() => onEdit(project)} variant="outlined" sx={outlineButtonSx}>Edit Project</Button> : <Typography sx={{ color: muted, fontSize: 13 }}>Your team role can view this project but cannot edit it.</Typography>}
      </DialogActions>
    </Dialog>
  );
}

function ProjectDetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ ...panelSx, p: 1.6 }}>
      <Typography sx={{ color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ color: ink, fontSize: 15, fontWeight: 760, mt: 0.6 }}>{value}</Typography>
    </Paper>
  );
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function ProjectDetailCollaborationPanel({ project, teamMembers, canComment }: { project: WorkItem; teamMembers: WorkspaceMemberOption[]; canComment: boolean }) {
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const addProjectComment = useMutation(api.team.addProjectComment);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const projectComments = useQuery(
    api.team.listProjectComments,
    isConvexAuthenticated && project.teamId ? { teamId: project.teamId, projectId: project.id } : "skip"
  );
  const assignedMembers = teamMembers.filter((member) => (project.assigneeUserIds ?? []).includes(member.userId));

  async function postComment() {
    if (!isConvexAuthenticated || !project.teamId || !commentBody.trim()) return;
    setCommentError("");
    try {
      await addProjectComment({ teamId: project.teamId, projectId: project.id, body: commentBody });
      setCommentBody("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Could not post comment.");
    }
  }

  if (!project.teamId) {
    return null;
  }

  return (
    <Paper sx={{ ...panelSx, p: 2, mt: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.2} sx={{ mb: 1.4 }}>
        <Box>
          <Typography sx={{ color: ink, fontSize: 16, fontWeight: 760 }}>Team Collaboration</Typography>
          <Typography sx={{ color: muted, fontSize: 12.5, mt: 0.35 }}>Assignments and project comments sync to the team workspace.</Typography>
        </Box>
        <Stack direction="row" gap={0.6} flexWrap="wrap" sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}>
          {assignedMembers.length ? assignedMembers.map((member) => (
            <Chip key={member.userId} label={member.name || member.email} size="small" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px", fontWeight: 720 }} />
          )) : <Chip label="Unassigned" size="small" sx={{ bgcolor: softPanel, color: muted, borderRadius: "5px" }} />}
        </Stack>
      </Stack>

      <Stack gap={1} sx={{ maxHeight: 280, overflow: "auto", mb: 1.2 }}>
        {isConvexAuthLoading ? (
          <Typography sx={{ color: muted, fontSize: 13 }}>Connecting Team comments...</Typography>
        ) : !isConvexAuthenticated ? (
          <Typography sx={{ color: "#9f3029", fontSize: 13 }}>Team comments require Convex auth. Check Team sync before posting comments.</Typography>
        ) : projectComments === undefined ? (
          <Typography sx={{ color: muted, fontSize: 13 }}>Loading comments...</Typography>
        ) : projectComments.length ? projectComments.map((comment) => (
          <Box key={comment._id} sx={{ p: 1.15, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
            <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>
              {comment.authorName} <Box component="span" sx={{ color: muted, fontSize: 11, fontWeight: 500 }}>{formatShortDateTime(comment.createdAt)}</Box>
            </Typography>
            <Typography sx={{ color: ink, fontSize: 13, mt: 0.5, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{comment.body}</Typography>
          </Box>
        )) : (
          <Typography sx={{ color: muted, fontSize: 13 }}>No comments yet. Add a note for the team or mention someone with @name.</Typography>
        )}
      </Stack>

      {canComment ? (
        <Stack direction={{ xs: "column", md: "row" }} gap={1}>
          <TextField
            label="Team comment"
            value={commentBody}
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: TEAM_PROJECT_COMMENT_LIMIT } }}
            onChange={(event) => setCommentBody(event.target.value)}
            helperText={commentError || `${commentBody.length}/${TEAM_PROJECT_COMMENT_LIMIT} characters · Use @name or @emailname to notify a teammate.`}
            error={Boolean(commentError)}
          />
          <Button variant="contained" sx={{ bgcolor: accent, minWidth: 112, "&:hover": { bgcolor: accent } }} disabled={!isConvexAuthenticated || !commentBody.trim()} onClick={postComment}>Post</Button>
        </Stack>
      ) : (
        <Typography sx={{ color: muted, fontSize: 13 }}>Your team role can view comments but cannot add new ones.</Typography>
      )}
    </Paper>
  );
}

function ProjectDialog({
  open,
  editing,
  form,
  setForm,
  formError,
  clientOptions,
  workTypeOptions,
  settings,
  teamMembers,
  onClose,
  onSave
}: {
  open: boolean;
  editing: boolean;
  form: WorkItem;
  setForm: (form: WorkItem) => void;
  formError: string;
  clientOptions: string[];
  workTypeOptions: string[];
  settings: SettingsState;
  teamMembers: WorkspaceMemberOption[];
  onClose: () => void;
  onSave: () => void;
}) {
  const selectedWorkType = workTypeOptions.some((option) => option.toLowerCase() === form.workType.toLowerCase()) ? canonicalWorkType(form.workType, workTypeOptions) : workTypeOptions[0];
  const typeConfig = getTypeConfig(selectedWorkType, settings);
  const assignedMembers = teamMembers.filter((member) => (form.assigneeUserIds ?? []).includes(member.userId));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: panel, color: ink, border: `1px solid ${border}`, borderRadius: "8px" } }}>
      <DialogTitle sx={{ fontSize: 24, fontWeight: 760 }}>{editing ? "Edit Project" : "New Project"}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField label="Project name" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth />
          <Autocomplete
            freeSolo
            selectOnFocus
            clearOnBlur={false}
            handleHomeEndKeys
            options={clientOptions}
            noOptionsText="Type a new client name"
            value={form.client || ""}
            inputValue={form.client || ""}
            onInputChange={(_, value) => setForm({ ...form, client: value })}
            onChange={(_, value) => setForm({ ...form, client: canonicalClientName(typeof value === "string" ? value : "", clientOptions) })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client"
                placeholder={clientOptions.length ? "Choose existing or type new client" : "Type a new client name"}
                helperText={clientSuggestionText(form.client || "", clientOptions)}
                fullWidth
              />
            )}
          />
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <DialogSelect label="Status" value={form.status} options={statusOptions} onChange={(value) => setForm({ ...form, status: value })} />
            <DialogSelect label="Tag" value={selectedWorkType} options={workTypeOptions} onChange={(value) => setForm({ ...form, workType: value, earnings: 0 })} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <DatePickerField label="Start date" value={form.startDate} settings={settings} onChange={(value) => setForm({ ...form, startDate: value })} />
            <DatePickerField label="Due date" value={form.dueDate} settings={settings} onChange={(value) => setForm({ ...form, dueDate: value })} />
          </Stack>
          <TextField label="Earnings" type="number" value={form.earnings} disabled={typeConfig.earningsMode === "batch"} helperText={typeConfig.earningsMode === "batch" ? `${settings.salaryWorkType} earnings are batch tracked in settings.` : ""} onChange={(event) => setForm({ ...form, earnings: Number(event.target.value || 0) })} fullWidth />
          <TextField label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} fullWidth multiline minRows={3} />
          {form.teamId && teamMembers.length ? (
            <Autocomplete
              multiple
              options={teamMembers}
              value={assignedMembers}
              isOptionEqualToValue={(option, value) => option.userId === value.userId}
              getOptionLabel={(option) => option.name || option.email || "Team member"}
              onChange={(_, members) => setForm({ ...form, assigneeUserIds: members.map((member) => member.userId) })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assigned team members"
                  helperText="Assigned members receive project notifications when this project changes."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.userId}>
                  <Box>
                    <Typography sx={{ color: ink, fontSize: 13, fontWeight: 720 }}>{option.name}</Typography>
                    <Typography sx={{ color: muted, fontSize: 12 }}>{option.role} · {option.email || "No email"}</Typography>
                  </Box>
                </Box>
              )}
            />
          ) : null}
          <IntegrationLinkManager
            title="Project Integrations"
            subtitle="Attach service links that belong only to this project."
            links={form.integrationLinks}
            emptyTitle="No project links"
            emptyBody="Add links to this project's folders, reviews, channels, or calendar events."
            onChange={(integrationLinks) => setForm({ ...form, integrationLinks })}
          />
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
          {project ? `"${project.title}" will be removed from your tracker.` : "This project will be removed from your tracker."}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} sx={{ color: muted }}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" sx={{ bgcolor: "#bd3f37", color: "#fff", "&:hover": { bgcolor: "#a9342d" } }}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogSelect({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event: SelectChangeEvent) => onChange(event.target.value)}>
        {options.map((option) => <MenuItem key={option} value={option}>{labels?.[option] ?? option}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

function DatePickerField({ label, value, settings, onChange }: { label: string; value: string; settings: SettingsState; onChange: (value: string) => void }) {
  const selected = isIsoDate(value) ? new Date(`${value}T00:00:00`) : todayDate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const open = Boolean(anchor);
  const monthDays = calendarMonthDays(visibleMonth, settings.weekStart);
  const weekdays = orderedWeekdays(settings.weekStart);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth);

  function shiftMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function chooseDate(next: string) {
    onChange(next);
    setAnchor(null);
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography sx={{ color: muted, fontSize: 12, fontWeight: 680, mb: 0.7 }}>{label}</Typography>
      <Button
        fullWidth
        variant="outlined"
        startIcon={<CalendarTodayOutlinedIcon sx={{ fontSize: 17 }} />}
        onClick={(event) => {
          const nextSelected = isIsoDate(value) ? new Date(`${value}T00:00:00`) : todayDate();
          setVisibleMonth(new Date(nextSelected.getFullYear(), nextSelected.getMonth(), 1));
          setAnchor(event.currentTarget);
        }}
        sx={{ justifyContent: "flex-start", borderColor: border, color: ink, bgcolor: controlPanel, height: 46, borderRadius: "6px", fontSize: 14, fontWeight: 650, "&:hover": { borderColor: accent, bgcolor: hoverBg } }}
      >
        {isIsoDate(value) ? formatDate(value, settings.dateFormat) : "Choose date"}
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { width: 330, maxWidth: "calc(100vw - 32px)", p: 1.2, bgcolor: panel, color: ink, border: `1px solid ${border}`, boxShadow: "none" } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.4, mb: 1 }}>
          <Button size="small" aria-label={`Previous ${label.toLowerCase()} month`} onClick={() => shiftMonth(-1)} sx={{ minWidth: 32, color: accent, border: `1px solid ${border}` }}>‹</Button>
          <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{monthLabel}</Typography>
          <Button size="small" aria-label={`Next ${label.toLowerCase()} month`} onClick={() => shiftMonth(1)} sx={{ minWidth: 32, color: accent, border: `1px solid ${border}` }}>›</Button>
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 0.4 }}>
          {weekdays.map((day) => (
            <Typography key={day} sx={{ color: muted, fontSize: 10, fontWeight: 760, textAlign: "center", textTransform: "uppercase", py: 0.5 }}>{day}</Typography>
          ))}
          {monthDays.map((day) => {
            const key = iso(day.date);
            const selectedDay = key === value;
            const isCurrentMonth = day.date.getMonth() === visibleMonth.getMonth();
            const isToday = key === iso(todayDate());
            return (
              <Button
                key={key}
                aria-label={`Choose ${formatDate(key, settings.dateFormat)} for ${label}`}
                onClick={() => chooseDate(key)}
                sx={{
                  minWidth: 0,
                  height: 36,
                  borderRadius: "6px",
                  color: selectedDay ? "#fff" : isCurrentMonth ? ink : muted,
                  bgcolor: selectedDay ? accent : isToday ? activeBg : "transparent",
                  border: isToday && !selectedDay ? `1px solid ${accent}` : "1px solid transparent",
                  fontSize: 12,
                  fontWeight: selectedDay || isToday ? 760 : 650,
                  opacity: isCurrentMonth ? 1 : 0.48,
                  "&:hover": { bgcolor: selectedDay ? accent : hoverBg }
                }}
              >
                {day.date.getDate()}
              </Button>
            );
          })}
        </Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Button size="small" onClick={() => chooseDate(iso(todayDate()))} sx={{ color: accent, fontSize: 12 }}>Today</Button>
          <Button size="small" onClick={() => setAnchor(null)} sx={{ color: muted, fontSize: 12 }}>Close</Button>
        </Stack>
      </Menu>
    </Box>
  );
}

function validateProject(item: WorkItem, type: WorkTypeConfig, workTypeOptions: string[]) {
  if (!item.title.trim()) return "Project name is required.";
  if (!statusOptions.includes(item.status as ProjectStatus)) return "Choose a valid project status.";
  if (!workTypeOptions.some((option) => option.toLowerCase() === item.workType.trim().toLowerCase())) return "Choose a valid project tag.";
  if (!item.startDate || !item.dueDate) return "Start and due dates are required.";
  if (!isIsoDate(item.startDate) || !isIsoDate(item.dueDate)) return "Use valid start and due dates.";
  if (dateTime(item.startDate) > dateTime(item.dueDate)) return "Due date must be on or after start date.";
  if (type.earningsMode !== "batch" && safeMoneyValue(item.earnings) < 0) return "Earnings must be zero or higher.";
  const invalidLink = integrationServices.find((service) => {
    const link = item.integrationLinks?.[service.id];
    return link?.url && !isValidIntegrationUrl(link.url);
  });
  if (invalidLink) return `${invalidLink.name} needs a valid http or https URL.`;
  return "";
}

function normalizeProjectIntegrationLinks(links: IntegrationLinks | undefined): IntegrationLinks {
  const normalized: IntegrationLinks = {};
  for (const service of integrationServices) {
    const link = normalizeIntegrationLink(links?.[service.id]);
    if (!link.url && !link.label && !link.notes) continue;
    if (!isIntegrationServiceId(service.id)) continue;
    normalized[service.id] = link;
  }
  return normalized;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidProfileImageSource(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("data:image/") || isValidUrl(trimmed);
}

function validateIntegrationConfig(name: string, config: IntegrationConfig) {
  if (!config.account.trim()) return "Account email or name is required.";
  if (requiresAccountEmail(name) && !isValidEmail(config.account)) {
    return "Enter a valid account email address.";
  }
  if (name === "Slack" && config.webhookUrl.trim() && !isValidUrl(config.webhookUrl)) {
    return "Enter a valid webhook URL or leave it blank.";
  }
  return "";
}

function requiresAccountEmail(name: string) {
  return name === "Google Drive";
}

function projectStageIssues(stages: string[]) {
  if (stages.some((stage) => !stage.trim())) return "Workflow stages cannot be blank.";
  const normalized = stages.map((stage) => stage.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) return "Workflow stages must be unique.";
  return "";
}

function projectTagIssues(tags: string[]) {
  if (!tags.length) return "At least one project tag is required.";
  if (tags.some((tag) => !tag.trim())) return "Project tags cannot be blank.";
  const normalized = tags.map((tag) => tag.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) return "Project tags must be unique.";
  return "";
}

function nextStageName(stages: string[]) {
  const names = new Set(stages.map((stage) => stage.trim().toLowerCase()));
  let index = 1;
  while (names.has(`new stage ${index}`)) index += 1;
  return `New Stage ${index}`;
}

function nextProjectTagName(tags: string[]) {
  const names = new Set(tags.map((tag) => tag.trim().toLowerCase()));
  let index = 1;
  while (names.has(`custom tag ${index}`)) index += 1;
  return `Custom Tag ${index}`;
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






function getTypeConfig(label: string, settings: SettingsState) {
  if (isSalaryWorkType(label, settings)) return { label, earningsMode: "batch" as const };
  return profile.typeOptions.find((type) => type.label.toLowerCase() === label.toLowerCase()) ?? { label, earningsMode: "manual" as const };
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

function normalizedSalaryBatchSize(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : defaultSalaryBatchSize;
}

function normalizedSalaryBatchAmount(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : defaultSalaryBatchAmount;
}

function projectWorkTypeOptions(settings: SettingsState, projects: WorkItem[] = []) {
  const values = [...settings.projectTags, settings.salaryWorkType, ...projects.map((project) => project.workType)];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.length ? result : [...defaultProjectTags];
}

function isSalaryWorkType(value: string, settings: SettingsState) {
  return value.trim().toLowerCase() === settings.salaryWorkType.trim().toLowerCase();
}

function canonicalWorkType(value: string, options: string[]) {
  const trimmed = value.trim();
  return options.find((option) => option.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

function buildClientOptions(projects: WorkItem[], savedClients: string[] = []) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const savedClient of savedClients) {
    const client = savedClient.trim();
    const key = client.toLowerCase();
    if (!client || seen.has(key)) continue;
    seen.add(key);
    result.push(client);
  }
  for (const project of projects) {
    const client = project.client?.trim();
    const key = client?.toLowerCase();
    if (!client || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(client);
  }
  return result.sort((a, b) => a.localeCompare(b));
}

function findExistingClientName(value: string, clientOptions: string[]) {
  const key = value.trim().toLowerCase();
  if (!key) return "";
  return clientOptions.find((client) => client.toLowerCase() === key) ?? "";
}

function canonicalClientName(value: string, clientOptions: string[], forceExistingCapitalization = true) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const existing = findExistingClientName(trimmed, clientOptions);
  return existing && forceExistingCapitalization ? existing : trimmed;
}

function isSameClient(a: string | undefined, b: string) {
  return (a || "").trim().toLowerCase() === b.trim().toLowerCase();
}

function clientSuggestionText(value: string, clientOptions: string[]) {
  const trimmed = value.trim();
  const existing = findExistingClientName(trimmed, clientOptions);
  if (existing && existing !== trimmed) return `Will use existing client "${existing}" instead of creating a duplicate.`;
  return clientOptions.length ? "Select an existing client or type a new client name." : "Typing a client name creates it when the project is saved.";
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

function publicProfileSlug(settings: SettingsState) {
  return sanitizeUsername(settings.profileUsername || settings.profileName || settings.studioName || "editor").slice(0, 40) || "editor";
}

function publicMetric(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
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


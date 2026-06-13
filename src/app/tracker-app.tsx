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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
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
import Link from "next/link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { DEFAULT_PROFILE_ID } from "@/lib/profiles";
import type { WorkItem, ResourceLink, SalaryBatch } from "@/lib/types";
import { PROJECT_TEMPLATES, type ProjectTemplate } from "@/lib/project-templates";
import { cutlab } from "./design-system";
import { CutLabLockup, CutLabMark } from "./cutlab-brand";

// Base Config
const AUTH_MODE_STORAGE_KEY = "cutlab-studio:auth-mode:v1";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "cutlab-studio:sidebar-collapsed:v1";

const sidebarWidth = 270;
const collapsedSidebarWidth = 84;

// Colors & Styling Variables matching a state-of-the-art dark studio console
const canvasBg = "#07090C";
const panelBg = "rgba(18, 22, 28, 0.75)";
const softPanelBg = "rgba(28, 34, 43, 0.4)";
const borderStroke = "rgba(255, 255, 255, 0.08)";
const highlightBorder = "rgba(45, 140, 151, 0.3)";
const inkText = "#F3F4F6";
const mutedText = "#9CA3AF";
const accentColor = "#2D8C97";
const hoverBg = "rgba(105, 196, 206, 0.09)";
const progressTrack = "#293139";
const accentGradient = "linear-gradient(135deg, #2D8C97 0%, #69C4CE 100%)";
const dangerGradient = "linear-gradient(135deg, #FF5B5B 0%, #FF8E8E 100%)";
const successGradient = "linear-gradient(135deg, #23B58E 0%, #5CE1BC 100%)";

const glassmorphismStyle = {
  bgcolor: panelBg,
  backdropFilter: "blur(20px)",
  border: `1px solid ${borderStroke}`,
  borderRadius: "16px",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

type PageKey =
  | "dashboard"
  | "projects"
  | "clients"
  | "timeline"
  | "calendar"
  | "media"
  | "resources"
  | "feedback"
  | "templates"
  | "reports"
  | "integrations"
  | "team"
  | "team-chat"
  | "settings"
  | "account"
  | "profile"
  | "profile-edit"
  | "organization-profile";

type NavigationItem = {
  key: PageKey;
  href: string;
  label: string;
  icon: React.ReactNode;
  pages: PageKey[];
};

const navigationItems: NavigationItem[] = [
  { key: "dashboard", href: "/", label: "Dashboard", icon: <GridViewOutlinedIcon />, pages: ["dashboard"] },
  { key: "projects", href: "/projects", label: "Projects", icon: <FolderOpenOutlinedIcon />, pages: ["projects"] },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: <InsertChartOutlinedIcon />, pages: ["timeline"] },
  { key: "calendar", href: "/calendar", label: "Calendar", icon: <CalendarTodayOutlinedIcon />, pages: ["calendar"] },
  { key: "clients", href: "/clients", label: "Clients", icon: <PeopleAltOutlinedIcon />, pages: ["clients", "feedback"] },
  { key: "media", href: "/media", label: "Library", icon: <CollectionsOutlinedIcon />, pages: ["media", "resources", "templates"] },
  { key: "reports", href: "/reports", label: "Reports", icon: <InsertChartOutlinedIcon />, pages: ["reports"] },
  { key: "team", href: "/team", label: "Team", icon: <PeopleAltOutlinedIcon />, pages: ["team", "team-chat"] },
  { key: "settings", href: "/settings", label: "Settings", icon: <SettingsOutlinedIcon />, pages: ["settings", "account"] }
];

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
  theme: string;
  accentColor: string;
  density: string;
};

type ToastState = {
  message: string;
  tone: "success" | "info" | "warning";
};

// Utilities
function createId() {
  return Math.random().toString(36).substring(2, 11);
}

function safeMoneyValue(val: any): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDoneStatus(status: string) {
  return ["delivered", "done", "paid", "completed", "final"].some((s) => status?.toLowerCase().includes(s));
}

const SettingsContext = createContext<SettingsState>({
  studioName: "CutLab Studio",
  profileName: "Editor",
  profileUsername: "editor",
  profileTitle: "Creative Editor",
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
  projectTags: ["Job / Salary", "Freelance", "Personal Channel"],
  salaryWorkType: "Job / Salary",
  salaryBatchSize: 20,
  salaryBatchAmount: 10000,
  projectStages: ["Planned", "In Progress", "Review", "Delivered"],
  notifications: {},
  integrations: {},
  theme: "Dark",
  accentColor: accentColor,
  density: "Comfortable"
});

export function TrackerApp({ page }: { page: PageKey }) {
  const {
    items,
    setItems,
    settings,
    setSettings,
    resourceLinks,
    setResourceLinks,
    isSignedIn,
    toast,
    setToast,
    reconcileSalaryBatches,
  } = useData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [form, setForm] = useState<WorkItem>({
    id: "",
    profileId: DEFAULT_PROFILE_ID,
    title: "",
    client: "",
    status: "Planned",
    workType: "Freelance",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    earnings: 0,
    notes: ""
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
  }, []);

  const projects = useMemo(() => items.filter((item: WorkItem) => (item.profileId || DEFAULT_PROFILE_ID) === DEFAULT_PROFILE_ID), [items]);

  useEffect(() => {
    if (projects.length) {
      reconcileSalaryBatches(projects);
    }
  }, [projects, reconcileSalaryBatches]);

  const activeCount = projects.filter((p) => !isDoneStatus(p.status)).length;
  const deliveredCount = projects.filter((p) => isDoneStatus(p.status)).length;
  const totalEarnings = projects.filter((p) => isDoneStatus(p.status)).reduce((acc, p) => acc + (p.earnings || 0), 0);

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const matchesSearch = !query || `${item.title} ${item.client || ""} ${item.notes}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesClient = clientFilter === "ALL" || item.client === clientFilter;
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [projects, query, statusFilter, clientFilter]);

  const clientOptions = useMemo(() => {
    const clients = new Set(projects.map((p) => p.client).filter(Boolean));
    return ["ALL", ...Array.from(clients)] as string[];
  }, [projects]);

  function notify(message: string, tone: ToastState["tone"] = "success") {
    setToast({ message, tone });
  }

  function handleAddProject() {
    setForm({
      id: "",
      profileId: DEFAULT_PROFILE_ID,
      title: "",
      client: "",
      status: "Planned",
      workType: "Freelance",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      earnings: 0,
      notes: ""
    });
    setEditingId("");
    setDialogOpen(true);
  }

  function handleSaveProject() {
    if (!form.title) return;
    const isNew = !editingId;
    const payload: WorkItem = {
      ...form,
      id: editingId || createId(),
      createdAt: form.createdAt || new Date().toISOString(),
    };

    setItems((current) => (isNew ? [payload, ...current] : current.map((p) => (p.id === editingId ? payload : p))));
    setDialogOpen(false);
    notify(isNew ? "Project created successfully." : "Project updated successfully.");
  }

  function handleEdit(item: WorkItem) {
    setForm(item);
    setEditingId(item.id);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((p) => p.id !== id));
    notify("Project deleted.", "warning");
  }

  return (
    <SettingsContext.Provider value={settings}>
      <Box sx={{ minHeight: "100vh", bgcolor: canvasBg, color: inkText, display: "flex", fontFamily: "var(--font-inter)" }}>
        
        {/* Futuristic sidebar glass layout */}
        <Box
          component="aside"
          sx={{
            width: sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth,
            bgcolor: "rgba(10, 14, 18, 0.8)",
            backdropFilter: "blur(24px)",
            borderRight: `1px solid ${borderStroke}`,
            p: 3,
            display: "flex",
            flexDirection: "column",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 100
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 6 }}>
            {!sidebarCollapsed ? <CutLabLockup /> : <CutLabMark size={36} />}
            <Button
              onClick={() => {
                const next = !sidebarCollapsed;
                setSidebarCollapsed(next);
                window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
              }}
              sx={{
                minWidth: 36,
                height: 36,
                borderRadius: "50%",
                color: mutedText,
                border: `1px solid ${borderStroke}`,
                "&:hover": { color: inkText, bgcolor: softPanelBg }
              }}
            >
              {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </Button>
          </Stack>

          <Stack gap={1.5} sx={{ flex: 1 }}>
            {navigationItems.map((item) => {
              const active = item.pages.includes(page);
              return (
                <Button
                  key={item.key}
                  component={Link}
                  href={item.href}
                  startIcon={item.icon}
                  sx={{
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    color: active ? inkText : mutedText,
                    bgcolor: active ? "rgba(45, 140, 151, 0.12)" : "transparent",
                    border: active ? `1px solid ${highlightBorder}` : "1px solid transparent",
                    px: sidebarCollapsed ? 0 : 2.5,
                    py: 1.5,
                    borderRadius: "12px",
                    fontWeight: active ? 700 : 500,
                    textTransform: "none",
                    fontSize: 14,
                    transition: "all 0.2s ease",
                    "& .MuiButton-startIcon": { mr: sidebarCollapsed ? 0 : 2, color: active ? "#69C4CE" : mutedText },
                    "&:hover": { bgcolor: hoverBg, transform: "translateX(4px)" }
                  }}
                >
                  {!sidebarCollapsed && item.label}
                </Button>
              );
            })}
          </Stack>

          {!sidebarCollapsed && (
            <Box sx={{ borderTop: `1px solid ${borderStroke}`, pt: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: "50%", bg: accentGradient, display: "grid", placeItems: "center", fontWeight: 700, bgcolor: accentColor }}>
                {settings.profileName ? settings.profileName[0].toUpperCase() : "E"}
              </Box>
              <Box>
                <Typography sx={{ color: inkText, fontSize: 14, fontWeight: 700 }}>{settings.studioName || "Studio Center"}</Typography>
                <Typography sx={{ color: mutedText, fontSize: 11 }}>{settings.profileName || "Freelance Editor"}</Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Main Workspace Frame */}
        <Box component="main" sx={{ flex: 1, p: 5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Header Dashboard Info */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: cutlab.font.heading, letterSpacing: "-0.02em", color: inkText }}>
                {page.charAt(0).toUpperCase() + page.slice(1)} Control Room
              </Typography>
              <Typography sx={{ color: mutedText, fontSize: 14, mt: 0.5 }}>
                Real-time updates, interactive assets, and production pipeline logs.
              </Typography>
            </Box>
            <Stack direction="row" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddProject}
                sx={{
                  background: accentGradient,
                  color: "#000",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: "14px",
                  boxShadow: "0 0 20px rgba(45, 140, 151, 0.4)",
                  textTransform: "none",
                  fontSize: 14,
                  "&:hover": { transform: "scale(1.02)", boxShadow: "0 0 25px rgba(105, 196, 206, 0.6)" }
                }}
              >
                Create Project
              </Button>
            </Stack>
          </Stack>

          {/* Router Content Layouts */}
          {page === "dashboard" && (
            <DashboardOverhaulView
              projects={filteredProjects}
              activeCount={activeCount}
              deliveredCount={deliveredCount}
              totalEarnings={totalEarnings}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              clientFilter={clientFilter}
              setClientFilter={setClientFilter}
              clientOptions={clientOptions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {page === "projects" && (
            <ProjectsOverhaulView
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {page === "timeline" && <TimelineOverhaulView projects={projects} />}
          {page === "calendar" && <CalendarOverhaulView projects={projects} />}
          {page === "clients" && <ClientsOverhaulView projects={projects} />}
          {page === "media" && <MediaOverhaulView projects={projects} />}
          {page === "resources" && (
            <ResourcesOverhaulView
              resources={resourceLinks}
              setResources={setResourceLinks}
              projects={projects}
              notify={notify}
            />
          )}
          {page === "reports" && <ReportsOverhaulView projects={projects} />}
          {page === "team" && <TeamOverhaulView projects={projects} />}
          {page === "team-chat" && <TeamChatOverhaulView />}
          {page === "settings" && <SettingsOverhaulView settings={settings} setSettings={setSettings} notify={notify} />}
          {page === "profile" && <ProfileOverhaulView projects={projects} settings={settings} />}
        </Box>

        {/* Dynamic Project Editor Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { bgcolor: "rgba(18, 22, 28, 0.95)", border: `1px solid ${borderStroke}`, borderRadius: "20px", backdropFilter: "blur(32px)" } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: inkText, px: 4, pt: 4 }}>
            {editingId ? "Edit Production Record" : "Setup New Project"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, px: 4, pb: 2 }}>
            <TextField
              label="Project Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              variant="outlined"
              sx={{ input: { color: inkText } }}
            />
            <TextField
              label="Client Partner"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              fullWidth
              variant="outlined"
              sx={{ input: { color: inkText } }}
            />
            <Stack direction="row" gap={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: mutedText }}>Stage / Status</InputLabel>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  label="Stage / Status"
                  sx={{ color: inkText }}
                >
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Client Review">Review</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ color: mutedText }}>Channel / Tag</InputLabel>
                <Select
                  value={form.workType}
                  onChange={(e) => setForm({ ...form, workType: e.target.value })}
                  label="Channel / Tag"
                  sx={{ color: inkText }}
                >
                  {settings.projectTags.map((tag: string) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" gap={2}>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                fullWidth
                sx={{ input: { color: inkText } }}
              />
              <TextField
                type="date"
                label="Target Deadline"
                InputLabelProps={{ shrink: true }}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                fullWidth
                sx={{ input: { color: inkText } }}
              />
            </Stack>
            <TextField
              label="Earnings Value"
              type="number"
              value={form.earnings}
              onChange={(e) => setForm({ ...form, earnings: Number(e.target.value) })}
              fullWidth
              sx={{ input: { color: inkText } }}
            />
            <TextField
              label="Creative Brief Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              rows={4}
              sx={{ textarea: { color: inkText } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 4 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: mutedText }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveProject} sx={{ background: accentGradient, color: "#000", fontWeight: 700 }}>
              Apply Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Actions Notification */}
        {toast && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 32,
              right: 32,
              p: 2.5,
              background: "rgba(18, 22, 28, 0.95)",
              border: `1px solid ${toast.tone === "warning" ? "#FF5B5B" : "#23B58E"}`,
              borderRadius: "14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 9999
            }}
          >
            <Typography sx={{ fontWeight: 700, color: toast.tone === "warning" ? "#FF5B5B" : "#23B58E" }}>
              {toast.message}
            </Typography>
          </Paper>
        )}
      </Box>
    </SettingsContext.Provider>
  );
}

// ===================================
// PREMIUM REDESIGNED VIEWS (OVERHAUL)
// ===================================

function DashboardOverhaulView({
  projects,
  activeCount,
  deliveredCount,
  totalEarnings,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  clientOptions,
  onEdit,
  onDelete
}: any) {
  const settings = useContext(SettingsContext);

  return (
    <Stack gap={4}>
      {/* Dynamic Glowing Hero Cards */}
      <Grid container spacing={3.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ ...glassmorphismStyle, p: 4.5, position: "relative", overflow: "hidden", "&:hover": { borderColor: "rgba(105,196,206,0.35)", transform: "translateY(-4px)" } }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: accentGradient }} />
            <Typography sx={{ color: mutedText, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Active Workspace Projects</Typography>
            <Typography variant="h2" sx={{ color: inkText, fontWeight: 900, mt: 2, letterSpacing: "-0.04em" }}>{activeCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ ...glassmorphismStyle, p: 4.5, position: "relative", overflow: "hidden", "&:hover": { borderColor: "rgba(35, 181, 142, 0.35)", transform: "translateY(-4px)" } }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: successGradient }} />
            <Typography sx={{ color: mutedText, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Completed Packages</Typography>
            <Typography variant="h2" sx={{ color: "#23B58E", fontWeight: 900, mt: 2, letterSpacing: "-0.04em" }}>{deliveredCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ ...glassmorphismStyle, p: 4.5, position: "relative", overflow: "hidden", "&:hover": { borderColor: "rgba(45, 140, 151, 0.35)", transform: "translateY(-4px)" } }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: accentGradient }} />
            <Typography sx={{ color: mutedText, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Outstanding Invoice Balance</Typography>
            <Typography variant="h2" sx={{ color: "#69C4CE", fontWeight: 900, mt: 2, letterSpacing: "-0.04em" }}>{money(totalEarnings, settings.currencyCode)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Control Filters Layout */}
      <Paper sx={{ ...glassmorphismStyle, p: 3.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={2.5}>
          <TextField
            placeholder="Search matching projects, client details, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="medium"
            fullWidth
            InputProps={{ startAdornment: <SearchIcon sx={{ color: mutedText, mr: 1.5 }} /> }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                borderColor: borderStroke,
                "&:hover": { borderColor: highlightBorder }
              }
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              sx={{ borderRadius: "12px", color: inkText }}
            >
              <MenuItem value="All">All Projects</MenuItem>
              <MenuItem value="Planned">Planned</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Client Review">Review Queue</MenuItem>
              <MenuItem value="Delivered">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              sx={{ borderRadius: "12px", color: inkText }}
            >
              {clientOptions.map((c: string) => (
                <MenuItem key={c} value={c}>
                  {c === "ALL" ? "All Clients" : c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Grid of Interactive Project Cards */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: inkText, mb: 3 }}>
          Active Workspace Queues ({projects.length})
        </Typography>
        <Grid container spacing={3.5}>
          {projects.length ? (
            projects.map((project: WorkItem) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
                <Paper
                  sx={{
                    ...glassmorphismStyle,
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 220,
                    bgcolor: "rgba(22, 28, 36, 0.4)",
                    "&:hover": { borderColor: highlightBorder, transform: "translateY(-4px)", bgcolor: panelBg }
                  }}
                >
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip
                        label={project.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: 11,
                          color: isDoneStatus(project.status) ? "#23B58E" : "#F5A623",
                          bgcolor: isDoneStatus(project.status) ? "rgba(35, 181, 142, 0.15)" : "rgba(245, 166, 35, 0.15)",
                          border: `1px solid ${isDoneStatus(project.status) ? "rgba(35, 181, 142, 0.3)" : "rgba(245, 166, 35, 0.3)"}`
                        }}
                      />
                      <Typography sx={{ color: mutedText, fontSize: 12 }}>{formatDate(project.dueDate)}</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ color: inkText, fontWeight: 700, mb: 1, letterSpacing: "-0.01em" }}>
                      {project.title}
                    </Typography>
                    <Typography sx={{ color: mutedText, fontSize: 13, mb: 2 }}>
                      {project.client ? `Client: ${project.client}` : "Internal Personal Edit"}
                    </Typography>
                  </Box>

                  <Box sx={{ borderTop: `1px solid ${borderStroke}`, pt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: accentColor, fontWeight: 800, fontSize: 16 }}>
                      {project.earnings ? money(project.earnings, settings.currencyCode) : "Salary Queue"}
                    </Typography>
                    <Stack direction="row" gap={1}>
                      <Button onClick={() => onEdit(project)} sx={{ color: inkText, textTransform: "none", fontSize: 13 }}>
                        Edit
                      </Button>
                      <Button onClick={() => onDelete(project.id)} color="error" sx={{ textTransform: "none", fontSize: 13 }}>
                        Remove
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ ...glassmorphismStyle, p: 6, textAlign: "center" }}>
                <Typography sx={{ color: mutedText }}>No project records detected in current control view.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Stack>
  );
}

function ProjectsOverhaulView({ projects, onEdit, onDelete }: any) {
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Production Archives</Typography>
      <Stack gap={2}>
        {projects.map((p: WorkItem) => (
          <Box
            key={p.id}
            sx={{
              p: 3,
              bgcolor: softPanelBg,
              border: `1px solid ${borderStroke}`,
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              "&:hover": { borderColor: highlightBorder }
            }}
          >
            <Box>
              <Typography sx={{ color: inkText, fontWeight: 700, fontSize: 16 }}>{p.title}</Typography>
              <Typography sx={{ color: mutedText, fontSize: 12, mt: 0.5 }}>
                Client: {p.client || "None"} | Target Delivery: {formatDate(p.dueDate)} | Value: {money(p.earnings)}
              </Typography>
            </Box>
            <Stack direction="row" gap={2}>
              <Button onClick={() => onEdit(p)} sx={{ color: accentColor }}>Edit Details</Button>
              <Button color="error" onClick={() => onDelete(p.id)}>Delete</Button>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function TimelineOverhaulView({ projects }: { projects: WorkItem[] }) {
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Master Production Timeline</Typography>
      <Stack gap={3}>
        {projects.map((p) => {
          const progress = isDoneStatus(p.status) ? 100 : p.status === "Client Review" ? 75 : p.status === "In Progress" ? 40 : 15;
          return (
            <Box key={p.id}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Box>
                  <Typography sx={{ color: inkText, fontWeight: 700, fontSize: 15 }}>{p.title}</Typography>
                  <Typography sx={{ color: mutedText, fontSize: 12 }}>Status: {p.status}</Typography>
                </Box>
                <Typography sx={{ color: accentColor, fontSize: 13, fontWeight: 600 }}>Due: {formatDate(p.dueDate)}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: progressTrack,
                  "& .MuiLinearProgress-bar": { background: accentGradient }
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function CalendarOverhaulView({ projects }: { projects: WorkItem[] }) {
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Project Schedule & Deadlines</Typography>
      <Grid container spacing={2}>
        {projects.map((p) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <Box
              sx={{
                p: 2.5,
                bgcolor: softPanelBg,
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: "8px",
                border: `1px solid ${borderStroke}`,
                borderLeftColor: accentColor
              }}
            >
              <Typography sx={{ color: inkText, fontWeight: 700, fontSize: 14 }}>{p.title}</Typography>
              <Typography sx={{ color: mutedText, fontSize: 12, mt: 0.5 }}>
                Target: {formatDate(p.dueDate)} | Client Partner: {p.client || "General Project"}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

function ClientsOverhaulView({ projects }: { projects: WorkItem[] }) {
  const clients = useMemo(() => {
    const map = new Map<string, { active: number; total: number }>();
    projects.forEach((p) => {
      if (!p.client) return;
      const current = map.get(p.client) || { active: 0, total: 0 };
      if (!isDoneStatus(p.status)) current.active += 1;
      current.total += 1;
      map.set(p.client, current);
    });
    return Array.from(map.entries());
  }, [projects]);

  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Client Directory CRM</Typography>
      <Stack gap={2.5}>
        {clients.length ? (
          clients.map(([clientName, stats]) => (
            <Box
              key={clientName}
              sx={{
                p: 3,
                bgcolor: softPanelBg,
                border: `1px solid ${borderStroke}`,
                borderRadius: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Box>
                <Typography sx={{ color: inkText, fontWeight: 800, fontSize: 18 }}>{clientName}</Typography>
                <Typography sx={{ color: mutedText, fontSize: 13, mt: 0.5 }}>
                  Active Engagements: {stats.active} | Total Projects: {stats.total}
                </Typography>
              </Box>
              <Chip
                label={stats.active > 0 ? "Active Account" : "Archive Account"}
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: stats.active > 0 ? "#69C4CE" : mutedText,
                  bgcolor: stats.active > 0 ? "rgba(45, 140, 151, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${stats.active > 0 ? "rgba(45, 140, 151, 0.3)" : borderStroke}`
                }}
              />
            </Box>
          ))
        ) : (
          <Typography sx={{ color: mutedText }}>No partner client records registered.</Typography>
        )}
      </Stack>
    </Paper>
  );
}

function MediaOverhaulView({ projects }: { projects: WorkItem[] }) {
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Master Asset Packages</Typography>
      <Grid container spacing={3}>
        {projects.map((p) => (
          <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
            <Box
              sx={{
                p: 3,
                bgcolor: softPanelBg,
                border: `1px solid ${borderStroke}`,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: 2.5
              }}
            >
              <MovieCreationOutlinedIcon sx={{ color: accentColor, fontSize: 36 }} />
              <Box>
                <Typography sx={{ color: inkText, fontWeight: 700, fontSize: 15 }}>{p.title} Deliverables</Typography>
                <Typography sx={{ color: mutedText, fontSize: 12 }}>Contains edits, logs, revisions, and raw files.</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

function ResourcesOverhaulView({ resources, setResources, notify }: any) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  function handleSave() {
    if (!title || !url) return;
    const newRes: ResourceLink = {
      id: createId(),
      title,
      url,
      category: "Asset Folder",
      projectId: "",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setResources((prev: any) => [newRes, ...prev]);
    setOpen(false);
    setTitle("");
    setUrl("");
    notify("Resource partner link configured successfully.");
  }

  return (
    <Stack gap={4}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ alignSelf: "flex-start", background: accentGradient, color: "#000", fontWeight: 700 }}
      >
        Configure External Resource
      </Button>

      <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
        <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Resources & Cloud Storage Links</Typography>
        <Stack gap={2}>
          {resources.length ? (
            resources.map((res: ResourceLink) => (
              <Box
                key={res.id}
                sx={{
                  p: 3,
                  bgcolor: softPanelBg,
                  border: `1px solid ${borderStroke}`,
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { borderColor: highlightBorder }
                }}
              >
                <Box>
                  <Typography sx={{ color: inkText, fontWeight: 700 }}>{res.title}</Typography>
                  <Typography sx={{ color: mutedText, fontSize: 12, mt: 0.5 }}>{res.url}</Typography>
                </Box>
                <Button component="a" href={res.url} target="_blank" size="small" sx={{ color: accentColor }}>
                  Access Folder
                </Button>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: mutedText }}>No reference storage links configured.</Typography>
          )}
        </Stack>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { bgcolor: "rgba(18,22,28,0.95)", color: inkText, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add External Resource</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField label="Link Title" value={title} onChange={(e) => setTitle(e.target.value)} size="small" fullWidth />
          <TextField label="URL Destination" value={url} onChange={(e) => setUrl(e.target.value)} size="small" fullWidth />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: mutedText }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ background: accentGradient, color: "#000" }}>Configure</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function ReportsOverhaulView({ projects }: { projects: WorkItem[] }) {
  const settings = useContext(SettingsContext);
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 1 }}>Earnings & Production Mix</Typography>
      <Typography sx={{ color: mutedText, fontSize: 14, mb: 4 }}>Work analytics and project distribution.</Typography>
      <Grid container spacing={3.5}>
        {settings.projectTags.map((tag) => {
          const count = projects.filter((p) => p.workType === tag).length;
          const earnings = projects.filter((p) => p.workType === tag && isDoneStatus(p.status)).reduce((acc, p) => acc + (p.earnings || 0), 0);
          return (
            <Grid size={{ xs: 12, sm: 4 }} key={tag}>
              <Paper sx={{ p: 3.5, bgcolor: softPanelBg, border: `1px solid ${borderStroke}`, borderRadius: "16px" }}>
                <Typography sx={{ color: accentColor, fontWeight: 800, textTransform: "uppercase", fontSize: 12 }}>{tag}</Typography>
                <Typography variant="h4" sx={{ color: inkText, fontWeight: 900, mt: 1.5 }}>{count} Projects</Typography>
                <Typography sx={{ color: mutedText, fontSize: 13, mt: 1 }}>Total: {money(earnings, settings.currencyCode)}</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}

function TeamOverhaulView({ projects }: { projects: WorkItem[] }) {
  const teamData = useQuery(api.team.getMyWorkspace, {});
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 1 }}>Team Space Collaboration</Typography>
      <Typography sx={{ color: mutedText, fontSize: 14, mb: 3 }}>Coordinate with editors and client reviewers.</Typography>
      <Stack gap={2}>
        {teamData?.members?.map((m: any) => (
          <Box key={m._id} sx={{ p: 2.5, bgcolor: softPanelBg, border: `1px solid ${borderStroke}`, borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography sx={{ color: inkText, fontWeight: 700 }}>{m.name}</Typography>
              <Typography sx={{ color: mutedText, fontSize: 12, mt: 0.5 }}>{m.email}</Typography>
            </Box>
            <Chip label={m.role} sx={{ color: accentColor, bgcolor: "rgba(45, 140, 151, 0.15)", border: `1px solid ${highlightBorder}` }} />
          </Box>
        )) || <Typography sx={{ color: mutedText }}>No workspace collaborators connected currently.</Typography>}
      </Stack>
    </Paper>
  );
}

function TeamChatOverhaulView() {
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 5, minHeight: 350, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 48, color: accentColor, mb: 2 }} />
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 700 }}>Workspace Team Chat Channel</Typography>
      <Typography sx={{ color: mutedText, fontSize: 14, mt: 1, textAlign: "center", maxWidth: 400 }}>
        Collaborate in real-time, share files, and log client timecodes inside team sync templates.
      </Typography>
    </Paper>
  );
}

function ProfileOverhaulView({ projects, settings }: any) {
  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Public Portfolios & Deliverables</Typography>
      <Stack gap={3}>
        <Box>
          <Typography variant="h5" sx={{ color: inkText, fontWeight: 800 }}>{settings.profileName}</Typography>
          <Typography sx={{ color: accentColor, fontWeight: 600 }}>{settings.profileTitle || "Professional Video Editor"}</Typography>
          <Typography sx={{ color: mutedText, fontSize: 14, mt: 1.5 }}>{settings.profileBio}</Typography>
        </Box>
        <Divider sx={{ borderColor: borderStroke }} />
        <Typography variant="subtitle1" sx={{ color: inkText, fontWeight: 700 }}>Portfolio Highlights</Typography>
        <Stack gap={1.5}>
          {projects.filter((p: WorkItem) => isDoneStatus(p.status)).map((p: WorkItem) => (
            <Box key={p.id} sx={{ p: 2, bgcolor: softPanelBg, borderRadius: "8px", border: `1px solid ${borderStroke}` }}>
              <Typography sx={{ color: inkText, fontWeight: 700 }}>{p.title}</Typography>
              <Typography sx={{ color: mutedText, fontSize: 12 }}>Partner Client: {p.client || "Self Published"}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function SettingsOverhaulView({ settings, setSettings, notify }: any) {
  const [studioName, setStudioName] = useState(settings.studioName);
  const [profileName, setProfileName] = useState(settings.profileName);
  const [profileBio, setProfileBio] = useState(settings.profileBio);

  function handleSave() {
    setSettings((prev: any) => ({
      ...prev,
      studioName,
      profileName,
      profileBio
    }));
    notify("Control configuration details updated.");
  }

  return (
    <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
      <Typography variant="h6" sx={{ color: inkText, fontWeight: 800, mb: 3 }}>Workspace Settings</Typography>
      <Stack gap={3.5} sx={{ mt: 2 }}>
        <TextField
          label="Studio Namespace"
          value={studioName}
          onChange={(e) => setStudioName(e.target.value)}
          sx={{ input: { color: inkText } }}
          fullWidth
        />
        <TextField
          label="Display / Editor Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          sx={{ input: { color: inkText } }}
          fullWidth
        />
        <TextField
          label="Bio Description"
          value={profileBio}
          onChange={(e) => setProfileBio(e.target.value)}
          sx={{ textarea: { color: inkText } }}
          fullWidth
          multiline
          rows={3}
        />
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ alignSelf: "flex-start", background: accentGradient, color: "#000", fontWeight: 700, px: 4, py: 1.2 }}
        >
          Save Details
        </Button>
      </Stack>
    </Paper>
  );
}

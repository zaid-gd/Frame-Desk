"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { CutLabLockup } from "../../cutlab-brand";
import { cutlab, cutlabPanelSx } from "../../design-system";
import { emptyStateAssets } from "../../brand-assets";

const headingFont = cutlab.font.heading;
const accent = `var(--app-accent, ${cutlab.color.teal})`;
const ink = `var(--app-ink, ${cutlab.color.softWhite})`;
const muted = "var(--app-muted, #A5ADB4)";
const border = "var(--app-border, #2A3138)";
const panel = `var(--app-panel, ${cutlab.color.graphite})`;
const canvas = `var(--app-canvas, ${cutlab.color.charcoal})`;
const softPanel = "var(--app-soft-panel, #151B20)";
const headerPanel = "var(--app-header-panel, #20272D)";
const avatarSurface = `var(--app-avatar-surface, ${cutlab.color.slate})`;
const panelSx = cutlabPanelSx;

export function PublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const profile = useQuery(api.publicProfiles.getBySlug, slug ? { slug } : "skip");

  if (profile === undefined) {
    return (
      <PublicShell>
        <Box sx={{ minHeight: "70dvh", display: "grid", placeItems: "center" }}>
          <Stack alignItems="center" gap={1.2}>
            <CircularProgress size={30} sx={{ color: accent }} />
            <Typography sx={{ color: muted, fontSize: 13 }}>Loading public profile...</Typography>
          </Stack>
        </Box>
      </PublicShell>
    );
  }

  if (!profile) {
    return (
      <PublicShell>
        <Paper sx={{ ...panelSx, p: { xs: 2.5, md: 4 }, mt: 3 }}>
          <Typography sx={{ color: ink, fontSize: 34, fontWeight: 760, fontFamily: headingFont }}>Profile not found</Typography>
          <Typography sx={{ color: muted, fontSize: 14, mt: 1 }}>This public Frame Desk profile has not been published or the link is incorrect.</Typography>
        </Paper>
      </PublicShell>
    );
  }

  const turnaroundDays = Math.max(1, Math.floor(profile.avgTurnaroundDays || 3));

  return (
    <PublicShell>
      <Paper sx={{ ...panelSx, mt: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "170px minmax(0, 1fr) 560px" }, gap: 4, p: { xs: 2.5, md: 4 }, alignItems: "center" }}>
          <PublicAvatar name={profile.profileName} imageUrl={profile.profileImageUrl} />
          <Box>
            <Typography sx={{ color: ink, fontSize: 34, fontWeight: 760, lineHeight: 1.1 }}>{profile.profileName || "Frame Desk Editor"}</Typography>
            {profile.profileUsername ? <Typography sx={{ color: accent, fontSize: 14, fontWeight: 720, mt: 0.6 }}>@{profile.profileUsername}</Typography> : null}
            <Typography sx={{ color: ink, fontSize: 15, mt: 0.8 }}>{profile.profileTitle || "Video Editor"}</Typography>
            <Typography sx={{ color: muted, fontSize: 14, mt: 1.5, maxWidth: 420 }}>{profile.profileBio || "Portfolio profile published from Frame Desk."}</Typography>
            <Stack direction="row" gap={2} sx={{ mt: 2, flexWrap: "wrap", color: muted }}>
              {profile.profileLocation ? <InfoPill icon={<PlaceOutlinedIcon />} text={profile.profileLocation} /> : null}
              {profile.timeZone ? <InfoPill icon={<PublicOutlinedIcon />} text={profile.timeZone} /> : null}
            </Stack>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1.2 }}>
            <ProfileMetric icon={<PlayArrowRoundedIcon />} label="Active Projects" value={String(profile.activeProjects)} />
            <ProfileMetric icon={<CheckCircleOutlineIcon />} label="Delivered Edits" value={String(profile.deliveredEdits)} />
            <ProfileMetric icon={<AccessTimeOutlinedIcon />} label="Turnaround" value={`${turnaroundDays} Days`} />
          </Box>
        </Box>
        <Divider sx={{ borderColor: border }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "280px minmax(0, 1fr)" }, gap: 3, p: { xs: 2, md: 3 }, alignItems: "start" }}>
          <Box>
            <Typography sx={{ color: ink, fontSize: 28, fontWeight: 760, lineHeight: 1.05 }}>Portfolio timeline</Typography>
            <Typography sx={{ color: muted, fontSize: 13, mt: 1, maxWidth: 260 }}>Recent public delivery context shared from Frame Desk.</Typography>
            <Typography sx={{ color: muted, fontSize: 12, mt: 2 }}>Updated {formatPublicDate(profile.updatedAt.slice(0, 10))}</Typography>
          </Box>
          <Stack gap={1.2}>
            {profile.projects.length ? profile.projects.map((project) => (
              <Box key={`${project.title}-${project.dueDate}`} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 150px 160px" }, gap: 1.4, p: 1.6, border: `1px solid ${border}`, borderRadius: "8px", bgcolor: panel, alignItems: "center" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: ink, fontSize: 15, fontWeight: 760 }}>{project.title}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{project.workType}</Typography>
                </Box>
                <Typography sx={{ color: muted, fontSize: 12 }}>{formatPublicDate(project.dueDate)}</Typography>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.65 }}>
                    <Chip label={project.status} size="small" sx={{ bgcolor: softPanel, color: ink, borderRadius: "5px", fontSize: 11, fontWeight: 760 }} />
                    <Typography sx={{ color: ink, fontSize: 12, fontWeight: 720 }}>{projectProgress(project.status)}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={projectProgress(project.status)} sx={{ height: 6, borderRadius: 99, bgcolor: headerPanel, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
                </Box>
              </Box>
            )) : (
              <Box sx={{ p: 3, border: `1px solid ${border}`, borderRadius: "8px", bgcolor: softPanel, textAlign: "center" }}>
                <Box component="img" src={emptyStateAssets.projects} alt="" aria-hidden="true" sx={{ width: 180, height: 126, objectFit: "contain", mx: "auto", mb: 1.5 }} />
                <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>No public projects shared yet</Typography>
                <Typography sx={{ color: muted, fontSize: 12, mt: 0.4 }}>The editor can publish updated public work from their Frame Desk profile.</Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Paper>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: canvas, color: ink, px: { xs: 2, md: 4 }, py: 3 }}>
      <CutLabLockup subtitle="Public editor profile" sx={{ pb: 2.5 }} />
      {children}
    </Box>
  );
}

function PublicAvatar({ name, imageUrl }: { name: string; imageUrl: string }) {
  return (
    <Box sx={{ width: 148, height: 148, borderRadius: "50%", bgcolor: avatarSurface, border: `1px solid ${border}`, display: "grid", placeItems: "center", color: ink, fontSize: 40, fontWeight: 760, overflow: "hidden" }}>
      {imageUrl ? <Box component="img" src={imageUrl} alt={name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
    </Box>
  );
}

function ProfileMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ p: 1.2, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: softPanel }}>
      <Box sx={{ color: accent }}>{icon}</Box>
      <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760, mt: 0.6 }}>{value}</Typography>
      <Typography sx={{ color: muted, fontSize: 11, mt: 0.2 }}>{label}</Typography>
    </Box>
  );
}

function InfoPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.6}>
      <Box sx={{ color: accent, display: "grid", "& svg": { fontSize: 17 } }}>{icon}</Box>
      <Typography sx={{ color: muted, fontSize: 13 }}>{text}</Typography>
    </Stack>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "C") + (parts[1]?.[0] || "");
}

function projectProgress(status: string) {
  const s = status.toLowerCase();
  if (s.includes("deliver") || s.includes("done") || s.includes("complete")) return 100;
  if (s.includes("review")) return 72;
  if (s.includes("progress") || s.includes("edit")) return 48;
  return 18;
}

function formatPublicDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

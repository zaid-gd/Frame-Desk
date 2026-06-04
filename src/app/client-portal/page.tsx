"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import MovieCreationOutlinedIcon from "@mui/icons-material/MovieCreationOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

const headingFont = "Georgia, 'Times New Roman', serif";
const accent = "var(--app-accent, #5b3fa0)";
const ink = "var(--app-ink, #19171f)";
const muted = "var(--app-muted, #6f6a78)";
const border = "var(--app-border, #dedbe5)";
const panel = "var(--app-panel, #ffffff)";
const canvas = "var(--app-canvas, #fbfaf8)";
const activeBg = "var(--app-active, #f0eafa)";
const softPanel = "var(--app-soft-panel, #fbfafc)";
const progressTrack = "var(--app-progress-track, #ece8f4)";
const panelSx = { bgcolor: panel, border: `1px solid ${border}`, borderRadius: "6px", overflow: "hidden", boxShadow: "none" };
const outlineButtonSx = {
  borderColor: border,
  color: accent,
  bgcolor: panel,
  height: 42,
  px: 1.8,
  borderRadius: "6px",
  fontSize: 13,
  fontWeight: 760,
  "&:hover": { borderColor: accent, bgcolor: activeBg }
};

const portalProject = {
  title: "Spring Launch Campaign Edit",
  client: "Northstar Coffee Co.",
  type: "Client Campaign",
  status: "Review",
  dueDate: "June 14, 2026",
  progress: 72,
  lastActivity: "Review cut v2 submitted",
  estimatedCompletion: "June 12, 2026",
  deliveryStatus: "On track",
  description: "A polished 90-second launch film plus short-form social exports for the seasonal product rollout."
};

const progressStages = [
  { label: "Planned", done: true },
  { label: "Editing", done: true },
  { label: "Review", done: true, current: true },
  { label: "Revision", done: false },
  { label: "Delivered", done: false }
];

const deliverables = [
  { title: "Hero campaign edit", format: "16:9 master export", status: "Ready", updated: "June 1, 2026" },
  { title: "Instagram reel cutdown", format: "9:16 social export", status: "In Progress", updated: "May 31, 2026" },
  { title: "YouTube thumbnail selects", format: "3 design options", status: "Ready", updated: "May 30, 2026" },
  { title: "Final archive package", format: "Source-safe delivery folder", status: "Pending", updated: "Awaiting approval" }
];

const initialFeedback = [
  { author: "Maya Patel", date: "May 30, 2026", body: "Please tighten the opening product shots and reduce the coffee grinder audio under the voiceover.", status: "Resolved" },
  { author: "Maya Patel", date: "June 1, 2026", body: "Version 2 feels much closer. Can we try a warmer color grade on the outdoor scene?", status: "Open" }
];

const timeline = [
  { date: "May 24, 2026", title: "Project created", body: "Brief, brand kit, and launch schedule received." },
  { date: "May 27, 2026", title: "First edit submitted", body: "Initial campaign cut uploaded for client review." },
  { date: "May 30, 2026", title: "Revision requested", body: "Opening sequence and audio balance notes submitted." },
  { date: "June 1, 2026", title: "Review cut v2 delivered", body: "Updated edit, thumbnails, and revised audio mix shared." },
  { date: "June 12, 2026", title: "Estimated final delivery", body: "Final exports scheduled after approval." }
];

const downloads = [
  { title: "Campaign Edit v2", detail: "MP4, 1080p, review-approved", status: "Available" },
  { title: "Thumbnail Selects", detail: "PNG set, 3 options", status: "Available" },
  { title: "Final Master Export", detail: "4K archive export", status: "Locked" }
];

const revisionPlan = {
  included: 3,
  used: 2,
  remaining: 1
};

export default function ClientPortalPage() {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [request, setRequest] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submitFeedback() {
    const body = request.trim();
    if (!body) return;
    setFeedback((current) => [
      {
        author: "Client",
        date: "June 2, 2026",
        body,
        status: "Submitted"
      },
      ...current
    ]);
    setRequest("");
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 1800);
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: canvas, color: ink }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 } }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" gap={1.2}>
            <Box sx={{ width: 36, height: 36, border: `2px solid ${ink}`, borderRadius: "4px", display: "grid", placeItems: "center" }}>
              <MovieCreationOutlinedIcon sx={{ fontSize: 21, color: ink }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 24, color: ink, fontWeight: 760, lineHeight: 1, fontFamily: headingFont }}>CutLab Studio</Typography>
              <Typography sx={{ fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: 0.6, mt: 0.35 }}>Client Portal</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip label="No account required" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px" }} />
            <Chip label="Read-only project view" sx={{ bgcolor: softPanel, color: muted, borderRadius: "5px" }} />
          </Stack>
        </Stack>

        <Paper sx={{ ...panelSx, mb: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.45fr) 360px" }, gap: 0 }}>
            <Box sx={{ p: { xs: 2.4, md: 3 }, borderRight: { lg: `1px solid ${border}` } }}>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                <StatusChip label={portalProject.status} tone="warning" />
                <StatusChip label={portalProject.deliveryStatus} tone="success" />
              </Stack>
              <Typography sx={{ color: ink, fontSize: { xs: 32, md: 46 }, fontWeight: 760, lineHeight: 1.02, fontFamily: headingFont, maxWidth: 760 }}>
                {portalProject.title}
              </Typography>
              <Typography sx={{ color: muted, fontSize: 15, mt: 1.3, maxWidth: 680, lineHeight: 1.6 }}>
                {portalProject.description}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" }, gap: 1.2, mt: 2.4 }}>
                <InfoTile label="Client" value={portalProject.client} />
                <InfoTile label="Type" value={portalProject.type} />
                <InfoTile label="Due Date" value={portalProject.dueDate} />
                <InfoTile label="Status" value={portalProject.status} />
              </Box>
            </Box>
            <ProjectSummaryCard />
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 360px" }, gap: 2 }}>
          <Stack gap={2}>
            <ProgressTracker />
            <DeliverablesSection />
            <FeedbackSection feedback={feedback} request={request} submitted={submitted} setRequest={setRequest} onSubmit={submitFeedback} />
          </Stack>
          <Stack gap={2}>
            <RevisionTracker />
            <TimelineSection />
            <DownloadsSection />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function ProjectSummaryCard() {
  return (
    <Box sx={{ p: { xs: 2.4, md: 3 }, bgcolor: softPanel }}>
      <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>Project Summary</Typography>
      <Typography sx={{ color: muted, fontSize: 13, mt: 0.5 }}>Current client-facing delivery snapshot.</Typography>
      <Stack gap={1.3} sx={{ mt: 2.3 }}>
        <SummaryMetric icon={<PlayArrowRoundedIcon />} label="Completion" value={`${portalProject.progress}%`} />
        <LinearProgress variant="determinate" value={portalProject.progress} sx={{ height: 7, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
        <SummaryMetric icon={<CheckCircleOutlineIcon />} label="Delivery Status" value={portalProject.deliveryStatus} />
        <SummaryMetric icon={<AccessTimeOutlinedIcon />} label="Last Activity" value={portalProject.lastActivity} />
        <SummaryMetric icon={<CalendarTodayOutlinedIcon />} label="Estimated Completion" value={portalProject.estimatedCompletion} />
      </Stack>
    </Box>
  );
}

function ProgressTracker() {
  return (
    <Paper sx={{ ...panelSx, p: 2.2 }}>
      <SectionHeader title="Progress Tracker" subtitle="Client-visible production milestones." />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" }, gap: 1.2, mt: 2 }}>
        {progressStages.map((stage, index) => (
          <Box key={stage.label} sx={{ p: 1.4, border: `1px solid ${stage.current ? accent : border}`, borderRadius: "6px", bgcolor: stage.done ? activeBg : panel, minHeight: 104 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ color: stage.done ? accent : muted, fontSize: 12, fontWeight: 760 }}>0{index + 1}</Typography>
              {stage.done ? <CheckCircleOutlineIcon sx={{ color: accent, fontSize: 18 }} /> : <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${border}` }} />}
            </Stack>
            <Typography sx={{ color: ink, fontSize: 15, fontWeight: 760, mt: 1.5 }}>{stage.label}</Typography>
            <Typography sx={{ color: muted, fontSize: 12, mt: 0.5 }}>{stage.current ? "Current stage" : stage.done ? "Completed" : "Upcoming"}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function DeliverablesSection() {
  return (
    <Paper sx={panelSx}>
      <Box sx={{ px: 2.2, py: 2 }}>
        <SectionHeader title="Deliverables" subtitle="Outputs currently attached to this project." />
      </Box>
      <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
        {deliverables.map((item) => (
          <Box key={item.title} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 150px 140px" }, gap: 1.2, px: 2.2, py: 1.5, alignItems: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{item.title}</Typography>
              <Typography sx={{ color: muted, fontSize: 12, mt: 0.35 }}>{item.format}</Typography>
            </Box>
            <Typography sx={{ color: muted, fontSize: 12 }}>{item.updated}</Typography>
            <StatusChip label={item.status} tone={deliverableTone(item.status)} />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function RevisionTracker() {
  return (
    <Paper sx={{ ...panelSx, p: 2 }}>
      <SectionHeader title="Revision Tracker" subtitle="Included revision allowance." />
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1, mt: 1.6 }}>
        <MiniNumber label="Included" value={revisionPlan.included} />
        <MiniNumber label="Used" value={revisionPlan.used} />
        <MiniNumber label="Remaining" value={revisionPlan.remaining} />
      </Box>
      <LinearProgress variant="determinate" value={(revisionPlan.used / revisionPlan.included) * 100} sx={{ height: 6, borderRadius: 99, bgcolor: progressTrack, mt: 1.6, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
    </Paper>
  );
}

function FeedbackSection({ feedback, request, submitted, setRequest, onSubmit }: { feedback: typeof initialFeedback; request: string; submitted: boolean; setRequest: (value: string) => void; onSubmit: () => void }) {
  return (
    <Paper sx={{ ...panelSx, p: 2.2 }}>
      <SectionHeader title="Feedback" subtitle="Review previous notes or submit a new revision request." />
      <Stack gap={1.2} sx={{ mt: 1.8 }}>
        {feedback.map((item, index) => (
          <Box key={`${item.date}-${index}`} sx={{ p: 1.4, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: index === 0 && item.status === "Submitted" ? activeBg : panel }}>
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{item.author}</Typography>
              <StatusChip label={item.status} tone={item.status === "Resolved" ? "success" : "warning"} />
            </Stack>
            <Typography sx={{ color: muted, fontSize: 12, mt: 0.2 }}>{item.date}</Typography>
            <Typography sx={{ color: ink, fontSize: 13, lineHeight: 1.55, mt: 0.8 }}>{item.body}</Typography>
          </Box>
        ))}
      </Stack>
      <Divider sx={{ my: 2, borderColor: border }} />
      <Stack gap={1.2}>
        <TextField
          label="Revision request"
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          multiline
          minRows={4}
          fullWidth
          placeholder="Describe the change request with timestamps, file names, or references."
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography sx={{ color: submitted ? accent : muted, fontSize: 12 }}>{submitted ? "Feedback submitted" : "Only feedback can be submitted from this portal."}</Typography>
          <Button variant="contained" startIcon={<ChatBubbleOutlineOutlinedIcon />} onClick={onSubmit} disabled={!request.trim()} sx={{ bgcolor: accent, color: "#fff", borderRadius: "6px", fontWeight: 760, "&:hover": { bgcolor: accent } }}>
            Submit Request
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function TimelineSection() {
  return (
    <Paper sx={{ ...panelSx, p: 2 }}>
      <SectionHeader title="Timeline" subtitle="Key client-visible project events." />
      <Stack gap={1.4} sx={{ mt: 1.7 }}>
        {timeline.map((item) => (
          <Box key={item.title} sx={{ pl: 1.4, borderLeft: `2px solid ${border}` }}>
            <Typography sx={{ color: accent, fontSize: 12, fontWeight: 760 }}>{item.date}</Typography>
            <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760, mt: 0.35 }}>{item.title}</Typography>
            <Typography sx={{ color: muted, fontSize: 12, lineHeight: 1.45, mt: 0.35 }}>{item.body}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function DownloadsSection() {
  return (
    <Paper sx={{ ...panelSx, p: 2 }}>
      <SectionHeader title="Downloads" subtitle="Approved exports and final files." />
      <Stack gap={1} sx={{ mt: 1.6 }}>
        {downloads.map((item) => {
          const available = item.status === "Available";
          return (
            <Box key={item.title} sx={{ p: 1.2, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: available ? panel : softPanel }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{item.title}</Typography>
                  <Typography sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{item.detail}</Typography>
                </Box>
                <Button
                  aria-label={`Download ${item.title}`}
                  disabled={!available}
                  sx={{ minWidth: 36, width: 36, height: 36, color: available ? accent : muted, p: 0, border: `1px solid ${border}` }}
                >
                  <FileDownloadOutlinedIcon sx={{ fontSize: 19 }} />
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.2, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
      <Typography sx={{ color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760, mt: 0.55 }}>{value}</Typography>
    </Box>
  );
}

function SummaryMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Box sx={{ width: 34, height: 34, borderRadius: "6px", border: `1px solid ${border}`, display: "grid", placeItems: "center", color: accent, bgcolor: panel, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: muted, fontSize: 11, fontWeight: 760, textTransform: "uppercase" }}>{label}</Typography>
        <Typography noWrap sx={{ color: ink, fontSize: 13, fontWeight: 760, mt: 0.25 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box>
      <Typography sx={{ color: ink, fontSize: 20, fontWeight: 760 }}>{title}</Typography>
      <Typography sx={{ color: muted, fontSize: 13, mt: 0.45 }}>{subtitle}</Typography>
    </Box>
  );
}

function MiniNumber({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ p: 1.1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel, textAlign: "center" }}>
      <Typography sx={{ color: ink, fontSize: 26, fontWeight: 760, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: muted, fontSize: 11, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "success" | "warning" | "neutral" }) {
  const palette = {
    success: { bg: "var(--app-success-bg, #e9f5e9)", fg: "#3c8c4b" },
    warning: { bg: "var(--app-warning-bg, #fff4dc)", fg: "#b27616" },
    neutral: { bg: softPanel, fg: muted }
  }[tone];

  return <Chip label={label} size="small" sx={{ bgcolor: palette.bg, color: palette.fg, borderRadius: "5px", fontSize: 12, fontWeight: 760 }} />;
}

function deliverableTone(status: string): "success" | "warning" | "neutral" {
  if (status === "Ready" || status === "Delivered") return "success";
  if (status === "In Progress") return "warning";
  return "neutral";
}

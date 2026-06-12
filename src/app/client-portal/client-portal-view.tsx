"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { api } from "../../../convex/_generated/api";
import { CutLabLockup } from "../cutlab-brand";
import { emptyStateAssets } from "../brand-assets";
import { cutlab, cutlabPanelSx } from "../design-system";
import { approvalStatusLabel } from "@/lib/domain-values";
import {
  normalizeOptionalTimecode,
  TIMECODE_FORMAT_HINT,
} from "@/lib/timecode";

const headingFont = cutlab.font.heading;
const accent = `var(--app-accent, ${cutlab.color.teal})`;
const ink = `var(--app-ink, ${cutlab.color.softWhite})`;
const muted = "var(--app-muted, #A5ADB4)";
const border = "var(--app-border, #2A3138)";
const panel = `var(--app-panel, ${cutlab.color.graphite})`;
const canvas = `var(--app-canvas, ${cutlab.color.charcoal})`;
const activeBg = "var(--app-active, rgba(45,140,151,0.18))";
const softPanel = "var(--app-soft-panel, #151B20)";
const progressTrack = "var(--app-progress-track, #293139)";
const panelSx = cutlabPanelSx;
const stages = ["Planning", "In Progress", "Review", "Delivered"];

export function ClientPortalView({ token }: { token: string }) {
  const [passwordInput, setPasswordInput] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const portalResult = useQuery(
    api.clientPortals.getByToken,
    token ? (portalPassword ? { token, password: portalPassword } : { token }) : "skip"
  );
  const submitRevision = useMutation(api.clientPortals.submitRevision);
  const [clientName, setClientName] = useState("");
  const [timecode, setTimecode] = useState("");
  const [request, setRequest] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle");
  const [error, setError] = useState("");

  async function submitFeedback() {
    const message = request.trim();
    if (!message || submitState === "submitting") return;
    setError("");
    try {
      const normalizedTimecode = normalizeOptionalTimecode(timecode);
      setSubmitState("submitting");
      await submitRevision({
        token,
        ...(portalPassword ? { password: portalPassword } : {}),
        clientName,
        message,
        ...(normalizedTimecode ? { timecode: normalizedTimecode } : {}),
      });
      setRequest("");
      setTimecode("");
      setSubmitState("submitted");
    } catch (caught) {
      setSubmitState("idle");
      setError(caught instanceof Error ? caught.message : "Could not submit the revision request.");
    }
  }

  if (portalResult === undefined) {
    return (
      <PortalState title="Loading project portal" body="Connecting to the latest client-facing project snapshot.">
        <CircularProgress size={28} sx={{ color: accent }} />
      </PortalState>
    );
  }

  if (portalResult.access === "unavailable") {
    return (
      <PortalState title="Portal link unavailable" body="This link may be incorrect, unpublished, or no longer active. Ask your editor for a current portal link.">
        <Box component="img" src={emptyStateAssets.projects} alt="" aria-hidden="true" sx={{ width: 190 }} />
      </PortalState>
    );
  }

  if (portalResult.access === "expired") {
    return (
      <PortalState title="Portal link expired" body="This client portal has expired. Ask your editor to extend access or send a new link.">
        <AccessTimeOutlinedIcon sx={{ color: accent, fontSize: 54 }} />
      </PortalState>
    );
  }

  if (portalResult.access === "locked") {
    const incorrectCode = Boolean(portalPassword);
    return (
      <PortalState
        title="This portal is protected"
        body="Enter the PIN or password provided by your editor to view this project."
      >
        <Stack
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (passwordInput) setPortalPassword(passwordInput);
          }}
          gap={1.2}
          sx={{ width: "min(100%, 360px)" }}
        >
          <LockOutlinedIcon sx={{ color: accent, fontSize: 54, alignSelf: "center" }} />
          <TextField
            label="PIN or password"
            type="password"
            value={passwordInput}
            onChange={(event) => {
              setPasswordInput(event.target.value);
              if (portalPassword) setPortalPassword("");
            }}
            inputProps={{ minLength: 4, maxLength: 128 }}
            error={incorrectCode}
            helperText={incorrectCode ? "That code did not unlock the portal. Try again." : "Access is granted only after the code is verified."}
            autoComplete="current-password"
            autoFocus
          />
          <Button type="submit" variant="contained" disabled={passwordInput.length < 4} sx={{ bgcolor: accent, "&:hover": { bgcolor: accent } }}>
            Unlock Portal
          </Button>
        </Stack>
      </PortalState>
    );
  }

  const portal = portalResult;
  const currentStageIndex = Math.max(0, stages.indexOf(portal.status));
  const revisionsUsed = portal.revisions.length;
  const revisionsRemaining = Math.max(0, portal.revisionLimit - revisionsUsed);
  return (
    <Box data-testid="client-portal" sx={{ minHeight: "100dvh", bgcolor: canvas, color: ink }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} sx={{ mb: 3 }}>
          <CutLabLockup subtitle="Client Portal" />
          <Stack direction="row" gap={1} flexWrap="wrap">
            {portalPassword ? <Chip label="Access granted" sx={{ bgcolor: "var(--app-success-bg, rgba(35,181,142,0.14))", color: "var(--app-success, #23B58E)", borderRadius: "5px" }} /> : null}
            <Chip label="No account required" sx={{ bgcolor: activeBg, color: accent, borderRadius: "5px" }} />
            <Chip label="Private project link" sx={{ bgcolor: softPanel, color: muted, borderRadius: "5px" }} />
          </Stack>
        </Stack>

        <Paper sx={{ ...panelSx, mb: 2.5, overflow: "hidden" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.45fr) 360px" } }}>
            <Box sx={{ p: { xs: 2.4, md: 3 }, borderRight: { lg: `1px solid ${border}` } }}>
              <StatusChip label={portal.status} tone={portal.status === "Delivered" ? "success" : "warning"} />
              <Typography sx={{ color: ink, fontSize: { xs: 30, md: 44 }, fontWeight: 760, lineHeight: 1.04, fontFamily: headingFont, maxWidth: 760, mt: 1.5 }}>
                {portal.title}
              </Typography>
              <Typography sx={{ color: portal.clientSummary ? muted : "var(--app-subtle, #7B848E)", fontSize: 14, mt: 1.3, maxWidth: 680, lineHeight: 1.65 }}>
                {portal.clientSummary || "Your editor has not added a client-facing project summary yet."}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.2, mt: 2.4 }}>
                <InfoTile label="Client" value={portal.clientName || "Client"} />
                <InfoTile label="Type" value={portal.projectType} />
                <InfoTile label="Due Date" value={formatDate(portal.dueDate)} />
                <InfoTile label="Status" value={portal.status} />
              </Box>
            </Box>
            <Box sx={{ p: { xs: 2.4, md: 3 }, bgcolor: softPanel }}>
              <Typography sx={{ color: ink, fontSize: 19, fontWeight: 760 }}>Project Summary</Typography>
              <Stack gap={1.3} sx={{ mt: 2 }}>
                <SummaryMetric icon={<PlayArrowRoundedIcon />} label="Completion" value={`${portal.progress}%`} />
                <LinearProgress variant="determinate" value={portal.progress} sx={{ height: 7, borderRadius: 99, bgcolor: progressTrack, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
                <SummaryMetric icon={<CheckCircleOutlineIcon />} label="Delivery Status" value={portal.status === "Delivered" ? "Delivered" : "In production"} />
                <SummaryMetric icon={<AccessTimeOutlinedIcon />} label="Last Updated" value={formatDateTime(portal.updatedAt)} />
                <SummaryMetric icon={<CalendarTodayOutlinedIcon />} label="Estimated Completion" value={formatDate(portal.estimatedCompletion)} />
              </Stack>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 360px" }, gap: 2 }}>
          <Stack gap={2}>
            <PortalSection title="Workflow Progress" subtitle="The current production stage at a glance.">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.2 }}>
                {stages.map((stage, index) => {
                  const complete = index < currentStageIndex || portal.status === "Delivered";
                  const current = index === currentStageIndex;
                  return (
                    <Box key={stage} sx={{ p: 1.4, border: `1px solid ${current ? accent : border}`, borderRadius: "6px", bgcolor: complete || current ? activeBg : panel, minHeight: 98 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ color: complete || current ? accent : muted, fontSize: 11, fontWeight: 800 }}>0{index + 1}</Typography>
                        {complete ? <CheckCircleOutlineIcon sx={{ color: accent, fontSize: 18 }} /> : null}
                      </Stack>
                      <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760, mt: 1.4 }}>{stage}</Typography>
                      <Typography sx={{ color: muted, fontSize: 11.5, mt: 0.35 }}>{current ? "Current stage" : complete ? "Completed" : "Upcoming"}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </PortalSection>

            <PortalSection title="Deliverables" subtitle="Review or download files shared by your editor.">
              {portal.deliverables.length ? (
                <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
                  {portal.deliverables.map((item) => (
                    <Box key={`${item.title}-${item.updatedAt}`} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr auto", md: "minmax(0, 1fr) 130px auto" }, gap: 1.2, py: 1.35, alignItems: "center" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: ink, fontSize: 14, fontWeight: 760 }}>{item.title}</Typography>
                        <Typography sx={{ color: muted, fontSize: 12, mt: 0.3 }}>{item.detail || "Shared project file"}</Typography>
                      </Box>
                      <StatusChip label={approvalStatusLabel(item.status)} tone={deliverableTone(item.status)} />
                      <Stack direction="row" gap={0.6}>
                        <Button component="a" href={item.url} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`} sx={iconButtonSx}>
                          <OpenInNewIcon sx={{ fontSize: 18 }} />
                        </Button>
                        {item.downloadable ? (
                          <Button component="a" href={item.url} download target="_blank" rel="noreferrer" aria-label={`Download ${item.title}`} sx={iconButtonSx}>
                            <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : <PortalEmpty asset="resources" title="No deliverables yet" body="Files will appear here as soon as your editor makes them available." />}
            </PortalSection>

            <PortalSection title="Revision Requests" subtitle="Review previous requests or submit clear, timestamped feedback.">
              {portal.revisions.length ? (
                <Stack gap={1}>
                  {portal.revisions.map((item) => (
                    <Box key={`${item.createdAt}-${item.message}`} sx={{ p: 1.35, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{item.clientName || "Client"}</Typography>
                        <StatusChip label={item.status} tone={item.status === "Resolved" ? "success" : "warning"} />
                      </Stack>
                      <Typography sx={{ color: muted, fontSize: 11.5, mt: 0.25 }}>{formatDateTime(item.createdAt)}</Typography>
                      {item.timecode ? (
                        <Chip
                          icon={<AccessTimeOutlinedIcon />}
                          label={item.timecode}
                          size="small"
                          sx={{ mt: 0.75, height: 24, borderRadius: "5px", bgcolor: activeBg, color: accent, fontWeight: 760, "& .MuiChip-icon": { color: accent, fontSize: 15 } }}
                        />
                      ) : null}
                      <Typography sx={{ color: ink, fontSize: 13, lineHeight: 1.55, mt: 0.75, whiteSpace: "pre-wrap" }}>{item.message}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : <PortalEmpty asset="feedback" title="No revision requests" body="Submit the first request below if anything needs to change." />}
              <Divider sx={{ my: 2, borderColor: border }} />
              <Stack gap={1.1}>
                <TextField label="Your name" value={clientName} onChange={(event) => setClientName(event.target.value)} size="small" inputProps={{ maxLength: 100 }} />
                <TextField
                  label="Timecode (optional)"
                  value={timecode}
                  onChange={(event) => {
                    setTimecode(event.target.value);
                    if (error) setError("");
                  }}
                  size="small"
                  placeholder="00:12 or 00:01:25"
                  inputProps={{ maxLength: 8, inputMode: "text" }}
                  helperText={TIMECODE_FORMAT_HINT}
                />
                <TextField
                  label="Revision request"
                  value={request}
                  onChange={(event) => {
                    setRequest(event.target.value);
                    if (submitState === "submitted") setSubmitState("idle");
                    if (error) setError("");
                  }}
                  multiline
                  minRows={4}
                  inputProps={{ maxLength: 2000 }}
                  placeholder="Describe the change with timestamps, file names, or visual references."
                  error={Boolean(error)}
                  helperText={error || `${request.length}/2000 characters`}
                />
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
                  <Typography sx={{ color: submitState === "submitted" ? accent : muted, fontSize: 12 }}>
                    {submitState === "submitted" ? "Revision request submitted." : "Project management details remain read-only."}
                  </Typography>
                  <Button variant="contained" startIcon={<ChatBubbleOutlineOutlinedIcon />} onClick={submitFeedback} disabled={!request.trim() || submitState === "submitting"} sx={{ bgcolor: accent, color: "#fff", borderRadius: "6px", fontWeight: 760, "&:hover": { bgcolor: accent } }}>
                    {submitState === "submitting" ? "Submitting..." : "Submit Request"}
                  </Button>
                </Stack>
              </Stack>
            </PortalSection>
          </Stack>

          <Stack gap={2}>
            <PortalSection title="Revision Allowance" subtitle="Included project revision tracking.">
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                <MiniNumber label="Included" value={portal.revisionLimit} />
                <MiniNumber label="Used" value={revisionsUsed} />
                <MiniNumber label="Remaining" value={revisionsRemaining} />
              </Box>
              <LinearProgress variant="determinate" value={portal.revisionLimit ? Math.min(100, (revisionsUsed / portal.revisionLimit) * 100) : 0} sx={{ height: 6, borderRadius: 99, bgcolor: progressTrack, mt: 1.5, "& .MuiLinearProgress-bar": { bgcolor: accent } }} />
            </PortalSection>

            <PortalSection title="Project Notes" subtitle="Notes intentionally shared with you.">
              {portal.clientNotes ? (
                <Typography sx={{ color: ink, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{portal.clientNotes}</Typography>
              ) : <PortalEmpty asset="feedback" title="No client notes" body="Your editor has not shared any project notes yet." compact />}
            </PortalSection>

            <PortalSection title="Timeline" subtitle="Major client-visible milestones.">
              {portal.events.length ? (
                <Stack gap={1.3}>
                  {[...portal.events].reverse().map((item) => (
                    <Box key={`${item.createdAt}-${item.title}`} sx={{ pl: 1.35, borderLeft: `2px solid ${border}` }}>
                      <Typography sx={{ color: accent, fontSize: 11.5, fontWeight: 760 }}>{formatDateTime(item.createdAt)}</Typography>
                      <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760, mt: 0.3 }}>{item.title}</Typography>
                      <Typography sx={{ color: muted, fontSize: 12, lineHeight: 1.45, mt: 0.3 }}>{item.body}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : <PortalEmpty asset="schedule" title="No timeline events" body="Project milestones will appear here as work moves forward." compact />}
            </PortalSection>

            <PortalSection title="Recent Activity" subtitle="Latest project updates.">
              {portal.events.length ? (
                <Stack divider={<Divider flexItem sx={{ borderColor: border }} />}>
                  {portal.events.slice(0, 5).map((item) => (
                    <Box key={`${item.createdAt}-${item.title}`} sx={{ py: 1 }}>
                      <Typography sx={{ color: ink, fontSize: 13, fontWeight: 760 }}>{item.title}</Typography>
                      <Typography sx={{ color: muted, fontSize: 11.5, mt: 0.25 }}>{formatDateTime(item.createdAt)}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : <PortalEmpty asset="schedule" title="No recent activity" body="Updates will appear as the editor advances the project." compact />}
            </PortalSection>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function PortalState({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: canvas, color: ink, display: "grid", placeItems: "center", px: 2 }}>
      <Paper sx={{ ...panelSx, width: "min(100%, 620px)", p: { xs: 3, md: 5 }, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}><CutLabLockup subtitle="Client Portal" /></Box>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>{children}</Box>
        <Typography sx={{ fontFamily: headingFont, fontSize: 28, fontWeight: 760 }}>{title}</Typography>
        <Typography sx={{ color: muted, fontSize: 13.5, lineHeight: 1.65, mt: 1 }}>{body}</Typography>
      </Paper>
    </Box>
  );
}

function PortalSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Paper component="section" sx={{ ...panelSx, p: 2 }}>
      <Typography sx={{ color: ink, fontSize: 19, fontWeight: 760 }}>{title}</Typography>
      <Typography sx={{ color: muted, fontSize: 12.5, mt: 0.35, mb: 1.6 }}>{subtitle}</Typography>
      {children}
    </Paper>
  );
}

function PortalEmpty({ asset, title, body, compact = false }: { asset: keyof typeof emptyStateAssets; title: string; body: string; compact?: boolean }) {
  return (
    <Stack direction={compact ? "row" : "column"} alignItems="center" justifyContent="center" gap={1.2} sx={{ minHeight: compact ? 90 : 170, textAlign: compact ? "left" : "center" }}>
      <Box component="img" src={emptyStateAssets[asset]} alt="" aria-hidden="true" sx={{ width: compact ? 84 : 130, flexShrink: 0 }} />
      <Box>
        <Typography sx={{ color: ink, fontSize: 13.5, fontWeight: 760 }}>{title}</Typography>
        <Typography sx={{ color: muted, fontSize: 11.5, lineHeight: 1.45, mt: 0.3 }}>{body}</Typography>
      </Box>
    </Stack>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.15, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel }}>
      <Typography sx={{ color: muted, fontSize: 10.5, fontWeight: 760, textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ color: ink, fontSize: 12.5, fontWeight: 760, mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}

function SummaryMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Box sx={{ width: 34, height: 34, borderRadius: "6px", border: `1px solid ${border}`, display: "grid", placeItems: "center", color: accent, bgcolor: panel, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: muted, fontSize: 10.5, fontWeight: 760, textTransform: "uppercase" }}>{label}</Typography>
        <Typography sx={{ color: ink, fontSize: 12.5, fontWeight: 760, mt: 0.2 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function MiniNumber({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ p: 1, border: `1px solid ${border}`, borderRadius: "6px", bgcolor: panel, textAlign: "center" }}>
      <Typography sx={{ color: ink, fontSize: 24, fontWeight: 760, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: muted, fontSize: 10.5, mt: 0.45 }}>{label}</Typography>
    </Box>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "success" | "warning" | "neutral" }) {
  const palette = {
    success: { bg: "var(--app-success-bg, rgba(35,181,142,0.14))", fg: `var(--app-success, ${cutlab.color.success})` },
    warning: { bg: "var(--app-warning-bg, rgba(245,166,35,0.14))", fg: `var(--app-warning, ${cutlab.color.warning})` },
    neutral: { bg: softPanel, fg: muted }
  }[tone];
  return <Chip label={label} size="small" sx={{ bgcolor: palette.bg, color: palette.fg, borderRadius: "5px", fontSize: 11.5, fontWeight: 760, justifySelf: "start" }} />;
}

function deliverableTone(status: string): "success" | "warning" | "neutral" {
  if (status === "approved" || status === "final_delivered") return "success";
  if (status === "sent_to_client" || status === "changes_requested") return "warning";
  return "neutral";
}

function formatDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
    : value || "Not scheduled";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
    : "Recently";
}

const iconButtonSx = {
  minWidth: 36,
  width: 36,
  height: 36,
  color: accent,
  p: 0,
  border: `1px solid ${border}`,
  borderRadius: "6px"
};

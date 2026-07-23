"use client";

import Link from "next/link";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { CutLabLockup } from "../cutlab-brand";
import { emptyStateAssets } from "../brand-assets";
import { cutlab, cutlabPanelSx } from "../design-system";

export default function ClientPortalLandingPage() {
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: `var(--app-canvas, ${cutlab.color.charcoal})`, color: `var(--app-ink, ${cutlab.color.softWhite})`, display: "grid", placeItems: "center", px: 2 }}>
      <Paper sx={{ ...cutlabPanelSx, width: "min(100%, 680px)", p: { xs: 3, md: 5 }, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <CutLabLockup subtitle="Client Portal" />
        </Box>
        <Box component="img" src={emptyStateAssets.projects} alt="" aria-hidden="true" sx={{ width: 210, maxWidth: "70%", mb: 2 }} />
        <Typography sx={{ fontFamily: cutlab.font.heading, fontSize: { xs: 28, md: 36 }, fontWeight: 760 }}>
          A project link is required
        </Typography>
        <Typography sx={{ color: "var(--app-muted, #A5ADB4)", fontSize: 14, lineHeight: 1.65, maxWidth: 500, mx: "auto", mt: 1 }}>
          No account required. Open the unique portal link shared by your editor to track progress, review deliverables, and submit revision requests.
        </Typography>
        <Button component={Link} href="/" variant="outlined" startIcon={<ArrowBackOutlinedIcon />} sx={{ mt: 3, borderColor: "var(--app-border, #2A3138)", color: "var(--app-accent, #2D8C97)" }}>
          Back to Frame Desk
        </Button>
      </Paper>
    </Box>
  );
}

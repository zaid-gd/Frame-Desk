"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: "var(--app-canvas, #0C0F12)", color: "var(--app-ink, #E6E5E3)", px: 2 }}>
      <Paper sx={{ width: "min(100%, 500px)", p: 3, borderRadius: "8px", border: "1px solid var(--app-border, #2A3138)", bgcolor: "var(--app-panel, #1A1F24)", boxShadow: "none" }}>
        <Stack gap={2}>
          <Box>
            <Typography sx={{ fontFamily: "var(--font-space-grotesk)", fontSize: 26, fontWeight: 700 }}>Page not found</Typography>
            <Typography sx={{ mt: 0.8, color: "var(--app-muted, #A5ADB4)", fontSize: 14 }}>
              This CutLab route does not exist. Return to the dashboard to keep tracking work.
            </Typography>
          </Box>
          <Button component={Link} href="/" variant="contained" sx={{ width: "fit-content", bgcolor: "var(--app-accent, #2D8C97)", color: "#fff" }}>
            Back to Dashboard
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: "var(--app-canvas, #0C0F12)", color: "var(--app-ink, #E6E5E3)", px: 2 }}>
      <Paper sx={{ width: "min(100%, 520px)", p: 3, borderRadius: "8px", border: "1px solid var(--app-border, #2A3138)", bgcolor: "var(--app-panel, #1A1F24)", boxShadow: "none" }}>
        <Stack gap={2}>
          <Box>
            <Typography sx={{ fontFamily: "var(--font-space-grotesk)", fontSize: 26, fontWeight: 700 }}>CutLab needs a refresh</Typography>
            <Typography sx={{ mt: 0.8, color: "var(--app-muted, #A5ADB4)", fontSize: 14 }}>
              The tracker hit an unexpected app error. Your saved projects stay in local browser storage.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Button variant="contained" onClick={reset} sx={{ bgcolor: "var(--app-accent, #2D8C97)", color: "#fff" }}>
              Try Again
            </Button>
            <Button component={Link} href="/" variant="outlined" sx={{ borderColor: "var(--app-border, #2A3138)", color: "var(--app-highlight, #69C4CE)" }}>
              Back to Dashboard
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

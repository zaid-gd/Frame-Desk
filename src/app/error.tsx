"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: "var(--app-canvas, #fbfaf8)", color: "var(--app-ink, #19171f)", px: 2 }}>
      <Paper sx={{ width: "min(100%, 520px)", p: 3, borderRadius: "8px", border: "1px solid var(--app-border, #dedbe5)", bgcolor: "var(--app-panel, #ffffff)", boxShadow: "none" }}>
        <Stack gap={2}>
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 760 }}>CutLab needs a refresh</Typography>
            <Typography sx={{ mt: 0.8, color: "var(--app-muted, #6f6a78)", fontSize: 14 }}>
              The tracker hit an unexpected app error. Your saved projects stay in local browser storage.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Button variant="contained" onClick={reset} sx={{ bgcolor: "var(--app-accent, #5b3fa0)", color: "#fff" }}>
              Try Again
            </Button>
            <Button component={Link} href="/" variant="outlined" sx={{ borderColor: "var(--app-border, #dedbe5)", color: "var(--app-accent, #5b3fa0)" }}>
              Back to Dashboard
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: "var(--app-canvas, #fbfaf8)", color: "var(--app-ink, #19171f)", px: 2 }}>
      <Paper sx={{ width: "min(100%, 500px)", p: 3, borderRadius: "8px", border: "1px solid var(--app-border, #dedbe5)", bgcolor: "var(--app-panel, #ffffff)", boxShadow: "none" }}>
        <Stack gap={2}>
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 760 }}>Page not found</Typography>
            <Typography sx={{ mt: 0.8, color: "var(--app-muted, #6f6a78)", fontSize: 14 }}>
              This CutLab route does not exist. Return to the dashboard to keep tracking work.
            </Typography>
          </Box>
          <Button component={Link} href="/" variant="contained" sx={{ width: "fit-content", bgcolor: "var(--app-accent, #5b3fa0)", color: "#fff" }}>
            Back to Dashboard
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

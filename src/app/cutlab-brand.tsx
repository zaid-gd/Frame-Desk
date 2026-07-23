import { Box, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import Link from "next/link";

export function CutLabMark({ size = 36, sx }: { size?: number; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Box
        component="img"
        src="/brand/favicon.png"
        alt="Frame Desk"
        className="brand-logo-light"
        sx={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <Box
        component="img"
        src="/brand/app-icon-dark.svg"
        alt=""
        aria-hidden="true"
        className="brand-logo-dark"
        sx={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}

export function CutLabLockup({
  compact = false,
  subtitle,
  sx
}: {
  compact?: boolean;
  subtitle?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack
      component={Link}
      href="/"
      aria-label="Go to dashboard"
      alignItems="flex-start"
      gap={0.35}
      sx={{ width: "fit-content", color: "inherit", textDecoration: "none", ...sx }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65, minHeight: compact ? 34 : 42 }}>
        <Typography sx={{ color: "var(--app-ink)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", fontSize: compact ? 26 : 34, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 1 }}>
          Frame
        </Typography>
        <Typography sx={{ color: "var(--app-accent)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", fontSize: compact ? 26 : 34, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 1 }}>
          Desk
        </Typography>
      </Box>
      {subtitle ? (
        <Typography sx={{ color: "var(--app-muted)", fontSize: 10, fontWeight: 600, letterSpacing: "0.11em", pl: 0.2, textTransform: "uppercase" }}>
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

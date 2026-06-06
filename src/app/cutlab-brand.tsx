import { Box, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import Link from "next/link";

const logoAspectRatio = 950 / 360;

export function CutLabMark({ size = 36, sx }: { size?: number; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="img"
      src="/brand/logo/cutlab-studio.png"
      alt="CutLab Studio"
      sx={{
        display: "block",
        width: Math.round(size * logoAspectRatio),
        height: size,
        objectFit: "contain",
        objectPosition: "left center",
        flexShrink: 0,
        ...sx
      }}
    />
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
      <CutLabMark size={compact ? 34 : 42} />
      {subtitle ? (
        <Typography sx={{ color: "var(--app-muted)", fontSize: 10, fontWeight: 600, letterSpacing: "0.11em", pl: 0.2, textTransform: "uppercase" }}>
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

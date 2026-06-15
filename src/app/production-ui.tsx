"use client";

import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

const ink = "var(--app-ink)";
const muted = "var(--app-muted)";
const border = "var(--app-border)";
const accent = "var(--app-accent)";
const panel = "var(--app-panel)";
const softPanel = "var(--app-soft-panel)";

export type MetricRailItem = {
  label: string;
  value: string;
  helper: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
};

type MetricRailProps = {
  items: readonly MetricRailItem[];
  sx?: SxProps<Theme>;
};

const metricTone = {
  default: muted,
  accent,
  success: "var(--app-success)",
  warning: "var(--app-warning)",
} as const;

export function MetricRail({ items, sx }: MetricRailProps) {
  const lastMobileRowStart = Math.floor((items.length - 1) / 2) * 2;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: `repeat(${items.length}, minmax(0, 1fr))`,
        },
        border: `1px solid ${border}`,
        borderRadius: "8px",
        overflow: "hidden",
        bgcolor: panel,
        ...sx,
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.label}
          sx={{
            minWidth: 0,
            px: { xs: 1.5, md: 2 },
            py: { xs: 1.5, md: 1.8 },
            borderRight: {
              xs: index % 2 === 0 ? `1px solid ${border}` : 0,
              md: index === items.length - 1 ? 0 : `1px solid ${border}`,
            },
            borderBottom: {
              xs: index < lastMobileRowStart ? `1px solid ${border}` : 0,
              md: 0,
            },
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.75}>
            {item.icon ? (
              <Box sx={{ color: metricTone[item.tone ?? "default"], display: "grid", "& svg": { fontSize: 17 } }}>
                {item.icon}
              </Box>
            ) : null}
            <Typography noWrap sx={{ color: muted, fontSize: 11, fontWeight: 750 }}>
              {item.label}
            </Typography>
          </Stack>
          <Typography
            noWrap
            sx={{
              color: ink,
              fontFamily: "var(--font-geist-sans), Geist, sans-serif",
              fontSize: { xs: 22, md: 24 },
              fontWeight: 650,
              lineHeight: 1,
              mt: 0.85,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {item.value}
          </Typography>
          <Typography noWrap sx={{ color: muted, fontSize: 11, mt: 0.55 }}>
            {item.helper}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

type SectionModuleProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  sx?: SxProps<Theme>;
};

export function SectionModule({ title, description, action, children, aside, sx }: SectionModuleProps) {
  return (
    <Box component="section" sx={{ border: `1px solid ${border}`, borderRadius: "8px", bgcolor: panel, overflow: "hidden", ...sx }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        gap={1.5}
        sx={{ px: { xs: 1.5, md: 2 }, py: 1.5, mb: 0, borderBottom: `1px solid ${border}` }}
      >
        <Box>
          <Typography sx={{ color: ink, fontSize: 15, fontWeight: 720 }}>{title}</Typography>
          {description ? (
            <Typography sx={{ color: muted, fontSize: 12.5, lineHeight: 1.5, mt: 0.35, maxWidth: 660 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Stack>
      {aside ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 300px" },
            gap: 0,
            alignItems: "start",
          }}
        >
          <Box sx={{ minWidth: 0, p: { xs: 1.5, md: 2 } }}>{children}</Box>
          <Box sx={{ minWidth: 0, borderLeft: { xl: `1px solid ${border}` }, p: { xs: 1.5, md: 2 } }}>{aside}</Box>
        </Box>
      ) : <Box sx={{ p: { xs: 1.5, md: 2 } }}>{children}</Box>}
    </Box>
  );
}

type SplitWorkspaceProps = {
  rail: ReactNode;
  detail: ReactNode;
  railWidth?: number;
};

export function SplitWorkspace({ rail, detail, railWidth = 340 }: SplitWorkspaceProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", xl: `${railWidth}px minmax(0, 1fr)` },
        border: `1px solid ${border}`,
        borderRadius: "8px",
        overflow: "hidden",
        bgcolor: panel,
        minHeight: 420,
      }}
    >
      <Box sx={{ minWidth: 0, borderRight: { xl: `1px solid ${border}` }, bgcolor: softPanel }}>{rail}</Box>
      <Box sx={{ minWidth: 0 }}>{detail}</Box>
    </Box>
  );
}

type SectionEyebrowProps = {
  children: ReactNode;
};

export function SectionEyebrow({ children }: SectionEyebrowProps) {
  return (
    <Typography sx={{ color: accent, fontSize: 10, fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {children}
    </Typography>
  );
}

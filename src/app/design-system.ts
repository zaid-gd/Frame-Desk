import type { SxProps, Theme } from "@mui/material/styles";

export const cutlab = {
  color: {
    charcoal: "#0B0F14",
    graphite: "#11161D",
    softWhite: "#F1F5F9",
    teal: "#14B8A6",
    cyan: "#2DD4BF",
    deepTeal: "#0EA5E9",
    aqua: "#5EEAD4",
    sky: "#38BDF8",
    indigo: "#818CF8",
    pink: "#F472B6",
    slate: "#1A212B",
    steel: "#2A3340",
    coolGray: "#64748B",
    mist: "#94A3B8",
    success: "#22C55E",
    warning: "#FBBF24",
    error: "#EF4444",
    info: "#3B82F6"
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 24,
    6: 32,
    7: 40,
    8: 48,
    9: 64,
    10: 80
  },
  shadow: {
    0: "none",
    1: "0 10px 30px rgba(0, 7, 10, 0.12)",
    2: "0 18px 48px rgba(0, 7, 10, 0.2)",
    3: "0 28px 80px rgba(0, 7, 10, 0.3)"
  },
  font: {
    heading: "var(--font-space-grotesk), var(--font-geist-sans), Geist, sans-serif",
    body: "var(--font-geist-sans), Geist, sans-serif"
  }
} as const;

export const cutlabPanelSx: SxProps<Theme> = {
  bgcolor: "var(--app-panel)",
  border: "1px solid var(--app-border)",
  borderRadius: `${cutlab.radius.sm}px`,
  boxShadow: cutlab.shadow[0],
  backgroundImage: "none",
  overflow: "hidden"
};

export const cutlabOutlineButtonSx: SxProps<Theme> = {
  minHeight: 40,
  px: 2,
  borderRadius: `${cutlab.radius.sm}px`,
  borderColor: "var(--app-accent)",
  color: "var(--app-highlight)",
  bgcolor: "transparent",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
  transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 120ms ease",
  "&:hover": {
    borderColor: "var(--app-highlight)",
    bgcolor: "var(--app-active)"
  },
  "&:active": {
    transform: "translateY(1px)"
  },
  "&:focus-visible": {
    outline: "2px solid var(--app-highlight)",
    outlineOffset: 2
  }
};

export function cutlabThemeVariables(isDark: boolean, accent: string = cutlab.color.teal) {
  return {
    "--app-accent": accent,
    "--app-highlight": isDark ? cutlab.color.cyan : "#0F766E",
    "--app-canvas": isDark ? cutlab.color.charcoal : "#F8FAFC",
    "--app-panel": isDark ? cutlab.color.graphite : "#FFFFFF",
    "--app-sidebar": isDark ? "#0F141A" : "#F1F5F9",
    "--app-soft-panel": isDark ? cutlab.color.slate : "#F1F5F9",
    "--app-header-panel": isDark ? "#141B23" : "#FFFFFF",
    "--app-active": isDark ? "rgba(20, 184, 166, 0.16)" : "rgba(20, 184, 166, 0.16)",
    "--app-hover": isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(15, 23, 42, 0.05)",
    "--app-ink": isDark ? cutlab.color.softWhite : "#0F172A",
    "--app-muted": isDark ? cutlab.color.mist : "#64748B",
    "--app-subtle": isDark ? "#64748B" : "#94A3B8",
    "--app-border": isDark ? cutlab.color.steel : "#E2E8F0",
    "--app-strong-border": isDark ? "#3B4756" : "#CBD5E1",
    "--app-control": isDark ? "#0F141A" : "#FFFFFF",
    "--app-success": isDark ? cutlab.color.success : "#16A34A",
    "--app-warning": isDark ? cutlab.color.warning : "#D97706",
    "--app-danger": isDark ? cutlab.color.error : "#DC2626",
    "--app-success-bg": isDark ? "rgba(34, 197, 94, 0.14)" : "rgba(22, 163, 74, 0.1)",
    "--app-warning-bg": isDark ? "rgba(251, 191, 36, 0.14)" : "rgba(217, 119, 6, 0.1)",
    "--app-danger-bg": isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(220, 38, 38, 0.1)",
    "--app-progress-track": isDark ? "#26313D" : "#E2E8F0",
    "--app-chart-grid": isDark ? "#26313D" : "#E2E8F0",
    "--app-avatar-surface": isDark ? cutlab.color.slate : "#E2E8F0",
    "--app-thumb-icon": isDark ? "rgba(244,246,248,0.38)" : "rgba(23,26,33,0.36)",
    "--app-shadow-1": cutlab.shadow[1],
    "--app-shadow-2": cutlab.shadow[2]
  } as Record<string, string>;
}

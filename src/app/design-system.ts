import type { SxProps, Theme } from "@mui/material/styles";

export const cutlab = {
  color: {
    charcoal: "#0C0F12",
    graphite: "#1A1F24",
    softWhite: "#E6E5E3",
    teal: "#2D8C97",
    cyan: "#69C4CE",
    deepTeal: "#1E6B73",
    aqua: "#9BE0E8",
    slate: "#2A3440",
    steel: "#3A4552",
    coolGray: "#5A646E",
    mist: "#7B848E",
    success: "#23B58E",
    warning: "#F5A623",
    error: "#FF5B5B"
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
    1: "0 8px 24px rgba(0, 8, 12, 0.18)",
    2: "0 16px 44px rgba(0, 8, 12, 0.28)",
    3: "0 24px 72px rgba(0, 8, 12, 0.38)"
  },
  font: {
    heading: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
    body: "var(--font-inter), Inter, sans-serif"
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
    "--app-highlight": isDark ? cutlab.color.cyan : cutlab.color.deepTeal,
    "--app-canvas": isDark ? cutlab.color.charcoal : "#F3F5F5",
    "--app-panel": isDark ? cutlab.color.graphite : "#FFFFFF",
    "--app-soft-panel": isDark ? "#151B20" : "#E9EDEE",
    "--app-header-panel": isDark ? "#20272D" : "#E2E7E8",
    "--app-active": isDark ? "rgba(45, 140, 151, 0.18)" : "rgba(45, 140, 151, 0.12)",
    "--app-hover": isDark ? "rgba(105, 196, 206, 0.09)" : "rgba(45, 140, 151, 0.08)",
    "--app-ink": isDark ? cutlab.color.softWhite : "#182126",
    "--app-muted": isDark ? "#A5ADB4" : "#5A646E",
    "--app-subtle": isDark ? cutlab.color.mist : "#68717C",
    "--app-border": isDark ? "#2A3138" : "#C9D0D3",
    "--app-strong-border": isDark ? cutlab.color.steel : "#A9B3B8",
    "--app-control": isDark ? "#11161A" : "#FFFFFF",
    "--app-success": cutlab.color.success,
    "--app-warning": cutlab.color.warning,
    "--app-danger": cutlab.color.error,
    "--app-success-bg": isDark ? "rgba(35, 181, 142, 0.14)" : "rgba(35, 181, 142, 0.13)",
    "--app-warning-bg": isDark ? "rgba(245, 166, 35, 0.14)" : "rgba(245, 166, 35, 0.14)",
    "--app-danger-bg": isDark ? "rgba(255, 91, 91, 0.14)" : "rgba(255, 91, 91, 0.12)",
    "--app-progress-track": isDark ? "#293139" : "#D9E0E2",
    "--app-avatar-surface": isDark ? cutlab.color.slate : "#D8E0E3",
    "--app-thumb-icon": isDark ? "rgba(230,229,227,0.42)" : "rgba(24,33,38,0.34)",
    "--app-shadow-1": cutlab.shadow[1],
    "--app-shadow-2": cutlab.shadow[2]
  } as Record<string, string>;
}

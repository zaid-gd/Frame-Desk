import type { SxProps, Theme } from "@mui/material/styles";

export const cutlab = {
  color: {
    charcoal: "#111318",
    graphite: "#181B21",
    softWhite: "#F4F6F8",
    teal: "#3478F6",
    cyan: "#81AAFF",
    deepTeal: "#1F66E5",
    aqua: "#B9CFFF",
    slate: "#282D36",
    steel: "#3B424D",
    coolGray: "#667085",
    mist: "#858E9D",
    success: "#2D9B63",
    warning: "#CC7A16",
    error: "#D14343"
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
    heading: "var(--font-geist-sans), Geist, sans-serif",
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
    "--app-highlight": isDark ? "#81AAFF" : "#1F66E5",
    "--app-canvas": isDark ? "#111318" : "#F7F8FA",
    "--app-panel": isDark ? "#181B21" : "#FFFFFF",
    "--app-sidebar": isDark ? "#14161B" : "#F5F6F8",
    "--app-soft-panel": isDark ? "#1D2027" : "#F3F5F7",
    "--app-header-panel": isDark ? "#22262E" : "#EEF1F5",
    "--app-active": isDark ? "rgba(90, 145, 255, 0.14)" : "rgba(52, 120, 246, 0.1)",
    "--app-hover": isDark ? "rgba(255, 255, 255, 0.055)" : "rgba(31, 41, 55, 0.05)",
    "--app-ink": isDark ? "#F4F6F8" : "#171A21",
    "--app-muted": isDark ? "#A0A7B4" : "#667085",
    "--app-subtle": isDark ? "#858E9D" : "#7F8898",
    "--app-border": isDark ? "#2D323B" : "#E1E5EB",
    "--app-strong-border": isDark ? "#3B424D" : "#CBD1DA",
    "--app-control": isDark ? "#15181E" : "#FFFFFF",
    "--app-success": cutlab.color.success,
    "--app-warning": cutlab.color.warning,
    "--app-danger": cutlab.color.error,
    "--app-success-bg": isDark ? "rgba(86, 189, 131, 0.12)" : "rgba(45, 155, 99, 0.1)",
    "--app-warning-bg": isDark ? "rgba(225, 162, 75, 0.12)" : "rgba(204, 122, 22, 0.11)",
    "--app-danger-bg": isDark ? "rgba(239, 106, 106, 0.12)" : "rgba(209, 67, 67, 0.1)",
    "--app-progress-track": isDark ? "#2B3039" : "#E7EAF0",
    "--app-chart-grid": isDark ? "#303640" : "#E5E8EE",
    "--app-avatar-surface": isDark ? "#282D36" : "#E8EDF5",
    "--app-thumb-icon": isDark ? "rgba(244,246,248,0.38)" : "rgba(23,26,33,0.36)",
    "--app-shadow-1": cutlab.shadow[1],
    "--app-shadow-2": cutlab.shadow[2]
  } as Record<string, string>;
}

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
  },
  typography: {
    display: "clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)",
    title: "clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)",
    body: "0.875rem",
    label: "0.75rem",
    lineBody: 1.5,
    lineTight: 1.2
  },
  motion: {
    fast: "120ms",
    base: "180ms",
    slow: "280ms",
    easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)"
  },
  density: {
    compact: { controlHeight: 32, rowHeight: 48, sectionGap: 16 },
    comfortable: { controlHeight: 48, rowHeight: 58, sectionGap: 24 }
  }
} as const;

function accentForeground(accent: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(accent);
  if (!match) return "#042F2E";
  const value = Number.parseInt(match[1], 16);
  const luminance = (red: number, green: number, blue: number) => {
    const linear = [red, green, blue].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const accentLuminance = luminance((value >> 16) & 255, (value >> 8) & 255, value & 255);
  const inkLuminance = luminance(4, 47, 46);
  const whiteContrast = 1.05 / (accentLuminance + 0.05);
  const inkContrast =
    (Math.max(accentLuminance, inkLuminance) + 0.05)
    / (Math.min(accentLuminance, inkLuminance) + 0.05);
  return inkContrast >= whiteContrast ? "#042F2E" : "#FFFFFF";
}

export function cutlabThemeVariables(isDark: boolean, accent: string = cutlab.color.teal) {
  return {
    "--app-accent": accent,
    "--app-accent-foreground": accentForeground(accent),
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
    "--app-shadow-2": cutlab.shadow[2],
    "--surface-canvas": isDark ? cutlab.color.charcoal : "#F8FAFC",
    "--surface-panel": isDark ? cutlab.color.graphite : "#FFFFFF",
    "--surface-panel-raised": isDark ? "#141B23" : "#FFFFFF",
    "--surface-sunken": isDark ? "#0F141A" : "#F1F5F9",
    "--surface-overlay": isDark ? cutlab.color.slate : "#FFFFFF",
    "--text-primary": isDark ? cutlab.color.softWhite : "#0F172A",
    "--text-secondary": isDark ? "#CBD5E1" : "#475569",
    "--text-muted": isDark ? cutlab.color.mist : "#64748B",
    "--text-disabled": isDark ? "#64748B" : "#94A3B8",
    "--focus-ring": isDark ? cutlab.color.aqua : "#0F766E",
    "--selected-bg": isDark ? "rgba(20, 184, 166, 0.18)" : "rgba(20, 184, 166, 0.14)",
    "--disabled-bg": isDark ? cutlab.color.slate : "#F1F5F9",
    "--background": "var(--app-canvas)",
    "--foreground": "var(--app-ink)",
    "--card": "var(--app-panel)",
    "--card-foreground": "var(--app-ink)",
    "--popover": "var(--app-panel)",
    "--popover-foreground": "var(--app-ink)",
    "--primary": "var(--app-accent)",
    "--primary-foreground": "var(--app-accent-foreground)",
    "--secondary": "var(--app-soft-panel)",
    "--secondary-foreground": "var(--app-ink)",
    "--muted": "var(--app-soft-panel)",
    "--muted-foreground": "var(--app-muted)",
    "--accent": "var(--app-soft-panel)",
    "--accent-foreground": "var(--app-ink)",
    "--destructive": "var(--app-danger)",
    "--border": "var(--app-border)",
    "--input": "var(--app-border)",
    "--ring": "var(--app-accent)"
  } as Record<string, string>;
}

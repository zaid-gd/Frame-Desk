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

export function cutlabThemeVariables(accent: string = cutlab.color.teal) {
  return {
    "--app-accent": accent,
    "--app-accent-foreground": accentForeground(accent),
  } as Record<string, string>;
}

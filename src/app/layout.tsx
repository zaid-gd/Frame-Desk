import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cutlab.studio"),
  applicationName: "CutLab Studio",
  title: "CutLab Studio",
  description: "A local-first video editing work tracker for editors.",
  keywords: ["video editing", "project tracker", "local-first", "editing workflow", "salary batch"],
  authors: [{ name: "CutLab Studio" }],
  creator: "CutLab Studio",
  openGraph: {
    title: "CutLab Studio",
    description: "A local-first video editing work tracker for editors.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1600,
        height: 900,
        alt: "CutLab Studio dashboard overview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CutLab Studio",
    description: "A local-first video editing work tracker for editors.",
    images: ["/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/brand/icons/app-icon-dark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icons/app-icon-dark-64.png", sizes: "64x64", type: "image/png" }
    ],
    shortcut: "/brand/icons/app-icon-dark-32.png",
    apple: "/brand/icons/app-icon-dark-256.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0F12" }
  ]
};

const themeBootScript = `
(function () {
  try {
    var raw = window.localStorage.getItem("video-editing-work-tracker:settings:v1");
    var settings = raw ? JSON.parse(raw) : {};
    var theme = ["Light", "Dark", "System"].indexOf(settings.theme) >= 0 ? settings.theme : "Dark";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "Dark" || (theme === "System" && prefersDark);
    var accent = typeof settings.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(settings.accentColor) ? settings.accentColor : "#2D8C97";
    var root = document.documentElement;
    var vars = {
      "--app-accent": accent,
      "--app-highlight": isDark ? "#69C4CE" : "#1E6B73",
      "--app-canvas": isDark ? "#0C0F12" : "#F3F5F5",
      "--app-panel": isDark ? "#1A1F24" : "#FFFFFF",
      "--app-soft-panel": isDark ? "#151B20" : "#E9EDEE",
      "--app-header-panel": isDark ? "#20272D" : "#E2E7E8",
      "--app-active": isDark ? "rgba(45,140,151,0.18)" : "rgba(45,140,151,0.12)",
      "--app-hover": isDark ? "rgba(105,196,206,0.09)" : "rgba(45,140,151,0.08)",
      "--app-ink": isDark ? "#E6E5E3" : "#182126",
      "--app-muted": isDark ? "#A5ADB4" : "#5A646E",
      "--app-subtle": isDark ? "#7B848E" : "#68717C",
      "--app-border": isDark ? "#2A3138" : "#C9D0D3",
      "--app-strong-border": isDark ? "#3A4552" : "#A9B3B8",
      "--app-control": isDark ? "#11161A" : "#FFFFFF",
      "--app-success": "#23B58E",
      "--app-warning": "#F5A623",
      "--app-danger": "#FF5B5B",
      "--app-success-bg": isDark ? "rgba(35,181,142,0.14)" : "rgba(35,181,142,0.13)",
      "--app-warning-bg": "rgba(245,166,35,0.14)",
      "--app-danger-bg": isDark ? "rgba(255,91,91,0.14)" : "rgba(255,91,91,0.12)",
      "--app-progress-track": isDark ? "#293139" : "#D9E0E2",
      "--app-avatar-surface": isDark ? "#2A3440" : "#D8E0E3",
      "--app-thumb-icon": isDark ? "rgba(230,229,227,0.42)" : "rgba(24,33,38,0.34)",
      "--app-shadow-1": "0 8px 24px rgba(0,8,12,0.18)",
      "--app-shadow-2": "0 16px 44px rgba(0,8,12,0.28)"
    };
    Object.keys(vars).forEach(function (key) { root.style.setProperty(key, vars[key]); });
    root.style.colorScheme = isDark ? "dark" : "light";
    root.dataset.theme = isDark ? "dark" : "light";
  } catch {}
})();
`;

const clerkModalCenteringCss = `
[class*="cl-modalBackdrop"] {
  align-items: center !important;
  display: flex !important;
  justify-content: center !important;
  min-height: 100dvh !important;
  padding: 24px !important;
}

[class*="cl-modalContent"] {
  margin: auto !important;
  max-height: calc(100dvh - 48px) !important;
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <style data-clerk-modal-centering dangerouslySetInnerHTML={{ __html: clerkModalCenteringCss }} />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable}`}
        style={{
          margin: 0,
          background: "var(--app-canvas, #0C0F12)",
          color: "var(--app-ink, #E6E5E3)",
          fontFamily: "var(--font-inter), Inter, sans-serif"
        }}
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

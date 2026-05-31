import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

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
    icon: "/icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ]
};

const themeBootScript = `
(function () {
  try {
    var raw = window.localStorage.getItem("video-editing-work-tracker:settings:v1");
    var settings = raw ? JSON.parse(raw) : {};
    var theme = ["Light", "Dark", "System"].indexOf(settings.theme) >= 0 ? settings.theme : "Light";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "Dark" || (theme === "System" && prefersDark);
    var accent = typeof settings.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(settings.accentColor) ? settings.accentColor : "#5b3fa0";
    var root = document.documentElement;
    var vars = {
      "--app-accent": accent,
      "--app-canvas": isDark ? "#09090b" : "#fbfaf8",
      "--app-panel": isDark ? "#18181b" : "#ffffff",
      "--app-soft-panel": isDark ? "#202024" : "#fbfafc",
      "--app-header-panel": isDark ? "#242428" : "#f6f3f8",
      "--app-active": isDark ? "#27272f" : "#f0eafa",
      "--app-hover": isDark ? "#232329" : "#f7f4fc",
      "--app-ink": isDark ? "#f8fafc" : "#19171f",
      "--app-muted": isDark ? "#c4c4cc" : "#6f6a78",
      "--app-border": isDark ? "#3f3f46" : "#dedbe5",
      "--app-control": isDark ? "#111114" : "#ffffff",
      "--app-success-bg": isDark ? "#14311f" : "#e9f5e9",
      "--app-warning-bg": isDark ? "#342713" : "#fff4dc",
      "--app-danger-bg": isDark ? "#35191d" : "#fae8e6",
      "--app-progress-track": isDark ? "#3a3a42" : "#ece8f4",
      "--app-avatar-surface": isDark ? "#27272f" : "#dfe7ef",
      "--app-thumb-icon": isDark ? "rgba(248,250,252,0.38)" : "rgba(25,23,31,0.34)"
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
      <body style={{ background: "var(--app-canvas, #fbfaf8)", color: "var(--app-ink, #19171f)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { PrivacyControls } from "@/components/privacy-controls";
import { siteUrl } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

const siteTitle = "CutLab Studio | Video Production Workspace for Editors";
const siteDescription = "Plan edits, track deadlines, manage client feedback, organize media, and monitor production work in one focused workspace built for video editors.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "CutLab Studio",
  title: siteTitle,
  description: siteDescription,
  keywords: ["video editing", "project tracker", "local-first", "editing workflow", "salary batch"],
  authors: [{ name: "CutLab Studio" }],
  creator: "CutLab Studio",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName: "CutLab Studio",
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
    title: siteTitle,
    description: siteDescription,
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

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CutLab Studio",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteDescription,
  image: `${siteUrl}/og-image.png`,
  publisher: {
    "@type": "Organization",
    name: "CutLab Studio",
    url: siteUrl,
    email: "Cutlab.Studios@gmail.com"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F4F2" },
    { media: "(prefers-color-scheme: dark)", color: "#090C0D" }
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
    var accent = typeof settings.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(settings.accentColor) ? settings.accentColor : "#3478F6";
    var root = document.documentElement;
    var vars = {
      "--app-accent": accent,
      "--app-highlight": isDark ? "#81AAFF" : "#1F66E5",
      "--app-canvas": isDark ? "#111318" : "#F7F8FA",
      "--app-panel": isDark ? "#181B21" : "#FFFFFF",
      "--app-sidebar": isDark ? "#14161B" : "#F5F6F8",
      "--app-soft-panel": isDark ? "#1D2027" : "#F3F5F7",
      "--app-header-panel": isDark ? "#22262E" : "#EEF1F5",
      "--app-active": isDark ? "rgba(90,145,255,0.14)" : "rgba(52,120,246,0.10)",
      "--app-hover": isDark ? "rgba(255,255,255,0.055)" : "rgba(31,41,55,0.05)",
      "--app-ink": isDark ? "#F4F6F8" : "#171A21",
      "--app-muted": isDark ? "#A0A7B4" : "#667085",
      "--app-subtle": isDark ? "#858E9D" : "#7F8898",
      "--app-border": isDark ? "#2D323B" : "#E1E5EB",
      "--app-strong-border": isDark ? "#3B424D" : "#CBD1DA",
      "--app-control": isDark ? "#15181E" : "#FFFFFF",
      "--app-success": "#2D9B63",
      "--app-warning": "#CC7A16",
      "--app-danger": "#D14343",
      "--app-success-bg": isDark ? "rgba(86,189,131,0.12)" : "rgba(45,155,99,0.10)",
      "--app-warning-bg": isDark ? "rgba(225,162,75,0.12)" : "rgba(204,122,22,0.11)",
      "--app-danger-bg": isDark ? "rgba(239,106,106,0.12)" : "rgba(209,67,67,0.10)",
      "--app-progress-track": isDark ? "#2B3039" : "#E7EAF0",
      "--app-chart-grid": isDark ? "#303640" : "#E5E8EE",
      "--app-avatar-surface": isDark ? "#282D36" : "#E8EDF5",
      "--app-thumb-icon": isDark ? "rgba(244,246,248,0.38)" : "rgba(23,26,33,0.36)",
      "--app-shadow-1": isDark ? "0 10px 30px rgba(0,0,0,0.16)" : "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.04)",
      "--app-shadow-2": isDark ? "0 20px 56px rgba(0,0,0,0.30)" : "0 18px 50px rgba(16,24,40,0.12)"
    };
    Object.keys(vars).forEach(function (key) { root.style.setProperty(key, vars[key]); });
    root.style.colorScheme = isDark ? "dark" : "light";
    root.dataset.theme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
    root.classList.toggle("cutlab-density-compact", settings.density === "Compact");
    root.classList.toggle("cutlab-density-comfortable", settings.density !== "Compact");
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
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <Script id="cutlab-theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <style data-clerk-modal-centering dangerouslySetInnerHTML={{ __html: clerkModalCenteringCss }} />
      </head>
      <body
        className="antialiased"
        style={{
          margin: 0,
          background: "var(--app-canvas, #F7F8FA)",
          color: "var(--app-ink, #171A21)",
          fontFamily: "var(--font-geist-sans), Geist, sans-serif"
        }}
      >
        <a className="skip-link" href="#main-content">
          Skip to workspace content
        </a>
        <Providers>{children}</Providers>
        <PrivacyControls />
      </body>
    </html>
  );
}

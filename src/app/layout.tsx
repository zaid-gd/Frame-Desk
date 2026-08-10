import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Space_Grotesk } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["600", "700"] });

const siteTitle = "Frame Desk | Video Production Workspace for Editors";
const siteDescription = "Plan edits, track deadlines, manage client feedback, organize media, and monitor production work in one focused workspace built for video editors.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Frame Desk",
  title: siteTitle,
  description: siteDescription,
  keywords: ["video editing", "project tracker", "local-first", "editing workflow", "salary batch"],
  authors: [{ name: "Frame Desk" }],
  creator: "Frame Desk",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName: "Frame Desk",
    images: [
      {
        url: "/og-image.png",
        width: 1600,
        height: 900,
        alt: "Frame Desk dashboard overview"
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
  name: "Frame Desk",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteDescription,
  image: `${siteUrl}/og-image.png`,
  publisher: {
    "@type": "Organization",
    name: "Frame Desk",
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
    var theme = ["Light", "Dark", "System"].indexOf(settings.theme) >= 0 ? settings.theme : "Dark";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "Dark" || (theme === "System" && prefersDark);
    var accent = typeof settings.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(settings.accentColor) ? settings.accentColor : "#14B8A6";
    var accentValue = parseInt(accent.slice(1), 16);
    var toLinear = function (channel) {
      var normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    var luminance = function (red, green, blue) {
      return toLinear(red) * 0.2126 + toLinear(green) * 0.7152 + toLinear(blue) * 0.0722;
    };
    var accentLuminance = luminance((accentValue >> 16) & 255, (accentValue >> 8) & 255, accentValue & 255);
    var inkLuminance = luminance(4, 47, 46);
    var whiteContrast = 1.05 / (accentLuminance + 0.05);
    var inkContrast = (Math.max(accentLuminance, inkLuminance) + 0.05) / (Math.min(accentLuminance, inkLuminance) + 0.05);
    var accentForeground = inkContrast >= whiteContrast ? "#042F2E" : "#FFFFFF";
    var root = document.documentElement;
    var vars = {
      "--app-accent": accent,
      "--app-accent-foreground": accentForeground,
      "--app-highlight": isDark ? "#2DD4BF" : "#0F766E",
      "--app-canvas": isDark ? "#0B0F14" : "#F8FAFC",
      "--app-panel": isDark ? "#11161D" : "#FFFFFF",
      "--app-sidebar": isDark ? "#0F141A" : "#F1F5F9",
      "--app-soft-panel": isDark ? "#1A212B" : "#F1F5F9",
      "--app-header-panel": isDark ? "#141B23" : "#FFFFFF",
      "--app-active": isDark ? "rgba(20,184,166,0.16)" : "rgba(20,184,166,0.16)",
      "--app-hover": isDark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.05)",
      "--app-ink": isDark ? "#F1F5F9" : "#0F172A",
      "--app-muted": isDark ? "#94A3B8" : "#64748B",
      "--app-subtle": isDark ? "#64748B" : "#94A3B8",
      "--app-border": isDark ? "#2A3340" : "#E2E8F0",
      "--app-strong-border": isDark ? "#3B4756" : "#CBD5E1",
      "--app-control": isDark ? "#0F141A" : "#FFFFFF",
      "--app-success": isDark ? "#22C55E" : "#16A34A",
      "--app-warning": isDark ? "#FBBF24" : "#D97706",
      "--app-danger": isDark ? "#EF4444" : "#DC2626",
      "--app-success-bg": isDark ? "rgba(34,197,94,0.14)" : "rgba(22,163,74,0.10)",
      "--app-warning-bg": isDark ? "rgba(251,191,36,0.14)" : "rgba(217,119,6,0.10)",
      "--app-danger-bg": isDark ? "rgba(239,68,68,0.14)" : "rgba(220,38,38,0.10)",
      "--app-progress-track": isDark ? "#26313D" : "#E2E8F0",
      "--app-chart-grid": isDark ? "#26313D" : "#E2E8F0",
      "--app-avatar-surface": isDark ? "#1A212B" : "#E2E8F0",
      "--app-thumb-icon": isDark ? "rgba(241,245,249,0.38)" : "rgba(15,23,42,0.36)",
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
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable}`}>
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
          background: "var(--app-canvas, #0B0F14)",
          color: "var(--app-ink, #F1F5F9)",
          fontFamily: "var(--font-geist-sans), Geist, sans-serif"
        }}
      >
        <a className="skip-link" href="#main-content">
          Skip to workspace content
        </a>
        <Providers
          clerkPublishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          convexUrl={process.env.NEXT_PUBLIC_CONVEX_URL}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}

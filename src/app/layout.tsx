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
    root.style.setProperty("--app-accent", accent);
    root.style.setProperty("--app-accent-foreground", accentForeground);
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
          background: "var(--app-canvas)",
          color: "var(--app-ink)",
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

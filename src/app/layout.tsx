import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Space_Grotesk } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["600", "700"] });

const siteTitle = "Relay | Video Production Workspace";
const siteDescription = "Run video production work from one clear workspace, with local and cloud modes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Relay",
  title: siteTitle,
  description: siteDescription,
  keywords: ["video production", "project workspace", "local-first", "editing workflow"],
  authors: [{ name: "Relay" }],
  creator: "Relay",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName: "Relay",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  }
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Relay",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteDescription,
  publisher: {
    "@type": "Organization",
    name: "Relay",
    url: siteUrl,
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
    var isDark = window.localStorage.getItem("relay:theme:v1") === "dark";
    var root = document.documentElement;
    root.style.colorScheme = isDark ? "dark" : "light";
    root.dataset.theme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
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
        <Script id="relay-theme-boot" strategy="beforeInteractive">
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

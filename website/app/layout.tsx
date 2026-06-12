import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

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
  title: "CutLab Studio | Production workspace for video editors",
  description:
    "CutLab Studio is a production workspace for video editors and small creative teams managing projects, revisions, deliverables, clients, and production history.",
  keywords: [
    "video editing project management",
    "production workflow",
    "revision management",
    "deliverable tracking",
    "creative team collaboration",
    "CutLab Studio"
  ],
  openGraph: {
    title: "CutLab Studio",
    description: "Production clarity for video editors, creative teams, and delivery-focused workflows.",
    type: "website",
    images: [
      {
        url: "/screenshots/dashboard.png",
        width: 1600,
        height: 900,
        alt: "CutLab Studio production dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CutLab Studio",
    description: "A focused production workspace for video editing work.",
    images: ["/screenshots/dashboard.png"]
  },
  icons: {
    icon: "/brand/favicon.png",
    apple: "/brand/favicon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#EEF1F2"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { RelayRoute } from "@/relay/features/relay-route";

export const metadata: Metadata = {
  title: "Welcome to Relay",
  description: "Choose Local Mode, cloud access, or a read-only Sample Workspace.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

export default function RelayWelcomePage() {
  const cloudConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL);
  return <RelayRoute cloudConfigured={cloudConfigured} />;
}

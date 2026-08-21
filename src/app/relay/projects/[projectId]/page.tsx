import type { Metadata } from "next";
import { RelayRoute } from "@/relay/features/relay-route";

export const metadata: Metadata = { title: "Project | Relay", robots: { index: false, follow: false } };

export default async function RelayProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const cloudConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL);
  return <RelayRoute section="projects" projectId={projectId} cloudConfigured={cloudConfigured} />;
}

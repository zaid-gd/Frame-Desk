import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RelayRoute } from "@/relay/features/relay-route";
import { relaySections, type RelaySection } from "@/relay/application/routes";

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const title = relaySections.includes(section as RelaySection)
    ? section[0].toUpperCase() + section.slice(1)
    : "Workspace";
  return { title: `${title} | Relay`, robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return relaySections.map((section) => ({ section }));
}

export default async function RelaySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!relaySections.includes(section as RelaySection)) notFound();
  const cloudConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL);
  return <RelayRoute section={section as RelaySection} cloudConfigured={cloudConfigured} />;
}

import type { Metadata } from "next";
import { RelayClientPortal } from "./relay-client-portal";

export const metadata: Metadata = { title: "Client Portal | Relay", robots: { index: false, follow: false } };

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RelayClientPortal token={token} />;
}

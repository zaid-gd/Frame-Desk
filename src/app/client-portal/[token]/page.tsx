import { ClientPortalView } from "../client-portal-view";

export default async function SharedClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ClientPortalView token={token} />;
}

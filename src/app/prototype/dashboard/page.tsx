import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataProvider } from "@/lib/data-context";
import type { PrototypeVariant } from "@/components/prototype/prototype-variant-switcher";
import { TrackerApp } from "@/app/tracker-app";

export const metadata: Metadata = {
  title: "Dashboard Prototype | Frame Desk",
  description: "Development-only Frame Desk dashboard direction study.",
  robots: { index: false, follow: false },
};

export default async function DashboardPrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const candidate = Array.isArray(params.variant) ? params.variant[0] : params.variant;
  const dashboardVariant: PrototypeVariant =
    candidate === "B" || candidate === "C" ? candidate : "A";

  return (
    <DataProvider mode="sample">
      <TrackerApp
        dashboardVariant={dashboardVariant}
        experienceMode="sample"
        page="dashboard"
      />
    </DataProvider>
  );
}

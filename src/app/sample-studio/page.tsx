import type { Metadata } from "next";
import { TrackerApp } from "../tracker-app";
import { DataProvider } from "@/lib/data-context";

export const metadata: Metadata = {
  title: "Sample Studio | Frame Desk",
  description: "Explore a populated, read-only Frame Desk production workspace.",
  robots: { index: false, follow: false },
};

export default function SampleStudioPage() {
  return (
    <DataProvider mode="sample">
      <TrackerApp page="dashboard" experienceMode="sample" />
    </DataProvider>
  );
}

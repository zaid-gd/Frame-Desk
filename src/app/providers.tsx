"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { DataProvider } from "@/lib/data-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ClerkAuthBridge } from "@/lib/optional-auth";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasCloudConfig = Boolean(convexUrl && clerkPublishableKey);
// TrackerApp uses Convex hooks for both local and cloud UI paths. Keep those
// hooks inside a provider during static rendering, while the local data mode
// still avoids all cloud queries when credentials are absent.
const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

function useLocalConvexAuth() {
  return {
    isLoading: false,
    isAuthenticated: false,
    fetchAccessToken: async () => null
  };
}

const clerkAppearance = {
  elements: {
    modalBackdrop: {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      padding: "24px",
    },
    modalContent: {
      margin: "auto",
      maxHeight: "calc(100vh - 48px)",
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const app = (
    <DataProvider mode={hasCloudConfig ? "cloud" : "local"}>
      <TooltipProvider delayDuration={250}>
        {children}
        <Toaster
          className="cutlab-sonner"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--app-panel)",
              border: "1px solid var(--app-border)",
              color: "var(--app-ink)",
            },
          }}
        />
      </TooltipProvider>
    </DataProvider>
  );

  if (!clerkPublishableKey) {
    return (
      <ConvexProviderWithAuth client={convex} useAuth={useLocalConvexAuth}>
        {app}
      </ConvexProviderWithAuth>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={clerkAppearance}>
      <ClerkAuthBridge>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {app}
        </ConvexProviderWithClerk>
      </ClerkAuthBridge>
    </ClerkProvider>
  );
}

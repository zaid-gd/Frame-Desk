"use client";

import { useEffect, useState } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider as PrimerThemeProvider } from "@primer/react";
import { theme } from "./theme";
import { DataProvider, useData } from "@/lib/data-context";
import { StyledComponentsRegistry } from "./styled-components-registry";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

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

/**
 * Bridges the app's Light/Dark/System theme (stored in settings) to Primer's
 * ThemeProvider so the redesigned shell + dashboard resolve the same color
 * mode as the MUI pages. The document's `data-color-mode` attribute is kept in
 * sync separately (boot script + applyRootThemeVariables), so styled-components
 * and the token CSS always agree.
 */
function PrimerThemeBridge({ children }: { children: React.ReactNode }) {
  const { settings } = useData();
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isDark = settings.theme === "Dark" || (settings.theme === "System" && prefersDark);

  return (
    <PrimerThemeProvider
      colorMode={isDark ? "night" : "day"}
      dayScheme="light"
      nightScheme="dark"
      preventSSRMismatch
    >
      {children}
    </PrimerThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const app = (
    <DataProvider mode={convex && clerkPublishableKey ? "cloud" : "local"}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <StyledComponentsRegistry>
            <PrimerThemeBridge>{children}</PrimerThemeBridge>
          </StyledComponentsRegistry>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </DataProvider>
  );

  if (!convex || !clerkPublishableKey) {
    return app;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {app}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { Providers } from "./providers";
import { metadata as signInMetadata } from "./sign-in/[[...sign-in]]/page";
import { metadata as signUpMetadata } from "./sign-up/[[...sign-up]]/page";

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({
    children,
    localization,
    publishableKey,
    signInFallbackRedirectUrl,
    signUpFallbackRedirectUrl,
  }: {
    children: React.ReactNode;
    localization: { signIn: { start: { title: string } } };
    publishableKey: string;
    signInFallbackRedirectUrl: string;
    signUpFallbackRedirectUrl: string;
  }) => (
    <div
      data-provider="clerk"
      data-publishable-key={publishableKey}
      data-sign-in-title={localization.signIn.start.title}
      data-sign-in-fallback={signInFallbackRedirectUrl}
      data-sign-up-fallback={signUpFallbackRedirectUrl}
    >
      {children}
    </div>
  ),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    getToken: async () => null,
  }),
}));

vi.mock("convex/react", () => ({
  ConvexProviderWithAuth: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="convex-local-auth">{children}</div>
  ),
  ConvexReactClient: class ConvexReactClient {
    constructor(public readonly url: string) {}
  },
}));

vi.mock("convex/react-clerk", () => ({
  ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="convex-clerk">{children}</div>
  ),
}));

vi.mock("@/lib/data-context", () => ({
  DataProvider: ({
    authEnabled,
    children,
    mode,
  }: {
    authEnabled: boolean;
    children: React.ReactNode;
    mode: string;
  }) => (
    <div data-provider="frame-desk-data" data-auth-enabled={String(authEnabled)} data-data-mode={mode}>{children}</div>
  ),
}));

vi.mock("@/lib/optional-auth", () => ({
  ClerkAuthBridge: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
}));

describe("Providers runtime configuration", () => {
  test("uses Clerk and Convex settings passed by the server at request time", () => {
    const html = renderToStaticMarkup(
      <Providers
        convexUrl="https://runtime-config.convex.cloud"
        clerkPublishableKey="pk_test_runtime_config"
      >
        <main>Frame Desk</main>
      </Providers>,
    );

    expect(html).toContain('data-provider="clerk"');
    expect(html).toContain('data-sign-in-title="Sign in to Relay"');
    expect(html).toContain('data-sign-in-fallback="/relay/dashboard"');
    expect(html).toContain('data-sign-up-fallback="/relay/dashboard"');
    expect(html).toContain('data-provider="convex-clerk"');
    expect(html).not.toContain('data-provider="frame-desk-data"');
  });

  test("keeps account mode disabled when Convex runtime configuration is missing", () => {
    const html = renderToStaticMarkup(
      <Providers clerkPublishableKey="pk_test_runtime_config">
        <main>Frame Desk</main>
      </Providers>,
    );

    expect(html).not.toContain('data-provider="clerk"');
    expect(html).toContain('data-provider="convex-local-auth"');
    expect(html).not.toContain('data-provider="frame-desk-data"');
  });
});

describe("Clerk route branding", () => {
  test("labels the sign-in and sign-up browser tabs as Relay", () => {
    expect(signInMetadata.title).toBe("Sign in | Relay");
    expect(signUpMetadata.title).toBe("Create account | Relay");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import AccessPage, { metadata as accessMetadata } from "./access/page";
import GlobalError from "./error";
import manifest from "./manifest";
import NotFound from "./not-found";
import sitemap from "./sitemap";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("Relay global surfaces", () => {
  test("uses Relay in the global missing-page and error states", () => {
    const missing = renderToStaticMarkup(<NotFound />);
    const failed = renderToStaticMarkup(<GlobalError error={new Error("test")} reset={() => undefined} />);

    expect(missing).toContain("Relay");
    expect(missing).not.toContain("Frame Desk");
    expect(failed).toContain("Relay");
    expect(failed).not.toContain("Frame Desk");
  });

  test("publishes Relay install metadata without Frame Desk assets", () => {
    const value = manifest();

    expect(value.name).toBe("Relay");
    expect(value.short_name).toBe("Relay");
    expect(JSON.stringify(value)).not.toContain("Frame Desk");
    expect(JSON.stringify(value)).not.toContain("/brand/");
  });

  test("uses Relay at the preview gate", async () => {
    const html = renderToStaticMarkup(await AccessPage({ searchParams: Promise.resolve({}) }));

    expect(accessMetadata.title).toBe("Private access | Relay");
    expect(html).toContain("Relay");
    expect(html).not.toContain("Frame Desk");
  });

  test("publishes only the active Relay root in the sitemap", () => {
    expect(sitemap().map((entry) => new URL(entry.url).pathname)).toEqual(["/"]);
  });
});

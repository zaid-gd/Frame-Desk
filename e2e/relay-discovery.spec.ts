import { expect, test } from "@playwright/test";
import { loadE2EEnvironment } from "./env";
import { openApp } from "./helpers";

loadE2EEnvironment();

test.beforeEach(async ({ page }) => {
  await openApp(page, "/relay");
  await page.evaluate(() => {
    window.localStorage.setItem("relay:entry-mode:v1", "sample");
    window.localStorage.removeItem("relay:local-workspace:v2");
  });
  await page.goto("/relay/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Sample Workspace · Read-only demo fixtures")).toBeVisible();
});

test("finds dates, material, records, and actions without exposing writes", async ({ page }) => {
  await page.getByRole("link", { name: "Calendar" }).click();
  await expect(page.getByRole("heading", { name: "Calendar", exact: true }).last()).toBeVisible();
  await expect(page.getByText("Main video review")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download calendar" })).toHaveAttribute("download", "relay-calendar.ics");
  await expect(page.locator("main").getByRole("button", { name: /edit|move|delete/i })).toHaveCount(0);

  await page.getByRole("link", { name: "Files" }).click();
  await page.getByRole("searchbox", { name: "Search Workspace Files" }).fill("v2");
  await expect(page.getByText("Main video v2")).toBeVisible();
  await expect(page.getByText("Main video v1")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Manage in Demo Project Alpha" })).toHaveAttribute("href", "/relay/projects/demo_alpha#outputs");
  await expect(page.locator("main").getByRole("button", { name: /upload|archive|delete|visibility|version/i })).toHaveCount(0);

  await page.keyboard.press("Control+k");
  const search = page.getByRole("searchbox", { name: "Search Workspace", exact: true });
  await expect(search).toBeFocused();
  await search.fill("demo project");
  const searchResults = page.getByLabel("Workspace search results");
  await expect(searchResults.getByRole("link", { name: /^Demo Project Alpha Demo Client/ })).toHaveAttribute("href", "/relay/projects/demo_alpha");
  await search.fill("new project");
  await expect(searchResults.getByRole("link", { name: /New Project/ })).toHaveAttribute("href", "/relay/projects?new=true");
});

test("keeps discovery usable with reduced motion and 200% zoom", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "200%"; });
  await page.getByRole("link", { name: "Files" }).click();
  await expect(page.getByRole("searchbox", { name: "Search Workspace Files" })).toBeVisible();
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox", { name: "Search Workspace", exact: true })).toBeFocused();
  await expect(page.getByRole("banner")).toHaveCSS("position", "fixed");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

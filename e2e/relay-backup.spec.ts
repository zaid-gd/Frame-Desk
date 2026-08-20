import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/relay");
  if (page.url().includes("/access")) {
    await page.getByLabel("Access password").fill(process.env.ACCESS_WALL_PASSWORD!);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/relay$/);
  }
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("relay:analytics:local:v1", "disabled"); });
  await page.reload();
});

test("backs up and restores persisted Local Mode work", async ({ page }) => {
  await page.getByRole("button", { name: "Use Local Mode" }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Local draft saved" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("cell", { name: /Untitled local project/ })).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Back up and restore this Workspace" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^relay-local-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await page.evaluate(() => localStorage.removeItem("relay:local-workspace:v2"));
  await page.reload();
  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page.getByText("Untitled local project", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Settings" }).click();
  const fileInput = page.getByLabel("Choose a Relay JSON backup");
  await expect(fileInput).toHaveAttribute("accept", /json/);
  await fileInput.focus();
  await expect(fileInput).toBeFocused();
  await fileInput.setInputFiles(backupPath!);
  const backupAnnouncements = page.locator('[aria-live="polite"][aria-atomic="true"]');
  await expect(backupAnnouncements).toContainText("1 Client · 1 project · 2 total records");

  const restoreButton = page.getByRole("button", { name: "Restore Local Mode backup" });
  await restoreButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Restored 2 records in Local Mode" })).toBeVisible();

  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("cell", { name: /Untitled local project/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("cell", { name: /Untitled local project/ })).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByLabel("Choose a Relay JSON backup").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(page.getByRole("alert").filter({ hasText: "Choose a valid Relay JSON backup." })).toBeVisible();
});

test("keeps backup and import controls inside Relay", async ({ page }) => {
  const existingRoutes = [
    "/", "/accessibility", "/account", "/calendar", "/client-portal", "/clients", "/contact", "/feedback",
    "/integrations", "/media", "/organization", "/privacy", "/privacy-policy", "/profile", "/projects",
    "/reports", "/resources", "/sample-studio", "/settings", "/team", "/team-chat", "/templates", "/terms", "/timeline",
  ];
  for (const route of existingRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Back up and restore this Workspace" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Import a Local Mode backup" })).toHaveCount(0);
  }
});

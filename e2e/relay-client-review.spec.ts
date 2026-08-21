import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { cloudE2EAvailable, loadE2EEnvironment } from "./env";
import { openApp, waitForClerk } from "./helpers";

loadE2EEnvironment();

test("reviews a PIN-protected Media Version in separate editor and Client contexts", async ({ browser, page }) => {
  test.skip(!cloudE2EAvailable(), "Clerk and Convex E2E credentials are not configured.");
  test.setTimeout(180_000);
  const suffix = Date.now();
  const clientName = `Review Client ${suffix}`;
  const projectName = `Review Project ${suffix}`;
  const comment = `Tighten the opening ${suffix}`;
  let clientContext: Awaited<ReturnType<typeof browser.newContext>> | undefined;

  try {
    await openApp(page, "/relay");
    await waitForClerk(page);
    await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL! });
    await page.goto("/relay/clients");
    const clientNameInput = page.getByLabel("Name", { exact: true });
    if (!await clientNameInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
      test.skip(true, "The configured Clerk session is not accepted by the Convex test deployment.");
    }
    await clientNameInput.fill(clientName);
    await page.getByRole("button", { name: "Create Client" }).click();
    const authFailure = page.getByRole("status").filter({ hasText: "Sign in to manage Clients" });
    if (await authFailure.isVisible({ timeout: 5_000 }).catch(() => false)) test.skip(true, "The configured Clerk session is not accepted by the Convex test deployment.");
    await page.getByRole("link", { name: "Projects", exact: true }).click();
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByLabel("Project name").fill(projectName);
    const clientSelect = page.getByRole("combobox", { name: "Client" }).first();
    const clientOptions = await clientSelect.locator("option").allTextContents();
    if (!clientOptions.includes(clientName)) test.skip(true, "The configured Clerk session is not accepted by the Convex test deployment.");
    await clientSelect.selectOption({ label: clientName });
    await page.getByRole("combobox", { name: "Workflow Template" }).selectOption({ index: 1 });
    await page.getByLabel("Due date").fill("2026-09-12");
    await page.getByRole("combobox", { name: "Financial type" }).selectOption("projectValue");
    await page.getByRole("button", { name: "Create Project", exact: true }).click();

    await page.getByLabel(/New Media Version URL for/).first().fill("https://example.com/review-v1");
    await page.getByRole("button", { name: /Add Media Version for/ }).first().click();
    const outputName = await page.locator("article").first().getByRole("heading", { level: 3 }).textContent();
    await page.getByRole("checkbox", { name: outputName ?? "" }).check();
    await page.getByLabel("Optional PIN").fill("2468");
    await page.getByRole("button", { name: "Publish portal" }).click();
    const portalLink = page.getByRole("link", { name: "Open public portal" });
    const href = await portalLink.getAttribute("href");
    expect(href).toBeTruthy();

    clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    await clientPage.setViewportSize({ width: 390, height: 844 });
    await clientPage.goto(new URL(href!, page.url()).toString());
    await clientPage.getByLabel("PIN").fill("0000");
    await clientPage.getByRole("button", { name: "Open portal" }).click();
    await expect.poll(() => clientPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(clientPage.getByRole("heading", { name: "That PIN did not match" })).toBeVisible();
    await clientPage.getByLabel("PIN").fill("2468");
    await clientPage.getByRole("button", { name: "Open portal" }).click();
    await clientPage.getByLabel("Display name").fill("E2E Client");
    await clientPage.getByLabel("Comment").fill(comment);
    await clientPage.getByRole("button", { name: "Add Comment" }).click();
    await expect(clientPage.getByText(comment, { exact: true })).toBeVisible();
    await clientPage.reload();
    await expect(clientPage.getByLabel("Display name")).toHaveValue("E2E Client");

    await expect(page.getByText(comment, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Resolve Comment from E2E Client" }).click();
    await expect(clientPage.getByText("Resolved", { exact: true })).toBeVisible();
    await clientPage.getByRole("button", { name: "Reopen Comment from E2E Client" }).click();
    await expect(clientPage.getByText("Open", { exact: true })).toBeVisible();

    await page.getByLabel(/New Media Version URL for/).first().fill("https://example.com/review-v2");
    await page.getByRole("button", { name: /Add Media Version for/ }).first().click();
    await expect(page.getByRole("alert")).toContainText("unresolved Comment from an older version");
    await expect(page.getByText(comment, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Close portal" }).click();
    await clientPage.reload();
    await expect(clientPage.getByRole("heading", { name: "This portal is closed" })).toBeVisible();
    await expect(clientPage.getByRole("button", { name: "Add Comment" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open portal" }).click();
    await page.getByLabel("Expires at").fill("2000-01-01T00:00");
    await page.getByRole("button", { name: "Save and open" }).click();
    await clientPage.reload();
    await expect(clientPage.getByRole("heading", { name: "This portal has expired" })).toBeVisible();
    await expect(clientPage.getByRole("button", { name: "Add Comment" })).toHaveCount(0);
    await expect(page.getByText(comment, { exact: true })).toBeVisible();
  } finally {
    await clientContext?.close().catch(() => undefined);
  }
});

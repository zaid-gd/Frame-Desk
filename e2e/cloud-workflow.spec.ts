import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { cloudE2EAvailable, loadE2EEnvironment } from "./env";
import { createProject, openApp, openProject, projectRow, selectOption, waitForClerk } from "./helpers";

loadE2EEnvironment();
const cloudReady = cloudE2EAvailable();

async function deleteCloudE2EProjects(page: Parameters<typeof projectRow>[0]) {
  while (true) {
    const row = page.locator('[data-testid="project-row"][data-project-title^="Cloud E2E Project "]').first();
    if (!(await row.isVisible().catch(() => false))) return;
    const title = await row.getAttribute("data-project-title");
    if (!title) return;
    await row.getByRole("button", { name: `Delete ${title}` }).click();
    await page.getByRole("dialog", { name: "Delete project?" }).getByRole("button", { name: "Delete" }).click();
    await expect(projectRow(page, title)).toBeHidden();
  }
}

test.describe("authenticated editor to client workflow", () => {
  test.skip(!cloudReady, "Clerk and Convex E2E credentials are not configured.");
  test.describe.configure({ mode: "serial" });

  test("creates, reviews, publishes, revises, and closes a client handoff", async ({ browser, page }) => {
    test.setTimeout(180_000);
    const suffix = Date.now();
    const projectTitle = `Cloud E2E Project ${suffix}`;
    const fileTitle = `Client Cut ${suffix}`;
    const revisionMessage = `Tighten the opening shot ${suffix}`;
    let publicContext: Awaited<ReturnType<typeof browser.newContext>> | undefined;

    try {
      await openApp(page, "/");
      await waitForClerk(page);
      await clerk.signIn({
        page,
        emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
      });
      await openApp(page, "/projects");
      await expect(page.getByRole("button", { name: /New (?:Personal |Team )?Project/ })).toBeVisible();
      await deleteCloudE2EProjects(page);

      await createProject(page, projectTitle);
      const detail = await openProject(page, projectTitle);
      await detail.getByText("Project Files", { exact: true }).scrollIntoViewIfNeeded();
      await detail.getByRole("button", { name: "Add Link" }).click();

      let fileDialog = page.getByRole("dialog", { name: "Add Project File" });
      await fileDialog.getByLabel("File title").fill(fileTitle);
      await fileDialog.getByLabel("Description").fill("Primary client review deliverable.");
      await selectOption(fileDialog.getByLabel("Approval state"), page, "Sent to Client");
      await fileDialog.getByLabel("File URL").fill("https://example.com/client-cut-v1");
      await fileDialog.getByRole("switch", { name: "Show in Client Portal" }).check();
      await fileDialog.getByRole("button", { name: "Save File" }).click();

      const fileCard = detail.locator('[data-testid="project-file-card"]').filter({ hasText: fileTitle });
      await expect(fileCard).toContainText("v1");
      await expect(fileCard).toContainText("Client visible");
      await fileCard.getByText(fileTitle, { exact: true }).click();
      await fileCard.getByRole("button", { name: "Link Version" }).click();

      fileDialog = page.getByRole("dialog", { name: "Add File Version" });
      await fileDialog.getByLabel("File URL").fill("https://example.com/client-cut-v2");
      await fileDialog.getByLabel("Version notes").fill("Second review version.");
      await fileDialog.getByRole("button", { name: "Add Version" }).click();
      await expect(fileCard).toContainText("v2");
      await expect(fileCard).toContainText("Version 2");

      await selectOption(fileCard.getByRole("combobox"), page, "Approved");
      await expect(fileCard).toContainText("Approved");

      await detail.getByText("Client Portal", { exact: true }).scrollIntoViewIfNeeded();
      await detail.getByRole("button", { name: "Create Portal" }).click();
      const portalManager = page.getByTestId("client-portal-manager");
      await portalManager.getByLabel("Project summary").fill("A client-safe E2E project summary.");
      await portalManager.getByLabel("Client-facing notes").fill("Please review the latest approved cut.");
      await portalManager.getByRole("button", { name: "Publish Portal" }).click();

      const openPortal = portalManager.getByRole("link", { name: "Open" });
      await expect(openPortal).toBeVisible();
      const portalHref = await openPortal.getAttribute("href");
      expect(portalHref).toBeTruthy();

      publicContext = await browser.newContext();
      const clientPage = await publicContext.newPage();
      await clientPage.goto(portalHref!);
      await expect(clientPage.getByTestId("client-portal")).toContainText(projectTitle);
      await expect(clientPage.getByText(fileTitle, { exact: true })).toBeVisible();
      await expect(clientPage.getByText("Approved", { exact: true })).toBeVisible();

      await clientPage.getByLabel("Your name").fill("E2E Client");
      await clientPage.getByLabel("Timecode (optional)").fill("01:23");
      await clientPage.getByLabel("Revision request").fill(revisionMessage);
      await clientPage.getByRole("button", { name: "Submit Request" }).click();
      await expect(clientPage.getByText("Revision request submitted.")).toBeVisible();
      await expect(clientPage.getByText("01:23", { exact: true })).toBeVisible();

      await expect(portalManager.getByText(revisionMessage, { exact: true })).toBeVisible();
      const revisionBlock = portalManager.locator("div").filter({ hasText: revisionMessage }).last();
      await selectOption(revisionBlock.getByRole("combobox"), page, "Resolved");
      await expect(revisionBlock).toContainText("Resolved");

      await portalManager.getByLabel("Portal access").uncheck();
      await portalManager.getByRole("button", { name: "Save Access" }).click();
      await clientPage.reload();
      await expect(clientPage.getByText("Portal link unavailable")).toBeVisible();

      await portalManager.getByLabel("Portal access").check();
      await portalManager.getByLabel("Expires").fill("2000-01-01T00:00");
      await portalManager.getByRole("button", { name: "Save Access" }).click();
      await clientPage.reload();
      await expect(clientPage.getByText("Portal link expired")).toBeVisible();
    } finally {
      await publicContext?.close().catch(() => undefined);
      if (!page.isClosed()) {
        await page.goto("/projects").catch(() => undefined);
        const row = projectRow(page, projectTitle);
        if (await row.isVisible().catch(() => false)) {
          await row.getByRole("button", { name: `Delete ${projectTitle}` }).click();
          await page.getByRole("dialog", { name: "Delete project?" }).getByRole("button", { name: "Delete" }).click();
        }
      }
    }
  });
});

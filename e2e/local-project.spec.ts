import { expect, test } from "@playwright/test";
import { chooseLocalMode, createProject, openApp, openProject, projectRow } from "./helpers";

test("creates and persists a project in local mode", async ({ page }) => {
  const title = `Local E2E Project ${Date.now()}`;
  await chooseLocalMode(page);
  await openApp(page, "/projects");

  await createProject(page, title);
  await page.reload();
  await expect(projectRow(page, title)).toBeVisible();

  const detail = await openProject(page, title);
  await expect(detail.getByText("Created by the Playwright core workflow.")).toBeVisible();
  await expect(detail.getByText("E2E Client", { exact: true }).first()).toBeVisible();
});

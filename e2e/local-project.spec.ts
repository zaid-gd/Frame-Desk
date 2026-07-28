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

test("dismisses the project launcher with Escape and restores focus", async ({ page }) => {
  await chooseLocalMode(page);
  await openApp(page, "/projects");

  const trigger = page.getByRole("button", { name: /New (?:Personal |Team )?Project/ }).first();
  await trigger.focus();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Create Project" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("opens the Privacy Policy and Terms of Service from the profile menu", async ({ page }) => {
  await chooseLocalMode(page);
  await openApp(page, "/projects");

  await page.getByRole("button", { name: "Open profile menu" }).click();
  const privacyLink = page.getByRole("menuitem", { name: "Privacy Policy" });
  const termsLink = page.getByRole("menuitem", { name: "Terms of Service" });
  await expect(privacyLink).toHaveAttribute("href", "/privacy");
  await expect(termsLink).toHaveAttribute("href", "/terms");

  await privacyLink.click();
  await expect(page.getByRole("heading", { name: "Privacy Policy", level: 1 })).toBeVisible();

  await page.goto("/projects");
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "Terms of Service" }).click();
  await expect(page.getByRole("heading", { name: "Terms of Service", level: 1 })).toBeVisible();
});

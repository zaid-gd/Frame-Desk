import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test("shared browser setup enters the protected Relay app", async ({ page }) => {
  await openApp(page, "/relay");

  await expect(page).toHaveURL(/\/relay$/);
  await expect(page.getByRole("heading", { name: "Run every edit from one clear workspace" })).toBeVisible();
});

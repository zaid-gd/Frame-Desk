import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { cloudE2EAvailable, loadE2EEnvironment } from "./env";
import { waitForClerk } from "./helpers";

loadE2EEnvironment();

test.beforeEach(async ({ page }) => {
  await page.goto("/relay");
  if (page.url().includes("/access")) {
    await page.getByLabel("Access password").fill(process.env.ACCESS_WALL_PASSWORD!);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/relay$/);
  }
  await page.evaluate(() => {
    window.localStorage.removeItem("relay:entry-mode:v1");
    window.localStorage.removeItem("relay:local-projects:v1");
    window.localStorage.removeItem("relay:theme:v1");
    window.localStorage.removeItem("relay:sidebar-collapsed:v1");
  });
  await page.reload();
});

test("offers Local Mode, account creation, and Sample Workspace before Sign In", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Run every edit from one clear workspace" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use Local Mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create an account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Sample Workspace" })).toBeVisible();
  const sampleBox = await page.getByRole("button", { name: "Open Sample Workspace" }).boundingBox();
  const signInBox = await page.getByRole("button", { name: "Sign in" }).boundingBox();
  expect(signInBox?.y ?? 0).toBeGreaterThan(sampleBox?.y ?? 0);
});

test("keeps Local Mode across reloads and warns about browser storage", async ({ page }) => {
  await page.getByRole("button", { name: "Use Local Mode" }).click();
  await expect(page).toHaveURL(/\/relay\/dashboard$/);
  await expect(page.getByRole("status")).toContainText("Local Mode saves work only in this browser");
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.getByText("Untitled local project", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await page.reload();
  await expect(page).toHaveURL(/\/relay\/dashboard$/);
  await expect(page.getByRole("status")).toContainText("Clearing site data can remove it");
  await expect(page.getByText("Untitled local project", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Use light theme" })).toBeVisible();
});

test("manages a durable Client through create, edit, search, archive, restore, reload, and inspection", async ({ page }) => {
  await page.getByRole("button", { name: "Use Local Mode" }).click();
  await page.getByRole("link", { name: "Clients" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Acme");
  await page.getByLabel("Company", { exact: true }).fill("Acme Films");
  await page.getByLabel("Contact name").fill("Ava Reed");
  await page.getByLabel("Email").fill("ava@acme.test");
  await page.getByLabel("Phone").fill("555-0100");
  await page.getByLabel("Notes").fill("Retainer");
  await page.getByRole("button", { name: "Create Client" }).click();
  await expect(page.getByText("Client created.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Acme\s+Acme Films/ }).click();
  await expect(page.getByRole("heading", { name: "Active Projects" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Past Projects" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project Groups" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Client Portal links" })).toBeVisible();
  await page.getByRole("button", { name: "Edit Client" }).click();
  await page.getByLabel("Company", { exact: true }).fill("Acme Studio");
  await page.getByRole("button", { name: "Save Client" }).click();
  await page.getByLabel("Search Clients").fill("Studio");
  await expect(page.getByRole("button", { name: /Acme\s+Acme Studio/ })).toBeVisible();
  await page.getByRole("button", { name: "Archive Client" }).click();
  await expect(page.getByText("No Clients match this view.")).toBeVisible();
  await page.getByLabel("Include archived Clients").check();
  await page.getByRole("button", { name: /Acme\s+Acme Studio\s+Archived/ }).click();
  await page.getByRole("button", { name: "Restore Client" }).click();
  await page.reload();
  await page.getByLabel("Search Clients").fill("Acme Studio");
  await expect(page.getByRole("button", { name: /Acme\s+Acme Studio/ })).toBeVisible();
  await page.getByRole("button", { name: "Open account menu for Local editor" }).click();
  await page.getByRole("menuitem", { name: "Leave workspace" }).click();
  await page.getByRole("button", { name: "Open Sample Workspace" }).click();
  await page.getByRole("link", { name: "Clients" }).click();
  await page.getByRole("button", { name: /Demo Client\s+Demo Studio/ }).click();
  await expect(page.getByText("Demo Project Alpha · In review")).toBeVisible();
  await expect(page.getByText("Demo Project Beta · Delivered")).toBeVisible();
  await expect(page.getByText("Launch campaign · 2 projects")).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo Project Alpha" })).toHaveAttribute("href", "/portal/demo-alpha");
  await expect(page.getByText("Not authorized")).toBeVisible();
});

test("explains unavailable account entry flows", async ({ page }) => {
  test.skip(cloudE2EAvailable(), "This check covers builds without cloud account configuration.");
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("status")).toContainText("Account access is not configured");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toContainText("Use Local Mode or the Sample Workspace");
});

test("opens realistic Sample Workspace fixtures and refuses writes", async ({ page }) => {
  await page.getByRole("button", { name: "Open Sample Workspace" }).click();
  await expect(page.getByText("Demo Project Alpha", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.getByRole("status")).toContainText("Sample Workspace is read-only");
});

test("supports keyboard entry and shell navigation", async ({ page }) => {
  const localMode = page.getByRole("button", { name: "Use Local Mode" });
  await localMode.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/relay\/dashboard$/);

  const collapse = page.getByRole("button", { name: "Collapse sidebar" });
  await collapse.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeFocused();

  const projects = page.getByRole("link", { name: "Projects" });
  await projects.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/relay\/projects$/);
});

test("matches the Sidebar Canvas shell, cards, tokens, and tablet rail", async ({ page }) => {
  await page.getByRole("button", { name: "Use Local Mode" }).click();
  const sidebar = page.getByRole("complementary", { name: "Relay sidebar" });
  const topbar = page.getByRole("banner");
  expect((await sidebar.boundingBox())?.width).toBeGreaterThanOrEqual(260);

  const light = await page.evaluate(() => {
    const aside = document.querySelector("aside")!;
    const header = document.querySelector("header")!;
    const main = document.querySelector("main")!;
    const card = document.querySelector("main section")!;
    const action = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("New project"))!;
    return {
      sidebar: getComputedStyle(aside).backgroundColor,
      topbar: getComputedStyle(header).backgroundColor,
      canvas: getComputedStyle(main).backgroundColor,
      cardBorder: getComputedStyle(card).borderTopWidth,
      action: getComputedStyle(action).backgroundColor,
    };
  });
  expect(light).toEqual({
    sidebar: "rgb(21, 19, 15)",
    topbar: "rgb(21, 19, 15)",
    canvas: "rgb(246, 244, 239)",
    cardBorder: "1px",
    action: "rgb(79, 70, 229)",
  });

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect.poll(() => page.locator("main section").first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(33, 31, 27)");

  await page.setViewportSize({ width: 900, height: 1000 });
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(76);
  await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
});

test("provides working account controls in Local Mode", async ({ page }) => {
  await page.getByRole("button", { name: "Use Local Mode" }).click();
  const accountTrigger = page.getByRole("button", { name: "Open account menu for Local editor" });
  await accountTrigger.click();
  const accountControls = page.getByRole("menu");
  await expect(accountControls.getByText("Local Mode", { exact: true }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(accountTrigger).toBeFocused();
  await accountTrigger.click();
  await accountControls.getByRole("menuitem", { name: "Leave workspace" }).click();
  await expect(page).toHaveURL(/\/relay$/);
  await expect(page.getByRole("button", { name: "Use Local Mode" })).toBeVisible();
});

test("serves Relay as the root product", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Welcome to Relay/);
  await expect(page.getByRole("heading", { name: "Run every edit from one clear workspace" })).toBeVisible();
});

test("retires old Frame Desk product routes before they mount", async ({ page }) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Run every edit from one clear workspace" })).toBeVisible();
});

test("shows identity from a signed-in browser session", async ({ page }) => {
  test.skip(!cloudE2EAvailable(), "Clerk and Convex E2E credentials are not configured.");
  await waitForClerk(page);
  await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL! });
  await page.goto("/relay/dashboard");
  await expect(page.getByRole("button", { name: /Open account menu for CutLab E2E/ })).toBeVisible();
  await expect(page.getByText(process.env.E2E_CLERK_USER_EMAIL!, { exact: true })).toBeVisible();
});

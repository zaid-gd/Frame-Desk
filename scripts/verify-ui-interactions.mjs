import { chromium } from "@playwright/test";

const baseUrl = process.env.CUTLAB_UI_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true });

async function withPage(viewport, run) {
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
  await context.addInitScript(() => {
    localStorage.setItem("cutlab-studio:auth-mode:v1", "local");
    localStorage.setItem("video-editing-work-tracker:settings:v1", JSON.stringify({
      studioName: "CutLab Studio",
      profileName: "Jordan Lee",
      profileTitle: "Editor",
      profileImageUrl: "",
      theme: "Light",
      accentColor: "#3478F6",
      density: "Comfortable",
      timeZone: "Asia/Dubai",
      weekStart: "Mon",
      currencyCode: "USD",
      salaryBatchSize: 20,
      salaryBatchAmount: 10000,
      salaryWorkType: "Job / Salary",
      customClients: ["Apex"],
      projectTags: ["Job / Salary", "Freelance"],
      projectStages: ["Planned", "In Progress", "Review", "Delivered"],
      notifications: {},
      integrations: {},
      integrationAccounts: {},
      integrationConfigs: {},
      integrationLinks: {},
      teamRole: "",
      teamMembers: [],
      editorPermissions: {},
      rolePermissions: {},
    }));
    localStorage.setItem("video-editing-work-tracker:v1", JSON.stringify([
      {
        id: "interaction-project",
        profileId: "video-editor",
        title: "Interaction test edit",
        client: "Apex",
        status: "In Progress",
        workType: "Job / Salary",
        startDate: "2026-06-10",
        dueDate: "2026-06-18",
        earnings: 0,
        notes: "Review the motion pass.",
        createdAt: "2026-06-10T09:00:00.000Z",
      },
    ]));
  });

  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(20_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("webpack-hmr")) errors.push(message.text());
  });

  try {
    await run(page);
    if (errors.length) throw new Error(errors.join("\n"));
  } finally {
    await context.close();
  }
}

try {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    console.log("Verifying dashboard and command palette...");
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Today" }).waitFor();
    await page.getByRole("button", { name: /filters/i }).click();
    await page.getByPlaceholder("Search projects...").fill("Interaction");
    await page.getByTestId("project-row").first().click();

    await page.keyboard.press("Control+K");
    await page.getByPlaceholder("Search pages and actions...").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    console.log("Verifying calendar view switching...");
    await page.goto(`${baseUrl}/calendar`, { waitUntil: "domcontentloaded" });
    await page.locator(".fc").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Week" }).click();
    await page.locator(".fc-timeGridWeek-view").waitFor({ state: "visible" });

    console.log("Verifying media view and selection...");
    await page.goto(`${baseUrl}/media`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Grid view" }).click();
    await page.getByText("Interaction test edit").first().click();
  });

  await withPage({ width: 390, height: 844 }, async (page) => {
    console.log("Verifying mobile navigation and project inspector...");
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Today" }).waitFor();
    await page.getByTestId("mobile-project-row").first().click();
    await page.getByRole("dialog", { name: "Project details" }).waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /more workspace pages/i }).click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Projects" }).click();
    await page.waitForURL("**/projects");
  });

  await withPage({ width: 1280, height: 900 }, async (page) => {
    console.log("Verifying theme and reduced-motion preference...");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/settings`, { waitUntil: "domcontentloaded" });
    const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!reduced) throw new Error("Reduced-motion media preference was not applied.");
    await page.getByRole("button", { name: "Dark" }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  });

  console.log("UI interactions verified across desktop, mobile, calendar, media, settings, and reduced-motion states.");
} finally {
  await browser.close();
}

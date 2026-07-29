import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const startupTimeoutMs = 30_000;
const configuredBaseUrl = process.env.CUTLAB_UI_URL;
const workspaceRoutes = [
  ["/", "Good to see you, Jordan.", "data-index"],
  ["/projects", "Projects", "data-index"],
  ["/calendar", "Calendar", "canvas"],
  ["/timeline", "Delivery timeline", "data-index"],
  ["/clients", "Clients", "master-detail"],
  ["/feedback", "Feedback", "master-detail"],
  ["/media", "Media", "master-detail"],
  ["/resources", "Resources", "library"],
  ["/templates", "Templates", "library"],
  ["/integrations", "Integrations", "library"],
  ["/reports", "Reports", "data-index"],
  ["/team", "Team", "administration"],
  ["/team-chat", "Team Chat", "conversation"],
  ["/settings", "Settings", "administration"],
  ["/account", "Account Settings", "administration"],
  ["/organization", "Organization Profile", "administration"],
  ["/profile/edit", "Edit Profile", "administration"],
];
let server;
let baseUrl = configuredBaseUrl;

if (!baseUrl) {
  const port = await getOpenPort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  await waitForServer(baseUrl, () => output);
}

const browser = await chromium.launch({ headless: true });

async function withPage(viewport, run, { seedWorkspace = true } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
  await context.route("**/_vercel/**", async (route) => {
    const isScript = route.request().resourceType() === "script";
    await route.fulfill({
      status: 200,
      contentType: isScript ? "application/javascript" : "text/plain",
      body: isScript ? "" : "ok",
    });
  });
  if (seedWorkspace) await context.addInitScript(() => {
    localStorage.setItem("cutlab-studio:auth-mode:v1", "local");
    localStorage.setItem("video-editing-work-tracker:settings:v1", JSON.stringify({
      studioName: "Frame Desk",
      profileName: "Jordan Lee",
      profileTitle: "Editor",
      profileImageUrl: "",
      theme: "Dark",
      accentColor: "#14B8A6",
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
  else await context.addInitScript(() => {
    localStorage.setItem("cutlab-studio:privacy-consent:v1", "essential");
  });

  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(20_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    const ignoredLocalAssetError = text.includes("/_vercel/insights/script.js") || text.includes("/_vercel/speed-insights/script.js");
    if (message.type() === "error" && !text.includes("webpack-hmr") && !ignoredLocalAssetError) errors.push(text);
  });

  try {
    await run(page);
    if (errors.length) throw new Error(errors.join("\n"));
  } finally {
    await context.close();
  }
}

async function chooseEssentialPrivacy(page) {
  const privacyRegion = page.getByRole("region", { name: "Privacy preferences" });
  await privacyRegion.waitFor({ state: "visible" });
  await privacyRegion.getByRole("button", { name: "Essential only" }).click();
  await privacyRegion.waitFor({ state: "hidden" });
}

async function assertWorkspaceGeometry(page, route, expectedFamily) {
  const geometry = await page.evaluate(() => {
    const main = document.getElementById("main-content");
    const pageRoot = document.querySelector('[data-slot="workspace-page"]');
    const header = document.querySelector('[data-slot="page-header"]');
    const pageContent = document.querySelector('[data-slot="page-content"]');
    const fillBody = document.querySelector(
      '[data-slot="fill-viewport-body"][aria-label], [data-slot="data-table-frame-body"][aria-label]',
    );
    const rect = (element) => element ? {
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
      width: Math.round(element.getBoundingClientRect().width),
    } : null;
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      main: rect(main),
      pageRoot: rect(pageRoot),
      header: rect(header),
      family: pageRoot?.getAttribute("data-family") ?? "",
      mode: pageRoot?.getAttribute("data-mode") ?? "",
      hasPageContent: Boolean(pageContent),
      hasFillBody: Boolean(fillBody),
      rootOverflowY: pageRoot ? getComputedStyle(pageRoot).overflowY : "",
      mainOverflowY: main ? getComputedStyle(main).overflowY : "",
    };
  });

  if (!geometry.main || !geometry.pageRoot || !geometry.header || !geometry.hasPageContent) {
    throw new Error(`${route} is missing shared workspace geometry.`);
  }
  if (geometry.family !== expectedFamily) {
    throw new Error(`${route} declares ${geometry.family || "no family"} instead of ${expectedFamily}.`);
  }
  if (geometry.documentWidth > geometry.viewportWidth + 1) {
    throw new Error(`${route} has document-level horizontal overflow.`);
  }
  const expectedWidth = Math.min(geometry.main.width, 1920);
  const expectedLeft = geometry.main.left + ((geometry.main.width - expectedWidth) / 2);
  if (Math.abs(geometry.pageRoot.width - expectedWidth) > 1 || Math.abs(geometry.pageRoot.left - expectedLeft) > 1) {
    throw new Error(`${route} does not follow the shared 1920px workspace width contract.`);
  }
  const leftGutter = geometry.header.left - geometry.pageRoot.left;
  const rightGutter = geometry.pageRoot.right - geometry.header.right;
  if (leftGutter < 12 || leftGutter > 32 || rightGutter < 12 || rightGutter > 32) {
    throw new Error(`${route} has inconsistent workspace gutters: ${leftGutter}px / ${rightGutter}px.`);
  }
  if (!["auto", "scroll"].includes(geometry.mainOverflowY)) {
    throw new Error(`${route} is not using the shell-owned primary scroll viewport.`);
  }
  if (geometry.mode === "fill" && !geometry.hasFillBody) {
    throw new Error(`${route} declares fill mode without a named fill viewport body.`);
  }
  if (geometry.mode === "document" && ["auto", "scroll"].includes(geometry.rootOverflowY)) {
    throw new Error(`${route} introduces a page-owned primary scroll container.`);
  }
}

try {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    console.log("Verifying first-value onboarding and sample isolation...");
    await page.goto(`${baseUrl}/?onboarding=v2`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "See how a real project moves through Frame Desk" }).waitFor();
    const initialProjectData = await page.evaluate(() => localStorage.getItem("video-editing-work-tracker:v1"));
    if (initialProjectData !== null) throw new Error("Fresh onboarding unexpectedly created project storage.");
    await page.getByRole("link", { name: "Explore a sample studio" }).click();
    await page.waitForURL(/\/sample-studio$/);
    await page.getByRole("complementary", { name: "Sample studio mode" }).waitFor();
    await page.getByRole("heading", { name: "Good to see you, Maya." }).waitFor();
    await page.getByTestId("project-row").first().click();
    await page.getByRole("button", { name: /^Open project / }).click();
    await page.getByTestId("project-detail-dialog").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    const sampleProjectData = await page.evaluate(() => localStorage.getItem("video-editing-work-tracker:v1"));
    if (sampleProjectData !== null) throw new Error("The sample studio wrote project records to local storage.");
    await page.getByRole("link", { name: "Exit sample" }).click();
    await page.getByRole("heading", { name: "See how a real project moves through Frame Desk" }).waitFor();
    await page.getByRole("button", { name: "Try on this device" }).click();
    await page.getByRole("heading", { name: "Turn one active edit into a clear production plan" }).waitFor();
    await page.getByRole("button", { name: "Show all tools" }).click();
    await page.getByRole("link", { name: "Clients" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Create first project" }).click();
    await page.getByRole("heading", { name: "Create Project" }).waitFor({ state: "visible" });
  }, { seedWorkspace: false });

  await withPage({ width: 390, height: 844 }, async (page) => {
    console.log("Verifying mobile first-value onboarding...");
    await page.goto(`${baseUrl}/?onboarding=v2`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "See how a real project moves through Frame Desk" }).waitFor();
    await page.getByRole("link", { name: "Explore a sample studio" }).click({ force: true });
    await page.getByRole("complementary", { name: "Sample studio mode" }).waitFor();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (hasOverflow) throw new Error("Mobile sample studio has document-level horizontal overflow.");
  }, { seedWorkspace: false });

  await withPage({ width: 1440, height: 1000 }, async (page) => {
    console.log("Verifying dashboard and command palette...");
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await chooseEssentialPrivacy(page);
    await page.getByRole("heading", { name: "Good to see you, Jordan." }).waitFor();
    await page.getByRole("button", { name: "Open profile menu" }).click();
    await page.getByRole("menuitem", { name: "Privacy choices" }).click();
    const privacyRegion = page.getByRole("region", { name: "Privacy preferences" });
    await privacyRegion.waitFor({ state: "visible" });
    await privacyRegion.getByRole("button", { name: "Allow analytics" }).click();
    await privacyRegion.waitFor({ state: "hidden" });
    const consentChoice = await page.evaluate(() => window.localStorage.getItem("cutlab-studio:privacy-consent:v1"));
    if (consentChoice !== "analytics") throw new Error(`Expected analytics consent to persist, received ${consentChoice}`);
    await page.getByRole("button", { name: /filters/i }).click();
    await page.getByPlaceholder("Search the project ledger").fill("Interaction");
    await page.getByTestId("project-row").first().click();

    await page.keyboard.press("Control+K");
    await page.getByPlaceholder("Search pages and actions...").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    console.log("Verifying calendar navigation...");
    await page.goto(`${baseUrl}/calendar`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Calendar" }).waitFor();
    await page.getByRole("button", { name: /previous month/i }).click();
    await page.getByRole("button", { name: /next month/i }).click();
    await page.getByRole("button", { name: /today/i }).click();
    await page.getByText(/scheduled deliveries/i).first().waitFor({ state: "visible" });

    console.log("Verifying media view and selection...");
    await page.goto(`${baseUrl}/media`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Grid view" }).click();
    await page.getByText("Interaction test edit").first().click();
  });

  await withPage({ width: 390, height: 844 }, async (page) => {
    console.log("Verifying mobile navigation and project inspector...");
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await chooseEssentialPrivacy(page);
    await page.getByRole("heading", { name: "Good to see you, Jordan." }).waitFor();
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByRole("heading", { name: "Create Project" }).waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByTestId("mobile-project-row").first().click();
    await page.getByRole("dialog", { name: "Project details" }).waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /more workspace pages/i }).click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Projects", exact: true }).click();
    await page.waitForURL("**/projects");
  });

  await withPage({ width: 1280, height: 900 }, async (page) => {
    console.log("Verifying theme and reduced-motion preference...");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/settings`, { waitUntil: "domcontentloaded" });
    await chooseEssentialPrivacy(page);
    const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!reduced) throw new Error("Reduced-motion media preference was not applied.");
    await page.getByRole("button", { name: "Dark" }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  });

  await withPage({ width: 1280, height: 900 }, async (page) => {
    console.log("Verifying every authenticated workspace route uses shared geometry...");
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await chooseEssentialPrivacy(page);
    for (const [route, heading, family] of workspaceRoutes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { level: 1, name: heading }).waitFor();
      await assertWorkspaceGeometry(page, route, family);
    }
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
  ]) {
    await withPage(viewport, async (page) => {
      console.log(`Verifying representative layout families at ${viewport.width}px...`);
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await chooseEssentialPrivacy(page);
      for (const [route, heading, family] of [
        ["/projects", "Projects", "data-index"],
        ["/calendar", "Calendar", "canvas"],
        ["/settings", "Settings", "administration"],
      ]) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
        await page.getByRole("heading", { level: 1, name: heading }).waitFor();
        await assertWorkspaceGeometry(page, route, family);
      }
    });
  }
  console.log("UI interactions and shared workspace geometry verified across all authenticated routes and responsive acceptance widths.");
} finally {
  await browser.close();
  if (server && !server.killed) await stopServer(server);
}

async function getOpenPort() {
  return new Promise((resolve, reject) => {
    const socket = createServer();
    socket.on("error", reject);
    socket.listen(0, () => {
      const address = socket.address();
      if (!address || typeof address === "string") {
        socket.close(() => reject(new Error("Could not allocate a local port.")));
        return;
      }
      const selectedPort = address.port;
      socket.close(() => resolve(selectedPort));
    });
  });
}

async function waitForServer(url, getOutput) {
  const started = Date.now();
  while (Date.now() - started < startupTimeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // Retry until the server is ready or the startup timeout expires.
    }
    if (server?.exitCode !== null) {
      throw new Error(`Production server exited before UI verification.\n${getOutput()}`);
    }
    await delay(300);
  }
  throw new Error(`Production server did not start within ${startupTimeoutMs / 1000}s.\n${getOutput()}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.kill("SIGTERM");
  await Promise.race([exited, delay(2_000)]);
  if (child.exitCode === null && process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", timeout: 5_000 });
  }
}

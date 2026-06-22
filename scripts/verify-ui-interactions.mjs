import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const startupTimeoutMs = 30_000;
const configuredBaseUrl = process.env.CUTLAB_UI_URL;
let server;
let baseUrl = configuredBaseUrl;

if (!baseUrl) {
  const port = await getOpenPort();
  baseUrl = `http://127.0.0.1:${port}`;
  const serverCommand = process.platform === "win32" ? "cmd.exe" : "npm";
  const serverArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm run start -- -p ${port}`]
    : ["run", "start", "--", "-p", String(port)];

  server = spawn(serverCommand, serverArgs, {
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
    const text = message.text();
    const ignoredLocalAssetError = text.includes("/_vercel/insights/script.js") || text.includes("/_vercel/speed-insights/script.js");
    const ignoredResource404 = text.includes("Failed to load resource: the server responded with a status of 404");
    if (message.type() === "error" && !text.includes("webpack-hmr") && !ignoredLocalAssetError && !ignoredResource404) errors.push(text);
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
    await page.getByRole("heading", { name: "Production overview" }).waitFor();
    await page.getByRole("button", { name: /filters/i }).click();
    await page.getByPlaceholder("Search projects...").fill("Interaction");
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
    await page.getByRole("heading", { name: "Production overview" }).waitFor();
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
  if (server && !server.killed) stopServer(server);
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

function stopServer(child) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  child.kill("SIGTERM");
}

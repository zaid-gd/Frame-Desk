import { defineConfig, devices } from "@playwright/test";
import { loadE2EEnvironment } from "./e2e/env";

loadE2EEnvironment();

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["cloud-workflow.spec.ts", "local-project.spec.ts"],
  fullyParallel: false,
  timeout: 90_000,
  expect: {
    timeout: 12_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "npm run dev:next",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});

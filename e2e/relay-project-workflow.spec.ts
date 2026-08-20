import { expect, test, type Page } from "@playwright/test";
import { loadE2EEnvironment } from "./env";

loadE2EEnvironment();

const stages = [
  { id: "template_default_stage_planned", label: "Planned", purpose: "planned" },
  { id: "template_default_stage_editing", label: "Editing", purpose: "editing" },
  { id: "template_default_stage_clientReview", label: "Client Review", purpose: "clientReview" },
  { id: "template_default_stage_revisions", label: "Revisions", purpose: "revisions" },
  { id: "template_default_stage_approved", label: "Approved", purpose: "approved" },
  { id: "template_default_stage_delivered", label: "Delivered", purpose: "delivered" },
];

async function openBoard(page: Page) {
  await page.addInitScript(({ workflowStages }) => {
    const workflowSetup = {
      templateId: "template_default",
      templateName: "Default workflow",
      stages: workflowStages,
      cancelledLabel: "Cancelled",
      starterOutputs: [{ id: "output_main", name: "Main video", relativeDeadlineDays: 0, roleId: null }],
      roles: [{ id: "role_editor", label: "Editor" }],
      portalDefaults: { enabled: false, showDates: true, showNotes: false, allowComments: true },
    };
    localStorage.setItem("relay:entry-mode:v1", "local");
    localStorage.setItem("relay:analytics:local:v1", "disabled");
    localStorage.setItem("relay:local-workspace:v2", JSON.stringify({
      clients: [{ id: "client_acme", name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "", archived: false }],
      projects: [{ id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Planned", tone: "planned", due: "2026-09-12", progress: "0%", status: "active", outstandingAmount: 1200, workflowTemplateId: "template_default", workflowStageId: workflowStages[0].id, workflowSetup, financialType: "projectValue", lead: "Owner", assignees: [] }],
    }));
  }, { workflowStages: stages });
  await page.goto("/relay/projects?view=board");
  if (await page.getByLabel("Access password").count()) {
    await page.getByLabel("Access password").fill(process.env.ACCESS_WALL_PASSWORD!);
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByRole("button", { name: "Drag Alpha" })).toBeVisible();
}

test("moves a Project with keyboard drag and announces the path", async ({ page }) => {
  await openBoard(page);
  const handle = page.getByRole("button", { name: "Drag Alpha" });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Alpha is over Planned.")).toBeAttached();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Alpha is over Editing.")).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByText("Requested moving Alpha to Editing.")).toBeAttached();
  await expect(page.getByText("Alpha moved to Editing. No earnings change.")).toBeVisible();
});

test("moves a Project with pointer drag", async ({ page }) => {
  await openBoard(page);
  const handle = page.getByRole("button", { name: "Drag Alpha" });
  const target = page.getByRole("heading", { name: "Editing" }).locator("..");
  const start = await handle.boundingBox();
  const end = await target.boundingBox();
  if (!start || !end) throw new Error("Project board drag targets are unavailable.");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + Math.min(80, end.height / 2), { steps: 12 });
  await page.mouse.up();
  await expect(page.getByText("Alpha moved to Editing. No earnings change.")).toBeVisible();
});

import { describe, expect, test } from "vitest";
import { createDefaultWorkflowTemplate } from "../domain/workflow-template";
import { createLocalProjectPort } from "./local-project-port";

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}

test("a saved local Project Group is available to the next Project form", async () => {
  const port = createLocalProjectPort({ storage: memoryStorage(), clients: [{ id: "client_acme", name: "Acme", archived: false }], templates: [createDefaultWorkflowTemplate("template_default", "Default workflow")] });
  await expect(port.createGroup({ name: "Launch", clientId: "client_acme", startDate: "", endDate: "", notes: "" })).resolves.toMatchObject({ ok: true });
  expect(port.loadGroups()).toMatchObject([{ name: "Launch", clientId: "client_acme" }]);
});

test("a local stage move persists delivery and reopening state", async () => {
  const storage = memoryStorage();
  const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
  const port = createLocalProjectPort({ storage, clients: [{ id: "client_acme", name: "Acme", archived: false }], templates: [template] });
  const created = await port.createProject({ name: "Launch", clientId: "client_acme", projectGroupId: "", templateId: template.id, dueDate: "2026-09-12", financialType: "salaryPlan" });
  if (!created.ok) throw new Error(created.error.message);
  const delivered = template.stages.find(({ purpose }) => purpose === "delivered")!;
  const editing = template.stages.find(({ purpose }) => purpose === "editing")!;

  await expect(port.moveProjectStage(created.value.id, delivered.id, false)).resolves.toMatchObject({ ok: false });
  await expect(port.moveProjectStage(created.value.id, delivered.id, true)).resolves.toMatchObject({ ok: true, value: { effect: { kind: "salaryPlan", change: "added" } } });
  expect(port.loadProjects()[0]).toMatchObject({ stage: "Delivered", progress: 100, completedAt: expect.stringMatching(/^2026|^20/) });
  await expect(port.moveProjectStage(created.value.id, editing.id, false)).resolves.toMatchObject({ ok: true, value: { effect: { kind: "salaryPlan", change: "removed" } } });
  expect(port.loadProjects()[0]).toMatchObject({ stage: "Editing", progress: 25, completedAt: undefined });
});

test("local Project Outputs retain version history without adding salary-counted Projects", async () => {
  const storage = memoryStorage();
  const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
  template.starterOutputs.push({ id: "output_short", name: "Short cut", relativeDeadlineDays: -1, roleId: null });
  const port = createLocalProjectPort({ storage, clients: [{ id: "client_acme", name: "Acme", archived: false }], templates: [template] });
  const created = await port.createProject({ name: "Launch", clientId: "client_acme", projectGroupId: "", templateId: template.id, dueDate: "2026-09-12", financialType: "salaryPlan" });
  if (!created.ok) throw new Error(created.error.message);

  const outputPort = createLocalProjectPort({ storage, clients: [{ id: "client_acme", name: "Acme", archived: false }], templates: [template], selectedProjectId: created.value.id });
  const outputs = outputPort.loadOutputs();
  expect(outputs).toMatchObject([{ name: "Main video", versions: [] }, { name: "Short cut", versions: [] }]);
  await expect(outputPort.addOutput({ name: " " })).resolves.toMatchObject({ ok: false, error: { kind: "invalid" } });
  await expect(outputPort.editOutput(outputs[0].id, { name: " ".repeat(201) })).resolves.toMatchObject({ ok: false, error: { kind: "invalid" } });
  await expect(outputPort.addMediaVersion(outputs[0].id, { url: "https://youtu.be/dQw4w9WgXcQ" })).resolves.toMatchObject({ ok: true });
  await expect(outputPort.addMediaVersion(outputs[0].id, { url: "https://vimeo.com/987654321" })).resolves.toMatchObject({ ok: true });

  const reloaded = createLocalProjectPort({ storage, clients: [{ id: "client_acme", name: "Acme", archived: false }], templates: [template], selectedProjectId: created.value.id });
  expect(reloaded.loadOutputs()[0]).toMatchObject({
    reviewState: "in_review",
    versions: [{ number: 1, source: { provider: "youtube" } }, { number: 2, source: { provider: "vimeo" } }],
  });
  expect(reloaded.loadProjects()).toHaveLength(1);
});

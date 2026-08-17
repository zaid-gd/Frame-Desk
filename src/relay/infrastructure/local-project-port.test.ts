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

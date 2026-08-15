import { describe, expect, test } from "vitest";
import { createLocalClientPort } from "./local-client-port";
import { createSampleClientPort } from "./sample-client-port";
import { RELAY_LOCAL_WORKSPACE_KEY } from "./local-workspace-state";

const input = { name: "Acme", company: "Acme Films", contactName: "Ava", email: "ava@acme.test", phone: "555-0100", notes: "Retainer" };

describe("Relay Client adapters", () => {
  test("validates before one local write and reloads the durable identifier", async () => {
    const values = new Map<string, string>();
    const writes: string[] = [];
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { writes.push(key); values.set(key, value); } };
    const port = createLocalClientPort(storage, () => "client_acme");

    await expect(port.createClient({ ...input, email: "bad" })).resolves.toMatchObject({ ok: false });
    expect(writes).toEqual([]);
    await expect(port.createClient(input)).resolves.toMatchObject({ ok: true, client: { id: "client_acme" } });
    expect(writes).toEqual([RELAY_LOCAL_WORKSPACE_KEY]);
    expect(createLocalClientPort(storage).loadClients()).toMatchObject([{ id: "client_acme", name: "Acme" }]);
  });

  test("keeps Sample Workspace fixtures read-only", async () => {
    const port = createSampleClientPort();
    expect(port.loadClients()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "client_demo", archived: false })]));
    await expect(port.createClient(input)).resolves.toMatchObject({ ok: false, error: { kind: "forbidden" } });
  });
});

import type { ClientId, ClientInput, ClientProject, ClientProjectGroup, RelayClient } from "../domain/client";
import type { ActionResult } from "./workspace-port";

export type ClientWriteResult = ActionResult & { client?: RelayClient };
export type ClientPort = {
  loadClients(): readonly RelayClient[];
  loadProjects(): readonly ClientProject[];
  loadProjectGroups(): readonly ClientProjectGroup[];
  canViewMoney(): boolean;
  createClient(input: ClientInput): Promise<ClientWriteResult>;
  editClient(id: ClientId, changes: Partial<ClientInput>): Promise<ClientWriteResult>;
  setClientArchived(id: ClientId, archived: boolean): Promise<ClientWriteResult>;
};

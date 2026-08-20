"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { Id } from "../../../convex/_generated/dataModel";
import { projectFileEffects, type ProjectFile, type ProjectFilePort } from "../ports/project-file-port";

type FileList = { retainedBytes: number; limitBytes: number; files: ProjectFile[] };
const refs = {
  list: makeFunctionReference<"query", { projectId: string; now: number }, FileList>("relayProjectFiles:list"),
  workspaceList: makeFunctionReference<"query", { now: number }, ProjectFile[]>("relayProjectFiles:listWorkspace"),
  prepare: makeFunctionReference<"mutation", { projectId: string; fileName: string; mimeType: string; size: number }, { uploadUrl: string; reservationId: Id<"relayUploadReservations"> }>("relayProjectFiles:prepareUpload"),
  finish: makeFunctionReference<"action", { projectId: string; reservationId: Id<"relayUploadReservations">; storageId: Id<"_storage">; fileName: string; mimeType: string; title: string }, { ok: true; id: string } | { ok: false; error: string }>("relayProjectFiles:finishUpload"),
  cancel: makeFunctionReference<"mutation", { reservationId: Id<"relayUploadReservations"> }, null>("relayProjectFiles:cancelUpload"),
  sharing: makeFunctionReference<"mutation", { id: string; portalVisible: boolean; allowDownload: boolean }, null>("relayProjectFiles:setSharing"),
  archive: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjectFiles:setArchived"),
  remove: makeFunctionReference<"mutation", { id: string }, null>("relayProjectFiles:permanentlyDelete"),
};

function failed(error: unknown, fallback: string) {
  return { ok: false as const, error: { kind: "unavailable" as const, message: error instanceof Error ? error.message : fallback } };
}

export function useCloudProjectFilePort(enabled: boolean, projectId?: string): ProjectFilePort | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  const result = useQuery(refs.list, enabled && projectId ? { projectId, now } : "skip");
  const workspaceResult = useQuery(refs.workspaceList, enabled ? { now } : "skip");
  const prepare = useMutation(refs.prepare);
  const finish = useAction(refs.finish);
  const cancel = useMutation(refs.cancel);
  const sharing = useMutation(refs.sharing);
  const archive = useMutation(refs.archive);
  const remove = useMutation(refs.remove);
  return useMemo(() => enabled ? ({
    state: () => ({ kind: result === undefined ? "loading" as const : "ready" as const }),
    files: () => result?.files ?? [],
    workspaceFiles: () => workspaceResult ?? [],
    usage: () => ({ retainedBytes: result?.retainedBytes ?? 0, limitBytes: result?.limitBytes ?? 200 * 1024 * 1024 }),
    async upload(file, title) {
      let reservationId: Id<"relayUploadReservations"> | undefined;
      try {
        if (!projectId) return failed(null, "Open a Project before uploading a file.");
        const prepared = await prepare({ projectId, fileName: file.name, mimeType: file.type, size: file.size });
        reservationId = prepared.reservationId;
        const { uploadUrl } = prepared;
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) { await cancel({ reservationId }); return failed(null, "File upload failed."); }
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !("storageId" in payload) || typeof payload.storageId !== "string") { await cancel({ reservationId }); return failed(null, "File upload returned no storage identifier."); }
        const saved = await finish({ projectId, reservationId, storageId: payload.storageId as Id<"_storage">, fileName: file.name, mimeType: file.type, title });
        return saved.ok ? { ok: true as const, value: { id: saved.id } } : failed(new Error(saved.error), saved.error);
      } catch (error) { if (reservationId) await cancel({ reservationId }); return failed(error, "File could not be uploaded."); }
    },
    async setSharing(id, portalVisible, allowDownload) { try { await sharing({ id, portalVisible, allowDownload }); return { ok: true as const, value: undefined }; } catch (error) { return failed(error, "File sharing could not be saved."); } },
    async setArchived(id, archived) { try { await archive({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return failed(error, "File archive state could not be saved."); } },
    async deletionImpact(id) {
      const file = result?.files.find((item) => item.id === id);
      if (!file) return failed(null, "Project file not found.");
      return { ok: true as const, value: projectFileEffects(file.size) };
    },
    async permanentlyDelete(id) { try { await remove({ id }); return { ok: true as const, value: undefined }; } catch (error) { return failed(error, "File could not be permanently deleted."); } },
  }) : null, [archive, cancel, enabled, finish, prepare, projectId, remove, result, sharing, workspaceResult]);
}

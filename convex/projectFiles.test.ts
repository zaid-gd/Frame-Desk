/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ownerPermissions = {
  viewProjects: true,
  createProjects: true,
  editProjects: true,
  updateStatus: true,
  commentProjects: true,
  manageTeam: true,
  useChat: true,
};

const reviewerPermissions = {
  viewProjects: true,
  createProjects: false,
  editProjects: false,
  updateStatus: false,
  commentProjects: true,
  manageTeam: false,
  useChat: true,
};

async function setupProject(team = false) {
  const t = convexTest(schema, modules);
  const createdAt = new Date().toISOString();
  const teamId = team ? await t.run((ctx) => ctx.db.insert("teamWorkspaces", {
    ownerUserId: "owner",
    name: "File Team",
    inviteCode: "FILES1",
    createdAt,
  })) : undefined;
  if (teamId) {
    await t.run(async (ctx) => {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: "owner",
        email: "owner@example.com",
        name: "Owner User",
        role: "Owner",
        status: "active",
        permissions: ownerPermissions,
        createdAt,
        joinedAt: createdAt,
      });
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: "reviewer",
        email: "reviewer@example.com",
        name: "Review User",
        role: "Reviewer",
        status: "active",
        permissions: reviewerPermissions,
        createdAt,
        joinedAt: createdAt,
      });
    });
  }
  await t.run((ctx) => ctx.db.insert("workItems", {
    userId: "owner",
    id: "project-files",
    teamId,
    ownerUserId: "owner",
    assigneeUserIds: team ? ["reviewer"] : [],
    profileId: "video-editing",
    title: "Project Files",
    client: "Client",
    status: "In Progress",
    workType: "Freelance",
    startDate: "2026-06-01",
    dueDate: "2026-06-10",
    earnings: 500,
    notes: "",
    createdAt,
  }));
  return {
    t,
    owner: t.withIdentity({ tokenIdentifier: "owner", name: "Owner User", email: "owner@example.com" }),
    reviewer: t.withIdentity({ tokenIdentifier: "reviewer", name: "Review User", email: "reviewer@example.com" }),
  };
}

describe("project file management", () => {
  test("stores categorized external files and chronological version history", async () => {
    const { owner } = await setupProject();
    const fileId = await owner.mutation(api.projectFiles.saveExternalVersion, {
      projectId: "project-files",
      category: "Reference",
      title: "Creative brief",
      description: "Approved client brief",
      status: "Approved",
      clientVisible: false,
      downloadable: true,
      provider: "google_drive",
      externalUrl: "https://drive.google.com/file/reference",
      externalId: "drive-file-123",
      fileName: "creative-brief.pdf",
      mimeType: "application/pdf",
      size: 2048,
      notes: "Initial brief",
    });
    await owner.mutation(api.projectFiles.saveExternalVersion, {
      projectId: "project-files",
      projectFileId: fileId,
      category: "Reference",
      title: "Creative brief",
      description: "Approved client brief",
      status: "Approved",
      clientVisible: false,
      downloadable: true,
      provider: "frame_io",
      externalUrl: "https://app.frame.io/projects/reference",
      externalId: "frame-asset-456",
      fileName: "creative-brief-v2.pdf",
      mimeType: "application/pdf",
      size: 4096,
      notes: "Client annotations included",
    });

    const result = await owner.query(api.projectFiles.listForProject, { projectId: "project-files" });
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      category: "Reference",
      title: "Creative brief",
      status: "Approved",
    });
    expect(result.files[0].versions.map((version) => version.versionNumber)).toEqual([2, 1]);
    expect(result.uploadHistory.map((version) => version.provider)).toEqual(["frame_io", "google_drive"]);
  });

  test("tracks Convex upload metadata and uploader identity", async () => {
    const { t, owner } = await setupProject();
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["video-data"], { type: "video/mp4" })));
    await owner.mutation(api.projectFiles.saveStorageVersion, {
      projectId: "project-files",
      storageId,
      category: "Asset",
      title: "Source clip",
      description: "Camera original",
      status: "Working",
      clientVisible: false,
      downloadable: true,
      fileName: "source.mp4",
      mimeType: "video/mp4",
      notes: "Uploaded from camera card",
    });

    const result = await owner.query(api.projectFiles.listForProject, { projectId: "project-files" });
    expect(result.uploadHistory[0]).toMatchObject({
      provider: "convex",
      fileName: "source.mp4",
      mimeType: "video/mp4",
      size: 10,
      uploadedByName: "Owner User",
    });
    expect(result.uploadHistory[0].url).toBeTruthy();
  });

  test("rejects reusing one Convex storage blob across versions", async () => {
    const { t, owner } = await setupProject();
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["shared"], { type: "text/plain" })));
    const version = {
      projectId: "project-files",
      storageId,
      category: "Asset" as const,
      title: "Shared source",
      description: "",
      status: "Working" as const,
      clientVisible: false,
      downloadable: true,
      fileName: "shared.txt",
      mimeType: "text/plain",
      notes: "",
    };

    await owner.mutation(api.projectFiles.saveStorageVersion, version);
    await expect(owner.mutation(api.projectFiles.saveStorageVersion, {
      ...version,
      title: "Duplicate source",
    })).rejects.toThrow("This uploaded file is already attached to a project version");
  });

  test("reviewers can view files but cannot upload, edit, or delete", async () => {
    const { owner, reviewer } = await setupProject(true);
    const fileId = await owner.mutation(api.projectFiles.saveExternalVersion, {
      projectId: "project-files",
      category: "Asset",
      title: "Brand kit",
      description: "",
      status: "Working",
      clientVisible: false,
      downloadable: true,
      provider: "external",
      externalUrl: "https://example.com/brand-kit.zip",
      fileName: "brand-kit.zip",
      mimeType: "application/zip",
      size: 1024,
      notes: "",
    });

    expect((await reviewer.query(api.projectFiles.listForProject, { projectId: "project-files" })).files).toHaveLength(1);
    await expect(reviewer.mutation(api.projectFiles.generateUploadUrl, { projectId: "project-files" })).rejects.toThrow("Project access required");
    await expect(reviewer.mutation(api.projectFiles.removeFile, { fileId })).rejects.toThrow("Project access required");
  });

  test("client portals expose only client-visible deliverables", async () => {
    const { t, owner } = await setupProject();
    await owner.mutation(api.projectFiles.saveExternalVersion, {
      projectId: "project-files",
      category: "Deliverable",
      title: "Final master",
      description: "Approved 4K export",
      status: "Delivered",
      clientVisible: true,
      downloadable: true,
      provider: "frame_io",
      externalUrl: "https://app.frame.io/final-master",
      fileName: "final-master.mp4",
      mimeType: "video/mp4",
      size: 5000,
      notes: "Internal upload note",
    });
    await owner.mutation(api.projectFiles.saveExternalVersion, {
      projectId: "project-files",
      category: "Asset",
      title: "Raw footage",
      description: "Internal only",
      status: "Working",
      clientVisible: false,
      downloadable: false,
      provider: "google_drive",
      externalUrl: "https://drive.google.com/raw-footage",
      fileName: "raw-footage",
      mimeType: "application/octet-stream",
      size: 9000,
      notes: "",
    });
    const portalId = await t.run((ctx) => ctx.db.insert("clientPortals", {
      ownerUserId: "owner",
      projectId: "project-files",
      token: "portal-token",
      title: "Project Files",
      clientName: "Client",
      projectType: "Freelance",
      status: "Delivered",
      sourceStatus: "Delivered",
      startDate: "2026-06-01",
      dueDate: "2026-06-10",
      progress: 100,
      clientSummary: "",
      clientNotes: "",
      estimatedCompletion: "2026-06-10",
      revisionLimit: 2,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    expect(portalId).toBeTruthy();
    await t.run(async (ctx) => {
      for (let index = 0; index < 50; index += 1) {
        await ctx.db.insert("projectFiles", {
          projectId: "project-files",
          ownerUserId: "owner",
          category: "Asset",
          title: `Hidden asset ${index}`,
          description: "Internal only",
          status: "Working",
          clientVisible: false,
          downloadable: false,
          createdByUserId: "owner",
          createdByName: "Owner User",
          createdAt: `2099-01-01T00:00:${String(index).padStart(2, "0")}.000Z`,
          updatedAt: `2099-01-01T00:00:${String(index).padStart(2, "0")}.000Z`,
        });
      }
    });

    const portal = await t.query(api.clientPortals.getByToken, { token: "portal-token" });
    expect(portal?.deliverables).toHaveLength(1);
    expect(portal?.deliverables[0]).toMatchObject({
      title: "Final master",
      detail: "Approved 4K export",
      status: "Delivered",
    });
    expect(portal?.deliverables[0]?.detail).not.toContain("Internal upload note");
  });

  test("client revision requests honor the configured portal limit", async () => {
    const { t } = await setupProject();
    await t.run((ctx) => ctx.db.insert("clientPortals", {
      ownerUserId: "owner",
      projectId: "project-files",
      token: "limited-portal",
      title: "Project Files",
      clientName: "Client",
      projectType: "Freelance",
      status: "Review",
      sourceStatus: "Review",
      startDate: "2026-06-01",
      dueDate: "2026-06-10",
      progress: 75,
      clientSummary: "",
      clientNotes: "",
      estimatedCompletion: "2026-06-10",
      revisionLimit: 1,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await t.mutation(api.clientPortals.submitRevision, {
      token: "limited-portal",
      clientName: "Client",
      message: "Please adjust the opening.",
    });
    await expect(t.mutation(api.clientPortals.submitRevision, {
      token: "limited-portal",
      clientName: "Client",
      message: "One more change.",
    })).rejects.toThrow("This portal has reached its revision request limit");
  });
});

import { describe, expect, test } from "vitest";
import { buildTeamAccess, canAccessProject } from "./team-access";

describe("Team access", () => {
  test("keeps Editor finance off by default and limits Editors to assigned Projects", () => {
    const access = buildTeamAccess({ role: "editor", memberId: "editor_1" });

    expect(access.permissions).toEqual({ projects: true, reviews: true, portals: true, finance: false });
    expect(access.canViewFinance).toBe(false);
    expect(access.canManageSalaryPlans).toBe(false);
    expect(canAccessProject(access, { lead: "other", assignees: [] })).toBe(false);
    expect(canAccessProject(access, { lead: "other", assignees: ["editor_1"] })).toBe(true);
  });

  test("makes Viewers read-only even when stored permissions are enabled", () => {
    const access = buildTeamAccess({
      role: "viewer",
      memberId: "viewer_1",
      permissions: { projects: true, reviews: true, portals: true, finance: true },
    });

    expect(access.canWrite).toBe(false);
    expect(access.canViewFinance).toBe(false);
    expect(access.permissions).toEqual({ projects: false, reviews: false, portals: false, finance: false });
  });

  test("gives Owners all capabilities and all-Project visibility", () => {
    const access = buildTeamAccess({ role: "owner", memberId: "owner_1", editorsCanViewAll: false });

    expect(access.canWrite).toBe(true);
    expect(access.canManageSalaryPlans).toBe(true);
    expect(access.canViewFinance).toBe(true);
    expect(canAccessProject(access, { lead: "other", assignees: [] })).toBe(true);
  });
});

export const teamRoles = ["owner", "editor", "viewer"] as const;
export type TeamRole = typeof teamRoles[number];

export const teamPermissionKeys = ["projects", "reviews", "portals", "finance"] as const;
export type TeamPermissionKey = typeof teamPermissionKeys[number];
export type TeamPermissions = Readonly<Record<TeamPermissionKey, boolean>>;

export type TeamAccess = {
  role: TeamRole;
  memberId: string;
  editorsCanViewAll: boolean;
  permissions: TeamPermissions;
  canWrite: boolean;
  canViewFinance: boolean;
  canManageSalaryPlans: boolean;
};

const ownerPermissions: TeamPermissions = { projects: true, reviews: true, portals: true, finance: true };
const editorDefaults: TeamPermissions = { projects: true, reviews: true, portals: true, finance: false };
const viewerPermissions: TeamPermissions = { projects: false, reviews: false, portals: false, finance: false };

export function buildTeamAccess({ role, memberId, editorsCanViewAll = false, permissions }: { role: TeamRole; memberId: string; editorsCanViewAll?: boolean; permissions?: Partial<TeamPermissions> }): TeamAccess {
  const resolved = role === "owner"
    ? ownerPermissions
    : role === "viewer"
      ? viewerPermissions
      : { ...editorDefaults, ...permissions };
  return {
    role,
    memberId,
    editorsCanViewAll,
    permissions: resolved,
    canWrite: role !== "viewer",
    canViewFinance: role === "owner" || (role === "editor" && resolved.finance),
    canManageSalaryPlans: role === "owner",
  };
}

export function canAccessProject(access: TeamAccess, project: { lead: string; assignees: readonly string[] }) {
  return access.role !== "editor"
    || access.editorsCanViewAll
    || project.lead === access.memberId
    || project.assignees.includes(access.memberId);
}

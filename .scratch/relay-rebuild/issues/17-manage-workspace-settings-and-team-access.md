# 17 — Manage Workspace settings and Team access

**What to build:** Let one Workspace begin solo and become a small Team while the Owner controls its identity, defaults, visibility, roles, and permissions. Member changes must preserve work and Activity, protect money and salary data, and keep Clients outside Team membership. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 16 — Find work through Calendar, Files, and global search.

**Status:** ready-for-agent

- [ ] The Owner can set Workspace name, one currency, time zone, default Workflow Template, and whether Editors may see all Team Projects.
- [ ] The free plan permits one Owner plus two invited members with Owner, Editor, or Viewer roles and separate project, review, portal, and finance permissions; Editor finance access starts disabled.
- [ ] Server authorization and screen models enforce the permission matrix, including Viewer read-only behavior, finance navigation and actions, assigned-Project defaults, and Owner-only Salary Plans.
- [ ] Ownership must transfer before an Owner leaves or deletes the account; removing a member preserves Projects and Activity, clears open assignments, and leaves Clients outside Team membership.


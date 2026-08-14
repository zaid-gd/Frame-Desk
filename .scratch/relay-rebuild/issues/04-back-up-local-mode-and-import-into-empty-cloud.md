# 04 — Back up Local Mode and import it into an empty cloud Workspace

**What to build:** Let Local Mode users export and restore a versioned JSON backup and preview a one-time move into an empty cloud Workspace. Reject malformed, incompatible, or unsafe input without changing saved work, and refuse automatic merging when the cloud Workspace already contains records. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 03 — Enter Relay through the new App Shell.

**Status:** ready-for-agent

- [ ] Export produces a versioned backup that contains the supported Local Mode workspace data without account or secret data.
- [ ] Import validates the file before writing, reports clear errors, shows record counts, and restores valid data without partial corruption.
- [ ] A signed-in empty cloud Workspace can import local data once, while a Workspace with existing work refuses the merge and preserves both sources.
- [ ] The Local Mode Playwright journey covers create, persist, export, isolate or clear, import, and restored behavior.


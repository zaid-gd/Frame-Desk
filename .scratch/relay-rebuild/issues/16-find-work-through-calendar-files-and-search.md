# 16 — Find work through Calendar, Files, and global search

**What to build:** Let users find commitments and material without editing them outside their owner. Relay must provide a read-only Calendar and subscribed feed, a searchable Workspace Files index whose write actions stay in Projects, and global search across core records and actions. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 15 — Track payments and report consistent money.

**Status:** ready-for-agent

- [ ] Calendar presents Project, Project Output, review, and payment dates without drag or event writes and exposes a read-only subscribed calendar feed.
- [ ] Files provides a searchable Workspace-wide index, but create, update, version, visibility, archive, and deletion actions remain in the owning Project.
- [ ] Global search finds allowed Clients, Projects, Project Groups, Project Outputs, and common actions without exposing archived or restricted data by default.
- [ ] Calendar, Files, and search work with keyboard-only use, high zoom, reduced motion, stable shell scrolling, and the relevant local, sample, and cloud capabilities.


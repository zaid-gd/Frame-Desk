# 09 — Move Projects through the workflow

**What to build:** Let users understand Projects by workflow stage and move them with pointer drag or an equal normal stage menu. Entering Delivered must show its money or Salary Plan effect and record the real delivery time; reopening must restore current progress without rewriting settled history. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 08 — Manage Projects through the table.

**Status:** ready-for-agent

- [ ] The board groups Projects by their copied workflow stages and supports dnd-kit pointer and keyboard behavior with useful announcements.
- [ ] Every board action has an equal keyboard-accessible stage menu that works without drag-and-drop.
- [ ] Moving to Delivered requires confirmation, records `completedAt`, and reports the earnings or Salary Plan effect in one transaction.
- [ ] Reopening clears current delivery-based progress where required but never changes a completed Salary Batch automatically.


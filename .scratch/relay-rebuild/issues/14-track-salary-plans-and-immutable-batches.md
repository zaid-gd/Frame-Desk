# 14 — Track Salary Plans and immutable Salary Batches

**What to build:** Let solo Owners manage Client-bound Salary Plans, see delivered-Project progress, form a full Salary Batch at the required count, and mark completed batches received. Finished batch history must remain explainable and unchanged when plans or old Projects change. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 13 — Store and share safe Project files.

**Status:** ready-for-agent

- [ ] A Salary Plan stores its Client, required Project count, full batch amount, start date, notes, and active or archived state; choosing it fixes the Project Client and disables a separate Project amount.
- [ ] Partial progress shows a count and no partial money; delivering the final required Project creates one unpaid Salary Batch transactionally.
- [ ] A Salary Batch snapshots its plan terms and contributing Project identifiers, can become received, and never changes automatically after reopening, deletion, or later plan edits.
- [ ] Salary Plans remain Owner-only even when an Editor has finance access, and domain, controller, and Convex tests cover progress, completion, immutability, archive, and correction notes.


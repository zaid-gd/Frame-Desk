# 03 — Enter Relay through the new App Shell

**What to build:** Let a visitor understand Relay, choose Local Mode, create an account, open a read-only Sample Workspace, or sign in, then enter real Relay routes inside one stable App Shell. Local Mode must explain browser-storage risk, and every mode must use the same capability-facing screen contracts. Commit this slice to the shared rebuild branch; do not open a separate pull request or deploy it.

**Blocked by:** 02 — Choose Relay's visual direction.

**Status:** ready-for-agent

- [ ] The welcome route presents Local Mode, account creation, and Sample Workspace as the main choices, with Sign In available below them.
- [ ] Local Mode persists solo data in the browser and displays a clear storage warning; Sample Workspace is realistic and read-only; cloud mode derives identity from the signed-in session.
- [ ] The App Shell provides real routes, a collapsible desktop sidebar, top bar, account controls, stable content frame, theme support, and accessible navigation for the agreed main sections.
- [ ] Controller and browser tests prove entry-mode choice, browser reload behavior, Sample Workspace write refusal, keyboard access, and no change to the deployed product.


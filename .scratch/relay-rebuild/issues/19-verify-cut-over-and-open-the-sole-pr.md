# 19 — Verify, cut over, and open the sole PR

**What to build:** Complete Relay only after every release-blocking route and behavior works on the shared rebuild branch, then remove the replaced presentation, run the full release checks, and open one final pull request. Do not deploy or alter old cloud records as part of this ticket.

**Blocked by:** 18 — Protect privacy and measure the private beta.

**Status:** ready-for-agent

- [ ] Old presentation code is removed only after new routes cover every release-blocking entry, backup, Client, Project, workflow, output, review, salary, payment, report, Team, file, portal, and keyboard journey.
- [ ] Production typecheck and build, relevant Vitest suites, adapter contracts, Convex tests, and the focused Local Mode and cloud Playwright journeys pass.
- [ ] Chrome and Edge pass through Chromium; release smoke tests pass in Firefox and WebKit; keyboard, landmarks, headings, names, errors, announcements, focus restoration, reduced motion, 200% text, and WCAG 2.2 AA checks pass.
- [ ] Targeted light, dark, desktop, tablet, and mobile-portal visual checks match the approved direction, old cloud tables and records remain untouched, and no production deployment has occurred.
- [ ] The shared branch contains small reviewable commits and opens exactly one final pull request for the complete Relay cutover.


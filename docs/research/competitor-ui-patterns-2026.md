# Competitor UI patterns for Frame Desk

Research date: 2026-08-11. Sources are first-party product pages and help docs. The notes below describe interaction patterns, not visual elements to copy. Frame Desk should keep its own visual identity and content model.

## Executive findings

- ClickUp makes hierarchy the main navigation model: Workspace → Space → Folder → List → task. It pairs that tree with a shared view bar, so the same work can be read as a list, board, calendar, timeline, dashboard, or document. This gives users both a stable location and a task-specific lens.
- monday.com makes the board the primary unit: workspace → board → groups → items → columns. Views and dashboards sit above the board data. Its strength is low-friction, visual status tracking and cross-board reporting.
- Clipflow (the content-team product at clipflow.co) puts production context at the center: templates, role-based assignment, smart due dates, media history, timestamped review, guest access, version control, and publishing. Its own product direction stresses saved filtered lists/custom kanbans and finding work without tab switching.
- Frame Desk should combine a clear workspace/project shell with media-first detail pages: a single source of truth for assets, tasks, versions, comments, approvals, and delivery. The useful differentiator is fast review context, not a larger collection of generic views.

## ClickUp

### Information architecture and shell

ClickUp documents a customizable hierarchy in which Spaces usually map to teams or departments, projects map to Folders, and project work lives in Subfolders or Lists. Its guidance scales the same model: a small project can use one List with tasks; a medium project can use one List per project inside a Folder; a large project can use a Folder with Lists for each stage. [ClickUp hierarchy best practices](https://help.clickup.com/hc/en-us/articles/20480724378135-Hierarchy-best-practices)

The UI implication is a persistent left navigation tree with clear location breadcrumbs and expandable nodes. Keep the active location visible while allowing a user to jump from a project to its parent Space or the whole workspace. Avoid requiring users to understand every level before they can start.

### Lists, boards, and views

ClickUp calls List view its primary view for grouping, filtering, sorting, and scanning many records. Board view turns work into drag-and-drop cards grouped by status, category, or subgroup; ClickUp calls out Kanban, stand-ups, retrospectives, and content creation as fits. Gantt handles sequencing and dependencies, while Calendar handles dates and content/campaign planning. [ClickUp hierarchy best practices](https://help.clickup.com/hc/en-us/articles/20480724378135-Hierarchy-best-practices)

The Views Bar sits at the top of a Space, Folder, Subfolder, or List. List and Board exist by default, and users can add Calendar, Table, Dashboard, Whiteboard, Chat, Docs, Embed, and Form views. Users can pin, reorder, group, set a default, protect, or make a private view. [ClickUp intro to views](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views)

Adaptation for Frame Desk: use one consistent view switcher per project or collection. Put the current view, saved filters, search, and create action in one compact toolbar. Keep personal saved filters separate from team defaults; make team views lockable and named by intent (for example, “Needs review” or “Ready to publish”).

### Dashboards and overview surfaces

ClickUp describes Dashboard view as a place to surface task tracking, collaboration, time tracking, project management, client collaboration, and sprint planning. It also supports Overview canvases with dynamic cards at higher hierarchy levels. [ClickUp intro to views](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views) [ClickUp hierarchy](https://help.clickup.com/hc/en-us/sections/17043541469591-The-Hierarchy)

For Frame Desk, the equivalent should be a project overview with a small set of actionable cards: review queue, overdue work, approval rate, latest versions, and delivery calendar. Let a card open the filtered list that produced it. This keeps a dashboard useful instead of decorative.

### Interaction and states

The documented board interaction is direct manipulation: drag a task between status groups. ClickUp’s view controls also include filter, sort, grouping, pinning, default selection, and protection. [ClickUp intro to views](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views)

Frame Desk should make status changes reversible where possible, show a visible save/sync state, and retain filter state when a user opens and closes an item. For media work, replace ambiguous “done” with explicit states such as Draft, In review, Changes requested, Approved, Scheduled, and Published.

## monday.com

### Information architecture and shell

monday.com starts with a workspace that groups boards, dashboards, docs, and related work. A board is made from groups, items, and columns: groups organize related work, items represent work, and columns carry status and other detail. Boards can be main, shareable, or private. [monday work management: get started](https://support.monday.com/hc/en-us/articles/115005305649-Get-started-with-monday-AI-work-platform) [The basics of a board](https://support.monday.com/hc/en-us/articles/115005317249-The-basics-of-a-board)

The design lesson is a simple entry point. A user can start with a board and change its columns and groups later. Frame Desk should offer a fast “new project” path with sensible defaults, while preserving a deeper project structure for teams that need it.

### Board views and direct manipulation

monday’s board view system supports Table, Gantt, Timeline, Files Gallery, Map, Workload, Chart, Calendar, Form, Kanban, Cards, and Pivot Boards. A board owner can pin views, hide the main table, lock views, and let members reorder their own view list. The header can collapse so views remain available without taking over the work area. [The board views](https://support.monday.com/hc/en-us/articles/360001267945-The-board-views)

This is a strong pattern for a dense app shell: give the user a stable content area, then let the view header collapse when it steals vertical space. Frame Desk can use the same behavior for a project’s List, Board, Calendar, Media, and Review views. Pinned team views should remain stable; personal order should remain personal.

### Dashboards and cross-board reporting

monday dashboards aggregate item and column data from connected boards. The product says dashboards provide one view across boards, with more than 30 widgets, filters, and support for linked or mirrored columns. Data must exist in board columns to appear in widgets. [The Dashboards](https://support.monday.com/hc/en-us/articles/360002187819-The-Dashboards)

For Frame Desk, cross-project reporting should draw from normalized project and media fields, not from bespoke card content. Define a small shared field set (owner, stage, priority, due date, review status, client, channel) so dashboards remain reliable. Each metric should link to the exact filtered records behind it.

### Contextual collaboration

monday keeps discussion attached to each item through an Updates Section, so questions and decisions stay tied to the work. It also positions Workdocs next to boards for longer planning and notes. [monday work management: get started](https://support.monday.com/hc/en-us/articles/115005305649-Get-started-with-monday-AI-work-platform)

Frame Desk should keep comments, mentions, decisions, and approval actions beside the media or task they concern. Do not split review notes into a separate chat destination. A side panel can support quick comments while a full detail route supports the complete history.

### Responsive and mobile patterns

The monday mobile docs expose a view picker from the board header, a bottom-sheet style list of saved views, filtering, and search. Mobile supports Table, Calendar, Timeline, Forms, Kanban, Battery, Cards, Files, and Map; some views remain browser-only. Dashboards are read-only on mobile. [Mobile app board views](https://support.monday.com/hc/en-us/articles/360015740220-Mobile-app-board-views)

This suggests a useful responsive rule for Frame Desk: preserve the same data and view names, but change the navigation surface to a picker and prioritize read, filter, comment, approve, and upload actions. A complex multi-column desktop grid should become cards or a single-column list; do not force horizontal scrolling for routine review.

## Clipflow

This section refers to [Clipflow’s project-management product](https://www.clipflow.co/), not similarly named video-editing or clip-distribution apps.

### Production-centered IA

Clipflow describes one workspace for planning, creating, reviewing, and tracking content. Its product page highlights project templates, auto-assignment, smart due dates, timestamped feedback, project access, guest seats, centralization, version control, repurposing, public sharing, and multi-platform distribution. [Clipflow product page](https://www.clipflow.co/)

The information architecture should therefore keep the project, brief/script, asset, version, review, and distribution record connected. A Frame Desk project page should make the next production action clear and show the latest asset without sending a user to a separate file system.

### Review flow and access

Clipflow emphasizes timestamped review, shared project context, role-based access, and guest access. It also calls out high-speed 4K review, reliable uploads, activity and media history, and safe storage. [Clipflow product page](https://www.clipflow.co/)

Frame Desk can compete on a short review loop: open media, scrub or jump to a timestamp, leave a note anchored to that moment, assign or resolve it, and approve or request changes. Make external review links scoped, labeled, and easy to revoke. Show who can see an asset before a user shares it.

### Views, labels, and discoverability

Clipflow’s mission page says its custom views and labels let teams save workspace-wide views for production or QC, switch between filtered lists and custom kanbans, apply labels, tune card content, and find projects and files without tab switching. [Clipflow mission and product direction](https://www.clipflow.co/mission)

This is a direct cue for Frame Desk’s navigation. Add saved shared views, configurable card fields, and a global search that returns projects, assets, versions, and review notes. Keep production and QC views as first-class presets. Do not bury media in a generic task list.

### Distribution and audit patterns

Clipflow’s newer product page describes a multi-client workspace, white-label no-login review, roles, and an audit log that records approvals, comments, automatic publishing, and confidence or mode. [Clipflow for agencies](https://clipflow.to/)

Frame Desk should use a clear activity timeline for uploads, version changes, comments, approvals, share-link events, and delivery. If automation is added later, expose the actor and outcome. Treat “approved” and “published” as separate states so users can see what still needs delivery.

## Cross-product design recommendations for Frame Desk

1. **Shell:** persistent workspace/project navigation on desktop; a single project picker plus bottom navigation or a compact drawer on small screens.
2. **Primary route:** each project opens to an overview with review queue, active work, due dates, latest versions, and recent activity. Every card links to filtered source records.
3. **View model:** List for scanning, Board for stage movement, Calendar for scheduling, Media for visual browsing, Review for timestamped feedback, and Dashboard for cross-project reporting. Use one view switcher and saved view model.
4. **Media detail:** show player/preview, version selector, metadata, comments anchored to timestamps, open tasks, approval controls, and history in one page or resizable split view.
5. **States:** define loading, empty, error, offline/syncing, upload processing, review requested, approved, rejected/changes requested, archived, and permission-denied states. Use text plus color/icon; never use color alone for status.
6. **Responsive behavior:** collapse navigation, convert tables to cards, expose filters in a sheet, keep search and approve/comment actions available, and make dashboards read-only if editing cannot work well on touch screens.
7. **Access:** distinguish internal members, clients/guests, and public links. Show access scope near share controls and provide an audit trail for review and delivery.
8. **Differentiation:** focus on “media context plus project control” — a fast path from asset to timestamped note to assigned fix to approved version. Avoid copying competitor colors, logos, exact layouts, or naming.

## Source list

- [ClickUp hierarchy best practices](https://help.clickup.com/hc/en-us/articles/20480724378135-Hierarchy-best-practices)
- [ClickUp intro to views](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views)
- [ClickUp hierarchy overview](https://help.clickup.com/hc/en-us/sections/17043541469591-The-Hierarchy)
- [monday work management: get started](https://support.monday.com/hc/en-us/articles/115005305649-Get-started-with-monday-AI-work-platform)
- [monday board basics](https://support.monday.com/hc/en-us/articles/115005317249-The-basics-of-a-board)
- [monday board views](https://support.monday.com/hc/en-us/articles/360001267945-The-board-views)
- [monday dashboards](https://support.monday.com/hc/en-us/articles/360002187819-The-Dashboards)
- [monday mobile board views](https://support.monday.com/hc/en-us/articles/360015740220-Mobile-app-board-views)
- [Clipflow project management](https://www.clipflow.co/)
- [Clipflow mission and product direction](https://www.clipflow.co/mission)
- [Clipflow for agencies](https://clipflow.to/)

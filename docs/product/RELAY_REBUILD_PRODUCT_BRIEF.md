# Relay Product Rebuild Brief

**Status:** Draft for review  
**Date:** 14 August 2026  
**Scope:** Full product and interface rebuild  
**Target users:** Freelance video editors and small post-production teams

## 1. Purpose

Relay helps video editors manage clients, video projects, reviews, deadlines, earnings, and salary batches from one workspace.

The first release will serve individual editors first and small teams second. It will stay focused on video-editing work rather than compete as a general project-management tool.

Suggested public description:

> Relay — Video workflow for editors

### Naming risk

The product owner has chosen **Relay** despite an existing product at [relayprojects.com](https://relayprojects.com/) that also uses the Relay name for creative-team workflow software.

This decision accepts a brand and search risk. It does not provide trademark, domain, company-name, or app-store clearance. Complete those checks before a public launch.

## 2. Product goals

The rebuild should:

- Make daily project tracking easy to understand and quick to use.
- Improve navigation, page structure, information hierarchy, and perceived quality.
- Help editors see what needs attention without opening every project.
- Give clients a simple way to view work and leave comments.
- Track completed work, collected money, outstanding money, and salary batches accurately.
- Support solo editors without blocking later team use.
- Increase weekly return use and customer retention.

## 3. Core domain model

```text
Workspace
├── Clients
│   ├── Project Groups
│   └── Projects
│       ├── Output Slots
│       │   └── Versions
│       ├── Client Portal
│       ├── Comments
│       ├── Files and Links
│       └── Activity
├── Workflow Templates
├── Salary Plans and Batches
├── Reports
└── Team Members
```

### 3.1 Client

A client is a real record rather than a name stored on a project.

Initial fields:

- Name
- Company
- Main contact name
- Email
- Phone
- Notes
- Active or archived state

Project totals, outstanding money, and portal history are derived from the client's projects.

### 3.2 Project Group

A Project Group optionally joins related projects under one client. Examples include `August Retainer`, `Launch Campaign`, or `Podcast Season 3`.

Fields:

- Name
- Client
- Optional date range
- Notes
- Active or archived state

Progress, project count, and money are calculated from the group's projects.

### 3.3 Project

One project normally represents one video job and one possible salary count.

Examples:

- `YouTube Episode 12`
- `Product Launch Reel 03`
- `Wedding Highlight Film`

A project stores its client, optional group, workflow, stage, dates, lead, assigned editors, financial type, internal notes, portal settings, and activity.

### 3.4 Output Slot

An output is an item produced by one project, such as:

- Main video
- Short cut
- Thumbnail
- Captions
- PDF or text document

Outputs do not count as separate salary work. If ten videos must count separately, the user creates ten projects.

Templates create real empty output slots rather than static suggestions.

### 3.5 Version

Each output can have several versions.

- The newest version becomes the client-visible version.
- Older versions remain in team-only history.
- Comments stay attached to the version that received them.
- Unresolved comments from an older version remain visible to the team.
- Adding a new version resets that output to its review state.

## 4. Project workflow

The default workflow is:

```text
Planned → Editing → Client Review → Revisions → Approved → Delivered
```

`Cancelled` sits outside the normal path.

Rules:

- Workspace owners may rename and reorder visible stage labels.
- Each stage keeps a fixed purpose for reports and portal display.
- Every workflow must have exactly one Delivered stage.
- Users cannot remove a stage while projects still use it.
- Moving a project to Delivered requires confirmation.
- The confirmation shows whether the move affects project earnings or salary progress.
- Relay records the actual completion time in `completedAt`.
- Reopening a project before it joins a completed salary batch removes it from current salary progress.
- Reopening or deleting a project after its salary batch completes does not rewrite the batch.

## 5. Project templates

Relay will ship with simple video-focused templates and allow owners to create workspace templates.

A template may define:

- Workflow stages
- Starter output slots
- Relative deadlines
- Default roles
- Portal defaults

Creating a project copies the template. Later template changes do not alter existing projects.

Generic tasks, subtasks, and template checklists are not part of the new product.

## 6. Salary plans and financial tracking

### 6.1 Salary plans

Salary plans support solo editors first.

Each plan contains:

- Plan name
- Client
- Number of completed projects required per batch
- Full batch amount
- Start date
- Active or archived state
- Optional notes

Assigning a salary plan to a project also fixes its client. Salary-tagged projects do not accept a separate project price.

Example:

- Contract: 20 completed videos for AED 10,000
- Six delivered projects show `6/20` with no salary amount recorded.
- The twentieth delivered project creates one AED 10,000 batch.
- The batch starts unpaid.
- The user marks it received after collecting the full amount.

Completed batches store:

- The terms used at completion
- Contributing project IDs
- Completion times
- Amount
- Received state and date
- Optional correction notes

Changing a salary plan affects future work only. Archiving a plan prevents new assignments but preserves its history.

Team-member salary contracts are deferred.

### 6.2 Client project money

Normal client projects store one agreed value and a Paid or Unpaid state.

Reports use these terms:

- **Earned:** value of delivered client projects
- **Collected:** value of delivered and paid client projects
- **Outstanding:** value of delivered but unpaid client projects

The workspace uses one currency chosen by the owner.

Relay records money but does not collect client payments in the first release.

## 7. Workspace and team model

Each account may own or join one workspace in the first release. A solo workspace becomes a team workspace when its owner invites members.

### 7.1 Roles

- **Owner:** Full access
- **Editor:** Access selected by the owner
- **Viewer:** Read-only access
- **Client:** Portal access only; never a workspace member

The free team allowance is one owner plus two invited members.

### 7.2 Member permissions

Owners configure invited-member permissions. Editor permissions may include:

- Create projects
- Edit projects
- Change stages
- Manage outputs and versions
- Open or close portals
- Comment
- View all projects or assigned projects only
- View Reports and Finance
- Mark client work paid

Finance access starts disabled. An editor with finance access sees Reports and Finance in the same way as the owner and may mark client work paid. The owner's personal salary plans remain private.

Each team project has one lead and any number of assigned editors.

Removing a member preserves their projects and recorded activity. A team owner must transfer ownership before leaving or deleting the account.

## 8. Application structure

### 8.1 Navigation

Desktop navigation contains:

- Dashboard
- Projects
- Clients
- Calendar
- Files
- Reports
- Team
- Settings and account controls

The left sidebar can collapse to icons. The app hides workspace switching because each account has one workspace.

Global search opens from the top bar or `Ctrl/Cmd + K` and searches clients, projects, groups, outputs, and common actions.

### 8.2 Projects index

The Projects section provides:

- A table with name, client, stage, due date, payment state, and salary marker
- An optional assignee column for team use
- A workflow board with drag-and-drop
- A normal stage menu as a keyboard-friendly alternative
- Remembered table or board preference
- Search, sorting, and filters stored in the URL where useful

### 8.3 Project page

Every project opens as a real route such as `/projects/[projectId]`. It must not open as a large dialog or container.

The page contains:

- Overview
- Outputs and versions
- Client Review
- Files and links
- Activity

The header keeps the stage, client, due date, lead, and assignees visible.

New-project creation uses a short dialog for name, client, group, template, due date, and salary plan or project value. Saving opens the full project page.

### 8.4 Client page

A client page shows:

- Contact details
- Active projects
- Past projects
- Project groups
- Outstanding payments
- Portal links

Relay will not add a sales pipeline or a broad customer-management system in the first release.

### 8.5 Dashboard

Dashboard content appears in this order:

1. Work needing attention
2. Active projects by stage
3. Work due soon
4. Salary batch progress
5. Completed work and money
6. Recent activity

### 8.6 Reports

Reports contain:

- **Work:** completed projects, output counts, turnaround time, and stage delays
- **Money:** earned, collected, outstanding, and client totals
- **Salary:** plan progress, completed batches, received batches, and unpaid batches

Reports support month, quarter, year, and custom ranges with prior-period comparison.

### 8.7 Calendar

Calendar is read-only. It shows project deadlines, output deadlines, review dates, and payment due dates.

### 8.8 Files

The top-level Files page is a searchable workspace-wide index. Users add and manage files, links, versions, and visibility from project pages.

## 9. Client portal and review

Each portal belongs to one project.

Portal controls include:

- Long random access link
- Optional PIN
- Manual opening and closure
- Optional whole-portal expiry
- Link copying
- Visible-output selection
- Public dates and notes
- Client preview

The portal shows:

1. Project name and public stage
2. Progress and any public dates
3. Outputs needing client attention
4. Other shared outputs
5. Comments and revision threads

Clients see only public stage names and content chosen by the editor. They never see internal notes, assignees, salary data, project value, or private dates.

### 9.1 Video embeds

The first release supports validated YouTube and Vimeo links. Relay stores only the provider, video ID, display settings, and related review records. YouTube and Vimeo host and stream the video.

Arbitrary embed code is not allowed. Other URLs appear as normal links.

### 9.2 Comments

- Each current output version has its own comment thread.
- Portal visitors enter a display name before commenting.
- Relay remembers the display name in that browser.
- The name is self-entered and not verified.
- Team members may resolve threads.
- Clients may reopen resolved threads.
- Expired or closed portals keep their internal review history.

Client-side approval and a formal Request Changes action are deferred and do not block the first release.

Relay will not send client email notifications at first. Editors share portal links and contact clients themselves.

The portal must work well on mobile from the first release.

## 10. Files and storage

### 10.1 Free beta allowance

- 200 MB total per workspace
- 20 MB per file
- PDF
- Plain text
- Markdown
- JPEG
- PNG
- WebP

The 200 MB allowance applies during private beta and may change before public pricing.

Relay initially rejects HTML, SVG, scripts, executables, and archives. Direct video and audio uploads are deferred.

### 10.2 Storage rules

- Files remain private and open through short-lived signed links.
- Portal visitors receive only files explicitly shared with them.
- Each shared image, PDF, or text file has an `Allow download` setting that starts disabled.
- Visible text can be selected and copied.
- Markdown renders without raw HTML.
- All old and current versions count toward storage use.
- Archiving a project keeps its files and storage use.
- Permanent file or version deletion requires a warning.
- The warning shows the file size and any history that may become unavailable.

If Relay approaches its 10 GB service allowance, it blocks new uploads before reaching the limit and keeps existing files available. It never deletes files automatically.

Paid plans later provide larger document and image storage. Direct video storage requires a separate cost, playback, retention, and security design.

## 11. Local and cloud modes

### 11.1 Welcome choices

The welcome screen offers:

- Continue locally
- Create an account
- Explore the sample workspace
- A smaller Sign In option below the main choices

### 11.2 Local mode

Local mode supports:

- Clients
- Projects
- Project groups
- Templates
- Salary plans
- Reports
- Calendar
- External links

Local mode does not support teams, public portals, or access across devices.

Local users may export and import a JSON backup. The UI explains that local work remains on that browser unless backed up.

### 11.3 Local-to-cloud import

Creating an account offers a one-time import preview with record counts.

- Import works when the account has no cloud workspace.
- The first release will not merge local data into an existing cloud workspace.
- Relay never overwrites cloud data without clear confirmation.
- Users can retain or export their local backup if import cannot proceed.

### 11.4 Cloud mode

Free cloud accounts receive:

- Cloud sync
- Relay-branded public portals
- Reports
- One owner plus two invited members
- The private-beta file allowance

## 12. Plans and billing direction

All plans allow unlimited clients, projects, groups, salary plans, and external YouTube or Vimeo links. Relay may use hidden technical safety limits to protect the service.

Planned paid benefits include:

- More storage
- More team seats
- Custom portal logo
- Business name
- Portal accent colour
- Optional removal of `Powered by Relay`

Custom portal domains are deferred.

The private beta will not charge users while storage and feature use are measured. Relay subscription billing comes after the rebuilt app and storage controls work but before a public paid launch.

If a user later downgrades while above a free limit:

- Existing work remains readable.
- New uploads stop.
- Relay shows what must be removed.
- Stored files remain available for a defined grace period.
- Relay does not delete files without warning.

## 13. Visual direction

The new interface should take structural cues from Cloudflare, ClickUp, and Notion without copying them.

Visual rules:

- Light mode first
- Quiet dark mode
- Clear page structure
- Strong typography
- Thin borders
- Few card containers
- Flat page sections
- Dense but readable tables
- Quiet neutral backgrounds
- Controls visible when needed
- Normal body text at 14–16 px
- Small to medium corner rounding
- Shadows only for menus, dialogs, and floating controls
- Limited motion
- One density mode at launch
- No bright gradients
- No glowing panels
- No heavy cards
- No tiny text for core information

### 13.1 Colour

- Primary: `#4F46E5`
- Hover and pressed: `#4338CA`
- Dark-theme links and selected text: `#A5B4FC`

Red, amber, and green are reserved for state. Relay must not rely on colour alone to show approval, payment, warning, or error states.

The interface targets WCAG 2.2 AA. See [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

The main workspace is desktop-first, followed by tablet. The client portal supports mobile from launch.

## 14. Technical direction

### 14.1 Keep

- Next.js App Router
- React
- Convex
- Clerk
- Tailwind CSS
- Owned Radix-based UI components
- TanStack Table
- Vitest
- Playwright
- OpenNext and Cloudflare

### 14.2 Add

- TanStack Form with Zod, first tested on the new-project form
- `dnd-kit` for the project board, with a non-drag alternative

### 14.3 Do not add without evidence

- TanStack Query
- TanStack Router
- Redux
- Zustand
- TanStack Virtual
- Another component framework

Convex remains the owner of live application data. Next.js remains the router. TanStack Table remains the table engine.

### 14.4 Code structure

Replace the large `TrackerApp` with real routes and feature-owned modules for:

- Projects
- Clients
- Review portal
- Salary plans
- Reports
- Files
- Team

Each feature owns its pages, components, forms, queries, mutations, and tests.

The rebuilt system uses new Convex tables. Old tables and records remain untouched until a later, separately approved cleanup.

## 15. Build and rollout plan

Implementation order:

1. New design system and workspace shell
2. Clients and client records
3. Projects, groups, stages, and templates
4. Outputs, versions, and client portals
5. Salary plans and payment tracking
6. Dashboard and Reports
7. Calendar, Files, and Team
8. Remove the old UI

The deployed app stays unchanged during local development. The completed rebuild ships through one pull request with small, reviewable commits.

Do not create a private legacy route. Do not deploy partial replacement screens.

Before UI implementation:

1. Reattach the current-app screenshots and visual references.
2. Create three visual directions for the Dashboard and Project page.
3. Select one direction.
4. Use that direction as the visual target for implementation.

## 16. Release requirements

The following flows block release if broken:

- Choose local, account, sign-in, or sample mode
- Export and import local data
- Import local data into an empty cloud account
- Create and edit a client
- Create and edit a project
- Create and use a Project Group
- Apply a project template
- Change workflow stages
- Confirm delivery
- Track salary progress and completed batches
- Mark client work paid
- Create, open, close, protect, and expire a portal
- View YouTube and Vimeo outputs
- Add versions
- Add, resolve, and reopen comments
- Use Reports
- Apply team permissions
- Enforce storage quotas and download settings
- Complete key flows with a keyboard

Browser support:

- Current Chrome
- Current Edge
- Current Firefox
- Current Safari

Relay targets WCAG 2.2 AA, visible focus, labelled controls, reduced motion, and correct keyboard order.

## 17. Deferred features

- Client-side approval
- Formal Request Changes action
- Time-coded comments
- Client email notifications
- Direct video and audio uploads
- Team salary contracts
- Client payment collection
- Persisted invoices and partial payments
- Relay subscription billing
- Custom portal domains
- Google Drive, Dropbox, Frame.io, Slack, and similar account connections
- Calendar editing and drag-and-drop
- Several workspaces or workspace switching
- Joining another workspace while owning one
- Full mobile workspace
- Old-data migration or deletion

## 18. Analytics and success measures

Private-beta measures:

- First client created
- First project created
- Weekly return use
- Projects delivered
- Portals opened
- Comments submitted
- Salary plans and batches used
- Storage used per workspace

Analytics must exclude:

- Client names
- Project names
- Comments
- File names
- Video and file links
- Portal tokens
- Money amounts

Local users choose whether to send product analytics. Signed-in users may disable optional product analytics. Essential security and error logs remain separate and must also avoid sensitive work data.

## 19. Confirmation

This document records the current shared understanding. It does not authorize implementation by itself.

Before code changes begin, confirm this brief or list the sections that need correction.

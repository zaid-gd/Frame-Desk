# CutLab Studio

![CI](https://github.com/zaid-gd/Work-Tracker/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-optional%20cloud%20sync-ee342f)
![Clerk](https://img.shields.io/badge/Clerk-auth-6c47ff)
![Status](https://img.shields.io/badge/status-V1%20polished-2f7d32)
![License](https://img.shields.io/badge/license-private-lightgrey)

CutLab Studio is a local-first production tracker for video editors. It brings projects, client work, delivery dates, revision queues, salary edit batches, reports, team collaboration, resources, and profile pages into one focused workspace.

The app is built for the real operating rhythm of editing work: planned cuts, in-progress revisions, delivered projects, freelance payments, personal channel uploads, and salary edits that count toward batch payouts.

## V1 Snapshot

| Area | Current state |
| --- | --- |
| Product status | Polished V1 application |
| Data model | Local-first browser storage with optional Convex cloud sync |
| Auth | Optional Clerk sign-in flow |
| Main users | Video editors, freelance editors, content teams, creator operators |
| Core workflow | Track edit projects from planning to delivery |
| Verification | TypeScript, production build, route/link/source verification |
| UI modes | Light mode, dark mode, accent colors, density settings |

## Preview

![CutLab Studio product overview](assets/readme-hero.png)

## What Works In V1

- Dashboard for active projects, earnings, delivery status, pending work, and salary batch progress.
- Project library with create, edit, delete, filtering, sorting, progress, status, type, due date, client, notes, and earnings.
- Client view generated from real project records, with working tabs for overview, projects, file packages, activity, and relationship notes.
- Timeline and calendar views connected to saved project dates.
- Media and feedback pages driven by project data instead of placeholder content.
- Reusable project templates for client campaigns, salary edits, channel uploads, and revision sprints.
- Reports for workload, delivery rate, salary edits, earnings, and work mix.
- Convex-backed Team workspace for small editing teams, with owner invites, role permissions, shared projects, assignments, comments, notifications, chat, and activity feed.
- Resources page for storing project asset and reference links until deeper storage/OAuth integrations are added.
- Settings for profile details, time zone, date format, week start, workflow stages, notifications, integrations, theme, accent color, and density.
- Public profile and organization profile pages connected to current settings and project stats.
- Local-first data handling with optional Clerk + Convex account-backed sync.
- Loading, error, empty, and validation states across the main workflows.
- Dark-mode-safe dropdowns, menus, dialogs, and app surfaces.

## Product Tour

### Dashboard

The dashboard gives an editor a fast production readout: active work, delivery pressure, revision load, salary batch completion, earnings, and recent project movement.

### Projects

The project library is the main source of truth. Each project stores title, client, status, type, start date, due date, earnings, and notes. The table supports filtering, sorting, editing, and delete confirmation.

### Clients

Clients are derived from project client names, so there is no second CRM database to maintain. The client detail panel now shows real project lists, file package progress, activity history, and notes from saved projects.

### Timeline And Calendar

Timeline and calendar views help show what is due, what shipped, and where each project sits in the delivery flow.

### Media And Feedback

Media summarizes production packages by work type and status. Feedback highlights planned and in-progress work that may need review attention.

### Team Collaboration

The Team workspace is built for small editing teams of up to five members. Owners create a workspace, invite members by email, and assign roles. Invited users must sign in with the invited email before joining.

Team projects are shared through Convex. Owners and editors can create and edit projects, reviewers can comment, and status-only updates are controlled by role permissions. Projects support owner metadata, active-member assignments, team comments, mention notifications, assignment notifications, and status/note activity logging.

The Team page includes:

- Member list with pending invites, active members, role changes, and removals.
- Project comments synced through Convex.
- Lightweight team chat for quick handoffs.
- In-app notifications for mentions, role changes, assignments, and project updates.
- Activity feed for workspace creation, invites, joins, comments, project changes, and member management.

### Templates

Templates create useful starter projects for common editor workflows:

- Client Campaign Edit
- Salary Batch Edit
- Channel Upload
- Revision Sprint

### Reports

Reports summarize the current workload, completed work, salary edit count, earnings, and work type mix.

### Profile And Organization

CutLab Studio includes public profile and organization profile surfaces, both connected to the same project and settings data used inside the app.

## Tech Stack

| Layer | Tooling |
| --- | --- |
| App framework | Next.js App Router |
| UI | React, Material UI |
| Language | TypeScript |
| Auth | Clerk |
| Backend sync | Convex |
| Local persistence | Browser storage |
| Verification | TypeScript, Next production build, custom route verifier |

## Getting Started

Requires Node.js `22` or newer.

```bash
npm install
npm run dev
```

The default dev command starts Convex and Next together:

```bash
npm run dev
```

For only the Next.js app:

```bash
npm run dev:next
```

For only Convex:

```bash
npm run convex:dev
```

## Environment

The app works local-first without cloud sync. To enable account-backed sync, configure Clerk and Convex in `.env.local`.

Common values include:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
CLERK_JWT_ISSUER_DOMAIN=
CLERK_FRONTEND_API_URL=
```

## Verification

```bash
npm run lint
npm run build
npm run verify:team
npm run verify:team:live
npm run verify:browser
npm run verify:prod
npm run verify
```

Available checks:

| Command | Purpose |
| --- | --- |
| `npm run lint` | TypeScript check with `tsc --noEmit` |
| `npm run build` | Next.js production build |
| `npm run verify:team` | Static Team collaboration invariant checks across Convex and UI code |
| `npm run verify:team:live` | Clerk/Convex prerequisite check plus the required two-account Team smoke-test checklist |
| `npm run verify:browser` | Production browser smoke route checks, including the Team route, with optional Firefox screenshots |
| `npm run verify` | Route, link, asset, and source invariant verification |
| `npm run verify:prod` | Production server verification |
| `npm run check:full` | Full CI-style verification path: typecheck, build, audit, Team invariants, browser smoke, and production verification |

For Team changes, also run `npm run verify:team:live`, then complete the live two-account Clerk/Convex smoke test before release:

1. Start the app with Convex enabled.
2. Sign in as an owner, create a Team workspace, and invite a second user by email.
3. Sign in as the invited user with the invited email and join with the invite code.
4. As owner/editor, create a team project, assign the invited member, and update notes/status.
5. Confirm the invited member sees the shared project, assignment notification, status update, activity feed entry, and project comments in real time.
6. Confirm role limits: reviewers can comment but cannot edit; clients cannot use team chat; removed members lose workspace access.

Recent production verification covered 19 routes, 450 rendered internal links, 390 Next assets, 4 PNG assets, and 125 source invariants.

## Why This Exists

Most task apps are too generic for editing work. CutLab Studio is intentionally narrower: it treats a video editor's work as deliverables, revisions, clients, batches, and publishing deadlines instead of abstract tasks.

The goal for V1 is not to be a huge project-management platform. It is to be a complete, stable, editor-specific workspace that feels useful on day one.

## Launch Copy

Short version:

> I built CutLab Studio, a local-first production tracker for video editors. It tracks client edits, salary batches, delivery dates, revisions, reports, profiles, and optional Convex cloud sync in one focused V1 app.

Longer version:

> CutLab Studio is my V1 production tracker for video editors. It is built around real editing workflows: planned cuts, in-progress revisions, delivered projects, salary edit batches, freelance work, personal channel uploads, calendar deadlines, client records, and reports. It works local-first, with optional Clerk + Convex sync when signed in.

## Current Status

CutLab Studio is in a polished V1 state. The main routes, forms, settings, data-backed pages, local persistence, optional cloud sync path, Team collaboration layer, loading states, empty states, validation states, dark mode surfaces, and verification scripts are all wired and passing local production checks.

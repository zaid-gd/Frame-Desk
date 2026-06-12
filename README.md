<p align="center">
  <img src="public/brand/logo/cutlab-studio.png" alt="CutLab Studio" width="360" />
</p>

<p align="center">
  <strong>A production command center for video editors and small creative teams.</strong>
</p>

<p align="center">
  Track edits, client deadlines, file versions, revision requests, salary batches, and team handoffs without turning your editing workflow into generic task-manager noise.
</p>

<p align="center">
  <img src="https://github.com/zaid-gd/Cutlab-Studio/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Convex-realtime%20backend-ee342f" alt="Convex" />
  <img src="https://img.shields.io/badge/Clerk-authentication-6c47ff" alt="Clerk" />
</p>

---

![CutLab Studio command-center dashboard](assets/readme-hero.png)

## Why CutLab Exists

Most project tools treat video editing like generic task tracking. CutLab is narrower on purpose: projects have clients, due dates, deliverables, review rounds, assets, references, salary batches, and final exports.

CutLab Studio is built around that real production rhythm.

## Product Highlights

| Area | What it does |
| --- | --- |
| Command dashboard | Shows urgent deliveries, workflow stage health, feedback queues, earnings, salary batch progress, and activity before the project table. |
| Project workspaces | Keeps personal projects separate from team projects, with timeline and calendar views folded into contextual navigation. |
| Project files | Stores deliverables, reference files, assets, upload history, immutable versions, file size, upload date, uploader, and provider metadata. |
| Client portal | Publishes a client-safe project link with optional expiry, access disabling, token regeneration, and PIN/password protection. |
| Team collaboration | Supports owners, editors, reviewers, invites, assignments, comments, mentions, notifications, activity, and team chat. |
| Public profiles | Gives editors shareable profile pages with portfolio metrics, projects, bio, location, time zone, and turnaround. |

## Built For Editing Work

### Production Control

- Workflow pipeline for Planning, In Progress, Review, and Delivered.
- Upcoming deliveries grouped by urgency.
- Activity feeds for project updates and team movement.
- Salary batch tracking for editors paid by delivered batches.
- Reports for workload, earnings, delivery rate, and work mix.

### File And Version Management

- Deliverables, reference files, and assets live inside each project.
- Every upload or linked file creates an immutable version.
- Versions track date, size, uploader, provider, file name, MIME type, and notes.
- Convex Storage uploads and external links share the same file model.
- Google Drive and Frame.io provider IDs are already modeled for future OAuth/API integrations.

### Client-Facing Delivery

- Unique client portal links require no client account.
- Editors can disable, expire, regenerate, or optionally password-protect a portal.
- Clients can monitor progress, download approved files, and submit revision requests.
- Internal notes, earnings, assets, references, uploader IDs, and team data stay private.
- Editors control which deliverables are visible and downloadable.

## Screens

![CutLab Studio personal and team project workspace](assets/readme-workflow.png)

Projects, Timeline, and Calendar are grouped together so the sidebar stays clean while still giving editors multiple ways to read the same production data.

![CutLab Studio team workspace](assets/readme-features.png)

The Team area keeps collaboration operational: members, client contacts, notifications, shared activity, and chat stay close to the work without mixing personal and team projects.

## Demo

The [60-90 second product demo flow](DEMO_FLOW.md) covers the full editor-to-client
story, including project setup, versioned delivery, a timecoded revision request,
final delivery, and the resulting dashboard update.

## Architecture Snapshot

| Layer | Stack |
| --- | --- |
| App framework | Next.js App Router |
| Interface | React 19, Material UI |
| Language | TypeScript |
| Auth | Clerk |
| Backend | Convex |
| Storage | Convex Storage plus provider-neutral external links |
| Local mode | Browser storage |
| Analytics | Vercel Analytics, Vercel Speed Insights |
| Tests | Vitest, `convex-test`, route/runtime verifiers |

## Data Model Notes

- `projectFiles` represents the logical deliverable, reference, or asset.
- `projectFileVersions` stores each uploaded or linked revision.
- Public portal queries return explicit client-safe projections.
- Server authorization always derives from the authenticated Convex identity.
- Team roles gate project and file mutations.
- Deleted projects clean up file versions, client portals, and project activity.

More detail lives in [Project File Architecture](docs/project-file-architecture.md).

## Quality Gates

This branch is validated with TypeScript, Convex tests, team-permission tests, production build checks, route verification, asset verification, and Convex development deployment.

Current automated coverage includes:

- Team roles, invitations, project sync, comments, mentions, chat, and role migration.
- Project uploads, external providers, version history, storage uniqueness, portal privacy, and revision limits.
- Route, link, metadata, screenshot asset, and source-invariant verification across the app.

The Convex-backed Team workspace has a static invariant check with
`npm run verify:team`. Authenticated realtime behavior is covered by the
`npm run verify:team:live` live two-account Clerk/Convex smoke test.

## Current State

CutLab Studio currently includes the command dashboard, separated personal/team projects, project file management, secured client portals, public profiles, account settings, consolidated navigation, branded empty states, Clerk authentication, Convex synchronization, Vercel analytics, and fresh README screenshots captured from the current UI.

Client portal security currently includes enable/disable controls, optional expiry, token regeneration, and optional PBKDF2-hashed PIN/password protection. See [Security](SECURITY.md) for the storage and access contract.

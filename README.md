# CutLab Studio

CutLab Studio is a local-first work tracker for video editors who need one place to manage client edits, salary batches, delivery dates, revisions, and project progress.

It is designed as a focused production dashboard rather than a generic task app. The interface is built around the real day-to-day flow of editing work: planned cuts, in-progress revisions, delivered projects, freelance payments, and salary edits that count toward a batch payout.

## Preview

![CutLab Studio product overview](assets/readme-hero.png)

![CutLab Studio workflow overview](assets/readme-workflow.png)

![CutLab Studio settings and integrations](assets/readme-features.png)

## What It Does

- Tracks video editing projects from planning through delivery.
- Separates freelance, salary, and personal channel work.
- Counts completed salary edits toward a configurable batch target.
- Shows project volume, earned revenue, pending work, and delivery status.
- Organizes clients from the project records already in the tracker.
- Provides calendar, timeline, media, feedback, reports, team, settings, public profile, and organization profile views.
- Stores tracker data locally in the browser.

## Product Screens

### Dashboard

The dashboard gives a fast overview of the editing pipeline: active projects, deadlines, feedback queue, salary edit progress, and collected earnings. It also includes filters for status, client, date, priority, and project type.

### Projects

The project library is the main working list. Each row shows the project title, client notes, work type, due date, delivery status, amount, and progress, with quick edit and delete actions.

### Clients

The clients view is generated from project client names. It helps review client activity, related projects, pending revisions, delivery history, and relationship notes without maintaining a separate CRM.

### Timeline

The timeline presents work as a dated production rail, making it easier to see what has shipped, what is due next, and how each project is progressing.

### Calendar

The calendar shows delivery dates across the month and respects the selected week-start setting.

### Feedback

The feedback page highlights planned and in-progress projects that may need review attention, plus a quick revision summary.

### Reports

Reports summarize workload, delivery rate, salary edits, earnings, and work mix.

### Profiles

The app includes two profile surfaces:

- Public profile: a client-facing summary of the editor, work stats, and recent project timeline.
- Organization profile: a studio/team view focused on members, active organization work, and team context.

Profile switching happens from the bottom identity menu in the sidebar.

## Settings And Customization

CutLab Studio includes local settings for:

- Profile details
- Time zone, date format, and week start
- Project stages
- Notification preferences
- Team roles and permissions
- Local integration connection records
- Theme, accent color, and density

The app supports light and dark themes, with a neutral dark mode built for long editing sessions.

## Design Direction

The UI is intentionally quiet and utilitarian. It takes inspiration from production tools and editing dashboards rather than marketing software:

- Dense but readable project rows
- Strong sidebar navigation
- Clear status and progress indicators
- Minimal decoration
- Local-first data model
- Fast access to common editor workflows

## Tech Stack

- Next.js
- React
- TypeScript
- Material UI
- Local browser storage

## Current Build

CutLab Studio is currently packaged as a polished local-first tracker with production build checks, route verification, local persistence, and a GitHub-ready product showcase.

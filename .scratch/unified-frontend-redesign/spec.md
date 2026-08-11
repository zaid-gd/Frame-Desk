# Unified frontend redesign

Status: implemented  
Owner: Frame Desk frontend  
Date: 2026-08-11

## Problem

Frame Desk has a strong shell and newer Precision screens, but legacy route families still use separate visual rules. Tokens, layout geometry, navigation labels, states, and responsive behavior drift across the product. The redesign must unify the frontend while preserving current routes, data flows, permissions, local/cloud/sample modes, fonts, and feature actions.

## Outcome

Ship one semantic design system and migrate every current frontend family to it. The result should support dense work like ClickUp and monday.com, retain Frame Desk’s media-review focus, and avoid copying competitor branding or exact layouts.

## Constraints

- Keep Next.js App Router 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Radix, Lucide, Motion, TanStack Table, Recharts, Sonner, Convex, Clerk, and current fonts.
- Keep visual primitives free of Convex, Clerk, repositories, and feature hooks.
- Use semantic CSS tokens for light/dark themes, accent, status, selection, focus, disabled, and density.
- Target WCAG 2.2 AA, 320px reflow, 200% text resize, keyboard-only operation, and reduced motion.
- Do not edit data or permission rules unless a migration exposes a regression.

## Users and key tasks

Freelance editors and small editing teams need to see due work, update projects, review media, manage clients, plan dates, report payouts, and coordinate people. Clients need clear, scoped review and delivery access. Public visitors need profiles and support pages.

## Design contract

The app shell uses a global bar, collapsible navigation, content rail, page header, local toolbar, and one primary work surface. Use the documented [system sections](../../docs/design/DESIGN_SYSTEM.md) and [feature contracts](../../docs/design/features/dashboard.md). Keep the current fonts: Space Grotesk for display and Geist Sans/Mono for the interface, body, data, and code. Keep a 4px/8px rhythm, semantic tokens, flat bordered surfaces, teal action, and clear status labels.

## Scope

In scope: tokens and primitives; shell/navigation; workspace-page geometry; dashboard/projects; calendar/timeline; media/reviews/resources/templates; clients/team/chat/reports/settings/account/profile; public/support surfaces; state, responsive, and accessibility coverage; documentation and visual QA.

Out of scope: new business features, data model redesign, auth-provider replacement, brand rename, or removal of routes because a competitor uses a different hierarchy.

## Vertical slices and dependencies

1. Token contract and primitive states.
2. App shell and navigation.
3. Workspace-page geometry and scroll ownership.
4. Dashboard and projects.
5. Calendar and timeline.
6. Media, reviews, resources, and templates.
7. Clients, team, chat, reports, integrations, and settings.
8. Profiles, portals, access, and support.
9. Consolidation, visual QA, accessibility QA, and legacy cleanup.

## Acceptance gates

- Typecheck and production build after each slice.
- Relevant UI/browser/unit tests and existing verification scripts pass.
- Desktop 1440px, tablet 768/1024px, mobile 390px and 320px checks pass in light/dark/reduced-motion modes.
- Keyboard pass covers navigation, search, CRUD, filters, tables, calendars, sheets, dialogs, chat, and settings.
- Screen-reader-oriented pass covers landmarks, headings, names, status, errors, and chart/table alternatives.
- Feature-preservation checklist in [audit](../../docs/design/current-frontend-audit.md) remains true.

## Research basis

See [frontend UI best practices](../../docs/research/frontend-ui-best-practices-2026.md), [competitor UI patterns](../../docs/research/competitor-ui-patterns-2026.md), [current frontend audit](../../docs/design/current-frontend-audit.md), and [workspace-page architecture](../../docs/architecture/workspace-page-system.md).

## Risks and responses

- Legacy `tracker-app.tsx` has wide ownership: migrate behind narrow visual seams and keep data handlers above them.
- Token changes can reduce contrast: test semantic pairs in both themes before screen migration.
- Dense surfaces can fail on mobile: use selected-detail sheets, prioritized lists, or announced scroll regions.
- Parallel route work can drift: require each ticket to consume system docs and pass the same QA gates.

## Definition of done

All tickets resolve, all current routes work, no feature family uses undocumented visual constants, docs index every contract, visual and accessibility checks pass, and legacy presentation code is removed only when unused.

## Comments

The implementation should use the local issue files in dependency order. Each ticket is a vertical slice with a narrow seam and explicit preservation checks.

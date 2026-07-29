# Refactor Plan: Shared Workspace Page System

**Status:** Implemented  
**Repository:** `zaid-gd/Cutlab-Studio`  
**Prepared:** 2026-07-29
**Completed:** 2026-07-30

## Problem Statement

Frame Desk workspace screens currently implement their own content width,
horizontal padding, page headers, action placement, metric layouts, panel
framing, split panes, and scrolling. The result is visible route-to-route drift:
some screens use narrow centered rails, some use wider centered rails, and some
use locally calculated heights or page-specific grids. The existing shared page
wrapper covers only part of the product and is coupled to application context,
so the more specialized screens bypass it.

The approved layout gallery establishes a clearer direction:

- authenticated workspace screens use the full horizontal workspace viewport
  up to one shared 1920px maximum, with consistent responsive gutters;
- Projects is a dense data/index page with thumbnail rows, a selected-project
  inspector, and a project list that scrolls independently on desktop;
- Calendar is a bounded canvas/schedule page;
- Settings is a navigation-and-form page;
- page files provide content, state, and handlers while shared presentation
  modules own sizing and responsive layout;
- structural layout uses CSS Grid and CSS, not page-specific TypeScript
  measurements.

The refactor must preserve all current application behavior, data flow,
permissions, Convex subscriptions, local/sample/cloud modes, and mutations.

## Solution

Introduce an app-owned workspace-page presentation module built from owned
shadcn/ui components, Radix behavior, Lucide icons, and existing design tokens.
The module will expose compositional primitives for the outer page, headers,
toolbars, metric strips, framed sections, data tables, split panes,
master-detail layouts, empty states, and bounded fill layouts.

The default workspace page occupies the full available width inside the
workspace shell until the shared 1920px content maximum. It applies standard
gutters: 16px on mobile, 20px on tablet, and 24px on desktop. Page files cannot
override that maximum or supply page-specific width settings.

The workspace shell remains the owner of the primary viewport. Normal document
pages use shell scrolling. Bounded workspaces use a shared fill layout and give
scrolling only to explicit internal regions such as a project collection,
calendar agenda, media list, or chat history.

Migration proceeds through small route-level slices. Each slice preserves
existing screen state and behavior and can be reverted without affecting other
families.

## Screen Audit and Layout Families

### Authenticated workspace screens

| Screen | Route | Layout family | Shared composition | Migration notes |
| --- | --- | --- | --- | --- |
| Dashboard | `/` | Data/index | Header, toolbar, metric strip, project ledger, inspector split, lower supporting split | Preserve first-run state, activity tabs, attention queue, salary payment mutation, search, filters, and project selection. |
| Sample Studio | `/sample-studio` | Data/index alias | Same Dashboard composition | Do not create a second layout. It must render the migrated Dashboard with sample-mode data and its sample banner. |
| Projects | `/projects` | Dense data/index | Header, toolbar, metric strip, bounded data-table frame, inspector split | Approved direction. Use thumbnail rows. On desktop the collection scrolls independently and the page does not; on mobile the page scrolls and details use the existing responsive behavior. |
| Calendar | `/calendar` | Canvas/schedule | Header, toolbar, fill viewport, calendar canvas, agenda inspector | Approved direction. Calendar semantics may calculate dates, but page and pane geometry remain CSS-owned. |
| Timeline | `/timeline` | Data/index chronology | Header, filter toolbar, grouped content sections | Preserve month grouping, status filters, counts, and project opening. Use normal shell scrolling. |
| Clients | `/clients` | Master-detail | Header, metric strip, master-detail | The client list is the master pane and project history is the detail pane. Preserve client creation, selection, metrics, and project navigation. |
| Reviews | `/feedback` | Master-detail | Header, toolbar, queue master, review detail | Preserve status filtering, selected review, comments/revision context, and project opening. Empty states remain inside the detail region. |
| Media | `/media` | Three-pane master-detail | Header, toolbar, fill viewport, collection master, media detail, inspector | Preserve grid/list toggle, project filter, file selection, upload/review states, and project navigation. Only bounded panes scroll. |
| Resources | `/resources` | Library | Header, toolbar, optional metrics, content section, empty state | Recommended first tracer because it exercises common chrome without complex layout state. Preserve add/edit/delete dialogs and project links. |
| Templates | `/templates` | Library | Header, toolbar, content section, template grid/list | Preserve blank-project creation, template selection, saved templates, and template dialogs. |
| Integrations | `/integrations` | Library/administration hybrid | Header, toolbar, content sections | Treat the outer layout as Library. Preserve local integration records and project links; do not add real provider integrations. |
| Reports | `/reports` | Data/analytics | Header, toolbar, metric strip, supporting split, ledger sections | Preserve period controls, CSV export, Recharts behavior, salary batches, payment status, editor attribution, and invoice drafts. |
| Team | `/team` | Administration split | Header, metric strip, balanced split, content sections | Preserve auth gates, invitation flow, role changes, member removal, comments, notifications, and activity. |
| Team Chat | `/team-chat` | Conversation | Header, fill viewport, message history, composer | Only message history scrolls. Preserve authentication, permissions, mentions, message send, and loading/empty states. |
| Settings | `/settings` | Navigation-and-form | Header, 320px section navigation, form sections | Approved direction. Preserve autosave/current save semantics, tags, salary settings, workflow stages, notifications, permissions, appearance, and regional settings. |
| Account | `/account` | Administration document | Header, narrow form sections within the full-width page | Preserve signed-in/signed-out/loading states and Clerk actions. The form itself may retain a readable measure without centering the whole page. |
| Organization | `/organization` | Administration summary | Header, metric strip, balanced content sections | Preserve team stats, member summary, active projects, and organization metadata. |
| Edit Profile | `/profile/edit` | Administration form | Header, navigation/form or document sections | Preserve profile image, public fields, preview behavior, and settings mutation. |

### Separate presentation systems

These screens are audited but are not consumers of the authenticated
workspace-page module.

| Screen | Route | Layout family | Decision |
| --- | --- | --- | --- |
| Profile Preview | `/profile` | Public profile presentation | Keep outside the workspace shell. Reuse public-profile visual patterns, not workspace page geometry. |
| Public Profile | `/u/[slug]` | Public profile presentation | Keep its public reading measure and public loading/error states. |
| Client Portal Landing | `/client-portal` | Portal landing | Keep the focused centered handoff state. |
| Client Portal Project | `/client-portal/[token]` | Client portal workspace | Keep a separate client-facing module. It may reuse visual primitives but not authenticated workspace layout assumptions. |
| Terms of Service | `/terms` | Legal document | Keep the readable legal-document measure. |
| Privacy Policy | `/privacy` | Legal document | Keep the readable legal-document measure. |
| Accessibility | `/accessibility` | Legal document | Keep the readable legal-document measure. |
| Contact | `/contact` | Legal/contact document | Keep the legal shell and contact form. |
| Privacy redirect | `/privacy-policy` | Redirect | No layout migration. |
| Not Found | unmatched routes | System state | Keep a focused recovery card. |
| Global Error | route errors | System state | Keep a focused recovery card and retry behavior. |

### Development-only screens

| Screen | Route | Layout family | Decision |
| --- | --- | --- | --- |
| Dashboard prototype | `/prototype/dashboard` | Throwaway prototype | Capture the validated decision, then remove from the production branch after migration. |
| Workspace layout gallery | `/prototype/workspace-layouts` | Throwaway prototype | Primary visual source for Projects, Calendar, Settings, full-width geometry, and gutter decisions. Remove after the shared system and tracer pages are accepted. |

## Commits

### Slice 0: Lock the decisions and test boundary

1. Update the workspace-page architecture decision from a centered 1536px rail
   to a full-width workspace with standard responsive gutters. Keep public,
   legal, and portal surfaces explicitly separate.
2. Add the complete route-to-family inventory to the architecture documentation
   and identify the three approved gallery screens as visual references.
3. Add a browser-test helper that measures visible page bounds, horizontal
   overflow, and scroll ownership without depending on Tailwind classes.
4. Add passing baseline smoke coverage for every authenticated workspace route,
   asserting only that the route renders its primary heading and has no
   document-level horizontal overflow.

### Slice 1: Introduce the shared presentation module

5. Add the full-width workspace page root with responsive gutters, normal and
   fill modes, and no application or data imports.
6. Add the shared page header with optional eyebrow, description, and action
   regions. Add behavior-focused rendering tests for optional regions and
   heading structure.
7. Add the shared toolbar with primary and secondary regions, responsive
   wrapping, and optional sticky behavior.
8. Add the metric strip and metric item with finite two-, three-, four-, and
   five-column CSS variants.
9. Add the content section and empty state, including padded and flush body
   modes.
10. Add the data-table frame with a stable section header, internal vertical
    scroll region, and horizontal overflow containment.
11. Add semantic split-pane variants for inspector, balanced, and supporting
    layouts.
12. Add master-detail and three-pane composition with CSS-only responsive
    stacking.
13. Add the fill viewport with header, body, and footer rows and explicit
    internal-scroll slots.
14. Add an internal development fixture that renders every shared primitive in
    light and dark themes without using feature data.

### Slice 2: Migrate the low-risk Library tracer

15. Move Resources onto the shared page root and header while leaving all
    resource content and handlers unchanged.
16. Move Resources actions and search/filter controls into the shared toolbar.
17. Move Resources statistics, library panel, and empty state onto shared
    primitives. Verify add, edit, delete, and project-link behavior.

### Slice 3: Migrate the approved Projects tracer

18. Move Projects onto the shared full-width page, header, toolbar, and metric
    strip without changing project selection or mutations.
19. Move the project collection and inspector into the shared inspector split.
    Preserve current desktop and mobile selection behavior.
20. Introduce the approved thumbnail project-row presentation while preserving
    accessible names, status, due date, progress, value, menus, and row
    selection.
21. Put the desktop project collection in the shared bounded data-table frame.
    Verify that the collection scrolls vertically, does not scroll
    horizontally, and the shell page itself remains fixed.
22. Verify Projects in personal, team, sample, signed-out, loading, empty, and
    populated states. Run existing project and privacy interaction coverage.

### Slice 4: Migrate the remaining Library screens

23. Move Templates onto the shared Library composition without changing
    template creation or project creation behavior.
24. Move Integrations onto the shared Library/administration composition without
    changing local records, settings, dialogs, or project links.
25. Run a family-level responsive and theme check across Resources, Templates,
    and Integrations.

### Slice 5: Migrate the approved Calendar canvas

26. Move Calendar header, month navigation, view controls, and outer page onto
    the shared full-width fill composition.
27. Move the calendar canvas and selected-day agenda into the shared inspector
    split and bounded regions.
28. Verify previous month, next month, Today, date selection, project opening,
    empty days, dense days, desktop local scrolling, and mobile stacking.

### Slice 6: Migrate the approved Settings form

29. Move Settings onto the shared full-width page and approved
    navigation-and-form composition.
30. Move the settings index into the shared 320px master region and preserve
    section navigation and sticky behavior.
31. Move settings groups into shared content sections one group at a time:
    project rules, workflow, notifications, permissions, integrations,
    appearance, and regional settings.
32. Verify every settings mutation, theme changes, reduced motion, salary
    settings, tag/stage editing, reset behavior, and responsive stacking.

### Slice 7: Migrate the remaining Data/index screens

33. Move Timeline onto the shared header, toolbar, and grouped content sections.
    Preserve status filtering, monthly groups, counts, and project navigation.
34. Move Reports header, period controls, exports, and metrics onto shared
    primitives without changing chart or financial calculations.
35. Move Reports charts into the supporting split and ledgers into shared
    sections. Verify salary payment status and editor attribution.
36. Move Dashboard header, filters, metrics, ledger, and inspector onto shared
    primitives without changing data selection or mutations.
37. Move Dashboard attention and activity regions into the shared balanced
    split. Verify activity-tab switching preserves the shell scroll position.
38. Verify the Sample Studio route renders the same migrated Dashboard
    composition with sample data and no separate geometry.

### Slice 8: Migrate Master-detail screens

39. Move Clients onto the shared header, metrics, and master-detail composition.
    Preserve selection, search, client creation, project history, and project
    navigation.
40. Move Reviews onto the shared master-detail composition. Preserve review
    status, selected item, revision context, empty states, and project opening.
41. Move Media onto the shared three-pane fill composition. Preserve grid/list
    views, project filtering, selection, file states, and project navigation.
42. Verify desktop bounded scrolling and mobile detail behavior for Clients,
    Reviews, and Media.

### Slice 9: Migrate Administration screens

43. Move Team outer chrome, metrics, membership, activity, comments, and
    notification regions onto shared administration primitives without changing
    authorization behavior.
44. Move Account onto the shared page and content sections while preserving all
    Clerk loading and authentication states.
45. Move Organization onto the shared administration summary composition while
    preserving team/project statistics.
46. Move Edit Profile onto the shared form composition while preserving profile
    mutation and preview behavior.
47. Run signed-in, signed-out, owner, editor, reviewer, loading, empty, and
    populated checks for the administration family.

### Slice 10: Migrate Conversation

48. Move Team Chat onto the shared fill page while preserving authentication,
    workspace state, and conversation header.
49. Place message history in the dedicated internal scroll region and keep the
    composer visible in the footer row.
50. Verify message sending, mentions, permissions, empty/loading states, mobile
    keyboard layout, and scroll retention.

### Slice 11: Remove temporary and duplicated layout code

51. Remove the tracker-local page wrapper after its final caller has migrated.
52. Remove duplicated page-root width, gutter, header, section-surface, and
    page-height declarations now owned by the shared module.
53. Add a repository check preventing authenticated workspace screens from
    introducing their own root maximum widths, viewport measurements, or
    primary scroll containers.
54. Expand production route smoke coverage to every authenticated workspace
    route and retain representative visual checks for each layout family.
55. Capture the approved prototype decision on a throwaway branch, remove the
    development-only gallery from the production branch, and keep the
    architecture decision as the permanent source of truth.
56. Run typecheck, build, route smoke, UI interactions, project workflows, team
    checks, file checks, and responsive browser acceptance before closing the
    refactor.

## Decision Document

- The shared workspace-page module is a presentation module inside the existing
  design-system seam.
- Authenticated workspace pages use the full available width with 16px mobile,
  20px tablet, and 24px desktop gutters.
- Public profile, legal, client portal, system-state, and prototype screens do
  not use authenticated workspace geometry.
- Page files own content, state, handlers, feature semantics, and choice of
  layout family.
- Shared components own outer size, gutters, header alignment, toolbar
  placement, metric geometry, panel framing, split proportions, responsive
  stacking, and scroll boundaries.
- JSX composition is preferred over a page configuration schema.
- Structural components expose finite semantic variants and do not accept
  arbitrary maximum widths or grid templates.
- CSS Grid and CSS responsive behavior own geometry. TypeScript may calculate
  domain semantics such as calendar dates, but not viewport layout.
- The workspace shell owns the primary workspace viewport.
- Normal pages use shell scrolling. Fill pages assign scrolling only to named
  internal regions.
- Projects uses thumbnail rows and an independently scrollable desktop
  collection. The page itself does not scroll on desktop.
- Calendar and Settings follow the approved gallery direction.
- Settings uses a 320px desktop navigation column.
- Mobile master/detail surfaces stack or use existing owned shadcn Sheet
  patterns rather than shrinking desktop columns.
- shadcn/ui remains the component ownership model, Radix supplies accessible
  behavior, Lucide is the icon family, Motion is limited to meaningful
  transitions, Recharts stays inside charts, and TanStack Table stays inside
  complex tables.
- No new general-purpose component library is introduced.
- No application, Convex, Clerk, repository, or feature hook imports are
  allowed in the shared workspace-page module.
- Every migration commit preserves local, sample, and cloud behavior.

## Testing Decisions

- Good tests assert visible behavior and stable accessibility contracts:
  headings, controls, responsive order, pane visibility, route output, selected
  state, scroll ownership, and absence of horizontal overflow.
- Tests must not assert Tailwind class strings, internal component names,
  Radix-generated markup, implementation-specific DOM depth, or pixel-perfect
  values that do not express a product requirement.
- Add shared browser helpers for page bounds and scroll ownership, then reuse
  them across families.
- Add route smoke coverage for all authenticated workspace routes.
- Keep existing end-to-end project tests as prior art for project creation,
  editing, deletion, filters, and responsive inspectors.
- Keep the existing UI interaction verifier as prior art for Dashboard,
  Calendar, Media, Settings, mobile navigation, privacy controls, theme, and
  reduced motion.
- Keep existing Team and file tests as prior art for authorization, membership,
  comments, notifications, and project-file behavior.
- Add focused acceptance checks at 390px, 768px, 1280px, and 1920px.
- Check one representative screen from every family in both light and dark
  themes.
- Verify scroll behavior with enough records to overflow the intended local
  region.
- Run typecheck after every commit, focused browser checks after every route
  migration, build at every family boundary, and the complete verification
  suite before removing temporary wrappers.

## Out of Scope

- Changing Convex schemas, queries, mutations, authorization, or subscription
  behavior.
- Changing Clerk authentication flows.
- Reworking local, sample, or cloud data adapters.
- Adding provider integrations, OAuth, webhooks, or synchronization.
- Redesigning public profiles, legal pages, client portal screens, not-found
  screens, or global error screens.
- Changing navigation information architecture, route names, or the workspace
  shell.
- Replacing shadcn/ui, Radix, Lucide, Motion, Recharts, or TanStack Table.
- Adding another general-purpose component system.
- Combining this refactor with remaining MUI dependency removal.
- Changing business calculations, salary rules, financial attribution, project
  status rules, or team permissions.
- Deploying the refactor before responsive browser acceptance passes.

## Further Notes

The workspace layout gallery is a design source, not production-quality
implementation. Approved structures should be rewritten through the shared
module rather than copied wholesale.

The full-width decision supersedes the earlier centered 1536px workspace rail.
Readable inner measures remain valid for forms, prose, and inspectors, but the
page container itself must not be centered within unused side space.

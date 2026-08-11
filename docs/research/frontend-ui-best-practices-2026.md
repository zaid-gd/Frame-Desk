# Frontend UI best practices for Frame Desk (2026)

**Research date:** 2026-08-11  
**Scope:** Dense work-management SaaS interfaces. This report informs the Frame Desk redesign while keeping its current Next.js/React, Tailwind, shadcn/ui, and Radix approach. Sources are first-party specifications or project documentation.

## Executive direction

Frame Desk should use a stable app shell, a compact but readable content grid, semantic design tokens, and progressive disclosure. Keep the primary work surface visible while moving infrequent actions into menus, drawers, and command search. Aim for WCAG 2.2 AA as the acceptance bar, and test the full keyboard and screen-reader path for every feature.

The goal is not to copy ClickUp, Monday.com, or ClipFlow. Use the same category conventions users expect—workspace navigation, views, filters, bulk actions, activity, and clear status—while preserving Frame Desk's current features and fonts.

## 1. Layout and information architecture

### Recommendation

Use a three-layer shell:

1. A global bar for workspace switcher, global search/command entry, notifications, help, and account controls.
2. A collapsible left navigation for workspace areas, favorites, and recent items.
3. A page frame with a local header, view toolbar, and one primary work surface (table, board, timeline, calendar, or media grid).

Keep navigation landmarks stable across routes. Give each page one descriptive `h1`; use headings to group content, and use a skip link to bypass repeated navigation. Next.js client-side route changes announce the page title, then the `h1`, then the pathname, so every route needs a unique title and meaningful `h1` ([Next.js accessibility](https://nextjs.org/docs/architecture/accessibility)).

Use a max-width only for reading-oriented panels. Data-heavy views should fill the available content area, with a minimum usable column width and intentional horizontal scrolling when the data cannot reflow. Do not hide essential fields solely to fit a preferred width.

### Dense-workspace rules

- Keep a persistent page header (title, context, primary action); make the secondary toolbar sticky only when it does not cover focused content.
- Separate navigation, controls, and content with surface, border, and spacing tokens rather than many competing shadows.
- Use a resizable split pane only where the second pane adds a clear task benefit. Provide a keyboard-accessible separator and a non-drag alternative.
- Treat tables and boards as work surfaces, not decorative cards: support selection, focus, sorting/filtering, empty results, loading, and error states in the same frame.

## 2. Navigation and views

Use ordinary links for route navigation. Use a disclosure for showing or hiding a navigation group, tabs for switching panels within the same context, and a menu button for actions. Do not give a generic set of links the ARIA `menu` role; Radix's navigation guidance notes that its Navigation Menu is not a menubar ([Radix Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu)).

Recommended navigation model:

- **Workspace:** Dashboard, Inbox/Assigned, Projects, Media/Resources, Reports, and Settings (only expose areas that exist today).
- **Context:** breadcrumb or project name, current view, saved views, and filters.
- **View switcher:** table, board, timeline, calendar, or other existing views. Persist the selected view per user/workspace where the product already supports persistence.
- **Command search:** search entities and expose actions, but keep visible labels for common actions. If single-character shortcuts exist, let users turn them off or require a modifier; WCAG 2.2 addresses character-key shortcut conflicts ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).

Radix Primitives provide focus management, ARIA/role wiring, and keyboard navigation aligned with WAI-ARIA practices; use them for dialogs, menus, popovers, tabs, tooltips, and navigation rather than recreating those interaction models ([Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)).

## 3. Components and composition

Use shadcn/ui as source code owned by the app, not as an opaque dependency. Its design supports open component code, composition, predictable interfaces, and direct customization ([shadcn introduction](https://ui.shadcn.com/docs)). Keep base primitives small and compose product components above them:

- **Foundation:** Button, IconButton, Link, Input, Textarea, Select/Combobox, Checkbox, Switch, Label, Badge, Separator, Tooltip.
- **Surfaces:** Card, Sheet/Drawer, Dialog, Alert Dialog, Popover, Dropdown Menu, Scroll Area, Resizable.
- **Work surfaces:** Data Table, Board/List row, Calendar item, Timeline row, Filter builder, Bulk-action bar, Activity feed.
- **Feedback:** Alert, Inline error, Empty state, Skeleton, Spinner, Toast/Sonner, Progress.

Every component should define its anatomy, allowed content, keyboard model, focus behavior, loading behavior, disabled behavior, error behavior, and mobile behavior. Prefer native HTML semantics first. Add ARIA only when it supplies a missing name, role, state, or relationship.

For data grids, choose deliberately between a native table and an ARIA grid. The WAI-ARIA Authoring Practices guide says a grid is a composite widget with one tab stop and author-managed arrow-key movement; it recommends arrow keys, Home/End, and explicit edit-mode conventions ([WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)). Do not add `role="grid"` to a static table just for styling.

## 4. Typography

Keep the existing product fonts. Define roles rather than one-off sizes: display/page title, section title, body, compact metadata, label, code, and numeric/data. Use a small scale with clear jumps, strong weight contrast, and enough line height for scanning. Keep UI labels short and specific; avoid all-caps for long labels.

Use `rem`-based sizes and test at 200% text zoom. WCAG 2.2 requires text to remain usable at 200% without loss of content or functionality ([WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)). Do not encode meaning in font weight or size alone; pair hierarchy with headings, labels, and structure.

For content that renders prose (descriptions, comments, documentation), use a dedicated typeset wrapper so font, leading, flow, tables, and dark mode remain consistent. shadcn/typeset documents this approach and supports compact and roomy presets ([shadcn/typeset](https://ui.shadcn.com/docs/typeset)).

## 5. Spacing, sizing, and density

Use a spacing scale based on a small unit (for example 4px) and semantic aliases such as `control`, `row`, `section`, and `page`. Use the compact preset for data rows, but do not shrink targets or text below a usable size. Establish row heights by content and interaction needs, not by visual density alone.

Recommended starting tokens (validate against existing Frame Desk screens):

| Role | Starting value | Use |
| --- | ---: | --- |
| Page gutter | 24px desktop / 16px small screens | Main frame inset |
| Control height | 36px standard / 32px compact | Buttons, inputs, selects |
| Row height | 44px standard / 36px compact | Lists and tables |
| Section gap | 24–32px | Major groups |
| Inline gap | 8–12px | Labels, icons, controls |
| Focus outline | 2px or more | Keyboard focus |

These are product starting points, not WCAG requirements. WCAG 2.2 Target Size (Minimum) requires pointer targets to be at least 24×24 CSS pixels or have qualifying spacing/equivalence exceptions ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). Keep icon buttons at or above that size even when their visual glyph is smaller.

## 6. Color and visual tokens

Define semantic tokens for background/foreground, surface/surface-foreground, muted, border, input, primary, secondary, accent, destructive, success, warning, info, focus, and selection. Do not place raw colors in feature components. shadcn recommends CSS variables and semantic background/foreground pairs; dark mode overrides the same tokens under `.dark` ([shadcn theming](https://ui.shadcn.com/docs/theming)).

Use color to reinforce—not carry alone—status. Add text, icons, patterns, labels, or shape. WCAG requires normal text contrast of at least 4.5:1, large text 3:1, and non-text controls/graphics 3:1 where applicable ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Check light and dark themes, disabled controls, selected rows, chart marks, placeholder text, and focus rings.

Prefer a restrained neutral foundation with one brand accent and a small status palette. Use OKLCH or another perceptual color space if supported by the current Tailwind setup, but validate the resulting contrast ratios; the color space does not remove the contrast requirement.

## 7. Interactions and behavior

Make the primary action obvious and keep destructive actions separated from frequent actions. Use optimistic updates only when failure can be recovered and the UI clearly reports the result. Preserve user input on errors. Confirm destructive or irreversible changes with an alert dialog that states what will change and offers a cancel path.

Use hover for preview, not for required information. WCAG's hover/focus guidance requires content revealed on hover or focus to be dismissible, hoverable, and persistent where applicable ([WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)). Tooltips should supplement a visible label, not name an unlabeled icon button by themselves.

Support pointer, touch, keyboard, and assistive technology. For drag-and-drop in boards or timelines, offer buttons or keyboard commands for move/reorder; WCAG 2.2 includes a Dragging Movements criterion ([WCAG 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)). If the product provides keyboard shortcuts, show them in help and allow users to disable or remap character-only shortcuts.

## 8. States and feedback

Specify states for each component and feature:

- **Default, hover, pressed, focus-visible, selected, expanded, checked, disabled.**
- **Loading:** preserve layout with skeletons or a progress indicator; do not block unrelated work.
- **Empty:** explain why it is empty and give one useful next action (create, clear filters, or invite).
- **No results:** show the query/filter context and a clear reset.
- **Error:** place the message near the failed action, identify how to recover, and keep the entered data.
- **Success:** provide immediate status and, for background work, durable activity/history.
- **Offline or stale:** distinguish cached data from current data and explain retry behavior.

Use `aria-live` sparingly for status changes that a screen reader user must know, such as save completion or a failed action. Do not announce every visual update. Dialogs must move focus into the dialog, trap it while open, close with Escape where appropriate, and return focus to the trigger; Radix primitives cover these details when used as intended ([Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)).

## 9. Responsive behavior

Design from content constraints, not device names. Use fluid widths, CSS grid/flex, media queries, and container queries. Container queries style a component from its own available width, which lets the same card or toolbar adapt inside different panels ([MDN container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)).

At narrow widths:

- Collapse the left navigation into a sheet/drawer with a visible trigger.
- Keep page title and the primary action available; move secondary actions into an overflow menu.
- Turn dense tables into a deliberate horizontal scroll region or a prioritized card/list view. Do not silently remove essential data.
- Convert multi-column filters into a filter sheet with a summary of active filters.
- Keep dialogs within the viewport and ensure focused controls are not hidden by sticky headers/footers.

Test at 320px CSS width, 400% zoom where feasible, touch input, landscape orientation, and keyboard-only use. WCAG 2.2 Reflow requires content to work at 320 CSS pixels without two-dimensional scrolling except for parts that inherently need two dimensions, such as complex data tables ([WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)).

## 10. Accessibility acceptance checklist

- Every route has a unique, descriptive title and one useful `h1`.
- Landmarks (`header`, `nav`, `main`, complementary areas) have clear names where more than one exists.
- All functionality works with keyboard only; no focus trap; focus order follows the visual/task order ([WCAG 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)).
- `:focus-visible` is distinct and remains visible; focused content is not hidden by authored overlays. WCAG 2.2 adds Focus Not Obscured criteria ([WCAG 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)).
- Interactive controls have accessible names, roles, states, and values; icon-only controls have a visible or screen-reader label.
- Status and errors do not rely on color alone and are announced when needed.
- Text, controls, icons, borders, selection, and focus meet contrast requirements in light and dark themes.
- Text survives 200% resize and layout survives narrow reflow.
- Motion honors `prefers-reduced-motion`; MDN notes this media feature reflects a user's reduced-motion preference and should reduce or replace non-essential motion ([MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)).
- Run automated checks (Next.js includes `eslint-plugin-jsx-a11y` by default) and manual checks with keyboard plus at least one screen reader ([Next.js accessibility](https://nextjs.org/docs/architecture/accessibility)).

## 11. Implementation notes for this stack

1. Keep the existing fonts and route/features. First add semantic tokens and shared shell primitives, then migrate pages by surface.
2. Use the existing shadcn components and Radix behavior. Keep component source in the repository so product-specific states remain easy to change ([shadcn introduction](https://ui.shadcn.com/docs)).
3. Put tokens in the global theme layer and use `bg-background`, `text-foreground`, and paired semantic tokens in components ([shadcn theming](https://ui.shadcn.com/docs/theming)).
4. Add a small state matrix to each feature document: trigger, visible result, loading, success, error, empty, disabled, keyboard path, and mobile path.
5. Treat the data-table/board surface as a separate accessibility project. Decide whether each surface is a table, list, or grid before adding keyboard behavior ([WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)).
6. Verify at each migration step with lint, type checks, unit tests, end-to-end keyboard flows, and screenshots at desktop and narrow widths.

## Sources

- [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [W3C Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [W3C WCAG 2.2 new success criteria](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [W3C WAI-ARIA Authoring Practices: patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [W3C WAI-ARIA Authoring Practices: grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [Radix Primitives accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Radix Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu)
- [shadcn/ui introduction](https://ui.shadcn.com/docs)
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming)
- [shadcn/typeset](https://ui.shadcn.com/docs/typeset)
- [Next.js accessibility architecture](https://nextjs.org/docs/architecture/accessibility)
- [React DOM components](https://react.dev/reference/react-dom/components)
- [MDN responsive design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [MDN CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)
- [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [MDN `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-color-scheme)


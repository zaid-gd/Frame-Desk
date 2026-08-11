# Workspace-page geometry and scroll ownership

Status: resolved  
Blocked by: 02 — App shell and navigation

## Goal

Apply one content rail, header, toolbar, section, pane, fill-height, and overflow contract to authenticated pages.

## Work

- Use existing `workspace-page` compositions and semantic variants.
- Define gutters, bounded panel scroll, sticky toolbar, split-pane separator, and mobile collapse.
- Add fixtures for index, master-detail, split, three-pane, and fill viewport.

## Acceptance

- No accidental nested scroll trap or obscured focus at tested widths.
- Every page has one useful h1 and approved layout variant.
- Keyboard alternative exists for resizable panes.
- Layout tests and build pass.

## Answer

Shared page primitives now own page gutters, headers, toolbars, sections, metrics, tables, empty states, pane gaps, and bounded scrolling. Layout tests and the build pass.

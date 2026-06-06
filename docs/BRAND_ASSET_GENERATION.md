# CutLab Brand Asset Generation

The raster empty-state illustrations were generated with the built-in image-generation tool. The six reference boards in `assets/` were used as art direction, with the illustration board as the primary visual reference.

## Shared Direction

- Premium 2D technical UI illustration
- Dark graphite forms with soft-white construction lines
- Teal used only for active paths, progress, and actions
- Geometric, workflow-led composition
- No text, people, third-party logos, purple, or generic clipart
- Generated on a flat magenta chroma background, then converted to transparent PNG locally

## Project Empty State

Centered project folder/window containing three stacked delivery timeline paths, a small circular plus control, and subtle registration-grid details.

## Feedback Empty State

Two overlapping review panels with restrained note lines, a three-path workflow mark, and one teal review indicator.

## Reports Empty State

Minimal analytics panel with a thin grid, soft-white progress curve, teal delivery curve, sparse data nodes, and a compact workflow mark.

## Team Empty State

Five outline collaborator avatars arranged around a central workflow hub with a small teal plus indicator and restrained connection arcs.

## Resources Empty State

Two offset asset cards, one folder-based and one link-based, connected by a single teal workflow path.

## Client Empty State

Three restrained profile nodes connect to one shared project folder, keeping client relationships readable without character illustration.

## Schedule Empty State

A calendar frame connects to a four-stage delivery timeline with one teal deadline marker.

## Library Empty State

A film frame and cloud folder form a compact asset handoff workflow with one teal add control.

## Post-Processing

1. Generated masters were copied from Codex image storage into a temporary workspace directory.
2. `remove_chroma_key.py` removed the flat background with a soft matte and despill.
3. Residual registration-color pixels were removed.
4. Isolated guide components were discarded.
5. Assets were cropped to alpha bounds and optimized as PNG.

The original generated masters remain in Codex image storage. Production files live under `public/brand/empty-states/`.

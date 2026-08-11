# Token contract and primitive states

Status: resolved  
Blocked by: none

## Goal

Reconcile existing tokens with the approved semantic palette, density, typography, focus, and state contract. Align owned shadcn/Radix primitives without changing feature data behavior.

## Work

- Define semantic light/dark/accent/status/selection/focus/disabled tokens.
- Keep Space Grotesk and the existing Geist Sans/Mono loading.
- Document and implement foundation, surface, work-surface, and feedback states.
- Check Button, Input, Badge, Dialog, Sheet, Menu, Tabs, Tooltip, Table, Skeleton, Toast, and Progress.

## Acceptance

- No raw feature color is needed for a common state.
- Primitive keyboard, focus, loading, error, disabled, and mobile behavior matches [components](../../../docs/design/system/components.md).
- Contrast passes for light and dark themes.
- Typecheck/build and primitive tests pass.

## Answer

The semantic token contract now covers both themes, density, focus, selection, status, disabled controls, overlays, motion, and owned component states. Typecheck and the production build pass.

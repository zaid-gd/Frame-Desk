# CutLab Studio Design System

The brand-kit images in `assets/` are the visual source of truth. Product code should consume the shared tokens and components rather than copying color or typography values into individual routes.

## Foundations

- Dark-first canvas: `#0C0F12`
- Primary surface: `#1A1F24`
- Primary text: `#E6E5E3`
- Action teal: `#2D8C97`
- Highlight cyan: `#69C4CE`
- Success: `#23B58E`
- Warning: `#F5A623`
- Error: `#FF5B5B`
- Display type: Space Grotesk, semibold or bold
- UI and body type: Inter, regular through semibold
- Spacing follows a 4px/8px rhythm
- Standard controls and panels use an 8px radius
- Borders are cool, low-contrast, and 1px
- Shadows are reserved for overlays and dialogs

The implementation source is [`src/app/design-system.ts`](../src/app/design-system.ts). Global MUI behavior is defined in [`src/app/theme.ts`](../src/app/theme.ts).

## Product Language

- Use teal for actions, active navigation, progress, and selected states.
- Use semantic colors only for status and feedback.
- Keep layouts structured, information-dense, and calm.
- Prefer flat bordered surfaces over nested elevated cards.
- Use outline-first, geometric icons with consistent visual weight.
- Use the CutLab workflow mark for product identity, not a generic video icon.
- Empty states use the shared workflow-line illustration and concise guidance.

## Navigation

The desktop sidebar contains only primary product hubs:

- Dashboard
- Projects
- Clients
- Library
- Reports
- Team
- Settings

Related destinations remain addressable routes but appear as contextual navigation inside their parent hub. This keeps deep links intact while reducing sidebar clutter.

## Shared Components

- `CutLabMark` and `CutLabLockup` provide the product identity.
- `cutlabPanelSx` provides the standard bordered surface.
- `cutlabOutlineButtonSx` provides the standard secondary action.
- `EmptyPanel`, `StatCard`, `StatusChip`, and MUI theme overrides provide consistent application primitives.

New routes should reuse these foundations before introducing route-specific styling.

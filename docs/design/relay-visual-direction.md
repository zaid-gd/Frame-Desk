# Relay visual direction

**Decision date:** 2026-08-15

**Status:** binding for the Relay rebuild

**Selected direction:** Sidebar Canvas

## Review inputs

The product owner reattached the current Dashboard and Projects screens before visual work began. They also supplied references from Notion, Cloudflare, Kairo, Staya, a split-detail task layout, and [shadcn-admin](https://github.com/satnaing/shadcn-admin).

The references set design tone, hierarchy, spacing, control placement, and information density. They do not define Relay's product layout or features.

## Directions reviewed

The supporting package contains exactly three Dashboard and Project-page directions:

1. **Command Canvas** — search-led navigation with broad, flat work sections.
2. **Production Desk** — a compact table-led view with visible record detail.
3. **Sidebar Canvas** — a unified dark shell around a warm light, card-based work canvas.

Each direction has separate desktop and tablet treatments in [the supporting visual package](../../.scratch/relay-rebuild/visual-directions/README.md). Light mode leads the review. The owner asked the team to defer dark renders, so the checked token treatments below define quiet dark mode for each direction.

- **Command Canvas:** espresso canvas, graphite command and work surfaces, off-white type, muted gray metadata, and light indigo links.
- **Production Desk:** espresso canvas, graphite tables and inspectors, low-contrast row dividers, off-white type, and light indigo selection marks.
- **Sidebar Canvas:** keep the unified espresso shell, then use an espresso canvas with graphite cards, off-white type, and light indigo actions.

## Binding selection

The product owner selected **Sidebar Canvas**. Ticket 03 and later Relay UI work must treat these points as binding unless the owner changes the decision:

- Join the near-black sidebar and top bar into one continuous application shell.
- Make the sidebar collapsible. Desktop starts expanded; tablet starts as a labelled icon rail. Keep a clear expand or collapse button available in both states.
- Use a warm ivory main canvas below the top bar.
- Give each distinct viewport block its own white, thin-bordered card. Keep table rows and list rows inside their parent card rather than making each row a card.
- Use 6–8 px radii, hairline borders, and little or no surface shadow.
- Keep controls compact. Put page actions at the upper right and use indigo only for the main action, active state, focus, or link.
- Use strong, quiet type with 14–16 px body text and a clear 28–32 px page title.
- Use text or an icon with every status colour. Colour alone must never carry meaning.
- Keep motion to short state transitions. Respect reduced-motion settings and avoid decorative entrance motion.
- Preserve Relay's existing routes and screen purposes. References do not add new product features.

## Theme contract

Light mode uses an ivory canvas (`#f6f4ef`), white cards (`#ffffff`), dark text (`#15130f`), muted text (`#5f5b54`), warm borders (`#dedbd3`), and indigo actions (`#4f46e5`). The unified shell uses espresso (`#15130f`) with white or muted light text.

Quiet dark mode keeps the same hierarchy across all three directions. It uses an espresso canvas (`#15130f`), graphite cards (`#211f1b`), borders (`#3a3731`), off-white primary text (`#f7f6f2`), muted text (`#c7c4bd`), and light indigo links (`#a5b4fc`). Dark mode must not add glow, gradients, or extra elevation.

## WCAG 2.2 AA contrast checks

All three directions share these semantic pairs. We calculated each ratio from relative luminance. Each pair clears the 4.5:1 threshold for normal text.

| Pair | Ratio |
| --- | ---: |
| Primary text `#15130f` on white `#ffffff` | 18.55:1 |
| Muted text `#5f5b54` on white `#ffffff` | 6.75:1 |
| Primary text `#15130f` on ivory `#f6f4ef` | 16.88:1 |
| White text `#ffffff` on espresso `#15130f` | 18.55:1 |
| Muted shell text `#c7c4bd` on espresso `#15130f` | 10.65:1 |
| Indigo `#4f46e5` on white `#ffffff` | 6.29:1 |
| White text `#ffffff` on indigo `#4f46e5` | 6.29:1 |
| Error text `#b42318` on white `#ffffff` | 6.57:1 |
| Success text `#067647` on white `#ffffff` | 5.69:1 |
| Warning text `#935f00` on white `#ffffff` | 5.42:1 |
| Dark primary text `#f7f6f2` on graphite `#211f1b` | 15.21:1 |
| Dark muted text `#c7c4bd` on graphite `#211f1b` | 9.45:1 |
| Dark indigo link `#a5b4fc` on graphite `#211f1b` | 8.25:1 |
| Dark error text `#fda29b` on graphite `#211f1b` | 8.47:1 |
| Dark success text `#75e0a7` on graphite `#211f1b` | 10.17:1 |
| Dark warning text `#fec84b` on graphite `#211f1b` | 10.64:1 |

The mockups use only named demo fixtures, abstract media, and initials. They contain no customer files, personal names, or face photos.

Ticket 03 must verify implemented tokens and rendered states again. These checks bind the visual target; they do not replace browser accessibility checks.

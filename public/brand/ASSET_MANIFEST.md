# CutLab Brand Assets

## Vector Masters

- `cutlab-mark.svg`: transparent workflow mark for product lockups.
- `app-icon-dark.svg`: primary dark app icon.
- `app-icon-light.svg`: light-surface app icon.

## Navigation Logo

- `logo/cutlab-studio.png`: supplied CutLab Studio wordmark, tightly cropped and converted to transparent PNG for sidebar and page-header use.
- `logo-mark.png`: supplied `assets/Logo mark.png`, used for the light-mode navigation logo.

## App Icon Exports

`icons/` contains dark and light PNG variants at 16, 24, 32, 64, 128, 192, 256, 512, and 1024 pixels.
All exports are generated directly from the supplied `assets/Favicon.png`. `favicon.png` is the normalized 1024px public master.

## Generated Empty States

- `empty-states/projects.png`
- `empty-states/clients.png`
- `empty-states/schedule.png`
- `empty-states/library.png`
- `empty-states/feedback.png`
- `empty-states/reports.png`
- `empty-states/team.png`
- `empty-states/resources.png`

These transparent PNGs were generated from the CutLab reference boards using the built-in image-generation workflow, then chroma-keyed, cleaned, cropped, and optimized locally.

Run `node scripts/generate-brand-assets.mjs` after editing the SVG masters to regenerate icon exports and the Open Graph image.

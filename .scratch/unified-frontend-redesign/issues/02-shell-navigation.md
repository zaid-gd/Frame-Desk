# App shell and navigation

Status: resolved  
Blocked by: 01 — Token contract and primitive states

## Goal

Unify desktop, tablet, and mobile shell navigation while preserving every current href, shortcut, command action, notification, account action, and sample marker.

## Work

- Apply sidebar, global bar, breadcrumbs/context, view switcher, and command search contract.
- Keep deep routes addressable while exposing a small primary hub list.
- Verify mobile sheet focus and route announcements.

## Acceptance

- All routes remain reachable by links and command search.
- Active state and selected context survive refresh and deep links.
- Keyboard and screen-reader navigation works; no generic ARIA menu for links.
- Desktop/mobile and reduced-motion checks pass.

## Answer

The shell now has grouped navigation, clear page context, command search, a true desktop collapse control, and the existing mobile navigation. Route, keyboard, mobile, and reduced-motion checks pass.

# Application Card Layout Correction Design

Date: 2026-07-14
Status: Approved in conversation

## Problem

The Rose Ledger styling introduced two application-card regressions:

1. `Edit Status` wraps because the application action group keeps its established `190px` two-column layout while the shared button style now uses a heavier label weight.
2. Mobile application cards explicitly color their horizontal scrollbar with Rose Ledger tokens, but this card-level scrollbar should use the browser and operating system default color.

## Design

Keep the application-card geometry and responsive structure unchanged.

- Prevent application-card action-button labels from wrapping. This is scoped to buttons inside the existing `.buttonGroup`; shared button typography and padding remain unchanged.
- Remove the mobile application card's explicit `scrollbar-color`, WebKit scrollbar track color, and WebKit scrollbar thumb color rules. The browser will paint its default scrollbar.
- Do not change the application board scrollbar because the request is specifically about horizontal scrolling inside an application card.

## Preserved behavior

- The action group remains `190px` wide with the existing two-column desktop and one-column mobile layouts.
- `Edit Status`, `Save Changes`, `Delete`, and `Archive` retain their existing handlers, variants, loading states, and visibility rules.
- The three notes layouts and the `804px`/`803px` boundaries remain unchanged.
- Mobile card overflow and details to actions to notes ordering remain unchanged.
- No component logic, backend, database, API, route, dependency, gradient, or shadow declaration changes.

## Verification

Add a design-contract regression assertion before changing production CSS. It must fail until:

- application-card action buttons are explicitly single-line; and
- application-card CSS contains none of the Rose Ledger scrollbar color declarations or WebKit track/thumb color selectors.

Then run the focused design contract and application-card tests, followed by formatting, lint, typecheck, the full test suite, build, and the existing forbidden-effect/scope guards. Responsive browser evidence should confirm the action labels stay single-line and the mobile application-card scrollbar is native without changing the three notes layouts.

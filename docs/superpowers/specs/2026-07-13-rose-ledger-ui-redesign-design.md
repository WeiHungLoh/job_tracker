# Rose Ledger UI Redesign Design

## Summary

Refresh the entire Job Tracker frontend with the approved **Rose Ledger** visual system while preserving every existing layout, behavior, route, state transition, API call, backend contract, and database contract.

The redesign is presentation-only. It evolves the existing rounded, pink-accented interface into a warmer editorial workspace with a paired **Porcelain Light** and **Warm Graphite Dark** theme. The work is token-first and CSS-first so that production and demo surfaces remain aligned automatically and behavioral regression risk stays low.

## Purpose and Audience

Job Tracker helps candidates manage applications, interviews, notes, archived records, and pipeline trends. The interface must remain efficient for repeated operational use while feeling more considered and cohesive.

The redesign should make the product feel:

-   calm and focused during frequent data-entry and review sessions;
-   visually distinctive without becoming decorative or distracting;
-   equally intentional in light and dark mode;
-   readable and touch-friendly across desktop, tablet, and mobile;
-   familiar to existing users because navigation and page geometry do not move.

## Approved Aesthetic Direction

### Rose Ledger

Rose Ledger uses warm paper-like surfaces, dark editorial ink, restrained rose accents, soft tonal layering, and compact status markers. It retains the existing Quicksand typeface to avoid font-metric layout shifts and network changes. Typography improvements come from weight, spacing, hierarchy, and contrast rather than a font replacement.

The memorable visual signature is a paired palette:

-   **Porcelain Light:** warm off-white page atmosphere, near-white cards, charcoal text, deep rose actions, and restrained soft shadows.
-   **Warm Graphite Dark:** warm charcoal page atmosphere, graphite cards, pale text, luminous rose actions, and low-glare shadows.

The interface may use subtle radial tonal gradients in page backgrounds, but it must not use purple gradients, glass-heavy effects, animated background decoration, or layout-breaking ornament.

### Core palette

The following values are the implementation targets:

| Role                | Porcelain Light | Warm Graphite Dark |
| ------------------- | --------------- | ------------------ |
| Page atmosphere     | `#f8f4f1`       | `#171517`          |
| Card surface        | `#fffdfb`       | `#211e22`          |
| Secondary surface   | `#f4eae9`       | `#2a252a`          |
| Primary text        | `#2b2529`       | `#f4edf0`          |
| Secondary text      | `#71666b`       | `#c1b4ba`          |
| Primary accent      | `#a81f4c`       | `#ff779b`          |
| Soft accent         | `#f8dfe7`       | `#452633`          |
| Filled-control text | `#ffffff`       | `#261019`          |

Filled-control foreground colors must be defined separately for each theme rather than assuming white text works on every accent. Existing status background colors remain unchanged so charts, Board columns, and status identity do not drift. Status chips gain status-specific foreground tokens; Offer and Upcoming use dark text in both themes, while every other pairing must pass the contrast audit against its existing background.

## Scope

The redesign covers the full client surface:

-   authenticated navbar and protected pages;
-   demo navbar and every demo page;
-   dashboard statistics, charts, legends, and upcoming interviews;
-   active and archived application List and Board views;
-   active and archived interview List and Board views;
-   application and interview forms;
-   activity controls, connected view selectors, dropdowns, checkboxes, toggles, and action menus;
-   authentication layout, sign-in, sign-up, product introduction, and preview carousel;
-   user guide;
-   empty, loading, skeleton, fallback, offline, toast, confirmation, and error states;
-   Material UI confirmation dialogs;
-   light- and dark-mode promotional carousel screenshots after the shipped UI is verified.

## Explicit Non-Goals

The implementation must not:

-   modify server code, database schema, SQL, API models, API routes, or request/response handling;
-   modify application logic, reducers, hooks, event handlers, routing, authentication, preferences, filtering, sorting, archiving, CSV export, calendar export, or drag-and-drop behavior;
-   add or remove controls, actions, fields, checkboxes, toggles, menu items, status values, or navigation links;
-   change copy or feature semantics;
-   introduce a new dependency, font package, design library, animation library, or runtime asset request;
-   restructure pages or replace the established responsive layouts;
-   change the order of product carousel slides or their theme-specific mapping.

## Implementation Architecture

### 1. Theme-token layer

`client/src/index.css` remains the visual source of truth. Existing light and dark tokens will be refined, and a small number of semantic tokens will be added for:

-   atmospheric page backgrounds;
-   card and elevated-surface shadows;
-   strong and subtle borders;
-   filled-control foregrounds;
-   per-status foregrounds;
-   hover/elevation states;
-   note surfaces and scrollbar cues.

Every new semantic token must be defined in both `[data-theme='light']` and `[data-theme='dark']`. Native browser controls will receive the matching `color-scheme`. The existing hard-coded WebKit autofill handling must remain valid in both themes.

The global width variables and layout constants in `:root` are frozen:

-   `--applicationBoardColumnWidth`;
-   `--widePageMaxWidth`;
-   `--wideNavbarMaxWidth`;
-   `--applicationListWidth`;
-   `--interviewListWidth`;
-   `--applicationBoardWidth`.

### 2. Shared-component layer

Shared CSS owners will consume the refined tokens before page-specific modules are touched. This keeps authenticated and demo surfaces in parity.

Primary shared owners include:

-   `client/src/components/navbar/Navbar.module.css`;
-   `client/src/components/button/PrimaryButton.module.css`;
-   `client/src/components/formPage/FormPage.module.css`;
-   `client/src/components/activityControls/ActivityControls.module.css`;
-   `client/src/components/activityControls/ControlDropdown.module.css`;
-   `client/src/components/activityControls/applicationViewToggle/ApplicationViewToggle.module.css`;
-   `client/src/components/activityControls/checkboxFilter/CheckboxFilter.module.css`;
-   `client/src/components/toggleButton/ToggleButton.module.css`;
-   `client/src/components/emptyState/EmptyState.module.css`;
-   loading, skeleton, toast, offline, and fallback CSS modules;
-   `client/src/components/theme/muiTheme.ts` for Material UI visual parity only.

React component markup and props remain unchanged. The only TypeScript change allowed is visual theme configuration in `muiTheme.ts`. No handler, state, effect, aria state, or DOM order may change.

### 3. Page-surface layer

Page CSS modules receive targeted color, border, radius, shadow, and typographic refinements after shared components are stable.

Primary page owners include:

-   dashboard card, statistics, chart, legend, and upcoming-interview modules;
-   `client/src/pages/application/ApplicationCard.module.css`;
-   `client/src/pages/application/applicationBoard/ApplicationBoard.module.css`;
-   active and archived application page modules;
-   `client/src/pages/interview/InterviewCard.module.css`;
-   interview grid and list-page modules;
-   authentication, auth layout, and product-introduction modules;
-   `client/src/pages/userGuide/UserGuide.module.css`.

Page work must not duplicate styles already owned by a shared component or token.

### 4. Promotional asset layer

The auth carousel images under `client/images/` are representations of the shipped product. After the redesigned UI passes behavioral and responsive verification, refresh the corresponding light and dark screenshots without changing:

-   import structure;
-   slide labels;
-   slide order;
-   route mapping;
-   light/dark selection behavior;
-   carousel, fullscreen, preload, and navigation logic.

## Locked Interaction and Layout Contracts

### Connected List and Board selector

`List | Board` remains one connected segmented control:

-   one shared outer border and radius;
-   no visual gap between List and Board;
-   the existing two buttons and `aria-pressed` states remain;
-   the active half receives the Rose Ledger selected fill;
-   focus-visible behavior remains inside the segmented boundary;
-   current dimensions and mobile centering remain.

It must not become two independent pills.

### Dropdown caret and placement behavior

Every activity dropdown retains the existing chevron icon:

-   down when closed;
-   rotated up when open;
-   reduced-motion handling retained;
-   current `aria-expanded`, focus restoration, Escape handling, outside-click dismissal, viewport-aware horizontal offset, open-above placement, maximum height, and z-index behavior retained.

Rose Ledger may change the chevron color, trigger surface, border, and shadow only.

### Checkboxes

All checkbox-filter behavior remains:

-   native checkbox inputs remain present;
-   Show All retains checked and indeterminate states;
-   option labels remain the full click targets;
-   focus-visible styling remains tied to the native input;
-   selection, rollback, persistence, and disabled behavior remain unchanged.

Only the visible checkbox surface, checkmark contrast, hover surface, and spacing polish may change.

### Toggle switches

All labeled toggle switches remain:

-   the whole row remains one `role='switch'` button;
-   `aria-checked` remains the state source;
-   track, thumb, checked movement, label, hover, active, focus, and reduced-motion behavior remain;
-   Show notes, Show archive, Auto scroll, and every other existing toggle remain present in their existing menus.

Only track/thumb colors, borders, shadows, and surrounding surface polish may change.

### Application notes: three responsive layouts

The three current List-view note layouts are frozen:

1. **Above 1422px:** the 300px notes textarea remains positioned to the right of the application card.
2. **804px through 1422px:** the application card continues to wrap and the notes area remains a full-width, 160px block below the application content.
3. **803px and below:** the application card remains horizontally scrollable with application details, actions, and notes revealed in sequence; notes remain the final horizontal panel.

The following declarations must not be removed or semantically altered:

-   the `804px–1422px` wrap breakpoint;
-   the `803px` mobile breakpoint;
-   horizontal overflow and touch scrolling;
-   absolute/static positioning changes for the notes textarea;
-   notes width and height relationships;
-   action-column placement;
-   active and archived behavior;
-   production and demo parity.

The redesign may change note colors, borders, radius, inset treatment, shadow, and scrollbar discoverability without changing geometry.

### Mobile activity-control layouts

The existing caller-selected `mobileLayout` behavior remains. In compact Board and empty-state modes, the connected view selector stays above the centered control row. Populated List mode retains its existing Display options placement. No shared CSS rewrite may override the proven caller-level layout selection.

### Dashboard

Preserve:

-   the 12-column grid and 8/4 section split;
-   the 1470px design proportions and wider-screen scaling;
-   mobile one-column behavior;
-   chart data, status colors, axes, tooltips, legends, click navigation, and stat-card flip behavior;
-   real and demo use of shared `DashboardContent`.

Rose Ledger changes only surface hierarchy, contrast, typography, border/shadow treatment, and non-layout motion polish.

### Application and interview Boards

Preserve:

-   horizontal overflow and scrollbar behavior;
-   grid-auto-flow columns and column width;
-   drag handles, DnD refs/listeners, auto-scroll, optimistic updates, and rollback;
-   card ordering, filtering, status movement restrictions, actions, notes, and loading skeleton geometry;
-   List-only versus Board-only behavior.

### Authentication and user guide

Preserve the auth focused-mode transforms, fixed-page handling, carousel dimensions, fullscreen behavior, focus restoration, keyboard navigation, theme-specific image selection, and demo CTA behavior. Preserve user-guide accordion structure, anchor behavior, sticky/header behavior, and mobile stacking.

## Visual Treatment by Component

### Navigation

Use a warm translucent-looking surface without relying on backdrop-filter for correctness. Strengthen active-route contrast, keep the brand mark recognizable, and use subtle elevation on utility controls. Do not make the navbar sticky or change its grid.

### Cards and panels

Unify flat List cards, dashboard cards, Board cards, auth cards, and guide panels through shared border/shadow relationships. Preserve their existing padding and dimensions. Use status-color accents as meaning, not decoration.

### Buttons and controls

Complete the shared button visual contract with consistent weight, line height, focus, disabled treatment, and hover elevation. Preserve every variant and size. Destructive filled buttons and destructive menu text keep separate contrast tokens.

### Forms

Retain current widths, margins, mobile typography hierarchy, actions, and field order. Improve label weight, focus rings, field surface depth, and select affordances. A select chevron may be added through CSS only; no select behavior or option structure changes.

### Status chips and badges

Move toward compact pill geometry while preserving text, status mapping, and layout footprint. Add status-specific foregrounds so color contrast is correct in both themes. Color never becomes the only status cue because the visible label remains.

### Motion

Use short CSS transitions for hover elevation, active fills, and caret rotation. Do not add page-load choreography or looping motion. Every new transition must be disabled under `prefers-reduced-motion`.

## Data Flow, Errors, and State

There is no new data flow. Existing state, context, reducer, API, preference, and routing paths remain the sole runtime sources of truth.

Error, loading, empty, pending, and offline states keep their current triggers and actions. The redesign only makes their visual hierarchy consistent with Rose Ledger. Loading controls must keep label geometry stable. Error and destructive colors must remain distinguishable from primary rose actions in both themes.

## Accessibility Requirements

-   Filled actions, badges, status chips, text, borders, and focus indicators must meet appropriate WCAG contrast against their actual surfaces.
-   Native inputs remain in the accessibility tree.
-   Existing roles, names, `aria-checked`, `aria-pressed`, `aria-expanded`, and indeterminate states remain.
-   Keyboard focus must stay visible on buttons, segmented controls, checkboxes, toggles, links, form fields, carousel controls, menus, and dialogs.
-   Existing touch target geometry must not shrink. Where a visible indicator is small, its existing clickable control area remains or is enlarged without moving the layout.
-   Reduced-motion behavior is preserved and extended to any newly transitioned visual property.
-   Light and dark themes receive equal verification, including native controls and WebKit autofill.

## Verification Strategy

### Automated baseline

The pre-change client baseline is:

-   38 test files passing;
-   369 tests passing;
-   ESLint passing;
-   only existing React Router v7 future-flag warnings in test stderr.

### Automated completion gate

Run from `client/`:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:ci
```

Run from the repository root:

```bash
git diff --check
git status --short --branch
```

Add a narrow CSS contract test for new paired-theme semantic tokens and the visual invariants that cannot be allowed to disappear accidentally. Existing behavior tests remain the primary guard for controls, routing, demo state, DnD, filters, sorting, notes, carousel behavior, and dashboard navigation.

### Manual browser matrix

Verify both Porcelain Light and Warm Graphite Dark across:

-   authenticated and demo surfaces;
-   populated List and Board views;
-   active and archived applications and interviews;
-   loading, skeleton, filtered-empty, true-empty, pending, error, offline, toast, and confirmation states;
-   open and closed dropdowns, including open-above and viewport-edge placement;
-   checked, unchecked, indeterminate, on, and off controls;
-   application notes at widths above 1422px, between 804px and 1422px, and at or below 803px;
-   representative widths of 1600px, 1470px, 1422px, 804px, 803px, 600px, 430px, 360px, and 320px;
-   keyboard navigation, visible focus, Escape close, theme switching, carousel fullscreen, Board drag/auto-scroll, and mobile horizontal note reveal.

## Acceptance Criteria

The redesign is complete only when:

1. Rose Ledger is visibly coherent across the entire frontend in both themes.
2. No backend, database, API, application-logic, routing, or behavioral file changes are present.
3. `List | Board` remains one connected segmented control.
4. Dropdown carets remain visible and rotate with open state.
5. Every existing checkbox, toggle, field, action, and menu item remains present and functional.
6. All three application-note responsive layouts match the existing geometry and behavior.
7. Dashboard, List/Board, DnD, demo, auth, carousel, and user-guide layout contracts remain intact.
8. Status and action contrast is improved in both themes.
9. Automated verification passes from a fresh run.
10. Manual responsive and interaction checks show no clipping, overlap, lost content, inaccessible controls, or unexpected reflow.

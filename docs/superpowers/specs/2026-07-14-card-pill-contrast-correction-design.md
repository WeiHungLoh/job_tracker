# Card Pill and Metadata Contrast Correction Design

Date: 2026-07-14
Status: Approved in conversation

## Problem

Future interview `Time left` pills and application upcoming-interview pills use dark text on orange, while the completed and in-progress pills use white text. The location green and interview-type purple are also visually too light in the light theme.

## Design

- Keep the upcoming pill background at `#f57c00` and set `--colorUpcomingBadgeText` to `#ffffff` in both themes. This keeps future interview timing pills and application upcoming-interview pills consistent with the white text used by completed and in-progress pills.
- Change only the light-theme `--colorLocationText` from `#1f756a` to `#0f5f55`. Application-card and interview-card locations intentionally share this darker green.
- Change only the light-theme `--colorInterviewType` from `#5e60ce` to `#4546a8`.
- Keep dark-theme location and interview-type tokens unchanged.

## Approved contrast exception

White text on the unchanged orange `#f57c00` has a 2.70:1 contrast ratio. This is below the existing 4.5:1 design-contract floor. The user explicitly approved exact white text while requiring the orange background to remain unchanged. The design contract must record this exact token choice without falsely asserting that this pair meets 4.5:1.

The darker light-theme metadata colors improve contrast against the light card background:

- `#0f5f55` location text on `#fffdfb`: 7.42:1.
- `#4546a8` interview-type text on `#fffdfb`: 7.68:1.

## Preserved behavior

- No component, timing, status, application, interview, backend, database, API, route, dependency, layout, breakpoint, gradient, or shadow changes.
- Completed and in-progress pill styles remain unchanged.
- All three application-notes layouts remain unchanged.
- The application-card single-line action and native-scrollbar correction remains intact.

## Verification

Update the visual contract first and observe it fail against the old tokens. Then change only `client/src/index.css`, run the design contract, relevant application/interview component tests, the full static/test/build gate, and the existing scope/effect guards.

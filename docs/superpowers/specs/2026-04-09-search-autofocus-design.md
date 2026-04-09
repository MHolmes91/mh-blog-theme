# Search Autofocus Design

## Problem

The search modal opens without placing focus in the search input, which adds an extra click before typing.

## Requirements

1. Opening the search modal should always focus the search input.
2. This should happen every time the modal opens, not only on the first page load.
3. Existing search behavior should remain unchanged.

## Design

Use programmatic focus from the existing `openSearch()` flow.

- Add an Alpine ref to the search input in `layouts/_partials/header.html`.
- In `assets/js/app.js`, call focus on that ref inside `$nextTick` from `openSearch()` so the input is focused after the modal becomes visible.
- Do not rely on the native `autofocus` attribute because the modal uses `x-show`, so the input stays in the DOM between openings.

## Files Changed

- `layouts/_partials/header.html` - add an Alpine ref to the search input
- `assets/js/app.js` - focus the search input on modal open
- `tests/e2e/theme.spec.js` - add regression coverage for autofocus on open

## Testing

- E2E test that opens search and asserts the search input is focused

## Out Of Scope

- Selecting existing query text on focus
- Changing close behavior
- Changing keyboard navigation behavior

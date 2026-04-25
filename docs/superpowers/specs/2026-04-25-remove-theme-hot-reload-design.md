# Remove Theme Hot Reload Design

## Goal

Theme selection should be based on the user's browser color-scheme preference at page load. If the browser preference changes while the page is open, the page should not update live; the user can refresh or navigate to get the new theme.

## User-Facing Behavior

- Initial page load still sets the theme from `prefers-color-scheme`.
- Stored `localStorage.theme` values remain ignored.
- Changing the browser color-scheme preference while a page is open no longer changes `body[data-theme]`.
- Refreshing or navigating loads the current browser preference and applies the corresponding theme.
- Mermaid diagrams render once with the initial page theme and no longer rerender during an open-page theme change.

## Architecture

`assets/js/app.js` keeps the existing initial `theme` state calculation with `resolveTheme({ systemPrefersDark })`. The `init()` method will no longer create a `matchMedia` query listener, define a live sync callback, dispatch `themeChanged`, or subscribe to color-scheme changes.

`layouts/_partials/features/mermaid.html` will keep waiting for the initial `body[data-theme]` before rendering. It will remove the `window.addEventListener("themeChanged", ...)` rerender path because no runtime theme-change event should exist.

Tests will be updated to reflect page-load-only behavior. The current e2e test that expects live palette updates will instead assert that changing emulated color-scheme after load does not update `body[data-theme]`, and that reloading applies the new preference. The Mermaid unit test will assert that no `themeChanged` event listener is registered.

## Data Flow

1. Browser loads a page.
2. Alpine initializes `siteUi.theme` from the current `prefers-color-scheme` match result.
3. Hugo's body binding applies `data-theme` from the initial Alpine state.
4. Mermaid waits for `data-theme`, renders diagrams once, and stops.
5. Later browser preference changes do nothing until the page is refreshed or navigated.

## Edge Cases

- JavaScript-disabled pages still rely on CSS `@media (prefers-color-scheme: dark)` behavior as they do today.
- Pages without Mermaid are unaffected.
- Pages with Mermaid diagrams keep using the theme that existed when the diagrams first rendered.
- Existing tests for initial dark preference and ignored stored theme values remain valid.

## Testing

- Update e2e coverage to assert theme preference changes do not hot-update an already loaded page.
- Keep or adjust e2e coverage proving a fresh load uses the browser's dark preference.
- Update Mermaid unit coverage to assert no `themeChanged` event listener remains.
- Run the full unit suite, e2e suite, and build after implementation.

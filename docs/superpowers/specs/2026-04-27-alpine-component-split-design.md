# Alpine Component Split Design

## Goal

Move feature behavior out of `assets/js/app.js` by splitting the current monolithic Alpine `siteUi` component into smaller components that match template regions and responsibilities.

The refactor must preserve current behavior for search, header hiding, reading progress, table of contents state, active TOC highlighting, back-to-top visibility, and theme setup.

## Current Context

`assets/js/app.js` currently registers one Alpine component, `siteUi`, on the `<body>`. That component owns unrelated state and behavior:

- Theme resolution.
- Search overlay state, result loading, result highlighting, keyboard navigation, and highlighted post URLs.
- Post-only scroll behavior: reading progress, header auto-hide, back-to-top button visibility, and dock footer offset.
- TOC state and active-heading tracking.
- Shared helpers such as toolbar hide timers and result scrolling.

Pure helper modules already exist under `assets/js/lib/` for search, reading progress, TOC selection, and theme resolution. Those helpers should remain focused and independently testable.

## Chosen Approach

Split Alpine behavior by DOM region instead of keeping one global root component. The templates already define clear UI regions, so each region should own its own state and event listeners.

`assets/js/app.js` should become a small boot file that imports Alpine, registers component factories, exposes `window.Alpine`, and starts Alpine.

Create component modules under `assets/js/components/`:

- `site-shell.js`: owns site-level state such as theme resolution and whether search is open for `main` accessibility state.
- `search-ui.js`: owns search query state, search records, overlay open/close, result navigation, highlighted URLs, and body-match highlighting.
- `header-chrome.js`: owns post-only header auto-hide behavior and focus/search visibility rules.
- `post-progress.js`: owns post reading progress updates.
- `back-to-top-dock.js`: owns post-only back-to-top visibility, dock footer offset, and back-to-top scrolling.
- `toc-ui.js`: owns TOC open/close state and active heading updates.

Keep existing pure helpers under `assets/js/lib/`:

- `search.js`: search filtering, loading, ranking, snippets, highlighting, and highlighted URL construction.
- `progress.js`: reading progress calculation.
- `toc.js`: active heading selection.
- `theme.js`: theme resolution.

## Template Boundaries

Update templates so Alpine state is attached near the markup that consumes it:

- `layouts/baseof.html`: use `x-data="siteShell()"` on `<body>` for theme and `main` `aria-hidden` state.
- `layouts/_partials/header.html`: attach `x-data="headerChrome()"` to the header because the header owns the opacity class. Attach `x-data="searchUi('{{ "index.json" | relURL }}')"` to the search control/overlay wrapper inside the header.
- `layouts/single.html`: attach `x-data="postProgress()"` to the post article or an adjacent post-only wrapper so reading progress updates stay local to post pages.
- `layouts/_partials/dock.html`: remain post-only and attach `x-data="backToTopDock()"` to the dock root.
- `layouts/_partials/toc.html`: attach `x-data="tocUi()"` to the TOC region so mobile open state and active entry tracking are local.

Each component should be independently understandable and should not require parent component state beyond normal DOM events.

## Cross-Component Communication

Use browser events for the small amount of coordination between independent components:

- `search-ui` dispatches `search:open` and `search:close` on `window`.
- `site-shell` listens for those events so `<main>` keeps the current `aria-hidden` behavior while search is open.
- `header-chrome` listens for those events so the header remains visible while search is open and restores/hides consistently after search closes.

Do not use a shared global Alpine store unless browser events prove insufficient. The goal is local ownership, not moving the monolith into a store.

## Behavior Requirements

- Search behavior remains unchanged: overlay opens, input focuses, records load lazily, arrow keys cycle results, Enter navigates, close restores expected header visibility, and highlighted body matches scroll into view.
- Header auto-hide remains post-only. Non-post pages never hide the header after scroll inactivity.
- Back-to-top remains post-only. It never appears on home, posts list, series, tags, or archive pages.
- Reading progress continues to update on post pages.
- Desktop and mobile TOC active heading behavior remains unchanged.
- Mobile TOC open/close behavior remains unchanged.
- Theme resolution remains unchanged.

## Testing

Use the existing e2e suite as the primary safety net because the refactor changes Alpine component boundaries and template wiring. The implementation should run targeted tests after each component split, then the full e2e and unit suites at the end.

Add unit tests only if new pure helpers are extracted. Do not unit test Alpine internals directly unless a behavior cannot be covered through existing e2e tests.

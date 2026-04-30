# Search Result Visual Refinements Design

## Goal

Improve search result interaction and metadata styling while moving search-result visual rules out of Alpine class strings and into CSS.

## Current Context

Search result markup lives in `layouts/_partials/header.html`. Alpine currently chooses full Tailwind class strings for active result cards and metadata items. Search-specific CSS already exists in `assets/css/app.css` for result list sizing, card background, active card background, title truncation, metadata overflow, and excerpt clamping.

The search overlay already uses `@click.self="closeSearch"`, but the overlay should be explicitly full viewport so any backdrop click outside the dialog registers as a self-click.

## Approach

Keep Alpine responsible for state only: active result index, item kind, and whether metadata matched. Move visual details into CSS classes:

- Result cards keep a base `.search-result-card` class and use `.search-result-card-active` only for keyboard-selected active state.
- Hover and keyboard focus brighten the result card background through CSS.
- Metadata items use semantic classes such as `.search-result-meta-item`, `.search-result-meta-series`, `.search-result-meta-tag`, and matched variants.
- Series metadata uses `var(--color-muted)` when not matched and `var(--color-accent)` when matched, matching the mark background color.
- Series metadata gets extra right spacing before tags.
- The metadata row gets more vertical margin than the current `mt-1`.

## Behavior Requirements

- Hovering or focusing a search result card visibly brightens its background.
- Clicking anywhere on the overlay backdrop outside the dialog closes search.
- The overlay covers the full viewport.
- Non-highlighted series metadata uses `--color-muted`.
- Highlighted series metadata uses the same color as the `mark` background, `--color-accent`.
- Series metadata has additional right spacing before tag chips.
- The series/tags row has more vertical spacing from surrounding result text.
- Existing search navigation, result highlighting, keyboard selection, and overlay close behavior remain unchanged.

## Testing

Use Playwright coverage for overlay backdrop closing, card hover/focus background changes, metadata spacing/color, and existing search behavior. Existing unit tests for search helpers should continue to pass because helper behavior is unchanged.

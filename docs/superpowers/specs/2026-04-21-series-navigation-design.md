# Series Navigation Design

## Goal

Add previous/next navigation cards at bottom of series posts only. Cards should follow `hugo-narrow` post navigation as visual inspiration, but integrate with this theme's current Hugo templates and Tailwind classes.

## Scope

- Add navigation only on posts that belong to at least one `series` term.
- Render navigation directly under post content.
- Keep two visible cards at all times.
- When current post is first or last in series, show disabled placeholder card with `No Previous` or `No Next`.
- Support optional `series_order` front matter to override date-based ordering.
- Use post date as fallback ordering when `series_order` is not present.

## Out Of Scope

- Generic previous/next navigation for non-series posts.
- Changes to series listing UI in post header.
- Localization changes beyond exact English labels requested.

## Approach

Create a dedicated partial at `layouts/_partials/series-navigation.html` and render it from `layouts/single.html` below `.Content`.

This keeps series-specific logic isolated from the main single-post template and avoids changing generic navigation behavior for non-series posts.

## Data Model And Ordering

For current post:

1. Read `.GetTerms "series"`.
2. If no series terms exist, render nothing.
3. Use first series term as source for sibling posts.
4. Build ordered page list from that term's pages.

Ordering rules:

1. If a page has `series_order`, use it as primary ordering value.
2. If `series_order` is missing, use page date.
3. Use title or permalink as deterministic tie-breaker so output remains stable.

Practical intent:

- Series can work immediately from dates alone.
- Authors can add `series_order` later when chronology should not match publication date.

## Navigation Resolution

After ordering sibling pages:

1. Find current page index.
2. Previous card links to item before current page.
3. Next card links to item after current page.
4. If neighbor does not exist, render non-link placeholder card.

## UI Structure

Render one `<nav>` with two child cards in a 2-column layout.

Previous card content:

- First row: `(< icon) Previous`
- Second row: post title
- Third row: `(calendar icon) Date`

Next card content:

- First row: `Next (> icon)`
- Second row: post title
- Third row: `Date (calendar icon)`

Icon placement must mirror label alignment:

- Previous card keeps chevron and calendar icons on left side of row content.
- Next card keeps chevron and calendar icons on right side of row content.

Missing-state cards:

- Left card shows `No Previous` with left chevron placement.
- Right card shows `No Next` with right chevron placement.
- Missing-state cards keep same dimensions and shell styling but are not links.

## Styling

Follow current theme conventions:

- Tailwind utility classes in template
- Rounded border card treatment
- Hover and focus styles only on linked cards
- Muted metadata text
- Title clamped to avoid uneven card growth

Responsive behavior:

- Desktop: two equal-width cards
- Small screens: stack cards vertically for readability while preserving left/right internal alignment

## Template Changes

### `layouts/single.html`

- Insert `{{ partial "series-navigation.html" . }}` directly below post content and above any later sections.

### `layouts/_partials/series-navigation.html`

- New partial with series lookup, ordering, current-index resolution, and card rendering.

### `layouts/_partials/icon.html`

- Add `chevron-left` icon.
- Add `calendar` icon.

## Content Expectations

Fixture posts already have shared `series` front matter. Optional future examples may add `series_order` to validate override behavior.

## Testing

Verify:

1. Non-series post renders no navigation.
2. Middle series post shows working previous and next links.
3. First series post shows `No Previous` and valid next link.
4. Last series post shows valid previous link and `No Next`.
5. `series_order` changes navigation order when present.
6. Previous card and next card keep requested opposite icon placement for label and date rows.
7. Layout looks correct on desktop and mobile widths.

## Risks

- Hugo page sorting can become awkward when mixing numeric and date fallbacks in one ordered list.
- Multi-series posts may be ambiguous because current design uses first series term as source.

## Decision Notes

- Use dedicated partial instead of extending generic navigation.
- Keep missing cards visible instead of collapsing grid.
- Prefer date-first usability with optional explicit override via `series_order`.

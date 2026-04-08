# Search Enhancements Design

## Problem

Search results only show post titles with no context about where or why a match occurred. There is no keyboard navigation, no close icon, and no way to quickly jump to a result.

## Requirements

1. Results highlight the matched text with 120 characters of surrounding context (trimmed to word boundaries)
2. Context extraction varies by match field (tag, title, heading, content)
3. All occurrences of the query are highlighted in titles, tags, and context text
4. Results are ordered by match priority: title, then tag/series, then content/heading
5. Hitting Enter navigates to the first result
6. Arrow keys navigate between results
7. Escape closes search (already exists)
8. Close icon (x) on the search dialog

## Design

### Match Priority (for ordering)

Records are ranked by their highest-priority match field. Within each priority group, results are sorted alphabetically by title.

| Priority | Match Field | Rank |
|----------|-------------|------|
| 1 (highest) | Title | `0` |
| 2 | Tag or Series | `1` |
| 3 (lowest) | Content or Heading | `2` |

A record matching in multiple fields receives the rank of its best match.

### Highlighting

A `highlightText(text, query)` function wraps every occurrence of the query (case-insensitive) in `<mark>` tags. Applied to:

- Post title
- Tag/series labels shown in the result
- Context snippet text

Original casing is preserved. Uses `String.replaceAll()` with a case-insensitive RegExp.

### Context Extraction

A `extractContext(record, query)` function determines which field matched and returns the appropriate context snippet. Checked in priority order (first match wins for context, but ranking uses the best match):

1. **Tag/Series match** — Show the matching tag/series name highlighted + first 120 characters of `content` as plain context
2. **Title match** — First 120 characters of `content` as context (title is already shown highlighted above)
3. **Heading match** — The heading text highlighted + first 120 characters of content appearing after that heading
4. **Content match** — ~120 characters centered on the match (60 chars each side), trimmed to word boundaries. If the match is near the start/end of the content, it starts from the beginning or ends at the match position plus remaining chars.

Returns `{ field, contextText }` where `contextText` is a plain string. Highlighting is applied separately in the template.

### Result Display

Each result card in the search dialog shows:

- **Post title** — always displayed, always a link, with query highlighted
- **Match indicators** — if matched on tags/series, show those labels with query highlighted
- **Context line** — the extracted context snippet with query highlighted

Layout is a vertical stack within the existing bordered card (`rounded border border-purple-200 px-3 py-2`).

### Keyboard Navigation

- **Enter** — Navigate to the first result's permalink (same as clicking it)
- **ArrowDown** — Move active selection to next result (wraps to top)
- **ArrowUp** — Move active selection to previous result (wraps to bottom)
- **Escape** — Close search modal (already exists)

Alpine state additions:
- `activeResultIndex` (number, `-1` = no active selection)
- `activeResult` computed getter (returns `results[activeResultIndex]` or null)
- `selectNextResult()` — increment index with wrap-around
- `selectPrevResult()` — decrement index with wrap-around
- `navigateToActiveResult()` — navigate to `activeResult.permalink` if set, otherwise first result

The active result gets a distinct visual treatment (highlighted background or border ring).

### Close Icon

Replace the current "Close" text button with an `x` icon (SVG already exists in `icon.html`). Same visual style as the TOC close button.

### Scrolling

If there are many results, arrow navigation should scroll the active result into view within the results container. Use `scrollIntoView({ block: 'nearest' })`.

## Files Changed

- `assets/js/lib/search.js` — Add `highlightText()`, `extractContext()`, `rankRecord()` functions. Update `filterSearchRecords()` to return enriched results with rank and context.
- `assets/js/app.js` — Add `activeResultIndex`, keyboard event handlers (`@keydown.enter`, `@keydown.arrow-down`, `@keydown.arrow-up`), selection methods.
- `layouts/_partials/header.html` — Update results template to render context with highlights, active state styling, x icon for close button.
- `assets/css/app.css` — Add `<mark>` / `.highlight` styling and active result styling.
- `tests/unit/search.test.js` — Add tests for `highlightText()`, `extractContext()`, `rankRecord()`, result ordering.
- `tests/e2e/theme.spec.js` — Add tests for Enter navigation, arrow key navigation, context display, highlight rendering, close icon.

## Out of Scope

- `/` or `Cmd+K` keyboard shortcut to open search
- Focus trapping within the modal
- Search index format changes
- Fuzzy matching or search libraries (Fuse, Lunr, etc.)

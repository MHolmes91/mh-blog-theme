# Search Metadata And Summary Design

## Problem

The current search behavior still carries heading-specific logic that no longer matches the desired results model. Search results should prioritize summary matches over content matches, always show complete metadata, and stop exposing heading-derived formatting and matching. The flattened search content also still includes trailing `#` characters from heading links.

## Requirements

1. Search ranking must follow this hierarchy: title, series/tags, summary, content.
2. Search snippet/context selection must follow the same hierarchy.
3. If the match is on `summary`, the summary must be shown in the result snippet instead of content.
4. Search results must always show all available series and all available tags.
5. Matching series/tag items must be emphasized as whole items, not with inline `<mark>`.
6. Matching series/tag items must sort before non-matching items in the metadata row.
7. The metadata row must remain exactly one row tall.
8. Heading parsing must be removed from `layouts/index.json`.
9. Heading-specific formatting and heading-specific search tests must be removed.
10. The `content` emitted by `layouts/index.json` must strip the trailing `#` generated for heading links.

## Design

### Search Data

The search index should stop emitting a `headings` field. Searchable data becomes:

- `title`
- `series`
- `tags`
- `summary`
- `content`

`layouts/index.json` should continue to emit plain-text `summary` and `content`, but the emitted `content` must additionally strip the trailing `#` characters produced by linked headings so those artifacts do not appear in search matching or snippets.

### Ranking And Snippet Selection

Search ranking should use these numeric priorities:

- `0`: title
- `1`: series or tags
- `2`: summary
- `3`: content

Snippet selection should mirror that priority:

- title/tag/series match: use the opening summary when available, otherwise the opening content
- summary match: use summary as the snippet
- content match: use the current nearby-content extraction behavior

Because heading-specific search behavior is being removed, the search utility no longer needs heading normalization, heading snippets, or heading-specific snippet metadata. The result shape can be simplified to plain text context again.

### Metadata Row Rendering

Each result must always render all series and all tags in the metadata row.

Ordering rules:

- matching series first
- matching tags next
- remaining series after that
- remaining tags last

Within each bucket, preserve the original order from the record.

Styling rules:

- matching metadata items receive whole-item emphasis
- non-matching items keep their normal styling
- the metadata row remains exactly one line tall, even when content is clipped

This keeps results visually consistent while still making query-relevant metadata easy to spot.

### Files Changed

- `layouts/index.json` - remove heading extraction and sanitize emitted content
- `assets/js/lib/search.js` - remove heading-specific logic, add summary ranking/snippet behavior, and support full metadata ordering
- `layouts/_partials/header.html` - render full series/tag metadata, sort matching items first, keep the row to one line, and remove heading-prefix rendering
- `tests/unit/search.test.js` - remove heading-specific tests and add summary/metadata-ordering coverage
- `tests/e2e/theme.spec.js` - remove heading-prefix search coverage and add summary/metadata rendering coverage

## Testing

- Unit tests for rank ordering across title, metadata, summary, and content
- Unit tests for snippet selection preferring summary over content when applicable
- Unit tests for metadata ordering and matching emphasis helpers
- Unit test for `layouts/index.json` behavior that confirms heading extraction is gone and `content` is sanitized
- E2E tests that verify all series/tags are shown, matching metadata items are ordered first, the metadata row stays one line tall, and summary matches appear in the snippet

## Out Of Scope

- Changes to the 3-character minimum query behavior
- Changes to keyboard navigation or modal open/close behavior
- Search library replacement or fuzzy matching

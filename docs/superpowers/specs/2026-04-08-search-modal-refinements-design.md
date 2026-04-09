# Search Modal Refinements Design

## Problem

The search modal now has richer results, but its behavior and layout still feel loose. The sticky header can fade away while search is open, result cards vary in height, the modal height does not align cleanly to three visible entries, heading snippets are not formatted distinctly, and encoded entities can surface as literal HTML encodings instead of readable characters.

## Requirements

1. The sticky header must remain visible while search is open.
2. The search modal must remain closable by `Escape` and by clicking outside the panel.
3. The close control must be a small bordered keycap-style `ESC` label.
4. Each search result must have a fixed internal height: one title line, one metadata row, and two lines of excerpt text.
5. The results area must fit exactly three result cards at maximum, while shrinking naturally for one or two results.
6. For queries shorter than three characters, the modal should keep the current compact empty state and show the helper text.
7. For queries of three or more characters with no matches, the modal must show a `No results` message.
8. Heading matches in excerpts must render the heading as a bold inline prefix.
9. Heading text shown in search results must strip markdown heading prefixes and any trailing anchor-style `#` marker.
10. Search result text must render decoded characters instead of visible HTML entities such as `&quot;`.

## Design

### Interaction Model

The search experience stays as a full-screen overlay modal. This preserves the current interaction model and avoids reworking header structure or introducing a dropdown-style search surface.

The header auto-hide behavior must be suspended while `searchOpen` is true. When search is open, the header stays visible and interactive above the dimmed overlay. When search closes, the existing toolbar visibility behavior resumes.

The modal continues to close when the user:

- presses `Escape`
- clicks on the overlay outside the search panel
- activates the close control

The close control becomes a compact bordered keycap-style `ESC` button instead of the current icon button.

### Result Card Layout

Each result card must render with a fixed structure so all visible entries are the same height.

Card structure:

- **Title row**: exactly one line, truncated with ellipsis if needed
- **Metadata row**: exactly one row, reserved even when empty
- **Excerpt row**: exactly two lines, clamped

This should be implemented as a fixed-height card with internal row sizing rather than allowing individual content blocks to grow naturally. The metadata row continues to show series first as underlined text, then tags as purple chips.

### Modal Height Behavior

The modal height should be driven by content instead of using a loose max-height that only approximates three entries.

Behavior by state:

- **Query length 0**: panel shows the input row only
- **Query length 1-2**: panel shows the input row plus the existing helper text (`Type at least 3 characters to search`)
- **Query length 3+ with 0 results**: panel shows the input row plus a `No results` message
- **Query length 3+ with 1-2 results**: panel shrinks to fit the input row and those cards
- **Query length 3+ with 3 or more results**: panel shows exactly three visible cards and scrolls beyond that

The results container should therefore use a max-height based on the precise height of three cards plus the gaps between them, while the wrapper panel itself remains auto-height.

### Heading Snippet Rendering

When a result matches a heading, the excerpt should render as a single two-line block with the heading shown as a bold inline prefix followed by the contextual excerpt text.

Example shape:

`Heading Title` in bold, then normal excerpt text after it.

Heading normalization rules:

- strip markdown heading prefixes such as `##`
- strip trailing whitespace
- strip a trailing anchor-style `#` marker when present at the end of the heading text

This avoids displaying the linked-heading suffix the user sees in post content while preserving the readable heading label.

### HTML Entity Decoding

Search result text should display human-readable characters rather than encoded HTML entities.

Use the third-party `entities` npm package for decoding.

Why `entities`:

- modern ESM package with explicit exports
- actively maintained
- focused decode API for HTML content
- good fit for the repo's browser-bundled JavaScript

Decoding flow:

1. Decode indexed strings before snippet formatting and highlighting.
2. Build the title and excerpt output from decoded text.
3. Escape rendered text before inserting markup so highlight rendering remains safe.

This preserves readable punctuation like quotes and apostrophes while keeping `x-html` output safe.

### Search Data Shape

The current flat `_context` string is not expressive enough for heading-specific formatting. Context extraction should return structured snippet data so the template can render heading and non-heading matches differently without guessing from a plain string.

Result enrichment should include:

- `_snippetKind`: one of `heading` or `text`
- `_heading`: normalized heading text for heading matches, otherwise empty
- `_context`: excerpt text without the heading prefix for heading matches, or the normal snippet text for all other matches

This lets the template render:

- heading prefix in `<strong>` when `_snippetKind === 'heading'`
- normal highlighted excerpt text for all other cases

### Files Changed

- `package.json` and `package-lock.json` - add the `entities` dependency
- `assets/js/lib/search.js` - decode HTML entities, normalize headings, and return structured snippet metadata
- `assets/js/app.js` - keep the header visible while search is open
- `layouts/_partials/header.html` - update modal sizing, empty states, `ESC` close control, fixed-height result cards, and heading prefix rendering
- `assets/css/app.css` - add any styles needed for the `ESC` keycap, fixed card layout, and supporting states
- `tests/unit/search.test.js` - add coverage for entity decoding, heading normalization, and structured snippet output
- `tests/e2e/theme.spec.js` - add coverage for outside-click close, `Escape` close, no-results messaging, and refined layout behavior

## Testing

- Unit tests for entity decoding and heading normalization in the search utilities
- Unit tests for structured snippet output for heading and non-heading matches
- E2E tests for modal closing behavior (`Escape`, outside click)
- E2E tests for short-query helper text and `No results` messaging
- E2E tests for fixed-height result rendering and the three-visible-results cap

## Out Of Scope

- Replacing the modal with a dropdown or header-attached panel
- New keyboard shortcuts to open search
- Fuzzy matching or search library replacement
- Search index schema changes beyond what is needed for snippet formatting

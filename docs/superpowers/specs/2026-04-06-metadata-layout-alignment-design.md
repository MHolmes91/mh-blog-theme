# Metadata Layout Alignment Design

## Goal

Refine the shared metadata layout so taxonomy links have a stronger visual structure across both list rows and single-post headers.

- On wide layouts, taxonomy content should sit on the right side of the container.
- Series should appear above tags in that right-side block.
- The top of the right-side taxonomy block should align with the top of the title area.
- If there is not enough horizontal room, taxonomy should wrap below the left-side content and show series and tags side-by-side on that lower row.

## Scope

This change applies to the shared metadata presentation used by:

- post rows
- single-post headers

The taxonomy rendering rules remain the same:

- series are obvious text links
- tags are chip links
- list surfaces keep independent, non-nested links for post and taxonomy navigation

## Current Problem

The current split between `post-meta.html` and `post-taxonomy.html` is functionally correct, but the layout is still vertically stacked in a simple flow. It does not yet create a distinct right-side taxonomy column or the fallback wrapped layout the user wants.

## Chosen Approach

Add a shared layout wrapper partial that composes `post-meta.html` and `post-taxonomy.html` without changing their responsibilities.

- `post-meta.html` remains responsible only for date and reading time.
- `post-taxonomy.html` remains responsible only for series and tags.
- A new shared wrapper partial owns responsive positioning and alignment.

This keeps content responsibilities clean while making the layout consistent between row surfaces and single-post headers.

## Layout Design

### Wide Layout

On layouts with enough horizontal space:

- the title remains at the upper left of the content block
- the metadata block stays on the left below the title/summary content it belongs to
- the taxonomy block sits on the right side of the same overall container
- the taxonomy block is top-aligned so its top edge lines up with the top of the title area
- inside the taxonomy block, series render above tags
- both series and tags align to the right edge of the container

### Wrapped Layout

When the container does not have enough width to preserve that two-column arrangement:

- the taxonomy block moves below the left-side content
- the lower taxonomy row shows series and tags side-by-side
- the post link and taxonomy links remain separate interactive regions

### Alignment Rule

The important alignment contract is:

- when taxonomy is right-aligned in its own column, it aligns to the top of the title region, not to the top of the date/reading-time row

That keeps the right-side taxonomy visually anchored to the headline rather than to the smaller metadata line.

## Affected Templates

Expected template changes are limited to the shared metadata layout layer and its callers.

At minimum, inspect and update as needed:

- `layouts/_partials/post-meta.html`
- `layouts/_partials/post-taxonomy.html`
- new shared wrapper partial for composed metadata layout
- `layouts/_partials/post-row.html`
- `layouts/single.html`

## Testing Strategy

Follow TDD for the layout refinement.

Add or update E2E coverage to prove:

- a post row shows taxonomy in a right-side stacked block when there is enough room
- a single-post header shows taxonomy in the same right-side stacked block when there is enough room
- the top of the right-side taxonomy block aligns with the top of the title area
- at a narrower viewport, taxonomy moves below the left-side content
- in the wrapped state, series and tags appear side-by-side rather than stacked
- independent taxonomy-link interaction continues to work on list surfaces

Use computed layout relationships or element bounding boxes where possible instead of brittle class-only assertions.

## Non-Goals

- no change to taxonomy destinations or link semantics
- no reintroduction of nested anchors
- no change to the split responsibilities between `post-meta.html` and `post-taxonomy.html`
- no redesign of unrelated page structure outside the metadata area

## Success Criteria

The change is complete when:

- wide layouts show taxonomy in a right-aligned block with series above tags
- the top of that block aligns with the top of the title region
- narrower layouts move taxonomy below the left-side content and arrange series/tags side-by-side
- the same layout rules apply to both list rows and single-post headers
- existing link behavior remains accessible and correct

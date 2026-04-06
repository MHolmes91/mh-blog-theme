# Metadata Link Consistency Design

## Goal

Make the display of series and tags consistent across the site using the View All Posts treatment as the source of truth.

- Series should always read as obvious text links.
- Tags should always render inside chips.
- On list-style surfaces, series and tags must remain individually clickable without triggering the enclosing post navigation.
- The implementation must avoid nested anchors or button-like workarounds.

## Scope

This change applies to all surfaces that render post metadata through the shared metadata partial, including single-post pages and list-style surfaces such as post rows, archive rows, taxonomy term pages, and any card/list browsing layouts.

The accessibility and interaction restructuring applies only to list-style surfaces. Single-post pages can keep their current non-row layout while adopting the same series/tag visual treatment.

## Current Problem

The shared metadata partial currently mixes post metadata and taxonomy metadata in one template, and it renders tags and series as plain text unless the caller opts into linked mode. Some list-style surfaces wrap the entire row inside a single anchor. That makes it impossible to expose individually clickable metadata links there without creating invalid nested anchors or relying on JavaScript click suppression.

As a result, the app currently has inconsistent series/tag presentation and an interaction model on rows that blocks accessible independent metadata links.

## Chosen Approach

Split post metadata and taxonomy metadata into separate partials, then use surface-aware structure where needed.

- Keep `post-meta.html` focused on date and reading time.
- Add `post-taxonomy.html` as the single source of truth for rendering series links and tag chips.
- Make series render as obvious links everywhere.
- Make tags render as linked chips everywhere.
- Introduce a surface mode on the taxonomy partial so list-style surfaces can use the same taxonomy output without relying on a wrapper anchor around the whole row.
- Restructure row-like templates so the main post navigation is a dedicated title/summary link, while series and tag links remain separate interactive elements.

This is preferred over JavaScript event suppression or separate duplicated partials because it preserves accessibility and consistency with the smallest durable template change.

## Rendering Design

### Shared Partial Treatment

`post-meta.html` should render:

- date
- reading time where already applicable

`post-taxonomy.html` should render:

- series as plain text links
- tags as linked chips

The visual style for series and tags should match the established View All Posts presentation so the taxonomy affordances look the same on every surface.

### Surface-Aware Structure

The taxonomy partial should accept enough context to distinguish between at least:

- single-post rendering
- list-style rendering

That context controls wrapper structure and spacing, not taxonomy semantics. The same series/tag rules apply in both modes.

## List-Surface Accessibility Model

List-style surfaces must no longer use a single anchor that wraps both the post summary content and the metadata links.

Instead:

- the title remains a normal post link
- the summary will remain inside the main post link
- the date and reading time will remain inside the main post link
- each series link is its own anchor
- each tag chip is its own anchor

This ensures:

- no nested anchors
- no nested buttons
- clicking a series link navigates to the series term page only
- clicking a tag chip navigates to the tag term page only
- keyboard users can tab to the post link and metadata links independently

## Affected Templates

Expected template changes are limited to the split metadata partials and the list-style surfaces that currently depend on wrapper anchors around the full row.

At minimum, inspect and update as needed:

- `layouts/_partials/post-meta.html`
- `layouts/_partials/post-taxonomy.html`
- `layouts/_partials/post-row.html`
- `layouts/_partials/post-card.html` if it is confirmed to be unused, remove it as dead code rather than updating it

Any other template reusing the same wrapper-anchor pattern should be brought into the same structure if it renders series or tags.

## Testing Strategy

Follow TDD for the behavior change.

### New or Updated E2E Coverage

Add or update tests to prove:

- single posts show series as links and tags as linked chips
- list-style surfaces show the same series/tag treatment as View All Posts
- list-style surfaces do not contain nested anchors in article summaries
- clicking a series link from a row navigates to the series page rather than the post page
- clicking a tag chip from a row navigates to the tag page rather than the post page

### Regression Focus

Preserve:

- row/card readability and existing summary structure
- non-metadata navigation to the post itself
- taxonomy destination correctness

## Non-Goals

- no JavaScript-driven click interception for metadata links
- no button-based substitutes for taxonomy navigation
- no broader redesign of unrelated metadata fields
- no duplicate per-surface metadata implementations unless a concrete template constraint forces it

## Success Criteria

The change is complete when:

- series links look consistent across all metadata surfaces
- tag chips look consistent across all metadata surfaces
- list-style surfaces allow independent activation of post, series, and tag links
- the DOM contains no nested anchors for these surfaces
- the updated tests fail before implementation and pass after implementation

# Pass 1 Fixtures Design

## Goal

Expand the example-site content fixtures so the current theme can be exercised more realistically before the next presentation/layout pass. This pass is content- and test-focused: it should improve coverage of TOC behavior, built-in shortcode rendering, tags, and series behavior without intentionally changing the theme's visual structure.

## Scope

This pass covers:

- Adding a TOC stress post with dense heading structure and long sections
- Adding a built-in shortcode fixture post with a featured image
- Adding a four-part tagged series fixture
- Extending existing E2E tests to use the new fixtures where possible
- Making only small theme/template fixes if the new fixtures expose a real bug that blocks fixture usefulness

This pass does not cover:

- Typography changes such as switching to Lato-only
- List-page visual restructuring from cards to divider-based entries
- Visited-link styling changes
- Any new manual theme switching behavior
- Broad visual polish or layout redesign

## Why This Pass Comes First

The current theme needs richer content before the next round of visual cleanup. Stronger fixtures make the next pass safer because the tests will already cover deeper TOC structures, featured-image behavior, shortcodes, tags, and series pages. This isolates presentation changes from content/test expansion.

## Content Fixture Set

The example site should gain a new group of posts under `exampleSite/content/posts/`.

### TOC Stress Post

This post should be the primary fixture for TOC rendering and interaction testing.

Requirements:

- Includes many headings across three levels: `##`, `###`, and `####`
- Includes multiple stretches of substantial body text between headings
- Is long enough that TOC active-state changes can be observed while scrolling
- Is long enough that clicking a TOC entry causes a meaningful jump to a distant section
- Includes tags so the post also contributes to taxonomy coverage

Purpose:

- Validate Hugo TOC generation on deeper heading hierarchies
- Validate the theme's TOC highlight behavior during scroll
- Validate click navigation behavior from TOC entries to article sections

### Built-In Shortcodes Post

This post should exercise only Hugo built-in shortcodes that the theme currently supports cleanly.

Requirements:

- Uses built-in Hugo shortcodes only
- Avoids aspirational or unsupported shortcode examples
- Includes a featured image
- Includes headings so the post remains realistic content, not only shortcode snippets
- Includes tags

Purpose:

- Confirm built-in shortcode rendering works inside the current theme
- Confirm featured image handling continues to work for richer content
- Provide a stable fixture for E2E checks that are shortcode-related

### Four-Part Series Fixture

This fixture should create a normal multi-post series using standard content, not custom navigation logic.

Requirements:

- Four posts total
- All four share the same `series` value
- Dates are staggered so ordering is deterministic
- All four posts include tags
- At least one tag should overlap across the set so the posts also strengthen tag page coverage

Purpose:

- Validate series metadata rendering on individual posts
- Validate series taxonomy pages and post listings
- Strengthen general archive/list/taxonomy behavior with a more realistic content volume

## Taxonomy Expectations

All new fixtures should carry tags, and the series set should also carry the shared `series` value.

The result should be:

- Tag taxonomy indexes contain a broader mix of fixture posts
- Tag term pages can be checked against richer content sets
- Series term pages contain multiple entries with deterministic order

## Testing Strategy

This pass should prefer extending the current E2E suite instead of creating many new standalone tests.

### Preferred Testing Style

- Extend existing E2E tests where that keeps the suite coherent
- Reuse the new fixture posts intentionally for specific assertions
- Add new tests only when there is no reasonable existing place to extend

### Fixture-to-Test Mapping

TOC checks should use the TOC stress post for:

- TOC rendering presence
- Deep heading visibility in the TOC
- Active-section highlight changes during scroll
- Click navigation from TOC entries to article sections

Shortcode-related checks should use the shortcode fixture post for:

- Built-in shortcode rendering behavior
- Featured-image rendering alongside richer content

Series and taxonomy checks should use the four-part series set and tags for:

- Individual post metadata rendering
- Series term-page behavior
- Tag-page content rendering with a larger fixture set

### Test Philosophy

Tests should target behavior rather than excessively pinning exact prose where possible. The fixture text should be stable enough to target known headings and post titles, but the suite should avoid becoming fragile from over-asserting long content bodies.

## Theme Change Policy For This Pass

This pass should avoid intentional presentation changes. If a new fixture reveals a real current bug in the theme, a small corrective theme change is acceptable only when:

- The bug prevents the fixture from exercising the intended behavior
- The fix is narrowly scoped
- The fix is not really part of the later typography/layout cleanup pass

Otherwise, discovered presentation issues should be deferred to Pass 2.

## Expected Outcomes

After this pass:

- The example site has a realistic long-form TOC fixture
- The example site has a built-in shortcode fixture with featured image coverage
- The example site has a four-post series fixture with tags
- The existing E2E suite exercises those fixtures directly where appropriate
- The theme is better prepared for the later typography and list-layout cleanup pass

## Out Of Scope For Pass 1

The following are explicitly deferred to Pass 2:

- Lato-only typography across the theme
- Browser-preference-only color mode cleanup if any remaining visual/theme behavior needs adjustment
- Read/unread link styling using browser `:visited`
- Replacing list-page cards with `hr`-separated post entries
- Replacing the home note/card split with line-based separators

## Design Decisions Summary

- Split the work into two passes so fixture/test depth lands before visual cleanup
- Make the TOC post the primary long-form interaction fixture
- Keep shortcode coverage limited to built-in Hugo shortcodes supported today
- Model series coverage using four normal posts in one shared series
- Prefer extending existing E2E tests instead of creating many new isolated tests

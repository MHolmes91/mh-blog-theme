# Pass 2 Presentation Design

## Goal

Refine the theme's browsing surfaces and typography after Pass 1 fixture expansion. This pass should simplify the list-page presentation, move the theme to a single-family typography system based on Lato, and ensure browser-preference-only color mode behavior remains intact without introducing custom persistence or toggle state.

## Scope

This pass covers:

- Moving browsing surfaces to a dedicated row-style summary component
- Replacing card-style list presentation on home, archive/list, and taxonomy term pages with divider-based rows
- Separating the home intro/note area from recent posts with a line-based layout
- Using Lato only across the theme, including headings
- Retuning heading styles so Lato still produces strong hierarchy
- Ensuring light/dark follows browser preference only
- Adding visited/unvisited link styling using normal browser semantics
- Verifying Tailwind styling/build output remains correct without introducing new unit tests

This pass does not cover:

- New content fixtures
- Additional shortcode support
- New interactive features beyond what already exists
- A manual theme toggle or localStorage-based theme persistence
- Large-scale redesign of single-post reading surfaces

## Why This Pass Exists

The current theme still reflects the MVP scaffolding choices from the first implementation pass:

- post summaries are visually card-based
- typography relies on a two-font system
- the home note and list area are separated by boxed surfaces rather than cleaner structural division

After Pass 1 expanded the fixture set and test coverage, the theme is ready for a visual simplification pass that reduces decoration and improves consistency without destabilizing content behavior.

## Structural Direction

This pass should introduce a dedicated row-style summary partial for browsing surfaces instead of continuing to reuse the current card-style summary structure everywhere.

### Row-Based Browsing Surfaces

The row-style summary component should be used on:

- home recent-post list
- archive page
- generic list pages
- taxonomy term pages that render post summaries

The row component should:

- present post title, summary/leader, and metadata clearly
- avoid card borders/background containers as the primary separation device
- rely on spacing and `hr` dividers between entries

The current card-style summary partial may either be replaced outright or retained only if another surface still needs it. The preferred outcome is a cleaner browsing-specific component boundary, not two parallel presentation systems without purpose.

### Home Layout

The homepage should keep the intro/note content and the recent-post list, but the separation should become structural rather than card-based.

Requirements:

- On wide layouts, the intro/note area should be separated from the recent-post list by a vertical dividing line
- On narrow layouts, the layout should stack cleanly and use horizontal separation instead
- The intro/note area should not read like a card beside a stack of cards anymore

The goal is a calmer, more editorial layout language.

## Typography Direction

Pass 2 should move the theme to Lato only.

### Font System

- Remove the `PT Sans` import
- Use `Lato` for body text and headings

### Heading Treatment

This should not be a mechanical font-family swap. Because Lato will also be used for headings, heading styling must be retuned so hierarchy remains strong.

Requirements:

- Rebalance heading sizes, weights, spacing, and line-height
- Ensure headings still read distinctly from body text
- Ensure list-row titles remain visually strong after card removal

The design should rely on typographic hierarchy rather than font-family contrast.

## Color Mode Behavior

The theme should continue to use browser preference only for light/dark mode.

Requirements:

- No manual toggle
- No localStorage or other persistent user override state
- No custom theme-state model beyond reading browser preference and applying the corresponding theme

If any remaining implementation detail still implies manual or stored theme behavior, this pass should simplify it away.

## Link State Behavior

The theme should adopt normal browser link-state behavior for read/unread links.

Requirements:

- Use `:visited` semantics rather than a custom tracked read-state system
- Ensure visited styling remains legible in both light and dark themes
- Avoid making visited links so faint that browsing history becomes hard to read

This should apply naturally to regular content and browsing-surface links unless a specific accessibility issue requires narrower application.

## Tailwind Requirement

This pass should preserve Tailwind output integrity.

Requirements:

- Do not add unit tests for this pass purely for styling
- Verify Tailwind-driven output through build/render verification instead
- Confirm that class changes on the new row-based layout and typography pass through the existing asset pipeline correctly

The important outcome is not extra test volume; it is confidence that the generated CSS and rendered pages remain correct.

## Testing And Verification Strategy

This pass should prefer verification through the existing build and integration paths instead of adding new unit tests.

Expected verification focus:

- existing E2E coverage continues to pass after the layout shift
- home, archive/list, and taxonomy pages still render expected entries with the new row layout
- single posts still render correctly after typography changes
- visited/unvisited link styling is visually correct in actual rendering
- Tailwind build remains healthy

If one or two E2E assertions need to be adjusted because the browsing-surface markup changes materially, that is acceptable. The point is to keep behavior coverage intact while adapting the presentation layer.

## Theme Change Policy For This Pass

This pass is intentionally visual/structural, but it should stay within the browsing/typography scope.

Allowed:

- home/list/taxonomy/archive summary markup changes
- typography and spacing refinements tied to the Lato-only move
- browser-preference-only theme-mode cleanup if needed
- link-state styling updates

Not intended:

- new feature work unrelated to this presentation cleanup
- large content-model changes
- unrelated refactors outside the affected surfaces

## Expected Outcomes

After this pass:

- browsing surfaces use divider-based row summaries instead of cards
- the homepage intro and recent posts are separated structurally with line-based layout
- the theme uses only Lato
- headings still feel like headings after the font unification
- dark/light behavior remains browser-driven only
- visited links visibly differentiate read from unread links
- Tailwind build/render behavior remains intact

## Design Decisions Summary

- Introduce a dedicated row-style browsing summary component
- Apply row/divider presentation to home, archive/list, and taxonomy term pages
- Use Lato only, with heading styles retuned for hierarchy
- Keep color mode browser-preference-only with no manual persistence model
- Use normal browser `:visited` semantics for read/unread distinction
- Verify styling correctness through build and rendered behavior, not new unit tests

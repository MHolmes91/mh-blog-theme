# Content Rendering Design

## Goal

Improve rendered post content so headings are more readable and navigable, metadata is more useful, code/shortcode presentation is more intentional, and the shortcode example post becomes a broader content fixture that covers embedded Hugo shortcodes plus Mermaid support.

## Scope

This change covers:

- Stronger visual hierarchy across heading levels in post content
- Self-linking headings in rendered content
- Clickable tag and series metadata on posts
- `Roboto Mono` for code/shortcode blocks
- Expanding the shortcode example post to include all embedded Hugo shortcodes that can visibly render in the example site
- Adding Mermaid support following the `hugo-narrow` implementation pattern
- Integration coverage proving shortcode outputs render visibly

This change does not cover:

- Broader list/home/archive layout changes
- Footer/header/navigation redesign
- New non-content feature work unrelated to content rendering

## Heading Hierarchy

The current content rendering should gain clearer differentiation between heading levels.

Requirements:

- `h2`, `h3`, `h4`, and lower levels should have visibly distinct size, weight, and spacing
- The hierarchy should remain readable within the current prose/content layout
- Spacing above and below headings should feel intentional rather than uniform

The goal is to make long-form posts easier to scan without changing the surrounding page structure.

## Linked Headings

Rendered headings in post content should be anchor links to themselves.

Requirements:

- Each heading in post content should expose a stable anchor target
- The rendered heading should be clickable and link to its own fragment URL
- The interaction should remain readable and not feel like a separate control bolted onto the heading

This should be implemented at the content-rendering layer, not by post-processing arbitrary DOM text after render.

## Clickable Tags And Series

Tag and series metadata displayed with posts should become clickable links.

Requirements:

- Tags should link to their tag taxonomy pages
- Series values should link to their series taxonomy pages
- Existing metadata layout can remain, but the values should become navigable

The change should apply to rendered post metadata rather than introducing a separate taxonomy widget inside the post header.

## Code And Shortcode Block Typography

Code-oriented blocks should use `Roboto Mono`.

Requirements:

- Use `Roboto Mono` for shortcode/code blocks
- Keep existing overall typography outside code blocks unchanged
- Ensure code remains legible in both light and dark modes

This should cover the rendered output people read inside content, not only syntax-highlight wrappers in isolation.

## Embedded Hugo Shortcode Coverage

The shortcode example post should be expanded to include each embedded Hugo shortcode from the Hugo docs page that can visibly render in the example site.

Reference:

- `https://gohugo.io/content-management/shortcodes/#embedded`

Requirements:

- Include every embedded shortcode from that set that can be made to visibly render in the example site
- Where a shortcode needs an external ID, URL, or similar input, use explicit placeholder-but-rendering values rather than omitting it outright
- The shortcode fixture should remain a readable example post, not only a pile of shortcode snippets

The purpose is to make shortcode support visible and regression-testable in a single known fixture.

## Mermaid Support

This pass should add Mermaid support.

Requirements:

- Add Mermaid support in the style used by `hugo-narrow`
- Follow the actual `hugo-narrow` pattern rather than inventing a different custom approach

Relevant `hugo-narrow` pattern:

- use Hugo’s Mermaid codeblock render-hook pattern for the content markup layer
- load Mermaid conditionally through a supporting partial/feature layer

This means the implementation should mirror the real `hugo-narrow` structure, not merely copy the idea loosely.

The shortcode/example content should include a Mermaid example and integration coverage should prove that it renders visibly.

## Testing And Verification

This pass should rely on integration/build verification rather than adding unit tests just for presentation.

Expected verification focus:

- heading links render correctly in post content
- heading hierarchy changes render visibly without breaking prose layout
- tags and series in metadata are clickable and route correctly
- shortcode/code blocks use the intended monospace treatment
- the shortcode example post visibly renders each supported embedded shortcode example
- Mermaid visibly renders through the adopted implementation pattern
- existing build and integration coverage remain healthy

## Theme Change Policy For This Pass

This is a content-rendering pass.

Allowed:

- content-layer template/render-hook changes
- metadata partial changes related to clickable taxonomy values
- prose/code styling changes
- shortcode fixture expansion
- integration test expansion for rendered content behavior

Not intended:

- unrelated browsing-surface redesign
- general layout rewrites outside the content-rendering path
- new configuration models unless Mermaid support specifically requires a small, well-scoped one

## Expected Outcomes

After this change:

- headings are easier to scan and link directly to themselves
- post tags and series are clickable
- code/shortcode blocks use `Roboto Mono`
- the shortcode example post exercises the embedded Hugo shortcode set we can visibly support
- Mermaid renders using the `hugo-narrow`-style approach
- integration tests prove shortcode outputs render visibly

## Design Decisions Summary

- Improve heading hierarchy through content/prose styling rather than broad page layout change
- Implement self-linking headings at the rendering layer
- Make tag and series metadata navigable in place
- Use `Roboto Mono` specifically for code-oriented blocks
- Expand the shortcode fixture to cover embedded Hugo shortcodes with visible output
- Implement Mermaid following the real `hugo-narrow` render-hook + feature-loading pattern

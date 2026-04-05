# Hugo Blog Theme Design

## Goal

Build a Hugo blog theme inspired by `hugo-narrow`, but slimmer and more MVP-focused, using Hugo templates, TailwindCSS, Alpine.js, and a small amount of client-side JavaScript. The first version should prioritize functionality, reuse, and testability over visual polish.

## Scope

This design covers a reusable Hugo theme with:

- A title bar with site icon, site name, and search
- A sidebar table of contents on post pages with active-section tracking
- Home, single post, generic list, and archive templates
- Post summaries with metadata and small image/icon support
- Post pages with heading image, metadata, progress bar, and content
- Footer with socials and copyright
- Bottom dock with back-to-top
- SEO partials
- Browser-preference light/dark mode
- YAML-first configuration examples and docs
- Hugo default shortcode compatibility

Out of scope for MVP:

- Full shortcode parity with `hugo-narrow`
- Advanced visual polish beyond a functional purple theme
- External search services
- Chatbot integration

## Reference And Constraints

- The theme should be inspired by `hugo-narrow`, especially its overall information architecture and support for search, TOC, reading progress, and SEO concerns.
- The implementation should stay Hugo-native and avoid introducing unnecessary framework complexity.
- Visual design should be intentionally minimal in the first pass.
- Icons should use Heroicons.
- Typography should use Google Fonts with `Lato` for body text and `PT Sans` for headings.
- Example site configuration and documentation should use YAML instead of TOML by default.

## Recommended Architecture

The theme should use a Hugo-first architecture:

- Hugo templates define document structure, page layouts, metadata rendering, taxonomy rendering, and the JSON search index.
- TailwindCSS provides layout, typography, color, and component styling.
- Alpine.js provides interactive behavior wiring for search UI, TOC active state, theme mode, progress indicators, and dock actions.
- Small standalone JavaScript modules provide the logic behind Alpine-facing behavior so they remain unit testable in Node.

This keeps the theme simple to consume as a Hugo theme while still supporting the required interactions.

## Visual Direction

The MVP visual system should be consistent but restrained:

- Purple-forward color palette
- Clean, readable spacing and typography
- Light and dark modes sharing the same basic component structure
- Simple surfaces, borders, and hover states rather than heavily decorative treatments

The goal is a competent baseline theme that can be iterated on later without reworking structure.

## Template Model

The theme should provide these page templates:

### Home

- Shows a short intro/about block near the top
- Shows recent posts below the intro block
- Uses the same post summary component as list pages for consistency

### Single Post

- Renders heading image if present
- Renders title and metadata
- Renders tag and series metadata when available
- Renders article content
- Shows sidebar TOC only when the content contains TOC-worthy headings
- Shows reading progress bar at the top of the viewport

### List Pages

- Supports generic section and taxonomy list pages
- Reuses the post summary component

### Archive

- Provides an all-posts archive page
- Uses a complete chronological post listing

### Search Index

- Exposes `index.json` for client-side local search

## Shared Components

### Title Bar

The header should include:

- Site icon
- Site name
- Search trigger or visible search input depending on layout
- Theme toggle control

The title bar should remain simple and stable across all templates.

### Sidebar TOC

The TOC should:

- Appear on single post pages only
- Be omitted when headings are not present
- Highlight the active heading as the user scrolls

### Post Summary

Each summary item should support:

- Small image or icon thumbnail when available
- Title
- Leader or summary text
- Tag and/or series labels
- Date
- Read time

The component should gracefully omit any missing optional metadata.

### Footer

The footer should include:

- Social links from site configuration
- Small copyright line

### Bottom Dock

The MVP dock contains:

- Back-to-top control

## Content And Metadata Model

The theme should rely on standard Hugo content structures and front matter where possible.

Expected metadata inputs:

- Title
- Date
- Tags
- Series
- Summary or description
- Featured or heading image
- Draft and publish state managed by Hugo normally

Read time should be derived using Hugo's built-in capabilities rather than custom estimates.

## Search Design

The search implementation should use a Hugo-generated local JSON index.

### Indexed Data

Each searchable entry should include enough data for result display and term matching:

- Title
- Permalink
- Summary
- Plain content
- Headings
- Tags
- Series

### Runtime Behavior

- Search loads the JSON index client-side
- Queries are filtered locally without a remote dependency
- Matching results should link to relevant posts
- If the current page is a matching post, the theme should highlight matching terms inside the article and scroll to the first match

The initial implementation can use straightforward substring matching rather than a complex search engine, as long as the behavior is predictable and testable.

### Failure Handling

If the search index fails to load, the UI should show a visible unavailable state instead of silently failing.

## TOC And Reading Behavior

### TOC Active State

- Hugo should render the TOC markup
- Client-side code should observe article headings and mark the current section in the TOC
- The active state should follow the reader's scroll position, not just click state

### Reading Progress

- A slim progress bar should appear at the top on single post pages only
- Progress should be based on article scroll completion

## Theme Mode Behavior

Theme mode should work as follows:

- First load follows browser `prefers-color-scheme`
- There should be no manual toggle
- Both modes should use the same information architecture and component set

## Shortcode Support

Shortcode support should include:

- Hugo default shortcodes, relying on normal Hugo behavior where possible

## SEO Design

The theme should include standard SEO partial support for:

- Title tags
- Meta descriptions
- Canonical URLs
- Open Graph metadata
- Twitter card metadata

The SEO partial should be centralized in the head composition so pages inherit sensible defaults.

## File Structure

The theme should follow standard Hugo conventions with a focused structure:

- `layouts/baseof.html`
- `layouts/home.html`
- `layouts/single.html`
- `layouts/list.html`
- `layouts/archives.html`
- `layouts/index.json`
- `layouts/_partials/` for header, footer, SEO, search, TOC, dock, and metadata
- `assets/css/` for Tailwind entry and minimal theme/prose layers
- `assets/js/` for Alpine startup and small behavior modules
- `static/` for favicon and non-pipeline assets
- `theme.toml` for theme metadata, with site/example configuration and documentation aligned to YAML-first examples

If additional render hooks are needed for image or link presentation, they should be added only where they simplify consistent content rendering.

## Configuration Model

Documentation and example site setup should present YAML configuration first.

Configurable items should include:

- Site icon
- Social links
- Theme colors where practical
- Intro/about block content
- Search enablement
- TOC enablement

The design should avoid unnecessary configuration surface in MVP.

Theme metadata should remain in `theme.toml` for compatibility with established Hugo theme conventions, while consumer-facing setup examples should use `hugo.yaml`.

## Testing Strategy

Implementation should follow TDD.

### Node Unit Tests

Node-based unit tests should cover client-side logic that can be tested without a browser, including:

- Search filtering and term extraction helpers
- Highlighting and scroll-target selection helpers where practical
- TOC active-heading helper logic
- Reading progress calculations

These tests should focus on deterministic logic and edge cases.

### Playwright Integration Tests

Playwright tests should run against a built example site and cover full behavior such as:

- Home page rendering
- Single post rendering with metadata
- Archive page rendering
- Search flow from query to result interaction
- In-post term highlight and scroll behavior
- TOC active state while scrolling
- Back-to-top behavior
- Graceful behavior when optional metadata is absent

## Verification Requirements

Before considering the implementation complete, verify:

- Hugo builds the theme successfully
- Home, single, list, taxonomy, and archive pages render correctly
- Search index is generated and searchable
- Search highlight/scroll works on post pages
- TOC active state tracks scrolling correctly
- Reading progress updates correctly on posts
- Light/dark mode behaves correctly on first load
- Footer socials and header branding render from config
- Missing optional values do not produce broken UI
- Node unit tests pass
- Playwright integration tests pass

## Design Decisions Summary

- Use Hugo-native templates rather than a heavier front-end architecture
- Use Alpine.js only for lightweight interactive behavior
- Use TailwindCSS for all theme styling
- Keep the first pass visually minimal but structurally sound
- Use local client-side search backed by Hugo-generated JSON
- Support Hugo default shortcodes only
- Default site configuration examples and documentation to YAML
- Keep theme metadata in `theme.toml`
- Require TDD with Node unit tests and Playwright integration tests

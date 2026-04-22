# Related Posts Design

## Goal

Add a `Related` section below single post content that shows up to 4 Hugo-related posts, excludes posts from the same series, and reuses the existing home-page post row component.

## Scope

- Render related posts on single post pages.
- Place related posts below series navigation when series navigation is present.
- Use Hugo related-post calculations as the source list.
- Exclude the current post.
- Exclude any post that shares a `series` term with the current post.
- Limit displayed results to 4 posts.
- Reuse `layouts/_partials/post-row.html` for each related item.
- Hide the whole section when no eligible related posts remain.

## Out Of Scope

- Custom scoring logic beyond Hugo related posts.
- New card design for related content.
- Related-posts support outside single post pages.

## Approach

Create a dedicated partial at `layouts/_partials/related-posts.html` and render it from `layouts/single.html` after `series-navigation.html`.

This keeps filtering and display logic isolated while reusing the existing `post-row.html` presentation already used on the home page.

## Data Flow

For the current post page:

1. Ask Hugo for related pages using `.Site.RegularPages.Related .`.
2. Remove the current page from the result set.
3. Remove pages in the same `series` as the current page.
4. Limit the remaining results to 4.
5. Render nothing if the filtered list is empty.

Series exclusion rule:

- If the current post has one or more `series` terms, any related candidate sharing any of those series terms must be excluded.
- If the current post has no series terms, only exclude the current post itself.

## Placement

In `layouts/single.html`:

- Content body remains first.
- `series-navigation.html` remains directly below content.
- `related-posts.html` renders below series navigation.
- If no series navigation exists, related posts render directly below content.

## UI Structure

Section layout:

- Heading: `Related`
- Up to 4 related rows below the heading
- Rows separated with the same `hr` divider pattern used on the home page list

Each related item:

- Render with existing `post-row.html`
- No alternate card layout or custom per-item markup

## Template Changes

### `layouts/_partials/related-posts.html`

- New partial
- Resolves related pages
- Filters current page and same-series posts
- Limits to 4
- Renders heading and list rows only when results remain

### `layouts/single.html`

- Insert `{{ partial "related-posts.html" . }}` below `series-navigation.html`

## Configuration Note

Current example site config does not define a `related` block. Hugo may still return related results from defaults, but deterministic tests may require explicit related configuration in `exampleSite/hugo.yaml` if fixture behavior is otherwise unstable.

## Testing

Verify:

1. Related section appears on single post pages when Hugo returns eligible related posts.
2. Header text is exactly `Related`.
3. No more than 4 related rows render.
4. Current post is excluded.
5. Posts sharing the current post's series are excluded.
6. Related rows reuse home-page row rendering via `post-row.html`.
7. Related section appears below series navigation when series navigation exists.
8. Related section is hidden when only same-series candidates exist or no related results remain.

## Risks

- Hugo related-post output can be sparse or unstable without explicit related configuration.
- Filtering same-series posts may remove all results, so tests need fixtures with both same-series and non-series related candidates.

## Decision Notes

- Use dedicated partial instead of embedding logic in `single.html`.
- Reuse `post-row.html` exactly rather than building a new related-post component.
- Prefer hiding the entire section over showing an empty heading.

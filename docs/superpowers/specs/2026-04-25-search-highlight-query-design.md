# Search Highlight Query Design

## Goal

When a visitor opens a post from search, the destination URL should include the search query so the post can guide the visitor to the first matching body occurrence. If the search result matched only metadata, title, series, tags, or description, the post should open normally at the top with no highlight.

## User-Facing Behavior

- Search result links always include `highlight=<query>` in the URL.
- The `highlight` value is the current search input, URL-encoded by browser URL APIs.
- On single post pages, only the rendered post body is searched for the highlight query.
- If the body contains the query, the first body text occurrence is wrapped in a `<mark>` element and scrolled into view.
- If the body does not contain the query, no content is highlighted and the page remains at the top.
- Matches in the title, series, tags, or description do not trigger post-page highlighting unless the same query also appears in the post body.

## Architecture

Search URL generation belongs with the existing search utilities in `assets/js/lib/search.js`. A small helper will accept a result permalink and query string, then return a URL with the `highlight` parameter set. This keeps the link-building behavior shared between mouse clicks and keyboard navigation.

The Alpine `siteUi` component in `assets/js/app.js` will expose the URL helper for templates and use it when navigating to the active search result. The search result anchor in `layouts/_partials/header.html` will bind `href` to the helper instead of using `result.permalink` directly.

Post-page highlighting will run during `siteUi.init()`. It will read `new URLSearchParams(window.location.search).get('highlight')`, find `[data-content-body]`, and search only text nodes under that element. The first case-insensitive match will be split into surrounding text nodes plus a `<mark>` node. After insertion, that `<mark>` will scroll into view.

## Data Flow

1. The visitor enters a search query.
2. Search results are filtered from `index.json` as they are today.
3. Each search result URL is built as `permalink?highlight=<query>`.
4. The visitor clicks a result or navigates to the active result by keyboard.
5. The post page reads `highlight` from the URL.
6. The post page searches rendered body text only.
7. The first body match is highlighted and scrolled to, or nothing happens if there is no body match.

## Error Handling And Edge Cases

- Empty or whitespace-only highlight values do nothing.
- Missing `[data-content-body]` does nothing.
- Existing query strings and hash fragments in permalinks are preserved by URL APIs.
- Special regex characters in the query are treated as plain text because body matching will use lowercased string indexes rather than a regular expression.
- Only the first body match is highlighted to avoid unexpectedly rewriting large portions of the article.

## Testing

- Unit test the URL helper to confirm it adds `highlight`, encodes the query, and preserves existing URL parts.
- Unit test the body-highlight helper with a DOM fixture to confirm it highlights the first body match, returns no match for metadata-only text, and handles empty queries.
- E2E test search result navigation for a body match: the URL includes `highlight`, a body `<mark>` is visible, and the page scrolls to that match.
- E2E test metadata-only navigation: the URL includes `highlight`, but the post body has no `<mark>` and the page remains at the top.

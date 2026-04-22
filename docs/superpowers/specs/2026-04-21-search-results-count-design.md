# Search Results Count Design

## Summary

Add a small search results count line below the search input when the modal has at least one result. The label should read `1 result` for a single match and `N results` otherwise, and it should use the same typography as the existing search result tag text.

## Current State

The search modal in `layouts/_partials/header.html` already renders three states below the input:

- a minimum-length prompt for queries shorter than three characters
- a `No results` message for valid queries with zero matches
- the results list for matching records

The modal already has access to the computed `results` array from Alpine via `assets/js/app.js`, so the count can be derived directly in the template without changing the search filtering logic in `assets/js/lib/search.js`.

## Recommended Approach

Add a new conditional text row in the modal template between the existing empty-state messages and the results list container.

### Rendering Rules

The count row should render only when all of the following are true:

- `query.trim().length >= 3`
- `results.length > 0`

The label text should be:

- `1 result` when `results.length === 1`
- `${results.length} results` when `results.length !== 1`

### Styling

The count row should visually match the typography used for the existing search result tag text.

That means:

- reuse the tag-sized text scale already used in the search results metadata
- avoid introducing a new custom utility or component for this single label
- keep the count visually subordinate to the search field and result titles

The count should sit below the search bar and above the cards so users see the total before scanning the list.

## Alternatives Considered

### Add an Alpine getter for the label

This would move the singular/plural string construction into `assets/js/app.js`. It is acceptable, but it adds new presentation-only state for a string that is only used once.

### Add count data in the search filter layer

This is not recommended. `filterSearchRecords()` should continue to return enriched search records only. The count is derived view data and belongs in the template.

## Data Flow

1. User types a query into the existing search input.
2. The existing `results` getter returns filtered records.
3. The template checks query length and result count.
4. When matches exist, the template renders the count label before the results list.

No new persisted data, API changes, or search ranking changes are needed.

## Error Handling

No additional error handling is required.

Existing empty and short-query states remain unchanged:

- queries shorter than three characters still show the existing minimum-length message
- valid queries with zero matches still show `No results`
- count text is omitted entirely when there are no results

## Testing

Follow TDD.

Add a focused failing UI test first, then implement the minimal template change.

Coverage should verify:

- the count appears for a multi-result query
- the singular form appears for a one-result query
- the count does not appear for short queries
- the count does not appear when there are no results

The most direct verification is an end-to-end assertion against the rendered search modal because this is user-visible template behavior.

## Out Of Scope

- changing search ranking or filtering
- changing search metadata chips
- adding localization or alternate count phrasing
- adding a separate reusable component for the count label

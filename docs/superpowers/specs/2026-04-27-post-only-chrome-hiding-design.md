# Post-Only Chrome Hiding Design

## Goal

Only post pages expose scroll-dependent chrome behavior:

- The back-to-top button appears only on post pages after scrolling past the existing threshold.
- The header auto-hide behavior runs only on post pages.
- Non-post pages keep the header visible at all scroll positions.

Footer behavior is unchanged. There is no current footer auto-hide implementation to restrict.

## Current Context

`assets/js/app.js` defines the Alpine `siteUi` component. Back-to-top visibility is already gated by the presence of `#post-content`, which is rendered by `layouts/single.html` for post pages. Header auto-hide is driven by `toolbarVisible` and currently runs for every page through the `updateToolbarVisibility()` scroll handler.

## Approach

Use the existing `#post-content` DOM marker as the post-page signal. Define a local `isPostPage` boolean during Alpine initialization and reuse it for scroll chrome decisions.

`updateToolbarVisibility()` will return early on non-post pages after clearing any pending hide timer and forcing `toolbarVisible = true`. This preserves the current search and focus behavior while preventing non-post pages from hiding the header due to scroll inactivity.

The back-to-top logic will keep its current post-page gate and threshold, with no template changes required.

## Testing

Add e2e coverage for a non-post page that scrolls below the threshold and waits longer than the hide delay. The expected result is that the banner never receives the hidden opacity class. Existing post-page tests continue to cover header fade, re-show on upward scroll, search interactions, and back-to-top behavior.

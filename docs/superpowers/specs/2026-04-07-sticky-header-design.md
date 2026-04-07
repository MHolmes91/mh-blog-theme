# Sticky Header with Auto-Hide

## Summary

Convert the existing site header from static to sticky positioning with an auto-hide behavior: the header fades out after 3 seconds of scroll inactivity when the user has scrolled past the top of `<main>`, and re-appears immediately on any scroll. Above the threshold, the header is always visible.

## Approach

Sticky positioning (`position: sticky`). The header stays in document flow and sticks to the viewport top when scrolled past. No spacer element needed.

## Behavior

### Threshold

`main.getBoundingClientRect().top <= 0` — the `<main>` element has scrolled to or past the viewport top. This applies on all page types (single posts, list pages, archives).

### State machine

| Condition | `toolbarVisible` |
|-----------|-------------------|
| Above threshold (main top > 0) | `true` (always) |
| Below threshold, user scrolling | `true` |
| Below threshold, 3s since last scroll | `false` |

### Fade transition

- CSS: `transition-opacity duration-300`
- Hidden state: `opacity-0 pointer-events-none`
- Visible state: default opacity (1), pointer events enabled

### Scroll listener

The existing scroll event listener in `app.js` (`siteUi.init()`) is extended with a new handler `updateToolbarVisibility()`:
1. On scroll, always set `toolbarVisible = true` and cancel any pending hide timeout
2. Check threshold: if below, start a new 3-second timeout to set `toolbarVisible = false`
3. If above threshold, set `toolbarVisible = true` (no timeout)
4. Listener is passive (matches existing pattern)

## Template Changes

### `layouts/_partials/header.html`

- Add `sticky top-0 z-40` to the `<header>` element
- Change `bg-white/90` to `bg-white/80 backdrop-blur-md` for frosted-glass effect
- Add `transition-opacity duration-300` for smooth fade
- Add `:class="{ 'opacity-0 pointer-events-none': !toolbarVisible }"` bound to Alpine state

No content changes. Logo/title (left) and search button (right) remain unchanged.

## JS Changes

### `assets/js/app.js`

New state in `siteUi`:
- `toolbarVisible: true`

New handler `updateToolbarVisibility()`:
- Checks `document.querySelector('main').getBoundingClientRect().top <= 0`
- Manages a `setTimeout` reference stored as instance property (`this._toolbarTimer`)
- Wired into existing `scroll` event listener (passive)

## Layering

- Header: `z-40`
- Reading progress bar: `z-50` (unchanged, stays on top)

## What Does Not Change

- Header content (logo, title, search)
- Reading progress bar behavior
- Dock/back-to-top behavior
- Footer, TOC, theme logic
- Content padding alignment (`max-w-6xl px-6` already matches between header and main)

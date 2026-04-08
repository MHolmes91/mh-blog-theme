# TOC Improvements Design

## Summary

Enhance the Table of Contents with: fixed desktop positioning that reacts to header visibility, heading-level indentation and styling, mobile hamburger trigger with dropdown panel, and improved active heading highlighting.

## Desktop Fixed TOC with Header-Aware Slide

The TOC remains inside the CSS grid column (`lg:grid-cols-[minmax(0,1fr)_280px]`) as a `sticky` aside. It gets a dynamic `top` value driven by the existing `toolbarVisible` Alpine state in `siteUi`:

- **Header visible**: `top: 6rem` (96px) — matches current `top-24` (header height + gap)
- **Header hidden**: `top: 1.5rem` (24px) — slides up to just below where the header was

Implementation: `:style` binding on the aside with `transition-all duration-300`, matching the header's 300ms opacity transition. The TOC preserves the same gap it had between itself and the header — it just anchors to the viewport top instead.

The aside already has `sticky top-24`. Replace the static `top-24` with a dynamic style binding.

## Heading Level Indentation and Styling

Hugo's `.TableOfContents` generates nested `<ul>`/`<li>` elements reflecting heading hierarchy. Target nesting depth with CSS:

| Level | Indent | Size | Color |
|-------|--------|------|-------|
| h2 (depth 0) | none | `text-sm` | `text-slate-700` / dark: `var(--color-muted)` |
| h3 (depth 1) | `pl-4` | `text-xs` | `text-slate-500` / dark: `var(--color-muted)` |
| h4+ (depth 2+) | `pl-8` | `text-xs` | `text-slate-400` / dark: `var(--color-muted)` |

Active heading (`aria-current="location"`) overrides to `text-purple-700 font-semibold` regardless of level.

CSS approach: target `#TableOfContents > ul > li` (depth 0), `#TableOfContents > ul > li > ul > li` (depth 1), `#TableOfContents > ul > li > ul > li > ul > li` (depth 2+). Also set `list-style: none` and remove default margins/padding on nested lists.

Dark mode: colors use `var(--color-muted)` and `var(--color-accent)` via existing CSS custom property overrides. The `bg-white/95` opacity variant used on the mobile panel needs to be added to the override list in `app.css` (alongside `bg-white`, `bg-white/80`, `bg-white/90`).

## Active Heading Highlighting

The existing `pickActiveHeading` function in `assets/js/lib/toc.js` already correctly identifies the heading closest to the top of the viewport (last heading with `top <= 160px` threshold). No algorithm changes needed.

The existing scroll listener in `app.js` updates `aria-current="location"` on the active TOC link. The styling for `aria-current` moves from inline classes on the aside wrapper to dedicated CSS rules that also apply within the mobile panel.

## Mobile Floating Hamburger + Dropdown Panel

### Trigger Button

A fixed-position circle button, same visual style as the dock's back-to-top button:

- Position: `top` follows the same header-aware logic as desktop TOC (6rem when header visible, 1.5rem when hidden), `right: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))` — same right-edge formula as the dock
- Only visible below `lg` breakpoint: `lg:hidden`
- Icon: "list" icon (3 horizontal lines), rendered via the existing `icon.html` partial
- `z-30` (below header's z-40, above content)

### Dropdown Panel

Anchored below the hamburger button, opens with Alpine `x-transition`:

- `right-0` aligned with the hamburger
- `top: 3.5rem` (below the 40px button + gap)
- Max height: 60vh with `overflow-y: auto`
- `rounded-2xl border border-purple-200 bg-white/95 backdrop-blur-sm p-4` — same card style as desktop, with slight transparency
- `z-30`
- Width: 280px (matching desktop sidebar width)
- Close button (X icon) in upper-left corner of the panel

### Interactions

- Tap hamburger: opens panel, sets `tocOpen: true`
- Tap X: closes panel (`tocOpen: false`)
- Click outside panel: closes panel
- Escape key: closes panel
- Click a TOC link inside panel: navigates to heading, closes panel

### Alpine State

Add to `siteUi` in `app.js`:
- `tocOpen: false` — panel visibility
- `toggleToc()` — toggles `tocOpen`
- `closeToc()` — sets `tocOpen = false`

### TOC Content

The desktop aside and mobile panel each render `.TableOfContents` independently via Hugo. Both get the same `id="TableOfContents"` on their nav element — the JS active-heading tracker only runs against the first match (using `getElementById`), so we need unique IDs:
- Desktop: `id="TableOfContents"`
- Mobile: `id="TableOfContentsMobile"`

The `updateActiveTocEntry` function in `app.js` is updated to query both nav elements and update active states in both simultaneously.

## Dark Mode

All new elements use existing CSS custom property overrides:
- `bg-white` / `bg-white/95` — already overridden to `var(--color-surface)`
- `border-purple-200` — already overridden to `var(--color-border)`
- `text-purple-700` — already overridden to `var(--color-accent)`
- `text-slate-*` variants — use `var(--color-muted)` via existing overrides

The hamburger button uses `bg-purple-600` (already overridden to `var(--color-accent)`).

## Files Changed

- `layouts/_partials/toc.html` — desktop aside with dynamic top, heading styles
- `layouts/_partials/toc-mobile.html` (new) — mobile hamburger + dropdown panel
- `layouts/single.html` — include mobile TOC partial
- `layouts/_partials/icon.html` — add "list" and "x" icons
- `assets/js/app.js` — add `tocOpen`, `toggleToc()`, `closeToc()`, update active heading tracker for dual nav elements
- `assets/css/app.css` — heading level indentation/size/color CSS rules
- `tests/e2e/theme.spec.js` — E2E tests for all new behavior

## Out of Scope

- Scroll-spy with smooth scroll-into-view of the TOC panel on mobile
- Collapsible heading sections within the TOC
- Reading progress indicator within the TOC itself

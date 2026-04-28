# Alpine Component Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic Alpine `siteUi` component with smaller region-owned components while preserving current behavior.

**Architecture:** `assets/js/app.js` becomes the Alpine boot/registration file. New component factories live in `assets/js/components/`, while existing pure helpers remain in `assets/js/lib/`. Components coordinate only through DOM events where markup regions are not nested.

**Tech Stack:** Hugo templates, Alpine.js, ES modules built by Hugo `js.Build`, Playwright e2e tests, Vitest unit tests.

---

## File Structure

- Create `assets/js/components/site-shell.js`: body component for theme and search-open accessibility state.
- Create `assets/js/components/search-ui.js`: search overlay component.
- Create `assets/js/components/header-chrome.js`: sticky header visibility component.
- Create `assets/js/components/post-progress.js`: post reading progress component.
- Create `assets/js/components/back-to-top-dock.js`: post-only floating dock component.
- Create `assets/js/components/toc-ui.js`: TOC open state and active heading component.
- Modify `assets/js/app.js`: register new components while keeping `siteUi` until later tasks migrate templates.
- Modify `layouts/baseof.html`: use `siteShell()` while preserving `main` search accessibility state.
- Modify `layouts/_partials/header.html`: attach `headerChrome()` and nested `searchUi()`.
- Modify `layouts/single.html`: attach `postProgress()` to the post page wrapper.
- Modify `layouts/_partials/dock.html`: attach `backToTopDock()`.
- Modify `layouts/_partials/toc.html`: attach `tocUi()` and consume local `toolbarVisible`.
- Modify `tests/e2e/theme.spec.js`: update direct Alpine test access from `siteUi` to `searchUi` if needed.

### Task 1: Baseline Safety Check

**Files:**
- Verify: `tests/e2e/theme.spec.js`
- Verify: `tests/unit/*.test.js`

- [ ] **Step 1: Run targeted e2e tests before refactor**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "search close restores a previously auto-hidden toolbar|search close recalculates toolbar visibility after scrolling while open|search close hides the toolbar after scrolling down while open|non-post pages never show the back to top button|back to top returns to the top of the page|single posts update the reading progress bar while scrolling|desktop toc slides up when header hides|mobile toc panel opens and closes"
```

Expected: PASS. If the Hugo port is already occupied by a stale local server, stop that server and rerun the same command.

- [ ] **Step 2: Run unit tests before refactor**

Run:

```bash
npm test
```

Expected: PASS.

### Task 2: Create Component Modules And Register Them

**Files:**
- Create: `assets/js/components/site-shell.js`
- Create: `assets/js/components/search-ui.js`
- Create: `assets/js/components/header-chrome.js`
- Create: `assets/js/components/post-progress.js`
- Create: `assets/js/components/back-to-top-dock.js`
- Create: `assets/js/components/toc-ui.js`
- Modify: `assets/js/app.js`

- [ ] **Step 1: Create `site-shell.js`**

```js
import { resolveTheme } from '../lib/theme.js'

export function siteShell() {
  return {
    searchOpen: false,
    theme: resolveTheme({
      systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    }),
    init() {
      window.addEventListener('search:open', () => { this.searchOpen = true })
      window.addEventListener('search:close', () => { this.searchOpen = false })
    }
  }
}
```

- [ ] **Step 2: Create placeholder component modules**

Create these files with minimal factories so registration can compile:

```js
// assets/js/components/search-ui.js
export function searchUi() {
  return {}
}
```

```js
// assets/js/components/header-chrome.js
export function headerChrome() {
  return { toolbarVisible: true }
}
```

```js
// assets/js/components/post-progress.js
export function postProgress() {
  return {}
}
```

```js
// assets/js/components/back-to-top-dock.js
export function backToTopDock() {
  return {
    showBackToTop: false,
    dockStyle: '',
    backToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
```

```js
// assets/js/components/toc-ui.js
export function tocUi() {
  return {
    tocOpen: false,
    toolbarVisible: true,
    toggleToc() {
      this.tocOpen = !this.tocOpen
    },
    closeToc() {
      this.tocOpen = false
    }
  }
}
```

- [ ] **Step 3: Add component registrations to `app.js` without removing `siteUi`**

Add these imports after the existing Alpine import:

```js
import { backToTopDock } from './components/back-to-top-dock.js'
import { headerChrome } from './components/header-chrome.js'
import { postProgress } from './components/post-progress.js'
import { searchUi } from './components/search-ui.js'
import { siteShell } from './components/site-shell.js'
import { tocUi } from './components/toc-ui.js'
```

Add these registrations after `window.Alpine = Alpine` and before the existing `Alpine.data('siteUi', ...)` registration:

```js
Alpine.data('backToTopDock', backToTopDock)
Alpine.data('headerChrome', headerChrome)
Alpine.data('postProgress', postProgress)
Alpine.data('searchUi', searchUi)
Alpine.data('siteShell', siteShell)
Alpine.data('tocUi', tocUi)
```

Keep the existing `siteUi` implementation in this task. It is removed only after all template regions stop referencing it.

- [ ] **Step 4: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS.

### Task 3: Move Search Into `searchUi`

**Files:**
- Modify: `assets/js/components/search-ui.js`
- Modify: `layouts/baseof.html`
- Modify: `layouts/_partials/header.html`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Implement `searchUi`**

Replace `assets/js/components/search-ui.js` with:

```js
import {
  buildHighlightedPostUrl,
  filterSearchRecords,
  highlightFirstTextMatch,
  highlightText,
  loadSearchRecords
} from '../lib/search.js'

export function searchUi(searchUrl) {
  return {
    query: '',
    records: [],
    searchOpen: false,
    activeResultIndex: -1,
    highlightText,
    buildHighlightedPostUrl,
    init() {
      this.highlightPostBodyMatch()
      this.$watch('query', () => { this.activeResultIndex = -1 })
    },
    async openSearch() {
      window.dispatchEvent(new CustomEvent('search:open', {
        detail: { scrollY: window.scrollY }
      }))
      this.searchOpen = true

      this.$nextTick(() => {
        this.$refs.searchInput?.focus()
      })

      if (!this.records.length) {
        this.records = await loadSearchRecords(fetch, searchUrl)
      }
    },
    closeSearch() {
      this.searchOpen = false
      window.dispatchEvent(new CustomEvent('search:close', {
        detail: { scrollY: window.scrollY }
      }))
      this.query = ''
      this.activeResultIndex = -1
    },
    selectNextResult() {
      if (!this.results.length) return
      this.activeResultIndex = this.activeResultIndex < this.results.length - 1
        ? this.activeResultIndex + 1
        : 0
      this.scrollActiveResultIntoView()
    },
    selectPrevResult() {
      if (!this.results.length) return
      this.activeResultIndex = this.activeResultIndex > 0
        ? this.activeResultIndex - 1
        : this.results.length - 1
      this.scrollActiveResultIntoView()
    },
    navigateToActiveResult() {
      const target = this.results[this.activeResultIndex] || this.results[0]
      if (target) window.location.href = this.buildHighlightedPostUrl(target.permalink, this.query)
    },
    scrollActiveResultIntoView() {
      this.$nextTick(() => {
        const active = document.querySelector(`[data-result-index="${this.activeResultIndex}"]`)
        active?.scrollIntoView({ block: 'nearest' })
      })
    },
    highlightPostBodyMatch() {
      const query = new URLSearchParams(window.location.search).get('highlight') || ''
      const body = document.querySelector('[data-content-body]')
      const mark = highlightFirstTextMatch(body, query)
      mark?.scrollIntoView({ block: 'center' })
    },
    get results() {
      return filterSearchRecords(this.records, this.query)
    }
  }
}
```

- [ ] **Step 2: Update body shell**

Change `layouts/baseof.html` body line from:

```html
<body id="top" x-data="siteUi('{{ "index.json" | relURL }}')" :data-theme="theme">
```

to:

```html
<body id="top" x-data="siteShell()" :data-theme="theme">
```

Keep the existing main accessibility binding unchanged:

```html
<main :aria-hidden="searchOpen">
```

- [ ] **Step 3: Add search scope in header**

Change the header search wrapper line in `layouts/_partials/header.html` from:

```html
<div class="flex items-center gap-3">
```

to:

```html
<div x-data="searchUi('{{ "index.json" | relURL }}')" class="flex items-center gap-3">
```

- [ ] **Step 4: Update direct Alpine e2e access**

In `tests/e2e/theme.spec.js`, replace the direct `siteUi` lookup in `search close restores a previously auto-hidden toolbar` with:

```js
await page.evaluate(async () => {
  const searchButton = document.querySelector('button[aria-label="Search"]');
  const searchUi = searchButton?.closest('[x-data]')?._x_dataStack?.[0];
  if (!searchUi) throw new Error("Expected Alpine searchUi data");
  await searchUi.openSearch();
});
```

- [ ] **Step 5: Run targeted search tests**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "search opens and shows matching posts|search result body match highlights and scrolls on the post|search focuses the input when opened|search closes when clicking the overlay|search Enter navigates to first result|search arrow keys navigate results|search wraps around with arrow keys"
```

Expected: PASS.

### Task 4: Move Header Auto-Hide Into `headerChrome`

**Files:**
- Modify: `assets/js/components/header-chrome.js`
- Modify: `layouts/_partials/header.html`

- [ ] **Step 1: Implement `headerChrome`**

Replace `assets/js/components/header-chrome.js` with:

```js
export function headerChrome() {
  return {
    toolbarVisible: true,
    searchOpen: false,
    clearToolbarHideTimer() {
      clearTimeout(this._toolbarTimer)
      this._toolbarTimer = null
    },
    scheduleToolbarHide() {
      this.clearToolbarHideTimer()
      this._toolbarTimer = setTimeout(() => {
        if (!this.searchOpen) {
          this.toolbarVisible = false
          this.dispatchToolbarVisibility()
        }
      }, 3000)
    },
    dispatchToolbarVisibility() {
      window.dispatchEvent(new CustomEvent('toolbar:visibility', {
        detail: { visible: this.toolbarVisible }
      }))
    },
    init() {
      const isPostPage = Boolean(document.getElementById('post-content'))
      const updateToolbarVisibility = () => {
        if (!isPostPage) {
          this.clearToolbarHideTimer()
          this.toolbarVisible = true
          this.dispatchToolbarVisibility()
          return
        }

        const main = document.querySelector('main')
        const isAboveThreshold = !main || main.getBoundingClientRect().top > 0
        const scrollY = window.scrollY
        const isScrollingUp = scrollY < (this._lastScrollY ?? scrollY)
        this._lastScrollY = scrollY

        this.clearToolbarHideTimer()

        if (this.searchOpen) {
          this.toolbarVisible = true
          this.dispatchToolbarVisibility()
          return
        }

        if (isAboveThreshold || isScrollingUp || this.toolbarVisible) {
          this.toolbarVisible = true
          this.dispatchToolbarVisibility()
          this.scheduleToolbarHide()
        }
      }

      updateToolbarVisibility()
      window.addEventListener('scroll', updateToolbarVisibility, { passive: true })
      window.addEventListener('resize', updateToolbarVisibility)
      window.addEventListener('search:open', (event) => {
        this._scrollYBeforeSearch = event.detail?.scrollY ?? window.scrollY
        this._toolbarVisibleBeforeSearch = this.toolbarVisible
        this._toolbarTimerWasActiveBeforeSearch = Boolean(this._toolbarTimer)
        this.clearToolbarHideTimer()
        this.searchOpen = true
        this.toolbarVisible = true
        this.dispatchToolbarVisibility()
      })
      window.addEventListener('search:close', (event) => {
        this.clearToolbarHideTimer()
        this.searchOpen = false

        const scrollYBeforeSearch = this._scrollYBeforeSearch ?? window.scrollY
        const currentScrollY = event.detail?.scrollY ?? window.scrollY

        if (currentScrollY < scrollYBeforeSearch) {
          this.toolbarVisible = true
          if (currentScrollY > 0) this.scheduleToolbarHide()
        } else if (currentScrollY > scrollYBeforeSearch) {
          this.toolbarVisible = false
        } else {
          this.toolbarVisible = this._toolbarVisibleBeforeSearch ?? true
          if (this.toolbarVisible && this._toolbarTimerWasActiveBeforeSearch) {
            this.scheduleToolbarHide()
          }
        }

        this._scrollYBeforeSearch = undefined
        this._toolbarVisibleBeforeSearch = undefined
        this._toolbarTimerWasActiveBeforeSearch = false
        this._lastScrollY = currentScrollY
        this.dispatchToolbarVisibility()
      })
      document.addEventListener('focusin', () => {
        this.clearToolbarHideTimer()
        this.toolbarVisible = true
        this.dispatchToolbarVisibility()
      })
    }
  }
}
```

- [ ] **Step 2: Add header scope**

Change the opening tag in `layouts/_partials/header.html` from:

```html
<header
  role="banner"
```

to:

```html
<header
  x-data="headerChrome()"
  role="banner"
```

The existing header class binding stays:

```html
:class="{ 'opacity-0 pointer-events-none': !toolbarVisible && !searchOpen }"
```

- [ ] **Step 3: Run targeted header/search tests**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "search close restores a previously auto-hidden toolbar|search close recalculates toolbar visibility after scrolling while open|search close hides the toolbar after scrolling down while open|header stays visible after scroll inactivity on non-post pages|header fades out after 3 seconds of scroll inactivity below threshold|scrolling up re-shows the header after it has faded out|header stays visible when an element has focus"
```

Expected: PASS.

### Task 5: Move Reading Progress And Back-To-Top Dock

**Files:**
- Modify: `assets/js/components/post-progress.js`
- Modify: `assets/js/components/back-to-top-dock.js`
- Modify: `layouts/single.html`
- Modify: `layouts/_partials/dock.html`

- [ ] **Step 1: Implement `postProgress`**

Replace `assets/js/components/post-progress.js` with:

```js
import { getReadingProgress } from '../lib/progress.js'

export function postProgress() {
  return {
    init() {
      const progressBar = document.getElementById('reading-progress')
      const postContent = document.getElementById('post-content')
      const updateReadingProgress = () => {
        if (!progressBar || !postContent) return

        const { top } = postContent.getBoundingClientRect()
        const scrollTop = window.scrollY
        const contentTop = scrollTop + top
        const progress = getReadingProgress({
          scrollTop,
          contentTop,
          contentHeight: postContent.offsetHeight,
          viewportHeight: window.innerHeight
        })

        progressBar.style.width = `${progress}%`
      }

      updateReadingProgress()
      window.addEventListener('scroll', updateReadingProgress, { passive: true })
      window.addEventListener('resize', updateReadingProgress)
    }
  }
}
```

- [ ] **Step 2: Attach `postProgress`**

Change `layouts/single.html` section from:

```html
<section class="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
```

to:

```html
<section x-data="postProgress()" class="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
```

- [ ] **Step 3: Implement `backToTopDock`**

Replace `assets/js/components/back-to-top-dock.js` with:

```js
export function backToTopDock() {
  return {
    showBackToTop: false,
    dockStyle: '',
    init() {
      const isPostPage = Boolean(document.getElementById('post-content'))
      const updateBackToTopVisibility = () => {
        this.showBackToTop = isPostPage && window.scrollY > 320
      }
      const updateDockOffset = () => {
        const footer = document.querySelector('footer[role="contentinfo"]')
        const baseOffset = 24
        const rightInset = 'max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))'

        if (!footer) {
          this.dockStyle = `right:${rightInset};bottom:${baseOffset}px;`
          return
        }

        const footerRect = footer.getBoundingClientRect()
        const overlap = Math.max(0, window.innerHeight - footerRect.top)
        const bottomOffset = baseOffset + overlap

        this.dockStyle = `right:${rightInset};bottom:${bottomOffset}px;`
      }

      updateBackToTopVisibility()
      updateDockOffset()
      window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
      window.addEventListener('resize', updateBackToTopVisibility)
      window.addEventListener('scroll', updateDockOffset, { passive: true })
      window.addEventListener('resize', updateDockOffset)
    },
    backToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
```

- [ ] **Step 4: Attach `backToTopDock`**

Change `layouts/_partials/dock.html` from:

```html
<div x-cloak x-show="showBackToTop" class="fixed" :style="dockStyle">
```

to:

```html
<div x-data="backToTopDock()" x-cloak x-show="showBackToTop" class="fixed" :style="dockStyle">
```

- [ ] **Step 5: Run targeted post chrome tests**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "non-post pages never show the back to top button|back to top returns to the top of the page|single posts update the reading progress bar while scrolling"
```

Expected: PASS.

### Task 6: Move TOC State Into `tocUi`

**Files:**
- Modify: `assets/js/components/toc-ui.js`
- Modify: `layouts/_partials/toc.html`

- [ ] **Step 1: Implement `tocUi`**

Replace `assets/js/components/toc-ui.js` with:

```js
import { pickActiveHeading } from '../lib/toc.js'

export function tocUi() {
  return {
    tocOpen: false,
    toolbarVisible: true,
    init() {
      const updateActiveTocEntry = () => {
        const navIds = ['TableOfContents', 'TableOfContentsMobile']
        const allEntries = []

        for (const navId of navIds) {
          const toc = document.getElementById(navId)
          if (!toc) continue

          const entries = [...toc.querySelectorAll('a[href^="#"]')]
            .map((link) => {
              const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
              const heading = id ? document.getElementById(id) : null
              if (!heading) return null

              return { id, link, heading }
            })
            .filter(Boolean)

          allEntries.push(...entries)
        }

        if (!allEntries.length) return

        const activeId = pickActiveHeading(
          allEntries.map(({ id, heading }) => ({ id, top: heading.getBoundingClientRect().top }))
        )

        for (const { id, link } of allEntries) {
          if (id === activeId) {
            link.setAttribute('aria-current', 'location')
          } else {
            link.removeAttribute('aria-current')
          }
        }
      }

      updateActiveTocEntry()
      window.addEventListener('scroll', updateActiveTocEntry, { passive: true })
      window.addEventListener('resize', updateActiveTocEntry)
      window.addEventListener('toolbar:visibility', (event) => {
        this.toolbarVisible = event.detail?.visible ?? true
      })
    },
    toggleToc() {
      this.tocOpen = !this.tocOpen
    },
    closeToc() {
      this.tocOpen = false
    }
  }
}
```

- [ ] **Step 2: Attach `tocUi`**

Change the desktop aside opening in `layouts/_partials/toc.html` by wrapping the partial content in one component scope:

```html
{{ if ne .TableOfContents `<nav id="TableOfContents"></nav>` }}
  <div x-data="tocUi()" class="contents">
    <aside
      class="hidden lg:block sticky transition-all duration-300 rounded-2xl border border-purple-200 bg-white/95 backdrop-blur-sm p-4 shadow-sm h-fit"
      :style="`top: ${toolbarVisible ? '6rem' : '1.5rem'}`"
    >
```

Add the closing `</div>` before the existing `{{ end }}`. Keep the existing aside/mobile markup inside the wrapper unchanged.

- [ ] **Step 3: Run targeted TOC tests**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "toc stress post highlights the active TOC entry while scrolling|desktop toc slides up when header hides|mobile toc panel opens and closes|mobile toc panel closes on escape|mobile toc active heading tracks while scrolling"
```

Expected: PASS.

### Task 7: Remove Remaining `siteUi` Coupling And Verify

**Files:**
- Verify: `assets/js/app.js`
- Verify: `assets/js/components/*.js`
- Verify: `layouts/**/*.html`
- Verify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Search for stale `siteUi` references**

Run:

```bash
rg "siteUi|searchOpen|toolbarVisible|tocOpen|showBackToTop|dockStyle" assets/js layouts tests/e2e/theme.spec.js
```

Expected: `siteUi` has no matches. Other state names only appear in their owning component module or template region.

- [ ] **Step 2: Run full e2e suite**

Run:

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 3: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Review diff**

Run:

```bash
git diff -- assets/js/app.js assets/js/components layouts tests/e2e/theme.spec.js docs/superpowers/specs/2026-04-27-alpine-component-split-design.md docs/superpowers/plans/2026-04-27-alpine-component-split.md
```

Expected: diff contains component extraction, template rewiring, direct-test update, and docs only.

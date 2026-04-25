# Search Highlight Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `highlight=<query>` to search result navigation and highlight/scroll the first matching post-body occurrence on destination posts.

**Architecture:** Keep URL construction and text-node highlighting as small utilities in `assets/js/lib/search.js`, then wire them into the existing Alpine `siteUi` component. The post page will only inspect `[data-content-body]`, so metadata-only matches naturally open at the top with no highlight.

**Tech Stack:** Hugo templates, Alpine.js, browser DOM APIs, Vitest with jsdom-style DOM fixtures via `document`, Playwright e2e tests.

---

## File Structure

- Modify `assets/js/lib/search.js`: add `buildHighlightedPostUrl(permalink, query, baseUrl)` and `highlightFirstTextMatch(root, query)` utilities.
- Modify `assets/js/app.js`: import/export the new utilities through `siteUi`, call body highlighting during `init()`, and navigate keyboard-selected results to highlighted URLs.
- Modify `layouts/_partials/header.html`: bind result anchors to highlighted URLs.
- Modify `tests/unit/search.test.js`: unit-test URL generation and DOM text highlighting.
- Modify `tests/e2e/theme.spec.js`: e2e-test search navigation for body matches and metadata-only matches.

## Task 1: Search URL Helper

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write failing tests for highlighted URLs**

Add `buildHighlightedPostUrl` to the import list at the top of `tests/unit/search.test.js`:

```js
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, extractContext, buildHighlightedPostUrl } from '../../assets/js/lib/search.js'
```

Add this test block before `describe('collectMatches', () => {`:

```js
describe('buildHighlightedPostUrl', () => {
  it('adds the highlight parameter to a post permalink', () => {
    expect(buildHighlightedPostUrl('/posts/example/', 'search term', 'https://example.org')).toBe('/posts/example/?highlight=search+term')
  })

  it('preserves existing query strings and hash fragments', () => {
    expect(buildHighlightedPostUrl('/posts/example/?page=2#section', 'alpha beta', 'https://example.org')).toBe('/posts/example/?page=2&highlight=alpha+beta#section')
  })

  it('returns the clean permalink for empty queries', () => {
    expect(buildHighlightedPostUrl('/posts/example/', '   ', 'https://example.org')).toBe('/posts/example/')
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- tests/unit/search.test.js`

Expected: FAIL with an export/import error for `buildHighlightedPostUrl`.

- [ ] **Step 3: Implement minimal URL helper**

Add this function near the other exported helpers in `assets/js/lib/search.js`, after `loadSearchRecords`:

```js
export function buildHighlightedPostUrl(permalink, query, baseUrl = window.location.origin) {
  const needle = query.trim()
  if (!needle) return permalink

  const url = new URL(permalink, baseUrl)
  url.searchParams.set('highlight', needle)

  return `${url.pathname}${url.search}${url.hash}`
}
```

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test -- tests/unit/search.test.js`

Expected: PASS for all `search.test.js` tests.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: add search highlight URLs"
```

Expected: commit succeeds. If unrelated files are already staged, unstage or commit only the two files above with `git commit assets/js/lib/search.js tests/unit/search.test.js -m "feat: add search highlight URLs"`.

## Task 2: Body Text Highlight Utility

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write failing DOM tests**

Update the import list in `tests/unit/search.test.js` to include `highlightFirstTextMatch`:

```js
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, extractContext, buildHighlightedPostUrl, highlightFirstTextMatch } from '../../assets/js/lib/search.js'
```

Add this test block before `describe('collectMatches', () => {`:

```js
describe('highlightFirstTextMatch', () => {
  it('wraps only the first matching body text occurrence', () => {
    const body = document.createElement('div')
    body.innerHTML = '<p>Alpha body text.</p><p>Second alpha body text.</p>'

    const mark = highlightFirstTextMatch(body, 'alpha')

    expect(mark).toBeInstanceOf(HTMLElement)
    expect(body.querySelectorAll('mark')).toHaveLength(1)
    expect(body.querySelector('mark')?.textContent).toBe('Alpha')
    expect(body.textContent).toBe('Alpha body text.Second alpha body text.')
  })

  it('returns null when the query is missing from body text', () => {
    const body = document.createElement('div')
    body.innerHTML = '<p>Body paragraph.</p>'

    expect(highlightFirstTextMatch(body, 'metadata')).toBeNull()
    expect(body.querySelector('mark')).toBeNull()
  })

  it('returns null for empty queries', () => {
    const body = document.createElement('div')
    body.innerHTML = '<p>Body paragraph.</p>'

    expect(highlightFirstTextMatch(body, '   ')).toBeNull()
    expect(body.querySelector('mark')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- tests/unit/search.test.js`

Expected: FAIL with an export/import error for `highlightFirstTextMatch`.

- [ ] **Step 3: Implement minimal body text highlighter**

Add this function after `buildHighlightedPostUrl` in `assets/js/lib/search.js`:

```js
export function highlightFirstTextMatch(root, query) {
  const needle = query.trim()
  if (!root || !needle) return null

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const lowerNeedle = needle.toLowerCase()
  let node = walker.nextNode()

  while (node) {
    const text = node.nodeValue || ''
    const index = text.toLowerCase().indexOf(lowerNeedle)

    if (index !== -1) {
      const range = document.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + needle.length)

      const mark = document.createElement('mark')
      range.surroundContents(mark)
      return mark
    }

    node = walker.nextNode()
  }

  return null
}
```

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test -- tests/unit/search.test.js`

Expected: PASS for all `search.test.js` tests.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: highlight body search matches"
```

Expected: commit succeeds. If unrelated files are already staged, commit only these paths with `git commit assets/js/lib/search.js tests/unit/search.test.js -m "feat: highlight body search matches"`.

## Task 3: Wire Search Links And Post Highlighting

**Files:**
- Modify: `assets/js/app.js`
- Modify: `layouts/_partials/header.html`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Add app wiring manually**

In `assets/js/app.js`, change the import line from:

```js
import { filterSearchRecords, loadSearchRecords, highlightText } from './lib/search.js'
```

to:

```js
import { filterSearchRecords, loadSearchRecords, highlightText, buildHighlightedPostUrl, highlightFirstTextMatch } from './lib/search.js'
```

Inside the `siteUi` object, after `highlightText,`, add:

```js
  buildHighlightedPostUrl,
```

Inside `init()`, after `updateDockOffset()`, add:

```js
    this.highlightPostBodyMatch()
```

Replace `navigateToActiveResult()` with:

```js
  navigateToActiveResult() {
    const target = this.results[this.activeResultIndex] || this.results[0]
    if (target) window.location.href = this.buildHighlightedPostUrl(target.permalink, this.query)
  },
```

Add this method after `scrollActiveResultIntoView()`:

```js
  highlightPostBodyMatch() {
    const query = new URLSearchParams(window.location.search).get('highlight') || ''
    const body = document.querySelector('[data-content-body]')
    const mark = highlightFirstTextMatch(body, query)
    mark?.scrollIntoView({ block: 'center' })
  },
```

- [ ] **Step 2: Update search result anchor href**

In `layouts/_partials/header.html`, change:

```html
:href="result.permalink"
```

to:

```html
:href="buildHighlightedPostUrl(result.permalink, query)"
```

- [ ] **Step 3: Run unit tests**

Run: `npm test -- tests/unit/search.test.js`

Expected: PASS.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add assets/js/app.js layouts/_partials/header.html
git commit -m "feat: wire search highlight navigation"
```

Expected: commit succeeds. If unrelated files are already staged, commit only these paths with `git commit assets/js/app.js layouts/_partials/header.html -m "feat: wire search highlight navigation"`.

## Task 4: E2E Coverage

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add body-match e2e test**

Add this test after the existing `search opens and shows matching posts` test in `tests/e2e/theme.spec.js`:

```js
test("search result body match highlights and scrolls on the post", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  await page.getByRole("link", { name: /First Post/ }).click();

  await expect(page).toHaveURL(/\/posts\/first-post\/\?highlight=paragraph/);
  const mark = page.locator("#post-content [data-content-body] mark").first();
  await expect(mark).toHaveText(/paragraph/i);

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Add metadata-only e2e test**

Add this test immediately after the body-match test:

```js
test("search result metadata-only match opens at top without body highlight", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("fixture-series");

  await page.getByRole("link", { name: /Series Part 1/ }).click();

  await expect(page).toHaveURL(/\/posts\/series-part-1\/\?highlight=fixture-series/);
  await expect(page.locator("#post-content [data-content-body] mark")).toHaveCount(0);

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);
});
```

- [ ] **Step 3: Run targeted e2e tests and verify behavior**

Run: `npm run test:e2e -- --grep "search result"`

Expected: PASS for the new search result tests and any existing matching e2e test names.

- [ ] **Step 4: Commit Task 4**

Run:

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: cover search highlight navigation"
```

Expected: commit succeeds. If unrelated files are already staged, commit only this path with `git commit tests/e2e/theme.spec.js -m "test: cover search highlight navigation"`.

## Task 5: Final Verification

**Files:**
- No planned code changes.

- [ ] **Step 1: Run full unit test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run full e2e suite**

Run: `npm run test:e2e`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS and the Hugo build completes without template or asset errors.

- [ ] **Step 4: Inspect final diff**

Run: `git status --short`

Expected: no uncommitted changes from this feature. If existing unrelated changes remain, do not modify them.

## Self-Review

- Spec coverage: Task 1 adds `highlight=<query>` URLs; Task 2 implements body-only first-match highlighting; Task 3 wires click and keyboard navigation plus post-load behavior; Task 4 covers body and metadata-only e2e behavior; Task 5 verifies the whole project.
- Placeholder scan: no TBD, TODO, deferred implementation, or vague testing steps remain.
- Type consistency: function names are consistently `buildHighlightedPostUrl` and `highlightFirstTextMatch`; URL parameter name is consistently `highlight`; body selector is consistently `[data-content-body]`.

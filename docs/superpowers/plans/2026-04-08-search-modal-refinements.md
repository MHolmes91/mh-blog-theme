# Search Modal Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing search modal so it stays aligned with the sticky header, renders fixed-height result cards, decodes human-readable text, and supports the updated close and empty-state behavior.

**Architecture:** Keep the current full-screen overlay and Alpine-driven search flow. Extend `assets/js/lib/search.js` to decode HTML entities with `entities`, normalize heading snippets, and return structured snippet metadata. Update the modal template in `layouts/_partials/header.html` and the state logic in `assets/js/app.js` so the header remains visible during search and the panel height is driven by the input row plus up to three fixed-height results.

**Tech Stack:** Hugo templates, Alpine.js, vanilla JS ES modules, Tailwind CSS, `entities`, Vitest, Playwright.

---

### Task 1: Add `entities` and cover decoded snippet output in unit tests

**Files:**
- Modify: `package.json`
- Modify: `tests/unit/search.test.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing tests**

Add these cases to `tests/unit/search.test.js`:

```js
describe('highlightText', () => {
  it('renders decoded punctuation before highlighting', () => {
    expect(highlightText('&quot;quoted&quot; text', 'quoted')).toBe('<mark>"quoted"</mark> text')
  })
})

describe('extractContext', () => {
  it('returns structured heading snippets without markdown or trailing hash', () => {
    const record = {
      title: 'Heading Post',
      tags: [],
      series: [],
      content: 'Intro text. Linked Heading This excerpt follows the heading in plain text.',
      headings: ['## Linked Heading #']
    }

    expect(extractContext(record, 'linked')).toEqual({
      kind: 'heading',
      heading: 'Linked Heading',
      text: 'This excerpt follows the heading in plain text.'
    })
  })

  it('returns structured text snippets for content matches', () => {
    const record = {
      title: 'Content Post',
      tags: [],
      series: [],
      content: 'A paragraph with &quot;quoted&quot; content in the middle of the snippet.',
      headings: []
    }

    expect(extractContext(record, 'quoted')).toEqual({
      kind: 'text',
      heading: '',
      text: expect.stringContaining('"quoted"')
    })
  })
})

describe('filterSearchRecords', () => {
  it('returns structured snippet metadata for heading matches', () => {
    const records = [{
      title: 'Heading Post',
      summary: '',
      content: 'Intro text. Linked Heading Body copy after the heading.',
      permalink: '/heading/',
      tags: [],
      series: [],
      headings: ['## Linked Heading #']
    }]

    const [result] = filterSearchRecords(records, 'linked')

    expect(result._snippetKind).toBe('heading')
    expect(result._heading).toBe('Linked Heading')
    expect(result._context).toContain('Body copy after the heading.')
  })
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL because `extractContext()` still returns a plain string and `highlightText()` does not decode entities.

- [ ] **Step 3: Add the dependency metadata**

Update `package.json` to add a runtime dependency:

```json
{
  "dependencies": {
    "entities": "^8.0.0"
  }
}
```

Keep the existing `devDependencies` unchanged.

- [ ] **Step 4: Regenerate the lockfile**

Run: `npm install`
Expected: PASS and `package-lock.json` includes `entities` without unrelated churn.

- [ ] **Step 5: Run the unit tests again**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL for the same search utility assertions, confirming only the dependency metadata changed.

- [ ] **Step 6: Commit the dependency addition**

```bash
git add package.json package-lock.json tests/unit/search.test.js
git commit -m "chore: add entities for search snippet decoding"
```

---

### Task 2: Implement decoded and structured search snippets

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the minimal implementation for decoding and heading normalization**

Update `assets/js/lib/search.js` with the new helpers and snippet shape:

```js
import { decodeHTML } from 'entities'

function normalizeText(text) {
  return decodeHTML(text || '')
}

function normalizeHeading(heading) {
  return normalizeText(heading)
    .replace(/^##+\s+/, '')
    .replace(/\s+#$/, '')
    .trim()
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function highlightText(text, query) {
  const needle = query.trim()
  const decodedText = normalizeText(text)
  if (!needle) return escapeHtml(decodedText)

  const safeText = escapeHtml(decodedText)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return safeText.replace(regex, '<mark>$1</mark>')
}

export function extractContext(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return { kind: 'text', heading: '', text: '' }

  const content = normalizeText(record.content || '')
  const rank = rankRecord({ ...record, content }, query)

  if (rank <= 1) {
    return { kind: 'text', heading: '', text: content.slice(0, CONTEXT_LENGTH) }
  }

  const lowerContent = content.toLowerCase()

  for (const heading of (record.headings || [])) {
    const headingText = normalizeHeading(heading)
    if (headingText.toLowerCase().includes(needle)) {
      const headingPos = lowerContent.indexOf(headingText.toLowerCase())
      if (headingPos !== -1) {
        const text = content.slice(headingPos + headingText.length).trimStart().slice(0, CONTEXT_LENGTH)
        return { kind: 'heading', heading: headingText, text }
      }
    }
  }

  const matchIndex = lowerContent.indexOf(needle)
  if (matchIndex === -1) {
    return { kind: 'text', heading: '', text: content.slice(0, CONTEXT_LENGTH) }
  }

  let start = Math.max(0, matchIndex - 60)
  let end = Math.min(content.length, matchIndex + needle.length + 60)

  if (start > 0 && content[start] !== ' ' && content[start - 1] !== ' ') {
    const nextSpace = content.indexOf(' ', start)
    if (nextSpace !== -1) start = nextSpace + 1
  }

  if (end < content.length && content[end - 1] !== ' ' && content[end] !== ' ') {
    const prevSpace = content.lastIndexOf(' ', end)
    if (prevSpace > start) end = prevSpace
  }

  let text = content.slice(start, end).trim()
  if (start > 0) text = '…' + text
  if (end < content.length) text = text + '…'

  return { kind: 'text', heading: '', text }
}
```

- [ ] **Step 2: Enrich filtered results with the structured fields**

Adjust `filterSearchRecords()` in `assets/js/lib/search.js`:

```js
    .map(record => {
      const snippet = extractContext(record, needle)

      return {
        ...record,
        _rank: rankRecord(record, needle),
        _snippetKind: snippet.kind,
        _heading: snippet.heading,
        _context: snippet.text,
        _matchedTags: getMatchedTags(record, needle),
        _matchedSeries: getMatchedSeries(record, needle)
      }
    })
```

- [ ] **Step 3: Run the unit tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS with the new structured snippet assertions.

- [ ] **Step 4: Commit the search utility changes**

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: decode and structure search result snippets"
```

---

### Task 3: Keep the header visible and refine modal states in Alpine and the template

**Files:**
- Modify: `assets/js/app.js`
- Modify: `layouts/_partials/header.html`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing end-to-end tests**

Add these tests to `tests/e2e/theme.spec.js` near the existing search coverage:

```js
test("search keeps the header visible while the modal is open", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()

  await expect(page.getByRole("banner")).toBeVisible()
  await expect(page.getByPlaceholder("Search posts")).toBeVisible()
})

test("search closes when clicking outside the modal", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()
  await page.locator("[data-search-overlay]").click({ position: { x: 8, y: 8 } })

  await expect(page.getByPlaceholder("Search posts")).toBeHidden()
})

test("search shows a no results message for 3+ character queries", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()
  await page.getByPlaceholder("Search posts").fill("zzzx")

  await expect(page.getByText("No results")).toBeVisible()
})
```

- [ ] **Step 2: Run the new end-to-end tests to verify they fail**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search keeps the header visible|search closes when clicking outside|search shows a no results message"`
Expected: FAIL because the header can still auto-hide and there is no dedicated `No results` state yet.

- [ ] **Step 3: Update the Alpine state so search forces header visibility**

Change `assets/js/app.js` so `toolbarVisible` stays true while `searchOpen` is true:

```js
    const updateToolbarVisibility = () => {
      if (this.searchOpen) {
        clearTimeout(this._toolbarTimer)
        this.toolbarVisible = true
        return
      }

      const main = document.querySelector('main')
      const isAboveThreshold = !main || main.getBoundingClientRect().top > 0
      const scrollY = window.scrollY
      const isScrollingUp = scrollY < (this._lastScrollY ?? scrollY)
      this._lastScrollY = scrollY

      clearTimeout(this._toolbarTimer)

      if (isAboveThreshold || isScrollingUp || this.toolbarVisible) {
        this.toolbarVisible = true
        this._toolbarTimer = setTimeout(() => {
          this.toolbarVisible = false
        }, 3000)
      }
    }
```

Also call `clearTimeout(this._toolbarTimer)` in `openSearch()` and `closeSearch()` before toggling state.

- [ ] **Step 4: Update the template states and close control**

Change `layouts/_partials/header.html` to add a named overlay, `ESC` keycap control, and explicit helper states:

```html
<div
  x-cloak
  x-show="searchOpen"
  data-search-overlay
  @click.self="closeSearch"
  @keydown.escape.window="closeSearch"
  class="fixed inset-0 z-50 bg-black/40 p-6"
>
  <div class="mx-auto max-w-2xl rounded-2xl bg-white p-4">
    <div class="flex items-center gap-3">
      <input
        x-model="query"
        placeholder="Search posts"
        class="w-full rounded border border-purple-300 px-3 py-2"
      />
      <button
        type="button"
        aria-label="Close search"
        @click="closeSearch"
        class="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-semibold tracking-wide uppercase"
      >
        ESC
      </button>
    </div>

    <template x-if="query.trim().length > 0 && query.trim().length < 3">
      <p class="mt-4 text-sm text-slate-500 text-center">Type at least 3 characters to search</p>
    </template>

    <template x-if="query.trim().length >= 3 && !results.length">
      <p class="mt-4 text-sm text-slate-500 text-center">No results</p>
    </template>
  </div>
</div>
```

- [ ] **Step 5: Run the targeted end-to-end tests to verify they pass**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search keeps the header visible|search closes when clicking outside|search shows a no results message"`
Expected: PASS.

- [ ] **Step 6: Commit the interaction-state changes**

```bash
git add assets/js/app.js layouts/_partials/header.html tests/e2e/theme.spec.js
git commit -m "feat: keep search modal aligned with header state"
```

---

### Task 4: Lock the card height and render heading prefixes inline

**Files:**
- Modify: `layouts/_partials/header.html`
- Modify: `assets/css/app.css`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing end-to-end coverage for the fixed result layout**

Add these checks to `tests/e2e/theme.spec.js`:

```js
test("search renders heading matches without a trailing hash", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()
  await page.getByPlaceholder("Search posts").fill("searchable")

  await expect(page.locator("[data-search-context-heading]").first()).not.toContainText("#")
})

test("search caps the visible results area at three cards", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()
  await page.getByPlaceholder("Search posts").fill("post")

  const cards = page.locator("[data-result-index]")
  const container = page.locator("[data-results-container]")

  const visibleHeight = await container.evaluate(el => el.clientHeight)
  const firstCardHeight = await cards.first().evaluate(el => el.getBoundingClientRect().height)

  expect(visibleHeight).toBeLessThanOrEqual(Math.ceil(firstCardHeight * 3 + 16))
})
```

- [ ] **Step 2: Run the targeted end-to-end tests to verify they fail**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search renders heading matches without a trailing hash|search caps the visible results area at three cards"`
Expected: FAIL because the heading prefix is not rendered separately and the result list height is still based on the current loose spacing.

- [ ] **Step 3: Update the modal result markup to use fixed-height rows**

Adjust the result template in `layouts/_partials/header.html`:

```html
<div data-results-container class="mt-4 space-y-2 max-h-[18.5rem] overflow-y-auto">
  <template x-for="(result, index) in results" :key="result.permalink">
    <a
      :href="result.permalink"
      :data-result-index="index"
      class="grid h-[5.5rem] rounded border px-3 py-2 transition-colors"
      style="grid-template-rows: 1.25rem 1.25rem minmax(0, 1fr);"
    >
      <div x-html="highlightText(result.title, query)" class="truncate font-medium"></div>
      <div class="mt-1 flex min-h-[1.25rem] flex-wrap items-center gap-1.5 overflow-hidden"></div>
      <div class="mt-1 min-h-0 overflow-hidden text-sm leading-5 text-slate-500 line-clamp-2">
        <template x-if="result._snippetKind === 'heading' && result._heading">
          <span>
            <strong data-search-context-heading x-html="highlightText(result._heading, query)"></strong>
            <span x-text="' '"></span>
          </span>
        </template>
        <span x-html="highlightText(result._context, query)"></span>
      </div>
    </a>
  </template>
</div>
```

- [ ] **Step 4: Add the supporting styles for the `ESC` keycap and active card state**

Append to `assets/css/app.css`:

```css
.search-esc {
  min-width: 2.5rem;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
}

:is(:root, body[data-theme]) .bg-purple-50 {
  background-color: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
}
```

Then apply `search-esc` to the close button class list in `layouts/_partials/header.html`.

- [ ] **Step 5: Run the search-focused end-to-end suite**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search "`
Expected: PASS for all search-related tests.

- [ ] **Step 6: Commit the modal layout refinements**

```bash
git add layouts/_partials/header.html assets/css/app.css tests/e2e/theme.spec.js
git commit -m "feat: refine search result card layout and heading snippets"
```

---

### Task 5: Run the full verification pass

**Files:**
- Test: `tests/unit/search.test.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Run the unit suite**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS.

- [ ] **Step 2: Run the end-to-end suite**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test`
Expected: PASS.

- [ ] **Step 3: Inspect the worktree for unintended lockfile churn**

Run: `git status --short`
Expected: only the intended search refinement files remain modified.

- [ ] **Step 4: Commit the verified refinement set**

```bash
git add package.json package-lock.json assets/js/lib/search.js assets/js/app.js layouts/_partials/header.html assets/css/app.css tests/unit/search.test.js tests/e2e/theme.spec.js
git commit -m "feat: refine search modal layout and text rendering"
```

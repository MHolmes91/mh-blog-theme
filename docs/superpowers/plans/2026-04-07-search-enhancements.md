# Search Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance search with contextual highlighted results, keyboard navigation, and a close icon.

**Architecture:** Extend the existing `search.js` pure function library with `highlightText`, `rankRecord`, `extractContext`, and `getMatchedTags`. Update `filterSearchRecords` to return enriched results sorted by match priority. Add keyboard navigation state and methods to the Alpine `siteUi` component. Update the search dialog template in `header.html`.

**Tech Stack:** Hugo templates, Alpine.js, vanilla JS (ES modules), Tailwind CSS, Vitest, Playwright.

---

### Task 1: `highlightText` and `escapeHtml` pure functions

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/search.test.js`:

```js
import { highlightText, rankRecord, extractContext, getMatchedTags } from '../../assets/js/lib/search.js'
```

Add new describe blocks:

```js
describe('highlightText', () => {
  it('returns escaped text when query is empty', () => {
    expect(highlightText('hello <world>', '')).toBe('hello &lt;world&gt;')
  })

  it('wraps case-insensitive matches in <mark> tags', () => {
    expect(highlightText('Hello World', 'hello')).toBe('<mark>Hello</mark> World')
  })

  it('preserves original casing', () => {
    expect(highlightText('HELLO world', 'hello')).toBe('<mark>HELLO</mark> world')
  })

  it('escapes HTML before highlighting', () => {
    expect(highlightText('<b>bold</b> text', 'bold')).toBe('&lt;b&gt;<mark>bold</mark>&lt;/b&gt; text')
  })

  it('highlights multiple occurrences', () => {
    expect(highlightText('foo bar foo', 'foo')).toBe('<mark>foo</mark> bar <mark>foo</mark>')
  })

  it('escapes special regex characters in query', () => {
    expect(highlightText('a+b', 'a+b')).toBe('<mark>a+b</mark>')
  })
})
```

Update the import line at the top to include the new exports (they won't exist yet, which is fine — tests will fail):

```js
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, extractContext, getMatchedTags } from '../../assets/js/lib/search.js'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL — `highlightText` is not exported

- [ ] **Step 3: Write the implementation**

Add to `assets/js/lib/search.js`:

```js
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function highlightText(text, query) {
  const needle = query.trim()
  if (!needle) return escapeHtml(text)
  const safeText = escapeHtml(text)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return safeText.replace(regex, '<mark>$1</mark>')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: add highlightText and escapeHtml for search result highlighting"
```

---

### Task 2: `rankRecord` and `getMatchedTags` functions

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/search.test.js`:

```js
describe('rankRecord', () => {
  const record = {
    title: 'Hugo Tutorial',
    tags: ['webdev', 'hugo'],
    series: ['Getting Started'],
    content: 'This is some content about Hugo.',
    headings: ['## Setup', '## Usage']
  }

  it('returns 0 for title match', () => {
    expect(rankRecord(record, 'tutorial')).toBe(0)
  })

  it('returns 1 for tag match', () => {
    expect(rankRecord(record, 'webdev')).toBe(1)
  })

  it('returns 1 for series match', () => {
    expect(rankRecord(record, 'started')).toBe(1)
  })

  it('returns 2 for content match', () => {
    expect(rankRecord(record, 'content')).toBe(2)
  })

  it('returns 2 for heading match', () => {
    expect(rankRecord(record, 'setup')).toBe(2)
  })

  it('returns -1 when query is empty', () => {
    expect(rankRecord(record, '')).toBe(-1)
  })

  it('returns 0 for title match even when other fields also match', () => {
    expect(rankRecord({ ...record, title: 'Setup Guide' }, 'setup')).toBe(0)
  })
})

describe('getMatchedTags', () => {
  const record = {
    tags: ['webdev', 'hugo'],
    series: ['Getting Started']
  }

  it('returns matching tags', () => {
    expect(getMatchedTags(record, 'webdev')).toEqual(['webdev'])
  })

  it('returns matching series', () => {
    expect(getMatchedTags(record, 'started')).toEqual(['Getting Started'])
  })

  it('returns empty array when no match', () => {
    expect(getMatchedTags(record, 'python')).toEqual([])
  })

  it('returns all matching tags and series', () => {
    expect(getMatchedTags(record, 'hugo')).toEqual(['hugo'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL — `rankRecord` and `getMatchedTags` are not exported

- [ ] **Step 3: Write the implementation**

Add to `assets/js/lib/search.js`:

```js
export function rankRecord(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return -1

  if (record.title.toLowerCase().includes(needle)) return 0
  if ((record.tags || []).some(t => t.toLowerCase().includes(needle))) return 1
  if ((record.series || []).some(s => s.toLowerCase().includes(needle))) return 1
  return 2
}

export function getMatchedTags(record, needle) {
  return [
    ...(record.tags || []).filter(t => t.toLowerCase().includes(needle)),
    ...(record.series || []).filter(s => s.toLowerCase().includes(needle))
  ]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: add rankRecord and getMatchedTags for search result ordering"
```

---

### Task 3: `extractContext` function

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/search.test.js`:

```js
describe('extractContext', () => {
  const record = {
    title: 'Test Post',
    tags: ['webdev'],
    series: [],
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    headings: ['## Introduction', '## Getting Started']
  }

  it('returns first 120 chars for tag match', () => {
    const result = extractContext(record, 'webdev')
    expect(result).toBe(record.content.slice(0, 120))
  })

  it('returns first 120 chars for title match', () => {
    const result = extractContext(record, 'test post')
    expect(result).toBe(record.content.slice(0, 120))
  })

  it('returns heading + content after heading for heading match', () => {
    const result = extractContext(record, 'introduction')
    expect(result).toContain('Introduction')
    expect(result.length).toBeGreaterThan(10)
  })

  it('returns surrounding context for content match', () => {
    const result = extractContext(record, 'tempor')
    expect(result).toContain('tempor')
    expect(result.length).toBeLessThanOrEqual(140)
  })

  it('trims to word boundaries', () => {
    const record2 = {
      ...record,
      content: 'abcdefghijklmnopqrstuvwxyz now there is tempor incididunt ut'
    }
    const result = extractContext(record2, 'tempor')
    expect(result).toMatch(/^\S/)
    expect(result).toMatch(/\S$/)
  })

  it('returns empty string when query is empty', () => {
    expect(extractContext(record, '')).toBe('')
  })

  it('handles match at start of content', () => {
    const record2 = { ...record, content: 'tempor is at the start of content.' }
    const result = extractContext(record2, 'tempor')
    expect(result).toContain('tempor')
  })

  it('handles match near end of content', () => {
    const short = { ...record, content: 'some text before the tempor word' }
    const result = extractContext(short, 'tempor')
    expect(result).toContain('tempor')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL — `extractContext` is not exported

- [ ] **Step 3: Write the implementation**

Add to `assets/js/lib/search.js`:

```js
const CONTEXT_LENGTH = 120

export function extractContext(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return ''

  const rank = rankRecord(record, query)

  if (rank <= 1) {
    return record.content.slice(0, CONTEXT_LENGTH)
  }

  const lowerContent = record.content.toLowerCase()

  for (const heading of (record.headings || [])) {
    const headingText = heading.replace(/^##+\s+/, '')
    if (headingText.toLowerCase().includes(needle)) {
      const headingPos = lowerContent.indexOf(headingText.toLowerCase())
      if (headingPos !== -1) {
        const afterHeading = record.content.slice(headingPos + headingText.length).trimStart()
        return headingText + ' ' + afterHeading.slice(0, CONTEXT_LENGTH)
      }
    }
  }

  const matchIndex = lowerContent.indexOf(needle)
  if (matchIndex === -1) return record.content.slice(0, CONTEXT_LENGTH)

  let start = Math.max(0, matchIndex - 60)
  let end = Math.min(record.content.length, matchIndex + needle.length + 60)

  if (start > 0 && record.content[start] !== ' ' && record.content[start - 1] !== ' ') {
    const nextSpace = record.content.indexOf(' ', start)
    if (nextSpace !== -1) start = nextSpace + 1
  }
  if (end < record.content.length && record.content[end - 1] !== ' ' && record.content[end] !== ' ') {
    const prevSpace = record.content.lastIndexOf(' ', end)
    if (prevSpace > start) end = prevSpace
  }

  let context = record.content.slice(start, end).trim()
  if (start > 0) context = '\u2026' + context
  if (end < record.content.length) context = context + '\u2026'

  return context
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: add extractContext for search result context snippets"
```

---

### Task 4: Update `filterSearchRecords` with enriched results and sorting

**Files:**
- Modify: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing tests**

Update the existing `filterSearchRecords` describe block. Replace the existing single test with:

```js
describe('filterSearchRecords', () => {
  it('returns enriched results with rank, context, and matchedTags', () => {
    const records = [
      { title: 'First Post', summary: 'Alpha', content: 'Search should find this paragraph.', permalink: '/posts/first-post/', tags: [], series: [], headings: [] },
      { title: 'Second Post', summary: 'Beta', content: 'Nothing relevant here.', permalink: '/posts/second-post/', tags: [], series: [], headings: [] }
    ]

    const results = filterSearchRecords(records, 'search')
    expect(results).toHaveLength(1)
    expect(results[0]._rank).toBe(2)
    expect(results[0]._context).toContain('search')
    expect(results[0]._matchedTags).toEqual([])
  })

  it('sorts by rank then alphabetically by title', () => {
    const records = [
      { title: 'Content Match', summary: '', content: 'The search word is here.', permalink: '/a/', tags: [], series: [], headings: [] },
      { title: 'Alpha Title', summary: '', content: 'No match.', permalink: '/b/', tags: [], series: [], headings: [] },
      { title: 'Beta Title', summary: '', content: 'No match.', permalink: '/c/', tags: [], series: [], headings: [] },
      { title: 'Zeta Tag Match', summary: '', content: 'No match.', permalink: '/d/', tags: ['search'], series: [], headings: [] }
    ]

    const results = filterSearchRecords(records, 'search')
    expect(results.map(r => r.title)).toEqual(['Alpha Title', 'Beta Title', 'Zeta Tag Match', 'Content Match'])
  })

  it('returns empty array when query is empty', () => {
    expect(filterSearchRecords([], '')).toEqual([])
    expect(filterSearchRecords([{ title: 'Test', content: 'x' }], '  ')).toEqual([])
  })

  it('includes matched tags in _matchedTags', () => {
    const records = [
      { title: 'Post', summary: '', content: 'text', permalink: '/p/', tags: ['hugo', 'web'], series: ['tutorial'], headings: [] }
    ]

    const results = filterSearchRecords(records, 'web')
    expect(results[0]._matchedTags).toEqual(['web'])
  })

  it('includes matched series in _matchedTags', () => {
    const records = [
      { title: 'Post', summary: '', content: 'text', permalink: '/p/', tags: [], series: ['tutorial'], headings: [] }
    ]

    const results = filterSearchRecords(records, 'tutorial')
    expect(results[0]._matchedTags).toEqual(['tutorial'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL — results don't have `_rank`, `_context`, `_matchedTags` properties

- [ ] **Step 3: Update `filterSearchRecords` implementation**

Replace the existing `filterSearchRecords` in `assets/js/lib/search.js`:

```js
export function filterSearchRecords(records, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return records
    .filter((record) => {
      const haystack = [record.title, ...(record.tags || []), ...(record.series || []), record.content, ...(record.headings || [])].join(' ').toLowerCase()
      return haystack.includes(needle)
    })
    .map(record => ({
      ...record,
      _rank: rankRecord(record, needle),
      _context: extractContext(record, needle),
      _matchedTags: getMatchedTags(record, needle)
    }))
    .sort((a, b) => {
      if (a._rank !== b._rank) return a._rank - b._rank
      return a.title.localeCompare(b.title)
    })
}
```

Note: also update the filter haystack to include `tags` and `series` explicitly (they were already included indirectly via the old haystack construction, but this is more explicit and correct — the old code joined `title`, `summary`, `content`, `headings` which would miss tags/series).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: enrich search results with rank, context, and matched tags"
```

---

### Task 5: CSS styles for `<mark>` and active result

**Files:**
- Modify: `assets/css/app.css`

- [ ] **Step 1: Add highlight and active result styles**

Add to `assets/css/app.css` after the TOC styles (before the final `#TableOfContents li` rule, or at the end):

```css
mark {
  background-color: var(--color-accent);
  color: var(--color-surface);
  border-radius: 0.125rem;
  padding: 0.0625rem 0.1875rem;
}
```

No active-result-specific CSS needed — Tailwind classes (`bg-purple-50 border-purple-400`) handle the active state. These are already covered by the existing dark mode overrides for `border-purple-*`.

- [ ] **Step 2: Commit**

```bash
git add assets/css/app.css
git commit -m "feat: add mark/highlight styling for search results"
```

---

### Task 6: Alpine state changes for keyboard navigation

**Files:**
- Modify: `assets/js/app.js`

- [ ] **Step 1: Update imports**

Change line 3 from:
```js
import { filterSearchRecords, loadSearchRecords } from './lib/search.js'
```
to:
```js
import { filterSearchRecords, loadSearchRecords, highlightText } from './lib/search.js'
```

- [ ] **Step 2: Add new state and methods to `siteUi`**

Add `activeResultIndex: -1` and `highlightText` to the data object (after `tocOpen: false,`):

```js
  activeResultIndex: -1,
  highlightText,
```

Add `selectNextResult`, `selectPrevResult`, and `navigateToActiveResult` methods (after `closeToc()`):

```js
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
    if (target) window.location.href = target.permalink
  },
  scrollActiveResultIntoView() {
    this.$nextTick(() => {
      const active = document.querySelector(`[data-result-index="${this.activeResultIndex}"]`)
      active?.scrollIntoView({ block: 'nearest' })
    })
  },
```

- [ ] **Step 3: Reset `activeResultIndex` when query changes**

Add inside `init()`, after all the existing `addEventListener` calls and the `focusin` handler (at the end of `init()`, before the closing `},`):

```js
    this.$watch('query', () => { this.activeResultIndex = -1 })
```

- [ ] **Step 4: Reset `activeResultIndex` in `closeSearch`**

Update `closeSearch()` to also reset the active index:

```js
  closeSearch() {
    this.searchOpen = false
    this.query = ''
    this.activeResultIndex = -1
  },
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: add keyboard navigation state for search results"
```

---

### Task 7: Update search dialog template

**Files:**
- Modify: `layouts/_partials/header.html`

- [ ] **Step 1: Replace close button text with x icon**

Replace the close button (lines 41-48):

```html
            <button
              type="button"
              aria-label="Close search"
              @click="closeSearch"
              class="rounded border border-purple-300 px-3 py-2"
            >
              Close
            </button>
```

with:

```html
            <button
              type="button"
              aria-label="Close search"
              @click="closeSearch"
              class="inline-flex items-center justify-center rounded border border-purple-300 p-2"
            >
              {{ partial "icon.html" (dict "name" "x" "class" "h-4 w-4") }}
            </button>
```

- [ ] **Step 2: Add keyboard handlers to search input**

Update the input element (line 36-39) to add `@keydown` handlers:

```html
            <input
              x-model="query"
              placeholder="Search posts"
              class="w-full rounded border border-purple-300 px-3 py-2"
              @keydown.enter.prevent="navigateToActiveResult()"
              @keydown.arrow-down.prevent="selectNextResult()"
              @keydown.arrow-up.prevent="selectPrevResult()"
            />
```

- [ ] **Step 3: Update results template with context and highlighting**

Replace the results section (lines 50-58):

```html
          <div class="mt-4 space-y-2">
            <template x-for="result in results" :key="result.permalink">
              <a
                :href="result.permalink"
                x-text="result.title"
                class="block rounded border border-purple-200 px-3 py-2"
              ></a>
            </template>
          </div>
```

with:

```html
          <div data-results-container class="mt-4 space-y-2 max-h-80 overflow-y-auto">
            <template x-for="(result, index) in results" :key="result.permalink">
              <a
                :href="result.permalink"
                :data-result-index="index"
                class="block rounded border px-3 py-2 transition-colors"
                :class="index === activeResultIndex
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-purple-200 hover:border-purple-300'"
              >
                <div x-html="highlightText(result.title, query)" class="font-medium"></div>
                <template x-if="result._matchedTags?.length">
                  <div class="flex flex-wrap gap-1 mt-1">
                    <template x-for="tag in result._matchedTags" :key="tag">
                      <span x-html="highlightText(tag, query)" class="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs"></span>
                    </template>
                  </div>
                </template>
                <div
                  x-show="result._context"
                  x-html="highlightText(result._context, query)"
                  class="mt-1 text-sm text-slate-500 line-clamp-2"
                ></div>
              </a>
            </template>
          </div>
```

- [ ] **Step 4: Commit**

```bash
git add layouts/_partials/header.html
git commit -m "feat: update search dialog with context, highlights, close icon, and keyboard nav"
```

---

### Task 8: Update E2E tests

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Update existing search tests**

The existing `"search opens and shows matching posts"` test at line 652 needs updating because the result link now uses `x-html` (the title is inside a child div, not direct text of the link). Update the test to verify the highlighted title and context:

```js
test("search opens and shows matching posts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  const resultLink = page.getByRole("link", { name: /First Post/ });
  await expect(resultLink).toBeVisible();
  await expect(resultLink.locator("mark")).toHaveText("paragraph");

  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.getByPlaceholder("Search posts")).toBeHidden();

  await page.getByRole("button", { name: "Search" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
});
```

- [ ] **Step 2: Add keyboard navigation tests**

Add after the existing search tests:

```js
test("search Enter navigates to first result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    page.keyboard.press("Enter")
  ]);

  await newPage.waitForLoadState("domcontentloaded");
  await expect(newPage).toHaveURL(/first-post/);
});

test("search arrow keys navigate results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");

  const results = page.locator("[data-result-index]");
  const count = await results.count();

  await page.keyboard.press("ArrowDown");
  await expect(results.nth(0)).toHaveClass(/border-purple-400/);

  await page.keyboard.press("ArrowDown");
  await expect(results.nth(1)).toHaveClass(/border-purple-400/);
  await expect(results.nth(0)).not.toHaveClass(/border-purple-400/);

  await page.keyboard.press("ArrowUp");
  await expect(results.nth(0)).toHaveClass(/border-purple-400/);
  await expect(results.nth(1)).not.toHaveClass(/border-purple-400/);
});

test("search wraps around with arrow keys", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");

  const results = page.locator("[data-result-index]");
  const last = (await results.count()) - 1;

  await page.keyboard.press("ArrowUp");
  await expect(results.nth(last)).toHaveClass(/border-purple-400/);

  await page.keyboard.press("ArrowDown");
  await expect(results.nth(0)).toHaveClass(/border-purple-400/);
});
```

- [ ] **Step 3: Add context and highlight rendering tests**

```js
test("search results show highlighted context", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  const resultLink = page.getByRole("link", { name: /First Post/ });
  await expect(resultLink.locator("text=/paragraph/")).toBeVisible();
});
```

- [ ] **Step 4: Run all E2E tests**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: update and add search E2E tests for highlights and keyboard nav"
```

---

### Task 9: Full verification

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Run all E2E tests**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test`
Expected: ALL PASS

- [ ] **Step 3: Visual spot-check**

Run: `npm run dev` and manually verify:
- Search results show post titles with highlighted query text
- Context snippets appear below titles with highlighted matches
- Tag/series matches show tag chips
- Arrow keys navigate between results with visual highlight
- Enter navigates to the first (or active) result
- Close button shows x icon
- Escape closes search
- Results are ordered: title matches first, then tags, then content

# Search Metadata And Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update search so it ranks and snippets against summary before content, always shows full metadata with matching items first, and removes heading-specific search behavior.

**Architecture:** Simplify the search index and utility layer by removing heading extraction entirely, then re-rank records across title, metadata, summary, and content. Keep the UI logic in the existing header partial, but switch metadata rendering from matched-only arrays to full ordered arrays with whole-item emphasis for matches.

**Tech Stack:** Hugo templates, Alpine.js, vanilla JS ES modules, Vitest, Playwright.

---

### Task 1: Remove heading-specific index data and unit coverage

**Files:**
- Modify: `layouts/index.json`
- Modify: `tests/unit/search.test.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing unit assertions for the new index template behavior**

Replace the heading-template assertion block in `tests/unit/search.test.js` with:

```js
describe('search index template', () => {
  it('does not emit a headings field in the search index', () => {
    const template = readFileSync(new URL('../../layouts/index.json', import.meta.url), 'utf8')

    expect(template).not.toContain('"headings"')
    expect(template).not.toContain('findRE')
  })

  it('sanitizes heading-link hashes from emitted content', () => {
    const template = readFileSync(new URL('../../layouts/index.json', import.meta.url), 'utf8')

    expect(template).toContain('replaceRE')
    expect(template).toContain('\\s+#+\\s*$')
  })
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL because `layouts/index.json` still emits `headings` and uses `findRE`.

- [ ] **Step 3: Remove `headings` from the index and sanitize `content`**

Update `layouts/index.json` to stop emitting heading data and strip trailing heading-link hashes from `.Plain` content:

```go-html-template
{{- $records := slice -}}
{{- range where site.RegularPages "Section" "posts" -}}
  {{- $content := .Plain | replaceRE `(?m)\s+#+\s*$` "" -}}
  {{- $records = $records | append (dict
    "title" .Title
    "summary" (.Summary | plainify)
    "content" $content
    "permalink" .RelPermalink
    "tags" (.Params.tags | default (slice))
    "series" (.Params.series | default (slice))
  ) -}}
{{- end -}}
{{- $records | jsonify -}}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS for the template assertions and no new failures outside the remaining planned search utility changes.

- [ ] **Step 5: Commit the index cleanup**

```bash
git add layouts/index.json tests/unit/search.test.js
git commit -m "refactor: remove heading data from the search index"
```

---

### Task 2: Re-rank search records and prefer summary snippets

**Files:**
- Modify: `assets/js/lib/search.js`
- Modify: `tests/unit/search.test.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing unit tests for the new ranking and snippet hierarchy**

Update the rank and context tests in `tests/unit/search.test.js` so they no longer depend on `headings`, and add these cases:

```js
describe('rankRecord', () => {
  const record = {
    title: 'Hugo Tutorial',
    tags: ['webdev', 'hugo'],
    series: ['Getting Started'],
    summary: 'A short summary about setup.',
    content: 'This is some content about Hugo.'
  }

  it('returns 2 for summary match', () => {
    expect(rankRecord(record, 'setup')).toBe(2)
  })

  it('returns 3 for content match', () => {
    expect(rankRecord(record, 'content')).toBe(3)
  })
})

describe('extractContext', () => {
  const record = {
    title: 'Test Post',
    tags: ['webdev'],
    series: ['Guides'],
    summary: 'Summary text that mentions setup clearly.',
    content: 'Longer body content that also mentions setup later in the article.'
  }

  it('uses summary for metadata matches when summary exists', () => {
    expect(extractContext(record, 'webdev')).toBe('Summary text that mentions setup clearly.')
  })

  it('uses summary when the summary matches', () => {
    expect(extractContext(record, 'setup')).toBe('Summary text that mentions setup clearly.')
  })

  it('falls back to opening content when summary is empty', () => {
    expect(extractContext({ ...record, summary: '' }, 'webdev')).toBe('Longer body content that also mentions setup later in the article.'.slice(0, 120))
  })
})

describe('filterSearchRecords', () => {
  it('matches summary before content in rank ordering', () => {
    const records = [
      { title: 'Content Match', summary: '', content: 'setup appears only in content', permalink: '/content/', tags: [], series: [] },
      { title: 'Summary Match', summary: 'setup appears in summary', content: 'nothing else', permalink: '/summary/', tags: [], series: [] }
    ]

    const results = filterSearchRecords(records, 'setup')
    expect(results.map((result) => result.title)).toEqual(['Summary Match', 'Content Match'])
    expect(results[0]._context).toBe('setup appears in summary')
  })
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js`
Expected: FAIL because the current search utility still ranks only title/metadata/content and still returns heading-based snippet objects.

- [ ] **Step 3: Simplify the search utility and implement the new hierarchy**

Update `assets/js/lib/search.js` so:

```js
export function rankRecord(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return -1

  if ((record.title || '').toLowerCase().includes(needle)) return 0
  if ((record.series || []).some((item) => item.toLowerCase().includes(needle))) return 1
  if ((record.tags || []).some((item) => item.toLowerCase().includes(needle))) return 1
  if (decodeText(record.summary || '').toLowerCase().includes(needle)) return 2
  return 3
}

export function extractContext(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return ''

  const summary = decodeText(record.summary || '')
  const content = decodeText(record.content || '')
  const rank = rankRecord(record, query)

  if (rank <= 1) {
    return (summary || content).slice(0, CONTEXT_LENGTH)
  }

  if (rank === 2) {
    return summary.slice(0, CONTEXT_LENGTH)
  }

  const lowerContent = content.toLowerCase()
  const matchIndex = lowerContent.indexOf(needle)
  if (matchIndex === -1) return content.slice(0, CONTEXT_LENGTH)

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

  let context = content.slice(start, end).trim()
  if (start > 0) context = '…' + context
  if (end < content.length) context = context + '…'
  return context
}
```

Also update `filterSearchRecords()` to search `summary` instead of `headings` and to stop emitting `_snippetKind` / `_heading`.

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS.

- [ ] **Step 5: Commit the search hierarchy changes**

```bash
git add assets/js/lib/search.js tests/unit/search.test.js
git commit -m "feat: prioritize summary in search ranking and snippets"
```

---

### Task 3: Always render full metadata with matching items first

**Files:**
- Modify: `assets/js/lib/search.js`
- Modify: `layouts/_partials/header.html`
- Modify: `tests/unit/search.test.js`
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/unit/search.test.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing unit and end-to-end tests**

Add unit coverage to `tests/unit/search.test.js` for ordered full metadata arrays:

```js
describe('filterSearchRecords metadata ordering', () => {
  it('keeps all series and tags and moves matching items first', () => {
    const records = [{
      title: 'Post',
      summary: 'Summary',
      content: 'Body',
      permalink: '/post/',
      tags: ['alpha', 'needle tag', 'omega'],
      series: ['guide', 'needle series']
    }]

    const [result] = filterSearchRecords(records, 'needle')

    expect(result._orderedSeries).toEqual(['needle series', 'guide'])
    expect(result._orderedTags).toEqual(['needle tag', 'alpha', 'omega'])
  })
})
```

Replace the heading-prefix E2E test in `tests/e2e/theme.spec.js` with coverage like:

```js
test("search shows all metadata and orders matching items first", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()
  await page.getByPlaceholder("Search posts").fill("fixture")

  const result = page.locator("[data-result-index]").first()
  const metadata = result.locator(".search-result-meta > *")

  await expect(metadata.first()).toContainText(/fixture/i)
  await expect(metadata).toHaveCountGreaterThan(1)
})

test("search uses summary text in the snippet when summary matches", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Search" }).click()
  await page.getByPlaceholder("Search posts").fill("summary")

  await expect(page.locator("[data-result-index]").first().locator(".search-result-excerpt")).toContainText(/summary/i)
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run tests/unit/search.test.js && lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search shows all metadata|search uses summary text"`
Expected: FAIL because the UI still renders matched-only metadata arrays and still has heading-specific assertions.

- [ ] **Step 3: Add ordered full metadata arrays in the search results**

Update `assets/js/lib/search.js` to include ordered arrays for rendering:

```js
function orderMetadata(items = [], needle) {
  const matching = []
  const rest = []

  for (const item of items) {
    if (item.toLowerCase().includes(needle)) {
      matching.push(item)
    } else {
      rest.push(item)
    }
  }

  return [...matching, ...rest]
}
```

Then emit `_orderedSeries` and `_orderedTags` from `filterSearchRecords()` instead of matched-only display arrays.

- [ ] **Step 4: Update the result template for single-row metadata rendering**

Adjust the metadata row in `layouts/_partials/header.html`:

```html
<div class="search-result-meta mt-1 flex min-h-[1.25rem] items-center gap-1.5 overflow-hidden whitespace-nowrap">
  <template x-for="series in (result._orderedSeries || [])" :key="`series-${series}`">
    <span
      x-text="series"
      class="shrink-0 text-xs underline"
      :class="series.toLowerCase().includes(query.trim().toLowerCase()) ? 'search-meta-match' : ''"
    ></span>
  </template>
  <template x-for="tag in (result._orderedTags || [])" :key="`tag-${tag}`">
    <span
      x-text="tag"
      class="inline-block shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs"
      :class="tag.toLowerCase().includes(query.trim().toLowerCase()) ? 'search-meta-match search-meta-chip-match' : ''"
    ></span>
  </template>
</div>
<div x-show="result._context" class="search-result-excerpt mt-1 text-sm text-slate-500">
  <span x-html="highlightText(result._context, query)"></span>
</div>
```

This removes the heading-specific branch and keeps the metadata row to a single clipped line.

- [ ] **Step 5: Run the focused tests to verify they pass**

Run: `npx vitest run tests/unit/search.test.js && lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search shows all metadata|search uses summary text|search caps the visible results area"`
Expected: PASS.

- [ ] **Step 6: Commit the metadata-row changes**

```bash
git add assets/js/lib/search.js layouts/_partials/header.html tests/unit/search.test.js tests/e2e/theme.spec.js
git commit -m "feat: show full ordered metadata in search results"
```

---

### Task 4: Run verification for the full search behavior

**Files:**
- Test: `tests/unit/search.test.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Run the unit suite**

Run: `npx vitest run tests/unit/search.test.js`
Expected: PASS.

- [ ] **Step 2: Run the search-focused Playwright slice**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search"`
Expected: PASS.

- [ ] **Step 3: Inspect the worktree for unintended lockfile churn**

Run: `git status --short`
Expected: only the intended search files remain modified.

- [ ] **Step 4: Commit final verification fixes if needed**

```bash
git add assets/js/lib/search.js layouts/index.json layouts/_partials/header.html tests/unit/search.test.js tests/e2e/theme.spec.js
git commit -m "fix: finalize search metadata and summary behavior"
```

Only perform this commit if verification required follow-up code changes.

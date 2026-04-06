# Pass 1 Fixtures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the example-site fixture content so TOC behavior, built-in shortcodes, tags, and four-part series coverage are exercised before the later typography/layout pass.

**Architecture:** This pass is content-first. It adds richer fixture posts under `exampleSite/content/posts/` and extends the existing Playwright suite to target those fixtures directly. Theme/template changes are out of scope unless a new fixture exposes a small blocking bug that prevents the fixture from being useful.

**Tech Stack:** Hugo, Markdown content, exampleSite YAML config, Playwright, Vitest

---

## File Structure Map

- Create: `exampleSite/content/posts/toc-stress-post.md` - long-form TOC fixture with `##`, `###`, and `####` headings and long text gaps between sections
- Create: `exampleSite/content/posts/shortcodes-builtins.md` - built-in shortcode fixture with featured image and tags
- Create: `exampleSite/content/posts/series-part-1.md` - first post in shared four-part series fixture
- Create: `exampleSite/content/posts/series-part-2.md` - second post in shared four-part series fixture
- Create: `exampleSite/content/posts/series-part-3.md` - third post in shared four-part series fixture
- Create: `exampleSite/content/posts/series-part-4.md` - fourth post in shared four-part series fixture
- Modify: `tests/e2e/theme.spec.js` - extend current E2E coverage to target the new fixtures instead of creating many standalone tests
- Optionally modify: `exampleSite/content/posts/first-post.md` or `second-post.md` only if a tiny metadata adjustment is needed to keep coverage clean and deterministic

### Task 1: Add The TOC Stress Fixture

**Files:**
- Create: `exampleSite/content/posts/toc-stress-post.md`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing E2E coverage for the TOC fixture**

```js
test('toc stress post renders deep TOC entries', async ({ page }) => {
  await page.goto('/posts/toc-stress-post/')

  await expect(page.getByRole('heading', { name: 'TOC Stress Post' })).toBeVisible()
  await expect(page.locator('#TableOfContents')).toContainText('Large Section One')
  await expect(page.locator('#TableOfContents')).toContainText('Nested Layer A')
  await expect(page.locator('#TableOfContents')).toContainText('Deep Detail I')
})

test('toc stress post allows meaningful jump navigation', async ({ page }) => {
  await page.goto('/posts/toc-stress-post/')

  await page.getByRole('link', { name: 'Final Long Section', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#final-long-section')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "toc stress"`
Expected: FAIL because `/posts/toc-stress-post/` does not exist yet

- [ ] **Step 3: Write the minimal TOC fixture implementation**

```md
---
title: TOC Stress Post
date: 2026-04-06
summary: A long post for TOC rendering and scroll behavior.
tags: [toc, longform, testing]
---

## Large Section One

This opening section should contain enough prose to create a meaningful scroll distance before the next heading. Repeat explanatory copy until the section is visually long in the built page and gives the TOC highlight logic room to move.

### Nested Layer A

More body text lives here so the nested heading is not immediately adjacent to the next one. Keep this section substantial enough that a click into it moves the viewport clearly.

#### Deep Detail I

This is the deepest heading level used in the fixture. Add another paragraph or two so it is not a tiny one-line section.

### Nested Layer B

This section continues the long-form pattern with enough body content to create separation from the following top-level section.

## Large Section Two

Write another visibly long section here. The purpose is to make TOC active-state changes obvious while scrolling.

### Nested Layer C

Add a few paragraphs of filler text focused on structure and testing.

#### Deep Detail II

This sub-subsection should also have real body copy, not only a short sentence.

## Final Long Section

This final section exists so clicking its TOC entry causes a meaningful jump down the page. It should contain enough content to make the page end well below the earlier sections.
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "toc stress"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add exampleSite/content/posts/toc-stress-post.md tests/e2e/theme.spec.js
git commit -m "test: add toc stress fixture"
```

### Task 2: Add The Built-In Shortcodes Fixture

**Files:**
- Create: `exampleSite/content/posts/shortcodes-builtins.md`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing E2E coverage for the shortcode fixture**

```js
test('shortcodes fixture renders built-in shortcode content with featured image', async ({ page }) => {
  await page.goto('/posts/shortcodes-builtins/')

  await expect(page.getByRole('heading', { name: 'Built-In Shortcodes Post' })).toBeVisible()
  await expect(page.locator('article img')).toHaveCount(1)
  await expect(page.getByRole('main')).toContainText('Inline notice rendered through a Hugo shortcode example.')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "shortcodes fixture"`
Expected: FAIL because `/posts/shortcodes-builtins/` does not exist yet

- [ ] **Step 3: Write the minimal shortcode fixture implementation**

```md
---
title: Built-In Shortcodes Post
date: 2026-04-07
summary: A fixture covering supported built-in Hugo shortcodes.
tags: [shortcodes, hugo, testing]
featuredImage: /images/post-1.jpg
---

## Overview

This post exists to exercise built-in shortcode rendering in the theme.

{{< highlight go >}}
func main() {
  println("hello from shortcode fixture")
}
{{< /highlight >}}

## Message

Inline notice rendered through a Hugo shortcode example.

{{< figure src="/images/post-1.jpg" alt="Fixture image" caption="Shortcode figure" >}}

## More Content

This section keeps the post from being only shortcode blocks.
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "shortcodes fixture"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add exampleSite/content/posts/shortcodes-builtins.md tests/e2e/theme.spec.js
git commit -m "test: add shortcode fixture post"
```

### Task 3: Add The Four-Part Series Fixtures

**Files:**
- Create: `exampleSite/content/posts/series-part-1.md`
- Create: `exampleSite/content/posts/series-part-2.md`
- Create: `exampleSite/content/posts/series-part-3.md`
- Create: `exampleSite/content/posts/series-part-4.md`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing E2E coverage for the series fixtures**

```js
test('series fixture posts render shared series metadata', async ({ page }) => {
  await page.goto('/posts/series-part-1/')

  await expect(page.getByRole('heading', { name: 'Series Part 1' })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('fixture-series')
})

test('series term page lists all four parts', async ({ page }) => {
  await page.goto('/series/fixture-series/')

  await expect(page.getByText('Series Part 1')).toBeVisible()
  await expect(page.getByText('Series Part 2')).toBeVisible()
  await expect(page.getByText('Series Part 3')).toBeVisible()
  await expect(page.getByText('Series Part 4')).toBeVisible()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "series fixture|series term page"`
Expected: FAIL because the fixture posts and series term page content do not exist yet

- [ ] **Step 3: Write the minimal series fixture implementation**

```md
---
title: Series Part 1
date: 2026-04-08
summary: First post in the shared fixture series.
series: [fixture-series]
tags: [series, fixture, part-1]
---

## Opening

This is the first part of the shared series fixture.
```

```md
---
title: Series Part 2
date: 2026-04-09
summary: Second post in the shared fixture series.
series: [fixture-series]
tags: [series, fixture, part-2]
---

## Continuation

This is the second part of the shared series fixture.
```

```md
---
title: Series Part 3
date: 2026-04-10
summary: Third post in the shared fixture series.
series: [fixture-series]
tags: [series, fixture, part-3]
---

## Expansion

This is the third part of the shared series fixture.
```

```md
---
title: Series Part 4
date: 2026-04-11
summary: Fourth post in the shared fixture series.
series: [fixture-series]
tags: [series, fixture, part-4]
---

## Wrap Up

This is the fourth part of the shared series fixture.
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "series fixture|series term page"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add exampleSite/content/posts/series-part-1.md exampleSite/content/posts/series-part-2.md exampleSite/content/posts/series-part-3.md exampleSite/content/posts/series-part-4.md tests/e2e/theme.spec.js
git commit -m "test: add series fixture posts"
```

### Task 4: Extend Existing Taxonomy And Listing Coverage

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing E2E checks for richer taxonomy/list coverage**

```js
test('archive page includes new fixture posts', async ({ page }) => {
  await page.goto('/archives/')

  await expect(page.getByText('TOC Stress Post')).toBeVisible()
  await expect(page.getByText('Built-In Shortcodes Post')).toBeVisible()
  await expect(page.getByText('Series Part 4')).toBeVisible()
})

test('tag term page includes multiple fixture types', async ({ page }) => {
  await page.goto('/tags/fixture/')

  await expect(page.getByText('Series Part 1')).toBeVisible()
  await expect(page.getByText('Series Part 2')).toBeVisible()
  await expect(page.getByText('Series Part 3')).toBeVisible()
  await expect(page.getByText('Series Part 4')).toBeVisible()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "includes new fixture posts|multiple fixture types"`
Expected: FAIL until the suite is updated to target the new content correctly

- [ ] **Step 3: Write the minimal test extension implementation**

```js
// Extend the existing archive and taxonomy expectations in tests/e2e/theme.spec.js
// so they explicitly assert the new fixture titles appear in archive/tag routes.
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js`
Expected: PASS with the richer fixture set covered by the existing suite

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: extend fixture coverage"
```

## Self-Review

### Spec Coverage

- TOC stress post with deep headings and long text: Task 1
- Built-in shortcode fixture with featured image: Task 2
- Four-part tagged series fixture: Task 3
- Prefer extending existing E2E tests: Tasks 1 through 4
- Keep presentation changes out of scope unless a blocking bug appears: reflected in all tasks by limiting changes to content and tests

No spec gaps remain.

### Placeholder Scan

- No `TODO` or `TBD` placeholders remain.
- Every task includes exact file paths, concrete test commands, and concrete content examples.
- No task relies on “similar to above” shortcuts.

### Type Consistency

- Fixture titles and slugs remain consistent across post files and E2E expectations.
- Shared series value stays `fixture-series` across all series tasks.
- Shared tag value stays `fixture` where taxonomy aggregation is expected.

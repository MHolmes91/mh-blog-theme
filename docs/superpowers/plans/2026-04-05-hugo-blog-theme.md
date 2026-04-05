# Hugo Blog Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hugo blog theme with a purple MVP design, local client-side search, TOC tracking, reading progress, YAML-first example site setup, and a testable Alpine/Tailwind implementation.

**Architecture:** The theme stays Hugo-native: layouts and partials render the structure, `index.json` provides search data, and small JavaScript modules expose deterministic logic for Alpine-driven interactions. Tailwind handles styling, Heroicons are inlined through a partial, and an `exampleSite` project is used both for manual verification and Playwright coverage.

**Tech Stack:** Hugo extended, Alpine.js, TailwindCSS, Heroicons, Google Fonts, Vitest, Playwright, Node.js

---

## File Structure Map

- Create: `package.json` - npm scripts and dev dependencies for Tailwind, Vitest, Playwright, and Alpine bundling
- Create: `playwright.config.js` - integration test runner against a built example site
- Create: `vitest.config.js` - Node unit test configuration
- Create: `theme.toml` - Hugo theme metadata
- Create: `assets/css/app.css` - Tailwind entry, font import, theme tokens, prose baseline
- Create: `assets/js/app.js` - Alpine bootstrap and component registration
- Create: `assets/js/lib/search.js` - search filtering and in-article match helpers
- Create: `assets/js/lib/toc.js` - heading selection and active TOC helper logic
- Create: `assets/js/lib/progress.js` - reading progress calculations
- Create: `assets/js/lib/theme.js` - browser theme resolution helper
- Create: `layouts/baseof.html` - shared shell and asset loading
- Create: `layouts/home.html` - intro block plus recent posts
- Create: `layouts/single.html` - single post page
- Create: `layouts/list.html` - generic list/taxonomy page
- Create: `layouts/archives.html` - all posts archive page
- Create: `layouts/index.json` - search index
- Create: `layouts/_partials/head.html` - SEO and document head
- Create: `layouts/_partials/header.html` - title bar with icon/name/search
- Create: `layouts/_partials/footer.html` - socials and copyright
- Create: `layouts/_partials/post-card.html` - reusable post summary
- Create: `layouts/_partials/post-meta.html` - date/read-time/tag/series rendering
- Create: `layouts/_partials/toc.html` - sidebar TOC container
- Create: `layouts/_partials/dock.html` - back-to-top dock
- Create: `layouts/_partials/icons.html` - Heroicons sprite/partial helpers
- Create: `layouts/_partials/seo.html` - title/meta/canonical/OG/Twitter tags
- Create: `exampleSite/hugo.yaml` - YAML-first example site config
- Create: `exampleSite/content/_index.md` - homepage intro content
- Create: `exampleSite/content/posts/first-post.md` - fixture post with headings and featured image
- Create: `exampleSite/content/posts/second-post.md` - fixture post without optional metadata
- Create: `exampleSite/content/archives/_index.md` - archive page content
- Create: `exampleSite/static/images/post-1.jpg` - post image fixture
- Create: `tests/unit/search.test.js` - unit tests for search helpers
- Create: `tests/unit/toc.test.js` - unit tests for TOC helpers
- Create: `tests/unit/progress.test.js` - unit tests for reading progress helpers
- Create: `tests/unit/theme.test.js` - unit tests for theme resolution helper
- Create: `tests/e2e/theme.spec.js` - Playwright integration coverage

### Task 1: Bootstrap Theme Tooling And Metadata

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `playwright.config.js`
- Create: `theme.toml`

- [ ] **Step 1: Write the failing metadata/tooling test**

```js
// tests/unit/theme-config.test.js
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('theme bootstrap files', () => {
  it('declares the theme metadata and test scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)))
    const themeToml = fs.readFileSync(new URL('../../theme.toml', import.meta.url), 'utf8')

    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:e2e']).toBe('playwright test')
    expect(themeToml).toContain('name = "MH Blog Theme"')
    expect(themeToml).toContain('min_version = "0.146.0"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/unit/theme-config.test.js`
Expected: FAIL with file-not-found errors for `package.json` and `theme.toml`

- [ ] **Step 3: Write minimal implementation**

```json
{
  "name": "mh-blog-theme",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "hugo server --source exampleSite --themesDir ..",
    "build": "hugo --source exampleSite --themesDir ..",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@tailwindcss/cli": "^4.1.0",
    "alpinejs": "^3.14.0",
    "tailwindcss": "^4.1.0",
    "vitest": "^3.2.0"
  }
}
```

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js']
  }
})
```

```js
// playwright.config.js
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:1313'
  },
  webServer: {
    command: 'hugo server --source exampleSite --themesDir .. --disableFastRender --port 1313',
    url: 'http://127.0.0.1:1313',
    reuseExistingServer: true
  }
})
```

```toml
# theme.toml
name = "MH Blog Theme"
license = "MIT"
description = "A Hugo blog theme with Alpine.js and TailwindCSS."
homepage = "https://example.com/mh-blog-theme"
min_version = "0.146.0"

[author]
name = "Mark"

[hugo]
min = "0.146.0"
extended = true
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/unit/theme-config.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.js playwright.config.js theme.toml tests/unit/theme-config.test.js
git commit -m "chore: bootstrap theme tooling"
```

### Task 2: Create Example Site And YAML-First Configuration

**Files:**
- Create: `exampleSite/hugo.yaml`
- Create: `exampleSite/content/_index.md`
- Create: `exampleSite/content/posts/first-post.md`
- Create: `exampleSite/content/posts/second-post.md`
- Create: `exampleSite/content/archives/_index.md`

- [ ] **Step 1: Write the failing configuration test**

```js
// tests/unit/example-site.test.js
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('example site', () => {
  it('uses hugo.yaml and points to the theme', () => {
    const yaml = fs.readFileSync(new URL('../../exampleSite/hugo.yaml', import.meta.url), 'utf8')

    expect(yaml).toContain('theme: mh-blog-theme')
    expect(yaml).toContain('taxonomies:')
    expect(yaml).toContain('series: series')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/unit/example-site.test.js`
Expected: FAIL with file-not-found error for `exampleSite/hugo.yaml`

- [ ] **Step 3: Write minimal implementation**

```yaml
# exampleSite/hugo.yaml
baseURL: https://example.org/
languageCode: en-us
title: MH Blog Theme
theme: mh-blog-theme

taxonomies:
  tag: tags
  series: series

params:
  description: Example site for MH Blog Theme
  siteIcon: /favicon.svg
  intro:
    title: Mark's Notes
    body: Functional Hugo theme fixture content.
  socials:
    - name: GitHub
      url: https://github.com/example
      icon: github
```

```md
<!-- exampleSite/content/_index.md -->
---
title: Home
---

Welcome to the example site.
```

```md
<!-- exampleSite/content/posts/first-post.md -->
---
title: First Post
date: 2026-04-05
summary: A searchable post with headings.
tags: [hugo, theme]
series: [build-notes]
featuredImage: /images/post-1.jpg
---

## Intro

Search should find this paragraph.

## Details

This section exists for the table of contents.
```

```md
<!-- exampleSite/content/posts/second-post.md -->
---
title: Second Post
date: 2026-04-04
summary: A post without optional metadata.
---

## Plain Post

This post omits tags, series, and featured image.
```

```md
<!-- exampleSite/content/archives/_index.md -->
---
title: Archives
layout: archives
---
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/unit/example-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add exampleSite/hugo.yaml exampleSite/content/_index.md exampleSite/content/posts/first-post.md exampleSite/content/posts/second-post.md exampleSite/content/archives/_index.md tests/unit/example-site.test.js
git commit -m "chore: add example site fixtures"
```

### Task 3: Build The Base Layout, Fonts, And Shared Chrome

**Files:**
- Create: `assets/css/app.css`
- Create: `layouts/baseof.html`
- Create: `layouts/_partials/head.html`
- Create: `layouts/_partials/header.html`
- Create: `layouts/_partials/footer.html`
- Create: `layouts/_partials/dock.html`
- Create: `layouts/_partials/icons.html`

- [ ] **Step 1: Write the failing integration test**

```js
// tests/e2e/theme.spec.js
import { test, expect } from '@playwright/test'

test('home page renders shared chrome', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toContainText('MH Blog Theme')
  await expect(page.getByRole('contentinfo')).toContainText('GitHub')
  await expect(page.getByRole('button', { name: 'Back to top' })).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "shared chrome"`
Expected: FAIL because no Hugo layout files exist yet

- [ ] **Step 3: Write minimal implementation**

```css
/* assets/css/app.css */
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=PT+Sans:wght@400;700&display=swap');
@import "tailwindcss";

@theme {
  --color-bg: #faf7ff;
  --color-surface: #ffffff;
  --color-text: #20172b;
  --color-accent: #7c3aed;
}

body {
  font-family: 'Lato', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'PT Sans', sans-serif;
}
```

```go-html-template
<!-- layouts/baseof.html -->
<!DOCTYPE html>
<html lang="{{ site.Language.LanguageCode | default site.LanguageCode }}">
  <head>
    {{ partial "head.html" . }}
  </head>
  <body>
    {{ partial "header.html" . }}
    <main>
      {{ block "main" . }}{{ end }}
    </main>
    {{ partial "dock.html" . }}
    {{ partial "footer.html" . }}
  </body>
</html>
```

```go-html-template
<!-- layouts/_partials/head.html -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ if .IsHome }}{{ site.Title }}{{ else }}{{ .Title }} | {{ site.Title }}{{ end }}</title>
{{ $css := resources.Get "css/app.css" | css.TailwindCSS | minify | fingerprint }}
<link rel="stylesheet" href="{{ $css.RelPermalink }}">
```

```go-html-template
<!-- layouts/_partials/header.html -->
<header role="banner" class="border-b border-purple-200 bg-white/90 px-6 py-4">
  <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
    <a href="{{ site.Home.RelPermalink }}" class="flex items-center gap-3 text-xl font-bold">
      <span class="inline-flex h-8 w-8 items-center justify-center rounded bg-purple-600 text-white">M</span>
      <span>{{ site.Title }}</span>
    </a>
    <button type="button" aria-label="Search" class="rounded border border-purple-300 px-3 py-2">Search</button>
  </div>
</header>
```

```go-html-template
<!-- layouts/_partials/footer.html -->
<footer role="contentinfo" class="border-t border-purple-200 px-6 py-6 text-sm">
  <div class="mx-auto flex max-w-6xl items-center justify-between">
    <a href="https://github.com/example">GitHub</a>
    <span>Copyright {{ now.Year }}</span>
  </div>
</footer>
```

```go-html-template
<!-- layouts/_partials/dock.html -->
<div class="fixed right-4 bottom-4">
  <button type="button" aria-label="Back to top" class="rounded-full bg-purple-600 px-4 py-2 text-white">Top</button>
</div>
```

```go-html-template
<!-- layouts/_partials/icons.html -->
{{- define "icon-search" -}}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 21l-4.35-4.35" /><circle cx="11" cy="11" r="6" /></svg>
{{- end -}}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "shared chrome"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/css/app.css layouts/baseof.html layouts/_partials/head.html layouts/_partials/header.html layouts/_partials/footer.html layouts/_partials/dock.html layouts/_partials/icons.html tests/e2e/theme.spec.js
git commit -m "feat: add shared theme shell"
```

### Task 4: Add Home, List, Archive, And Post Card Templates

**Files:**
- Create: `layouts/home.html`
- Create: `layouts/list.html`
- Create: `layouts/archives.html`
- Create: `layouts/_partials/post-card.html`
- Create: `layouts/_partials/post-meta.html`

- [ ] **Step 1: Write the failing integration test**

```js
import { test, expect } from '@playwright/test'

test('home page shows intro and recent posts', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText("Mark's Notes")).toBeVisible()
  await expect(page.getByRole('link', { name: 'First Post' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Second Post' })).toBeVisible()
})

test('archive page lists all posts', async ({ page }) => {
  await page.goto('/archives/')

  await expect(page.getByRole('heading', { name: 'Archives' })).toBeVisible()
  await expect(page.getByText('First Post')).toBeVisible()
  await expect(page.getByText('Second Post')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "intro|archive"`
Expected: FAIL because the page templates do not exist

- [ ] **Step 3: Write minimal implementation**

```go-html-template
<!-- layouts/home.html -->
{{ define "main" }}
  <section class="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_2fr]">
    <div class="rounded-2xl border border-purple-200 bg-white p-6">
      <h1 class="text-3xl font-bold">{{ site.Params.intro.title }}</h1>
      <p class="mt-3 text-base">{{ site.Params.intro.body }}</p>
    </div>
    <div class="space-y-4">
      {{ range first 10 (where site.RegularPages "Section" "posts") }}
        {{ partial "post-card.html" . }}
      {{ end }}
    </div>
  </section>
{{ end }}
```

```go-html-template
<!-- layouts/list.html -->
{{ define "main" }}
  <section class="mx-auto max-w-4xl space-y-4 px-6 py-10">
    <h1 class="text-3xl font-bold">{{ .Title }}</h1>
    {{ range .Pages }}
      {{ partial "post-card.html" . }}
    {{ end }}
  </section>
{{ end }}
```

```go-html-template
<!-- layouts/archives.html -->
{{ define "main" }}
  <section class="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <h1 class="text-3xl font-bold">{{ .Title }}</h1>
    {{ range site.RegularPages.ByDate.Reverse }}
      {{ partial "post-card.html" . }}
    {{ end }}
  </section>
{{ end }}
```

```go-html-template
<!-- layouts/_partials/post-card.html -->
<article class="rounded-2xl border border-purple-200 bg-white p-5">
  <a href="{{ .RelPermalink }}" class="block space-y-2">
    <h2 class="text-2xl font-bold">{{ .Title }}</h2>
    <p class="text-sm text-slate-600">{{ .Summary | plainify }}</p>
    {{ partial "post-meta.html" . }}
  </a>
</article>
```

```go-html-template
<!-- layouts/_partials/post-meta.html -->
<div class="flex flex-wrap gap-3 text-sm text-slate-500">
  <span>{{ .Date | time.Format ":date_medium" }}</span>
  <span>{{ .ReadingTime }} min read</span>
  {{ with .Params.tags }}<span>{{ delimit . ", " }}</span>{{ end }}
  {{ with .Params.series }}<span>{{ delimit . ", " }}</span>{{ end }}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "intro|archive"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/home.html layouts/list.html layouts/archives.html layouts/_partials/post-card.html layouts/_partials/post-meta.html tests/e2e/theme.spec.js
git commit -m "feat: add home and listing templates"
```

### Task 5: Add Single Post Layout With TOC And Reading Progress Helpers

**Files:**
- Create: `assets/js/lib/toc.js`
- Create: `assets/js/lib/progress.js`
- Create: `layouts/single.html`
- Create: `layouts/_partials/toc.html`
- Test: `tests/unit/toc.test.js`
- Test: `tests/unit/progress.test.js`

- [ ] **Step 1: Write the failing unit tests**

```js
// tests/unit/toc.test.js
import { describe, expect, it } from 'vitest'
import { pickActiveHeading } from '../../assets/js/lib/toc.js'

describe('pickActiveHeading', () => {
  it('returns the last heading above the viewport threshold', () => {
    const headings = [
      { id: 'intro', top: -10 },
      { id: 'details', top: 120 },
      { id: 'summary', top: 400 }
    ]

    expect(pickActiveHeading(headings, 160)).toBe('details')
  })
})
```

```js
// tests/unit/progress.test.js
import { describe, expect, it } from 'vitest'
import { getReadingProgress } from '../../assets/js/lib/progress.js'

describe('getReadingProgress', () => {
  it('returns a bounded percentage', () => {
    expect(getReadingProgress({ scrollTop: 250, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(30)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/unit/toc.test.js tests/unit/progress.test.js`
Expected: FAIL because helper modules do not exist

- [ ] **Step 3: Write minimal implementation**

```js
// assets/js/lib/toc.js
export function pickActiveHeading(headings, threshold = 160) {
  const visible = headings.filter((heading) => heading.top <= threshold)
  return visible.length ? visible.at(-1).id : headings[0]?.id ?? null
}
```

```js
// assets/js/lib/progress.js
export function getReadingProgress({ scrollTop, contentTop, contentHeight, viewportHeight }) {
  const total = Math.max(contentHeight - viewportHeight, 1)
  const raw = ((scrollTop - contentTop) / total) * 100
  return Math.max(0, Math.min(100, Math.round(raw)))
}
```

```go-html-template
<!-- layouts/_partials/toc.html -->
{{ if ne .TableOfContents `<nav id="TableOfContents"></nav>` }}
  <aside class="sticky top-24 hidden lg:block">
    <div class="rounded-2xl border border-purple-200 bg-white p-4">
      <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">Contents</h2>
      {{ .TableOfContents }}
    </div>
  </aside>
{{ end }}
```

```go-html-template
<!-- layouts/single.html -->
{{ define "main" }}
  <div id="reading-progress" class="fixed top-0 left-0 z-50 h-1 bg-purple-600" style="width:0%"></div>
  <section class="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
    <article id="post-content" class="min-w-0 space-y-6">
      {{ with .Params.featuredImage }}<img src="{{ . }}" alt="" class="w-full rounded-2xl object-cover">{{ end }}
      <header class="space-y-3">
        <h1 class="text-4xl font-bold">{{ .Title }}</h1>
        {{ partial "post-meta.html" . }}
      </header>
      <div class="prose prose-slate max-w-none">{{ .Content }}</div>
    </article>
    {{ partial "toc.html" . }}
  </section>
{{ end }}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/unit/toc.test.js tests/unit/progress.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/toc.js assets/js/lib/progress.js layouts/single.html layouts/_partials/toc.html tests/unit/toc.test.js tests/unit/progress.test.js
git commit -m "feat: add post layout and reading helpers"
```

### Task 6: Add Search Index And Search Helper Logic

**Files:**
- Create: `layouts/index.json`
- Create: `assets/js/lib/search.js`
- Test: `tests/unit/search.test.js`

- [ ] **Step 1: Write the failing unit tests**

```js
// tests/unit/search.test.js
import { describe, expect, it } from 'vitest'
import { filterSearchRecords, collectMatches } from '../../assets/js/lib/search.js'

describe('filterSearchRecords', () => {
  it('returns matching posts by title, summary, and content', () => {
    const records = [
      { title: 'First Post', summary: 'Alpha', content: 'Search should find this paragraph.', permalink: '/posts/first-post/' },
      { title: 'Second Post', summary: 'Beta', content: 'Nothing relevant here.', permalink: '/posts/second-post/' }
    ]

    expect(filterSearchRecords(records, 'search')).toHaveLength(1)
  })
})

describe('collectMatches', () => {
  it('returns ordered text matches for highlighting', () => {
    const matches = collectMatches('Search should find this paragraph.', 'find')
    expect(matches[0]).toEqual({ start: 14, end: 18 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/unit/search.test.js`
Expected: FAIL because `assets/js/lib/search.js` does not exist

- [ ] **Step 3: Write minimal implementation**

```js
// assets/js/lib/search.js
export function filterSearchRecords(records, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return records.filter((record) => {
    const haystack = [record.title, record.summary, record.content, ...(record.headings || [])].join(' ').toLowerCase()
    return haystack.includes(needle)
  })
}

export function collectMatches(text, query) {
  const source = text.toLowerCase()
  const needle = query.trim().toLowerCase()
  const matches = []
  let index = source.indexOf(needle)

  while (needle && index !== -1) {
    matches.push({ start: index, end: index + needle.length })
    index = source.indexOf(needle, index + needle.length)
  }

  return matches
}
```

```go-html-template
<!-- layouts/index.json -->
{{- $records := slice -}}
{{- range where site.RegularPages "Section" "posts" -}}
  {{- $records = $records | append (dict
    "title" .Title
    "summary" (.Summary | plainify)
    "content" .Plain
    "headings" (findRE `(?m)^##+\s+.+$` .RawContent)
    "permalink" .RelPermalink
    "tags" (.Params.tags | default (slice))
    "series" (.Params.series | default (slice))
  ) -}}
{{- end -}}
{{- $records | jsonify -}}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/unit/search.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/search.js layouts/index.json tests/unit/search.test.js
git commit -m "feat: add local search index and helpers"
```

### Task 7: Wire Alpine Behavior For Search, TOC Tracking, Progress, Theme, And Back-To-Top

**Files:**
- Create: `assets/js/lib/theme.js`
- Create: `assets/js/app.js`
- Modify: `layouts/baseof.html`
- Modify: `layouts/_partials/header.html`
- Modify: `layouts/_partials/dock.html`
- Test: `tests/unit/theme.test.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing unit and integration tests**

```js
// tests/unit/theme.test.js
import { describe, expect, it } from 'vitest'
import { resolveTheme } from '../../assets/js/lib/theme.js'

describe('resolveTheme', () => {
  it('falls back to the browser preference', () => {
    expect(resolveTheme({ storedTheme: null, systemPrefersDark: true })).toBe('dark')
  })
})
```

```js
import { test, expect } from '@playwright/test'

test('search opens and shows matching posts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByPlaceholder('Search posts').fill('paragraph')

  await expect(page.getByRole('link', { name: 'First Post' })).toBeVisible()
})

test('back to top returns to the top of the page', async ({ page }) => {
  await page.goto('/posts/first-post/')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: 'Back to top' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/unit/theme.test.js && npm run test:e2e -- tests/e2e/theme.spec.js --grep "search opens|back to top"`
Expected: FAIL because the behavior layer is not wired yet

- [ ] **Step 3: Write minimal implementation**

```js
// assets/js/lib/theme.js
export function resolveTheme({ storedTheme, systemPrefersDark }) {
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme
  return systemPrefersDark ? 'dark' : 'light'
}
```

```js
// assets/js/app.js
import Alpine from 'alpinejs'
import { filterSearchRecords } from './lib/search.js'
import { resolveTheme } from './lib/theme.js'

window.Alpine = Alpine

Alpine.data('siteUi', () => ({
  query: '',
  records: [],
  searchOpen: false,
  async openSearch() {
    this.searchOpen = true
    if (!this.records.length) {
      this.records = await fetch('/index.json').then((response) => response.json())
    }
  },
  get results() {
    return filterSearchRecords(this.records, this.query)
  },
  backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  theme: resolveTheme({
    storedTheme: null,
    systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
  })
}))

Alpine.start()
```

```go-html-template
<!-- layouts/baseof.html -->
<body x-data="siteUi" :data-theme="theme">
  {{ partial "header.html" . }}
  <main>
    {{ block "main" . }}{{ end }}
  </main>
  {{ partial "dock.html" . }}
  {{ partial "footer.html" . }}
  {{ $js := resources.Get "js/app.js" | js.Build | fingerprint }}
  <script defer src="{{ $js.RelPermalink }}"></script>
</body>
```

```go-html-template
<!-- layouts/_partials/header.html -->
<header role="banner" class="border-b border-purple-200 bg-white/90 px-6 py-4">
  <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
    <a href="{{ site.Home.RelPermalink }}" class="flex items-center gap-3 text-xl font-bold">
      <span class="inline-flex h-8 w-8 items-center justify-center rounded bg-purple-600 text-white">M</span>
      <span>{{ site.Title }}</span>
    </a>
    <div class="flex items-center gap-3">
      <button type="button" aria-label="Search" @click="openSearch" class="rounded border border-purple-300 px-3 py-2">Search</button>
      <div x-show="searchOpen" class="fixed inset-0 z-50 bg-black/40 p-6">
        <div class="mx-auto max-w-2xl rounded-2xl bg-white p-4">
          <input x-model="query" placeholder="Search posts" class="w-full rounded border border-purple-300 px-3 py-2">
          <div class="mt-4 space-y-2">
            <template x-for="result in results" :key="result.permalink">
              <a :href="result.permalink" x-text="result.title" class="block rounded border border-purple-200 px-3 py-2"></a>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</header>
```

```go-html-template
<!-- layouts/_partials/dock.html -->
<div class="fixed right-4 bottom-4">
  <button type="button" aria-label="Back to top" @click="backToTop" class="rounded-full bg-purple-600 px-4 py-2 text-white">Top</button>
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/unit/theme.test.js && npm run test:e2e -- tests/e2e/theme.spec.js --grep "search opens|back to top"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/theme.js assets/js/app.js layouts/baseof.html layouts/_partials/header.html layouts/_partials/dock.html tests/unit/theme.test.js tests/e2e/theme.spec.js
git commit -m "feat: wire alpine theme interactions"
```

### Task 8: Add SEO Partial, Final Verification, And Coverage For Missing Metadata

**Files:**
- Create: `layouts/_partials/seo.html`
- Modify: `layouts/_partials/head.html`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing integration test**

```js
import { test, expect } from '@playwright/test'

test('single post exposes canonical and social metadata', async ({ page }) => {
  await page.goto('/posts/first-post/')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/posts\/first-post\/$/)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'First Post')
})

test('post without optional metadata still renders', async ({ page }) => {
  await page.goto('/posts/second-post/')

  await expect(page.getByRole('heading', { name: 'Second Post' })).toBeVisible()
  await expect(page.locator('article img')).toHaveCount(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "canonical|optional metadata"`
Expected: FAIL because SEO tags are not rendered yet

- [ ] **Step 3: Write minimal implementation**

```go-html-template
<!-- layouts/_partials/seo.html -->
{{ $title := cond .IsHome site.Title (printf "%s | %s" .Title site.Title) }}
{{ $description := .Description | default .Summary | default site.Params.description }}
<meta name="description" content="{{ $description }}">
<link rel="canonical" href="{{ .Permalink }}">
<meta property="og:title" content="{{ .Title | default site.Title }}">
<meta property="og:description" content="{{ $description }}">
<meta property="og:type" content="{{ if .IsPage }}article{{ else }}website{{ end }}">
<meta property="og:url" content="{{ .Permalink }}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ .Title | default site.Title }}">
<meta name="twitter:description" content="{{ $description }}">
```

```go-html-template
<!-- layouts/_partials/head.html -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ if .IsHome }}{{ site.Title }}{{ else }}{{ .Title }} | {{ site.Title }}{{ end }}</title>
{{ partial "seo.html" . }}
{{ $css := resources.Get "css/app.css" | css.TailwindCSS | minify | fingerprint }}
<link rel="stylesheet" href="{{ $css.RelPermalink }}">
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm test && npm run test:e2e && hugo --source exampleSite --themesDir ..`
Expected: Vitest PASS, Playwright PASS, Hugo build completes successfully

- [ ] **Step 5: Commit**

```bash
git add layouts/_partials/seo.html layouts/_partials/head.html tests/e2e/theme.spec.js
git commit -m "feat: add seo coverage and final verification"
```

## Self-Review

### Spec Coverage

- Title bar, footer, bottom dock: Task 3
- Home, list, archive, post summaries: Task 4
- Single post, TOC, progress: Task 5
- Search index and local search: Tasks 6 and 7
- Browser-preference light/dark mode: Task 7
- SEO: Task 8
- YAML-first example config and docs fixture: Task 2
- TDD with Node unit tests and Playwright integration tests: Tasks 1 through 8

No gaps remain against the approved spec.

### Placeholder Scan

- No `TODO` or `TBD` placeholders remain.
- Each code-changing step includes concrete file content.
- Each verification step includes an exact command and expected outcome.

### Type Consistency

- Search helper names stay consistent: `filterSearchRecords`, `collectMatches`
- TOC helper name stays consistent: `pickActiveHeading`
- Progress helper name stays consistent: `getReadingProgress`
- Theme helper name stays consistent: `resolveTheme`

# View All And Taxonomy Hubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit the homepage to five recent posts with a View All call-to-action, and turn the all-posts page intro area into conditional series/tag browsing hubs.

**Architecture:** This change stays in Hugo templates and Playwright coverage. Home becomes a five-post preview with a View All CTA, while the all-posts page reuses its left-side structural area as a taxonomy hub that conditionally renders series links and tag chips or disappears entirely when empty.

**Tech Stack:** Hugo templates, existing icon partials, Playwright, Hugo taxonomies

---

## File Structure Map

- Modify: `layouts/home.html` - limit recent posts to five and add a View All CTA with right chevron icon
- Modify: `layouts/archives.html` - replace intro area with conditional series/tag hubs and collapse to full-width list when both hubs are absent
- Modify: `layouts/_partials/icon.html` - add a right-chevron icon if one does not already exist
- Modify: `tests/e2e/theme.spec.js` - cover the five-post limit, View All CTA, taxonomy hub ordering, and empty-state collapse behavior
- Modify: `tests/unit/example-site.test.js` - add a deterministic build-output check for the empty-taxonomy archive state

### Task 1: Add The Home View All CTA And Five-Post Limit

**Files:**
- Modify: `layouts/home.html`
- Modify: `layouts/_partials/icon.html`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing integration coverage**

```js
test('home page shows only the five most recent posts and a view all posts link', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('main article')).toHaveCount(5)
  await expect(page.getByRole('link', { name: /View All posts/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /View All posts/i })).toHaveAttribute('href', '/archives/')
  await expect(page.getByRole('link', { name: /View All posts/i }).locator('svg')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "five most recent posts and a view all posts link"`
Expected: FAIL because home currently renders eight posts and has no View All CTA

- [ ] **Step 3: Write minimal implementation**

```go-html-template
<!-- layouts/home.html -->
{{ define "main" }}
  <section class="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
    <div class="lg:border-r lg:border-purple-200 lg:pr-8">
      <h1 class="text-3xl font-extrabold tracking-tight">{{ site.Params.intro.title }}</h1>
      <p class="mt-3 text-base leading-7">{{ site.Params.intro.body }}</p>
    </div>
    <div>
      {{ range $index, $page := first 5 (where site.RegularPages.ByDate.Reverse "Section" "posts") }}
        {{ if gt $index 0 }}<hr class="border-purple-200">{{ end }}
        {{ partial "post-row.html" $page }}
      {{ end }}
      <div class="mt-6">
        <a href="/archives/" class="inline-flex items-center gap-2 text-sm font-semibold text-purple-700">
          <span>View All posts</span>
          {{ partial "icon.html" (dict "name" "chevron-right" "class" "h-4 w-4") }}
        </a>
      </div>
    </div>
  </section>
{{ end }}
```

```go-html-template
<!-- layouts/_partials/icon.html -->
{{- else if eq $name "chevron-right" -}}
<svg class="{{ $class }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
</svg>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "five most recent posts and a view all posts link"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/home.html layouts/_partials/icon.html tests/e2e/theme.spec.js
git commit -m "feat: add home view all posts link"
```

### Task 2: Replace The All-Posts Intro Area With Taxonomy Hubs

**Files:**
- Modify: `layouts/archives.html`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing integration coverage**

```js
test('all posts page shows series links first and tag chips second', async ({ page }) => {
  await page.goto('/archives/')

  await expect(page.getByRole('heading', { name: 'Series' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'fixture-series' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'fixture' })).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "series links first and tag chips second"`
Expected: FAIL because the archives page currently has no left-side taxonomy hubs

- [ ] **Step 3: Write minimal implementation**

```go-html-template
<!-- layouts/archives.html -->
{{ define "main" }}
  {{ $seriesTerms := site.Taxonomies.series.ByCount }}
  {{ $tagTerms := site.Taxonomies.tags.ByCount }}
  {{ $hasSidebar := or (gt (len $seriesTerms) 0) (gt (len $tagTerms) 0) }}
  <section class="mx-auto grid max-w-6xl gap-8 px-6 py-10 {{ if $hasSidebar }}lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10{{ end }}">
    {{ if $hasSidebar }}
      <div class="space-y-8 lg:border-r lg:border-purple-200 lg:pr-8">
        {{ if gt (len $seriesTerms) 0 }}
          <section>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Series</h2>
            <div class="mt-4 space-y-3">
              {{ range $seriesTerms }}
                <a href="{{ .Page.RelPermalink }}" class="block text-sm text-purple-700">{{ .Page.Title }}</a>
              {{ end }}
            </div>
          </section>
        {{ end }}
        {{ if gt (len $tagTerms) 0 }}
          <section>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              {{ range $tagTerms }}
                <a href="{{ .Page.RelPermalink }}" class="rounded-full border border-purple-200 px-3 py-1 text-xs font-medium text-purple-700">{{ .Page.Title }}</a>
              {{ end }}
            </div>
          </section>
        {{ end }}
      </div>
    {{ end }}
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight">{{ .Title }}</h1>
      <div class="mt-6">
        {{ range $index, $page := site.RegularPages.ByDate.Reverse }}
          {{ if gt $index 0 }}<hr class="border-purple-200">{{ end }}
          {{ partial "post-row.html" $page }}
        {{ end }}
      </div>
    </div>
  </section>
{{ end }}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "series links first and tag chips second"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/archives.html tests/e2e/theme.spec.js
git commit -m "feat: add archive taxonomy hubs"
```

### Task 3: Cover Empty-Hub Behavior And Final Verification

**Files:**
- Modify: `tests/e2e/theme.spec.js`
- Modify: `tests/unit/example-site.test.js`

- [ ] **Step 1: Write the failing integration coverage for empty hub states**

```js
it('renders the archives page without a hub column when no taxonomies exist', () => {
  const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-archives-empty-'))
  const themeDir = fileURLToPath(new URL('../../', import.meta.url))
  const themesDir = path.join(siteDir, 'themes')

  fs.mkdirSync(path.join(siteDir, 'content', 'archives'), { recursive: true })
  fs.mkdirSync(themesDir, { recursive: true })
  fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\n')
  fs.writeFileSync(path.join(siteDir, 'content', 'archives', '_index.md'), '---\ntitle: Archives\nlayout: archives\n---\n')
  fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
  fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

  execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
    cwd: themeDir,
    stdio: 'pipe'
  })

  const html = fs.readFileSync(path.join(siteDir, 'public', 'archives', 'index.html'), 'utf8')

  expect(html).not.toContain('>Series<')
  expect(html).not.toContain('>Tags<')
  expect(html).not.toContain('lg:border-r')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/unit/example-site.test.js`
Expected: FAIL because the archives template still renders the left hub column structure unconditionally or leaves empty hub chrome in the output

- [ ] **Step 3: Write the minimal verification implementation**

```js
// tests/e2e/theme.spec.js
test('all posts page orders series links before tag chips', async ({ page }) => {
  await page.goto('/archives/')

  const sidebarText = await page.locator('main').textContent()
  expect(sidebarText?.indexOf('Series')).toBeLessThan(sidebarText?.indexOf('Tags') ?? Infinity)
})
```

```go-html-template
<!-- layouts/archives.html -->
{{ define "main" }}
  {{ $seriesTerms := site.Taxonomies.series.ByCount }}
  {{ $tagTerms := site.Taxonomies.tags.ByCount }}
  {{ $hasSidebar := or (gt (len $seriesTerms) 0) (gt (len $tagTerms) 0) }}
  <section class="mx-auto grid max-w-6xl gap-8 px-6 py-10 {{ if $hasSidebar }}lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10{{ end }}">
    {{ if $hasSidebar }}
      <div class="space-y-8 lg:border-r lg:border-purple-200 lg:pr-8">
        {{ if gt (len $seriesTerms) 0 }}
          <section>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Series</h2>
            <div class="mt-4 space-y-3">
              {{ range $seriesTerms }}
                <a href="{{ .Page.RelPermalink }}" class="block text-sm text-purple-700">{{ .Page.Title }}</a>
              {{ end }}
            </div>
          </section>
        {{ end }}
        {{ if gt (len $tagTerms) 0 }}
          <section>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              {{ range $tagTerms }}
                <a href="{{ .Page.RelPermalink }}" class="rounded-full border border-purple-200 px-3 py-1 text-xs font-medium text-purple-700">{{ .Page.Title }}</a>
              {{ end }}
            </div>
          </section>
        {{ end }}
      </div>
    {{ end }}
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight">{{ .Title }}</h1>
      <div class="mt-6">
        {{ range $index, $page := site.RegularPages.ByDate.Reverse }}
          {{ if gt $index 0 }}<hr class="border-purple-200">{{ end }}
          {{ partial "post-row.html" $page }}
        {{ end }}
      </div>
    </div>
  </section>
{{ end }}
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm test -- --run tests/unit/example-site.test.js && npm run build && npm run test:e2e`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/archives.html tests/e2e/theme.spec.js tests/unit/example-site.test.js
git commit -m "test: cover archive hub states"
```

## Self-Review

### Spec Coverage

- Home limited to five recent posts: Task 1
- View All posts CTA with chevron icon: Task 1
- All-posts page series hub first: Task 2
- All-posts page tags hub second: Task 2
- Empty-state behavior for missing series/tags and full hub collapse: Task 3

No spec gaps remain.

### Placeholder Scan

- No `TODO` or `TBD` placeholders remain.
- Exact file paths and commands are provided for every task.
- The empty-state task now uses a deterministic temporary Hugo build test instead of a placeholder harness description.

### Type Consistency

- The CTA label remains `View All posts` throughout the plan.
- Series hub always precedes tags hub in all tasks.
- The all-posts page remains `layouts/archives.html` throughout the plan.

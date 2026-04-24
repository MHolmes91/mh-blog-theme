# Series Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add series-only previous/next navigation cards below post content, with optional `series_order` override and disabled edge-state cards.

**Architecture:** Keep series navigation isolated in one new Hugo partial and call it from `layouts/single.html`. Cover ordering and edge-state behavior with a Hugo render test in `tests/unit/example-site.test.js`, then verify card content and icon alignment with Playwright against example fixture posts.

**Tech Stack:** Hugo templates, Tailwind utility classes, Vitest, Playwright

---

## File Map

- Create: `layouts/_partials/series-navigation.html`
- Modify: `layouts/single.html`
- Modify: `layouts/_partials/icon.html`
- Modify: `tests/unit/example-site.test.js`
- Modify: `tests/e2e/theme.spec.js`

### Task 1: Add failing Hugo render tests for series navigation

**Files:**
- Modify: `tests/unit/example-site.test.js`
- Test: `tests/unit/example-site.test.js`

- [ ] **Step 1: Write failing unit tests for date fallback and `series_order` override**

Add these tests near end of `tests/unit/example-site.test.js` inside existing `describe('example site', () => { ... })` block:

```js
  it('renders series navigation cards with date fallback and edge placeholders', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-series-nav-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))
    const themesDir = path.join(siteDir, 'themes')

    fs.mkdirSync(path.join(siteDir, 'content', 'posts'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Series Nav Fixture\ntheme: mh-blog-theme\ntaxonomies:\n  series: series\n')
    fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'part-1.md'), '---\ntitle: Part 1\ndate: 2026-04-01\nseries: [ordered-series]\nsummary: First\n---\n\nPart 1\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'part-2.md'), '---\ntitle: Part 2\ndate: 2026-04-02\nseries: [ordered-series]\nsummary: Second\n---\n\nPart 2\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'part-3.md'), '---\ntitle: Part 3\ndate: 2026-04-03\nseries: [ordered-series]\nsummary: Third\n---\n\nPart 3\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const middleHtml = fs.readFileSync(path.join(siteDir, 'public', 'posts', 'part-2', 'index.html'), 'utf8')
    const firstHtml = fs.readFileSync(path.join(siteDir, 'public', 'posts', 'part-1', 'index.html'), 'utf8')
    const lastHtml = fs.readFileSync(path.join(siteDir, 'public', 'posts', 'part-3', 'index.html'), 'utf8')

    expect(middleHtml).toContain('>Previous<')
    expect(middleHtml).toContain('>Part 1<')
    expect(middleHtml).toContain('href="/posts/part-1/"')
    expect(middleHtml).toContain('>Next<')
    expect(middleHtml).toContain('>Part 3<')
    expect(middleHtml).toContain('href="/posts/part-3/"')
    expect(firstHtml).toContain('No Previous')
    expect(firstHtml).toContain('href="/posts/part-2/"')
    expect(lastHtml).toContain('No Next')
    expect(lastHtml).toContain('href="/posts/part-2/"')
  })

  it('prefers series_order over date when series navigation is built', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-series-order-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))
    const themesDir = path.join(siteDir, 'themes')

    fs.mkdirSync(path.join(siteDir, 'content', 'posts'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Series Order Fixture\ntheme: mh-blog-theme\ntaxonomies:\n  series: series\n')
    fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'alpha.md'), '---\ntitle: Alpha\ndate: 2026-04-03\nseries: [override-series]\nseries_order: 2\nsummary: Alpha\n---\n\nAlpha\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'beta.md'), '---\ntitle: Beta\ndate: 2026-04-01\nseries: [override-series]\nseries_order: 1\nsummary: Beta\n---\n\nBeta\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'gamma.md'), '---\ntitle: Gamma\ndate: 2026-04-02\nseries: [override-series]\nseries_order: 3\nsummary: Gamma\n---\n\nGamma\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const alphaHtml = fs.readFileSync(path.join(siteDir, 'public', 'posts', 'alpha', 'index.html'), 'utf8')

    expect(alphaHtml).toContain('href="/posts/beta/"')
    expect(alphaHtml).toContain('href="/posts/gamma/"')
  })
```

- [ ] **Step 2: Run targeted unit test to verify failure**

Run:

```bash
npm test -- --run tests/unit/example-site.test.js
```

Expected: FAIL because series navigation partial and markup do not exist yet.

- [ ] **Step 3: Commit failing test changes**

```bash
git add tests/unit/example-site.test.js
git commit -m "test: cover series post navigation"
```

### Task 2: Implement series navigation partial and wire it into single posts

**Files:**
- Create: `layouts/_partials/series-navigation.html`
- Modify: `layouts/single.html`
- Modify: `layouts/_partials/icon.html`
- Test: `tests/unit/example-site.test.js`

- [ ] **Step 1: Add missing icons to shared icon partial**

Update `layouts/_partials/icon.html` with new branches near other stroke icons:

```go-html-template
{{- else if eq $name "chevron-left" -}}
<svg class="{{ $class }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15 6-6 6 6 6" />
</svg>
{{- else if eq $name "calendar" -}}
<svg class="{{ $class }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v3" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 3v3" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 8.25h16.5" />
  <rect x="3.75" y="4.5" width="16.5" height="15.75" rx="2.25" />
</svg>
```

- [ ] **Step 2: Create `layouts/_partials/series-navigation.html` with ordering and card rendering**

Create file with this content:

```go-html-template
{{ $seriesTerms := .GetTerms "series" }}
{{ if gt (len $seriesTerms) 0 }}
  {{ $seriesTerm := index $seriesTerms 0 }}
  {{ $entries := slice }}

  {{ range $seriesTerm.Pages }}
    {{ $weight := cond (isset .Params "series_order") (int .Params.series_order) .Date.Unix }}
    {{ $entries = $entries | append (dict "page" . "weight" $weight "title" .Title) }}
  {{ end }}

  {{ $sortedEntries := sort (sort $entries "title") "weight" }}
  {{ $currentIndex := -1 }}

  {{ range $index, $entry := $sortedEntries }}
    {{ if eq $entry.page.RelPermalink $.RelPermalink }}
      {{ $currentIndex = $index }}
    {{ end }}
  {{ end }}

  {{ if ge $currentIndex 0 }}
    {{ $previous := cond (gt $currentIndex 0) (index $sortedEntries (sub $currentIndex 1)).page nil }}
    {{ $next := cond (lt $currentIndex (sub (len $sortedEntries) 1)) (index $sortedEntries (add $currentIndex 1)).page nil }}

    <nav class="grid gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 md:grid-cols-2" aria-label="Series navigation">
      <div data-series-nav-card="previous">
        {{ if $previous }}
          <a href="{{ $previous.RelPermalink }}" class="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700 dark:hover:bg-purple-950/20">
            <div>
              <div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {{ partial "icon.html" (dict "name" "chevron-left" "class" "h-4 w-4") }}
                <span>Previous</span>
              </div>
              <h2 class="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-300">
                {{ $previous.Title }}
              </h2>
            </div>
            <div class="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {{ partial "icon.html" (dict "name" "calendar" "class" "h-4 w-4") }}
              <time datetime="{{ $previous.Date.Format `2006-01-02` }}">{{ $previous.Date | time.Format ":date_medium" }}</time>
            </div>
          </a>
        {{ else }}
          <div class="flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
            <div class="mb-3 flex items-center gap-2 text-sm font-medium">
              {{ partial "icon.html" (dict "name" "chevron-left" "class" "h-4 w-4") }}
              <span>No Previous</span>
            </div>
          </div>
        {{ end }}
      </div>

      <div data-series-nav-card="next">
        {{ if $next }}
          <a href="{{ $next.RelPermalink }}" class="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-right transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700 dark:hover:bg-purple-950/20">
            <div>
              <div class="mb-3 flex items-center justify-end gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Next</span>
                {{ partial "icon.html" (dict "name" "chevron-right" "class" "h-4 w-4") }}
              </div>
              <h2 class="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-300">
                {{ $next.Title }}
              </h2>
            </div>
            <div class="mt-4 flex items-center justify-end gap-2 text-sm text-slate-500 dark:text-slate-400">
              <time datetime="{{ $next.Date.Format `2006-01-02` }}">{{ $next.Date | time.Format ":date_medium" }}</time>
              {{ partial "icon.html" (dict "name" "calendar" "class" "h-4 w-4") }}
            </div>
          </a>
        {{ else }}
          <div class="flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 text-right text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
            <div class="mb-3 flex items-center justify-end gap-2 text-sm font-medium">
              <span>No Next</span>
              {{ partial "icon.html" (dict "name" "chevron-right" "class" "h-4 w-4") }}
            </div>
          </div>
        {{ end }}
      </div>
    </nav>
  {{ end }}
{{ end }}
```

Implementation note: if Hugo rejects `cond ... nil`, replace neighbor lookup with explicit `if` blocks and scratch variables, but keep same rendered markup and ordering semantics.

- [ ] **Step 3: Render series navigation below post content**

Update `layouts/single.html`:

```go-html-template
{{ define "main" }}
  <div id="reading-progress" class="fixed top-0 left-0 z-50 h-1 bg-purple-600" style="width:0%"></div>
  <section class="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
    <article id="post-content" class="min-w-0 space-y-6">
      {{ with .Params.featuredImage }}<img src="{{ . }}" alt="" class="w-full rounded-2xl object-cover">{{ end }}
      {{ partial "post-header.html" (dict "page" . "surface" "aligned") }}
      <div class="prose prose-slate max-w-none" data-content-body>{{ .Content }}</div>
      {{ partial "series-navigation.html" . }}
    </article>
    {{ partial "toc.html" . }}
  </section>
{{ end }}
```

- [ ] **Step 4: Run targeted unit tests to verify they pass**

Run:

```bash
npm test -- --run tests/unit/example-site.test.js
```

Expected: PASS for both new series-navigation tests and existing example-site tests.

- [ ] **Step 5: Commit template implementation**

```bash
git add layouts/_partials/icon.html layouts/_partials/series-navigation.html layouts/single.html
git commit -m "feat: add series post navigation"
```

### Task 3: Add Playwright coverage for card content and icon alignment

**Files:**
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add Playwright tests for middle-card links and edge placeholders**

Append these tests near existing single-post coverage in `tests/e2e/theme.spec.js`:

```js
test("series posts render previous and next navigation cards", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/series-part-2/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const previousCard = nav.locator('[data-series-nav-card="previous"]');
  const nextCard = nav.locator('[data-series-nav-card="next"]');

  await expect(nav).toBeVisible();
  await expect(previousCard).toContainText("Previous");
  await expect(previousCard).toContainText("Series Part 1");
  await expect(previousCard).toHaveAttribute("href", "/posts/series-part-1/");
  await expect(nextCard).toContainText("Next");
  await expect(nextCard).toContainText("Series Part 3");
  await expect(nextCard).toHaveAttribute("href", "/posts/series-part-3/");
});

test("series navigation keeps disabled edge cards visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/series-part-1/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const previousCard = nav.locator('[data-series-nav-card="previous"]');
  const nextCard = nav.locator('[data-series-nav-card="next"]');

  await expect(previousCard).toContainText("No Previous");
  await expect(nextCard.getByRole("link", { name: /Series Part 2/i })).toHaveAttribute(
    "href",
    "/posts/series-part-2/",
  );

  await page.goto("/posts/series-part-4/");

  await expect(nextCard).toContainText("No Next");
  await expect(previousCard.getByRole("link", { name: /Series Part 3/i })).toHaveAttribute(
    "href",
    "/posts/series-part-3/",
  );
});
```

- [ ] **Step 2: Add Playwright test for left/right icon placement**

Add one more test directly after previous block:

```js
test("series navigation mirrors chevron and calendar placement per side", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/series-part-2/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const previousCard = nav.locator('[data-series-nav-card="previous"]');
  const nextCard = nav.locator('[data-series-nav-card="next"]');
  const previousLabel = previousCard.getByText("Previous", { exact: true });
  const previousChevron = previousCard.locator('svg').first();
  const previousTime = previousCard.locator('time');
  const previousCalendar = previousCard.locator('svg').last();
  const nextLabel = nextCard.getByText("Next", { exact: true });
  const nextChevron = nextCard.locator('svg').first();
  const nextTime = nextCard.locator('time');
  const nextCalendar = nextCard.locator('svg').last();

  const [prevLabelBox, prevChevronBox, prevTimeBox, prevCalendarBox, nextLabelBox, nextChevronBox, nextTimeBox, nextCalendarBox] = await Promise.all([
    getBox(previousLabel),
    getBox(previousChevron),
    getBox(previousTime),
    getBox(previousCalendar),
    getBox(nextLabel),
    getBox(nextChevron),
    getBox(nextTime),
    getBox(nextCalendar),
  ]);

  expect(prevChevronBox.left).toBeLessThan(prevLabelBox.left);
  expect(prevCalendarBox.left).toBeLessThan(prevTimeBox.left);
  expect(nextChevronBox.left).toBeGreaterThan(nextLabelBox.left);
  expect(nextCalendarBox.left).toBeGreaterThan(nextTimeBox.left);
});
```

- [ ] **Step 3: Run targeted Playwright tests**

Run:

```bash
npm run test:e2e -- --grep "series navigation"
```

Expected: PASS for navigation link, edge-state, and icon-placement tests.

- [ ] **Step 4: Commit e2e coverage changes**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: cover series navigation layout"
```

### Task 4: Run full verification

**Files:**
- Test: `tests/unit/example-site.test.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Re-run targeted e2e tests before full suite**

Run:

```bash
npm run test:e2e -- --grep "series navigation"
```

Expected: PASS for navigation link, edge-state, and icon-placement tests.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run test:e2e
npm run build
```

Expected:

- `npm test`: PASS
- `npm run test:e2e`: PASS
- `npm run build`: Hugo production build succeeds without template errors

- [ ] **Step 3: Commit final verification-safe changes**

```bash
git add tests/unit/example-site.test.js tests/e2e/theme.spec.js
git commit -m "test: verify series navigation behavior"
```

## Self-Review

- Spec coverage: plan covers series-only rendering, under-content placement, fixed two-card layout, edge placeholders, optional `series_order`, date fallback, icon position rules, and desktop/mobile verification.
- Placeholder scan: no `TODO`, `TBD`, or vague "handle edge cases" language remains.
- Type consistency: plan uses `series_order`, `series-navigation.html`, `aria-label="Series navigation"`, and `data-series-nav-card` consistently across implementation and tests.

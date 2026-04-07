# Metadata Layout Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reflow row and single-post metadata so taxonomy links align in a right-side top-aligned block on wide layouts and wrap below the left-side content as side-by-side groups when space gets tight.

**Architecture:** Keep `post-meta.html` and `post-taxonomy.html` focused on their current responsibilities and add one shared layout partial to compose the left content and right taxonomy block. Use the shared layout partial from both `post-row.html` and `single.html`, and verify the alignment rules with Playwright bounding-box assertions at wide and narrow viewports.

**Tech Stack:** Hugo templates, Tailwind utility classes, Playwright, Vitest

---

## File Map

- `layouts/_partials/post-meta.html`
  - Keeps date and reading-time rendering unchanged.
- `layouts/_partials/post-taxonomy.html`
  - Keeps series/tag rendering but adds grouped wrappers so layout can switch between stacked and side-by-side forms.
- `layouts/_partials/post-header.html`
  - New shared layout partial that composes title, optional summary, `post-meta`, and `post-taxonomy` for both rows and single-post headers.
- `layouts/_partials/post-row.html`
  - Simplified caller that delegates to the shared header partial.
- `layouts/single.html`
  - Simplified single-post header caller that delegates to the shared header partial.
- `tests/e2e/theme.spec.js`
  - Add layout assertions for wide and narrow metadata placement.

### Task 1: Add Failing Layout Coverage

**Files:**
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing layout tests**

Add these tests near the existing metadata coverage in `tests/e2e/theme.spec.js`:

```js
test("post rows right-align taxonomy and top-align it with the title on wide layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  const title = article.getByRole("link", { name: "Series Part 1" });
  const seriesLink = article.getByRole("link", { name: "fixture-series", exact: true });
  const tagLink = article.getByRole("link", { name: "series", exact: true });

  const titleBox = await title.boundingBox();
  const seriesBox = await seriesLink.boundingBox();
  const tagBox = await tagLink.boundingBox();

  expect(titleBox).not.toBeNull();
  expect(seriesBox).not.toBeNull();
  expect(tagBox).not.toBeNull();

  expect(seriesBox.x).toBeGreaterThan(titleBox.x + titleBox.width - 20);
  expect(Math.abs(seriesBox.y - titleBox.y)).toBeLessThan(16);
  expect(tagBox.y).toBeGreaterThan(seriesBox.y + 8);
});

test("single post headers right-align taxonomy and top-align it with the title on wide layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/series-part-1/");

  const title = page.getByRole("heading", { name: "Series Part 1" });
  const seriesLink = page.getByRole("link", { name: "fixture-series", exact: true });
  const tagLink = page.getByRole("link", { name: "series", exact: true });

  const titleBox = await title.boundingBox();
  const seriesBox = await seriesLink.boundingBox();
  const tagBox = await tagLink.boundingBox();

  expect(titleBox).not.toBeNull();
  expect(seriesBox).not.toBeNull();
  expect(tagBox).not.toBeNull();

  expect(seriesBox.x).toBeGreaterThan(titleBox.x + titleBox.width - 20);
  expect(Math.abs(seriesBox.y - titleBox.y)).toBeLessThan(16);
  expect(tagBox.y).toBeGreaterThan(seriesBox.y + 8);
});

test("metadata wraps taxonomy below the left content and shows series and tags side-by-side on narrow layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 520, height: 900 });
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  const metaText = article.getByText(/min/);
  const seriesLink = article.getByRole("link", { name: "fixture-series", exact: true });
  const tagLink = article.getByRole("link", { name: "series", exact: true });

  const metaBox = await metaText.boundingBox();
  const seriesBox = await seriesLink.boundingBox();
  const tagBox = await tagLink.boundingBox();

  expect(metaBox).not.toBeNull();
  expect(seriesBox).not.toBeNull();
  expect(tagBox).not.toBeNull();

  expect(seriesBox.y).toBeGreaterThan(metaBox.y + metaBox.height);
  expect(Math.abs(seriesBox.y - tagBox.y)).toBeLessThan(16);
});
```

- [ ] **Step 2: Run the focused layout tests to verify they fail**

Run: `npm run test:e2e -- --grep "right-align taxonomy|metadata wraps taxonomy below"`

Expected:
- all three new tests fail because the current layout is still a simple stacked flow

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: cover metadata layout alignment"
```

### Task 2: Create A Shared Header Layout Partial

**Files:**
- Create: `layouts/_partials/post-header.html`
- Modify: `layouts/_partials/post-taxonomy.html`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Create the shared header layout partial**

Create `layouts/_partials/post-header.html` with:

```html
{{ $page := .page }}
{{ $titleTag := .titleTag | default "h2" }}
{{ $titleClass := .titleClass }}
{{ $showSummary := .showSummary }}
{{ $linked := .linked }}

<div class="flex flex-wrap items-start gap-x-8 gap-y-3">
  {{ $content := printf "%s" "" }}
  <div class="min-w-0 flex-1 basis-72 space-y-2">
    {{ if $linked }}
      <a href="{{ $page.RelPermalink }}" class="block space-y-2">
        <{{ $titleTag }} class="{{ $titleClass }}">{{ $page.Title }}</{{ $titleTag }}>
        {{ if $showSummary }}
          <p class="text-sm text-slate-600">{{ $page.Summary | plainify }}</p>
        {{ end }}
        {{ partial "post-meta.html" (dict "page" $page) }}
      </a>
    {{ else }}
      <{{ $titleTag }} class="{{ $titleClass }}">{{ $page.Title }}</{{ $titleTag }}>
      {{ if $showSummary }}
        <p class="text-sm text-slate-600">{{ $page.Summary | plainify }}</p>
      {{ end }}
      {{ partial "post-meta.html" (dict "page" $page) }}
    {{ end }}
  </div>
  {{ partial "post-taxonomy.html" (dict "page" $page "surface" "aligned") }}
</div>
```

- [ ] **Step 2: Group taxonomy output into series and tags sections with responsive alignment**

Update `layouts/_partials/post-taxonomy.html` to this structure:

```html
{{ $page := .page }}
{{ $surface := .surface | default "single" }}
{{ $isAligned := eq $surface "aligned" }}
{{ $isList := eq $surface "list" }}

{{ if or $page.Params.series $page.Params.tags }}
  <div class="{{ if $isAligned }}w-full basis-full sm:ml-auto sm:w-auto sm:basis-auto{{ else if $isList }}mt-3{{ end }}">
    <div class="{{ if $isAligned }}flex flex-wrap items-start gap-x-6 gap-y-2 sm:flex-col sm:items-end sm:text-right{{ else }}flex flex-wrap items-center gap-2 text-sm text-slate-500{{ end }}">
      {{ with $page.Params.series }}
        <div class="flex flex-wrap items-center gap-2">
          {{ range . }}
            {{ $term := . }}
            {{ with site.GetPage (printf "/series/%s" ($term | urlize)) }}
              <a
                href="{{ .RelPermalink }}"
                class="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950 hover:decoration-slate-500"
              >
                {{ $term }}
              </a>
            {{ end }}
          {{ end }}
        </div>
      {{ end }}
      {{ with $page.Params.tags }}
        <div class="flex flex-wrap items-center gap-2 {{ if $isAligned }}sm:justify-end{{ end }}">
          {{ range . }}
            {{ $term := . }}
            {{ with site.GetPage (printf "/tags/%s" ($term | urlize)) }}
              <a
                href="{{ .RelPermalink }}"
                class="inline-flex items-center rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
              >
                {{ $term }}
              </a>
            {{ end }}
          {{ end }}
        </div>
      {{ end }}
    </div>
  </div>
{{ end }}
```

- [ ] **Step 3: Run the focused layout tests and confirm they still fail until callers are rewired**

Run: `npm run test:e2e -- --grep "right-align taxonomy|metadata wraps taxonomy below"`

Expected:
- at least one test still fails because callers do not yet use `post-header.html`

- [ ] **Step 4: Commit the shared partial work**

```bash
git add layouts/_partials/post-header.html layouts/_partials/post-taxonomy.html tests/e2e/theme.spec.js
git commit -m "refactor: add shared metadata header layout"
```

### Task 3: Rewire Row And Single Headers To Use The Shared Layout

**Files:**
- Modify: `layouts/_partials/post-row.html`
- Modify: `layouts/single.html`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Update the row partial to delegate to the shared header layout**

Replace `layouts/_partials/post-row.html` with:

```html
<article class="py-5">
  {{ partial "post-header.html" (dict
    "page" .
    "linked" true
    "showSummary" true
    "titleTag" "h2"
    "titleClass" "text-2xl font-extrabold tracking-tight"
  ) }}
</article>
```

- [ ] **Step 2: Update the single-post header to delegate to the shared layout**

Replace the current title/meta/taxonomy block inside `layouts/single.html` with:

```html
<header>
  {{ partial "post-header.html" (dict
    "page" .
    "linked" false
    "showSummary" false
    "titleTag" "h1"
    "titleClass" "text-4xl font-bold"
  ) }}
</header>
```

- [ ] **Step 3: Run the focused layout tests to verify they pass**

Run: `npm run test:e2e -- --grep "right-align taxonomy|metadata wraps taxonomy below"`

Expected:
- all three layout tests pass

- [ ] **Step 4: Commit the caller rewiring**

```bash
git add layouts/_partials/post-row.html layouts/single.html tests/e2e/theme.spec.js
git commit -m "style: align taxonomy metadata layout"
```

### Task 4: Run Full Verification

**Files:**
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Run the unit suite**

Run: `npm test`

Expected:
- 20/20 tests pass

- [ ] **Step 2: Run the full e2e suite**

Run: `npm run test:e2e`

Expected:
- all Playwright tests pass

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected:
- Hugo build succeeds without template errors

- [ ] **Step 4: Commit any final verification-only test adjustments if needed**

If no files changed during verification, skip this commit.

If a selector or assertion needed correction, use:

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: finalize metadata layout coverage"
```

## Self-Review Checklist

- Spec coverage:
  - right-aligned taxonomy on wide layouts: Task 1-3
  - top alignment with the title area: Task 1-3
  - wrapped below-left fallback with side-by-side groups: Task 1-3
  - apply the same rules to rows and single headers: Task 3
  - preserve accessible taxonomy interaction: Task 4
- Placeholder scan:
  - no TBD/TODO or vague future work remains
- Type consistency:
  - `post-header.html` is the shared layout caller used by both row and single templates
  - `post-taxonomy.html` uses `surface: "aligned"` for the new composed layout mode

# Metadata Link Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make series links and tag chips render consistently across the app while keeping list-style surfaces accessible and free of nested anchors.

**Architecture:** Split shared metadata into `layouts/_partials/post-meta.html` for date and reading time and `layouts/_partials/post-taxonomy.html` for series links and tag chips. Restructure list-style templates so the post link wraps the title, summary, date, and reading time, while taxonomy links render as separate anchors outside the main post link.

**Tech Stack:** Hugo templates, Tailwind utility classes, Playwright, Vitest

---

## File Map

- `layouts/_partials/post-meta.html`
  - Shared post-meta renderer for date and reading time only.
- `layouts/_partials/post-taxonomy.html`
  - Shared taxonomy renderer for series links and tag chips across single and list surfaces.
- `layouts/_partials/post-row.html`
  - Row surface. Remove the full-row wrapper anchor and split post navigation from taxonomy navigation.
- `layouts/_partials/post-card.html`
  - Unused partial. Remove it once usage has been confirmed absent.
- `tests/e2e/theme.spec.js`
  - Add failing coverage for consistent single-post metadata visuals and accessible list-surface interactions.

### Task 1: Lock In The New Metadata Behavior With Failing E2E Tests

**Files:**
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing tests for single-post and list-surface metadata behavior**

Add these tests near the existing metadata coverage in `tests/e2e/theme.spec.js`:

```js
test("single posts render series links and tag chips consistently", async ({
  page,
}) => {
  await page.goto("/posts/series-part-1/");

  const metadata = page.locator("main article").first();
  const seriesLink = metadata.getByRole("link", {
    name: "fixture-series",
    exact: true,
  });
  const tagLink = metadata.getByRole("link", { name: "series", exact: true });

  await expect(seriesLink).toHaveAttribute("href", "/series/fixture-series/");
  await expect(seriesLink).not.toHaveClass(/rounded-full/);
  await expect(tagLink).toHaveAttribute("href", "/tags/series/");
  await expect(tagLink).toHaveClass(/rounded-full/);
});

test("post rows keep taxonomy links separate from the main post link", async ({
  page,
}) => {
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  const postLink = article.getByRole("link", { name: "Series Part 1" });
  const seriesLink = article.getByRole("link", {
    name: "fixture-series",
    exact: true,
  });
  const tagLink = article.getByRole("link", { name: "series", exact: true });

  await expect(postLink).toHaveAttribute("href", "/posts/series-part-1/");
  await expect(article.locator("a a")).toHaveCount(0);
  await expect(seriesLink).toHaveAttribute("href", "/series/fixture-series/");
  await expect(tagLink).toHaveAttribute("href", "/tags/series/");
  await expect(tagLink).toHaveClass(/rounded-full/);
});

test("clicking row taxonomy links does not navigate to the post", async ({
  page,
}) => {
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  await article.getByRole("link", { name: "fixture-series", exact: true }).click();
  await expect(page).toHaveURL(/\/series\/fixture-series\/$/);

  await page.goto("/posts/");
  const refreshedArticle = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  await refreshedArticle.getByRole("link", { name: "series", exact: true }).click();
  await expect(page).toHaveURL(/\/tags\/series\/$/);
});
```

- [ ] **Step 2: Run the focused metadata tests to verify they fail for the expected reason**

Run: `npm run test:e2e -- --grep "metadata|taxonomy links"`

Expected:
- the new single-post chip assertion fails because tags are not yet styled like chips everywhere
- the row interaction assertions fail because rows still wrap metadata inside the main post anchor

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: cover metadata link consistency"
```

### Task 2: Split Shared Metadata Into Post Meta And Post Taxonomy Partials

**Files:**
- Modify: `layouts/_partials/post-meta.html`
- Create: `layouts/_partials/post-taxonomy.html`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Reduce `post-meta.html` to date and reading time only**

Replace `layouts/_partials/post-meta.html` with:

```html
{{ $page := .page }}
<div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
  <span>{{ $page.Date | time.Format ":date_medium" }}</span>
  <span class="inline-flex items-center gap-1.5">
    {{ partial "icon.html" (dict "name" "timer" "class" "h-4 w-4") }}
    <span>{{ $page.ReadingTime }} min</span>
  </span>
</div>
```

- [ ] **Step 2: Create `post-taxonomy.html` for series links and tag chips**

Create `layouts/_partials/post-taxonomy.html` with:

```html
{{ $page := .page }}
{{ $surface := .surface | default "single" }}
{{ $isList := eq $surface "list" }}

{{ $taxonomyMeta }}
  {{ with $page.Params.series }}
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
  {{ end }}
  {{ with $page.Params.tags }}
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
  {{ end }}
{{ end }}

<div class="{{ if $isList }}mt-3 {{ end }}flex flex-wrap items-center gap-2 text-sm text-slate-500">
  {{ $taxonomyMeta }}
</div>
```

- [ ] **Step 3: Run the focused metadata tests to verify the single-post assertions pass and the list-surface structure still fails**

Run: `npm run test:e2e -- --grep "metadata|taxonomy links"`

Expected:
- the single-post consistency test passes
- at least one list-surface interaction test still fails because `post-row.html` still uses a wrapper anchor

- [ ] **Step 4: Commit the partial split**

```bash
git add layouts/_partials/post-meta.html layouts/_partials/post-taxonomy.html tests/e2e/theme.spec.js
git commit -m "refactor: split post metadata partials"
```

### Task 3: Restructure List Surfaces To Avoid Nested Anchors And Preserve Navigation

**Files:**
- Modify: `layouts/_partials/post-row.html`
- Modify: `layouts/_partials/post-taxonomy.html`
- Delete: `layouts/_partials/post-card.html`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Update the row template so the main post link only wraps the summary content**

Change `layouts/_partials/post-row.html` to:

```html
<article class="py-5">
  <a href="{{ .RelPermalink }}" class="block space-y-2">
    <h2 class="text-2xl font-extrabold tracking-tight">{{ .Title }}</h2>
    <p class="text-sm text-slate-600">{{ .Summary | plainify }}</p>
    {{ partial "post-meta.html" (dict "page" . "surface" "list") }}
  </a>
</article>
```

Immediately replace that wrapper-anchor structure with the accessible final structure:

```html
<article class="py-5">
  <a href="{{ .RelPermalink }}" class="block space-y-2">
    <h2 class="text-2xl font-extrabold tracking-tight">{{ .Title }}</h2>
    <p class="text-sm text-slate-600">{{ .Summary | plainify }}</p>
    <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
      <span>{{ .Date | time.Format ":date_medium" }}</span>
      <span class="inline-flex items-center gap-1.5">
        {{ partial "icon.html" (dict "name" "timer" "class" "h-4 w-4") }}
        <span>{{ .ReadingTime }} min</span>
      </span>
    </div>
  </a>
  {{ partial "post-meta.html" (dict "page" . "surface" "list") }}
</article>
```

Add `{{ partial "post-taxonomy.html" (dict "page" . "surface" "list") }}` after the main post link, since date and reading time now stay inside the main row link and taxonomy lives in its own partial.

- [ ] **Step 2: Delete the unused card partial**

Remove `layouts/_partials/post-card.html` after confirming there are no references to it.

```bash
rm layouts/_partials/post-card.html
```

- [ ] **Step 3: Update the row template to use `post-taxonomy.html` outside the main link**

Ensure `layouts/_partials/post-row.html` ends with this structure:

```html
<article class="py-5">
  <a href="{{ .RelPermalink }}" class="block space-y-2">
    <h2 class="text-2xl font-extrabold tracking-tight">{{ .Title }}</h2>
    <p class="text-sm text-slate-600">{{ .Summary | plainify }}</p>
    {{ partial "post-meta.html" (dict "page" .) }}
  </a>
  {{ partial "post-taxonomy.html" (dict "page" . "surface" "list") }}
</article>
```

- [ ] **Step 4: Run the focused metadata tests to verify the new structure passes**

Run: `npm run test:e2e -- --grep "metadata|taxonomy links"`

Expected:
- all metadata consistency and row interaction tests pass
- no nested-anchor failures remain

- [ ] **Step 5: Commit the list-surface restructuring**

```bash
git add layouts/_partials/post-meta.html layouts/_partials/post-taxonomy.html layouts/_partials/post-row.html tests/e2e/theme.spec.js
git add -u layouts/_partials/post-card.html
git commit -m "fix: separate taxonomy links from row navigation"
```

### Task 4: Run Full Regression Verification

**Files:**
- Test: `tests/e2e/theme.spec.js`
- Test: `tests/unit/example-site.test.js`

- [ ] **Step 1: Run the unit test suite**

Run: `npm test`

Expected:
- `9` test files pass
- no new unit regressions appear

- [ ] **Step 2: Run the full end-to-end suite**

Run: `npm run test:e2e`

Expected:
- all Playwright tests pass
- metadata interaction coverage stays green across single and list surfaces

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected:
- Hugo build succeeds without template errors

- [ ] **Step 4: Commit the verified final state if verification required any assertion tweaks**

If no files changed during verification, skip this commit.

If assertions or selectors needed correction, commit them with:

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: finalize metadata interaction coverage"
```

## Self-Review Checklist

- Spec coverage:
  - consistent series links everywhere: Task 2
  - consistent tag chips everywhere: Task 2
  - split `post-meta` and `post-taxonomy` partials: Task 2
  - list-surface accessibility restructure: Task 3
  - clickable row taxonomy links without nested anchors: Task 1 and Task 3
  - verification on the full suite: Task 4
- Placeholder scan:
  - no `TODO`, `TBD`, or vague “handle later” language remains in task steps
- Type consistency:
  - `surface` is the single mode flag used on `post-taxonomy.html`
  - list surfaces consistently call `partial "post-taxonomy.html" (dict "page" . "surface" "list")`

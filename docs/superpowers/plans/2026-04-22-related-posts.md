# Related Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Related` section below single post content that shows up to 4 Hugo-related posts, excludes same-series posts, and reuses the existing home-page post row component.

**Architecture:** Add one new Hugo partial dedicated to related-post filtering and rendering, then wire it into `layouts/single.html` directly after the series navigation partial. Make related results deterministic for tests by adding explicit `related` config in `exampleSite/hugo.yaml`, cover filtering/visibility with unit tests, then verify order and row reuse with Playwright.

**Tech Stack:** Hugo templates, Hugo related-content config, Tailwind utility classes, Vitest, Playwright

---

## File Map

- Create: `layouts/_partials/related-posts.html`
- Modify: `layouts/single.html`
- Modify: `exampleSite/hugo.yaml`
- Modify: `exampleSite/content/posts/first-post.md`
- Modify: `exampleSite/content/posts/second-post.md`
- Modify: `exampleSite/content/posts/toc-stress-post.md`
- Modify: `tests/unit/example-site.test.js`
- Modify: `tests/e2e/theme.spec.js`

### Task 1: Add failing unit coverage and deterministic related configuration

**Files:**

- Modify: `exampleSite/hugo.yaml`
- Modify: `exampleSite/content/posts/first-post.md`
- Modify: `exampleSite/content/posts/second-post.md`
- Modify: `exampleSite/content/posts/toc-stress-post.md`
- Modify: `tests/unit/example-site.test.js`
- Test: `tests/unit/example-site.test.js`

- [ ] **Step 1: Add explicit related configuration to the example site**

Update `exampleSite/hugo.yaml` to add a `related` block after `taxonomies`:

```yaml
related:
  includeNewer: true
  threshold: 20
  toLower: true
  indices:
    - name: tags
      weight: 100
    - name: summary
      weight: 70
    - name: date
      weight: 20
      pattern: "200601"
```

- [ ] **Step 2: Tune fixture posts so related results are deterministic**

Update front matter in these files:

`exampleSite/content/posts/first-post.md`

```yaml
---
title: First Post
date: 2026-04-05
summary: A searchable Hugo theme post with headings.
tags: [hugo, theme]
series: [build-notes]
featuredImage: /images/post-1.jpg
---
```

`exampleSite/content/posts/second-post.md`

```yaml
---
title: Second Post
date: 2026-04-04
summary: A Hugo theme follow-up post without optional metadata.
tags: [hugo, theme]
---
```

`exampleSite/content/posts/toc-stress-post.md`

```yaml
---
title: TOC Stress Post
date: 2026-04-06
summary: A long Hugo theme post for TOC rendering and scroll behavior.
tags: [hugo, theme, toc, longform, testing]
---
```

This keeps `First Post` related to `Second Post` and `TOC Stress Post`, while same-series content for `First Post` remains excluded later by template logic.

- [ ] **Step 3: Add failing unit tests for related-post filtering and hiding**

Append these tests near the end of `tests/unit/example-site.test.js`:

```js
it("renders related posts below series navigation and excludes same-series posts", () => {
  const { siteDir, themeDir, themesDir } = createSiteFixture(
    "mh-theme-related-posts-",
  );

  fs.writeFileSync(
    path.join(siteDir, "hugo.yaml"),
    'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\ntaxonomies:\n  tag: tags\n  series: series\nrelated:\n  includeNewer: true\n  threshold: 20\n  toLower: true\n  indices:\n    - name: tags\n      weight: 100\n    - name: summary\n      weight: 80\n    - name: date\n      weight: 20\n      pattern: "200601"\n',
  );

  writePost(
    siteDir,
    "anchor",
    "---\ntitle: Anchor Post\ndate: 2026-04-05\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
  );
  writePost(
    siteDir,
    "same-series",
    "---\ntitle: Same Series Post\ndate: 2026-04-06\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
  );
  writePost(
    siteDir,
    "related-a",
    "---\ntitle: Related A\ndate: 2026-04-04\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\n---\n",
  );
  writePost(
    siteDir,
    "related-b",
    "---\ntitle: Related B\ndate: 2026-04-03\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\n---\n",
  );
  writePost(
    siteDir,
    "related-c",
    "---\ntitle: Related C\ndate: 2026-04-02\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\n---\n",
  );
  writePost(
    siteDir,
    "related-d",
    "---\ntitle: Related D\ndate: 2026-04-01\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\n---\n",
  );
  writePost(
    siteDir,
    "related-e",
    "---\ntitle: Related E\ndate: 2026-03-31\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\n---\n",
  );

  renderSite(themeDir, siteDir, themesDir);

  const html = readPostHtml(siteDir, "anchor");

  expect(html).toContain(">Related<");
  expect(html).toContain('aria-label="Series navigation"');
  expect(html.indexOf('aria-label="Series navigation"')).toBeLessThan(
    html.indexOf(">Related<"),
  );
  expect(html).toContain("Related A");
  expect(html).toContain("Related B");
  expect(html).toContain("Related C");
  expect(html).toContain("Related D");
  expect(html).not.toContain("Same Series Post");
  expect(html).not.toContain("Related E");
});

it("hides related posts when only same-series candidates remain", () => {
  const { siteDir, themeDir, themesDir } = createSiteFixture(
    "mh-theme-related-hidden-",
  );

  fs.writeFileSync(
    path.join(siteDir, "hugo.yaml"),
    'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\ntaxonomies:\n  tag: tags\n  series: series\nrelated:\n  includeNewer: true\n  threshold: 20\n  toLower: true\n  indices:\n    - name: tags\n      weight: 100\n    - name: summary\n      weight: 80\n    - name: date\n      weight: 20\n      pattern: "200601"\n',
  );

  writePost(
    siteDir,
    "anchor",
    "---\ntitle: Anchor Post\ndate: 2026-04-05\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
  );
  writePost(
    siteDir,
    "same-series-a",
    "---\ntitle: Same Series A\ndate: 2026-04-04\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
  );
  writePost(
    siteDir,
    "same-series-b",
    "---\ntitle: Same Series B\ndate: 2026-04-03\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
  );

  renderSite(themeDir, siteDir, themesDir);

  const html = readPostHtml(siteDir, "anchor");

  expect(html).not.toContain(">Related<");
  expect(html).not.toContain("Same Series A");
  expect(html).not.toContain("Same Series B");
});
```

- [ ] **Step 4: Run targeted unit tests to verify failure**

Run:

```bash
npm test -- --run tests/unit/example-site.test.js
```

Expected: FAIL because `related-posts.html` does not exist and `single.html` does not render related posts yet.

- [ ] **Step 5: Commit failing test and fixture changes**

```bash
git add exampleSite/hugo.yaml exampleSite/content/posts/first-post.md exampleSite/content/posts/second-post.md exampleSite/content/posts/toc-stress-post.md tests/unit/example-site.test.js
git commit -m "test: add related post fixtures"
```

### Task 2: Implement related-posts partial and wire it into single posts

**Files:**

- Create: `layouts/_partials/related-posts.html`
- Modify: `layouts/single.html`
- Test: `tests/unit/example-site.test.js`

- [ ] **Step 1: Create `layouts/_partials/related-posts.html`**

Create file with this content:

```go-html-template
{{ $page := . }}
{{ $related := slice }}
{{ $currentSeries := $page.GetTerms "series" }}

{{ range $candidate := $page.Site.RegularPages.Related $page }}
  {{ if ne $candidate.RelPermalink $page.RelPermalink }}
    {{ $exclude := false }}
    {{ if gt (len $currentSeries) 0 }}
      {{ $candidateSeries := $candidate.GetTerms "series" }}
      {{ range $seriesPage := $currentSeries }}
        {{ range $candidateTerm := $candidateSeries }}
          {{ if eq $seriesPage.RelPermalink $candidateTerm.RelPermalink }}
            {{ $exclude = true }}
          {{ end }}
        {{ end }}
      {{ end }}
    {{ end }}
    {{ if not $exclude }}
      {{ $related = $related | append $candidate }}
    {{ end }}
  {{ end }}
{{ end }}

{{ with first 4 $related }}
  <section class="pt-4" aria-labelledby="related-posts-heading">
    <h2 id="related-posts-heading" class="text-sm font-bold uppercase tracking-wide">Related</h2>
    <div class="mt-4">
      {{ range $index, $relatedPage := . }}
        {{ if gt $index 0 }}<hr class="border-purple-200">{{ end }}
        {{ partial "post-row.html" $relatedPage }}
      {{ end }}
    </div>
  </section>
{{ end }}
```

- [ ] **Step 2: Render related posts after series navigation in `layouts/single.html`**

Update the article block in `layouts/single.html`:

```go-html-template
    <article id="post-content" class="min-w-0 space-y-6">
      {{ with .Params.featuredImage }}<img src="{{ . }}" alt="" class="w-full rounded-2xl object-cover">{{ end }}
      {{ partial "post-header.html" (dict "page" . "surface" "aligned") }}
      <div class="prose prose-slate max-w-none" data-content-body>{{ .Content }}</div>
      {{ partial "series-navigation.html" . }}
      {{ partial "related-posts.html" . }}
    </article>
```

- [ ] **Step 3: Run targeted unit tests to verify they pass**

Run:

```bash
npm test -- --run tests/unit/example-site.test.js
```

Expected: PASS for new related-post tests and existing single-post tests.

- [ ] **Step 4: Commit related-posts implementation**

```bash
git add layouts/_partials/related-posts.html layouts/single.html
git commit -m "feat: add related post rows"
```

### Task 3: Add Playwright coverage for related-post behavior

**Files:**

- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add e2e test for related section order and content**

Append these tests near existing series-navigation coverage:

```js
test("single posts show related rows below series navigation", async ({
  page,
}) => {
  await page.goto("/posts/first-post/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const relatedHeading = page.getByRole("heading", {
    name: "Related",
    exact: true,
  });
  const relatedSection = page
    .locator("section")
    .filter({ has: relatedHeading });

  await expect(nav).toBeVisible();
  await expect(relatedHeading).toBeVisible();
  await expect(
    relatedSection.getByRole("link", { name: "Second Post" }),
  ).toBeVisible();
  await expect(
    relatedSection.getByRole("link", { name: "TOC Stress Post" }),
  ).toBeVisible();
  await expect(
    relatedSection.getByRole("link", { name: "Series Part 1" }),
  ).toHaveCount(0);

  const [navBox, relatedBox] = await Promise.all([
    getBox(nav),
    getBox(relatedSection),
  ]);
  expect(relatedBox.top).toBeGreaterThan(navBox.bottom);
});

test("related posts reuse home-page row styling and stay capped at four items", async ({
  page,
}) => {
  await page.goto("/posts/first-post/");

  const relatedSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Related", exact: true }),
  });
  const relatedArticles = relatedSection.locator("article");

  await expect(relatedArticles).toHaveCount(2);
  await expect(relatedArticles.first()).toHaveClass(/py-5/);
});
```

- [ ] **Step 2: Add e2e test for hidden related section when no eligible posts remain**

Add one more test:

```js
test("single posts hide related heading when no eligible related posts remain", async ({
  page,
}) => {
  await page.goto("/posts/series-part-1/");

  await expect(
    page.getByRole("heading", { name: "Related", exact: true }),
  ).toHaveCount(0);
});
```

- [ ] **Step 3: Run targeted e2e tests**

Run:

```bash
npm run test:e2e -- --grep "related rows|hide related heading"
```

Expected: PASS for all new related-post tests.

- [ ] **Step 4: Commit e2e coverage**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: cover related post rows"
```

### Task 4: Run full verification

**Files:**

- Test: `tests/unit/example-site.test.js`
- Test: `tests/e2e/theme.spec.js`
- Test: Hugo build output

- [ ] **Step 1: Re-run targeted related e2e tests before full suite**

Run:

```bash
npm run test:e2e -- --grep "related rows|hide related heading"
```

Expected: PASS

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

- [ ] **Step 3: Commit verification-only fixes if any are needed**

If verification requires no additional changes, do not create an empty commit.

If verification requires fixes, commit them with:

```bash
git add <relevant-files>
git commit -m "fix: polish related post behavior"
```

## Self-Review

- Spec coverage: plan covers partial creation, placement below series nav, Hugo related-post source, same-series exclusion, 4-item cap, row reuse, explicit `Related` header, hidden empty state, and deterministic related configuration.
- Placeholder scan: no `TODO`, `TBD`, or vague implementation instructions remain.
- Type consistency: plan uses `related-posts.html`, `series-navigation.html`, `post-row.html`, `Related`, and related config indices `tags` / `summary` / `date` consistently across tasks.

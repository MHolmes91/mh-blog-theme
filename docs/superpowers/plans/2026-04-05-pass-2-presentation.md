# Pass 2 Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the theme’s browsing surfaces and typography by moving to a row-based list presentation, using Lato only, keeping browser-preference-only theme behavior, and strengthening shortcode integration coverage.

**Architecture:** This pass stays within the presentation layer. It introduces a dedicated row-summary partial for browsing surfaces, updates the home and list templates to use divider-based composition, simplifies theme-mode logic to browser preference only, and verifies the resulting Tailwind-rendered output through build and Playwright coverage rather than new unit tests.

**Tech Stack:** Hugo templates, TailwindCSS, Alpine.js, Playwright, Hugo exampleSite fixtures

---

## File Structure Map

- Modify: `assets/css/app.css` - remove `PT Sans`, retune heading styles for Lato-only hierarchy, add visited-link styling, and support row/divider layout styling
- Modify: `assets/js/lib/theme.js` - simplify theme resolution to browser-preference-only logic if extra state remains
- Modify: `assets/js/app.js` - remove any manual/stored theme-state assumptions while preserving existing non-theme interactions
- Create: `layouts/_partials/post-row.html` - dedicated browsing-surface summary partial using row/divider-friendly markup
- Modify: `layouts/_partials/post-meta.html` - keep metadata reusable for row layout and card-free browsing surfaces
- Modify: `layouts/home.html` - replace card-style recent posts with row layout and intro/list divider structure
- Modify: `layouts/list.html` - replace card-style post summaries with row layout on list and taxonomy term pages
- Optionally modify: `layouts/archives.html` - align archive page with row-based browsing surface if it does not already flow through the generic list behavior cleanly
- Modify: `tests/e2e/theme.spec.js` - adjust browsing-surface assertions to the new row markup and strengthen shortcode integration coverage for supported shortcode output

### Task 1: Move To Lato-Only Typography And Browser-Only Theme Preference

**Files:**

- Modify: `assets/css/app.css`
- Modify: `assets/js/lib/theme.js`
- Modify: `assets/js/app.js`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing integration coverage for Lato-only and browser-only theme behavior**

```js
test("home page uses Lato-only typography styling", async ({ page }) => {
  await page.goto("/");

  const bodyFont = await page
    .locator("body")
    .evaluate((node) => getComputedStyle(node).fontFamily);
  const headingFont = await page
    .getByRole("heading", { name: "Mark's Notes" })
    .evaluate((node) => getComputedStyle(node).fontFamily);

  expect(bodyFont).toContain("Lato");
  expect(headingFont).toContain("Lato");
});

test("browser dark preference controls theme without stored override state", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await context.close();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "Lato-only typography|browser dark preference"`
Expected: FAIL because headings still use `PT Sans` and the theme logic may still carry stored-theme shape

- [ ] **Step 3: Write the minimal implementation**

```css
/* assets/css/app.css */
@import url("https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap");
@import "tailwindcss";

@theme {
  --color-bg: #faf7ff;
  --color-surface: #ffffff;
  --color-text: #20172b;
  --color-accent: #7c3aed;
}

body {
  font-family: "Lato", sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: "Lato", sans-serif;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

a:visited {
  color: color-mix(in srgb, var(--color-accent) 72%, black 28%);
}

[x-cloak] {
  display: none !important;
}
```

```js
// assets/js/lib/theme.js
export function resolveTheme({ systemPrefersDark }) {
  return systemPrefersDark ? "dark" : "light";
}
```

```js
// assets/js/app.js (theme call site only)
theme: resolveTheme({
  systemPrefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "Lato-only typography|browser dark preference"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add assets/css/app.css assets/js/lib/theme.js assets/js/app.js tests/e2e/theme.spec.js
git commit -m "style: switch to lato-only typography"
```

### Task 2: Introduce A Dedicated Row Summary Partial

**Files:**

- Create: `layouts/_partials/post-row.html`
- Modify: `layouts/_partials/post-meta.html`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing integration coverage for row summaries**

```js
test("posts list page uses divider-based row summaries", async ({ page }) => {
  await page.goto("/posts/");

  await expect(page.locator("main article")).toHaveCount(8);
  await expect(page.locator("main hr")).toHaveCount(7);
  await expect(page.locator("main article").first()).not.toHaveClass(
    /rounded-2xl/,
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "divider-based row summaries"`
Expected: FAIL because list pages still use card-style summary markup without `hr` separation

- [ ] **Step 3: Write the minimal implementation**

```go-html-template
<!-- layouts/_partials/post-row.html -->
<article class="py-5">
  <a href="{{ .RelPermalink }}" class="block space-y-2">
    <h2 class="text-2xl font-extrabold tracking-tight">{{ .Title }}</h2>
    <p class="text-sm text-slate-600">{{ .Summary | plainify }}</p>
    {{ partial "post-meta.html" . }}
  </a>
</article>
```

```go-html-template
<!-- layouts/_partials/post-meta.html -->
<div class="flex flex-wrap gap-3 text-sm text-slate-500">
  <span>{{ .Date | time.Format ":date_medium" }}</span>
  <span>{{ .ReadingTime }} min</span>
  {{ with .Params.tags }}<span>{{ delimit . ", " }}</span>{{ end }}
  {{ with .Params.series }}<span>{{ delimit . ", " }}</span>{{ end }}
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "divider-based row summaries"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/_partials/post-row.html layouts/_partials/post-meta.html tests/e2e/theme.spec.js
git commit -m "feat: add row summary partial"
```

### Task 3: Apply Row Layout To Home And List Surfaces

**Files:**

- Modify: `layouts/home.html`
- Modify: `layouts/list.html`
- Optionally modify: `layouts/archives.html`
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing integration coverage for the new home/list layout**

```js
test("home page separates intro and recent posts with structural dividers", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("main hr")).toHaveCount(7);
  await expect(page.getByText("Mark's Notes")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "TOC Stress Post" }),
  ).toBeVisible();
});

test("tag term pages render row summaries instead of cards", async ({
  page,
}) => {
  await page.goto("/tags/fixture/");

  await expect(page.locator("main article").first()).not.toHaveClass(
    /rounded-2xl/,
  );
  await expect(page.locator("main hr")).toHaveCount(5);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "structural dividers|row summaries instead of cards"`
Expected: FAIL because home and term/list pages still use card-style blocks

- [ ] **Step 3: Write the minimal implementation**

```go-html-template
<!-- layouts/home.html -->
{{ define "main" }}
  <section class="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
    <div class="lg:pr-8 lg:border-r lg:border-purple-200">
      <h1 class="text-3xl font-extrabold tracking-tight">{{ site.Params.intro.title }}</h1>
      <p class="mt-3 text-base leading-7">{{ site.Params.intro.body }}</p>
    </div>
    <div>
      {{ range $index, $page := first 10 (where site.RegularPages.ByDate.Reverse "Section" "posts") }}
        {{ if gt $index 0 }}<hr class="border-purple-200">{{ end }}
        {{ partial "post-row.html" $page }}
      {{ end }}
    </div>
  </section>
{{ end }}
```

```go-html-template
<!-- layouts/list.html -->
{{ define "main" }}
  <section class="mx-auto max-w-4xl px-6 py-10">
    <h1 class="text-3xl font-extrabold tracking-tight">{{ .Title }}</h1>
    <div class="mt-6">
      {{ range $index, $page := .Pages }}
        {{ if gt $index 0 }}<hr class="border-purple-200">{{ end }}
        {{ if .IsPage }}
          {{ partial "post-row.html" $page }}
        {{ else }}
          <article class="py-5">
            <a href="{{ .RelPermalink }}" class="block text-2xl font-extrabold tracking-tight">{{ .Title }}</a>
          </article>
        {{ end }}
      {{ end }}
    </div>
  </section>
{{ end }}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "structural dividers|row summaries instead of cards"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/home.html layouts/list.html layouts/archives.html tests/e2e/theme.spec.js
git commit -m "style: apply row layout to browsing surfaces"
```

### Task 4: Strengthen Shortcode Integration Coverage And Final Verification

**Files:**

- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing shortcode integration assertions**

```js
test("shortcode fixture shows visible output for supported shortcode blocks", async ({
  page,
}) => {
  await page.goto("/posts/shortcodes-builtins/");

  await expect(page.locator("article .highlight")).toBeVisible();
  await expect(page.locator("article .highlight code")).toContainText(
    "func main()",
  );
  await expect(page.locator("article img")).toHaveAttribute(
    "src",
    /\/images\/post-1\.jpg$/,
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/theme.spec.js --grep "supported shortcode blocks"`
Expected: FAIL if the current assertion set does not yet prove visible shortcode output strongly enough

- [ ] **Step 3: Write the minimal test-extension implementation**

```js
// Update the existing shortcode fixture coverage in tests/e2e/theme.spec.js
// so supported shortcode output is asserted as visible rendered content,
// not only page existence.
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm run build && npm run test:e2e`
Expected: Hugo/Tailwind build passes and the full Playwright suite passes

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: strengthen shortcode integration coverage"
```

## Self-Review

### Spec Coverage

- Dedicated row-style browsing summary component: Task 2
- Apply row/divider layout to home, archive/list, and taxonomy term pages: Task 3
- Lato-only typography with heading retuning: Task 1
- Browser-preference-only theme behavior: Task 1
- Browser `:visited` semantics: Task 1
- Tailwind build integrity through real verification, not unit tests: Task 4
- Stronger shortcode integration coverage: Task 4

No spec gaps remain.

### Placeholder Scan

- No `TODO` or `TBD` placeholders remain.
- Every task includes exact file paths, verification commands, and concrete code or assertion targets.
- The few comment-style snippets in test-extension steps describe modifying the named existing file and are paired with exact commands/outcomes.

### Type Consistency

- Row summary partial name stays `post-row.html` throughout the plan.
- Theme helper remains `resolveTheme` while simplifying its argument shape.
- Browsing-surface terminology remains consistent across home, list, archive, and taxonomy pages.

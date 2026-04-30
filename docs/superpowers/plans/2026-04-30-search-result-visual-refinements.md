# Search Result Visual Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve search result hover/focus, overlay click handling, and metadata spacing/color while moving visual result rules out of Alpine class strings.

**Architecture:** Keep search state and result ordering in Alpine, but use semantic CSS classes for all search-result presentation. Update Playwright coverage around visible search behavior and keep existing search helper unit tests unchanged.

**Tech Stack:** Hugo templates, Alpine.js bindings, CSS custom properties in `assets/css/app.css`, Playwright e2e tests, Vitest unit tests.

---

## File Structure

- Modify `layouts/_partials/header.html`: simplify search result class bindings, add semantic metadata classes, and make overlay/dialog markup explicitly full-screen/backdrop-click friendly.
- Modify `assets/css/app.css`: add hover/focus card background, semantic metadata item styles, series/tag spacing, and row vertical spacing.
- Modify `tests/e2e/theme.spec.js`: add e2e coverage for overlay viewport/backdrop close, result card hover/focus background, and metadata color/spacing.

### Task 1: Add Failing Search UI Tests

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add overlay viewport and backdrop test**

Replace the existing `search closes when clicking the overlay` test with:

```js
test("search overlay covers viewport and closes on backdrop click", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();

  const overlay = page.getByTestId("search-overlay");
  await expect(page.getByPlaceholder("Search posts")).toBeVisible();
  await expect(overlay).toHaveCSS("position", "fixed");

  const overlayBox = await overlay.boundingBox();
  expect(overlayBox).not.toBeNull();
  expect(overlayBox?.x).toBe(0);
  expect(overlayBox?.y).toBe(0);
  expect(overlayBox?.width).toBe(900);
  expect(overlayBox?.height).toBe(600);

  await overlay.click({ position: { x: 12, y: 12 } });

  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
});
```

- [ ] **Step 2: Add card hover/focus background test**

Add this test after the overlay test:

```js
test("search result cards brighten on hover and focus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  const result = page.locator("[data-result-index]").first();
  await expect(result).toBeVisible();

  const baseBackground = await result.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );

  await result.hover();
  await expect
    .poll(() => result.evaluate((node) => getComputedStyle(node).backgroundColor))
    .not.toBe(baseBackground);
  const hoverBackground = await result.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );

  await result.focus();
  await expect
    .poll(() => result.evaluate((node) => getComputedStyle(node).backgroundColor))
    .toBe(hoverBackground);
});
```

- [ ] **Step 3: Add metadata color and spacing test**

Add this test after `search shows all metadata and orders matching items first`:

```js
test("search metadata styles series and tag spacing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("fixture-series");

  const result = page
    .locator("[data-result-index]")
    .filter({ has: page.getByText("Series Part 1", { exact: true }) })
    .first();
  const metadata = result.locator(".search-result-meta");
  const matchedSeries = result.locator(".search-result-meta-series-matched").first();
  const tag = result.locator(".search-result-meta-tag").first();

  await expect(result).toBeVisible();
  await expect(matchedSeries).toBeVisible();
  await expect(tag).toBeVisible();

  const metrics = await result.evaluate((node) => {
    const metadataNode = node.querySelector(".search-result-meta");
    const title = node.querySelector(".search-result-title");
    const series = node.querySelector(".search-result-meta-series-matched");
    const tagNode = node.querySelector(".search-result-meta-tag");
    const mark = document.createElement("mark");
    mark.textContent = "sample";
    document.body.appendChild(mark);

    const metadataRect = metadataNode?.getBoundingClientRect();
    const titleRect = title?.getBoundingClientRect();
    const seriesRect = series?.getBoundingClientRect();
    const tagRect = tagNode?.getBoundingClientRect();
    const seriesStyle = series ? getComputedStyle(series) : null;
    const markBackground = getComputedStyle(mark).backgroundColor;
    mark.remove();

    return {
      metadataGap: metadataRect && titleRect ? metadataRect.top - titleRect.bottom : 0,
      seriesToTagGap: seriesRect && tagRect ? tagRect.left - seriesRect.right : 0,
      seriesColor: seriesStyle?.color,
      markBackground,
    };
  });

  await expect(metadata).toHaveClass(/search-result-meta/);
  expect(metrics.metadataGap).toBeGreaterThanOrEqual(6);
  expect(metrics.seriesToTagGap).toBeGreaterThanOrEqual(8);
  expect(metrics.seriesColor).toBe(metrics.markBackground);
});
```

Add this test immediately after it:

```js
test("search metadata uses muted color for unmatched series", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("part");

  const result = page
    .locator("[data-result-index]")
    .filter({ has: page.getByText("Series Part 1", { exact: true }) })
    .first();
  const series = result.locator(".search-result-meta-series").first();

  await expect(result).toBeVisible();
  await expect(series).toBeVisible();

  const colors = await series.evaluate((node) => {
    const sample = document.createElement("span");
    sample.style.color = "var(--color-muted)";
    document.body.appendChild(sample);
    const seriesColor = getComputedStyle(node).color;
    const mutedColor = getComputedStyle(sample).color;
    sample.remove();

    return { seriesColor, mutedColor };
  });

  expect(colors.seriesColor).toBe(colors.mutedColor);
});
```

- [ ] **Step 4: Run the new tests and verify they fail**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "search overlay covers viewport and closes on backdrop click|search result cards brighten on hover and focus|search metadata styles series and tag spacing"
```

Expected: FAIL before implementation because the semantic metadata classes do not exist and hover/focus background behavior is not implemented.

### Task 2: Refactor Search Result Markup To Semantic Classes

**Files:**
- Modify: `layouts/_partials/header.html`

- [ ] **Step 1: Make overlay/dialog layout explicit**

Change the search overlay opening `div` class from:

```html
class="fixed inset-0 z-50 bg-black/40 p-6"
```

to:

```html
class="fixed inset-0 z-50 flex min-h-screen w-screen items-start justify-center bg-black/40 p-6"
```

Keep these existing attributes unchanged:

```html
x-cloak
x-show="searchOpen"
@click.self="closeSearch"
@keydown.escape.window="closeSearch"
data-testid="search-overlay"
```

- [ ] **Step 2: Update dialog sizing**

Change the dialog class from:

```html
class="mx-auto max-w-2xl rounded-2xl bg-white p-4"
```

to:

```html
class="w-full max-w-2xl rounded-2xl bg-white p-4"
```

- [ ] **Step 3: Simplify result card classes**

Change the result link from:

```html
class="search-result-card block rounded border px-3 py-2 transition-colors"
:class="index === activeResultIndex
  ? 'search-result-card-active border-purple-400'
  : 'border-purple-200 hover:border-purple-300'"
```

to:

```html
class="search-result-card block rounded border px-3 py-2 transition-colors"
:class="{ 'search-result-card-active border-purple-400': index === activeResultIndex }"
```

- [ ] **Step 4: Increase metadata row spacing in markup**

Change metadata row class from:

```html
class="search-result-meta mt-1 flex min-h-[1.25rem] flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap"
```

to:

```html
class="search-result-meta my-2 flex min-h-[1.25rem] flex-nowrap items-center overflow-x-auto overflow-y-hidden whitespace-nowrap"
```

- [ ] **Step 5: Replace metadata item Alpine class strings**

Change the metadata `span` from:

```html
<span
  x-text="item.label"
  class="shrink-0 text-xs"
  :class="item.kind === 'series'
    ? (item.matched ? 'underline font-semibold text-slate-900' : 'underline text-slate-900')
    : (item.matched
      ? 'inline-block rounded-full bg-purple-200 px-2 py-0.5 font-semibold text-purple-900'
      : 'inline-block rounded-full bg-purple-100 px-2 py-0.5 text-slate-700')"
></span>
```

to:

```html
<span
  x-text="item.label"
  class="search-result-meta-item shrink-0 text-xs"
  :class="{
    'search-result-meta-series': item.kind === 'series' && !item.matched,
    'search-result-meta-series-matched': item.kind === 'series' && item.matched,
    'search-result-meta-tag': item.kind === 'tag' && !item.matched,
    'search-result-meta-tag-matched': item.kind === 'tag' && item.matched,
  }"
></span>
```

### Task 3: Add Search Result CSS Rules

**Files:**
- Modify: `assets/css/app.css`

- [ ] **Step 1: Update card base and interactive styles**

Replace the existing `.search-result-card` and `.search-result-card-active` block with:

```css
.search-result-card {
  height: var(--search-result-card-height);
  border-color: var(--color-border);
  background-color: var(--color-surface);
}

.search-result-card:hover,
.search-result-card:focus-visible {
  background-color: color-mix(
    in srgb,
    var(--color-accent) 10%,
    var(--color-surface)
  );
  border-color: var(--color-accent);
  outline: none;
}

.search-result-card-active {
  background-color: color-mix(
    in srgb,
    var(--color-accent) 14%,
    var(--color-surface)
  );
  border-color: var(--color-accent);
}
```

- [ ] **Step 2: Add semantic metadata styles**

After the `.search-result-meta` block, add:

```css
.search-result-meta-item {
  display: inline-block;
}

.search-result-meta-series,
.search-result-meta-series-matched {
  padding-right: 0.75rem;
  text-decoration-line: underline;
}

.search-result-meta-series {
  color: var(--color-muted);
}

.search-result-meta-series-matched {
  color: var(--color-accent);
  font-weight: 600;
}

.search-result-meta-tag,
.search-result-meta-tag-matched {
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
}

.search-result-meta-tag {
  background-color: color-mix(
    in srgb,
    var(--color-accent) 12%,
    var(--color-surface)
  );
  color: var(--color-text);
}

.search-result-meta-tag-matched {
  background-color: color-mix(
    in srgb,
    var(--color-accent) 24%,
    var(--color-surface)
  );
  color: var(--color-accent);
  font-weight: 600;
}

.search-result-meta-tag + .search-result-meta-tag,
.search-result-meta-tag + .search-result-meta-tag-matched,
.search-result-meta-tag-matched + .search-result-meta-tag,
.search-result-meta-tag-matched + .search-result-meta-tag-matched {
  margin-left: 0.375rem;
}
```

### Task 4: Verify Search UI Refinements

**Files:**
- Verify: `layouts/_partials/header.html`
- Verify: `assets/css/app.css`
- Verify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Run targeted e2e tests**

Run:

```bash
npx playwright test tests/e2e/theme.spec.js -g "search overlay covers viewport and closes on backdrop click|search result cards brighten on hover and focus|search metadata styles series and tag spacing|search metadata uses muted color for unmatched series|search arrow keys navigate results|search wraps around with arrow keys|search shows all metadata and orders matching items first"
```

Expected: PASS.

- [ ] **Step 2: Run full e2e suite**

Run:

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 3: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Review diff**

Run:

```bash
git diff -- layouts/_partials/header.html assets/css/app.css tests/e2e/theme.spec.js docs/superpowers/specs/2026-04-30-search-result-visual-refinements-design.md docs/superpowers/plans/2026-04-30-search-result-visual-refinements.md
```

Expected: diff contains only search-result markup/CSS/test changes and the design/plan docs.

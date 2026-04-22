# Search Results Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a search results count below the search input when the modal has at least one result, using `1 result` for the singular case and `N results` otherwise.

**Architecture:** Keep the behavior in the existing search modal template in `layouts/_partials/header.html` and derive the count directly from the existing Alpine `results` getter. Verify the user-visible behavior through the existing Playwright search coverage in `tests/e2e/theme.spec.js`, adding assertions for multi-result, singular, short-query, and no-results states.

**Tech Stack:** Hugo templates, Alpine.js, Playwright, Node.js

---

## File Structure

- Modify: `tests/e2e/theme.spec.js`
  - Extend the existing search modal coverage with count assertions that fail before the template change.
- Modify: `layouts/_partials/header.html`
  - Add the count row below the search input and above the results list, using the existing `results` array and tag-sized typography.

### Task 1: Add Failing Search Count UI Coverage

**Files:**
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing test coverage**

Insert the following tests after the existing `search shows no results for longer queries without matches` test in `tests/e2e/theme.spec.js`:

```js
test("search shows a plural count when multiple results are found", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");

  await expect(page.getByText("2 results")).toBeVisible();
  await expect(page.getByText("1 result", { exact: true })).toHaveCount(0);
});

test("search shows a singular count when one result is found", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("closing entry");

  await expect(page.getByText("1 result", { exact: true })).toBeVisible();
  await expect(page.getByText(/\d+ results/)).toHaveCount(0);
});
```

These values match the current fixtures: `post` returns two visible matches in the search modal, while `closing entry` returns one.

- [ ] **Step 2: Run the focused Playwright tests to verify they fail**

Run:

```bash
npm run test:e2e -- --grep "search shows a plural count when multiple results are found|search shows a singular count when one result is found"
```

Expected: FAIL because the search modal does not yet render any results count text.

- [ ] **Step 3: Add missing-state assertions to existing tests**

Update the existing short-query and no-results tests in `tests/e2e/theme.spec.js` with these assertions:

```js
test("search shows type more message for short queries", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("ab");

  await expect(page.getByText("Type at least 3 characters to search")).toBeVisible();
  await expect(page.getByText(/\d+ results?/)).toHaveCount(0);
  await expect(page.locator("[data-result-index]")).toHaveCount(0);
});

test("search shows no results for longer queries without matches", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("zzzmissing");

  await expect(page.getByText("No results")).toBeVisible();
  await expect(page.getByText("Type at least 3 characters to search")).toHaveCount(0);
  await expect(page.getByText(/\d+ results?/)).toHaveCount(0);
  await expect(page.locator("[data-result-index]")).toHaveCount(0);
});
```

- [ ] **Step 4: Run the focused Playwright state tests**

Run:

```bash
npm run test:e2e -- --grep "search shows type more message for short queries|search shows no results for longer queries without matches|search shows a plural count when multiple results are found|search shows a singular count when one result is found"
```

Expected: FAIL only on the two new count-visible tests, while the short-query and no-results assertions remain green.

- [ ] **Step 5: Commit the failing test changes**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: cover search results count states"
```

### Task 2: Render The Search Results Count

**Files:**
- Modify: `layouts/_partials/header.html`
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add the minimal template implementation**

Insert this block in `layouts/_partials/header.html` after the existing `No results` template and before `<div data-results-container class="search-results-list mt-4">`:

```html
          <template x-if="query.trim().length >= 3 && results.length">
            <p class="mt-4 text-xs text-slate-700">
              <span x-text="results.length === 1 ? '1 result' : `${results.length} results`"></span>
            </p>
          </template>
```

This keeps the logic in the template, renders only when there are matches, and uses the same text size as the existing metadata tag text.

- [ ] **Step 2: Run the focused Playwright tests to verify they pass**

Run:

```bash
npm run test:e2e -- --grep "search shows type more message for short queries|search shows no results for longer queries without matches|search shows a plural count when multiple results are found|search shows a singular count when one result is found"
```

Expected: PASS for all four tests.

- [ ] **Step 3: Run the full Playwright suite**

Run:

```bash
npm run test:e2e
```

Expected: PASS with no regressions in existing search modal behavior.

- [ ] **Step 4: Run the unit test suite as a regression check**

Run:

```bash
npm test
```

Expected: PASS because the search filtering logic remains unchanged.

- [ ] **Step 5: Commit the implementation**

```bash
git add layouts/_partials/header.html tests/e2e/theme.spec.js
git commit -m "feat: show search results count"
```

# Search Autofocus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Focus the search input automatically every time the search modal opens.

**Architecture:** Reuse the existing Alpine `openSearch()` flow instead of adding new modal lifecycle state. Add an Alpine ref to the search input in `layouts/_partials/header.html`, then focus it from `openSearch()` inside `$nextTick` so the modal is visible before focus is applied. Cover the behavior with a targeted Playwright test.

**Tech Stack:** Hugo templates, Alpine.js, vanilla JS ES modules, Playwright.

---

### Task 1: Focus the search input when the modal opens

**Files:**
- Modify: `layouts/_partials/header.html`
- Modify: `assets/js/app.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing end-to-end test**

Add this test near the existing search modal tests in `tests/e2e/theme.spec.js`:

```js
test("search focuses the input when opened", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByPlaceholder("Search posts")).toBeFocused();
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search focuses the input when opened"`
Expected: FAIL because the input is visible but not focused automatically.

- [ ] **Step 3: Add an Alpine ref to the search input**

Update the input in `layouts/_partials/header.html`:

```html
<input
  x-ref="searchInput"
  x-model="query"
  placeholder="Search posts"
  class="w-full rounded border border-purple-300 px-3 py-2"
  @keydown.enter.prevent="navigateToActiveResult()"
  @keydown.arrow-down.prevent="selectNextResult()"
  @keydown.arrow-up.prevent="selectPrevResult()"
/>
```

- [ ] **Step 4: Focus the input from `openSearch()`**

Update `assets/js/app.js` inside `openSearch()`:

```js
  async openSearch() {
    this._scrollYBeforeSearch = window.scrollY
    this._toolbarVisibleBeforeSearch = this.toolbarVisible
    this._toolbarTimerWasActiveBeforeSearch = Boolean(this._toolbarTimer)
    this.clearToolbarHideTimer()
    this.toolbarVisible = true
    this.searchOpen = true

    this.$nextTick(() => {
      this.$refs.searchInput?.focus()
    })

    if (!this.records.length) {
      this.records = await loadSearchRecords(fetch, searchUrl)
    }
  }
```

- [ ] **Step 5: Run the targeted test to verify it passes**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search focuses the input when opened"`
Expected: PASS.

- [ ] **Step 6: Run the search-focused regression slice**

Run: `lsof -ti:1313 | xargs kill -9 2>/dev/null || true && npx playwright test tests/e2e/theme.spec.js --grep "search"`
Expected: PASS for all search-related tests.

- [ ] **Step 7: Commit the autofocus change**

```bash
git add layouts/_partials/header.html assets/js/app.js tests/e2e/theme.spec.js
git commit -m "feat: autofocus search input on open"
```

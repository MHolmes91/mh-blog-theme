# Post-Only Chrome Hiding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep header auto-hide and the back-to-top button exclusive to post pages.

**Architecture:** Reuse the existing `#post-content` marker as the post-page signal inside the Alpine `siteUi` component. Non-post pages force `toolbarVisible` to stay true while existing post-page header, search, focus, and back-to-top behavior remains unchanged.

**Tech Stack:** Hugo templates, Alpine.js in `assets/js/app.js`, Playwright e2e tests in `tests/e2e/theme.spec.js`.

---

## File Structure

- Modify `assets/js/app.js`: compute `isPostPage` in `init()`, reuse it for back-to-top and toolbar visibility checks.
- Modify `tests/e2e/theme.spec.js`: add Playwright coverage that a non-post page never auto-hides the header after scrolling and waiting beyond the hide timeout.

### Task 1: Add Non-Post Header Visibility Test

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing test**

Insert this test after `header is sticky with backdrop blur on all pages`:

```js
test("header stays visible after scroll inactivity on non-post pages", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/");

  await page.evaluate(() => {
    const filler = document.createElement("div");
    filler.style.height = "1200px";
    document.querySelector("main")?.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });

  const banner = page.getByRole("banner");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3500);

  await expect(banner).not.toHaveClass(/opacity-0/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/theme.spec.js -g "header stays visible after scroll inactivity on non-post pages"`

Expected: FAIL because the global toolbar auto-hide currently adds `opacity-0` after scroll inactivity.

### Task 2: Gate Toolbar Hiding To Post Pages

**Files:**
- Modify: `assets/js/app.js`

- [ ] **Step 1: Add the shared post-page marker**

In `init()`, before `updateActiveTocEntry`, add:

```js
const postContent = document.getElementById('post-content')
const isPostPage = Boolean(postContent)
```

- [ ] **Step 2: Reuse the marker for back-to-top visibility**

Change `updateBackToTopVisibility` to:

```js
const updateBackToTopVisibility = () => {
  this.showBackToTop = isPostPage && window.scrollY > 320
}
```

- [ ] **Step 3: Prevent toolbar hiding outside posts**

At the start of `updateToolbarVisibility`, before reading `main`, add:

```js
if (!isPostPage) {
  this.clearToolbarHideTimer()
  this.toolbarVisible = true
  return
}
```

- [ ] **Step 4: Run targeted e2e tests**

Run: `npx playwright test tests/e2e/theme.spec.js -g "header (stays visible after scroll inactivity on non-post pages|fades out after 3 seconds of scroll inactivity below threshold)|back to top returns to the top of the page"`

Expected: PASS for the new non-post header test, existing post-page header fade test, and back-to-top test.

### Task 3: Final Verification

**Files:**
- Verify: `assets/js/app.js`
- Verify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Run full e2e suite**

Run: `npm run test:e2e`

Expected: PASS.

- [ ] **Step 2: Run unit tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 3: Review git diff**

Run: `git diff -- assets/js/app.js tests/e2e/theme.spec.js docs/superpowers/specs/2026-04-27-post-only-chrome-hiding-design.md docs/superpowers/plans/2026-04-27-post-only-chrome-hiding.md`

Expected: diff only contains the post-page gate, the non-post header test, and the workflow docs.

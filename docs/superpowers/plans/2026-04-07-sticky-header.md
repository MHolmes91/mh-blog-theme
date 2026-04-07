# Sticky Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site header sticky with backdrop-blur and auto-hide it after 3s of scroll inactivity when past the top of `<main>`, while keeping it visible when any element has focus.

**Architecture:** Modify the existing header partial to use `position: sticky` and backdrop-blur. Add Alpine.js state (`toolbarVisible`) and a scroll/focus handler in `app.js` that manages a 3-second hide timer based on whether `<main>` has scrolled past the viewport top.

**Tech Stack:** Hugo templates, Tailwind CSS, Alpine.js, Playwright E2E tests

---

### Task 1: Add sticky positioning and backdrop-blur to the header

**Files:**
- Modify: `layouts/_partials/header.html`

- [ ] **Step 1: Update header classes**

In `layouts/_partials/header.html`, change the `<header>` opening tag from:

```html
<header role="banner" class="border-b border-purple-200 bg-white/90 px-6 py-4">
```

to:

```html
<header role="banner" class="sticky top-0 z-40 border-b border-purple-200 bg-white/80 px-6 py-4 backdrop-blur-md transition-opacity duration-300" :class="{ 'opacity-0 pointer-events-none': !toolbarVisible }">
```

Changes:
- Added `sticky top-0 z-40` for sticky positioning at viewport top
- Changed `bg-white/90` to `bg-white/80` and added `backdrop-blur-md` for frosted-glass effect
- Added `transition-opacity duration-300` for smooth fade animation
- Added Alpine `:class` binding to fade out via opacity and disable pointer events when `toolbarVisible` is false

- [ ] **Step 2: Commit**

```bash
git add layouts/_partials/header.html
git commit -m "feat: add sticky positioning, backdrop-blur, and fade classes to header"
```

---

### Task 2: Add toolbar visibility state and scroll handler to Alpine

**Files:**
- Modify: `assets/js/app.js`

- [ ] **Step 1: Add toolbarVisible state**

In the `siteUi` data function in `assets/js/app.js`, add `toolbarVisible: true` alongside the existing state properties (after `dockStyle: '',`):

```js
Alpine.data('siteUi', (searchUrl) => ({
  query: '',
  records: [],
  searchOpen: false,
  showBackToTop: false,
  dockStyle: '',
  toolbarVisible: true,
  // ... rest unchanged
```

- [ ] **Step 2: Add updateToolbarVisibility handler**

Inside the `init()` method, add the `updateToolbarVisibility` function. Place it after the `updateDockOffset` function (before the `syncTheme(colorSchemeQuery)` call):

```js
    const updateToolbarVisibility = () => {
      const main = document.querySelector('main')
      const isAboveThreshold = !main || main.getBoundingClientRect().top > 0

      clearTimeout(this._toolbarTimer)

      if (isAboveThreshold) {
        this.toolbarVisible = true
      } else {
        this.toolbarVisible = true
        this._toolbarTimer = setTimeout(() => {
          this.toolbarVisible = false
        }, 3000)
      }
    }
```

Logic: on every scroll, cancel any pending timer. If above threshold, always show. If below threshold, show immediately and schedule a 3-second timer to hide. The `focusin` listener (added in Step 3) also cancels the timer and forces visible.

- [ ] **Step 3: Wire up scroll and focusin listeners**

After the existing `window.addEventListener('scroll', updateDockOffset, { passive: true })` line, add:

```js
    window.addEventListener('scroll', updateToolbarVisibility, { passive: true })
    window.addEventListener('resize', updateToolbarVisibility)
    document.addEventListener('focusin', () => {
      clearTimeout(this._toolbarTimer)
      this.toolbarVisible = true
    })
```

The `focusin` listener ensures that when any element receives focus (keyboard navigation, tabbing), the header immediately becomes visible and any pending hide timer is cancelled.

- [ ] **Step 4: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: add sticky header auto-hide with focus accessibility"
```

---

### Task 3: Write E2E tests for sticky header behavior

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add test — header is sticky and has backdrop-blur**

Add this test to `tests/e2e/theme.spec.js`:

```js
test("header is sticky with backdrop blur on all pages", async ({ page }) => {
  await page.goto("/");

  const banner = page.getByRole("banner");
  await expect(banner).toHaveClass(/sticky/);
  await expect(banner).toHaveClass(/backdrop-blur-md/);
  await expect(banner).toHaveClass(/z-40/);
  await expect(banner).toHaveCSS("position", "sticky");
});
```

- [ ] **Step 2: Add test — header stays visible above threshold**

```js
test("header stays visible when scrolled above the threshold", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");

  const banner = page.getByRole("banner");

  await expect(banner).not.toHaveClass(/opacity-0/);

  await page.evaluate(() => window.scrollTo(0, 50));

  await expect(banner).not.toHaveClass(/opacity-0/);
});
```

- [ ] **Step 3: Add test — header fades after 3s below threshold**

```js
test("header fades out after 3 seconds of scroll inactivity below threshold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    const filler = document.createElement("div");
    filler.style.height = "1200px";
    postContent.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });

  const banner = page.getByRole("banner");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(banner).not.toHaveClass(/opacity-0/);

  await page.waitForTimeout(3500);

  await expect(banner).toHaveClass(/opacity-0/);
});
```

- [ ] **Step 4: Add test — scroll re-shows header**

```js
test("scrolling re-shows the header after it has faded out", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    const filler = document.createElement("div");
    filler.style.height = "1200px";
    postContent.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });

  const banner = page.getByRole("banner");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3500);
  await expect(banner).toHaveClass(/opacity-0/);

  await page.evaluate(() => window.scrollBy(0, 50));

  await expect(banner).not.toHaveClass(/opacity-0/);
});
```

- [ ] **Step 5: Add test — focus keeps header visible**

```js
test("header stays visible when an element has focus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    const filler = document.createElement("div");
    filler.style.height = "1200px";
    postContent.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });

  const banner = page.getByRole("banner");
  const searchButton = page.getByRole("button", { name: "Search" });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3500);
  await expect(banner).toHaveClass(/opacity-0/);

  await searchButton.focus();

  await expect(banner).not.toHaveClass(/opacity-0/);
});
```

- [ ] **Step 6: Run E2E tests**

Run: `npx playwright test tests/e2e/theme.spec.js -g "header"`

Expected: All 5 new tests PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: add E2E coverage for sticky header auto-hide behavior"
```

---

### Task 4: Run full E2E suite to verify no regressions

**Files:** None (verification only)

- [ ] **Step 1: Kill any lingering dev servers on port 1313**

```bash
lsof -ti:1313 | xargs kill -9 2>/dev/null || true
```

- [ ] **Step 2: Run full E2E suite**

Run: `npm run test:e2e`

Expected: All tests PASS, no regressions.

---

### Task 5: Cleanup and final commit

**Files:** None (git cleanup)

- [ ] **Step 1: Review changes**

```bash
git log --oneline -5
git diff origin/main...HEAD --stat
```

- [ ] **Step 2: Squash or verify commits are clean**

The implementation should be 3-4 focused commits. If anything looks off, clean up before merging.

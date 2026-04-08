# TOC Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Table of Contents with header-aware fixed positioning, heading level styling, mobile hamburger dropdown, and dual-nav active heading tracking.

**Architecture:** The desktop TOC stays in the CSS grid as a sticky aside with a dynamic `top` value bound to `toolbarVisible`. A new mobile partial renders a fixed hamburger button and dropdown panel using the same `toolbarVisible` state. The `updateActiveTocEntry` function is extended to track both nav elements simultaneously. Hugo renders `.TableOfContents` into each container independently.

**Tech Stack:** Hugo templates, Tailwind CSS, Alpine.js, Playwright E2E tests

---

### Task 1: Add list and x icons to icon.html

**Files:**
- Modify: `layouts/_partials/icon.html`

- [ ] **Step 1: Add the list (hamburger menu) icon**

Add this block before the closing `{{- end -}}`:

```go-html-template
{{- else if eq $name "list" -}}
<svg class="{{ $class }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
{{- else if eq $name "x" -}}
<svg class="{{ $class }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add layouts/_partials/icon.html
git commit -m "feat: add list and x icons for mobile TOC"
```

---

### Task 2: Desktop TOC header-aware slide + heading level styles

**Files:**
- Modify: `layouts/_partials/toc.html`
- Modify: `assets/css/app.css`

- [ ] **Step 1: Update toc.html with dynamic top and heading styles**

Replace the entire contents of `layouts/_partials/toc.html` with:

```go-html-template
{{ if ne .TableOfContents `<nav id="TableOfContents"></nav>` }}
  <aside
    class="hidden lg:block sticky transition-all duration-300 rounded-2xl border border-purple-200 bg-white p-4"
    :style="`top: ${toolbarVisible ? '6rem' : '1.5rem'}`"
  >
    <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">Contents</h2>
    {{ .TableOfContents }}
  </aside>
{{ end }}
```

Key changes:
- Removed the inline `[aria-current]` styling classes (moved to CSS in next step)
- Added `transition-all duration-300` for smooth top animation
- Added `:style` binding for dynamic `top` based on `toolbarVisible`

- [ ] **Step 2: Add TOC heading level styles and active highlight to app.css**

Append to `assets/css/app.css` (before the closing of the file):

```css
#TableOfContents,
#TableOfContentsMobile {
  list-style: none;
  padding-left: 0;
}

#TableOfContents ul,
#TableOfContentsMobile ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

#TableOfContents > ul > li > a,
#TableOfContentsMobile > ul > li > a {
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.8;
  transition: color 0.2s, opacity 0.2s;
}

#TableOfContents > ul > li > ul > li > a,
#TableOfContentsMobile > ul > li > ul > li > a {
  font-size: 0.75rem;
  padding-left: 1rem;
  color: var(--color-muted);
  opacity: 0.7;
  transition: color 0.2s, opacity 0.2s;
}

#TableOfContents > ul > li > ul > li > ul > li > a,
#TableOfContentsMobile > ul > li > ul > li > ul > li > a {
  font-size: 0.75rem;
  padding-left: 2rem;
  color: var(--color-muted);
  opacity: 0.5;
  transition: color 0.2s, opacity 0.2s;
}

#TableOfContents a[aria-current="location"],
#TableOfContentsMobile a[aria-current="location"] {
  color: var(--color-accent) !important;
  font-weight: 600 !important;
  opacity: 1 !important;
}

#TableOfContents li,
#TableOfContentsMobile li {
  padding: 0.125rem 0;
}
```

- [ ] **Step 3: Add bg-white/95 to the dark mode override list in app.css**

In `assets/css/app.css`, find the existing override block:

```css
:is(:root, body[data-theme]) .bg-white,
:is(:root, body[data-theme]) .bg-white\/80,
:is(:root, body[data-theme]) .bg-white\/90 {
```

Add `.bg-white\/95` to it:

```css
:is(:root, body[data-theme]) .bg-white,
:is(:root, body[data-theme]) .bg-white\/80,
:is(:root, body[data-theme]) .bg-white\/90,
:is(:root, body[data-theme]) .bg-white\/95 {
```

- [ ] **Step 4: Kill dev server port and run E2E tests**

```bash
lsof -ti:1313 | xargs kill -9 2>/dev/null || true
npx playwright test
```

Expected: All 54 existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add layouts/_partials/toc.html assets/css/app.css
git commit -m "feat: add header-aware TOC slide and heading level styles"
```

---

### Task 3: Mobile TOC partial

**Files:**
- Create: `layouts/_partials/toc-mobile.html`
- Modify: `layouts/single.html`

- [ ] **Step 1: Create toc-mobile.html**

Create `layouts/_partials/toc-mobile.html`:

```go-html-template
{{ if ne .TableOfContents `<nav id="TableOfContents"></nav>` }}
  <div class="fixed lg:hidden z-30 transition-all duration-300" :style="`top: ${toolbarVisible ? '5.5rem' : '1.5rem'}; right: ${$el.style.getPropertyValue('--dock-right') || 'max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))'}; --dock-right: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))`" style="--dock-right: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))">
    <button
      type="button"
      aria-label="Table of contents"
      @click="toggleToc"
      class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm transition hover:bg-purple-700"
    >
      {{ partial "icon.html" (dict "name" "list" "class" "h-4 w-4") }}
    </button>
    <div
      x-cloak
      x-show="tocOpen"
      @click.self="closeToc"
      @keydown.escape.window="closeToc"
      class="fixed inset-0 z-30 lg:hidden"
      x-transition:enter="transition ease-out duration-200"
      x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition ease-in duration-150"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0"
    >
      <div
        @click.stop
        class="absolute right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] top-3.5rem w-[280px] max-h-[60vh] overflow-y-auto rounded-2xl border border-purple-200 bg-white/95 backdrop-blur-sm p-4 shadow-lg"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="opacity-0 scale-95"
        x-transition:enter-end="opacity-100 scale-100"
        x-transition:leave="transition ease-in duration-150"
        x-transition:leave-start="opacity-100 scale-100"
        x-transition:leave-end="opacity-0 scale-95"
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold uppercase tracking-wide">Contents</h2>
          <button
            type="button"
            aria-label="Close table of contents"
            @click="closeToc"
            class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-purple-300 transition hover:bg-purple-100"
          >
            {{ partial "icon.html" (dict "name" "x" "class" "h-3.5 w-3.5") }}
          </button>
        </div>
        {{ .TableOfContents }}
      </div>
    </div>
  </div>
{{ end }}
```

- [ ] **Step 2: Include toc-mobile.html in single.html**

In `layouts/single.html`, add the mobile TOC partial after `{{ partial "toc.html" . }}`. The final file should be:

```go-html-template
{{ define "main" }}
  <div id="reading-progress" class="fixed top-0 left-0 z-50 h-1 bg-purple-600" style="width:0%"></div>
  {{ partial "toc-mobile.html" . }}
  <section class="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
    <article id="post-content" class="min-w-0 space-y-6">
      {{ with .Params.featuredImage }}<img src="{{ . }}" alt="" class="w-full rounded-2xl object-cover">{{ end }}
      {{ partial "post-header.html" (dict "page" . "surface" "aligned") }}
      <div class="prose prose-slate max-w-none" data-content-body>{{ .Content }}</div>
    </article>
    {{ partial "toc.html" . }}
  </section>
{{ end }}
```

- [ ] **Step 3: Add tocOpen, toggleToc, closeToc to Alpine siteUi in app.js**

In `assets/js/app.js`, inside the `Alpine.data('siteUi', ...)` call, add these properties after `toolbarVisible: true,`:

```javascript
tocOpen: false,
```

And add these methods after `closeSearch()`:

```javascript
toggleToc() {
  this.tocOpen = !this.tocOpen
},
closeToc() {
  this.tocOpen = false
},
```

- [ ] **Step 4: Kill dev server and run E2E tests**

```bash
lsof -ti:1313 | xargs kill -9 2>/dev/null || true
npx playwright test
```

Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add layouts/_partials/toc-mobile.html layouts/single.html assets/js/app.js
git commit -m "feat: add mobile TOC hamburger with dropdown panel"
```

---

### Task 4: Dual-nav active heading tracking

**Files:**
- Modify: `assets/js/app.js`

- [ ] **Step 1: Update updateActiveTocEntry to track both navs**

In `assets/js/app.js`, replace the `updateActiveTocEntry` function with a version that queries both `#TableOfContents` and `#TableOfContentsMobile`:

```javascript
const updateActiveTocEntry = () => {
  const navIds = ['TableOfContents', 'TableOfContentsMobile']
  const allEntries = []

  for (const navId of navIds) {
    const toc = document.getElementById(navId)
    if (!toc) continue

    const entries = [...toc.querySelectorAll('a[href^="#"]')]
      .map((link) => {
        const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
        const heading = id ? document.getElementById(id) : null
        if (!heading) return null
        return { id, link, heading }
      })
      .filter(Boolean)

    allEntries.push(...entries)
  }

  if (!allEntries.length) return

  const activeId = pickActiveHeading(
    allEntries.map(({ id, heading }) => ({ id, top: heading.getBoundingClientRect().top }))
  )

  for (const { id, link } of allEntries) {
    if (id === activeId) {
      link.setAttribute('aria-current', 'location')
    } else {
      link.removeAttribute('aria-current')
    }
  }
}
```

- [ ] **Step 2: Give the mobile TOC nav a unique ID**

In `layouts/_partials/toc-mobile.html`, Hugo's `.TableOfContents` outputs `<nav id="TableOfContents">`. We need the mobile one to have `id="TableOfContentsMobile"`. Replace `{{ .TableOfContents }}` in the mobile partial with a string replacement:

```go-html-template
        {{ replaceRE `<nav id="TableOfContents">` `<nav id="TableOfContentsMobile">` .TableOfContents | safeHTML }}
```

- [ ] **Step 3: Kill dev server and run E2E tests**

```bash
lsof -ti:1313 | xargs kill -9 2>/dev/null || true
npx playwright test
```

Expected: All existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add assets/js/app.js layouts/_partials/toc-mobile.html
git commit -m "feat: track active heading across desktop and mobile TOC navs"
```

---

### Task 5: E2E Tests

**Files:**
- Modify: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Add test for heading level indentation and sizing**

```javascript
test("toc entries indent and style by heading level", async ({ page }) => {
  await page.goto("/posts/toc-stress-post/");

  const toc = page.locator("#TableOfContents");
  await expect(toc).toBeVisible();

  const h2Link = toc.locator("> ul > li > a").first();
  const h3Link = toc.locator("> ul > li > ul > li > a").first();
  const h4Link = toc.locator("> ul > li > ul > li > ul > li > a").first();

  await expect(h2Link).toBeVisible();
  await expect(h3Link).toBeVisible();
  await expect(h4Link).toBeVisible();

  const [h2Pad, h3Pad, h4Pad] = await Promise.all([
    h2Link.evaluate((el) => window.getComputedStyle(el).paddingLeft),
    h3Link.evaluate((el) => window.getComputedStyle(el).paddingLeft),
    h4Link.evaluate((el) => window.getComputedStyle(el).paddingLeft),
  ]);

  const h2PadPx = Number.parseFloat(h2Pad);
  const h3PadPx = Number.parseFloat(h3Pad);
  const h4PadPx = Number.parseFloat(h4Pad);

  expect(h3PadPx).toBeGreaterThan(h2PadPx);
  expect(h4PadPx).toBeGreaterThan(h3PadPx);

  const [h2Size, h3Size, h4Size] = await Promise.all([
    h2Link.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).fontSize)),
    h3Link.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).fontSize)),
    h4Link.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).fontSize)),
  ]);

  expect(h2Size).toBeGreaterThan(h3Size);
  expect(h3Size).toBeGreaterThanOrEqual(h4Size);
});
```

- [ ] **Step 2: Add test for desktop TOC slide animation**

```javascript
test("desktop toc slides up when header hides", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/toc-stress-post/");

  const tocAside = page.locator("aside").filter({ hasText: "Contents" });

  await expect(tocAside).toBeVisible();

  const initialTop = await tocAside.evaluate((el) => el.style.top);
  expect(initialTop).toContain("6rem");

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");
    const filler = document.createElement("div");
    filler.style.height = "1200px";
    postContent.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3500);

  const hiddenTop = await tocAside.evaluate((el) => el.style.top);
  expect(hiddenTop).toContain("1.5rem");
});
```

- [ ] **Step 3: Add test for mobile TOC hamburger visibility and panel**

```javascript
test("mobile toc hamburger is visible on small screens and hidden on large", async ({
  page,
}) => {
  await page.goto("/posts/toc-stress-post/");

  await page.setViewportSize({ width: 480, height: 800 });
  await expect(page.getByRole("button", { name: "Table of contents" })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("button", { name: "Table of contents" })).toHaveCount(0);
});

test("mobile toc panel opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto("/posts/toc-stress-post/");

  const hamburger = page.getByRole("button", { name: "Table of contents" });
  const closeBtn = page.getByRole("button", { name: "Close table of contents" });

  await expect(closeBtn).toHaveCount(0);

  await hamburger.click();

  await expect(closeBtn).toBeVisible();
  await expect(page.locator("#TableOfContentsMobile")).toBeVisible();
  await expect(page.locator("#TableOfContentsMobile")).toContainText("Large Section One");

  await closeBtn.click();

  await expect(closeBtn).toHaveCount(0);
});

test("mobile toc panel closes on escape", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto("/posts/toc-stress-post/");

  const hamburger = page.getByRole("button", { name: "Table of contents" });
  await hamburger.click();

  await expect(page.locator("#TableOfContentsMobile")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.locator("#TableOfContentsMobile")).toBeHidden();
});

test("mobile toc panel closes when clicking a link", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto("/posts/toc-stress-post/");

  const hamburger = page.getByRole("button", { name: "Table of contents" });
  await hamburger.click();

  await expect(page.locator("#TableOfContentsMobile")).toBeVisible();

  await page
    .locator("#TableOfContentsMobile")
    .getByRole("link", { name: "Large Section One" })
    .click();

  await expect(page.locator("#TableOfContentsMobile")).toBeHidden();
});

test("mobile toc active heading tracks while scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 400 });
  await page.goto("/posts/toc-stress-post/");

  const hamburger = page.getByRole("button", { name: "Table of contents" });
  await hamburger.click();

  await expect(
    page.locator('#TableOfContentsMobile a[aria-current="location"]'),
  ).toContainText("Large Section One");

  await page.evaluate(() => {
    const target = document.getElementById("final-long-section");
    if (!target) throw new Error("Expected #final-long-section");
    window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - 120);
  });

  await expect(
    page.locator('#TableOfContentsMobile a[aria-current="location"]'),
  ).toContainText("Final Long Section");
});
```

- [ ] **Step 4: Kill dev server and run all E2E tests**

```bash
lsof -ti:1313 | xargs kill -9 2>/dev/null || true
npx playwright test
```

Expected: All tests pass (54 existing + 7 new = 61 total).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/theme.spec.js
git commit -m "test: add E2E tests for TOC improvements"
```

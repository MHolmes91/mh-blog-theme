# Remove Theme Hot Reload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove runtime theme hot reload while preserving initial theme selection from the browser color-scheme preference.

**Architecture:** Keep `resolveTheme()` and the initial Alpine `theme` state, but remove the `matchMedia` change subscription and `themeChanged` event dispatch from `assets/js/app.js`. Mermaid continues to wait for the initial `body[data-theme]` and render once, with no runtime rerender listener.

**Tech Stack:** Hugo templates, Alpine.js, browser `matchMedia`, Mermaid browser script, Vitest, Playwright.

---

## File Structure

- Modify `assets/js/app.js`: remove live `prefers-color-scheme` change handling and `themeChanged` dispatch.
- Modify `layouts/_partials/features/mermaid.html`: remove Mermaid runtime `themeChanged` rerender listener while keeping initial render.
- Modify `tests/unit/mermaid-feature.test.js`: assert the Mermaid partial no longer registers a `themeChanged` listener.
- Modify `tests/e2e/theme.spec.js`: replace live-update e2e expectations with page-load-only behavior.

## Task 1: Remove App Theme Change Listener

**Files:**
- Modify: `assets/js/app.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write failing e2e expectation for no hot update**

In `tests/e2e/theme.spec.js`, replace the test named `theme preference updates the page palette while the page is open` with:

```js
test("theme preference changes apply only after reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect(page.locator("body")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(250, 247, 255)",
  );

  await page.emulateMedia({ colorScheme: "dark" });

  await expect(page.locator("body")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(250, 247, 255)",
  );

  await page.reload();

  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(17, 24, 39)",
  );
});
```

- [ ] **Step 2: Run the targeted e2e test and verify failure**

Run: `npm run test:e2e -- --grep "theme preference changes apply only after reload"`

Expected: FAIL because the current app listens to `matchMedia` changes and updates `body[data-theme]` to `dark` before reload.

- [ ] **Step 3: Remove live theme sync from app init**

In `assets/js/app.js`, remove this block from `init()`:

```js
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = ({ matches }) => {
      this.theme = resolveTheme({ systemPrefersDark: matches })
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: this.theme }
      }))
    }
```

Also remove these lines later in `init()`:

```js
    syncTheme(colorSchemeQuery)
    colorSchemeQuery.addEventListener('change', syncTheme)
```

Leave the existing initial `theme: resolveTheme({ systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches })` property unchanged.

- [ ] **Step 4: Run targeted e2e test and verify pass**

Run: `npm run test:e2e -- --grep "theme preference changes apply only after reload"`

Expected: PASS.

- [ ] **Step 5: Run theme unit tests**

Run: `npm test -- tests/unit/theme.test.js`

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add assets/js/app.js tests/e2e/theme.spec.js
git commit -m "fix: stop hot reloading browser theme changes"
```

Expected: commit succeeds. If unrelated files are staged, commit only these paths with `git commit assets/js/app.js tests/e2e/theme.spec.js -m "fix: stop hot reloading browser theme changes"`.

## Task 2: Remove Mermaid Theme Rerender Listener

**Files:**
- Modify: `layouts/_partials/features/mermaid.html`
- Modify: `tests/unit/mermaid-feature.test.js`

- [ ] **Step 1: Write failing Mermaid unit expectation**

In `tests/unit/mermaid-feature.test.js`, replace the existing assertion that expects `themeChanged` with an assertion that it is absent. The full test should be:

```js
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const partial = readFileSync(new URL('../../layouts/_partials/features/mermaid.html', import.meta.url), 'utf8')

describe('mermaid feature partial', () => {
  it('renders mermaid diagrams after the initial body theme is available', () => {
    expect(partial).toContain('document.body.getAttribute("data-theme")')
    expect(partial).toContain('await waitForTheme();')
    expect(partial).toContain('await renderMermaid(".mermaid");')
    expect(partial).not.toContain('window.addEventListener("themeChanged"')
  })
})
```

- [ ] **Step 2: Run Mermaid unit test and verify failure**

Run: `npm test -- tests/unit/mermaid-feature.test.js`

Expected: FAIL because the partial still registers `window.addEventListener("themeChanged", ...)`.

- [ ] **Step 3: Remove Mermaid rerender listener**

In `layouts/_partials/features/mermaid.html`, remove this entire block:

```html
    window.addEventListener("themeChanged", async () => {
      const diagrams = document.querySelectorAll('[data-mermaid-diagram="true"]');

      for (const element of diagrams) {
        const originalCode = element.getAttribute("data-original-code");

        if (!originalCode) continue;

        element.removeAttribute("data-processed");
        element.innerHTML = "";
        element.textContent = originalCode;
        element.classList.add("mermaid");
      }

      await renderMermaid(".mermaid");
    });
```

Keep `await waitForTheme();` and `await renderMermaid(".mermaid");` intact.

- [ ] **Step 4: Run Mermaid unit test and verify pass**

Run: `npm test -- tests/unit/mermaid-feature.test.js`

Expected: PASS.

- [ ] **Step 5: Run targeted Mermaid e2e tests**

Run: `npm run test:e2e -- --grep "mermaid"`

Expected: PASS for Mermaid rendering and initial dark theme coverage.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add layouts/_partials/features/mermaid.html tests/unit/mermaid-feature.test.js
git commit -m "fix: remove mermaid theme hot reload"
```

Expected: commit succeeds. If unrelated files are staged, commit only these paths with `git commit layouts/_partials/features/mermaid.html tests/unit/mermaid-feature.test.js -m "fix: remove mermaid theme hot reload"`.

## Task 3: Final Verification

**Files:**
- No planned code changes.

- [ ] **Step 1: Run full unit test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run full e2e suite**

Run: `npm run test:e2e`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS and Hugo build completes without template or asset errors.

- [ ] **Step 4: Inspect final worktree status**

Run: `git status --short`

Expected: no uncommitted changes from this feature. If unrelated changes remain, do not modify them.

## Self-Review

- Spec coverage: Task 1 removes app-level live theme updates and proves refresh-only behavior; Task 2 removes Mermaid `themeChanged` handling and proves initial render remains; Task 3 runs full verification.
- Placeholder scan: no TBD, TODO, deferred implementation, or vague testing steps remain.
- Type consistency: event name is consistently `themeChanged`; body theme attribute remains `data-theme`; the initial theme path remains `resolveTheme({ systemPrefersDark })`.

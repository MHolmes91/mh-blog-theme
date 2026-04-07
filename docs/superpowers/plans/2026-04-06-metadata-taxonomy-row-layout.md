# Metadata Taxonomy Row Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the aligned taxonomy block so it renders a horizontal `Series - ...` row above an unlabeled horizontal tag-chip row while preserving the existing right-side and wrapped-below behaviors.

**Architecture:** Keep the current shared `post-header.html` composition, but simplify `post-taxonomy.html` so aligned surfaces render two explicit rows: a labeled series row and an unlabeled tag row. Update the focused Playwright assertions to match the new visual contract while preserving the existing accessibility and navigation checks.

**Tech Stack:** Hugo templates, Tailwind utility classes, Playwright, Vitest

---

## File Map

- `layouts/_partials/post-taxonomy.html`
  - Change aligned rendering from stacked grouped sections to two horizontal rows: labeled series row and unlabeled tag row.
- `tests/e2e/theme.spec.js`
  - Replace the previous stacked-layout assertions with checks for the new two-row contract on wide and narrow layouts.

### Task 1: Update The Layout Tests For The New Taxonomy Rows

**Files:**
- Modify: `tests/e2e/theme.spec.js`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Write the failing assertions for the new series/tag row contract**

Update the focused layout and grouping coverage so it proves:

- wide row and single layouts still place taxonomy on the right and top-align it with the title area
- the first taxonomy row includes visible `Series` text and the series link on the same horizontal line
- the second taxonomy row contains tag chips only, with no visible `Tags` label
- tags sit below the series row on wide layouts
- the same two-row structure is preserved after wrapping below the left content on narrow layouts

Use stable locators rooted in `data-taxonomy-group="series"` and `data-taxonomy-group="tags"`, and geometry checks based on bounding boxes rather than class names.

- [ ] **Step 2: Run the focused taxonomy layout tests to verify they fail**

Run: `npm run test:e2e -- --grep "right-align taxonomy|metadata wraps taxonomy below|groups series and tags separately"`

Expected:
- the updated layout tests fail because the current implementation still shows vertical grouped sections and a visible `Tags` label

### Task 2: Implement The New Two-Row Taxonomy Rendering

**Files:**
- Modify: `layouts/_partials/post-taxonomy.html`
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Render an explicit horizontal series row for aligned surfaces**

Update the aligned branch in `layouts/_partials/post-taxonomy.html` so the series group renders:

- a visible `Series` label
- a literal separator `-`
- series links inline on the same row

Keep the group wrapped in `data-taxonomy-group="series"` so existing selectors remain stable.

- [ ] **Step 2: Render an unlabeled horizontal tag-chip row for aligned surfaces**

Update the aligned branch so the tags group renders:

- no `Tags` label
- only the chip links in a horizontal row
- right-aligned on wide layouts
- horizontally wrapped when needed

Keep the group wrapped in `data-taxonomy-group="tags"`.

- [ ] **Step 3: Preserve wrapped narrow-layout behavior**

Ensure narrow layouts still:

- place taxonomy below the left content block
- keep the series row above the tag row
- keep each row horizontal rather than converting back to a vertical stack

- [ ] **Step 4: Run the focused taxonomy layout tests to verify they pass**

Run: `npm run test:e2e -- --grep "right-align taxonomy|metadata wraps taxonomy below|groups series and tags separately"`

Expected:
- the updated focused taxonomy layout tests pass

### Task 3: Run Full Verification

**Files:**
- Test: `tests/e2e/theme.spec.js`

- [ ] **Step 1: Run the unit suite**

Run: `npm test`

Expected:
- 20/20 tests pass

- [ ] **Step 2: Run the full e2e suite**

Run: `npm run test:e2e`

Expected:
- all Playwright tests pass

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected:
- Hugo build succeeds without template errors

## Self-Review Checklist

- Spec coverage:
  - `Series - ...` horizontal row: Task 1-2
  - unlabeled tag-chip row: Task 1-2
  - preserve right-side/top-aligned wide layout: Task 1-2
  - preserve wrapped-below narrow layout: Task 1-2
  - preserve accessibility and existing navigation behavior: Task 3
- Placeholder scan:
  - no TBD/TODO or vague future work remains
- Type consistency:
  - aligned surfaces continue to use `data-taxonomy-group="series"` and `data-taxonomy-group="tags"`

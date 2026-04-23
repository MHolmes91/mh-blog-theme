---
title: TOC Stress Post
date: 2026-04-06
summary: A long Hugo theme post for TOC rendering and scroll behavior.
tags: [hugo, theme, toc, longform, testing]
---

## Large Section One

This opening section is intentionally long so the page has real distance between headings and the table of contents has room to react while a reader scrolls. It repeats the same testing idea in different words to keep the fixture readable while also creating a meaningful span of body copy.

The goal is not literary quality. The goal is stable structure, predictable headings, and enough paragraphs that the built page feels like a long-form article instead of a short note with decorative anchors.

Another paragraph extends the section so a jump from later headings lands noticeably lower on the page. That makes active-state changes easier to observe when the TOC logic follows the current heading through the document.

### Nested Layer A

This nested section adds more vertical space before the next heading. The copy stays plain and direct because the fixture only needs durable text that will render the same way on repeated test runs.

It also creates a realistic place for a reader to land after selecting a nested TOC entry. The section should feel clearly separated from the heading above and below it.

#### Deep Detail I

This is the deepest heading level used in the fixture, and it needs actual paragraph content so the generated anchor is attached to more than a single sentence. A slightly fuller subsection also makes the nested TOC tree easier to validate in end-to-end tests.

One more paragraph keeps the subsection from collapsing into a minimal stub. That extra body copy helps preserve visible distance during scroll and anchor-jump checks.

### Nested Layer B

This section continues the long-form pattern with enough prose to separate it from the following top-level section. It exists mainly to keep the document shape varied while still using a simple, repeatable content style.

Readers and tests both benefit from having another substantial block here. The TOC should still read clearly when several sibling and nested headings are present in sequence.

## Large Section Two

This second major section keeps the page long enough that TOC updates are obvious while moving deeper into the article. It mirrors the first section in purpose without repeating the exact same wording.

More filler text reinforces the fixture's job as a scroll target. The content should be stable, unremarkable, and long enough that a change in active heading is visually meaningful when moving from one section to the next.

### Nested Layer C

This subsection adds another layer of structure and keeps the article from becoming a flat stack of headings. The extra copy helps the page behave more like an actual long-form post in tests.

A second paragraph gives this heading enough room to stand on its own. That spacing helps with both TOC rendering checks and manual spot verification during maintenance.

#### Deep Detail II

This deep subsection mirrors the earlier nested detail and keeps the hierarchy consistent. It should have enough text to make the generated anchor useful and the TOC tree visibly nested.

Additional body copy stretches the section a little further so the document remains comfortably long before the final top-level heading begins.

## Final Long Section

This final section exists so clicking its TOC entry causes a meaningful jump toward the lower part of the page. It should not be a tiny ending note because the anchor needs to move the viewport clearly enough to confirm the navigation behavior.

The closing paragraphs keep the page extended below the earlier sections and provide a steady final landing area for TOC interactions. That makes the fixture useful for both automated tests and quick visual checks when TOC behavior changes later.

One last paragraph ensures the page ends with enough depth to remain a durable stress fixture. The structure is simple, but the length and heading levels are deliberate.

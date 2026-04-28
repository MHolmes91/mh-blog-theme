import { test, expect } from "@playwright/test";

const TITLE_ALIGNMENT_TOLERANCE = 32;

async function getBox(locator) {
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();

  return {
    ...box,
    left: box.x,
    right: box.x + box.width,
    top: box.y,
    bottom: box.y + box.height,
  };
}

async function getSeriesNavIconBoxes(card, labelText, dateText) {
  const boxes = await card.evaluate((node, { labelText, dateText }) => {
    const rows = Array.from(node.querySelectorAll("span"));
    const findRow = (text) =>
      rows.find((row) => row.textContent?.trim() === text && row.querySelector("svg"));
    const toBox = (element) => {
      const rect = element?.getBoundingClientRect();

      if (!rect) {
        return null;
      }

      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const labelRow = findRow(labelText);
    const dateRow = findRow(dateText);
    const chevron = labelRow?.querySelector("svg");
    const calendar = dateRow?.querySelector("svg");

    if (!labelRow || !dateRow || !chevron || !calendar) {
      return null;
    }

    return {
      chevron: toBox(chevron),
      calendar: toBox(calendar),
    };
  }, { labelText, dateText });

  expect(boxes).not.toBeNull();
  expect(boxes.chevron).not.toBeNull();
  expect(boxes.calendar).not.toBeNull();

  return boxes;
}

function expectTrailingTaxonomyBlock(containerBox, titleBox, seriesBox, tagBox) {
  expect(seriesBox.left).toBeGreaterThan(containerBox.left + containerBox.width / 2);
  expect(tagBox.left).toBeGreaterThan(containerBox.left + containerBox.width / 2);
  expect(Math.abs(seriesBox.top - titleBox.top)).toBeLessThanOrEqual(
    TITLE_ALIGNMENT_TOLERANCE,
  );
  expect(tagBox.top).toBeGreaterThan(seriesBox.bottom + 4);
}

function expectWrappedStackedTaxonomy(leftContentBox, seriesBox, tagBox) {
  expect(seriesBox.top).toBeGreaterThan(leftContentBox.bottom);
  expect(tagBox.top).toBeGreaterThan(seriesBox.bottom);
}

async function expectInlineSeriesRow(seriesGroup) {
  const seriesLabel = seriesGroup.getByText("Series", { exact: true });
  const seriesLinks = seriesGroup.getByRole("link");
  const [labelBox, firstLinkBox] = await Promise.all([
    getBox(seriesLabel),
    getBox(seriesLinks.first()),
  ]);

  await expect(seriesLabel).toBeVisible();
  await expect(seriesLinks.first()).toBeVisible();
  await expect(seriesLinks).toHaveCount(1);
  expect(labelBox.bottom).toBeGreaterThan(firstLinkBox.top);
  expect(firstLinkBox.bottom).toBeGreaterThan(labelBox.top);
  expect(firstLinkBox.left).toBeGreaterThan(labelBox.right);
}

async function expectUnlabeledTagRow(tagsGroup) {
  const tagLinks = tagsGroup.getByRole("link");

  await expect(tagsGroup.getByText("Tags", { exact: true })).toHaveCount(0);
  await expect(tagLinks.first()).toBeVisible();

  return getBox(tagLinks.first());
}

test("home page renders shared chrome", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toContainText("MH Blog Theme");
  await expect(page.getByRole("contentinfo")).toContainText("GitHub");
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/example",
  );
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to top" })).toHaveCount(
    0,
  );
});

test("non-post pages never show the back to top button", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });

  for (const path of ["/", "/posts/", "/series/", "/tags/", "/archives/"]) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.getByRole("button", { name: "Back to top" })).toHaveCount(
      0,
    );
  }
});

test("home page shows intro and recent posts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Mark's Notes")).toBeVisible();
  await expect(page.getByRole("link", { name: "Series Part 4" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TOC Stress Post" })).toBeVisible();
});

test("home page shows only the five most recent posts and a view all posts link", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("main article")).toHaveCount(5);
  await expect(
    page.getByRole("link", { name: "Series Part 4" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "TOC Stress Post" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Built-In Shortcodes Post" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "First Post" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Second Post" })).toHaveCount(0);

  const viewAllLink = page.getByRole("link", { name: /View All posts/i });

  await expect(
    viewAllLink,
  ).toBeVisible();
  await expect(viewAllLink).toHaveAttribute("href", "/archives/");
  await expect(viewAllLink.locator("svg")).toBeVisible();

  await viewAllLink.click();

  await expect(page).toHaveURL(/\/archives\/$/);
  await expect(page.getByRole("heading", { name: "Archives" })).toBeVisible();
});

test("home page separates intro and recent posts with structural dividers", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("main hr")).toHaveCount(4);
  await expect(page.getByText("Mark's Notes")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "TOC Stress Post" }),
  ).toBeVisible();
});

test("home page metadata uses the site title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("MH Blog Theme");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "MH Blog Theme",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "MH Blog Theme",
  );
});

test("browser dark preference controls theme even with a conflicting stored value", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  await context.addInitScript(() => {
    window.localStorage.setItem("theme", "light");
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await context.close();
});

test("browser dark preference sets the palette even when JavaScript is unavailable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    colorScheme: "dark",
    javaScriptEnabled: false,
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(17, 24, 39)",
  );
  await expect(page.getByRole("banner")).toHaveCSS(
    "background-color",
    "rgb(31, 41, 55)",
  );
  await context.close();
});

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

test("theme setup does not subscribe to live color-scheme changes", async ({ page }) => {
  await page.addInitScript(() => {
    const originalMatchMedia = window.matchMedia.bind(window);
    const registrations = [];

    window.__themeMediaRegistrations = registrations;
    window.matchMedia = (query) => {
      const mediaQueryList = originalMatchMedia(query);
      const originalAddEventListener = mediaQueryList.addEventListener.bind(mediaQueryList);

      mediaQueryList.addEventListener = (type, listener, options) => {
        registrations.push({ query, type });
        return originalAddEventListener(type, listener, options);
      };

      return mediaQueryList;
    };
  });

  await page.goto("/");

  const colorSchemeRegistrations = await page.evaluate(() =>
    window.__themeMediaRegistrations.filter(
      ({ query }) => query === "(prefers-color-scheme: dark)",
    ),
  );
  expect(colorSchemeRegistrations).toEqual([]);
});

test("archive page lists all posts", async ({ page }) => {
  await page.goto("/archives/");

  await expect(page.getByRole("heading", { name: "Archives" })).toBeVisible();
  await expect(page.getByText("First Post")).toBeVisible();
  await expect(page.getByText("Second Post")).toBeVisible();
});

test("archive page includes new fixture posts", async ({ page }) => {
  await page.goto("/archives/");

  await expect(page.getByText("TOC Stress Post")).toBeVisible();
  await expect(page.getByText("Built-In Shortcodes Post")).toBeVisible();
  await expect(page.getByText("Series Part 4")).toBeVisible();
});

test("all posts page shows series links first and tag chips second", async ({
  page,
}) => {
  await page.goto("/archives/");

  const sidebar = page.locator("main > section > div").first();
  const seriesHeading = sidebar.getByRole("heading", {
    name: "Series",
    exact: true,
  });
  const tagsHeading = sidebar.getByRole("heading", { name: "Tags", exact: true });
  const seriesLink = seriesHeading.locator(
    'xpath=ancestor::section[1]/div[1]/a[normalize-space()="fixture-series"]',
  );
  const tagChip = tagsHeading.locator(
    'xpath=ancestor::section[1]/div[1]/a[normalize-space()="fixture"]',
  );

  await expect(seriesHeading).toBeVisible();
  await expect(tagsHeading).toBeVisible();
  await expect(seriesLink).toBeVisible();
  await expect(tagChip).toBeVisible();
  await expect(tagChip).toHaveClass(/rounded-full/);
  await expect(tagChip).toHaveClass(/border-purple-200/);

  const headingOrder = await sidebar.locator("h2").evaluateAll((headings) =>
    headings.map((heading) => heading.textContent?.trim()),
  );

  expect(headingOrder).toEqual(["Series", "Tags"]);
});

test("archive page uses divider-based row summaries", async ({ page }) => {
  await page.goto("/archives/");

  await expect(page.locator("main article")).toHaveCount(8);
  await expect(page.locator("main hr")).toHaveCount(7);
  await expect(page.locator("main article").first()).not.toHaveClass(
    /rounded-2xl/,
  );
});

test("posts list page shows post summaries", async ({ page }) => {
  await page.goto("/posts/");

  await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "First Post" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Second Post" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "TOC Stress Post" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Built-In Shortcodes Post" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Series Part 4" })).toBeVisible();
  await expect(
    page.getByText("A searchable Hugo theme post with headings."),
  ).toBeVisible();
});

test("posts list page uses divider-based row summaries", async ({ page }) => {
  await page.goto("/posts/");

  await expect(page.locator("main article")).toHaveCount(8);
  await expect(page.locator("main hr")).toHaveCount(7);
  await expect(page.locator("main article").first()).not.toHaveClass(
    /rounded-2xl/,
  );
});

test("posts list page reuses the shared browsing surface styling", async ({
  page,
}) => {
  await page.goto("/posts/");

  await expect(page.getByRole("heading", { name: "Posts" })).toHaveClass(
    /font-extrabold/,
  );
  await expect(page.locator("main hr").first()).toHaveClass(
    /border-purple-200/,
  );
});

test("post headings link to their own anchors", async ({ page }) => {
  await page.goto("/posts/toc-stress-post/");

  const headingLink = page
    .locator("#large-section-one")
    .locator('a[href="#large-section-one"]');

  await expect(headingLink).toBeVisible();
  await expect(headingLink).toContainText("Large Section One");
});

test("content headings use distinct hierarchy styles", async ({ page }) => {
  await page.goto("/posts/toc-stress-post/");

  const contentBody = page.locator("#post-content [data-content-body]");

  await expect(contentBody).toHaveCount(1);

  const h2Styles = await contentBody.locator("#large-section-one").evaluate((node) => {
    const styles = getComputedStyle(node);

    return {
      fontSize: Number.parseFloat(styles.fontSize),
      marginTop: Number.parseFloat(styles.marginTop),
      marginBottom: Number.parseFloat(styles.marginBottom),
    };
  });
  const h3Styles = await contentBody.locator("#nested-layer-a").evaluate((node) => {
    const styles = getComputedStyle(node);

    return {
      fontSize: Number.parseFloat(styles.fontSize),
      marginTop: Number.parseFloat(styles.marginTop),
      marginBottom: Number.parseFloat(styles.marginBottom),
    };
  });
  const h4Styles = await contentBody.locator("#deep-detail-i").evaluate((node) => {
    const styles = getComputedStyle(node);

    return {
      fontSize: Number.parseFloat(styles.fontSize),
      marginTop: Number.parseFloat(styles.marginTop),
      marginBottom: Number.parseFloat(styles.marginBottom),
    };
  });

  expect(h2Styles.fontSize).toBeGreaterThan(h3Styles.fontSize);
  expect(h3Styles.fontSize).toBeGreaterThan(h4Styles.fontSize);
  expect(h2Styles.marginTop).toBeGreaterThan(h3Styles.marginTop);
  expect(h3Styles.marginTop).toBeGreaterThan(h4Styles.marginTop);
  expect(h2Styles.marginBottom).toBeGreaterThan(h4Styles.marginBottom);
});

test("code blocks use Roboto Mono", async ({ page }) => {
  await page.goto("/posts/shortcodes-builtins/");

  const contentBody = page.locator("#post-content [data-content-body]");

  await expect(contentBody).toHaveCount(1);

  const codeFont = await page
    .locator("#post-content [data-content-body] .highlight code")
    .evaluate((node) => getComputedStyle(node).fontFamily);

  await contentBody.evaluate((node) => {
    const inlineCode = document.createElement("code");
    inlineCode.textContent = "inline-example";

    const paragraph = document.createElement("p");
    paragraph.append("Inline ", inlineCode, " sample");

    node.appendChild(paragraph);
  });

  const inlineCodeFont = await contentBody
    .locator("p code")
    .last()
    .evaluate((node) => getComputedStyle(node).fontFamily);

  expect(codeFont.toLowerCase()).toContain("roboto mono");
  expect(inlineCodeFont.toLowerCase()).not.toContain("roboto mono");
});

test("mermaid code blocks render visible diagram output", async ({ page }) => {
  await page.goto("/posts/shortcodes-builtins/");

  await expect(page.locator(".mermaid")).toHaveCount(0);
  await expect(page.locator('svg[id^="mermaid-"]')).toBeVisible();
});

test("mermaid uses the dark theme on initial render when the browser prefers dark", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto("/posts/shortcodes-builtins/");

  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('svg[id^="mermaid-"]')).toBeVisible();
  await expect(page.locator('svg[id^="mermaid-"] style')).toContainText("fill:#ccc");
  await context.close();
});

test("post metadata tags and series are clickable taxonomy links", async ({
  page,
}) => {
  await page.goto("/posts/series-part-1/");

  await expect(
    page.getByRole("link", { name: "fixture-series", exact: true }),
  ).toHaveAttribute("href", "/series/fixture-series/");
  await expect(
    page.getByRole("link", { name: "series", exact: true }),
  ).toHaveAttribute("href", "/tags/series/");
});

test("single posts render series links and tag chips consistently", async ({
  page,
}) => {
  await page.goto("/posts/series-part-1/");

  const metadata = page.locator("main article").first();
  const seriesLink = metadata.getByRole("link", {
    name: "fixture-series",
    exact: true,
  });
  const tagLink = metadata.getByRole("link", { name: "series", exact: true });

  await expect(seriesLink).toBeVisible();
  await expect(seriesLink).not.toHaveClass(/rounded-full/);
  await expect(tagLink).toBeVisible();
  await expect(tagLink).toHaveClass(/rounded-full/);
});

test("post rows right-align taxonomy with the title on wide layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });
  const title = article.getByRole("heading", { name: "Series Part 1" });
  const seriesGroup = article.locator('[data-taxonomy-group="series"]');
  const tagsGroup = article.locator('[data-taxonomy-group="tags"]');

  await expectInlineSeriesRow(seriesGroup);
  await expect(
    seriesGroup.getByRole("link", { name: "fixture-series", exact: true }),
  ).toBeVisible();

  const [articleBox, titleBox, seriesBox, tagBox] = await Promise.all([
    getBox(article),
    getBox(title),
    getBox(seriesGroup),
    expectUnlabeledTagRow(tagsGroup),
  ]);

  await expect(tagsGroup.getByRole("link", { name: "series", exact: true })).toBeVisible();

  expectTrailingTaxonomyBlock(articleBox, titleBox, seriesBox, tagBox);
});

test("single posts right-align taxonomy with the title on wide layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/posts/series-part-1/");

  const header = page.locator("#post-content > header");
  const title = header.getByRole("heading", { name: "Series Part 1" });
  const seriesGroup = header.locator('[data-taxonomy-group="series"]');
  const tagsGroup = header.locator('[data-taxonomy-group="tags"]');

  await expectInlineSeriesRow(seriesGroup);
  await expect(
    seriesGroup.getByRole("link", { name: "fixture-series", exact: true }),
  ).toBeVisible();

  const [headerBox, titleBox, seriesBox, tagBox] = await Promise.all([
    getBox(header),
    getBox(title),
    getBox(seriesGroup),
    expectUnlabeledTagRow(tagsGroup),
  ]);

  await expect(tagsGroup.getByRole("link", { name: "series", exact: true })).toBeVisible();

  expectTrailingTaxonomyBlock(headerBox, titleBox, seriesBox, tagBox);
});

test("post rows metadata wraps taxonomy below the left content on narrow layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/posts/");

  const rowArticle = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });
  const rowLeftContent = rowArticle.locator("a").first();
  const rowSeriesGroup = rowArticle.locator('[data-taxonomy-group="series"]');
  const rowTagsGroup = rowArticle.locator('[data-taxonomy-group="tags"]');

  await expectInlineSeriesRow(rowSeriesGroup);
  await expect(
    rowSeriesGroup.getByRole("link", { name: "fixture-series", exact: true }),
  ).toBeVisible();

  const [rowLeftContentBox, rowSeriesBox, rowTagBox] = await Promise.all([
    getBox(rowLeftContent),
    getBox(rowSeriesGroup),
    expectUnlabeledTagRow(rowTagsGroup),
  ]);

  await expect(
    rowTagsGroup.getByRole("link", { name: "series", exact: true }),
  ).toBeVisible();

  expectWrappedStackedTaxonomy(rowLeftContentBox, rowSeriesBox, rowTagBox);
});

test("single post metadata wraps taxonomy below the left content on narrow layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/posts/series-part-1/");

  const singleHeader = page.locator("#post-content > header");
  const singleLeftContent = singleHeader.locator(':scope > div').first();
  const singleSeriesGroup = singleHeader.locator('[data-taxonomy-group="series"]');
  const singleTagsGroup = singleHeader.locator('[data-taxonomy-group="tags"]');

  await expectInlineSeriesRow(singleSeriesGroup);
  await expect(
    singleSeriesGroup.getByRole("link", { name: "fixture-series", exact: true }),
  ).toBeVisible();

  const [singleMetadataBox, singleSeriesBox, singleTagBox] = await Promise.all([
    getBox(singleLeftContent),
    getBox(singleSeriesGroup),
    expectUnlabeledTagRow(singleTagsGroup),
  ]);

  await expect(
    singleTagsGroup.getByRole("link", { name: "series", exact: true }),
  ).toBeVisible();

  expectWrappedStackedTaxonomy(singleMetadataBox, singleSeriesBox, singleTagBox);
});

test("post summary metadata groups series and tags separately on list surfaces", async ({
  page,
}) => {
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });
  const seriesGroup = article.locator('[data-taxonomy-group="series"]');
  const tagsGroup = article.locator('[data-taxonomy-group="tags"]');
  const seriesLink = seriesGroup.getByRole("link", {
    name: "fixture-series",
    exact: true,
  });
  const tagChip = tagsGroup.getByRole("link", { name: "series", exact: true });

  await expectInlineSeriesRow(seriesGroup);
  await expect(seriesLink).toBeVisible();
  await expect(tagsGroup.getByText("Tags", { exact: true })).toHaveCount(0);
  await expect(tagChip).toBeVisible();
});

test("post rows keep taxonomy links separate from the main post link", async ({
  page,
}) => {
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  const postLink = article.getByRole("link", { name: "Series Part 1" });
  const seriesLink = article.getByRole("link", {
    name: "fixture-series",
    exact: true,
  });
  const tagLink = article.getByRole("link", { name: "series", exact: true });

  await expect(postLink).toBeVisible();
  await expect(seriesLink).toBeVisible();
  await expect(tagLink).toBeVisible();
});

test("clicking row taxonomy links does not navigate to the post", async ({
  page,
}) => {
  await page.goto("/posts/");

  const article = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  await article.getByRole("link", { name: "fixture-series", exact: true }).click();
  await expect(page).toHaveURL(/\/series\/fixture-series\/$/);

  await page.goto("/posts/");
  const refreshedArticle = page
    .locator("main article")
    .filter({ has: page.getByRole("link", { name: "Series Part 1" }) });

  await refreshedArticle.getByRole("link", { name: "series", exact: true }).click();
  await expect(page).toHaveURL(/\/tags\/series\/$/);
});

test("taxonomy index pages do not show post read time metadata", async ({
  page,
}) => {
  await page.goto("/tags/");

  await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Hugo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Theme", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/min/)).toHaveCount(0);
});

test("tag term page includes multiple fixture types", async ({ page }) => {
  await page.goto("/tags/fixture/");

  await expect(page.getByText("Built-In Shortcodes Post")).toBeVisible();
  await expect(page.getByText("Series Part 1")).toBeVisible();
  await expect(page.getByText("Series Part 2")).toBeVisible();
  await expect(page.getByText("Series Part 3")).toBeVisible();
  await expect(page.getByText("Series Part 4")).toBeVisible();
});

test("tag term pages render row summaries instead of cards", async ({
  page,
}) => {
  await page.goto("/tags/fixture/");

  await expect(page.getByRole("heading", { name: "Fixture" })).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(5);
  await expect(page.locator("main article").first()).not.toHaveClass(
    /rounded-2xl/,
  );
  await expect(page.locator("main hr")).toHaveCount(4);
});

test("search opens and shows matching posts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("banner")).toBeVisible();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  const resultLink = page.getByRole("link", { name: /First Post/ });
  await expect(resultLink).toBeVisible();
  await expect(resultLink.locator("mark")).toHaveText("paragraph");

  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.getByPlaceholder("Search posts")).toBeHidden();

  await page.getByRole("button", { name: "Search" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
});

test("search result body match highlights and scrolls on the post", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  await page.getByRole("link", { name: /First Post/ }).click();

  await expect(page).toHaveURL(/\/posts\/first-post\/\?highlight=paragraph/);
  const mark = page.locator("#post-content [data-content-body] mark").first();
  await expect(mark).toHaveText(/paragraph/i);

  const box = await mark.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeLessThan(viewport.height);
});

test("search result metadata-only match opens at top without body highlight", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("fixture-series");

  await page.getByRole("link", { name: /Series Part 1/ }).click();

  await expect(page).toHaveURL(/\/posts\/series-part-1\/\?highlight=fixture-series/);
  await page.waitForFunction(
    () => window.Alpine && document.querySelector("[data-content-body]"),
  );
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  await expect(page.locator("#post-content mark")).toHaveCount(0);

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);
});

test("search focuses the input when opened", async ({ page }) => {
  let releaseIndexRequest = () => {};
  let resolveIndexRequestStarted;
  const indexRequestStarted = new Promise((resolve) => {
    resolveIndexRequestStarted = resolve;
  });

  await page.route("**/index.json", async (route) => {
    resolveIndexRequestStarted();
    await new Promise((resolve) => {
      releaseIndexRequest = resolve;
    });
    await route.continue();
  });

  await page.goto("/");
  const openSearch = page.getByRole("button", { name: "Search" }).click();

  await indexRequestStarted;

  await expect(page.getByPlaceholder("Search posts")).toBeFocused();

  releaseIndexRequest();
  await openSearch;
});

test("search closes when clicking the overlay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByPlaceholder("Search posts")).toBeVisible();

  await page.getByTestId("search-overlay").click({ position: { x: 12, y: 12 } });

  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
});

test("search overlay starts hidden", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
});

test("search stays safe when JavaScript is unavailable", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByPlaceholder("Search posts")).toBeHidden();

  await context.close();
});

test("search stays open and empty when the search index is unavailable", async ({
  page,
}) => {
  await page.route("**/index.json", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  await expect(page.getByPlaceholder("Search posts")).toBeVisible();
  await expect(page.getByRole("link", { name: "First Post" })).toHaveCount(0);
});

test("search Enter navigates to first result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  await Promise.all([
    page.waitForURL(/first-post/),
    page.keyboard.press("Enter")
  ]);

  await expect(page).toHaveURL(/first-post/);
});

test("search arrow keys navigate results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");

  const results = page.locator("[data-result-index]");
  const count = await results.count();
  if (count < 2) return;

  await page.keyboard.press("ArrowDown");
  await expect(results.nth(0)).toHaveClass(/border-purple-400/);

  await page.keyboard.press("ArrowDown");
  await expect(results.nth(1)).toHaveClass(/border-purple-400/);
  await expect(results.nth(0)).not.toHaveClass(/border-purple-400/);

  await page.keyboard.press("ArrowUp");
  await expect(results.nth(0)).toHaveClass(/border-purple-400/);
  await expect(results.nth(1)).not.toHaveClass(/border-purple-400/);
});

test("search wraps around with arrow keys", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");

  const results = page.locator("[data-result-index]");
  const last = (await results.count()) - 1;
  if (last < 1) return;

  await page.keyboard.press("ArrowUp");
  await expect(results.nth(last)).toHaveClass(/border-purple-400/);

  await page.keyboard.press("ArrowDown");
  await expect(results.nth(0)).toHaveClass(/border-purple-400/);
});

test("search shows type more message for short queries", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("ab");
  const searchOverlay = page.getByTestId("search-overlay");

  await expect(page.getByText("Type at least 3 characters to search")).toBeVisible();
  await expect(searchOverlay.getByText(/^\d+ results?$/)).toHaveCount(0);
  await expect(page.locator("[data-result-index]")).toHaveCount(0);
});

test("search shows no results for longer queries without matches", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("zzzmissing");
  const searchOverlay = page.getByTestId("search-overlay");

  await expect(page.getByText("No results")).toBeVisible();
  await expect(page.getByText("Type at least 3 characters to search")).toHaveCount(0);
  await expect(searchOverlay.getByText(/^\d+ results?$/)).toHaveCount(0);
  await expect(page.locator("[data-result-index]")).toHaveCount(0);
});

test("search shows a plural count when multiple results are found", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");
  const searchOverlay = page.getByTestId("search-overlay");
  const results = searchOverlay.locator("[data-result-index]");
  const resultCount = await results.count();

  await expect(resultCount).toBeGreaterThan(1);
  await expect(searchOverlay.getByText(new RegExp(`^${resultCount} results$`))).toBeVisible();
  await expect(searchOverlay.getByText(/^1 result$/)).toHaveCount(0);
});

test("search shows a singular count when one result is found", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("closing entry");
  const searchOverlay = page.getByTestId("search-overlay");

  await expect(searchOverlay.getByText(/^1 result$/)).toBeVisible();
  await expect(searchOverlay.getByText(/^\d+ results$/)).toHaveCount(0);
});

test("search shows all metadata and orders matching items first", async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("fixture");

  const result = page
    .locator("[data-result-index]")
    .filter({ has: page.getByText("TOC Stress Post", { exact: true }) })
    .first();
  const metadata = result.locator(".search-result-meta span");
  const labels = await metadata.evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim()),
  );
  const metrics = await result.locator(".search-result-meta").evaluate((node) => {
    const lastChild = node.querySelector("span:last-of-type");
    const children = Array.from(node.querySelectorAll("span")).map((child) => {
      const rect = child.getBoundingClientRect();

      return { top: rect.top, height: rect.height };
    });

    if (lastChild) {
      lastChild.scrollIntoView({ inline: "end", block: "nearest" });
    }

    const containerRect = node.getBoundingClientRect();
    const lastRect = lastChild?.getBoundingClientRect();
    const styles = getComputedStyle(node);

    return {
      clientWidth: node.clientWidth,
      clientHeight: node.clientHeight,
      scrollLeft: node.scrollLeft,
      scrollHeight: node.scrollHeight,
      scrollWidth: node.scrollWidth,
      heights: children.map((child) => child.height),
      lastRight: lastRect?.right ?? 0,
      containerRight: containerRect.right,
    };
  });

  await expect(result).toBeVisible();
  expect(labels).toEqual(["hugo", "theme", "toc", "longform", "testing"]);
  expect(metrics.scrollHeight).toBe(metrics.clientHeight);
  expect(Math.max(...metrics.heights)).toBeLessThanOrEqual(metrics.clientHeight);
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  expect(metrics.scrollLeft).toBeGreaterThan(0);
  expect(metrics.lastRight).toBeLessThanOrEqual(metrics.containerRight);
});

test("search uses summary text in the snippet when summary matches", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("closing entry");

  const result = page
    .locator("[data-result-index]")
    .filter({ has: page.getByText("Series Part 4", { exact: true }) })
    .first();
  const excerpt = result.locator(".search-result-excerpt");

  await expect(result).toBeVisible();
  await expect(excerpt).toContainText("Closing entry in the shared fixture series.");
  await expect(excerpt).not.toContainText("This is the closing entry in the shared series fixture.");
});

test("search caps the visible results area to three cards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("post");

  const results = page.locator("[data-result-index]");
  expect(await results.count()).toBeGreaterThan(3);

  const layout = await page.locator("[data-results-container]").evaluate((node) => {
    const containerRect = node.getBoundingClientRect();
    const cards = Array.from(node.querySelectorAll("[data-result-index]"));

    return {
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      visibleCards: cards.filter((card) => {
        const rect = card.getBoundingClientRect();
        return rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
      }).length,
      fourthCardBottom: cards[3]?.getBoundingClientRect().bottom ?? 0,
      containerBottom: containerRect.bottom,
    };
  });

  expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight);
  expect(layout.visibleCards).toBe(3);
  expect(layout.fourthCardBottom).toBeGreaterThan(layout.containerBottom);
});

test("search close restores a previously auto-hidden toolbar", async ({ page }) => {
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

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(3200);
  await expect(banner).toHaveClass(/opacity-0/);

  await page.evaluate(async () => {
    const searchButton = document.querySelector('button[aria-label="Search"]');
    const searchUi = searchButton?.closest('[x-data]')?._x_dataStack?.[0];
    if (!searchUi) throw new Error("Expected Alpine searchUi data");
    await searchUi.openSearch();
  });

  await expect(page.getByPlaceholder("Search posts")).toBeVisible();
  await expect(banner).not.toHaveClass(/opacity-0/);

  await page.getByRole("button", { name: "Close search" }).click();

  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
  await expect(banner).toHaveClass(/opacity-0/);
});

test("search close recalculates toolbar visibility after scrolling while open", async ({ page }) => {
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

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(3200);
  await expect(banner).toHaveClass(/opacity-0/);

  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByPlaceholder("Search posts")).toBeVisible();
  await expect(banner).not.toHaveClass(/opacity-0/);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Close search" }).click();

  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(banner).not.toHaveClass(/opacity-0/);
});

test("search close hides the toolbar after scrolling down while open", async ({ page }) => {
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

  await expect(banner).not.toHaveClass(/opacity-0/);

  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByPlaceholder("Search posts")).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.getByRole("button", { name: "Close search" }).click();

  await expect(page.getByPlaceholder("Search posts")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
  await expect(banner).toHaveClass(/opacity-0/);
});

test("back to top returns to the top of the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");
  await expect(page.getByRole("button", { name: "Back to top" })).toHaveCount(
    0,
  );
  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    const filler = document.createElement("div");
    filler.style.height = "1200px";
    postContent.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole("button", { name: "Back to top" })).toBeVisible();
  await page.getByRole("button", { name: "Back to top" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20);
});

test("single posts update the reading progress bar while scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    const filler = document.createElement("div");
    filler.style.height = "1600px";
    postContent.appendChild(filler);
    window.dispatchEvent(new Event("resize"));
  });

  await expect(page.locator("#reading-progress")).toHaveAttribute(
    "style",
    /width:\s*0%/,
  );

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    const contentTop = window.scrollY + postContent.getBoundingClientRect().top;
    const maxScroll = Math.max(
      postContent.offsetHeight - window.innerHeight,
      1,
    );

    window.scrollTo(0, contentTop + maxScroll / 2);
  });

  await expect
    .poll(async () =>
      Number.parseInt(
        await page
          .locator("#reading-progress")
          .evaluate((node) => node.style.width),
        10,
      ),
    )
    .toBeGreaterThan(0);

  await page.evaluate(() => {
    const postContent = document.getElementById("post-content");
    if (!postContent) throw new Error("Expected #post-content");

    window.scrollTo(
      0,
      postContent.offsetTop + postContent.offsetHeight - window.innerHeight,
    );
  });

  await expect
    .poll(async () =>
      Number.parseInt(
        await page
          .locator("#reading-progress")
          .evaluate((node) => node.style.width),
        10,
      ),
    )
    .toBe(100);
});

test("toc stress post renders deep TOC entries", async ({ page }) => {
  await page.goto("/posts/toc-stress-post/");

  await expect(
    page.getByRole("heading", { name: "TOC Stress Post" }),
  ).toBeVisible();
  await expect(page.locator("#TableOfContents")).toContainText(
    "Large Section One",
  );
  await expect(page.locator("#TableOfContents")).toContainText(
    "Nested Layer A",
  );
  await expect(page.locator("#TableOfContents")).toContainText("Deep Detail I");
});

test("toc stress post allows meaningful jump navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/posts/toc-stress-post/");

  const startingScrollY = await page.evaluate(() => window.scrollY);
  const viewportHeight = page.viewportSize()?.height ?? 720;

  await page
    .locator("#TableOfContents")
    .getByRole("link", { name: "Final Long Section", exact: true })
    .click();

  await expect
    .poll(() => page.evaluate(() => window.location.hash))
    .toBe("#final-long-section");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(startingScrollY + 400);
  await expect
    .poll(() =>
      page
        .locator("#final-long-section")
        .evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    )
    .toBeLessThan(Math.floor(viewportHeight * 0.6));
});

test("toc stress post highlights the active TOC entry while scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/toc-stress-post/");

  await expect(
    page.locator('#TableOfContents a[aria-current="location"]'),
  ).toContainText("Large Section One");

  await page.evaluate(() => {
    const target = document.getElementById("final-long-section");
    if (!target) throw new Error("Expected #final-long-section");

    window.scrollTo(
      0,
      window.scrollY + target.getBoundingClientRect().top - 120,
    );
  });

  await expect(
    page.locator('#TableOfContents a[aria-current="location"]'),
  ).toContainText("Final Long Section");
});

test("single post exposes canonical and social metadata", async ({ page }) => {
  await page.goto("/posts/first-post/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/posts\/first-post\/$/,
  );
  await expect(page).toHaveTitle("First Post | MH Blog Theme");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "First Post | MH Blog Theme",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "First Post | MH Blog Theme",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/images\/post-1\.jpg$/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /\/images\/post-1\.jpg$/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const socialImageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const socialImageResponse = socialImageUrl
    ? await page.request.get(socialImageUrl)
    : null;

  expect(socialImageResponse?.ok()).toBe(true);
});

test("post without optional metadata still renders", async ({ page }) => {
  await page.goto("/posts/second-post/");

  await expect(
    page.getByRole("heading", { name: "Second Post" }),
  ).toBeVisible();
  await expect(page.locator("article img")).toHaveCount(0);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0);
});

test("post without optional metadata does not render an empty taxonomy wrapper", async ({
  page,
}) => {
  await page.goto("/posts/second-post/");

  await expect(
    page.locator("#post-content > header [data-taxonomy-group=\"series\"]"),
  ).toHaveCount(0);
  await expect(
    page.locator("#post-content > header [data-taxonomy-group=\"tags\"]"),
  ).toHaveCount(1);
});

test("shortcodes fixture renders visible built-in shortcode output", async ({
  page,
}) => {
  await page.goto("/posts/shortcodes-builtins/");

  await expect(
    page.getByRole("heading", { name: "Built-In Shortcodes Post" }),
  ).toBeVisible();
  await expect(page.locator("article .highlight")).toBeVisible();
  await expect(page.locator("article .highlight code")).toContainText(
    "func main()",
  );
  await expect(page.locator("article .highlight code")).toContainText(
    "hello from shortcode fixture",
  );
  await expect(page.getByRole("main")).not.toContainText(
    "{{< highlight go >}}",
  );
  await expect(page.getByRole("main")).toContainText(
    "Inline notice rendered through a Hugo shortcode example.",
  );
});

test("shortcode fixture renders all supported embedded shortcode outputs visibly", async ({
  page,
}) => {
  await page.goto("/posts/shortcodes-builtins/");

  const details = page.locator("article details");

  await expect(details).toHaveAttribute("open", "");
  await expect(details.locator("summary")).toContainText(
    "Open the embedded details block",
  );
  await expect(details).toContainText(
    "This copy stays visible because the details shortcode starts expanded.",
  );

  const figure = page.locator("article figure").filter({
    hasText: "Fixture image rendered by the figure shortcode.",
  });

  await expect(figure.locator('img[alt="Fixture cover image"]')).toBeVisible();
  await expect(figure.locator("figcaption")).toContainText(
    "Fixture image rendered by the figure shortcode.",
  );

  await expect(page.getByRole("main")).toContainText(
    "Example site for MH Blog Theme",
  );
  await expect(
    page.getByRole("link", { name: "First Post via ref shortcode" }),
  ).toHaveAttribute("href", /\/posts\/first-post\/$/);
  await expect(
    page.getByRole("link", { name: "Second Post via relref shortcode" }),
  ).toHaveAttribute("href", "/posts/second-post/");

  await expect(
    page.locator('img[alt="QR code for the shortcode fixture post"]'),
  ).toBeVisible();

  const youTubeEmbed = page.locator(
    'iframe[title="Fixture YouTube video"][src*="youtube.com"]',
  );

  await expect(youTubeEmbed).toBeVisible();
  await expect
    .poll(() =>
      youTubeEmbed.evaluate((node) => Math.round(node.getBoundingClientRect().width)),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      youTubeEmbed.evaluate((node) => Math.round(node.getBoundingClientRect().height)),
    )
    .toBeGreaterThan(0);

  const xEmbed = page.locator("blockquote.twitter-tweet");

  await expect(xEmbed).toBeVisible();
  await expect(xEmbed).toContainText("just setting up my twttr");

  await expect(page.locator('svg[id^="mermaid-"]')).toBeVisible();

  const vimeoEmbed = page.locator(
    'iframe[title="Fixture Vimeo video"][src*="player.vimeo.com"]',
  );

  await expect(vimeoEmbed).toBeVisible();
  await expect
    .poll(() =>
      vimeoEmbed.evaluate((node) => Math.round(node.getBoundingClientRect().width)),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      vimeoEmbed.evaluate((node) => Math.round(node.getBoundingClientRect().height)),
    )
    .toBeGreaterThan(0);

  const instagramVisibleNodes = page.locator(
    'blockquote.instagram-media, iframe[src*="instagram.com"]',
  );

  await expect
    .poll(() =>
      instagramVisibleNodes.evaluateAll((nodes) =>
        nodes.filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length,
      ),
    )
    .toBeGreaterThan(0);
});

test("series fixture posts render shared series metadata", async ({ page }) => {
  await page.goto("/posts/series-part-1/");

  await expect(
    page.getByRole("heading", { name: "Series Part 1" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("fixture-series");
});

test("series navigation shows previous and next cards for middle posts", async ({
  page,
}) => {
  await page.goto("/posts/series-part-2/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const previousCard = nav.locator('[data-series-nav-card="previous"]');
  const nextCard = nav.locator('[data-series-nav-card="next"]');

  await expect(nav).toBeVisible();
  await expect(previousCard.getByRole("link", { name: /Series Part 1/ })).toHaveAttribute(
    "href",
    "/posts/series-part-1/",
  );
  await expect(nextCard.getByRole("link", { name: /Series Part 3/ })).toHaveAttribute(
    "href",
    "/posts/series-part-3/",
  );
  await expect(previousCard).toContainText("Previous");
  await expect(nextCard).toContainText("Next");
});

test("series navigation keeps disabled edge cards visible on first and last posts", async ({
  page,
}) => {
  await page.goto("/posts/series-part-1/");

  let nav = page.getByRole("navigation", { name: "Series navigation" });
  let previousCard = nav.locator('[data-series-nav-card="previous"]');
  let nextCard = nav.locator('[data-series-nav-card="next"]');

  await expect(nav).toBeVisible();
  await expect(previousCard).toContainText("No Previous");
  await expect(previousCard.getByRole("link")).toHaveCount(0);
  await expect(nextCard.getByRole("link", { name: /Series Part 2/ })).toHaveAttribute(
    "href",
    "/posts/series-part-2/",
  );

  await page.goto("/posts/series-part-4/");

  nav = page.getByRole("navigation", { name: "Series navigation" });
  previousCard = nav.locator('[data-series-nav-card="previous"]');
  nextCard = nav.locator('[data-series-nav-card="next"]');

  await expect(nav).toBeVisible();
  await expect(previousCard.getByRole("link", { name: /Series Part 3/ })).toHaveAttribute(
    "href",
    "/posts/series-part-3/",
  );
  await expect(nextCard).toContainText("No Next");
  await expect(nextCard.getByRole("link")).toHaveCount(0);
});

test("series navigation cards keep equal heights when stacked", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/posts/series-part-1/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const previousCard = nav.locator('[data-series-nav-card="previous"]');
  const nextCard = nav.locator('[data-series-nav-card="next"]');
  const [previousBox, nextBox] = await Promise.all([
    getBox(previousCard),
    getBox(nextCard),
  ]);

  expect(Math.abs(previousBox.height - nextBox.height)).toBeLessThanOrEqual(1);
});

test("series navigation uses dark palette in dark mode", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto("/posts/series-part-2/");

  const previousCard = page
    .getByRole("navigation", { name: "Series navigation" })
    .locator('[data-series-nav-card="previous"]');
  const textColor = await previousCard.evaluate(
    (element) => getComputedStyle(element).color,
  );
  const borderColor = await previousCard.evaluate(
    (element) => getComputedStyle(element).borderColor,
  );

  await expect(previousCard).toHaveCSS("background-color", "rgb(31, 41, 55)");
  expect(textColor).not.toBe("rgb(15, 23, 42)");
  expect(borderColor).not.toBe("rgb(233, 213, 255)");

  await context.close();
});

test("series navigation mirrors chevron and calendar placement per side", async ({
  page,
}) => {
  await page.goto("/posts/series-part-2/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const previousCard = nav.locator('[data-series-nav-card="previous"]');
  const nextCard = nav.locator('[data-series-nav-card="next"]');
  const previousLabel = previousCard.getByText("Previous", { exact: true });
  const previousDate = previousCard.getByText("Apr 8, 2026", { exact: true });
  const nextLabel = nextCard.getByText("Next", { exact: true });
  const nextDate = nextCard.getByText("Apr 10, 2026", { exact: true });
  const [previousIconBoxes, previousLabelBox, previousDateBox] =
    await Promise.all([
      getSeriesNavIconBoxes(previousCard, "Previous", "Apr 8, 2026"),
      getBox(previousLabel),
      getBox(previousDate),
    ]);
  const [nextIconBoxes, nextLabelBox, nextDateBox] =
    await Promise.all([
      getSeriesNavIconBoxes(nextCard, "Next", "Apr 10, 2026"),
      getBox(nextLabel),
      getBox(nextDate),
    ]);

  expect(previousIconBoxes.chevron.right).toBeLessThan(previousLabelBox.left);
  expect(previousIconBoxes.calendar.right).toBeLessThan(previousDateBox.left);
  expect(nextIconBoxes.chevron.left).toBeGreaterThan(nextLabelBox.right);
  expect(nextIconBoxes.calendar.left).toBeGreaterThan(nextDateBox.right);
});

test("single posts show related rows below series navigation", async ({ page }) => {
  await page.goto("/posts/series-part-2/");

  const nav = page.getByRole("navigation", { name: "Series navigation" });
  const relatedSection = page.locator(
    'section[aria-labelledby="related-posts-heading"]',
  );
  const relatedHeading = relatedSection.getByRole("heading", {
    name: "Related",
    exact: true,
  });

  await expect(nav).toBeVisible();
  await expect(relatedHeading).toBeVisible();

  const [navBox, relatedBox] = await Promise.all([getBox(nav), getBox(relatedSection)]);

  expect(relatedBox.top).toBeGreaterThan(navBox.bottom);
});

test("related rows include expected non-series posts", async ({ page }) => {
  await page.goto("/posts/series-part-2/");

  const relatedSection = page.locator(
    'section[aria-labelledby="related-posts-heading"]',
  );

  await expect(
    relatedSection.getByRole("heading", {
      name: "Built-In Shortcodes Post",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    relatedSection.getByRole("heading", { name: "TOC Stress Post", exact: true }),
  ).toBeVisible();
  await expect(
    relatedSection.getByRole("heading", { name: "Series Part 1", exact: true }),
  ).toHaveCount(0);
  await expect(
    relatedSection.getByRole("heading", { name: "Series Part 3", exact: true }),
  ).toHaveCount(0);
});

test("related rows reuse home-page row styling and stay capped at four items", async ({
  page,
}) => {
  await page.goto("/posts/series-part-2/");

  const relatedSection = page.locator(
    'section[aria-labelledby="related-posts-heading"]',
  );
  const relatedRows = relatedSection.locator("article");
  const relatedHeading = relatedRows.first().getByRole("heading").first();

  await expect(relatedRows).toHaveCount(4);
  await expect(relatedRows.first()).toHaveClass(/py-5/);
  await expect(relatedHeading).toHaveClass(/text-2xl/);
  await expect(relatedHeading).toHaveClass(/font-extrabold/);
  await expect(relatedHeading).toHaveClass(/tracking-tight/);
  const rowDividers = relatedSection.locator("div.mt-4 hr");
  await expect(rowDividers).toHaveCount(3);
  await expect(rowDividers.first()).toHaveClass(/border-purple-200/);
});

test("single posts hide related heading when no eligible related posts remain", async ({
  page,
}) => {
  const { execFileSync } = await import("node:child_process");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), "mh-theme-related-hidden-e2e-"));
  const themeDir = process.cwd();
  const themesDir = path.join(siteDir, "themes");
  const writePost = (name, content) => {
    fs.writeFileSync(path.join(siteDir, "content", "posts", `${name}.md`), content);
  };

  try {
    fs.mkdirSync(path.join(siteDir, "content", "posts"), { recursive: true });
    fs.mkdirSync(themesDir, { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, "hugo.yaml"),
      fs.readFileSync(path.join(themeDir, "exampleSite", "hugo.yaml"), "utf8"),
    );
    fs.writeFileSync(path.join(siteDir, "content", "_index.md"), "---\ntitle: Home\n---\n");
    fs.symlinkSync(path.join(themeDir, "node_modules"), path.join(siteDir, "node_modules"));
    fs.symlinkSync(themeDir, path.join(themesDir, "mh-blog-theme"));
    writePost(
      "anchor",
      "---\ntitle: Anchor Post\ndate: 2026-04-05\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
    );
    writePost(
      "same-series-a",
      "---\ntitle: Same Series A\ndate: 2026-04-04\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
    );
    writePost(
      "same-series-b",
      "---\ntitle: Same Series B\ndate: 2026-04-03\nsummary: Hugo theme anchor summary\ntags: [hugo, theme]\nseries: [alpha-series]\n---\n",
    );

    execFileSync("hugo", ["--source", siteDir, "--themesDir", themesDir], {
      cwd: themeDir,
      stdio: "pipe",
    });

    await page.goto(
      pathToFileURL(path.join(siteDir, "public", "posts", "anchor", "index.html")).href,
    );

    await expect(
      page.getByRole("heading", { name: "Related", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator('section[aria-labelledby="related-posts-heading"]'),
    ).toHaveCount(0);
  } finally {
    fs.rmSync(siteDir, { force: true, recursive: true });
  }
});

test("series term page lists all four parts", async ({ page }) => {
  await page.goto("/series/fixture-series/");

  const seriesTitles = page.locator("main article h2");

  await expect(seriesTitles).toHaveCount(4);
  await expect(seriesTitles).toHaveText([
    "Series Part 4",
    "Series Part 3",
    "Series Part 2",
    "Series Part 1",
  ]);
});

test("header is sticky with backdrop blur on all pages", async ({ page }) => {
  await page.goto("/");

  const banner = page.getByRole("banner");
  await expect(banner).toHaveCSS("position", "sticky");
  await expect(banner).toHaveClass(/backdrop-blur-md/);
  await expect(banner).toHaveClass(/z-40/);
});

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

test("header stays visible when scrolled above the threshold", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/posts/first-post/");

  const banner = page.getByRole("banner");

  await expect(banner).not.toHaveClass(/opacity-0/);

  await page.evaluate(() => window.scrollTo(0, 50));

  await expect(banner).not.toHaveClass(/opacity-0/);
});

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

test("scrolling down does not re-show the header after it has faded out", async ({ page }) => {
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

  await expect(banner).toHaveClass(/opacity-0/);
});

test("scrolling up re-shows the header after it has faded out", async ({ page }) => {
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

  await page.evaluate(() => window.scrollBy(0, -50));

  await expect(banner).not.toHaveClass(/opacity-0/);
});

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

test("mobile toc hamburger is visible on small screens and hidden on large", async ({
  page,
}) => {
  await page.goto("/posts/toc-stress-post/");

  await page.setViewportSize({ width: 480, height: 800 });
  await expect(page.getByRole("button", { name: "Table of contents" })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(
    page.getByRole("button", { name: "Table of contents" }),
  ).toHaveCount(0);
});

test("mobile toc panel opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto("/posts/toc-stress-post/");

  const hamburger = page.getByRole("button", { name: "Table of contents" });
  const closeBtn = page.getByRole("button", {
    name: "Close table of contents",
  });

  await expect(closeBtn).toHaveCount(0);

  await hamburger.click();

  await expect(closeBtn).toBeVisible();
  await expect(page.locator("#TableOfContentsMobile")).toBeVisible();
  await expect(page.locator("#TableOfContentsMobile")).toContainText(
    "Large Section One",
  );

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
    window.scrollTo(
      0,
      window.scrollY + target.getBoundingClientRect().top - 120,
    );
  });

  await expect(
    page.locator('#TableOfContentsMobile a[aria-current="location"]'),
  ).toContainText("Final Long Section");
});

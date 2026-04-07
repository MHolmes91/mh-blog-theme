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

test("theme preference updates the page palette while the page is open", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect(page.locator("body")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(250, 247, 255)",
  );

  await page.emulateMedia({ colorScheme: "dark" });

  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(17, 24, 39)",
  );
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
    page.getByText("A searchable post with headings."),
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

  const header = page.locator("main article header");
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

  const singleHeader = page.locator("main article header");
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

  await expect(page.getByText("TOC Stress Post")).toBeVisible();
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
  await expect(page.locator("main article")).toHaveCount(6);
  await expect(page.locator("main article").first()).not.toHaveClass(
    /rounded-2xl/,
  );
  await expect(page.locator("main hr")).toHaveCount(5);
});

test("search opens and shows matching posts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search posts").fill("paragraph");

  await expect(page.getByRole("link", { name: "First Post" })).toBeVisible();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.getByPlaceholder("Search posts")).toBeHidden();

  await page.getByRole("button", { name: "Search" }).click();
  await page.keyboard.press("Escape");
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

  await expect(page.locator("article header > div")).toHaveCount(1);
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

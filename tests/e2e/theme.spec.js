import { test, expect } from "@playwright/test";

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

  const seriesHeading = page.getByRole("heading", {
    name: "Series",
    exact: true,
  });
  const tagsHeading = page.getByRole("heading", { name: "Tags", exact: true });
  const seriesLink = page.getByRole("link", {
    name: "fixture-series",
    exact: true,
  });
  const tagChip = page.getByRole("link", { name: "fixture", exact: true });

  await expect(seriesHeading).toBeVisible();
  await expect(tagsHeading).toBeVisible();
  await expect(seriesLink).toBeVisible();
  await expect(tagChip).toBeVisible();
  await expect(tagChip).toHaveClass(/rounded-full/);
  await expect(tagChip).toHaveClass(/border-purple-200/);

  const headingOrder = await page.locator("main h2").evaluateAll((headings) =>
    headings.map((heading) => heading.textContent?.trim()),
  );

  expect(headingOrder.indexOf("Series")).toBeLessThan(headingOrder.indexOf("Tags"));
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

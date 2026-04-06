import { test, expect } from '@playwright/test'

test('home page renders shared chrome', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toContainText('MH Blog Theme')
  await expect(page.getByRole('contentinfo')).toContainText('GitHub')
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/example')
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to top' })).toBeVisible()
})

test('home page shows intro and recent posts', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText("Mark's Notes")).toBeVisible()
  await expect(page.getByRole('link', { name: 'First Post' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Second Post' })).toBeVisible()
})

test('home page metadata uses the site title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('MH Blog Theme')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'MH Blog Theme')
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'MH Blog Theme')
})

test('archive page lists all posts', async ({ page }) => {
  await page.goto('/archives/')

  await expect(page.getByRole('heading', { name: 'Archives' })).toBeVisible()
  await expect(page.getByText('First Post')).toBeVisible()
  await expect(page.getByText('Second Post')).toBeVisible()
})

test('posts list page shows post summaries', async ({ page }) => {
  await page.goto('/posts/')

  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'First Post' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Second Post' })).toBeVisible()
  await expect(page.getByText('A searchable post with headings.')).toBeVisible()
})

test('taxonomy index pages do not show post read time metadata', async ({ page }) => {
  await page.goto('/tags/')

  await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Hugo', exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Theme', exact: true })).toBeVisible()
  await expect(page.getByText(/min read/)).toHaveCount(0)
})

test('search opens and shows matching posts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByPlaceholder('Search posts').fill('paragraph')

  await expect(page.getByRole('link', { name: 'First Post' })).toBeVisible()
  await page.getByRole('button', { name: 'Close search' }).click()
  await expect(page.getByPlaceholder('Search posts')).toBeHidden()

  await page.getByRole('button', { name: 'Search' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByPlaceholder('Search posts')).toBeHidden()
})

test('search overlay starts hidden', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByPlaceholder('Search posts')).toBeHidden()
})

test('search stays safe when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  await page.goto('/')
  await expect(page.getByPlaceholder('Search posts')).toBeHidden()

  await context.close()
})

test('search stays open and empty when the search index is unavailable', async ({ page }) => {
  await page.route('**/index.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '[]' })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByPlaceholder('Search posts').fill('paragraph')

  await expect(page.getByPlaceholder('Search posts')).toBeVisible()
  await expect(page.getByRole('link', { name: 'First Post' })).toHaveCount(0)
})

test('back to top returns to the top of the page', async ({ page }) => {
  await page.goto('/posts/first-post/')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: 'Back to top' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('single posts update the reading progress bar while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 })
  await page.goto('/posts/first-post/')

  await page.evaluate(() => {
    const postContent = document.getElementById('post-content')
    if (!postContent) throw new Error('Expected #post-content')

    const filler = document.createElement('div')
    filler.style.height = '1600px'
    postContent.appendChild(filler)
    window.dispatchEvent(new Event('resize'))
  })

  await expect(page.locator('#reading-progress')).toHaveAttribute('style', /width:\s*0%/)

  await page.evaluate(() => {
    const postContent = document.getElementById('post-content')
    if (!postContent) throw new Error('Expected #post-content')

    const contentTop = window.scrollY + postContent.getBoundingClientRect().top
    const maxScroll = Math.max(postContent.offsetHeight - window.innerHeight, 1)

    window.scrollTo(0, contentTop + maxScroll / 2)
  })

  await expect
    .poll(async () => Number.parseInt(await page.locator('#reading-progress').evaluate((node) => node.style.width), 10))
    .toBeGreaterThan(0)

  await page.evaluate(() => {
    const postContent = document.getElementById('post-content')
    if (!postContent) throw new Error('Expected #post-content')

    window.scrollTo(0, postContent.offsetTop + postContent.offsetHeight - window.innerHeight)
  })

  await expect
    .poll(async () => Number.parseInt(await page.locator('#reading-progress').evaluate((node) => node.style.width), 10))
    .toBe(100)
})

test('toc stress post renders deep TOC entries', async ({ page }) => {
  await page.goto('/posts/toc-stress-post/')

  await expect(page.getByRole('heading', { name: 'TOC Stress Post' })).toBeVisible()
  await expect(page.locator('#TableOfContents')).toContainText('Large Section One')
  await expect(page.locator('#TableOfContents')).toContainText('Nested Layer A')
  await expect(page.locator('#TableOfContents')).toContainText('Deep Detail I')
})

test('toc stress post allows meaningful jump navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/posts/toc-stress-post/')

  const startingScrollY = await page.evaluate(() => window.scrollY)
  const viewportHeight = page.viewportSize()?.height ?? 720

  await page.getByRole('link', { name: 'Final Long Section', exact: true }).click()

  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#final-long-section')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(startingScrollY + 400)
  await expect
    .poll(() => page.locator('#final-long-section').evaluate((node) => Math.round(node.getBoundingClientRect().top)))
    .toBeLessThan(Math.floor(viewportHeight / 2))
})

test('toc stress post highlights the active TOC entry while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 })
  await page.goto('/posts/toc-stress-post/')

  await expect(page.locator('#TableOfContents a[aria-current="location"]')).toContainText('Large Section One')

  await page.evaluate(() => {
    const target = document.getElementById('final-long-section')
    if (!target) throw new Error('Expected #final-long-section')

    window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - 120)
  })

  await expect(page.locator('#TableOfContents a[aria-current="location"]')).toContainText('Final Long Section')
})

test('single post exposes canonical and social metadata', async ({ page }) => {
  await page.goto('/posts/first-post/')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/posts\/first-post\/$/)
  await expect(page).toHaveTitle('First Post | MH Blog Theme')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'First Post | MH Blog Theme')
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'First Post | MH Blog Theme')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/images\/post-1\.jpg$/)
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /\/images\/post-1\.jpg$/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')

  const socialImageUrl = await page.locator('meta[property="og:image"]').getAttribute('content')
  const socialImageResponse = socialImageUrl ? await page.request.get(socialImageUrl) : null

  expect(socialImageResponse?.ok()).toBe(true)
})

test('post without optional metadata still renders', async ({ page }) => {
  await page.goto('/posts/second-post/')

  await expect(page.getByRole('heading', { name: 'Second Post' })).toBeVisible()
  await expect(page.locator('article img')).toHaveCount(0)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary')
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0)
  await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0)
})

test('shortcodes fixture renders built-in shortcode content with featured image', async ({ page }) => {
  await page.goto('/posts/shortcodes-builtins/')

  await expect(page.getByRole('heading', { name: 'Built-In Shortcodes Post' })).toBeVisible()
  await expect(page.locator('article img')).toHaveAttribute('src', /\/images\/post-1\.jpg$/)
  await expect(page.locator('article .highlight code')).toContainText('func main()')
  await expect(page.locator('article .highlight code')).toContainText('hello from shortcode fixture')
  await expect(page.getByRole('main')).not.toContainText('{{< highlight go >}}')
  await expect(page.getByRole('main')).toContainText('Inline notice rendered through a Hugo shortcode example.')
})

test('series fixture posts render shared series metadata', async ({ page }) => {
  await page.goto('/posts/series-part-1/')

  await expect(page.getByRole('heading', { name: 'Series Part 1' })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('fixture-series')
})

test('series term page lists all four parts', async ({ page }) => {
  await page.goto('/series/fixture-series/')

  const seriesTitles = page.locator('main article h2')

  await expect(seriesTitles).toHaveCount(4)
  await expect(seriesTitles).toHaveText([
    'Series Part 4',
    'Series Part 3',
    'Series Part 2',
    'Series Part 1'
  ])
})

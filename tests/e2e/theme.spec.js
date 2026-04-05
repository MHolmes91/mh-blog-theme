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

test('back to top returns to the top of the page', async ({ page }) => {
  await page.goto('/posts/first-post/')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: 'Back to top' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('single post exposes canonical and social metadata', async ({ page }) => {
  await page.goto('/posts/first-post/')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/posts\/first-post\/$/)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'First Post')
})

test('post without optional metadata still renders', async ({ page }) => {
  await page.goto('/posts/second-post/')

  await expect(page.getByRole('heading', { name: 'Second Post' })).toBeVisible()
  await expect(page.locator('article img')).toHaveCount(0)
})

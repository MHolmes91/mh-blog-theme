import { test, expect } from '@playwright/test'

test('home page renders shared chrome', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toContainText('MH Blog Theme')
  await expect(page.getByRole('contentinfo')).toContainText('GitHub')
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/example')
  await expect(page.getByText('Search', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Back to top' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to top' })).toHaveAttribute('href', '#top')
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

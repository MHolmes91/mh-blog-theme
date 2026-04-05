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

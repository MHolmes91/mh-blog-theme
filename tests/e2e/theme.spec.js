import { test, expect } from '@playwright/test'

test('home page renders shared chrome', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toContainText('MH Blog Theme')
  await expect(page.getByRole('contentinfo')).toContainText('GitHub')
  await expect(page.getByRole('button', { name: 'Back to top' })).toBeVisible()
})

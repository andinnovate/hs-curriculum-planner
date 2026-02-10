import { expect, test } from '@playwright/test'
import { injectSupabaseSession } from './auth'

test('shows admin link for admin users', async ({ page }) => {
  await injectSupabaseSession(page, {
    email: 'admin@example.com',
    appMetadata: { role: 'admin' },
  })
  await page.goto('/')

  const adminLink = page.getByRole('button', { name: /admin/i })
  await expect(adminLink).toBeVisible()
  await adminLink.click()

  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
  await expect(page.locator('.admin-subtitle', { hasText: 'Curriculum sets' })).toBeVisible()
})

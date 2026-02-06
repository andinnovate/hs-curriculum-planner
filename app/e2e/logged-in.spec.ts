import { expect, test } from '@playwright/test'
import { injectSupabaseSession } from './auth'

test('shows plan controls when logged in (mocked)', async ({ page }) => {
  await injectSupabaseSession(page, { email: 'planner@example.com' })
  await page.goto('/')

  await expect(page.getByText('planner@example.com')).toBeVisible()
  await expect(page.getByText(/Plan:/i)).toBeVisible()
  await expect(page.getByText(/Sync:/i)).toBeVisible()
})

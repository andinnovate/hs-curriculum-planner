import { expect, test } from '@playwright/test'

test('shows auth prompt and plan note when logged out', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  await expect(page.getByText('Sign in or Sign up to store and manage plans.')).toBeVisible()
})

import { expect, test } from '@playwright/test'

test('config panel persists changes across reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /show settings/i }).click()
  const hoursInput = page.getByLabel('Hours per credit')
  await hoursInput.fill('140')
  await expect(hoursInput).toHaveValue('140')

  await page.reload()

  await page.getByRole('button', { name: /show settings/i }).click()
  await expect(page.getByLabel('Hours per credit')).toHaveValue('140')
})

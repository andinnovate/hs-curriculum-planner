import { expect, test } from '@playwright/test'

test('assigns units via selection and supports lock/remove', async ({ page }) => {
  await page.goto('/')

  const firstUnit = page.locator('.unit-pool-list-item .unit-card-name').first()
  await expect(firstUnit).toBeVisible()
  const unitName = (await firstUnit.textContent())?.trim()
  expect(unitName).toBeTruthy()

  await page.getByLabel(/select units to assign together/i).click()
  await page.getByLabel(`Select ${unitName}`).click()
  await page.getByRole('button', { name: /Assign 1 units to Year 1/i }).click()

  const yearColumn = page.getByLabel('Year 1')
  await expect(yearColumn.getByText(unitName!)).toBeVisible()

  await page.getByRole('button', { name: /Lock year 1/i }).click()
  await expect(yearColumn.getByRole('button', { name: new RegExp(`Remove ${unitName}`, 'i') })).toHaveCount(0)

  await page.getByRole('button', { name: /Unlock year 1/i }).click()
  const removeButton = yearColumn.getByRole('button', { name: new RegExp(`Remove ${unitName}`, 'i') })
  await expect(removeButton).toBeVisible()
  await removeButton.click()

  await expect(yearColumn.getByText(unitName!)).toHaveCount(0)
  await expect(page.locator('.unit-pool-list-item .unit-card-name').filter({ hasText: unitName! })).toBeVisible()
})

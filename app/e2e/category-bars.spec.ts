import { expect, test, type Page } from '@playwright/test'

async function prepopulatePlan(page: Page) {
  await page.getByRole('button', { name: /import curriculum/i }).click()
  const importDialog = page.getByRole('dialog', { name: /import curriculum/i })
  await expect(importDialog).toBeVisible()
  await importDialog.getByRole('checkbox', { name: /Gather 'Round/i }).check()
  await importDialog.getByRole('button', { name: /import selected/i }).click()

  await page.getByRole('button', { name: /prepopulate/i }).click()
  await page.getByRole('button', { name: /yes, prepopulate/i }).click()
  await expect.poll(async () => page.locator('[aria-label="Year 1"] .unit-card').count()).toBeGreaterThan(0)
}

test('hovering total category bar highlights contributing units', async ({ page }) => {
  await page.goto('/')
  await prepopulatePlan(page)

  const totalSegment = page.locator('.tally-total-bar .category-bar-segment').first()
  await expect(totalSegment).toBeVisible()

  const highlighted = page.locator('.unit-card-highlighted')
  const filtered = page.locator('.unit-card-filtered')

  await expect(highlighted).toHaveCount(0)
  await expect(filtered).toHaveCount(0)

  await totalSegment.hover()

  await expect.poll(async () => highlighted.count()).toBeGreaterThan(0)
  await expect.poll(async () => filtered.count()).toBeGreaterThan(0)

  await page.mouse.move(0, 0)
  await expect.poll(async () => highlighted.count()).toBe(0)
})

test('hovering year category bar only affects that year', async ({ page }) => {
  await page.goto('/')
  await prepopulatePlan(page)

  const year1Bar = page.locator('.tally-year', { hasText: 'Year 1:' }).locator('.category-bar-segment').first()
  await expect(year1Bar).toBeVisible()

  const year1Highlighted = page.locator('[aria-label="Year 1"] .unit-card-highlighted')
  const year2Cards = page.locator('[aria-label="Year 2"] .unit-card')

  expect(await year2Cards.count()).toBeGreaterThan(0)

  await year1Bar.hover()

  await expect.poll(async () => year1Highlighted.count()).toBeGreaterThan(0)

  const year2Card = year2Cards.first()
  const year2Class = await year2Card.getAttribute('class')
  expect(year2Class ?? '').not.toContain('unit-card-filtered')
  expect(year2Class ?? '').not.toContain('unit-card-highlighted')
})

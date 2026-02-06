import { expect, test } from '@playwright/test'
import { injectSupabaseSession } from './auth'

test('rename and copy plan via header actions', async ({ page }) => {
  await injectSupabaseSession(page, { email: 'planner@example.com' })
  await page.goto('/')

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt')
    await dialog.accept('Renamed Plan')
  })
  await page.getByRole('button', { name: 'Rename' }).click()
  await expect(page.locator('.app-plan-name')).toHaveText('Renamed Plan')

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt')
    await dialog.accept('Copied Plan')
  })
  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.locator('.app-plan-name')).toHaveText('Copied Plan')

  const optionLabels = await page
    .getByRole('combobox', { name: /Change to:/i })
    .evaluate((select) => Array.from(select.options).map((opt) => opt.textContent ?? ''))
  expect(optionLabels).toEqual(expect.arrayContaining(['Copied Plan', 'Renamed Plan']))
})

test('compare plans shows assignment differences', async ({ page }) => {
  await injectSupabaseSession(page, { email: 'planner@example.com' })
  await page.addInitScript(() => {
    const now = new Date().toISOString()
    const planA = 'plan-a'
    const planB = 'plan-b'
    const list = {
      currentPlanId: planA,
      plans: [
        { id: planA, name: 'Plan A', updatedAt: now, lastSyncedAt: null },
        { id: planB, name: 'Plan B', updatedAt: now, lastSyncedAt: null },
      ],
    }
    localStorage.setItem('curric-planner-plans', JSON.stringify(list))
    localStorage.setItem(`curric-planner-plan-${planA}-assignments`, JSON.stringify({ Algebra: 1 }))
    localStorage.setItem(
      `curric-planner-plan-${planB}-assignments`,
      JSON.stringify({ Algebra: 2, Biology: 3 })
    )
  })

  await page.goto('/')

  await page.getByRole('combobox', { name: /Compare:/i }).selectOption({ label: 'Plan B' })
  await page.getByRole('button', { name: 'Compare' }).click()

  const dialog = page.getByRole('dialog', { name: /Compare/ })
  await expect(dialog.getByRole('heading', { name: 'Compare plans' })).toBeVisible()
  await expect(dialog.locator('.plan-compare-heading .plan-compare-name').nth(0)).toHaveText('Plan A')
  await expect(dialog.locator('.plan-compare-heading .plan-compare-name').nth(1)).toHaveText('Plan B')
  await expect(dialog.getByRole('cell', { name: 'Algebra' })).toBeVisible()
  await expect(dialog.getByRole('cell', { name: 'Biology' })).toBeVisible()
})

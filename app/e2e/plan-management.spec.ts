import { expect, test } from '@playwright/test'
import { injectSupabaseSession } from './auth'

test('rename and copy plan via manage plans actions', async ({ page }) => {
  await injectSupabaseSession(page, { email: 'planner@example.com' })
  await page.goto('/')

  await page.getByRole('button', { name: /manage plans/i }).click()
  const planRow = page.locator('.manage-plan-row').first()
  const planName = (await planRow.locator('.manage-plan-name').textContent())?.trim() ?? 'My Plan'

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt')
    await dialog.accept('Renamed Plan')
  })
  await planRow.getByRole('button', { name: new RegExp(`Plan actions for ${planName}`, 'i') }).click()
  await planRow.getByRole('menuitem', { name: 'Rename' }).click()
  await expect(planRow.locator('.manage-plan-name')).toHaveText('Renamed Plan')

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt')
    await dialog.accept('Copied Plan')
  })
  await planRow.getByRole('button', { name: /plan actions/i }).click()
  await planRow.getByRole('menuitem', { name: 'Copy' }).click()
  await expect(page.locator('.manage-plan-name')).toContainText(['Renamed Plan', 'Copied Plan'])
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

  await page.getByRole('button', { name: /manage plans/i }).click()
  const planRow = page.locator('.manage-plan-row').filter({ hasText: 'Plan A' })
  await planRow.getByRole('button', { name: /plan actions/i }).click()
  await planRow.getByRole('menuitem', { name: 'Compare' }).click()
  await planRow.getByRole('combobox').selectOption({ label: 'Plan B' })
  await planRow.getByRole('button', { name: 'Open compare' }).click()

  const dialog = page.getByRole('dialog', { name: /Compare/ })
  await expect(dialog.getByRole('heading', { name: 'Compare plans' })).toBeVisible()
  await expect(dialog.locator('.plan-compare-heading .plan-compare-name').nth(0)).toHaveText('Plan A')
  await expect(dialog.locator('.plan-compare-heading .plan-compare-name').nth(1)).toHaveText('Plan B')
  await expect(dialog.getByRole('cell', { name: 'Algebra' })).toBeVisible()
  await expect(dialog.getByRole('cell', { name: 'Biology' })).toBeVisible()
})

test('prevents deleting the last plan', async ({ page }) => {
  await injectSupabaseSession(page, { email: 'planner@example.com' })
  await page.addInitScript(() => {
    const now = new Date().toISOString()
    const list = {
      currentPlanId: 'solo-plan',
      plans: [{ id: 'solo-plan', name: 'Solo Plan', updatedAt: now, lastSyncedAt: null }],
    }
    localStorage.setItem('curric-planner-plans', JSON.stringify(list))
  })

  await page.goto('/')
  await page.getByRole('button', { name: /manage plans/i }).click()

  const planRow = page.locator('.manage-plan-row').first()
  await planRow.getByRole('button', { name: /plan actions/i }).click()
  const deleteButton = planRow.getByRole('menuitem', { name: 'Delete' })
  await expect(deleteButton).toBeDisabled()
  await expect(page.getByText('You must keep at least one plan.')).toBeVisible()
})

test('make current updates the active plan badge', async ({ page }) => {
  await injectSupabaseSession(page, { email: 'planner@example.com' })
  await page.addInitScript(() => {
    const now = new Date().toISOString()
    const list = {
      currentPlanId: 'plan-a',
      plans: [
        { id: 'plan-a', name: 'Plan A', updatedAt: now, lastSyncedAt: null },
        { id: 'plan-b', name: 'Plan B', updatedAt: now, lastSyncedAt: null },
      ],
    }
    localStorage.setItem('curric-planner-plans', JSON.stringify(list))
  })

  await page.goto('/')
  await page.getByRole('button', { name: /manage plans/i }).click()

  const planRow = page.locator('.manage-plan-row').filter({ hasText: 'Plan B' })
  await planRow.getByRole('button', { name: /make current/i }).click()
  await expect(planRow.getByText('Current')).toBeVisible()
  await expect(page.locator('.app-plan-name')).toHaveText('Plan B')
})

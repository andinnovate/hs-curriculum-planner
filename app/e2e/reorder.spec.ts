import { expect, test } from '@playwright/test'

test.describe('year column reorder', () => {
  test('dragging year column reassigns units between years', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /import curriculum/i }).click()
    const importDialog = page.getByRole('dialog', { name: /import curriculum/i })
    await expect(importDialog).toBeVisible()
    await importDialog.getByRole('checkbox', { name: /Gather 'Round/i }).check()
    await importDialog.getByRole('button', { name: /import selected/i }).click()

    const poolUnits = page.locator('.unit-pool-list-item .unit-card-name')
    await expect(poolUnits.first()).toBeVisible()
    const unitA = (await poolUnits.nth(0).textContent())?.trim()
    const unitB = (await poolUnits.nth(1).textContent())?.trim()
    expect(unitA).toBeTruthy()
    expect(unitB).toBeTruthy()
    expect(unitA).not.toBe(unitB)

    const year1 = page.locator('.year-column').filter({ has: page.getByRole('heading', { name: 'Year 1' }) })
    const year2 = page.locator('.year-column').filter({ has: page.getByRole('heading', { name: 'Year 2' }) })

    await page.getByLabel(/select units to assign together/i).click()
    await page.getByLabel(`Select ${unitA}`).click()
    await page.getByRole('button', { name: /Assign 1 units to Year 1/i }).click()
    await page.getByLabel(`Select ${unitB}`).click()
    await page.getByRole('button', { name: /Assign 1 units to Year 2/i }).click()

    await expect(year1.getByText(unitA!)).toBeVisible()
    await expect(year2.getByText(unitB!)).toBeVisible()

    const year1Handle = page.getByLabel('Drag to reorder year 1')
    await expect(year1Handle).toBeVisible()
    const targetColumn = year2.first()
    await targetColumn.scrollIntoViewIfNeeded()
    const box = await year1Handle.boundingBox()
    const targetBox = await targetColumn.boundingBox()
    expect(box).toBeTruthy()
    expect(targetBox).toBeTruthy()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect(year2.getByText(unitA!, { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(year1.getByText(unitB!, { exact: false })).toBeVisible()
    await expect(year1.getByText(unitA!, { exact: false })).toHaveCount(0)
    await expect(year2.getByText(unitB!, { exact: false })).toHaveCount(0)
  })

  test('year column drag handle is hidden when any year is locked', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /import curriculum/i }).click()
    const importDialog = page.getByRole('dialog', { name: /import curriculum/i })
    await expect(importDialog).toBeVisible()
    await importDialog.getByRole('checkbox', { name: /Gather 'Round/i }).check()
    await importDialog.getByRole('button', { name: /import selected/i }).click()

    await expect(page.getByLabel('Drag to reorder year 1')).toBeVisible()
    await page.getByRole('button', { name: /Lock year 2/i }).click()
    await expect(page.getByLabel('Drag to reorder year 1')).toHaveCount(0)
    await expect(page.getByLabel('Drag to reorder year 3')).toHaveCount(0)
  })
})

test.describe('unit reorder within year', () => {
  test('dragging unit handle reorders units within same year', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /import curriculum/i }).click()
    const importDialog = page.getByRole('dialog', { name: /import curriculum/i })
    await expect(importDialog).toBeVisible()
    await importDialog.getByRole('checkbox', { name: /Gather 'Round/i }).check()
    await importDialog.getByRole('button', { name: /import selected/i }).click()

    const poolUnits = page.locator('.unit-pool-list-item .unit-card-name')
    await expect(poolUnits.nth(1)).toBeVisible()
    const unitA = (await poolUnits.nth(0).textContent())?.trim()
    const unitB = (await poolUnits.nth(1).textContent())?.trim()
    expect(unitA).toBeTruthy()
    expect(unitB).toBeTruthy()

    await page.getByLabel(/select units to assign together/i).click()
    await page.getByLabel(`Select ${unitA}`).click()
    await page.getByRole('button', { name: /Assign 1 units to Year 1/i }).click()
    await page.getByLabel(`Select ${unitB}`).click()
    await page.getByRole('button', { name: /Assign 1 units to Year 1/i }).click()

    const year1 = page.locator('.year-column').filter({ has: page.getByRole('heading', { name: 'Year 1' }) })
    const items = year1.locator('.year-column-item')
    await expect(items).toHaveCount(2)
    const firstItem = items.first()
    const secondItem = items.last()
    await expect(firstItem.getByText(unitA!)).toBeVisible()
    await expect(secondItem.getByText(unitB!)).toBeVisible()

    const unitBHandle = year1.getByLabel(new RegExp(`Drag to reorder ${unitB!.trim().replace(/\s+/g, '\\s+')}`))
    await unitBHandle.scrollIntoViewIfNeeded()
    const handleBox = await unitBHandle.boundingBox()
    const firstBox = await firstItem.boundingBox()
    expect(handleBox).toBeTruthy()
    expect(firstBox).toBeTruthy()
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(firstBox!.x + firstBox!.width / 2, firstBox!.y + firstBox!.height / 2, { steps: 10 })
    await page.mouse.up()

    const itemsAfter = year1.locator('.year-column-item')
    await expect(itemsAfter.first().getByText(unitB!, { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(itemsAfter.last().getByText(unitA!, { exact: false })).toBeVisible()
  })

  test('unit drag handle is hidden when year is locked', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /import curriculum/i }).click()
    const importDialog = page.getByRole('dialog', { name: /import curriculum/i })
    await expect(importDialog).toBeVisible()
    await importDialog.getByRole('checkbox', { name: /Gather 'Round/i }).check()
    await importDialog.getByRole('button', { name: /import selected/i }).click()

    await page.getByLabel(/select units to assign together/i).click()
    const firstUnit = page.locator('.unit-pool-list-item .unit-card-name').first()
    await expect(firstUnit).toBeVisible()
    const unitName = (await firstUnit.textContent())?.trim()
    expect(unitName).toBeTruthy()
    await page.getByLabel(new RegExp(`Select ${unitName!.replace(/\s+/g, '\\s+')}`)).click()
    await page.getByRole('button', { name: /Assign 1 units to Year 1/i }).click()

    const year1 = page.locator('.year-column').filter({ has: page.getByRole('heading', { name: 'Year 1' }) })
    await expect(year1.getByLabel(new RegExp(`Drag to reorder ${unitName!.replace(/\s+/g, '\\s+')}`))).toBeVisible()
    await page.getByRole('button', { name: /Lock year 1/i }).click()
    await expect(year1.getByLabel(new RegExp(`Drag to reorder ${unitName!.replace(/\s+/g, '\\s+')}`))).toHaveCount(0)
  })
})

import { expect, test } from '@playwright/test'

test.describe('heatmap period selector', () => {
  test('switches between the past year and calendar years', async ({ page }) => {
    await page.goto('/students/241511002/')

    const select = page.locator('.period-select')
    const summary = page.locator('.heatmap-summary')

    await expect(select).toBeVisible()
    await expect(select).toHaveValue('last-12-months')

    // The relative timestamp only renders after hydration, so this also makes
    // sure the select handler is attached before interacting with it.
    await expect(page.locator('.updated-time')).toBeVisible()
    await expect(summary).toContainText('Submission in the past one year')
    await expect(page.locator('.heatmap-cell')).toHaveCount(364)

    await select.selectOption('2025')
    await expect(select).toHaveValue('2025')
    await expect(summary).toContainText('Submission in 2025')
    await expect(page.locator('.heatmap-cell')).toHaveCount(365)

    await select.selectOption('2026')
    await expect(summary).toContainText('Submission in 2026')
    await expect(page.locator('.heatmap-cell')).toHaveCount(365)

    await select.selectOption('2024')
    await expect(summary).toContainText('Submission in 2024')
    await expect(page.locator('.heatmap-cell')).toHaveCount(366)

    await select.selectOption('last-12-months')
    await expect(summary).toContainText('Submission in the past one year')
    await expect(page.locator('.heatmap-cell')).toHaveCount(364)
  })
})

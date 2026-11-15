import { expect, test } from '@playwright/test'

test.describe('sidebar navigation', () => {
  test('shows the sidebar with the main sections', async ({ page }) => {
    await page.goto('/')

    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.locator('[data-nav-link]')).toHaveText(['Beranda', 'Daftar Mahasiswa', 'Referensi Belajar', 'Platform Belajar'])
    await expect(sidebar.locator('[data-target="beranda"]')).toHaveAttribute('aria-current', 'true')
  })

  test('opens and closes the mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const toggle = page.locator('[data-sidebar-toggle]')
    const sidebar = page.locator('.sidebar')
    const root = page.locator('html')

    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(sidebar).not.toBeInViewport()

    await toggle.click()
    await expect(root).toHaveClass(/sidebar-open/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(sidebar).toBeInViewport()

    await page.keyboard.press('Escape')
    await expect(root).not.toHaveClass(/sidebar-open/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('marks the roster nav item active on a student page', async ({ page }) => {
    await page.goto('/students/241511002/')

    const rosterLink = page.locator('.sidebar [data-target="roster"]')
    await expect(rosterLink).toHaveAttribute('aria-current', 'true')
    await expect(page.locator('.sidebar [data-target="beranda"]')).not.toHaveAttribute('aria-current', 'true')
  })

  test('serves the learning pages as separate routes', async ({ page }) => {
    await page.goto('/learn/references')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Referensi Belajar')
    await expect(page.locator('.sidebar [data-target="references"]')).toHaveAttribute('aria-current', 'true')
    await expect(page.getByRole('link', { name: /CP-Algorithms/ })).toBeVisible()

    await page.goto('/learn/platforms')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Platform Belajar')
    await expect(page.locator('.sidebar [data-target="platforms"]')).toHaveAttribute('aria-current', 'true')
    await expect(page.getByRole('heading', { name: 'Dipantau' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rekomendasi lainnya' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Codeforces' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CSES Problem Set' })).toBeVisible()
  })

  test('lists the platform interface language instead of programming languages', async ({ page }) => {
    await page.goto('/learn/platforms')

    const cards = page.locator('.platform-card')
    await expect(cards.nth(0).locator('.platform-chip')).toHaveText(['Bahasa Indonesia'])
    await expect(cards.nth(1).locator('.platform-chip')).toHaveText(['English'])
    await expect(cards.nth(2).locator('.platform-chip')).toHaveText(['English'])
    await expect(cards.nth(5).locator('.platform-chip')).toHaveText(['Jepang', 'English'])
  })

  test('keeps the footer at the bottom of short pages', async ({ page }) => {
    await page.goto('/learn/references')

    const footer = page.locator('.site-footer')
    const box = await footer.boundingBox()
    const viewport = page.viewportSize()

    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(box!.y + box!.height).toBeGreaterThanOrEqual(viewport!.height - 2)
  })

  test('expands a platform accordion to reveal the details', async ({ page }) => {
    await page.goto('/learn/platforms')

    const details = page.locator('.platform-details').first()
    await expect(details).not.toHaveAttribute('open', '')
    await expect(details.getByRole('link', { name: 'Buka TLX' })).not.toBeVisible()

    await details.locator('summary').click()
    await expect(details).toHaveAttribute('open', '')
    await expect(details.getByRole('link', { name: 'Buka TLX' })).toBeVisible()
  })
})

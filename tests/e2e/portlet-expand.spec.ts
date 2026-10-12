import { test, expect } from '@playwright/test'
import { mockCubeApi } from './fixtures/api-mocks'

/**
 * Portlet Expand (features.portletExpand, on in the dev app).
 *
 * The dashboard is tall enough that the static edit bar scrolls out of view,
 * so the floating edit toolbar slides in. The built-in Expand modal must cover
 * that toolbar: a user must not be able to enter edit mode while a card is
 * expanded, because edit mode hides the Expand button on every card.
 */

const PORTLETS = Array.from({ length: 6 }, (_, index) => ({
  id: `orders-${index}`,
  title: `Orders by status ${index + 1}`,
  query: JSON.stringify({ measures: ['Orders.count'], dimensions: ['Orders.status'] }),
  chartType: 'bar',
  chartConfig: { xAxis: ['Orders.status'], yAxis: ['Orders.count'] },
  displayConfig: { showLegend: false },
  x: 0,
  y: index * 5,
  w: 12,
  h: 5
}))

const PAGE = {
  id: 1,
  name: 'Expand test dashboard',
  description: 'A tall dashboard for the Expand modal',
  organisationId: 1,
  config: { portlets: PORTLETS },
  order: 0,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

test.describe('Portlet Expand', () => {
  test.beforeEach(async ({ page }) => {
    await mockCubeApi(page)
    await page.route('**/api/analytics-pages/1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: PAGE })
      })
    )
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('the Expand modal covers the floating edit toolbar', async ({ page }) => {
    await page.goto('/dashboards/1')
    const lastCard = page.locator('[data-portlet-id="orders-5"]')
    await lastCard.scrollIntoViewIfNeeded()

    // The floating toolbar slides in once the static edit bar is out of view
    const floatingEditButton = page.getByRole('button', { name: 'Edit Dashboard', exact: true })
    const floatingToolbar = floatingEditButton.locator('xpath=..')
    await expect(floatingToolbar).toHaveCSS('opacity', '1')

    await lastCard.getByRole('button', { name: 'Expand' }).click()
    const dialog = page.getByRole('dialog', { name: 'Orders by status 6' })
    await expect(dialog).toBeVisible()

    // A click where the toolbar edit button is lands on the modal backdrop:
    // it closes the modal and does not enter edit mode
    const box = await floatingEditButton.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Finish Editing' })).toHaveCount(0)
    await expect(lastCard.getByRole('button', { name: 'Expand' })).toBeVisible()
  })
})

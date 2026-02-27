import { test, expect } from '@playwright/test'
import { mockAllApis } from './fixtures/api-mocks'

test.describe('Analysis Builder Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('shows Analysis Builder page heading', async ({ page }) => {
    await page.goto('/analysis-builder')
    await expect(page.getByRole('heading', { name: 'Analysis Builder' })).toBeVisible()
  })

  test('shows Experimental Component notice', async ({ page }) => {
    await page.goto('/analysis-builder')
    await expect(page.getByText('Experimental Component')).toBeVisible()
  })

  test('page description is visible', async ({ page }) => {
    await page.goto('/analysis-builder')
    await expect(page.getByText('A modern query builder with search-based field selection')).toBeVisible()
  })

  test('loads without React errors in the console', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    await page.goto('/analysis-builder')
    // Allow time for async component initialization and API mock responses
    await page.waitForLoadState('networkidle')
    // Filter out known browser noise unrelated to the app
    const appErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('net::ERR_')
    )
    expect(appErrors).toHaveLength(0)
  })
})

test.describe('Chart Type Selector', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('AnalysisBuilder mounts the chart type selector', async ({ page }) => {
    await page.goto('/analysis-builder')
    // Wait for the component to finish initialising (cube meta mock resolves quickly)
    await page.waitForLoadState('networkidle')
    // The ChartTypeSelector renders as a combobox-style button that shows the
    // currently selected chart type label derived from chartConfigRegistry.
    // Wait up to 10s for the control to appear.
    const selectorButton = page.locator('button').filter({ hasText: /chart|table|kpi/i }).first()
    await expect(selectorButton).toBeVisible({ timeout: 10_000 })
  })

  test('chart type dropdown lists multiple chart types when opened', async ({ page }) => {
    await page.goto('/analysis-builder')
    await page.waitForLoadState('networkidle')
    // Open the dropdown
    const selectorButton = page.locator('button').filter({ hasText: /chart|table|kpi/i }).first()
    await expect(selectorButton).toBeVisible({ timeout: 10_000 })
    await selectorButton.click()
    // The dropdown grid should show at least the core chart types from the registry
    await expect(page.locator('button', { hasText: 'Bar Chart' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Line Chart' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Pie Chart' })).toBeVisible()
  })

  test('can select a different chart type from the dropdown', async ({ page }) => {
    await page.goto('/analysis-builder')
    await page.waitForLoadState('networkidle')
    const selectorButton = page.locator('button').filter({ hasText: /chart|table|kpi/i }).first()
    await expect(selectorButton).toBeVisible({ timeout: 10_000 })
    await selectorButton.click()
    // Select "Line Chart" from the dropdown grid
    await page.locator('button', { hasText: 'Line Chart' }).click()
    // Dropdown closes and the selector button now reflects the new choice
    await expect(page.locator('button', { hasText: 'Line Chart' }).first()).toBeVisible()
  })
})

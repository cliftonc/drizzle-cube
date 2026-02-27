import { test, expect } from '@playwright/test'
import { mockCubeApi, mockDashboardsApi } from './fixtures/api-mocks'

const EXAMPLE_DASHBOARD = {
  id: 1,
  name: 'Sales Overview',
  description: 'Monthly sales metrics and KPIs',
  updatedAt: '2024-06-01T00:00:00.000Z',
  config: { portlets: [{}, {}] },
}

test.describe('Dashboard List — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await mockCubeApi(page)
    await mockDashboardsApi(page, [])
    await page.goto('/dashboards')
    await page.waitForLoadState('networkidle')
  })

  test('shows empty state heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No dashboards' })).toBeVisible()
    await expect(page.getByText('Get started by creating a new dashboard')).toBeVisible()
  })

  test('shows Create Example Dashboard and Create New Dashboard buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create Example Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create New Dashboard' })).toBeVisible()
  })

  test('shows page heading and header-area action buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Analytics Dashboards' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Example' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Dashboard' })).toBeVisible()
  })

  test('can open New Dashboard modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Dashboard' }).click()
    await expect(page.getByText('Create New Dashboard')).toBeVisible()
  })
})

test.describe('Dashboard List — with dashboards', () => {
  test.beforeEach(async ({ page }) => {
    await mockCubeApi(page)
    await mockDashboardsApi(page, [EXAMPLE_DASHBOARD])
    await page.goto('/dashboards')
    await page.waitForLoadState('networkidle')
  })

  test('renders dashboard card with name and description', async ({ page }) => {
    await expect(page.getByText('Sales Overview')).toBeVisible()
    await expect(page.getByText('Monthly sales metrics and KPIs')).toBeVisible()
  })

  test('shows portlet count on each dashboard card', async ({ page }) => {
    await expect(page.getByText('2 portlets')).toBeVisible()
  })

  test('shows View Dashboard link on each card', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'View Dashboard' })).toBeVisible()
  })

  test('View Dashboard link points to the correct URL', async ({ page }) => {
    const link = page.getByRole('link', { name: 'View Dashboard' })
    await expect(link).toHaveAttribute('href', '/dashboards/1')
  })

  test('no empty state shown when dashboards exist', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No dashboards' })).not.toBeVisible()
  })
})

test.describe('Dashboard List — multiple dashboards', () => {
  test('renders a card for each dashboard in the list', async ({ page }) => {
    await mockCubeApi(page)
    await mockDashboardsApi(page, [
      { id: 1, name: 'Dashboard Alpha', updatedAt: '2024-01-01T00:00:00Z', config: { portlets: [] } },
      { id: 2, name: 'Dashboard Beta', updatedAt: '2024-02-01T00:00:00Z', config: { portlets: [] } },
      { id: 3, name: 'Dashboard Gamma', updatedAt: '2024-03-01T00:00:00Z', config: { portlets: [] } },
    ])
    await page.goto('/dashboards')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Dashboard Alpha')).toBeVisible()
    await expect(page.getByText('Dashboard Beta')).toBeVisible()
    await expect(page.getByText('Dashboard Gamma')).toBeVisible()
    const viewLinks = page.getByRole('link', { name: 'View Dashboard' })
    await expect(viewLinks).toHaveCount(3)
  })
})

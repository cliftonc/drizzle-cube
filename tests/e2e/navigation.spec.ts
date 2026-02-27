import { test, expect } from '@playwright/test'
import { mockAllApis } from './fixtures/api-mocks'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('home page loads with logo and navigation links', async ({ page }) => {
    await page.goto('/')
    // Logo / brand name appears in the nav
    await expect(page.getByText('Drizzle Cube').first()).toBeVisible()
    // All four nav links are present on desktop
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboards' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Analysis Builder' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Notebooks' }).first()).toBeVisible()
  })

  test('clicking Dashboards link navigates to /dashboards', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Dashboards' }).first().click()
    await expect(page).toHaveURL('/dashboards')
    await expect(page.getByRole('heading', { name: 'Analytics Dashboards' })).toBeVisible()
  })

  test('clicking Analysis Builder link navigates to /analysis-builder', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Analysis Builder' }).first().click()
    await expect(page).toHaveURL('/analysis-builder')
    await expect(page.getByRole('heading', { name: 'Analysis Builder' })).toBeVisible()
  })

  test('clicking Notebooks link navigates to /notebooks', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Notebooks' }).first().click()
    await expect(page).toHaveURL('/notebooks')
  })

  test('direct navigation to /dashboards works', async ({ page }) => {
    await page.goto('/dashboards')
    await expect(page.getByRole('heading', { name: 'Analytics Dashboards' })).toBeVisible()
  })

  test('direct navigation to /analysis-builder works', async ({ page }) => {
    await page.goto('/analysis-builder')
    await expect(page.getByRole('heading', { name: 'Analysis Builder' })).toBeVisible()
  })

  test('logo link navigates back to home page', async ({ page }) => {
    await page.goto('/dashboards')
    // Click the Drizzle Cube logo link
    await page.getByRole('link', { name: 'Drizzle Cube' }).click()
    await expect(page).toHaveURL('/')
  })
})

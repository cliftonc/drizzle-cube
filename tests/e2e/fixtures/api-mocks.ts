import type { Page } from '@playwright/test'

/**
 * Minimal Cube.js-compatible /meta response.
 * Provides an "Orders" cube with two measures and two dimensions so that
 * the AnalysisBuilder field picker can render without errors.
 */
export const MOCK_META = {
  cubes: [
    {
      name: 'Orders',
      title: 'Orders',
      measures: [
        {
          name: 'Orders.count',
          title: 'Count',
          shortTitle: 'Count',
          type: 'number',
          aggType: 'count',
          drillMembers: [],
          drillMembersGrouped: { measures: [], dimensions: [] },
        },
        {
          name: 'Orders.revenue',
          title: 'Revenue',
          shortTitle: 'Revenue',
          type: 'number',
          aggType: 'sum',
          drillMembers: [],
          drillMembersGrouped: { measures: [], dimensions: [] },
        },
      ],
      dimensions: [
        {
          name: 'Orders.status',
          title: 'Status',
          shortTitle: 'Status',
          type: 'string',
          suggestFilterValues: true,
        },
        {
          name: 'Orders.createdAt',
          title: 'Created At',
          shortTitle: 'Created At',
          type: 'time',
          suggestFilterValues: false,
        },
      ],
      segments: [],
      joins: [],
    },
  ],
}

/**
 * Minimal Cube.js-compatible /load response with two rows of order data.
 */
export const MOCK_LOAD_RESPONSE = {
  query: {},
  data: [
    { 'Orders.status': 'completed', 'Orders.count': '42', 'Orders.revenue': '18500' },
    { 'Orders.status': 'pending',   'Orders.count': '13', 'Orders.revenue':  '5200' },
    { 'Orders.status': 'cancelled', 'Orders.count':  '7', 'Orders.revenue':  '2100' },
  ],
  lastRefreshTime: '2024-01-01T00:00:00.000Z',
  annotation: {
    measures: {
      'Orders.count':   { title: 'Count',   shortTitle: 'Count',   type: 'number' },
      'Orders.revenue': { title: 'Revenue', shortTitle: 'Revenue', type: 'number' },
    },
    dimensions: {
      'Orders.status': { title: 'Status', shortTitle: 'Status', type: 'string' },
    },
    segments: {},
    timeDimensions: {},
  },
  dataSource: 'default',
  dbType: 'postgres',
  external: false,
}

/**
 * Intercept all Cube.js API requests on `page` with mock responses.
 * Call before navigating so the routes are registered in time.
 */
export async function mockCubeApi(page: Page): Promise<void> {
  await page.route('**/cubejs-api/v1/meta', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_META),
    })
  )

  await page.route('**/cubejs-api/v1/load', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LOAD_RESPONSE),
    })
  )

  // Dry-run (SQL preview) endpoint
  await page.route('**/cubejs-api/v1/sql', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sql: { sql: ['SELECT 1', []] } }),
    })
  )
}

/**
 * Intercept the REST dashboards API.
 * GET returns `dashboards` (default: empty array).
 * POST/DELETE/PATCH are continued to avoid errors if called.
 */
export async function mockDashboardsApi(
  page: Page,
  dashboards: unknown[] = []
): Promise<void> {
  await page.route('**/api/v1/dashboards', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dashboards),
      })
    }
    return route.continue()
  })

  // Wildcard for /api/v1/dashboards/:id
  await page.route('**/api/v1/dashboards/**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      })
    }
    return route.continue()
  })
}

/**
 * Sets up all standard API mocks. Convenience wrapper for tests that
 * don't need fine-grained control.
 */
export async function mockAllApis(page: Page): Promise<void> {
  await mockCubeApi(page)
  await mockDashboardsApi(page)
}

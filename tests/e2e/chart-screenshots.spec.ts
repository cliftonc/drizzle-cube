import { test, expect, type Page } from '@playwright/test'
import { mockDashboardsApi } from './fixtures/api-mocks'

/**
 * Rich mock metadata with enough measures and dimensions
 * to populate all 5 new chart types (boxPlot, waterfall,
 * candlestick, measureProfile, gauge).
 */
const RICH_META = {
  cubes: [
    {
      name: 'Trades',
      title: 'Trades',
      measures: [
        { name: 'Trades.count', title: 'Count', shortTitle: 'Count', type: 'number', aggType: 'count', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.totalPnl', title: 'Total P&L', shortTitle: 'Total P&L', type: 'number', aggType: 'sum', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.avgPnl', title: 'Avg P&L', shortTitle: 'Avg P&L', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.minPnl', title: 'Min P&L', shortTitle: 'Min P&L', type: 'number', aggType: 'min', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.maxPnl', title: 'Max P&L', shortTitle: 'Max P&L', type: 'number', aggType: 'max', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.medianPnl', title: 'Median P&L', shortTitle: 'Median P&L', type: 'number', aggType: 'number', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.stddevPnl', title: 'StdDev P&L', shortTitle: 'StdDev P&L', type: 'number', aggType: 'number', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.open', title: 'Open', shortTitle: 'Open', type: 'number', aggType: 'number', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.close', title: 'Close', shortTitle: 'Close', type: 'number', aggType: 'number', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.high', title: 'High', shortTitle: 'High', type: 'number', aggType: 'number', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.low', title: 'Low', shortTitle: 'Low', type: 'number', aggType: 'number', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.revenue', title: 'Revenue', shortTitle: 'Revenue', type: 'number', aggType: 'sum', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.margin', title: 'Margin', shortTitle: 'Margin', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        // Measure Profile measures (markout intervals)
        { name: 'Trades.avgMinus2m', title: 'Avg -2m', shortTitle: 'Avg -2m', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.avgMinus1m', title: 'Avg -1m', shortTitle: 'Avg -1m', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.avgAtEvent', title: 'Avg at Event', shortTitle: 'At Event', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.avgPlus1m', title: 'Avg +1m', shortTitle: 'Avg +1m', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.avgPlus2m', title: 'Avg +2m', shortTitle: 'Avg +2m', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
        { name: 'Trades.avgPlus5m', title: 'Avg +5m', shortTitle: 'Avg +5m', type: 'number', aggType: 'avg', drillMembers: [], drillMembersGrouped: { measures: [], dimensions: [] } },
      ],
      dimensions: [
        { name: 'Trades.symbol', title: 'Symbol', shortTitle: 'Symbol', type: 'string', suggestFilterValues: true },
        { name: 'Trades.platform', title: 'Platform', shortTitle: 'Platform', type: 'string', suggestFilterValues: true },
        { name: 'Trades.tradeDate', title: 'Trade Date', shortTitle: 'Trade Date', type: 'time', suggestFilterValues: false },
      ],
      segments: [],
      joins: [],
    },
  ],
}

// ── Mock response factories ──

function makeMockLoadResponse(data: Record<string, unknown>[], annotation: Record<string, unknown>) {
  return {
    query: {},
    data,
    lastRefreshTime: '2025-01-01T00:00:00.000Z',
    annotation: {
      measures: {},
      dimensions: {},
      segments: {},
      timeDimensions: {},
      ...annotation,
    },
    dataSource: 'default',
    dbType: 'postgres',
    external: false,
  }
}

// Box Plot: multiple categories with spread values
const BOX_PLOT_DATA = [
  { 'Trades.symbol': 'AAPL', 'Trades.avgPnl': '1250', 'Trades.stddevPnl': '400', 'Trades.medianPnl': '1180' },
  { 'Trades.symbol': 'MSFT', 'Trades.avgPnl': '890', 'Trades.stddevPnl': '310', 'Trades.medianPnl': '920' },
  { 'Trades.symbol': 'GOOG', 'Trades.avgPnl': '1580', 'Trades.stddevPnl': '550', 'Trades.medianPnl': '1490' },
  { 'Trades.symbol': 'AMZN', 'Trades.avgPnl': '-320', 'Trades.stddevPnl': '680', 'Trades.medianPnl': '-180' },
  { 'Trades.symbol': 'TSLA', 'Trades.avgPnl': '2100', 'Trades.stddevPnl': '920', 'Trades.medianPnl': '1850' },
]

// Waterfall: sequential P&L contributions (positive and negative)
const WATERFALL_DATA = [
  { 'Trades.symbol': 'AAPL', 'Trades.totalPnl': '4500' },
  { 'Trades.symbol': 'MSFT', 'Trades.totalPnl': '2800' },
  { 'Trades.symbol': 'GOOG', 'Trades.totalPnl': '-1200' },
  { 'Trades.symbol': 'AMZN', 'Trades.totalPnl': '3100' },
  { 'Trades.symbol': 'TSLA', 'Trades.totalPnl': '-800' },
  { 'Trades.symbol': 'META', 'Trades.totalPnl': '1900' },
  { 'Trades.symbol': 'NVDA', 'Trades.totalPnl': '-2500' },
]

// Candlestick: OHLC data across dates
const CANDLESTICK_DATA = [
  { 'Trades.tradeDate': '2025-01-06', 'Trades.open': '182.5', 'Trades.close': '187.2', 'Trades.high': '189.0', 'Trades.low': '181.0' },
  { 'Trades.tradeDate': '2025-01-07', 'Trades.open': '187.2', 'Trades.close': '184.8', 'Trades.high': '188.5', 'Trades.low': '183.2' },
  { 'Trades.tradeDate': '2025-01-08', 'Trades.open': '184.8', 'Trades.close': '190.1', 'Trades.high': '191.3', 'Trades.low': '184.0' },
  { 'Trades.tradeDate': '2025-01-09', 'Trades.open': '190.1', 'Trades.close': '188.4', 'Trades.high': '192.0', 'Trades.low': '187.5' },
  { 'Trades.tradeDate': '2025-01-10', 'Trades.open': '188.4', 'Trades.close': '193.7', 'Trades.high': '194.2', 'Trades.low': '187.8' },
  { 'Trades.tradeDate': '2025-01-13', 'Trades.open': '193.7', 'Trades.close': '191.0', 'Trades.high': '195.1', 'Trades.low': '190.2' },
  { 'Trades.tradeDate': '2025-01-14', 'Trades.open': '191.0', 'Trades.close': '196.3', 'Trades.high': '197.0', 'Trades.low': '190.5' },
  { 'Trades.tradeDate': '2025-01-15', 'Trades.open': '196.3', 'Trades.close': '194.8', 'Trades.high': '198.2', 'Trades.low': '193.1' },
]

// Measure Profile: markout interval data (per-platform series)
const MEASURE_PROFILE_DATA = [
  { 'Trades.platform': 'NYSE', 'Trades.avgMinus2m': '-0.12', 'Trades.avgMinus1m': '-0.05', 'Trades.avgAtEvent': '0', 'Trades.avgPlus1m': '0.08', 'Trades.avgPlus2m': '0.15', 'Trades.avgPlus5m': '0.22' },
  { 'Trades.platform': 'NASDAQ', 'Trades.avgMinus2m': '-0.18', 'Trades.avgMinus1m': '-0.09', 'Trades.avgAtEvent': '0', 'Trades.avgPlus1m': '0.14', 'Trades.avgPlus2m': '0.28', 'Trades.avgPlus5m': '0.41' },
  { 'Trades.platform': 'LSE', 'Trades.avgMinus2m': '-0.06', 'Trades.avgMinus1m': '-0.02', 'Trades.avgAtEvent': '0', 'Trades.avgPlus1m': '0.03', 'Trades.avgPlus2m': '0.05', 'Trades.avgPlus5m': '0.07' },
]

// Gauge: single value out of a max
const GAUGE_DATA = [
  { 'Trades.margin': '0.73', 'Trades.revenue': '185000' },
]

// Donut: category breakdown (same shape as pie)
const DONUT_DATA = [
  { 'Trades.symbol': 'AAPL', 'Trades.count': '42' },
  { 'Trades.symbol': 'MSFT', 'Trades.count': '18' },
  { 'Trades.symbol': 'GOOG', 'Trades.count': '12' },
  { 'Trades.symbol': 'AMZN', 'Trades.count': '9' },
  { 'Trades.symbol': 'TSLA', 'Trades.count': '15' },
  { 'Trades.symbol': 'META', 'Trades.count': '8' },
]

// ── Mock annotations for each chart type ──

const BOX_PLOT_ANNOTATION = {
  measures: {
    'Trades.avgPnl': { title: 'Avg P&L', shortTitle: 'Avg P&L', type: 'number' },
    'Trades.stddevPnl': { title: 'StdDev P&L', shortTitle: 'StdDev P&L', type: 'number' },
    'Trades.medianPnl': { title: 'Median P&L', shortTitle: 'Median P&L', type: 'number' },
  },
  dimensions: {
    'Trades.symbol': { title: 'Symbol', shortTitle: 'Symbol', type: 'string' },
  },
}

const WATERFALL_ANNOTATION = {
  measures: {
    'Trades.totalPnl': { title: 'Total P&L', shortTitle: 'Total P&L', type: 'number' },
  },
  dimensions: {
    'Trades.symbol': { title: 'Symbol', shortTitle: 'Symbol', type: 'string' },
  },
}

const CANDLESTICK_ANNOTATION = {
  measures: {
    'Trades.open': { title: 'Open', shortTitle: 'Open', type: 'number' },
    'Trades.close': { title: 'Close', shortTitle: 'Close', type: 'number' },
    'Trades.high': { title: 'High', shortTitle: 'High', type: 'number' },
    'Trades.low': { title: 'Low', shortTitle: 'Low', type: 'number' },
  },
  dimensions: {},
  timeDimensions: {
    'Trades.tradeDate': { title: 'Trade Date', shortTitle: 'Trade Date', type: 'time' },
  },
}

const MEASURE_PROFILE_ANNOTATION = {
  measures: {
    'Trades.avgMinus2m': { title: 'Avg -2m', shortTitle: 'Avg -2m', type: 'number' },
    'Trades.avgMinus1m': { title: 'Avg -1m', shortTitle: 'Avg -1m', type: 'number' },
    'Trades.avgAtEvent': { title: 'Avg at Event', shortTitle: 'At Event', type: 'number' },
    'Trades.avgPlus1m': { title: 'Avg +1m', shortTitle: 'Avg +1m', type: 'number' },
    'Trades.avgPlus2m': { title: 'Avg +2m', shortTitle: 'Avg +2m', type: 'number' },
    'Trades.avgPlus5m': { title: 'Avg +5m', shortTitle: 'Avg +5m', type: 'number' },
  },
  dimensions: {
    'Trades.platform': { title: 'Platform', shortTitle: 'Platform', type: 'string' },
  },
}

const GAUGE_ANNOTATION = {
  measures: {
    'Trades.margin': { title: 'Margin', shortTitle: 'Margin', type: 'number' },
    'Trades.revenue': { title: 'Revenue', shortTitle: 'Revenue', type: 'number' },
  },
  dimensions: {},
}

const DONUT_ANNOTATION = {
  measures: {
    'Trades.count': { title: 'Count', shortTitle: 'Count', type: 'number' },
  },
  dimensions: {
    'Trades.symbol': { title: 'Symbol', shortTitle: 'Symbol', type: 'string' },
  },
}

// ── localStorage state factories ──

/**
 * Build an AnalysisWorkspace that the zustand persist middleware recognises.
 * Zustand persist wraps as { state: <workspace>, version: 0 }.
 */
function makeWorkspaceStorage(overrides: {
  measures: string[]
  dimensions?: string[]
  timeDimensions?: Array<{ dimension: string; granularity: string }>
  chartType: string
  chartConfig: Record<string, unknown>
  displayConfig?: Record<string, unknown>
}) {
  const query: Record<string, unknown> = {
    measures: overrides.measures,
    dimensions: overrides.dimensions ?? [],
  }
  if (overrides.timeDimensions?.length) {
    query.timeDimensions = overrides.timeDimensions
  }

  const workspace = {
    version: 1,
    activeType: 'query',
    modes: {
      query: {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {
          query: {
            chartType: overrides.chartType,
            chartConfig: overrides.chartConfig,
            displayConfig: overrides.displayConfig ?? {},
          },
        },
        query,
      },
    },
  }

  // Zustand persist envelope
  return { state: workspace, version: 0 }
}

const STORAGE_KEY = 'drizzle-cube-analysis-builder-v3'

// ── Chart-specific localStorage configurations ──

const CHART_CONFIGS = {
  boxPlot: makeWorkspaceStorage({
    measures: ['Trades.avgPnl', 'Trades.stddevPnl', 'Trades.medianPnl'],
    dimensions: ['Trades.symbol'],
    chartType: 'boxPlot',
    chartConfig: {
      xAxis: ['Trades.symbol'],
      yAxis: ['Trades.avgPnl', 'Trades.stddevPnl', 'Trades.medianPnl'],
    },
  }),
  waterfall: makeWorkspaceStorage({
    measures: ['Trades.totalPnl'],
    dimensions: ['Trades.symbol'],
    chartType: 'waterfall',
    chartConfig: {
      xAxis: ['Trades.symbol'],
      yAxis: ['Trades.totalPnl'],
    },
    displayConfig: {
      showTotal: true,
      showConnectorLine: true,
      showDataLabels: true,
    },
  }),
  candlestick: makeWorkspaceStorage({
    measures: ['Trades.open', 'Trades.close', 'Trades.high', 'Trades.low'],
    timeDimensions: [{ dimension: 'Trades.tradeDate', granularity: 'day' }],
    chartType: 'candlestick',
    chartConfig: {
      xAxis: ['Trades.tradeDate'],
      yAxis: ['Trades.open', 'Trades.close', 'Trades.high', 'Trades.low'],
    },
  }),
  measureProfile: makeWorkspaceStorage({
    measures: ['Trades.avgMinus2m', 'Trades.avgMinus1m', 'Trades.avgAtEvent', 'Trades.avgPlus1m', 'Trades.avgPlus2m', 'Trades.avgPlus5m'],
    dimensions: ['Trades.platform'],
    chartType: 'measureProfile',
    chartConfig: {
      yAxis: ['Trades.avgMinus2m', 'Trades.avgMinus1m', 'Trades.avgAtEvent', 'Trades.avgPlus1m', 'Trades.avgPlus2m', 'Trades.avgPlus5m'],
      series: ['Trades.platform'],
    },
    displayConfig: {
      showReferenceLineAtZero: true,
      showLegend: true,
      showDataLabels: true,
      lineType: 'monotone',
    },
  }),
  gauge: makeWorkspaceStorage({
    measures: ['Trades.margin', 'Trades.revenue'],
    chartType: 'gauge',
    chartConfig: {
      yAxis: ['Trades.margin'],
    },
    displayConfig: {
      minValue: 0,
      maxValue: 1,
      showCenterLabel: true,
      showPercentage: true,
    },
  }),
  donut: makeWorkspaceStorage({
    measures: ['Trades.count'],
    dimensions: ['Trades.symbol'],
    chartType: 'donut',
    chartConfig: {
      xAxis: ['Trades.symbol'],
      yAxis: ['Trades.count'],
    },
    displayConfig: {
      showLegend: true,
      showTooltip: true,
    },
  }),
}

// Map chart type → mock data + annotation
const MOCK_DATA_MAP: Record<string, { data: Record<string, unknown>[]; annotation: Record<string, unknown> }> = {
  boxPlot: { data: BOX_PLOT_DATA, annotation: BOX_PLOT_ANNOTATION },
  waterfall: { data: WATERFALL_DATA, annotation: WATERFALL_ANNOTATION },
  candlestick: { data: CANDLESTICK_DATA, annotation: CANDLESTICK_ANNOTATION },
  measureProfile: { data: MEASURE_PROFILE_DATA, annotation: MEASURE_PROFILE_ANNOTATION },
  gauge: { data: GAUGE_DATA, annotation: GAUGE_ANNOTATION },
  donut: { data: DONUT_DATA, annotation: DONUT_ANNOTATION },
}

// ── Helpers ──

async function setupMocks(page: Page, chartKey: string) {
  const { data, annotation } = MOCK_DATA_MAP[chartKey]
  const loadResponse = makeMockLoadResponse(data, annotation)

  await page.route('**/cubejs-api/v1/meta', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RICH_META),
    })
  )

  await page.route('**/cubejs-api/v1/load', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(loadResponse),
    })
  )

  // The AnalysisBuilder uses batch loading — intercept the batch endpoint
  await page.route('**/cubejs-api/v1/batch', async (route) => {
    const body = route.request().postDataJSON()
    const queryCount = body?.queries?.length ?? 1
    // Return the same response for each query in the batch
    const results = Array.from({ length: queryCount }, () => ({
      ...loadResponse,
      success: true,
    }))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results }),
    })
  })

  await page.route('**/cubejs-api/v1/sql', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sql: { sql: ['SELECT 1', []] } }),
    })
  )

  await mockDashboardsApi(page)
}

async function seedLocalStorage(page: Page, chartKey: string) {
  const state = CHART_CONFIGS[chartKey as keyof typeof CHART_CONFIGS]
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value)
    },
    { key: STORAGE_KEY, value: JSON.stringify(state) }
  )
}

async function waitForChartRender(page: Page) {
  // Wait for the loading spinner to disappear, indicating data has loaded.
  // The AnalysisBuilder shows "Executing Query..." while loading.
  await page.waitForLoadState('networkidle')

  // Wait for loading state to clear — either chart renders or "no data" appears
  await page.locator('text=Executing Query').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {
    // If it was never visible, that's fine — data loaded quickly
  })

  // Give charts a moment to finish rendering (SVG/canvas animations)
  await page.waitForTimeout(1000)
}

async function clickTab(page: Page, tabName: string) {
  // Use title attributes to target right-panel tabs specifically,
  // avoiding the Chart/Table toggle at the bottom of the results panel.
  const titleMap: Record<string, string> = {
    Chart: 'Chart configuration',
    Display: 'Display options',
  }
  const title = titleMap[tabName]
  if (title) {
    await page.locator(`button[title="${title}"]`).click()
  } else {
    await page.locator('button').filter({ hasText: new RegExp(`^${tabName}$`, 'i') }).first().click()
  }
  await page.waitForTimeout(300)
}

// ── Test Suite ──

const CHART_TYPES = ['boxPlot', 'waterfall', 'candlestick', 'measureProfile', 'gauge', 'donut'] as const

const CHART_LABELS: Record<string, string> = {
  boxPlot: 'Box Plot',
  waterfall: 'Waterfall Chart',
  candlestick: 'Candlestick Chart',
  measureProfile: 'Measure Profile',
  gauge: 'Gauge Chart',
  donut: 'Donut Chart',
}

test.describe('Chart Type Screenshots', () => {
  for (const chartKey of CHART_TYPES) {
    test.describe(CHART_LABELS[chartKey], () => {
      test.beforeEach(async ({ page }) => {
        await setupMocks(page, chartKey)
        await seedLocalStorage(page, chartKey)
      })

      test(`renders ${CHART_LABELS[chartKey]} with data`, async ({ page }) => {
        await page.goto('/analysis-builder')
        await waitForChartRender(page)

        // Verify the chart view is active (seeded via localStorage)
        await expect(page.getByRole('heading', { name: 'Analysis Builder' })).toBeVisible()

        // Take full-page screenshot showing the chart
        await page.screenshot({
          path: `screenshots/${chartKey}-chart.png`,
          fullPage: false,
        })
      })

      test(`shows ${CHART_LABELS[chartKey]} Chart config panel`, async ({ page }) => {
        await page.goto('/analysis-builder')
        await waitForChartRender(page)

        // Click the "Chart" tab in the query panel
        await clickTab(page, 'Chart')

        // Wait for the chart config panel to render
        await page.waitForTimeout(500)

        // Take screenshot showing chart + chart config panel
        await page.screenshot({
          path: `screenshots/${chartKey}-chart-config.png`,
          fullPage: false,
        })
      })

      test(`shows ${CHART_LABELS[chartKey]} Display config panel`, async ({ page }) => {
        await page.goto('/analysis-builder')
        await waitForChartRender(page)

        // Click the "Display" tab in the query panel
        await clickTab(page, 'Display')

        // Wait for the display config panel to render
        await page.waitForTimeout(500)

        // Take screenshot showing chart + display config panel
        await page.screenshot({
          path: `screenshots/${chartKey}-display-config.png`,
          fullPage: false,
        })
      })
    })
  }
})

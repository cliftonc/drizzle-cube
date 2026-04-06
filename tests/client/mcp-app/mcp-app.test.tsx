import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockApp: {
  callServerTool: ReturnType<typeof vi.fn>
  ontoolinput?: (params: any) => void
  ontoolresult?: (result: any) => void
  onhostcontextchanged?: (context: any) => void
} = {
  callServerTool: vi.fn(),
}

function createChartMock(testId: string) {
  return function MockChart(props: any) {
    return (
      <div
        data-testid={testId}
        data-chart-config={JSON.stringify(props.chartConfig ?? null)}
        data-display-config={JSON.stringify(props.displayConfig ?? null)}
      />
    )
  }
}

vi.mock('@modelcontextprotocol/ext-apps/react', () => ({
  useApp: ({ onAppCreated }: { onAppCreated?: (app: typeof mockApp) => void }) => {
    React.useEffect(() => {
      onAppCreated?.(mockApp)
    }, [onAppCreated])

    return {
      app: mockApp,
      isConnected: true,
      error: null,
    }
  },
}))

vi.mock('../../../src/mcp-app/McpChartSwitcher', () => ({
  default: ({ onSelect }: { onSelect: (chartType: string) => void }) => (
    <div>
      <button type="button" onClick={() => onSelect('bar')}>switch-bar</button>
      <button type="button" onClick={() => onSelect('table')}>switch-table</button>
    </div>
  ),
}))

vi.mock('../../../src/mcp-app/theme-bridge', () => ({
  applyHostContext: vi.fn(),
  applyFallbackTheme: vi.fn(),
}))

vi.mock('../../../src/client/components/charts/BarChart', () => ({ default: createChartMock('bar-chart') }))
vi.mock('../../../src/client/components/charts/LineChart', () => ({ default: createChartMock('line-chart') }))
vi.mock('../../../src/client/components/charts/AreaChart', () => ({ default: createChartMock('area-chart') }))
vi.mock('../../../src/client/components/charts/PieChart', () => ({ default: createChartMock('pie-chart') }))
vi.mock('../../../src/client/components/charts/ScatterChart', () => ({ default: createChartMock('scatter-chart') }))
vi.mock('../../../src/client/components/charts/TreeMapChart', () => ({ default: createChartMock('treemap-chart') }))
vi.mock('../../../src/client/components/charts/KpiNumber', () => ({ default: createChartMock('kpi-number-chart') }))
vi.mock('../../../src/client/components/charts/KpiDelta', () => ({ default: createChartMock('kpi-delta-chart') }))
vi.mock('../../../src/client/components/charts/KpiText', () => ({ default: createChartMock('kpi-text-chart') }))
vi.mock('../../../src/client/components/charts/DataTable', () => ({ default: createChartMock('data-table-chart') }))
vi.mock('../../../src/client/components/charts/RadarChart', () => ({ default: createChartMock('radar-chart') }))
vi.mock('../../../src/client/components/charts/RadialBarChart', () => ({ default: createChartMock('radial-bar-chart') }))
vi.mock('../../../src/client/components/charts/BubbleChart', () => ({ default: createChartMock('bubble-chart') }))
vi.mock('../../../src/client/components/charts/FunnelChart', () => ({ default: createChartMock('funnel-chart') }))
vi.mock('../../../src/client/components/charts/WaterfallChart', () => ({ default: createChartMock('waterfall-chart') }))
vi.mock('../../../src/client/components/charts/GaugeChart', () => ({ default: createChartMock('gauge-chart') }))
vi.mock('../../../src/client/components/charts/BoxPlotChart', () => ({ default: createChartMock('box-plot-chart') }))
vi.mock('../../../src/client/components/charts/CandlestickChart', () => ({ default: createChartMock('candlestick-chart') }))
vi.mock('../../../src/client/components/charts/ActivityGridChart', () => ({ default: createChartMock('activity-grid-chart') }))
vi.mock('../../../src/client/components/charts/MeasureProfileChart', () => ({ default: createChartMock('measure-profile-chart') }))

import { McpApp } from '../../../src/mcp-app/mcp-app'

function readChartConfig(testId: string) {
  const element = screen.getByTestId(testId)
  return JSON.parse(element.getAttribute('data-chart-config') || 'null')
}

describe('McpApp chart switching', () => {
  beforeEach(() => {
    mockApp.callServerTool.mockReset()
    mockApp.ontoolinput = undefined
    mockApp.ontoolresult = undefined
    mockApp.onhostcontextchanged = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('recomputes a complete table config after a manual chart-type switch', async () => {
    render(<McpApp />)

    await waitFor(() => {
      expect(mockApp.ontoolinput).toBeTypeOf('function')
    })

    await act(async () => {
      mockApp.ontoolinput?.({
        structuredContent: {
          data: [
            {
              'Orders.status': 'paid',
              'Orders.region': 'emea',
              'Orders.count': 12,
              'Orders.revenue': 1500,
              'Orders.channel': 'web',
            },
          ],
          query: {
            dimensions: ['Orders.status', 'Orders.region'],
            measures: ['Orders.count', 'Orders.revenue'],
          },
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    expect(readChartConfig('bar-chart')).toEqual({
      xAxis: ['Orders.status'],
      yAxis: ['Orders.count', 'Orders.revenue'],
      series: ['Orders.region'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'switch-table' }))

    await waitFor(() => {
      expect(screen.getByTestId('data-table-chart')).toBeInTheDocument()
    })

    expect(readChartConfig('data-table-chart')).toEqual({
      xAxis: ['Orders.status', 'Orders.region', 'Orders.count', 'Orders.revenue', 'Orders.channel'],
      yAxis: [],
      series: [],
    })
  })

  it('does not let stale AI hint axes override a manual switch to table', async () => {
    render(<McpApp />)

    await waitFor(() => {
      expect(mockApp.ontoolinput).toBeTypeOf('function')
    })

    await act(async () => {
      mockApp.ontoolinput?.({
        arguments: {
          chart: {
            type: 'bar',
            title: 'Orders overview',
            chartConfig: {
              xAxis: ['Orders.status'],
              yAxis: ['Orders.count'],
              series: ['Orders.region'],
            },
          },
        },
        structuredContent: {
          data: [
            {
              'Orders.status': 'paid',
              'Orders.createdAt': '2026-04-01',
              'Orders.count': 12,
              'Orders.revenue': 1500,
              'Orders.channel': 'web',
            },
          ],
          query: {
            dimensions: ['Orders.status'],
            timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'day' }],
            measures: ['Orders.count', 'Orders.revenue'],
          },
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    expect(readChartConfig('bar-chart')).toEqual({
      xAxis: ['Orders.status'],
      yAxis: ['Orders.count'],
      series: ['Orders.region'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'switch-table' }))

    await waitFor(() => {
      expect(screen.getByTestId('data-table-chart')).toBeInTheDocument()
    })

    expect(screen.getByText('Orders overview')).toBeInTheDocument()
    expect(readChartConfig('data-table-chart')).toEqual({
      xAxis: ['Orders.status', 'Orders.createdAt', 'Orders.count', 'Orders.revenue', 'Orders.channel'],
      yAxis: [],
      series: [],
    })
  })
})

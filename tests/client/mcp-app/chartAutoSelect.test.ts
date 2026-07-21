import { describe, it, expect } from 'vitest'

import {
  autoSelectChart,
  autoSelectChartType,
  deriveChartConfig,
  isChartAvailable,
} from '../../../src/mcp-app/chartAutoSelect'

const flowData = [
  {
    nodes: [
      { id: 'a', name: 'Opened', layer: 0 },
      { id: 'b', name: 'Merged', layer: 1 },
    ],
    links: [{ source: 'a', target: 'b', value: 42 }],
  },
]

describe('chartAutoSelect', () => {
  it('auto-selects a Sankey chart for flow (nodes/links) payloads', () => {
    expect(autoSelectChartType({}, flowData)).toBe('sankey')
  })

  it('marks sankey and sunburst available when flow data is present', () => {
    expect(isChartAvailable('sankey', {}, flowData.length, true)).toBe(true)
    expect(isChartAvailable('sunburst', {}, flowData.length, true)).toBe(true)
    // Standard tabular charts require measures/dimensions, so stay unavailable for flow data
    expect(isChartAvailable('bar', {}, flowData.length, true)).toBe(false)
  })

  it('does not offer flow charts for tabular results', () => {
    const tabular = { measures: ['Orders.count'], dimensions: ['Orders.status', 'Orders.region'] }
    // Only flow ({ nodes, links }) payloads can drive Sankey/Sunburst — never tabular rows
    expect(isChartAvailable('sankey', tabular, 12, false)).toBe(false)
    expect(isChartAvailable('sunburst', tabular, 12, false)).toBe(false)
  })

  it('requires two dimensions for heatmap and derives x/y/value fields', () => {
    const twoDims = { measures: ['Orders.count'], dimensions: ['Orders.status', 'Orders.region'] }
    const oneDim = { measures: ['Orders.count'], dimensions: ['Orders.status'] }

    expect(isChartAvailable('heatmap', twoDims, 12, false)).toBe(true)
    expect(isChartAvailable('heatmap', oneDim, 12, false)).toBe(false)

    expect(deriveChartConfig(twoDims, [], 'heatmap')).toEqual({
      chartType: 'heatmap',
      xAxis: ['Orders.status'],
      yAxis: ['Orders.region'],
      series: [],
      valueField: ['Orders.count'],
    })
  })

  it('auto-selects a table with a complete ordered column list for wide categorical results', () => {
    const query = {
      dimensions: ['Orders.status', 'Orders.region'],
      measures: ['Orders.count', 'Orders.revenue'],
    }

    const data = Array.from({ length: 31 }, (_, index) => ({
      'Orders.status': index % 2 === 0 ? 'paid' : 'pending',
      'Orders.region': index % 3 === 0 ? 'emea' : 'na',
      'Orders.count': index + 1,
      'Orders.revenue': (index + 1) * 100,
      'Orders.channel': index % 2 === 0 ? 'web' : 'store',
    }))

    expect(autoSelectChart(query, data)).toEqual({
      chartType: 'table',
      xAxis: ['Orders.status', 'Orders.region', 'Orders.count', 'Orders.revenue', 'Orders.channel'],
      yAxis: [],
      series: [],
    })
  })

  it('derives table columns from dimensions, time dimensions, measures, and remaining row keys', () => {
    const query = {
      dimensions: ['Orders.status'],
      timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'day' }],
      measures: ['Orders.count', 'Orders.revenue'],
    }

    const data = [
      {
        'Orders.status': 'paid',
        'Orders.createdAt': '2026-04-01',
        'Orders.count': 12,
        'Orders.revenue': 1250,
        'Orders.channel': 'web',
      },
      {
        'Orders.status': 'pending',
        'Orders.createdAt': '2026-04-02',
        'Orders.count': 4,
        'Orders.revenue': 420,
        'Orders.currency': 'USD',
      },
    ]

    expect(deriveChartConfig(query, data, 'table')).toEqual({
      chartType: 'table',
      xAxis: [
        'Orders.status',
        'Orders.createdAt',
        'Orders.count',
        'Orders.revenue',
        'Orders.channel',
        'Orders.currency',
      ],
      yAxis: [],
      series: [],
    })
  })

  it('keeps chart-safe axes for non-table chart configs', () => {
    const query = {
      dimensions: ['Orders.status', 'Orders.region'],
      measures: ['Orders.count'],
    }

    expect(deriveChartConfig(query, [], 'bar')).toEqual({
      chartType: 'bar',
      xAxis: ['Orders.status'],
      yAxis: ['Orders.count'],
      series: ['Orders.region'],
    })
  })
})

import { describe, it, expect } from 'vitest'

import {
  autoSelectChart,
  deriveChartConfig,
} from '../../../src/mcp-app/chartAutoSelect'

describe('chartAutoSelect', () => {
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

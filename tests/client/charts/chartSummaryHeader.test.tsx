/**
 * Tests for the chart summary header and the pure computation behind it.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  computeSeriesSummaries,
  isTimeOrderedXAxis,
  makeAxisResolver
} from '../../../src/client/components/charts/cartesianChartHelpers'
import ChartSummaryHeader from '../../../src/client/components/charts/ChartSummaryHeader'
import { getPlotLeftOffset, Y_AXIS_WIDTH } from '../../../src/client/components/charts/chartScaffolding'

vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

describe('computeSeriesSummaries', () => {
  const rows = [
    { name: 'Jan', Revenue: 100, Cost: 40 },
    { name: 'Feb', Revenue: 150, Cost: 30 },
    { name: 'Mar', Revenue: 200, Cost: 20 },
  ]

  it('measures current and baseline across the window', () => {
    const [revenue] = computeSeriesSummaries(rows, ['Revenue'])
    expect(revenue.current).toBe(200)
    expect(revenue.baseline).toBe(100)
    expect(revenue.absoluteChange).toBe(100)
    expect(revenue.percentageChange).toBe(100)
  })

  it('reports a negative trend', () => {
    const [cost] = computeSeriesSummaries(rows, ['Cost'])
    expect(cost.absoluteChange).toBe(-20)
    expect(cost.percentageChange).toBe(-50)
  })

  it('skips nulls rather than treating them as zero', () => {
    const [s] = computeSeriesSummaries(
      [{ v: null }, { v: 10 }, { v: 20 }, { v: null }],
      ['v']
    )
    expect(s.baseline).toBe(10)
    expect(s.current).toBe(20)
    expect(s.absoluteChange).toBe(10)
  })

  it('leaves deltas null when there is only one point to compare', () => {
    const [s] = computeSeriesSummaries([{ v: 5 }], ['v'])
    expect(s.current).toBe(5)
    expect(s.baseline).toBeNull()
    expect(s.absoluteChange).toBeNull()
  })

  it('handles an entirely empty series', () => {
    const [s] = computeSeriesSummaries([{ v: null }], ['v'])
    expect(s.current).toBeNull()
    expect(s.absoluteChange).toBeNull()
  })

  it('avoids dividing by a zero baseline', () => {
    const [s] = computeSeriesSummaries([{ v: 0 }, { v: 10 }], ['v'])
    expect(s.absoluteChange).toBe(10)
    expect(s.percentageChange).toBeNull()
  })

  it('assigns one palette colour per series', () => {
    const palette = { name: 'p', label: 'P', colors: ['#111111', '#222222'], gradient: [] }
    const summaries = computeSeriesSummaries(rows, ['Revenue', 'Cost'], palette)
    expect(summaries.map(s => s.color)).toEqual(['#111111', '#222222'])
  })
})

describe('isTimeOrderedXAxis', () => {
  it('is true when the x-axis field is a queried time dimension', () => {
    expect(isTimeOrderedXAxis(
      { timeDimensions: [{ dimension: 'Orders.createdAt' }] },
      'Orders.createdAt'
    )).toBe(true)
  })

  it('is false for a categorical x-axis', () => {
    expect(isTimeOrderedXAxis(
      { timeDimensions: [{ dimension: 'Orders.createdAt' }] },
      'Orders.region'
    )).toBe(false)
  })

  it('is false when the query has no time dimensions', () => {
    expect(isTimeOrderedXAxis({}, 'Orders.region')).toBe(false)
    expect(isTimeOrderedXAxis(undefined, undefined)).toBe(false)
  })
})

describe('ChartSummaryHeader', () => {
  const summaries = computeSeriesSummaries(
    [{ Revenue: 100 }, { Revenue: 250 }],
    ['Revenue']
  )

  it('renders the series label and current value', () => {
    render(<ChartSummaryHeader summaries={summaries} getSeriesLabel={(k) => k} />)
    expect(screen.getByTestId('chart-summary-header')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('renders the change when the axis is ordered', () => {
    render(<ChartSummaryHeader summaries={summaries} getSeriesLabel={(k) => k} showChange />)
    expect(screen.getByText(/\+150/)).toBeInTheDocument()
    expect(screen.getByText(/\+150\.0%/)).toBeInTheDocument()
  })

  it('omits the change for a categorical axis but keeps the value', () => {
    render(<ChartSummaryHeader summaries={summaries} getSeriesLabel={(k) => k} showChange={false} />)
    expect(screen.getByText('250')).toBeInTheDocument()
    expect(screen.queryByText(/\+150/)).not.toBeInTheDocument()
  })

  it('indents to line up with the plot area', () => {
    render(
      <ChartSummaryHeader summaries={summaries} getSeriesLabel={(k) => k} leftOffset={100} />
    )
    expect(screen.getByTestId('chart-summary-header').style.paddingLeft).toBe('100px')
  })

  it('sits flush left when no offset is supplied', () => {
    render(<ChartSummaryHeader summaries={summaries} getSeriesLabel={(k) => k} />)
    expect(screen.getByTestId('chart-summary-header').style.paddingLeft).toBe('0px')
  })

  it('renders nothing when there are no series', () => {
    const { container } = render(<ChartSummaryHeader summaries={[]} getSeriesLabel={(k) => k} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('getPlotLeftOffset', () => {
  it('is the chart margin plus the Y-axis gutter', () => {
    // Keeps the summary header aligned with the first data point.
    expect(getPlotLeftOffset(false)).toBe(40 + Y_AXIS_WIDTH)
  })

  it('is unchanged by a right-hand axis, which only affects the right margin', () => {
    expect(getPlotLeftOffset(true)).toBe(getPlotLeftOffset(false))
  })
})

describe('dual Y-axis summaries', () => {
  const yAxisAssignment: Record<string, 'left' | 'right'> = {
    'Sales.revenue': 'left',
    'Sales.conversionRate': 'right',
  }
  const resolveField = (key: string) => key
  const rows = [
    { 'Sales.revenue': 1000, 'Sales.conversionRate': 0.2 },
    { 'Sales.revenue': 2000, 'Sales.conversionRate': 0.5 },
  ]

  it('tags each series with the axis it is plotted against', () => {
    const summaries = computeSeriesSummaries(
      rows,
      ['Sales.revenue', 'Sales.conversionRate'],
      undefined,
      makeAxisResolver(resolveField, yAxisAssignment)
    )
    expect(summaries.map(s => s.axis)).toEqual(['left', 'right'])
  })

  it('defaults to the left axis when no assignment is given', () => {
    const [s] = computeSeriesSummaries(rows, ['Sales.revenue'])
    expect(s.axis).toBe('left')
  })

  it('formats each series with its own axis format', () => {
    // Regression: every summary used to be formatted with leftYAxisFormat, so a
    // right-axis series rendered with the wrong unit.
    const summaries = computeSeriesSummaries(
      rows,
      ['Sales.revenue', 'Sales.conversionRate'],
      undefined,
      makeAxisResolver(resolveField, yAxisAssignment)
    )
    render(
      <ChartSummaryHeader
        summaries={summaries}
        getSeriesLabel={(k) => k}
        valueFormat={{ unit: 'currency', decimals: 0, abbreviate: false }}
        rightValueFormat={{ unit: 'percent', decimals: 1 }}
      />
    )
    // left axis -> currency
    expect(screen.getByText(/\$2,000/)).toBeInTheDocument()
    // right axis -> percent, NOT currency
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument()
  })
})

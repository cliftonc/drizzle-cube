/**
 * Tests for KpiNumber component
 *
 * Focus on value display, number formatting, comparison values,
 * and null/undefined handling.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KpiNumber from '../../../../src/client/components/charts/KpiNumber'

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Sales.revenue': 'Revenue',
      'Sales.count': 'Sales Count',
      'Users.total': 'Total Users',
    }
    return labels[field] || field
  },
}))

// Mock DataHistogram since we're not testing chart rendering
vi.mock('../../../../src/client/components/DataHistogram', () => ({
  default: ({ values }: { values: number[] }) => (
    <div data-testid="data-histogram">Histogram: {values.length} values</div>
  ),
}))

// Mock periodUtils
vi.mock('../../../../src/client/utils/periodUtils', () => ({
  filterIncompletePeriod: (data: any[]) => ({
    filteredData: data,
    excludedIncompletePeriod: false,
    skippedLastPeriod: false,
    granularity: undefined,
  }),
}))

// Mock targetUtils
vi.mock('../../../../src/client/utils/targetUtils', () => ({
  parseTargetValues: (target: string) => {
    if (!target) return []
    return target.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v))
  },
  calculateVariance: (actual: number, target: number) => {
    if (target === 0) return 0
    return ((actual - target) / target) * 100
  },
  formatVariance: (variance: number, decimals: number) => {
    const sign = variance >= 0 ? '+' : ''
    return `${sign}${variance.toFixed(decimals)}%`
  },
}))

describe('KpiNumber', () => {
  describe('value display', () => {
    it('should display the primary value', () => {
      const data = [{ 'Sales.revenue': 1234 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('1K')).toBeInTheDocument()
    })

    it('should display the field label', () => {
      const data = [{ 'Sales.revenue': 1234 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })

    it('should format large numbers with M suffix (millions)', () => {
      const data = [{ 'Sales.revenue': 1234567 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('1M')).toBeInTheDocument()
    })

    it('should format very large numbers with B suffix (billions)', () => {
      const data = [{ 'Sales.revenue': 1234567890 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('1B')).toBeInTheDocument()
    })

    it('should format thousands with K suffix', () => {
      const data = [{ 'Sales.revenue': 5000 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('5K')).toBeInTheDocument()
    })

    it('should show placeholder for null value', () => {
      const data = [{ 'Sales.revenue': null }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Component shows dash placeholder for null values
      const placeholder = screen.getAllByText('—')
      expect(placeholder.length).toBeGreaterThan(0)
    })

    it('should show placeholder for undefined value', () => {
      const data = [{ 'Sales.revenue': undefined }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Component shows dash placeholder
      const placeholder = screen.getAllByText('—')
      expect(placeholder.length).toBeGreaterThan(0)
    })
  })

  describe('empty states', () => {
    it('should show "No data available" when data array is empty', () => {
      render(<KpiNumber data={[]} chartConfig={{ yAxis: ['Sales.revenue'] }} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data is null', () => {
      render(
        <KpiNumber
          data={null as unknown as any[]}
          chartConfig={{ yAxis: ['Sales.revenue'] }}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "Configuration Error" when no yAxis configured', () => {
      const data = [{ 'Sales.revenue': 1234 }]

      render(<KpiNumber data={data} chartConfig={{}} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(screen.getByText('No measure fields configured')).toBeInTheDocument()
    })

    it('should show "No data" when all values are null/undefined', () => {
      const data = [
        { 'Sales.revenue': null },
        { 'Sales.revenue': undefined },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Shows placeholder with "No data" text
      expect(screen.getByText('No data')).toBeInTheDocument()
    })
  })

  describe('formatting', () => {
    it('should respect decimals in displayConfig', () => {
      const data = [{ 'Sales.revenue': 1234 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { decimals: 2 }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // 1234 with decimals = 1.23K
      expect(screen.getByText('1.23K')).toBeInTheDocument()
    })

    it('should apply prefix from displayConfig', () => {
      const data = [{ 'Sales.revenue': 1234 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { prefix: '$', decimals: 0 }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('$1K')).toBeInTheDocument()
    })

    it('should display suffix when provided', () => {
      const data = [{ 'Sales.revenue': 50 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { suffix: ' units' }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('units')).toBeInTheDocument()
    })

    it('should use custom formatValue function when provided', () => {
      const data = [{ 'Sales.revenue': 1234.56 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = {
        formatValue: (value: number | null | undefined) =>
          value !== null && value !== undefined ? `Custom: ${value}` : 'N/A',
      }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Custom: 1234.56')).toBeInTheDocument()
    })

    it('should hide suffix when formatValue is provided', () => {
      const data = [{ 'Sales.revenue': 100 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = {
        suffix: ' should not show',
        formatValue: (value: number | null | undefined) => `${value}!`,
      }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.queryByText('should not show')).not.toBeInTheDocument()
    })
  })

  describe('multiple values (statistics)', () => {
    it('should calculate average when multiple data points exist', () => {
      // 100 + 200 + 300 = 600 / 3 = 200
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 200 },
        { 'Sales.revenue': 300 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Average of 100, 200, 300 = 200
      expect(screen.getByText('200')).toBeInTheDocument()
    })

    it('should show histogram when multiple values exist', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 200 },
        { 'Sales.revenue': 300 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByTestId('data-histogram')).toBeInTheDocument()
      expect(screen.getByText('Histogram: 3 values')).toBeInTheDocument()
    })

    it('should not show histogram for single value', () => {
      const data = [{ 'Sales.revenue': 100 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.queryByTestId('data-histogram')).not.toBeInTheDocument()
    })
  })

  describe('target comparison', () => {
    it('should show variance when target is provided', () => {
      const data = [{ 'Sales.revenue': 1100 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { target: '1000' }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // Variance: (1100 - 1000) / 1000 * 100 = 10%
      expect(screen.getByText('+10.0%')).toBeInTheDocument()
    })

    it('should show target value in comparison', () => {
      const data = [{ 'Sales.revenue': 1100 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { target: '1000' }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // Should show "vs target" value
      expect(screen.getByText(/vs/)).toBeInTheDocument()
    })

    it('should handle negative variance', () => {
      const data = [{ 'Sales.revenue': 900 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { target: '1000' }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // Variance: (900 - 1000) / 1000 * 100 = -10%
      expect(screen.getByText('-10.0%')).toBeInTheDocument()
    })
  })

  describe('chartConfig variations', () => {
    it('should handle yAxis as string', () => {
      const data = [{ 'Sales.revenue': 500 }]
      const chartConfig = { yAxis: 'Sales.revenue' as unknown as string[] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('500')).toBeInTheDocument()
    })

    it('should use first yAxis field when multiple are provided', () => {
      const data = [{ 'Sales.revenue': 1000, 'Sales.count': 50 }]
      const chartConfig = { yAxis: ['Sales.revenue', 'Sales.count'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Should show first field's value
      expect(screen.getByText('1K')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })

    it('should fallback to first numeric field if valueField not in data', () => {
      const data = [{ 'Sales.revenue': 42 }]
      const chartConfig = { yAxis: ['NonExistent.field'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Should fallback to first numeric field
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const data = [{ 'Sales.revenue': 0 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const data = [{ 'Sales.revenue': -1234 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Negative value should show with K suffix
      expect(screen.getByText('-1K')).toBeInTheDocument()
    })

    it('should handle very small decimals', () => {
      const data = [{ 'Sales.revenue': 0.0012 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { decimals: 4 }

      render(
        <KpiNumber
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // Very small value without K/M/B suffix
      expect(screen.getByText('0.0012')).toBeInTheDocument()
    })

    it('should filter out NaN values from calculations', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': NaN },
        { 'Sales.revenue': 200 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiNumber data={data} chartConfig={chartConfig} />)

      // Average of 100, 200 = 150 (NaN filtered out)
      expect(screen.getByText('150')).toBeInTheDocument()
    })
  })
})

/**
 * Tests for KpiDelta component
 *
 * Focus on delta calculation, trend indicators, and period-over-period comparison.
 * KpiDelta shows the change between the last two values in a time series.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KpiDelta from '../../../../src/client/components/charts/KpiDelta'

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Sales.revenue': 'Revenue',
      'Sales.count': 'Sales Count',
      'Time.date': 'Date',
    }
    return labels[field] || field
  },
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

describe('KpiDelta', () => {
  describe('delta calculation', () => {
    it('should calculate positive delta correctly', () => {
      const data = [
        { 'Time.date': '2024-01-01', 'Sales.revenue': 100 },
        { 'Time.date': '2024-01-02', 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'], xAxis: ['Time.date'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 150
      expect(screen.getByText('150')).toBeInTheDocument()

      // Delta: 150 - 100 = +50
      expect(screen.getByText('+50')).toBeInTheDocument()

      // Percentage: (50/100) * 100 = 50%
      expect(screen.getByText('+50.0%')).toBeInTheDocument()
    })

    it('should calculate negative delta correctly', () => {
      const data = [
        { 'Time.date': '2024-01-01', 'Sales.revenue': 200 },
        { 'Time.date': '2024-01-02', 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'], xAxis: ['Time.date'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 150
      expect(screen.getByText('150')).toBeInTheDocument()

      // Delta: 150 - 200 = -50
      expect(screen.getByText('-50')).toBeInTheDocument()

      // Percentage: (-50/200) * 100 = -25%
      expect(screen.getByText('-25.0%')).toBeInTheDocument()
    })

    it('should handle zero previous value (avoid division by zero)', () => {
      const data = [
        { 'Time.date': '2024-01-01', 'Sales.revenue': 0 },
        { 'Time.date': '2024-01-02', 'Sales.revenue': 100 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'], xAxis: ['Time.date'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 100
      expect(screen.getByText('100')).toBeInTheDocument()

      // Absolute change: +100
      expect(screen.getByText('+100')).toBeInTheDocument()

      // Percentage should be 0% when previous is 0 (to avoid infinity)
      expect(screen.getByText('+0.0%')).toBeInTheDocument()
    })

    it('should handle zero current value', () => {
      const data = [
        { 'Time.date': '2024-01-01', 'Sales.revenue': 100 },
        { 'Time.date': '2024-01-02', 'Sales.revenue': 0 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'], xAxis: ['Time.date'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 0
      expect(screen.getByText('0')).toBeInTheDocument()

      // Delta: 0 - 100 = -100
      expect(screen.getByText('-100')).toBeInTheDocument()

      // Percentage: -100%
      expect(screen.getByText('-100.0%')).toBeInTheDocument()
    })

    it('should handle both values being zero', () => {
      const data = [
        { 'Time.date': '2024-01-01', 'Sales.revenue': 0 },
        { 'Time.date': '2024-01-02', 'Sales.revenue': 0 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'], xAxis: ['Time.date'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 0
      expect(screen.getByText('0')).toBeInTheDocument()

      // Delta: 0 - 0 = 0, shown as +0
      expect(screen.getByText('+0')).toBeInTheDocument()
    })
  })

  describe('display', () => {
    it('should show current period value prominently', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 250 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // The current (last) value should be displayed
      expect(screen.getByText('250')).toBeInTheDocument()
    })

    it('should show delta percentage', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 125 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // (125 - 100) / 100 * 100 = 25%
      expect(screen.getByText('+25.0%')).toBeInTheDocument()
    })

    it('should show delta absolute value', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 175 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Absolute change: 175 - 100 = 75
      expect(screen.getByText('+75')).toBeInTheDocument()
    })

    it('should show field label', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })
  })

  describe('trend indicators', () => {
    it('should show up arrow for positive change', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Up arrow character
      expect(screen.getByText('▲')).toBeInTheDocument()
    })

    it('should show down arrow for negative change', () => {
      const data = [
        { 'Sales.revenue': 150 },
        { 'Sales.revenue': 100 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Down arrow character
      expect(screen.getByText('▼')).toBeInTheDocument()
    })

    it('should show up arrow for zero change (neutral)', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 100 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Zero change is positive (>=0), so up arrow
      expect(screen.getByText('▲')).toBeInTheDocument()
    })
  })

  describe('formatting', () => {
    it('should format values with K suffix for thousands', () => {
      const data = [
        { 'Sales.revenue': 5000 },
        { 'Sales.revenue': 7500 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 7500 -> 8K (rounded)
      expect(screen.getByText('8K')).toBeInTheDocument()
    })

    it('should format values with M suffix for millions', () => {
      const data = [
        { 'Sales.revenue': 1000000 },
        { 'Sales.revenue': 1500000 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Current value: 1.5M
      expect(screen.getByText('2M')).toBeInTheDocument()
    })

    it('should respect decimals in displayConfig', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 1234 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { decimals: 2 }

      render(
        <KpiDelta
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // 1234 with 2 decimals = 1.23K
      expect(screen.getByText('1.23K')).toBeInTheDocument()
    })

    it('should apply prefix from displayConfig', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { prefix: '$' }

      render(
        <KpiDelta
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('$150')).toBeInTheDocument()
    })

    it('should show suffix when provided', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { suffix: ' units' }

      render(
        <KpiDelta
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('units')).toBeInTheDocument()
    })

    it('should use custom formatValue function when provided', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = {
        formatValue: (value: number | null | undefined) =>
          value !== null && value !== undefined ? `Custom: ${value}` : 'N/A',
      }

      render(
        <KpiDelta
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Custom: 150')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should show "Insufficient Data" when only one data point', () => {
      const data = [{ 'Sales.revenue': 100 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('Insufficient Data')).toBeInTheDocument()
      expect(
        screen.getByText('Delta calculation requires at least 2 data points')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<KpiDelta data={[]} chartConfig={{ yAxis: ['Sales.revenue'] }} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data is null', () => {
      render(
        <KpiDelta
          data={null as unknown as any[]}
          chartConfig={{ yAxis: ['Sales.revenue'] }}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "Configuration Error" when no yAxis configured', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]

      render(<KpiDelta data={data} chartConfig={{}} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(screen.getByText('No measure field configured')).toBeInTheDocument()
    })

    it('should handle data with null values (filters them out)', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': null },
        { 'Sales.revenue': 200 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // Null should be filtered, leaving 100 and 200
      // Current: 200, Previous: 100
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('+100')).toBeInTheDocument()
    })

    it('should sort data by dimension field when provided', () => {
      // Unsorted input
      const data = [
        { 'Time.date': '2024-01-03', 'Sales.revenue': 300 },
        { 'Time.date': '2024-01-01', 'Sales.revenue': 100 },
        { 'Time.date': '2024-01-02', 'Sales.revenue': 200 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'], xAxis: ['Time.date'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // After sorting: 100, 200, 300
      // Current should be 300 (last after sort)
      expect(screen.getByText('300')).toBeInTheDocument()
      // Delta: 300 - 200 = +100
      expect(screen.getByText('+100')).toBeInTheDocument()
    })

    it('should filter out NaN values', () => {
      const data = [
        { 'Sales.revenue': NaN },
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiDelta data={data} chartConfig={chartConfig} />)

      // NaN filtered, leaving 100 and 150
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('+50')).toBeInTheDocument()
    })
  })

  describe('histogram', () => {
    it('should show variance histogram when more than 2 values', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
        { 'Sales.revenue': 200 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      const { container } = render(
        <KpiDelta data={data} chartConfig={chartConfig} />
      )

      // Histogram should be rendered for > 2 values
      // Check for histogram-related elements
      expect(container.querySelector('[title*="vs current"]')).toBeInTheDocument()
    })

    it('should not show histogram when showHistogram is false', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 150 },
        { 'Sales.revenue': 200 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { showHistogram: false }

      const { container } = render(
        <KpiDelta
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // No histogram elements
      expect(container.querySelector('[title*="vs current"]')).not.toBeInTheDocument()
    })
  })
})

/**
 * Tests for KpiText component
 *
 * Focus on text display, template processing, null handling,
 * and numeric statistics for multiple values.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KpiText from '../../../../src/client/components/charts/KpiText'

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Status.current': 'Current Status',
      'Product.name': 'Product Name',
      'Sales.revenue': 'Revenue',
      'Users.count': 'User Count',
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

describe('KpiText', () => {
  describe('rendering', () => {
    it('should display text value with default template', () => {
      const data = [{ 'Status.current': 'Active' }]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Default template: "${fieldLabel}: ${value}"
      expect(screen.getByText('Current Status: Active')).toBeInTheDocument()
    })

    it('should display numeric value formatted', () => {
      const data = [{ 'Sales.revenue': 1234567 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Large number should be formatted with M suffix
      expect(screen.getByText('Revenue: 1.23M')).toBeInTheDocument()
    })

    it('should display label from getFieldLabel', () => {
      const data = [{ 'Product.name': 'Widget Pro' }]
      const chartConfig = { yAxis: ['Product.name'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('Product Name: Widget Pro')).toBeInTheDocument()
    })

    it('should concatenate multiple text values', () => {
      const data = [
        { 'Status.current': 'Active' },
        { 'Status.current': 'Pending' },
        { 'Status.current': 'Complete' },
      ]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Multiple non-numeric values should be joined
      expect(screen.getByText('Current Status: Active, Pending, Complete')).toBeInTheDocument()
    })
  })

  describe('null handling', () => {
    it('should show placeholder for null value', () => {
      const data = [{ 'Status.current': null }]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Null values are filtered, resulting in "No valid data"
      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })

    it('should show placeholder for undefined value', () => {
      const data = [{ 'Status.current': undefined }]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })

    it('should filter out null values from multiple entries', () => {
      const data = [
        { 'Status.current': 'Active' },
        { 'Status.current': null },
        { 'Status.current': 'Complete' },
      ]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Null filtered out, remaining values joined
      expect(screen.getByText('Current Status: Active, Complete')).toBeInTheDocument()
    })

    it('should show "No valid data" when all values are null/undefined', () => {
      const data = [
        { 'Status.current': null },
        { 'Status.current': undefined },
      ]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
      expect(screen.getByText('All values are null or invalid')).toBeInTheDocument()
    })
  })

  describe('empty states', () => {
    it('should show "No data available" when data array is empty', () => {
      render(<KpiText data={[]} chartConfig={{ yAxis: ['Status.current'] }} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data is null', () => {
      render(
        <KpiText
          data={null as unknown as any[]}
          chartConfig={{ yAxis: ['Status.current'] }}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "Configuration Error" when no yAxis configured', () => {
      const data = [{ 'Status.current': 'Active' }]

      render(<KpiText data={data} chartConfig={{}} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(screen.getByText('No measure fields configured')).toBeInTheDocument()
    })
  })

  describe('template processing', () => {
    it('should process custom template with ${value}', () => {
      const data = [{ 'Status.current': 'Online' }]
      const chartConfig = { yAxis: ['Status.current'] }
      const displayConfig = { template: 'Status: ${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Status: Online')).toBeInTheDocument()
    })

    it('should process template with ${fieldLabel}', () => {
      const data = [{ 'Product.name': 'Widget' }]
      const chartConfig = { yAxis: ['Product.name'] }
      const displayConfig = { template: 'The ${fieldLabel} is ${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('The Product Name is Widget')).toBeInTheDocument()
    })

    it('should process template with ${count} for multiple values', () => {
      const data = [
        { 'Status.current': 'A' },
        { 'Status.current': 'B' },
        { 'Status.current': 'C' },
      ]
      const chartConfig = { yAxis: ['Status.current'] }
      const displayConfig = { template: '${count} items' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('3 items')).toBeInTheDocument()
    })

    it('should process template with ${min} and ${max} for numeric values', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 200 },
        { 'Sales.revenue': 300 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: 'Range: ${min} to ${max}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Range: 100.00 to 300.00')).toBeInTheDocument()
    })

    it('should handle unknown template variables gracefully', () => {
      const data = [{ 'Status.current': 'Active' }]
      const chartConfig = { yAxis: ['Status.current'] }
      const displayConfig = { template: 'Status: ${value} (${unknown})' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // Unknown variables remain as-is
      expect(screen.getByText('Status: Active (${unknown})')).toBeInTheDocument()
    })
  })

  describe('numeric value statistics', () => {
    it('should calculate average for multiple numeric values', () => {
      // 100 + 200 + 300 = 600 / 3 = 200
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 200 },
        { 'Sales.revenue': 300 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: 'Average: ${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Average: 200.00')).toBeInTheDocument()
    })

    it('should show histogram for multiple numeric values', () => {
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 200 },
        { 'Sales.revenue': 300 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      expect(screen.getByTestId('data-histogram')).toBeInTheDocument()
      expect(screen.getByText('Histogram: 3 values')).toBeInTheDocument()
    })

    it('should not show histogram for single value', () => {
      const data = [{ 'Sales.revenue': 100 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      expect(screen.queryByTestId('data-histogram')).not.toBeInTheDocument()
    })

    it('should not show histogram for non-numeric values', () => {
      const data = [
        { 'Status.current': 'A' },
        { 'Status.current': 'B' },
        { 'Status.current': 'C' },
      ]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      expect(screen.queryByTestId('data-histogram')).not.toBeInTheDocument()
    })
  })

  describe('formatting', () => {
    it('should format large numbers with K suffix', () => {
      const data = [{ 'Sales.revenue': 5000 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('5.00K')).toBeInTheDocument()
    })

    it('should format very large numbers with M suffix', () => {
      const data = [{ 'Sales.revenue': 2500000 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('2.50M')).toBeInTheDocument()
    })

    it('should format billions with B suffix', () => {
      const data = [{ 'Sales.revenue': 1500000000 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('1.50B')).toBeInTheDocument()
    })

    it('should respect decimals in displayConfig', () => {
      const data = [{ 'Sales.revenue': 1234.5678 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { decimals: 0, template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('1K')).toBeInTheDocument()
    })

    it('should use custom formatValue function when provided', () => {
      const data = [{ 'Sales.revenue': 42 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = {
        formatValue: (value: number | null | undefined) =>
          value !== null && value !== undefined ? `$${value.toFixed(2)}` : 'N/A',
        template: '${value}',
      }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('$42.00')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const data = [{ 'Sales.revenue': 0 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: 'Value: ${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Value: 0.00')).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const data = [{ 'Sales.revenue': -500 }]
      const chartConfig = { yAxis: ['Sales.revenue'] }
      const displayConfig = { template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('-500.00')).toBeInTheDocument()
    })

    it('should handle empty string value', () => {
      const data = [{ 'Status.current': '' }]
      const chartConfig = { yAxis: ['Status.current'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Empty string is displayed (not filtered out) - shows label with no value
      expect(screen.getByText('Current Status:')).toBeInTheDocument()
    })

    it('should fallback to first field if configured field not found', () => {
      const data = [{ 'Other.field': 'Fallback Value' }]
      const chartConfig = { yAxis: ['NonExistent.field'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Should fallback to first available field
      expect(screen.getByText(/Fallback Value/)).toBeInTheDocument()
    })

    it('should handle mixed numeric and non-numeric values', () => {
      // When there are numbers, they take precedence for statistics
      const data = [
        { 'Sales.revenue': 100 },
        { 'Sales.revenue': 'invalid' },
        { 'Sales.revenue': 200 },
      ]
      const chartConfig = { yAxis: ['Sales.revenue'] }

      render(<KpiText data={data} chartConfig={chartConfig} />)

      // Should calculate average of valid numbers (100, 200) = 150
      expect(screen.getByText(/150/)).toBeInTheDocument()
    })

    it('should handle special characters in text values', () => {
      const data = [{ 'Status.current': '<script>alert("xss")</script>' }]
      const chartConfig = { yAxis: ['Status.current'] }
      const displayConfig = { template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // React escapes special characters by default
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
    })
  })

  describe('chartConfig variations', () => {
    it('should handle yAxis as string', () => {
      const data = [{ 'Status.current': 'Online' }]
      const chartConfig = { yAxis: 'Status.current' as unknown as string[] }
      const displayConfig = { template: '${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('should use first yAxis field when multiple are provided', () => {
      const data = [{ 'Status.current': 'Active', 'Product.name': 'Widget' }]
      const chartConfig = { yAxis: ['Status.current', 'Product.name'] }
      const displayConfig = { template: '${fieldLabel}: ${value}' }

      render(
        <KpiText
          data={data}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
        />
      )

      // Should use first field
      expect(screen.getByText('Current Status: Active')).toBeInTheDocument()
    })
  })
})

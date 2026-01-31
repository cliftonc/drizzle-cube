/**
 * Tests for ChartTooltip component
 *
 * Focus on tooltip rendering, default formatting behavior,
 * custom formatter support, and styling configuration.
 *
 * ChartTooltip is a wrapper around Recharts' Tooltip component
 * that provides consistent styling and a default numeric formatter.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Track the props passed to Tooltip
let tooltipProps: any = null

// Mock the Tooltip component from recharts
vi.mock('recharts', () => ({
  Tooltip: (props: any) => {
    tooltipProps = props
    return (
      <div
        data-testid="recharts-tooltip"
        data-has-formatter={!!props.formatter}
        data-has-label-formatter={!!props.labelFormatter}
      >
        Tooltip
      </div>
    )
  },
}))

// Mock the chartUtils to verify it's being used
vi.mock('../../../../src/client/utils/chartUtils', () => ({
  formatNumericValue: vi.fn((value: any) => {
    if (value === null || value === undefined) return 'No data'
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(num)) return String(value)
    if (Number.isInteger(num)) return num.toLocaleString()
    return parseFloat(num.toFixed(2)).toLocaleString()
  }),
}))

// Import after mocking
import ChartTooltip from '../../../../src/client/components/charts/ChartTooltip'
import { formatNumericValue } from '../../../../src/client/utils/chartUtils'

describe('ChartTooltip', () => {
  beforeEach(() => {
    tooltipProps = null
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render the tooltip', () => {
      render(<ChartTooltip />)

      expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument()
    })

    it('should pass formatter to Tooltip', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.formatter).toBeDefined()
      expect(typeof tooltipProps.formatter).toBe('function')
    })
  })

  describe('default formatter', () => {
    it('should use default formatter when none provided', () => {
      render(<ChartTooltip />)

      const tooltip = screen.getByTestId('recharts-tooltip')
      expect(tooltip).toHaveAttribute('data-has-formatter', 'true')
    })

    it('should format integer values correctly', () => {
      render(<ChartTooltip />)

      const [formattedValue, name] = tooltipProps.formatter(1234, 'Revenue')

      expect(formattedValue).toBe('1,234')
      expect(name).toBe('Revenue')
    })

    it('should format decimal values with max 2 decimal places', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(1234.5678, 'Revenue')

      expect(formattedValue).toBe('1,234.57')
    })

    it('should return "No data" for null values', () => {
      render(<ChartTooltip />)

      const [formattedValue, name] = tooltipProps.formatter(null, 'Revenue')

      expect(formattedValue).toBe('No data')
      expect(name).toBe('Revenue')
    })

    it('should return "No data" for undefined values', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(undefined, 'Revenue')

      expect(formattedValue).toBe('No data')
    })

    it('should use formatNumericValue from chartUtils', () => {
      render(<ChartTooltip />)

      tooltipProps.formatter(1000, 'Test')

      expect(formatNumericValue).toHaveBeenCalledWith(1000)
    })

    it('should preserve field name in formatter output', () => {
      render(<ChartTooltip />)

      const fieldNames = ['Revenue', 'Count', 'Sales.total', 'Users.active']

      fieldNames.forEach((name) => {
        const [, returnedName] = tooltipProps.formatter(100, name)
        expect(returnedName).toBe(name)
      })
    })
  })

  describe('custom formatter', () => {
    it('should use custom formatter when provided', () => {
      const customFormatter = vi.fn((value, name) => [`$${value}`, name])

      render(<ChartTooltip formatter={customFormatter} />)

      expect(tooltipProps.formatter).toBe(customFormatter)
    })

    it('should not use default formatter when custom is provided', () => {
      const customFormatter = (value: any, name: any) => [`Custom: ${value}`, name]

      render(<ChartTooltip formatter={customFormatter} />)

      const [formattedValue] = tooltipProps.formatter(1234, 'Test')

      expect(formattedValue).toBe('Custom: 1234')
    })
  })

  describe('label formatter', () => {
    it('should not have label formatter by default', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.labelFormatter).toBeUndefined()
    })

    it('should use custom label formatter when provided', () => {
      const customLabelFormatter = (label: any) => `Date: ${label}`

      render(<ChartTooltip labelFormatter={customLabelFormatter} />)

      expect(tooltipProps.labelFormatter).toBe(customLabelFormatter)
    })

    it('should pass payload to label formatter', () => {
      const customLabelFormatter = vi.fn((label, payload) => {
        return `${label} (${payload?.length || 0} items)`
      })

      render(<ChartTooltip labelFormatter={customLabelFormatter} />)

      expect(tooltipProps.labelFormatter).toBe(customLabelFormatter)
    })
  })

  describe('content styling', () => {
    it('should have white background', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty(
        'backgroundColor',
        'white'
      )
    })

    it('should have gray border', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty(
        'border',
        '1px solid #e5e7eb'
      )
    })

    it('should have rounded corners', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty('borderRadius', '0.5rem')
    })

    it('should have appropriate font size', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty('fontSize', '0.875rem')
    })

    it('should have dark text color', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty('color', '#1f2937')
    })

    it('should have box shadow', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty(
        'boxShadow',
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      )
    })

    it('should have appropriate padding', () => {
      render(<ChartTooltip />)

      expect(tooltipProps.contentStyle).toHaveProperty('padding', '8px 12px')
    })
  })

  describe('edge cases', () => {
    it('should handle zero value', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(0, 'Count')

      expect(formattedValue).toBe('0')
    })

    it('should handle negative values', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(-1234, 'Balance')

      expect(formattedValue).toBe('-1,234')
    })

    it('should handle very large numbers', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(1000000000, 'Revenue')

      expect(formattedValue).toBe('1,000,000,000')
    })

    it('should handle very small decimals', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(0.001234, 'Rate')

      // Should be rounded to 2 decimal places
      expect(formattedValue).toBe('0')
    })

    it('should handle string numeric values', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter('1234.56', 'Amount')

      expect(formattedValue).toBe('1,234.56')
    })

    it('should handle non-numeric string values', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter('Not a number', 'Status')

      expect(formattedValue).toBe('Not a number')
    })

    it('should handle NaN values', () => {
      render(<ChartTooltip />)

      const [formattedValue] = tooltipProps.formatter(NaN, 'Invalid')

      expect(formattedValue).toBe('NaN')
    })

    it('should handle empty name', () => {
      render(<ChartTooltip />)

      const [, name] = tooltipProps.formatter(100, '')

      expect(name).toBe('')
    })

    it('should handle object as name (Recharts may pass objects)', () => {
      render(<ChartTooltip />)

      const nameObject = { dataKey: 'revenue' }
      const [, name] = tooltipProps.formatter(100, nameObject)

      expect(name).toEqual(nameObject)
    })
  })

  describe('props integration', () => {
    it('should handle both formatter and labelFormatter', () => {
      const customFormatter = (value: any, name: any) => [`$${value}`, name]
      const customLabelFormatter = (label: any) => `Date: ${label}`

      render(
        <ChartTooltip
          formatter={customFormatter}
          labelFormatter={customLabelFormatter}
        />
      )

      expect(tooltipProps.formatter).toBe(customFormatter)
      expect(tooltipProps.labelFormatter).toBe(customLabelFormatter)
    })

    it('should update when props change', () => {
      const formatter1 = (value: any, name: any) => [`V1: ${value}`, name]
      const formatter2 = (value: any, name: any) => [`V2: ${value}`, name]

      const { rerender } = render(<ChartTooltip formatter={formatter1} />)

      expect(tooltipProps.formatter).toBe(formatter1)

      rerender(<ChartTooltip formatter={formatter2} />)

      expect(tooltipProps.formatter).toBe(formatter2)
    })
  })

  describe('third parameter support', () => {
    it('should support third props parameter in formatter', () => {
      const customFormatter = vi.fn((value, name, props) => {
        const color = props?.color || '#000'
        return [`${value} (${color})`, name]
      })

      render(<ChartTooltip formatter={customFormatter} />)

      // Simulate calling the formatter with props (as Recharts does)
      const result = tooltipProps.formatter(100, 'Revenue', { color: '#ff0000' })

      expect(result[0]).toBe('100 (#ff0000)')
    })

    it('should handle missing props parameter gracefully', () => {
      const customFormatter = (value: any, name: any, props: any) => {
        const suffix = props?.payload?.unit || ''
        return [`${value}${suffix}`, name]
      }

      render(<ChartTooltip formatter={customFormatter} />)

      // Call without props
      const result = tooltipProps.formatter(100, 'Revenue')

      expect(result[0]).toBe('100')
    })
  })
})

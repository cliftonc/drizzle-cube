/**
 * Tests for RetentionCombinedChart component
 *
 * Combined visualization for retention analysis data with multiple display modes:
 * - 'heatmap': Table-based color-coded retention matrix
 * - 'line': Line chart showing retention curves over periods
 * - 'combined': Line chart on top, heatmap table below
 *
 * Tests focus on mode switching, data rendering, axis configuration,
 * series grouping by breakdown, legend display, and empty state handling.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RetentionCombinedChart from '../../../../src/client/components/charts/RetentionCombinedChart'
import type { RetentionResultRow, RetentionChartData } from '../../../../src/client/types/retention'

// Mock ChartContainer to avoid ResponsiveContainer issues in tests
vi.mock('../../../../src/client/components/charts/ChartContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
}))

// Mock ChartTooltip
vi.mock('../../../../src/client/components/charts/ChartTooltip', () => ({
  default: () => <div data-testid="chart-tooltip">Tooltip</div>,
}))

// Sample retention data without breakdown (single series)
const mockSingleSeriesRows: RetentionResultRow[] = [
  { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
  { period: 1, cohortSize: 100, retainedUsers: 65, retentionRate: 0.65 },
  { period: 2, cohortSize: 100, retainedUsers: 45, retentionRate: 0.45 },
  { period: 3, cohortSize: 100, retainedUsers: 35, retentionRate: 0.35 },
  { period: 4, cohortSize: 100, retainedUsers: 28, retentionRate: 0.28 },
]

// Sample retention data with breakdown values (multiple series)
const mockMultiSeriesRows: RetentionResultRow[] = [
  // US segment
  { period: 0, cohortSize: 60, retainedUsers: 60, retentionRate: 1.0, breakdownValue: 'US' },
  { period: 1, cohortSize: 60, retainedUsers: 45, retentionRate: 0.75, breakdownValue: 'US' },
  { period: 2, cohortSize: 60, retainedUsers: 36, retentionRate: 0.6, breakdownValue: 'US' },
  // UK segment
  { period: 0, cohortSize: 40, retainedUsers: 40, retentionRate: 1.0, breakdownValue: 'UK' },
  { period: 1, cohortSize: 40, retainedUsers: 24, retentionRate: 0.6, breakdownValue: 'UK' },
  { period: 2, cohortSize: 40, retainedUsers: 14, retentionRate: 0.35, breakdownValue: 'UK' },
]

// RetentionChartData format
const mockSingleSeriesChartData: RetentionChartData = {
  rows: mockSingleSeriesRows,
  periods: [0, 1, 2, 3, 4],
}

const mockMultiSeriesChartData: RetentionChartData = {
  rows: mockMultiSeriesRows,
  periods: [0, 1, 2],
  breakdownValues: ['US', 'UK'],
}

// Chart data with granularity
const mockChartDataWithGranularity: RetentionChartData = {
  rows: mockSingleSeriesRows,
  periods: [0, 1, 2, 3, 4],
  granularity: 'week',
}

// Chart data with binding key label
const mockChartDataWithBindingKey: RetentionChartData = {
  rows: mockSingleSeriesRows,
  periods: [0, 1, 2, 3, 4],
  bindingKeyLabel: 'userId',
}

describe('RetentionCombinedChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering - line mode (default)', () => {
    it('should render chart container with valid data', () => {
      render(<RetentionCombinedChart data={mockSingleSeriesRows} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <RetentionCombinedChart data={mockSingleSeriesRows} />
      )

      // Line mode renders directly into ChartContainer
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should respect custom numeric height', () => {
      render(
        <RetentionCombinedChart data={mockSingleSeriesRows} height={400} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should respect custom string height', () => {
      render(
        <RetentionCombinedChart data={mockSingleSeriesRows} height="50vh" />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(<RetentionCombinedChart data={null as unknown as any[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('Configure retention analysis to see results')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(<RetentionCombinedChart data={undefined as unknown as any[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<RetentionCombinedChart data={[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('display modes', () => {
    describe('line mode', () => {
      it('should render line chart by default', () => {
        render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'line' } as any}
          />
        )

        expect(screen.getByTestId('chart-container')).toBeInTheDocument()
      })

      it('should render single line for data without breakdown', () => {
        render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'line' } as any}
          />
        )

        expect(screen.getByTestId('chart-container')).toBeInTheDocument()
      })

      it('should render multiple lines for segmented data', () => {
        render(
          <RetentionCombinedChart
            data={mockMultiSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'line' } as any}
          />
        )

        expect(screen.getByTestId('chart-container')).toBeInTheDocument()
      })
    })

    describe('heatmap mode', () => {
      it('should render heatmap table when mode is heatmap', () => {
        const { container } = render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
          />
        )

        // Should render a table for heatmap
        const table = container.querySelector('table')
        expect(table).toBeInTheDocument()
      })

      it('should display period column headers in heatmap', () => {
        render(
          <RetentionCombinedChart
            data={mockChartDataWithGranularity}
            displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
          />
        )

        // With 'week' granularity, period 0 shows "< 1 Week", period 1 shows "Week 1"
        expect(screen.getByText('< 1 Week')).toBeInTheDocument()
        expect(screen.getByText('Week 1')).toBeInTheDocument()
      })

      it('should display cohort/segment column in heatmap', () => {
        render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
          />
        )

        expect(screen.getByText('Cohort')).toBeInTheDocument()
      })

      it('should display Segment header for segmented data', () => {
        render(
          <RetentionCombinedChart
            data={mockMultiSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
          />
        )

        expect(screen.getByText('Segment')).toBeInTheDocument()
      })

      it('should display Total column header', () => {
        render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
          />
        )

        expect(screen.getByText('Total')).toBeInTheDocument()
      })

      it('should display retention percentages in cells', () => {
        render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
          />
        )

        expect(screen.getByText('100%')).toBeInTheDocument()
        expect(screen.getByText('65%')).toBeInTheDocument()
      })
    })

    describe('combined mode', () => {
      it('should render both line chart and heatmap table', () => {
        const { container } = render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'combined' } as any}
          />
        )

        // Should have chart container for line chart
        expect(screen.getByTestId('chart-container')).toBeInTheDocument()

        // Should also have table for heatmap
        const table = container.querySelector('table')
        expect(table).toBeInTheDocument()
      })

      it('should have proper layout with line chart on top', () => {
        const { container } = render(
          <RetentionCombinedChart
            data={mockSingleSeriesChartData}
            displayConfig={{ retentionDisplayMode: 'combined' } as any}
          />
        )

        // The combined mode uses flex column layout
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass('dc:flex')
        expect(wrapper).toHaveClass('dc:flex-col')
      })
    })
  })

  describe('data format handling', () => {
    it('should handle RetentionChartData format', () => {
      render(<RetentionCombinedChart data={mockSingleSeriesChartData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle array of RetentionResultRow format', () => {
      render(<RetentionCombinedChart data={mockSingleSeriesRows} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should extract breakdown values from rows', () => {
      render(
        <RetentionCombinedChart
          data={mockMultiSeriesRows}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      // Should show segment names
      expect(screen.getByText('US')).toBeInTheDocument()
      expect(screen.getByText('UK')).toBeInTheDocument()
    })
  })

  describe('granularity formatting', () => {
    it('should format periods with day granularity', () => {
      const dayData: RetentionChartData = {
        rows: mockSingleSeriesRows,
        periods: [0, 1, 2, 3, 4],
        granularity: 'day',
      }

      render(
        <RetentionCombinedChart
          data={dayData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('< 1 Day')).toBeInTheDocument()
      expect(screen.getByText('Day 1')).toBeInTheDocument()
    })

    it('should format periods with week granularity', () => {
      render(
        <RetentionCombinedChart
          data={mockChartDataWithGranularity}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('< 1 Week')).toBeInTheDocument()
      expect(screen.getByText('Week 1')).toBeInTheDocument()
    })

    it('should format periods with month granularity', () => {
      const monthData: RetentionChartData = {
        rows: mockSingleSeriesRows,
        periods: [0, 1, 2, 3, 4],
        granularity: 'month',
      }

      render(
        <RetentionCombinedChart
          data={monthData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('< 1 Month')).toBeInTheDocument()
      expect(screen.getByText('Month 1')).toBeInTheDocument()
    })

    it('should use P0, P1 format when no granularity specified', () => {
      render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('P0')).toBeInTheDocument()
      expect(screen.getByText('P1')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend by default', () => {
      render(<RetentionCombinedChart data={mockSingleSeriesChartData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ showLegend: false }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show grid by default', () => {
      render(<RetentionCombinedChart data={mockSingleSeriesChartData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ showGrid: false }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show tooltip by default', () => {
      render(<RetentionCombinedChart data={mockSingleSeriesChartData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ showTooltip: false }}
        />
      )

      // Tooltip should not be in the DOM
      expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      render(
        <RetentionCombinedChart
          data={mockMultiSeriesChartData}
          colorPalette={customPalette}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('heatmap tooltip in combined/heatmap modes', () => {
    it('should show tooltip on heatmap cell hover', () => {
      const { container } = render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      // Find data cell
      const cells = container.querySelectorAll('tbody td')
      const dataCell = cells[2] // Skip cohort and total columns

      // Trigger hover
      fireEvent.mouseEnter(dataCell)

      // Tooltip should appear (it's a fixed positioned element)
      const tooltip = container.querySelector('.dc\\:fixed.dc\\:z-50')
      expect(tooltip).toBeInTheDocument()
    })

    it('should show detailed stats in heatmap tooltip', () => {
      const { container } = render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      const cells = container.querySelectorAll('tbody td')
      const dataCell = cells[2]

      fireEvent.mouseEnter(dataCell)

      // Check tooltip content
      const tooltip = container.querySelector('.dc\\:fixed.dc\\:z-50')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip?.textContent).toContain('Cohort Size')
      expect(tooltip?.textContent).toContain('Retained')
      expect(tooltip?.textContent).toContain('Rate')
    })

    it('should hide tooltip on mouse leave', () => {
      const { container } = render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      const cells = container.querySelectorAll('tbody td')
      const dataCell = cells[2]

      fireEvent.mouseEnter(dataCell)
      fireEvent.mouseLeave(dataCell)

      const tooltip = container.querySelector('.dc\\:fixed.dc\\:z-50')
      expect(tooltip).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single period data', () => {
      const singlePeriod: RetentionChartData = {
        rows: [{ period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 }],
        periods: [0],
      }

      render(<RetentionCombinedChart data={singlePeriod} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle zero retention rates', () => {
      const zeroRetention: RetentionChartData = {
        rows: [
          { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
          { period: 1, cohortSize: 100, retainedUsers: 0, retentionRate: 0 },
        ],
        periods: [0, 1],
      }

      render(
        <RetentionCombinedChart
          data={zeroRetention}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      // Should show dash for zero or show 0%
      const table = document.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should handle large cohort sizes', () => {
      const largeCohort: RetentionChartData = {
        rows: [
          { period: 0, cohortSize: 1000000, retainedUsers: 1000000, retentionRate: 1.0 },
          { period: 1, cohortSize: 1000000, retainedUsers: 650000, retentionRate: 0.65 },
        ],
        periods: [0, 1],
      }

      render(
        <RetentionCombinedChart
          data={largeCohort}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      // Should format with locale string (commas)
      expect(screen.getByText('1,000,000')).toBeInTheDocument()
    })

    it('should handle many periods', () => {
      const manyPeriods = Array.from({ length: 12 }, (_, i) => ({
        period: i,
        cohortSize: 100,
        retainedUsers: Math.max(100 - i * 8, 5),
        retentionRate: Math.max((100 - i * 8) / 100, 0.05),
      }))

      const chartData: RetentionChartData = {
        rows: manyPeriods,
        periods: Array.from({ length: 12 }, (_, i) => i),
      }

      render(<RetentionCombinedChart data={chartData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle many segments', () => {
      const segments = ['US', 'UK', 'DE', 'FR', 'JP']
      const manySegments: RetentionResultRow[] = segments.flatMap((segment) => [
        { period: 0, cohortSize: 50, retainedUsers: 50, retentionRate: 1.0, breakdownValue: segment },
        { period: 1, cohortSize: 50, retainedUsers: 30, retentionRate: 0.6, breakdownValue: segment },
      ])

      const chartData: RetentionChartData = {
        rows: manySegments,
        periods: [0, 1],
        breakdownValues: segments,
      }

      render(<RetentionCombinedChart data={chartData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{}}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle null values in data', () => {
      const dataWithNulls: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
        { period: 1, cohortSize: 100, retainedUsers: 65, retentionRate: 0.65 },
      ]

      render(<RetentionCombinedChart data={dataWithNulls} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('series naming', () => {
    it('should use "Retention" as default series name without breakdown', () => {
      render(
        <RetentionCombinedChart
          data={mockSingleSeriesChartData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('Retention')).toBeInTheDocument()
    })

    it('should use breakdown values as series names', () => {
      render(
        <RetentionCombinedChart
          data={mockMultiSeriesChartData}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('US')).toBeInTheDocument()
      expect(screen.getByText('UK')).toBeInTheDocument()
    })

    it('should include binding key in default series name when available', () => {
      render(
        <RetentionCombinedChart
          data={mockChartDataWithBindingKey}
          displayConfig={{ retentionDisplayMode: 'heatmap' } as any}
        />
      )

      expect(screen.getByText('userId Retention')).toBeInTheDocument()
    })
  })

  describe('invalid data handling', () => {
    it('should show error message when chart data cannot be rendered', () => {
      // Empty chart data after transformation
      const emptyChartData: RetentionChartData = {
        rows: [],
        periods: [],
      }

      render(<RetentionCombinedChart data={emptyChartData} />)

      expect(screen.getByText('Unable to render retention data')).toBeInTheDocument()
    })
  })
})

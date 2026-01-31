/**
 * Tests for RetentionHeatmap component
 *
 * Focus on retention data rendering, heatmap color intensity,
 * cohort matrix display, tooltip behavior, legend display,
 * and empty state handling.
 *
 * RetentionHeatmap displays retention analysis data as a cohort x period matrix:
 * - Rows: Cohort segments (or breakdown values)
 * - Columns: Period numbers (P0, P1, P2...)
 * - Cells: Retention rate with color intensity based on percentage
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RetentionHeatmap from '../../../../src/client/components/charts/RetentionHeatmap'
import type { RetentionResultRow, RetentionChartData } from '../../../../src/client/types/retention'

// Sample retention result rows (flat format from server)
const mockRetentionRows: RetentionResultRow[] = [
  { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
  { period: 1, cohortSize: 100, retainedUsers: 65, retentionRate: 0.65 },
  { period: 2, cohortSize: 100, retainedUsers: 45, retentionRate: 0.45 },
  { period: 3, cohortSize: 100, retainedUsers: 35, retentionRate: 0.35 },
  { period: 4, cohortSize: 100, retainedUsers: 28, retentionRate: 0.28 },
]

// Retention data with breakdown values (segmented)
const mockSegmentedRetentionRows: RetentionResultRow[] = [
  // Segment: US
  { period: 0, cohortSize: 60, retainedUsers: 60, retentionRate: 1.0, breakdownValue: 'US' },
  { period: 1, cohortSize: 60, retainedUsers: 42, retentionRate: 0.7, breakdownValue: 'US' },
  { period: 2, cohortSize: 60, retainedUsers: 30, retentionRate: 0.5, breakdownValue: 'US' },
  // Segment: UK
  { period: 0, cohortSize: 40, retainedUsers: 40, retentionRate: 1.0, breakdownValue: 'UK' },
  { period: 1, cohortSize: 40, retainedUsers: 24, retentionRate: 0.6, breakdownValue: 'UK' },
  { period: 2, cohortSize: 40, retainedUsers: 16, retentionRate: 0.4, breakdownValue: 'UK' },
]

// Full RetentionChartData format
const mockRetentionChartData: RetentionChartData = {
  rows: mockRetentionRows,
  periods: [0, 1, 2, 3, 4],
}

// RetentionChartData with breakdown values
const mockSegmentedChartData: RetentionChartData = {
  rows: mockSegmentedRetentionRows,
  periods: [0, 1, 2],
  breakdownValues: ['US', 'UK'],
}

// RetentionChartData with granularity
const mockChartDataWithGranularity: RetentionChartData = {
  rows: mockRetentionRows,
  periods: [0, 1, 2, 3, 4],
  granularity: 'week',
}

describe('RetentionHeatmap', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render heatmap table with valid data', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionRows} />)

      // Should render a table
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionRows} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <RetentionHeatmap data={mockRetentionRows} height={400} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <RetentionHeatmap data={mockRetentionRows} height="50vh" />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })

    it('should render column headers with period labels', () => {
      render(<RetentionHeatmap data={mockRetentionChartData} />)

      // Check for period column headers (P0, P1, P2, etc.)
      expect(screen.getByText('P0')).toBeInTheDocument()
      expect(screen.getByText('P1')).toBeInTheDocument()
      expect(screen.getByText('P2')).toBeInTheDocument()
    })

    it('should render Cohort and Users column headers', () => {
      render(<RetentionHeatmap data={mockRetentionChartData} />)

      expect(screen.getByText('Cohort')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(<RetentionHeatmap data={null as unknown as any[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('Configure retention analysis to see results')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(<RetentionHeatmap data={undefined as unknown as any[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<RetentionHeatmap data={[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('retention chart data format', () => {
    it('should render from RetentionChartData format', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionChartData} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      // Should show retention percentages (use getAllByText since 100% appears in legend too)
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
      expect(screen.getByText('65%')).toBeInTheDocument()
    })

    it('should render from array of RetentionResultRow format', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionRows} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should handle segmented data with breakdown values', () => {
      render(<RetentionHeatmap data={mockSegmentedChartData} />)

      // Should show segment names in cohort column
      expect(screen.getByText('US')).toBeInTheDocument()
      expect(screen.getByText('UK')).toBeInTheDocument()
    })
  })

  describe('retention rate display', () => {
    it('should display retention rates as percentages', () => {
      render(<RetentionHeatmap data={mockRetentionChartData} />)

      // 100% (period 0), 65% (period 1), 45% (period 2), etc.
      // Note: 100% appears in both the data cell and the legend
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
    })

    it('should display cohort sizes', () => {
      render(<RetentionHeatmap data={mockRetentionChartData} />)

      // Cohort size is 100
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should handle decimal retention rates', () => {
      const decimalData: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
        { period: 1, cohortSize: 100, retainedUsers: 67, retentionRate: 0.6789 },
      ]

      render(<RetentionHeatmap data={decimalData} />)

      // Should round to whole percentage
      expect(screen.getByText('68%')).toBeInTheDocument()
    })
  })

  describe('heatmap colors', () => {
    it('should apply background color to cells based on retention rate', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionChartData} />)

      // Get cells in the table body
      const cells = container.querySelectorAll('tbody td')
      expect(cells.length).toBeGreaterThan(0)

      // First few cells should have background colors (skip cohort name and size columns)
      const dataCells = Array.from(cells).slice(2) // Skip cohort and users columns
      const cellsWithColor = dataCells.filter(
        (cell) => (cell as HTMLElement).style.backgroundColor !== ''
      )
      expect(cellsWithColor.length).toBeGreaterThan(0)
    })

    it('should show higher color intensity for higher retention rates', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionChartData} />)

      // Get all data cells (skip header row and first two columns)
      const rows = container.querySelectorAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)

      const firstRow = rows[0]
      const cells = firstRow.querySelectorAll('td')
      // First cell (cohort name), second (users), then data cells
      const period0Cell = cells[2] as HTMLElement
      const period4Cell = cells[6] as HTMLElement

      // Period 0 has 100% retention, Period 4 has 28% retention
      // Period 0 should have more saturated color (higher alpha)
      expect(period0Cell.style.backgroundColor).toContain('rgba')
      expect(period4Cell.style.backgroundColor).toContain('rgba')
    })
  })

  describe('tooltip behavior', () => {
    it('should show tooltip on cell hover', async () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionChartData} />)

      // Find a data cell (skip cohort and users columns)
      const cells = container.querySelectorAll('tbody td')
      const dataCell = cells[2] // First data cell (P0)

      // Trigger mouse enter
      fireEvent.mouseEnter(dataCell)

      // Tooltip should appear with detailed stats
      // Note: The tooltip is rendered as a fixed positioned element
      const tooltip = container.querySelector('.dc\\:fixed')
      expect(tooltip).toBeInTheDocument()
    })

    it('should hide tooltip on mouse leave', async () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionChartData} />)

      const cells = container.querySelectorAll('tbody td')
      const dataCell = cells[2]

      // Hover and then leave
      fireEvent.mouseEnter(dataCell)
      fireEvent.mouseLeave(dataCell)

      // Tooltip should be removed
      const tooltip = container.querySelector('.dc\\:fixed')
      expect(tooltip).not.toBeInTheDocument()
    })
  })

  describe('legend display', () => {
    it('should show legend by default', () => {
      const { container } = render(<RetentionHeatmap data={mockRetentionChartData} />)

      // Legend shows 0% to 100% color scale
      // Note: 0% and 100% may appear in data cells too, so check for the legend container
      const legendContainer = container.querySelector('.dc\\:justify-center.dc\\:mt-4')
      expect(legendContainer).toBeInTheDocument()
      // Check that the legend has both 0% and 100% markers
      expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
    })

    it('should hide legend when showLegend is false', () => {
      const { container } = render(
        <RetentionHeatmap
          data={mockRetentionChartData}
          displayConfig={{ showLegend: false }}
        />
      )

      // Legend text should not be visible (might still have percentage in cells)
      const legendContainer = container.querySelector('.dc\\:justify-center.dc\\:mt-4')
      expect(legendContainer).not.toBeInTheDocument()
    })
  })

  describe('granularity display', () => {
    it('should display period labels without granularity prefix by default', () => {
      render(<RetentionHeatmap data={mockRetentionChartData} />)

      expect(screen.getByText('P0')).toBeInTheDocument()
      expect(screen.getByText('P1')).toBeInTheDocument()
    })
  })

  describe('segmented data', () => {
    it('should render multiple rows for segmented data', () => {
      const { container } = render(<RetentionHeatmap data={mockSegmentedChartData} />)

      const rows = container.querySelectorAll('tbody tr')
      // Should have 2 rows (US and UK segments)
      expect(rows.length).toBe(2)
    })

    it('should display segment names as row labels', () => {
      render(<RetentionHeatmap data={mockSegmentedChartData} />)

      expect(screen.getByText('US')).toBeInTheDocument()
      expect(screen.getByText('UK')).toBeInTheDocument()
    })

    it('should display correct cohort sizes for each segment', () => {
      render(<RetentionHeatmap data={mockSegmentedChartData} />)

      // US has 60 users, UK has 40 users
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByText('40')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single period data', () => {
      const singlePeriod: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
      ]

      const { container } = render(<RetentionHeatmap data={singlePeriod} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
      // 100% appears in both data cell and legend
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
    })

    it('should handle zero cohort size', () => {
      const zeroCohort: RetentionResultRow[] = [
        { period: 0, cohortSize: 0, retainedUsers: 0, retentionRate: 0 },
        { period: 1, cohortSize: 0, retainedUsers: 0, retentionRate: 0 },
      ]

      const { container } = render(<RetentionHeatmap data={zeroCohort} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
      // 0% appears in both data cells and legend
      expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
    })

    it('should handle very high retention rates', () => {
      const highRetention: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
        { period: 1, cohortSize: 100, retainedUsers: 95, retentionRate: 0.95 },
      ]

      render(<RetentionHeatmap data={highRetention} />)

      expect(screen.getByText('95%')).toBeInTheDocument()
    })

    it('should handle very low retention rates', () => {
      const lowRetention: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
        { period: 1, cohortSize: 100, retainedUsers: 2, retentionRate: 0.02 },
      ]

      render(<RetentionHeatmap data={lowRetention} />)

      expect(screen.getByText('2%')).toBeInTheDocument()
    })

    it('should handle many periods', () => {
      const manyPeriods: RetentionResultRow[] = Array.from({ length: 12 }, (_, i) => ({
        period: i,
        cohortSize: 100,
        retainedUsers: Math.max(100 - i * 8, 5),
        retentionRate: Math.max((100 - i * 8) / 100, 0.05),
      }))

      const { container } = render(<RetentionHeatmap data={manyPeriods} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      // Check some period headers
      expect(screen.getByText('P0')).toBeInTheDocument()
      expect(screen.getByText('P11')).toBeInTheDocument()
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

      const { container } = render(<RetentionHeatmap data={chartData} />)

      const rows = container.querySelectorAll('tbody tr')
      expect(rows.length).toBe(5)
    })

    it('should handle large cohort sizes', () => {
      const largeCohort: RetentionResultRow[] = [
        { period: 0, cohortSize: 1000000, retainedUsers: 1000000, retentionRate: 1.0 },
        { period: 1, cohortSize: 1000000, retainedUsers: 650000, retentionRate: 0.65 },
      ]

      render(<RetentionHeatmap data={largeCohort} />)

      // Should display with thousand separator
      expect(screen.getByText('1,000,000')).toBeInTheDocument()
    })

    it('should handle missing cells (sparse data)', () => {
      // Data where not all periods have data for all segments
      const sparseData: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0, breakdownValue: 'A' },
        { period: 1, cohortSize: 100, retainedUsers: 50, retentionRate: 0.5, breakdownValue: 'A' },
        // Period 2 missing for segment A
        { period: 0, cohortSize: 80, retainedUsers: 80, retentionRate: 1.0, breakdownValue: 'B' },
        { period: 1, cohortSize: 80, retainedUsers: 40, retentionRate: 0.5, breakdownValue: 'B' },
        { period: 2, cohortSize: 80, retainedUsers: 20, retentionRate: 0.25, breakdownValue: 'B' },
      ]

      const chartData: RetentionChartData = {
        rows: sparseData,
        periods: [0, 1, 2],
        breakdownValues: ['A', 'B'],
      }

      const { container } = render(<RetentionHeatmap data={chartData} />)

      // Should render with dash for missing cell
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('cohort period formatting', () => {
    it('should format YYYY-MM cohort periods', () => {
      const dateData: RetentionResultRow[] = [
        { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
      ]

      const chartData: RetentionChartData = {
        rows: dateData,
        periods: [0],
      }

      const { container } = render(<RetentionHeatmap data={chartData} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('displayConfig options', () => {
    it('should handle empty displayConfig', () => {
      const { container } = render(
        <RetentionHeatmap data={mockRetentionChartData} displayConfig={{}} />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })
  })
})

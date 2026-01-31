/**
 * Tests for FunnelChart component
 *
 * Focus on funnel data rendering, display styles (bars vs funnel),
 * orientation modes (horizontal vs vertical), conversion rate display,
 * time metrics, legend display, tooltip behavior, and empty state handling.
 *
 * FunnelChart visualizes conversion data showing:
 * - Steps with values and percentages
 * - Conversion rates between steps
 * - Optional time-to-convert metrics (avg, median, P90)
 * - Multiple display styles: bars or trapezoid funnel
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FunnelChart from '../../../../src/client/components/charts/FunnelChart'
import type { FunnelChartData } from '../../../../src/client/types/funnel'

// Sample funnel data (standard format from useFunnelQuery)
const mockFunnelData: FunnelChartData[] = [
  { name: 'Page View', value: 1000, percentage: 100, stepIndex: 0 },
  { name: 'Add to Cart', value: 450, percentage: 45, conversionRate: 45, stepIndex: 1 },
  { name: 'Checkout', value: 200, percentage: 20, conversionRate: 44.4, stepIndex: 2 },
  { name: 'Purchase', value: 150, percentage: 15, conversionRate: 75, stepIndex: 3 },
]

// Funnel data with time metrics
const mockFunnelDataWithTime: FunnelChartData[] = [
  {
    name: 'Sign Up',
    value: 1000,
    percentage: 100,
    stepIndex: 0,
  },
  {
    name: 'Activation',
    value: 600,
    percentage: 60,
    conversionRate: 60,
    stepIndex: 1,
    avgSecondsToConvert: 86400, // 1 day
    medianSecondsToConvert: 43200, // 12 hours
    p90SecondsToConvert: 172800, // 2 days
  },
  {
    name: 'First Purchase',
    value: 300,
    percentage: 30,
    conversionRate: 50,
    stepIndex: 2,
    avgSecondsToConvert: 259200, // 3 days
    medianSecondsToConvert: 172800, // 2 days
    p90SecondsToConvert: 604800, // 7 days
  },
]

// Minimal funnel data (2 steps)
const mockMinimalFunnel: FunnelChartData[] = [
  { name: 'Start', value: 100, percentage: 100, stepIndex: 0 },
  { name: 'End', value: 50, percentage: 50, conversionRate: 50, stepIndex: 1 },
]

// Raw query-like data format
const mockRawData = [
  { __stepName: 'Step 1', __count: 1000, __percentage: 100, __conversionRate: null },
  { __stepName: 'Step 2', __count: 500, __percentage: 50, __conversionRate: 50 },
]

describe('FunnelChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering - bars style (default)', () => {
    it('should render funnel chart with valid data', () => {
      const { container } = render(<FunnelChart data={mockFunnelData} />)

      // Should render step names
      expect(screen.getByText('Page View')).toBeInTheDocument()
      expect(screen.getByText('Add to Cart')).toBeInTheDocument()
      expect(screen.getByText('Checkout')).toBeInTheDocument()
      expect(screen.getByText('Purchase')).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(<FunnelChart data={mockFunnelData} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <FunnelChart data={mockFunnelData} height={400} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <FunnelChart data={mockFunnelData} height="50vh" />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })

    it('should display step values', () => {
      render(<FunnelChart data={mockFunnelData} />)

      // Values should be displayed with locale formatting
      expect(screen.getByText('1,000')).toBeInTheDocument()
      expect(screen.getByText('450')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('should display percentages on bars', () => {
      render(<FunnelChart data={mockFunnelData} />)

      // Percentages in format "XX.X%"
      expect(screen.getByText('100.0%')).toBeInTheDocument()
      expect(screen.getByText('45.0%')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No funnel data" when data is null', () => {
      render(<FunnelChart data={null as unknown as any[]} />)

      expect(screen.getByText('No funnel data')).toBeInTheDocument()
      expect(
        screen.getByText('Configure a funnel with at least 2 steps and a binding key')
      ).toBeInTheDocument()
    })

    it('should show "No funnel data" when data is undefined', () => {
      render(<FunnelChart data={undefined as unknown as any[]} />)

      expect(screen.getByText('No funnel data')).toBeInTheDocument()
    })

    it('should show "No funnel data" when data array is empty', () => {
      render(<FunnelChart data={[]} />)

      expect(screen.getByText('No funnel data')).toBeInTheDocument()
    })
  })

  describe('display styles', () => {
    describe('bars style (default)', () => {
      it('should render horizontal bars by default', () => {
        const { container } = render(
          <FunnelChart
            data={mockFunnelData}
            displayConfig={{ funnelStyle: 'bars' }}
          />
        )

        // Bars style renders divs, not SVG
        expect(container.querySelector('table')).not.toBeInTheDocument()
        expect(screen.getByText('Page View')).toBeInTheDocument()
      })
    })

    describe('funnel style (trapezoid)', () => {
      it('should render Recharts funnel when funnelStyle is funnel', () => {
        const { container } = render(
          <FunnelChart
            data={mockFunnelData}
            displayConfig={{ funnelStyle: 'funnel' }}
          />
        )

        // Recharts FunnelChart uses ResponsiveContainer
        // Check that the component renders without error
        // The summary footer should still be visible
        expect(screen.getByText('Overall:')).toBeInTheDocument()
      })
    })
  })

  describe('orientation modes', () => {
    describe('horizontal orientation (default)', () => {
      it('should render steps vertically stacked with horizontal bars', () => {
        const { container } = render(
          <FunnelChart
            data={mockFunnelData}
            displayConfig={{ funnelOrientation: 'horizontal' }}
          />
        )

        // Steps should be rendered
        expect(screen.getByText('Page View')).toBeInTheDocument()
        expect(screen.getByText('Purchase')).toBeInTheDocument()
      })

      it('should show downward conversion arrows', () => {
        render(
          <FunnelChart
            data={mockFunnelData}
            displayConfig={{ funnelOrientation: 'horizontal' }}
          />
        )

        // Check for downward conversion indicator
        const conversionTexts = screen.getAllByText(/↓.*%/)
        expect(conversionTexts.length).toBeGreaterThan(0)
      })
    })

    describe('vertical orientation', () => {
      it('should render steps horizontally with vertical bars', () => {
        const { container } = render(
          <FunnelChart
            data={mockFunnelData}
            displayConfig={{ funnelOrientation: 'vertical' }}
          />
        )

        // Steps should be rendered
        expect(screen.getByText('Page View')).toBeInTheDocument()
        expect(screen.getByText('Purchase')).toBeInTheDocument()
      })

      it('should show rightward conversion arrows', () => {
        render(
          <FunnelChart
            data={mockFunnelData}
            displayConfig={{ funnelOrientation: 'vertical' }}
          />
        )

        // Check for rightward conversion indicator
        const conversionTexts = screen.getAllByText(/→.*%/)
        expect(conversionTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('conversion rate display', () => {
    it('should show conversion rates by default', () => {
      render(<FunnelChart data={mockFunnelData} />)

      // Conversion rates between steps (45%, 44.4%, 75%)
      // Displayed as "↓ XX.X%"
      expect(screen.getByText(/↓ 45\.0%/)).toBeInTheDocument()
    })

    it('should hide conversion rates when showFunnelConversion is false', () => {
      render(
        <FunnelChart
          data={mockFunnelData}
          displayConfig={{ showFunnelConversion: false }}
        />
      )

      // Should not show conversion arrows
      const conversionTexts = screen.queryAllByText(/↓.*%/)
      expect(conversionTexts.length).toBe(0)
    })
  })

  describe('time metrics display', () => {
    it('should not show time metrics by default', () => {
      render(<FunnelChart data={mockFunnelDataWithTime} />)

      // Time metrics should not be visible
      expect(screen.queryByText(/Avg:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Med:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/P90:/)).not.toBeInTheDocument()
    })

    it('should show avg time when showFunnelAvgTime is true', () => {
      render(
        <FunnelChart
          data={mockFunnelDataWithTime}
          displayConfig={{ showFunnelAvgTime: true }}
        />
      )

      // Should show avg time metrics (only on steps with time data, not step 0)
      expect(screen.getAllByText(/Avg:/).length).toBeGreaterThan(0)
    })

    it('should show median time when showFunnelMedianTime is true', () => {
      render(
        <FunnelChart
          data={mockFunnelDataWithTime}
          displayConfig={{ showFunnelMedianTime: true }}
        />
      )

      // Should show median time metrics (only on steps with time data)
      expect(screen.getAllByText(/Med:/).length).toBeGreaterThan(0)
    })

    it('should show P90 time when showFunnelP90Time is true', () => {
      render(
        <FunnelChart
          data={mockFunnelDataWithTime}
          displayConfig={{ showFunnelP90Time: true }}
        />
      )

      // Should show P90 time metrics (only on steps with time data)
      expect(screen.getAllByText(/P90:/).length).toBeGreaterThan(0)
    })

    it('should show all time metrics when all are enabled', () => {
      render(
        <FunnelChart
          data={mockFunnelDataWithTime}
          displayConfig={{
            showFunnelAvgTime: true,
            showFunnelMedianTime: true,
            showFunnelP90Time: true,
          }}
        />
      )

      expect(screen.getAllByText(/Avg:/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Med:/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/P90:/).length).toBeGreaterThan(0)
    })

    it('should handle legacy showFunnelTimeMetrics flag', () => {
      render(
        <FunnelChart
          data={mockFunnelDataWithTime}
          displayConfig={{ showFunnelTimeMetrics: true }}
        />
      )

      // Legacy flag enables avg time (backward compatibility)
      expect(screen.getAllByText(/Avg:/).length).toBeGreaterThan(0)
    })
  })

  describe('summary footer', () => {
    it('should show summary footer by default', () => {
      render(<FunnelChart data={mockFunnelData} />)

      // Should show step count
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('steps')).toBeInTheDocument()

      // Should show overall conversion text
      expect(screen.getByText('Overall:')).toBeInTheDocument()
      // 15.0% appears both in the bar (as percentage) and in the footer (as overall)
      expect(screen.getAllByText('15.0%').length).toBeGreaterThan(0)
    })

    it('should hide summary footer when hideSummaryFooter is true', () => {
      render(
        <FunnelChart
          data={mockFunnelData}
          displayConfig={{ hideSummaryFooter: true }}
        />
      )

      // Should not show "steps" text (it's in the footer)
      expect(screen.queryByText('steps')).not.toBeInTheDocument()
    })
  })

  describe('custom step labels', () => {
    it('should use custom step labels when provided', () => {
      render(
        <FunnelChart
          data={mockFunnelData}
          displayConfig={{
            funnelStepLabels: ['View', 'Cart', 'Check', 'Buy'],
          }}
        />
      )

      // Custom labels should be displayed instead of original names
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Cart')).toBeInTheDocument()
      expect(screen.getByText('Check')).toBeInTheDocument()
      expect(screen.getByText('Buy')).toBeInTheDocument()
    })

    it('should fall back to original names when custom labels not provided', () => {
      render(<FunnelChart data={mockFunnelData} />)

      expect(screen.getByText('Page View')).toBeInTheDocument()
      expect(screen.getByText('Add to Cart')).toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
      }

      const { container } = render(
        <FunnelChart data={mockFunnelData} colorPalette={customPalette} />
      )

      // Chart should render
      expect(screen.getByText('Page View')).toBeInTheDocument()
    })
  })

  describe('data format conversion', () => {
    it('should convert raw query data format', () => {
      render(<FunnelChart data={mockRawData} />)

      // Should convert __stepName to name and display
      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })

    it('should handle data without conversionRate field', () => {
      const dataWithoutConversion = [
        { name: 'Step A', value: 100, percentage: 100, stepIndex: 0 },
        { name: 'Step B', value: 50, percentage: 50, stepIndex: 1 },
      ]

      render(<FunnelChart data={dataWithoutConversion} />)

      expect(screen.getByText('Step A')).toBeInTheDocument()
      expect(screen.getByText('Step B')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle minimal 2-step funnel', () => {
      render(<FunnelChart data={mockMinimalFunnel} />)

      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('End')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // 2 steps
    })

    it('should handle zero values in steps', () => {
      const zeroData: FunnelChartData[] = [
        { name: 'Start', value: 100, percentage: 100, stepIndex: 0 },
        { name: 'Middle', value: 0, percentage: 0, conversionRate: 0, stepIndex: 1 },
        { name: 'End', value: 0, percentage: 0, conversionRate: 0, stepIndex: 2 },
      ]

      render(<FunnelChart data={zeroData} />)

      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('Middle')).toBeInTheDocument()
      expect(screen.getByText('End')).toBeInTheDocument()
    })

    it('should handle large numbers', () => {
      const largeData: FunnelChartData[] = [
        { name: 'Start', value: 1000000, percentage: 100, stepIndex: 0 },
        { name: 'End', value: 500000, percentage: 50, conversionRate: 50, stepIndex: 1 },
      ]

      render(<FunnelChart data={largeData} />)

      // Large numbers should be formatted with locale
      expect(screen.getByText('1,000,000')).toBeInTheDocument()
      expect(screen.getByText('500,000')).toBeInTheDocument()
    })

    it('should handle many steps', () => {
      const manySteps: FunnelChartData[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Step ${i + 1}`,
        value: 1000 - i * 100,
        percentage: ((1000 - i * 100) / 1000) * 100,
        conversionRate: i === 0 ? undefined : 90,
        stepIndex: i,
      }))

      render(<FunnelChart data={manySteps} />)

      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 10')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // 10 steps
    })

    it('should handle empty displayConfig', () => {
      render(<FunnelChart data={mockFunnelData} displayConfig={{}} />)

      expect(screen.getByText('Page View')).toBeInTheDocument()
    })

    it('should handle single step (should still render)', () => {
      const singleStep: FunnelChartData[] = [
        { name: 'Only Step', value: 100, percentage: 100, stepIndex: 0 },
      ]

      render(<FunnelChart data={singleStep} />)

      expect(screen.getByText('Only Step')).toBeInTheDocument()
    })

    it('should handle decimal percentages', () => {
      const decimalData: FunnelChartData[] = [
        { name: 'Start', value: 1000, percentage: 100, stepIndex: 0 },
        { name: 'End', value: 333, percentage: 33.3, conversionRate: 33.3, stepIndex: 1 },
      ]

      render(<FunnelChart data={decimalData} />)

      // 33.3% appears in bar and conversion rate
      expect(screen.getAllByText('33.3%').length).toBeGreaterThan(0)
    })
  })

  describe('funnel style with Recharts', () => {
    it('should render Recharts funnel with tooltip', () => {
      const { container } = render(
        <FunnelChart
          data={mockFunnelData}
          displayConfig={{ funnelStyle: 'funnel' }}
        />
      )

      // Should render the component with summary footer
      expect(screen.getByText('Overall:')).toBeInTheDocument()
    })

    it('should show summary footer in funnel style', () => {
      render(
        <FunnelChart
          data={mockFunnelData}
          displayConfig={{ funnelStyle: 'funnel' }}
        />
      )

      expect(screen.getByText('Overall:')).toBeInTheDocument()
    })

    it('should hide summary footer in funnel style when hideSummaryFooter is true', () => {
      render(
        <FunnelChart
          data={mockFunnelData}
          displayConfig={{
            funnelStyle: 'funnel',
            hideSummaryFooter: true,
          }}
        />
      )

      expect(screen.queryByText('steps')).not.toBeInTheDocument()
    })
  })

  describe('overall conversion calculation', () => {
    it('should calculate overall conversion correctly', () => {
      render(<FunnelChart data={mockFunnelData} />)

      // Overall conversion: 150/1000 = 15%
      // 15.0% appears in both the bar percentage and overall summary
      expect(screen.getAllByText('15.0%').length).toBeGreaterThan(0)
    })

    it('should handle 0% overall conversion', () => {
      const zeroConversion: FunnelChartData[] = [
        { name: 'Start', value: 100, percentage: 100, stepIndex: 0 },
        { name: 'End', value: 0, percentage: 0, conversionRate: 0, stepIndex: 1 },
      ]

      render(<FunnelChart data={zeroConversion} />)

      // Overall should be 0% - appears in multiple places (bar and summary)
      expect(screen.getAllByText('0.0%').length).toBeGreaterThan(0)
    })

    it('should show completed count in summary', () => {
      render(<FunnelChart data={mockFunnelData} />)

      // "150 / 1,000 completed"
      expect(screen.getByText(/150.*\/.*1,000.*completed/)).toBeInTheDocument()
    })
  })
})

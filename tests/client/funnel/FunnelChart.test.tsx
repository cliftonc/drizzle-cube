/**
 * Tests for FunnelChart component
 *
 * Tests the funnel visualization component including:
 * - Empty state rendering
 * - Data transformation
 * - Horizontal and vertical orientations
 * - Conversion rate display
 * - Custom labels and display options
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FunnelChart from '../../../src/client/components/charts/FunnelChart'
import type { FunnelChartData } from '../../../src/client/types/funnel'

// Mock the icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
}))

// Sample funnel chart data
const sampleFunnelData: FunnelChartData[] = [
  { name: 'Signups', value: 1000, percentage: 100, conversionRate: null, stepIndex: 0 },
  { name: 'Activations', value: 800, percentage: 80, conversionRate: 0.8, stepIndex: 1 },
  { name: 'Purchases', value: 400, percentage: 40, conversionRate: 0.5, stepIndex: 2 },
]

describe('FunnelChart', () => {
  describe('empty state', () => {
    it('should render empty state message when data is null', () => {
      render(<FunnelChart data={null as unknown as unknown[]} />)

      expect(screen.getByText('No funnel data')).toBeInTheDocument()
      expect(screen.getByText(/Configure a funnel/)).toBeInTheDocument()
    })

    it('should render empty state message when data is empty array', () => {
      render(<FunnelChart data={[]} />)

      expect(screen.getByText('No funnel data')).toBeInTheDocument()
    })

    it('should render empty state message when data is undefined', () => {
      render(<FunnelChart data={undefined as unknown as unknown[]} />)

      expect(screen.getByText('No funnel data')).toBeInTheDocument()
    })
  })

  describe('rendering with funnel data format', () => {
    it('should render all steps', () => {
      render(<FunnelChart data={sampleFunnelData} />)

      expect(screen.getByText('Signups')).toBeInTheDocument()
      expect(screen.getByText('Activations')).toBeInTheDocument()
      expect(screen.getByText('Purchases')).toBeInTheDocument()
    })

    it('should render step values', () => {
      render(<FunnelChart data={sampleFunnelData} />)

      expect(screen.getByText('1,000')).toBeInTheDocument()
      expect(screen.getByText('800')).toBeInTheDocument()
      expect(screen.getByText('400')).toBeInTheDocument()
    })

    it('should render percentages', () => {
      render(<FunnelChart data={sampleFunnelData} />)

      // Percentages appear in multiple places (bar labels and summary)
      // Use getAllByText since text can appear multiple times
      expect(screen.getAllByText('100.0%').length).toBeGreaterThan(0)
      expect(screen.getAllByText('80.0%').length).toBeGreaterThan(0)
      expect(screen.getAllByText('40.0%').length).toBeGreaterThan(0)
    })

    it('should render conversion rates between steps', () => {
      render(<FunnelChart data={sampleFunnelData} />)

      // First step has no conversion rate (null)
      const dashElements = screen.getAllByText('—')
      expect(dashElements.length).toBeGreaterThan(0)

      // Subsequent steps show conversion rates
      expect(screen.getByText('↓ 80.0%')).toBeInTheDocument()
      expect(screen.getByText('↓ 50.0%')).toBeInTheDocument()
    })
  })

  describe('summary footer', () => {
    it('should render summary footer by default', () => {
      render(<FunnelChart data={sampleFunnelData} />)

      // Shows step count
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('steps')).toBeInTheDocument()

      // Shows overall conversion rate
      expect(screen.getByText('Overall:')).toBeInTheDocument()

      // Shows completed count
      expect(screen.getByText(/400 \/ 1,000 completed/)).toBeInTheDocument()
    })

    it('should hide summary footer when hideSummaryFooter is true', () => {
      render(
        <FunnelChart
          data={sampleFunnelData}
          displayConfig={{ hideSummaryFooter: true }}
        />
      )

      expect(screen.queryByText('Overall:')).not.toBeInTheDocument()
      expect(screen.queryByText('steps')).not.toBeInTheDocument()
    })
  })

  describe('custom step labels', () => {
    it('should use custom step labels from displayConfig', () => {
      const customLabels = ['Step A', 'Step B', 'Step C']

      render(
        <FunnelChart
          data={sampleFunnelData}
          displayConfig={{ funnelStepLabels: customLabels }}
        />
      )

      expect(screen.getByText('Step A')).toBeInTheDocument()
      expect(screen.getByText('Step B')).toBeInTheDocument()
      expect(screen.getByText('Step C')).toBeInTheDocument()

      // Original names should not be displayed
      expect(screen.queryByText('Signups')).not.toBeInTheDocument()
    })
  })

  describe('orientation', () => {
    it('should render horizontal orientation by default', () => {
      const { container } = render(<FunnelChart data={sampleFunnelData} />)

      // In horizontal mode, bars are displayed with width percentages
      // Check that flex-col class is used for vertical stacking of steps
      expect(container.querySelector('.dc\\:flex-col')).toBeInTheDocument()
    })

    it('should render vertical orientation when specified', () => {
      const { container } = render(
        <FunnelChart
          data={sampleFunnelData}
          displayConfig={{ funnelOrientation: 'vertical' }}
        />
      )

      // In vertical mode, conversion rates appear above bars
      expect(screen.getByText('→ 80.0%')).toBeInTheDocument()
      expect(screen.getByText('→ 50.0%')).toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('should handle raw query results format', () => {
      const rawData = [
        { step: 'Signups', count: 100, percent: 100 },
        { step: 'Purchases', count: 50, percent: 50 },
      ]

      render(<FunnelChart data={rawData} />)

      // Should extract and display the data
      expect(screen.getByText('Signups')).toBeInTheDocument()
      expect(screen.getByText('Purchases')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should generate step names when not present', () => {
      const dataWithoutNames = [
        { value: 100, percentage: 100 },
        { value: 50, percentage: 50 },
      ]

      render(<FunnelChart data={dataWithoutNames} />)

      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })
  })

  describe('color palette', () => {
    it('should use custom colors when provided', () => {
      const customColors = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      }

      const { container } = render(
        <FunnelChart data={sampleFunnelData} colorPalette={customColors} />
      )

      // Check that custom colors are applied to bars
      const bars = container.querySelectorAll('[style*="background-color"]')
      expect(bars.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle single step data', () => {
      const singleStep: FunnelChartData[] = [
        { name: 'Only Step', value: 100, percentage: 100, conversionRate: null, stepIndex: 0 },
      ]

      render(<FunnelChart data={singleStep} />)

      expect(screen.getByText('Only Step')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('steps')).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData: FunnelChartData[] = [
        { name: 'Step 1', value: 0, percentage: 0, conversionRate: null, stepIndex: 0 },
        { name: 'Step 2', value: 0, percentage: 0, conversionRate: null, stepIndex: 1 },
      ]

      render(<FunnelChart data={zeroData} />)

      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
      // Should show 0%
      const zeroPercents = screen.getAllByText('0.0%')
      expect(zeroPercents.length).toBeGreaterThan(0)
    })

    it('should handle large numbers with locale formatting', () => {
      const largeData: FunnelChartData[] = [
        { name: 'Big Step', value: 1234567, percentage: 100, conversionRate: null, stepIndex: 0 },
      ]

      render(<FunnelChart data={largeData} />)

      // Should format with commas
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <FunnelChart data={sampleFunnelData} height="500px" />
      )

      const chartContainer = container.firstChild
      expect(chartContainer).toHaveStyle({ height: '500px' })
    })

    it('should use 100% height by default', () => {
      const { container } = render(<FunnelChart data={sampleFunnelData} />)

      const chartContainer = container.firstChild
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })
  })
})

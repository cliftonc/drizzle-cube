/**
 * Tests for the shared chart guard-state components.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  ChartEmptyState,
  ChartConfigError,
  ChartRenderError
} from '../../../../src/client/components/charts/ChartStates'

describe('ChartStates', () => {
  describe('ChartEmptyState', () => {
    it('renders the default "No data available" title', () => {
      render(<ChartEmptyState hint="No data points to display in bar chart" />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.getByText('No data points to display in bar chart')).toBeInTheDocument()
    })

    it('supports a custom title key for the post-transform state', () => {
      render(<ChartEmptyState titleKey="chart.runtime.noValidData" hint="nothing left" />)
      expect(screen.getByText('No valid data')).toBeInTheDocument()
      expect(screen.getByText('nothing left')).toBeInTheDocument()
    })

    it('omits the hint when none is provided', () => {
      const { container } = render(<ChartEmptyState />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
      // Only the title div should be present, no secondary hint line
      expect(container.querySelectorAll('div.dc\\:text-center > div').length).toBe(1)
    })
  })

  describe('ChartConfigError', () => {
    it('renders the "Configuration Error" title with a hint', () => {
      render(<ChartConfigError hint="Invalid or missing chart axis configuration" />)
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(screen.getByText('Invalid or missing chart axis configuration')).toBeInTheDocument()
    })
  })

  describe('ChartRenderError', () => {
    it('renders a chart-type-specific heading and the error message', () => {
      render(<ChartRenderError chartType="Bar Chart" error={new Error('boom')} />)
      expect(screen.getByText('Bar Chart Error')).toBeInTheDocument()
      expect(screen.getByText('boom')).toBeInTheDocument()
      expect(screen.getByText('Check the data and configuration')).toBeInTheDocument()
    })

    it('falls back to a generic message for non-Error values', () => {
      render(<ChartRenderError chartType="Pie Chart" error={'oops'} />)
      expect(screen.getByText('Pie Chart Error')).toBeInTheDocument()
      expect(screen.getByText('Unknown rendering error')).toBeInTheDocument()
    })
  })
})

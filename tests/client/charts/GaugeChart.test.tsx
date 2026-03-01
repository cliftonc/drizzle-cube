/**
 * Tests for GaugeChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import GaugeChart from '../../../src/client/components/charts/GaugeChart'

// Mock icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

// Mock hooks that require context
vi.mock('../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => field.split('.').pop() ?? field,
}))

// Mock d3-shape arc to return a deterministic path string
vi.mock('d3-shape', () => ({
  arc: () => () => 'M0,0 arc-path',
}))

const singleRow = [{ 'Metrics.value': 75, 'Metrics.max': 100 }]

const valueConfig = {
  yAxis: ['Metrics.value'],
}

const fullConfig = {
  yAxis: ['Metrics.value', 'Metrics.max'],
}

describe('GaugeChart', () => {
  describe('empty state', () => {
    it('should render empty state when data is null', () => {
      render(<GaugeChart data={null as unknown as unknown[]} chartConfig={valueConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is empty array', () => {
      render(<GaugeChart data={[]} chartConfig={valueConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is undefined', () => {
      render(<GaugeChart data={undefined as unknown as unknown[]} chartConfig={valueConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration error state', () => {
    it('should show config error when yAxis is missing', () => {
      render(<GaugeChart data={singleRow} chartConfig={{}} />)
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when yAxis is empty array', () => {
      render(<GaugeChart data={singleRow} chartConfig={{ yAxis: [] }} />)
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('basic rendering', () => {
    it('should render SVG with valid data', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.queryByText('No data available')).not.toBeInTheDocument()
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument()
      expect(screen.getByTestId('gauge-svg')).toBeInTheDocument()
    })

    it('should render track arc', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.getByTestId('gauge-track')).toBeInTheDocument()
    })

    it('should render fill arc', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.getByTestId('gauge-fill')).toBeInTheDocument()
    })

    it('should render needle', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.getByTestId('gauge-needle')).toBeInTheDocument()
    })

    it('should render min and max labels', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.getByTestId('gauge-min-label')).toBeInTheDocument()
      expect(screen.getByTestId('gauge-max-label')).toBeInTheDocument()
    })
  })

  describe('center label', () => {
    it('should render center label by default', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.getByTestId('gauge-label')).toBeInTheDocument()
      expect(screen.getByTestId('gauge-value-text')).toBeInTheDocument()
    })

    it('should hide center label when showCenterLabel is false', () => {
      render(
        <GaugeChart
          data={singleRow}
          chartConfig={valueConfig}
          displayConfig={{ showCenterLabel: false }}
        />
      )
      expect(screen.queryByTestId('gauge-label')).not.toBeInTheDocument()
    })

    it('should show field label in center', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      // useCubeFieldLabel mock returns the last segment after '.'
      expect(screen.getByText('value')).toBeInTheDocument()
    })
  })

  describe('fraction calculation', () => {
    it('should set data-fraction to ~0.75 for 75 out of 100', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      const fill = screen.getByTestId('gauge-fill')
      const fraction = parseFloat(fill.getAttribute('data-fraction') ?? '0')
      expect(fraction).toBeCloseTo(0.75, 2)
    })

    it('should clamp fraction to 0 for value below min', () => {
      const belowMin = [{ 'M.v': -10 }]
      render(
        <GaugeChart
          data={belowMin}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{ minValue: 0, maxValue: 100 }}
        />
      )
      const fill = screen.getByTestId('gauge-fill')
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '1')).toBeCloseTo(0, 4)
    })

    it('should clamp fraction to 1 for value above max', () => {
      const aboveMax = [{ 'M.v': 200 }]
      render(
        <GaugeChart
          data={aboveMax}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{ minValue: 0, maxValue: 100 }}
        />
      )
      const fill = screen.getByTestId('gauge-fill')
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '0')).toBeCloseTo(1, 4)
    })
  })

  describe('dynamic max from second yAxis field', () => {
    it('should use yAxis[1] as max field', () => {
      const row = [{ 'M.current': 50, 'M.target': 200 }]
      render(<GaugeChart data={row} chartConfig={{ yAxis: ['M.current', 'M.target'] }} />)
      const fill = screen.getByTestId('gauge-fill')
      // 50 / 200 = 0.25
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '0')).toBeCloseTo(0.25, 2)
    })

    it('should default max to 100 when no second field and no maxValue config', () => {
      const row = [{ 'M.v': 40 }]
      render(<GaugeChart data={row} chartConfig={{ yAxis: ['M.v'] }} />)
      const fill = screen.getByTestId('gauge-fill')
      // 40 / 100 = 0.4
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '0')).toBeCloseTo(0.4, 2)
    })
  })

  describe('percentage display', () => {
    it('should show percentage when showPercentage is true', () => {
      render(
        <GaugeChart
          data={singleRow}
          chartConfig={valueConfig}
          displayConfig={{ showPercentage: true }}
        />
      )
      const valueEl = screen.getByTestId('gauge-value-text')
      expect(valueEl.textContent).toMatch(/75\.0%/)
    })

    it('should show raw value when showPercentage is false', () => {
      render(
        <GaugeChart
          data={singleRow}
          chartConfig={valueConfig}
          displayConfig={{ showPercentage: false }}
        />
      )
      const valueEl = screen.getByTestId('gauge-value-text')
      expect(valueEl.textContent).toContain('75')
    })
  })

  describe('threshold bands', () => {
    it('should render band arcs when thresholds provided', () => {
      render(
        <GaugeChart
          data={singleRow}
          chartConfig={valueConfig}
          displayConfig={{
            thresholds: [
              { value: 0.33, color: '#22c55e' },
              { value: 0.66, color: '#f59e0b' },
              { value: 1.0, color: '#ef4444' },
            ],
          }}
        />
      )
      expect(screen.getByTestId('gauge-band-0')).toBeInTheDocument()
      expect(screen.getByTestId('gauge-band-1')).toBeInTheDocument()
      expect(screen.getByTestId('gauge-band-2')).toBeInTheDocument()
    })

    it('should not render band arcs when no thresholds', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.queryByTestId('gauge-band-0')).not.toBeInTheDocument()
    })

    it('should use threshold color matching the fraction', () => {
      // value=80 out of max=100 → fraction=0.8
      // Thresholds: 0.33 green, 0.66 amber, 1.0 red
      // resolveColor picks last threshold where fraction >= t.value
      // 0.8 >= 0.33 → green, 0.8 >= 0.66 → amber, 0.8 < 1.0 → stop
      // Result: amber (#f59e0b)
      const data = [{ 'M.v': 80 }]
      render(
        <GaugeChart
          data={data}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{
            thresholds: [
              { value: 0.33, color: '#22c55e' },
              { value: 0.66, color: '#f59e0b' },
              { value: 1.0, color: '#ef4444' },
            ],
          }}
        />
      )
      const fill = screen.getByTestId('gauge-fill')
      expect(fill.getAttribute('fill')).toBe('#f59e0b')
    })

    it('should filter out invalid threshold entries', () => {
      const data = [{ 'M.v': 50 }]
      render(
        <GaugeChart
          data={data}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{
            thresholds: [
              { value: 0.5, color: '#22c55e' },
              { value: 'bad', color: '#ff0000' } as any,
              null as any,
            ],
          }}
        />
      )
      // Only valid threshold should produce a band
      expect(screen.getByTestId('gauge-band-0')).toBeInTheDocument()
      expect(screen.queryByTestId('gauge-band-1')).not.toBeInTheDocument()
    })
  })

  describe('data handling', () => {
    it('should show no valid data when measure value is null', () => {
      const nullData = [{ 'M.v': null }]
      render(<GaugeChart data={nullData} chartConfig={{ yAxis: ['M.v'] }} />)
      expect(screen.getByText('No valid data')).toBeInTheDocument()
      expect(screen.queryByTestId('gauge-fill')).not.toBeInTheDocument()
    })

    it('should handle string numeric value', () => {
      const strData = [{ 'M.v': '60' }]
      render(<GaugeChart data={strData} chartConfig={{ yAxis: ['M.v'] }} />)
      const fill = screen.getByTestId('gauge-fill')
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '0')).toBeCloseTo(0.6, 2)
    })

    it('should use first row when multiple rows provided', () => {
      const multiRow = [{ 'M.v': 80 }, { 'M.v': 20 }]
      render(<GaugeChart data={multiRow} chartConfig={{ yAxis: ['M.v'] }} />)
      const fill = screen.getByTestId('gauge-fill')
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '0')).toBeCloseTo(0.8, 2)
    })
  })

  describe('edge cases', () => {
    it('should handle 0% (value == min)', () => {
      const zeroData = [{ 'M.v': 0 }]
      render(
        <GaugeChart
          data={zeroData}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{ minValue: 0, maxValue: 100 }}
        />
      )
      const fill = screen.getByTestId('gauge-fill')
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '1')).toBeCloseTo(0, 4)
    })

    it('should handle 100% (value == max)', () => {
      const fullData = [{ 'M.v': 100 }]
      render(
        <GaugeChart
          data={fullData}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{ minValue: 0, maxValue: 100 }}
        />
      )
      const fill = screen.getByTestId('gauge-fill')
      expect(parseFloat(fill.getAttribute('data-fraction') ?? '0')).toBeCloseTo(1, 4)
    })

    it('should handle min == max gracefully (no divide by zero)', () => {
      const sameData = [{ 'M.v': 50 }]
      const { container } = render(
        <GaugeChart
          data={sameData}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{ minValue: 50, maxValue: 50 }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <GaugeChart data={singleRow} chartConfig={valueConfig} height="400px" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should default to 100% height', () => {
      const { container } = render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })
  })
})

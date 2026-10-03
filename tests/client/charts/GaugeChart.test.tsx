/**
 * Tests for GaugeChart component.
 *
 * The geometry maths is covered in `gaugeChartHelpers.test.ts`; this file
 * checks the render contract: the 270° arc is drawn as one rounded band per
 * threshold (the bands *are* the arc — there is no separate progress fill),
 * the needle/hub and numeric scale labels are present, the value honours
 * `leftYAxisFormat`, and every degenerate configuration renders without
 * throwing.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import GaugeChart from '../../../src/client/components/charts/GaugeChart'
import type { ChartDisplayConfig } from '../../../src/client/types'

// Mock icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

// Mock hooks that require context
vi.mock('../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => field.split('.').pop() ?? field,
}))

const singleRow = [{ 'Metrics.value': 75, 'Metrics.max': 100 }]

const valueConfig = {
  yAxis: ['Metrics.value'],
}

/** Lower-bound thresholds, as configured on real dashboards: 0 / 0.5 / 0.7. */
const RAG = [
  { value: 0, color: '#ef4444' },
  { value: 0.5, color: '#f59e0b' },
  { value: 0.7, color: '#22c55e' },
]

function renderValue(value: unknown, displayConfig: ChartDisplayConfig = {}) {
  return render(
    <GaugeChart data={[{ 'M.v': value }]} chartConfig={{ yAxis: ['M.v'] }} displayConfig={displayConfig} />
  )
}

/** The 0–1 fraction the needle indicates, recorded on the needle path. */
function needleFraction(): number {
  return parseFloat(screen.getByTestId('gauge-needle').getAttribute('data-fraction') ?? 'NaN')
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

    it('should render the arc as threshold bands, with no track or progress fill', () => {
      render(
        <GaugeChart data={singleRow} chartConfig={valueConfig} displayConfig={{ thresholds: RAG }} />
      )
      expect(screen.getByTestId('gauge-band-0')).toHaveAttribute('fill', '#ef4444')
      expect(screen.getByTestId('gauge-band-1')).toHaveAttribute('fill', '#f59e0b')
      expect(screen.getByTestId('gauge-band-2')).toHaveAttribute('fill', '#22c55e')
      expect(screen.queryByTestId('gauge-band-3')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gauge-track')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gauge-fill')).not.toBeInTheDocument()
    })

    it('should still render a full arc when no thresholds are configured', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(screen.getByTestId('gauge-band-0')).toBeInTheDocument()
      expect(screen.queryByTestId('gauge-band-1')).not.toBeInTheDocument()
    })

    it('should render a tapered needle and a hub', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      const needle = screen.getByTestId('gauge-needle')
      // Triangle: tip, then the two base corners, then close.
      expect(needle.getAttribute('d')).toMatch(/^M[-\d.]+,[-\d.]+L[-\d.]+,[-\d.]+L[-\d.]+,[-\d.]+Z$/)
      expect(screen.getByTestId('gauge-hub')).toBeInTheDocument()
    })

    it('should render numeric scale labels at the band boundaries', () => {
      render(
        <GaugeChart
          data={[{ 'M.v': 66.937 }]}
          chartConfig={{ yAxis: ['M.v'] }}
          displayConfig={{ minValue: 0, maxValue: 100, thresholds: RAG }}
        />
      )
      expect(screen.getByTestId('gauge-tick-0')).toHaveTextContent('0')
      expect(screen.getByTestId('gauge-tick-1')).toHaveTextContent('50')
      expect(screen.getByTestId('gauge-tick-2')).toHaveTextContent('70')
      expect(screen.getByTestId('gauge-tick-3')).toHaveTextContent('100')
      expect(screen.queryByTestId('gauge-tick-4')).not.toBeInTheDocument()
    })

    it('should label min and max even with no thresholds', () => {
      renderValue(40, { minValue: 0, maxValue: 100 })
      expect(screen.getByTestId('gauge-tick-0')).toHaveTextContent('0')
      expect(screen.getByTestId('gauge-tick-1')).toHaveTextContent('100')
      expect(screen.queryByTestId('gauge-tick-2')).not.toBeInTheDocument()
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
      expect(screen.getByTestId('gauge-needle')).toBeInTheDocument()
    })

    it('should show field label in center', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      // useCubeFieldLabel mock returns the last segment after '.'
      expect(screen.getByText('value')).toBeInTheDocument()
    })

    it('should place the measure label above the value', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      const label = screen.getByTestId('gauge-field-text')
      const value = screen.getByTestId('gauge-value-text')
      expect(Number(label.getAttribute('y'))).toBeLessThan(Number(value.getAttribute('y')))
    })

    it('should keep the value smaller than the dial radius allows for dominance', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      const value = screen.getByTestId('gauge-value-text')
      const label = screen.getByTestId('gauge-field-text')
      expect(Number(value.getAttribute('font-size'))).toBeGreaterThan(
        Number(label.getAttribute('font-size'))
      )
    })
  })

  describe('value formatting', () => {
    it('should round a raw value to two decimals by default', () => {
      renderValue(66.937, { minValue: 0, maxValue: 100 })
      expect(screen.getByTestId('gauge-value-text')).toHaveTextContent('66.94')
    })

    it('should honour leftYAxisFormat', () => {
      renderValue(66.937, {
        minValue: 0,
        maxValue: 100,
        leftYAxisFormat: { unit: 'percent', decimals: 1 },
      })
      expect(screen.getByTestId('gauge-value-text')).toHaveTextContent('66.9%')
    })

    it('should apply leftYAxisFormat to the scale labels too', () => {
      renderValue(66.937, {
        minValue: 0,
        maxValue: 100,
        thresholds: RAG,
        leftYAxisFormat: { unit: 'percent', decimals: 0 },
      })
      expect(screen.getByTestId('gauge-tick-3')).toHaveTextContent('100%')
    })
  })

  describe('fraction calculation', () => {
    it('should set data-fraction to ~0.75 for 75 out of 100', () => {
      render(<GaugeChart data={singleRow} chartConfig={valueConfig} />)
      expect(needleFraction()).toBeCloseTo(0.75, 2)
    })

    it('should clamp fraction to 0 for value below min', () => {
      renderValue(-10, { minValue: 0, maxValue: 100 })
      expect(needleFraction()).toBeCloseTo(0, 4)
    })

    it('should clamp fraction to 1 for value above max', () => {
      renderValue(200, { minValue: 0, maxValue: 100 })
      expect(needleFraction()).toBeCloseTo(1, 4)
    })
  })

  describe('dynamic max from second yAxis field', () => {
    it('should use yAxis[1] as max field', () => {
      const row = [{ 'M.current': 50, 'M.target': 200 }]
      render(<GaugeChart data={row} chartConfig={{ yAxis: ['M.current', 'M.target'] }} />)
      expect(needleFraction()).toBeCloseTo(0.25, 2)
      expect(screen.getByTestId('gauge-tick-1')).toHaveTextContent('200')
    })

    it('should default max to 100 when no second field and no maxValue config', () => {
      renderValue(40)
      expect(needleFraction()).toBeCloseTo(0.4, 2)
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
      expect(screen.getByTestId('gauge-value-text').textContent).toMatch(/75\.0%/)
    })

    it('should show raw value when showPercentage is false', () => {
      render(
        <GaugeChart
          data={singleRow}
          chartConfig={valueConfig}
          displayConfig={{ showPercentage: false }}
        />
      )
      expect(screen.getByTestId('gauge-value-text').textContent).toContain('75')
    })
  })

  describe('threshold bands', () => {
    it('should treat a threshold value as the lower bound of its band', () => {
      // 0.8 sits in the [0.7, 1] green band.
      renderValue(80, { minValue: 0, maxValue: 100, thresholds: RAG })
      expect(screen.getByTestId('gauge-needle')).toHaveAttribute('data-color', '#22c55e')
    })

    it('should prepend a neutral band when the first threshold is above 0', () => {
      renderValue(50, { minValue: 0, maxValue: 100, thresholds: [{ value: 0.6, color: '#22c55e' }] })
      expect(screen.getByTestId('gauge-band-0')).toBeInTheDocument()
      expect(screen.getByTestId('gauge-band-1')).toHaveAttribute('fill', '#22c55e')
      expect(screen.queryByTestId('gauge-band-2')).not.toBeInTheDocument()
    })

    it('should accept thresholds supplied as a JSON string', () => {
      renderValue(80, { minValue: 0, maxValue: 100, thresholds: JSON.stringify(RAG) })
      expect(screen.getByTestId('gauge-band-2')).toHaveAttribute('fill', '#22c55e')
    })

    it('should render with malformed threshold JSON', () => {
      renderValue(50, { minValue: 0, maxValue: 100, thresholds: 'not json' })
      expect(screen.getByTestId('gauge-svg')).toBeInTheDocument()
      expect(screen.getByTestId('gauge-band-0')).toBeInTheDocument()
    })

    it('should filter out invalid threshold entries', () => {
      // Fed as JSON so genuinely malformed runtime entries reach the parser.
      renderValue(50, {
        thresholds: JSON.stringify([
          { value: 0.5, color: '#22c55e' },
          { value: 'bad', color: '#ff0000' },
          { value: 0.2 },
          null,
        ]),
      })
      // Only the valid threshold survives: neutral lead-in band + green band.
      expect(screen.getByTestId('gauge-band-1')).toHaveAttribute('fill', '#22c55e')
      expect(screen.queryByTestId('gauge-band-2')).not.toBeInTheDocument()
    })
  })

  describe('data handling', () => {
    it('should show no valid data when measure value is null', () => {
      renderValue(null)
      expect(screen.getByText('No valid data')).toBeInTheDocument()
      expect(screen.queryByTestId('gauge-svg')).not.toBeInTheDocument()
    })

    it.each([
      ['NaN', NaN],
      ['non-numeric string', 'abc'],
      ['missing', undefined],
    ])('should show no valid data for a %s value', (_label, value) => {
      renderValue(value)
      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })

    it('should handle string numeric value', () => {
      renderValue('60')
      expect(needleFraction()).toBeCloseTo(0.6, 2)
    })

    it('should use first row when multiple rows provided', () => {
      const multiRow = [{ 'M.v': 80 }, { 'M.v': 20 }]
      render(<GaugeChart data={multiRow} chartConfig={{ yAxis: ['M.v'] }} />)
      expect(needleFraction()).toBeCloseTo(0.8, 2)
    })
  })

  describe('edge cases', () => {
    it('should handle 0% (value == min)', () => {
      renderValue(0, { minValue: 0, maxValue: 100 })
      expect(needleFraction()).toBeCloseTo(0, 4)
    })

    it('should handle 100% (value == max)', () => {
      renderValue(100, { minValue: 0, maxValue: 100 })
      expect(needleFraction()).toBeCloseTo(1, 4)
    })

    it('should handle min == max gracefully (no divide by zero)', () => {
      renderValue(50, { minValue: 50, maxValue: 50 })
      expect(needleFraction()).toBe(0)
      expect(screen.getByTestId('gauge-needle').getAttribute('d')).not.toMatch(/NaN/)
    })

    it('should never emit NaN geometry for any of the degenerate ranges', () => {
      const ranges: ChartDisplayConfig[] = [
        { minValue: 0, maxValue: 0 },
        { minValue: 100, maxValue: 0 },
        { minValue: 0, maxValue: 100, thresholds: [] },
        { minValue: 0, maxValue: 100, thresholds: RAG },
      ]
      for (const displayConfig of ranges) {
        const { container, unmount } = render(
          <GaugeChart
            data={[{ 'M.v': 66.937 }]}
            chartConfig={{ yAxis: ['M.v'] }}
            displayConfig={displayConfig}
          />
        )
        expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
        unmount()
      }
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

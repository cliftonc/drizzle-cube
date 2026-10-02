/**
 * Tests for ProportionBarChart — the 100% stacked horizontal bar.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProportionBarChart from '../../../src/client/components/charts/ProportionBarChart'

vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

vi.mock('../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => field.split('.').pop() ?? field,
}))

const config = { xAxis: ['Work.category'], yAxis: ['Work.count'] }

const workMix = [
  { 'Work.category': 'Features', 'Work.count': 45 },
  { 'Work.category': 'Tests', 'Work.count': 31 },
  { 'Work.category': 'Fixes', 'Work.count': 24 },
]

describe('ProportionBarChart', () => {
  describe('empty and error states', () => {
    it('renders an empty state with no data', () => {
      render(<ProportionBarChart data={[]} chartConfig={config} />)
      expect(screen.queryByTestId('proportion-bar')).not.toBeInTheDocument()
    })

    it('renders a config error when the dimension is missing', () => {
      render(<ProportionBarChart data={workMix} chartConfig={{ yAxis: ['Work.count'] }} />)
      expect(screen.queryByTestId('proportion-bar')).not.toBeInTheDocument()
    })

    it('renders an empty state when every value is zero or negative', () => {
      render(
        <ProportionBarChart
          data={[{ 'Work.category': 'A', 'Work.count': 0 }, { 'Work.category': 'B', 'Work.count': -5 }]}
          chartConfig={config}
        />
      )
      expect(screen.queryByTestId('proportion-bar')).not.toBeInTheDocument()
    })
  })

  describe('rendering', () => {
    it('renders one segment per category', () => {
      render(<ProportionBarChart data={workMix} chartConfig={config} />)
      expect(screen.getAllByTestId('proportion-bar-segment')).toHaveLength(3)
    })

    it('sizes segments by their share of the total', () => {
      render(<ProportionBarChart data={workMix} chartConfig={config} />)
      const [features] = screen.getAllByTestId('proportion-bar-segment')
      expect(features.style.width).toBe('45%')
    })

    it('shows category labels and percentages', () => {
      render(<ProportionBarChart data={workMix} chartConfig={config} />)
      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('31%')).toBeInTheDocument()
    })

    it('honours the decimals option', () => {
      render(
        <ProportionBarChart data={workMix} chartConfig={config} displayConfig={{ decimals: 1 }} />
      )
      expect(screen.getByText('45.0%')).toBeInTheDocument()
    })

    it('hides labels and percentages when both are turned off', () => {
      render(
        <ProportionBarChart
          data={workMix}
          chartConfig={config}
          displayConfig={{ showLabels: false, showPercentages: false }}
        />
      )
      expect(screen.getByTestId('proportion-bar')).toBeInTheDocument()
      expect(screen.queryByText('Features')).not.toBeInTheDocument()
      expect(screen.queryByText('45%')).not.toBeInTheDocument()
    })

    it('keeps query order by default and sorts largest-first on request', () => {
      const unsorted = [
        { 'Work.category': 'Small', 'Work.count': 10 },
        { 'Work.category': 'Large', 'Work.count': 90 },
      ]
      const { unmount } = render(<ProportionBarChart data={unsorted} chartConfig={config} />)
      expect(screen.getAllByTestId('proportion-bar-segment')[0].style.width).toBe('10%')
      unmount()

      render(
        <ProportionBarChart data={unsorted} chartConfig={config} displayConfig={{ sortSegments: true }} />
      )
      expect(screen.getAllByTestId('proportion-bar-segment')[0].style.width).toBe('90%')
    })

    it('gives React unique keys when categories repeat', () => {
      // Labels are not reliably unique: a query can return duplicates, and
      // every null collapses to the same empty string. Keying on the label
      // alone handed React duplicate keys, which can reconcile a segment
      // against the wrong sibling and mis-associate width with colour.
      //
      // Asserting on the rendered DOM does not catch this - duplicate keys
      // still render correctly on first mount - so assert on the warning React
      // raises, which is the actual signal.
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        render(
          <ProportionBarChart
            data={[
              { 'Work.category': 'Features', 'Work.count': 30 },
              { 'Work.category': 'Features', 'Work.count': 20 },
              { 'Work.category': null, 'Work.count': 10 },
              { 'Work.category': null, 'Work.count': 40 },
            ]}
            chartConfig={config}
          />
        )
        const warnings = spy.mock.calls.map(args => args.join(' ')).join('\n')
        expect(warnings).not.toMatch(/same key/i)
      } finally {
        spy.mockRestore()
      }
    })

    it('renders every segment when categories repeat', () => {
      const duplicated = [
        { 'Work.category': 'Features', 'Work.count': 30 },
        { 'Work.category': 'Features', 'Work.count': 20 },
        { 'Work.category': 'Fixes', 'Work.count': 50 },
      ]
      render(<ProportionBarChart data={duplicated} chartConfig={config} />)
      const segments = screen.getAllByTestId('proportion-bar-segment')
      expect(segments).toHaveLength(3)
      expect(segments.map(s => s.style.width)).toEqual(['30%', '20%', '50%'])
    })

    it('renders segments whose category is null or blank', () => {
      const withBlanks = [
        { 'Work.category': null, 'Work.count': 40 },
        { 'Work.category': null, 'Work.count': 60 },
      ]
      render(<ProportionBarChart data={withBlanks} chartConfig={config} />)
      expect(screen.getAllByTestId('proportion-bar-segment')).toHaveLength(2)
    })

    it('keeps width and colour together when duplicates are sorted', () => {
      const duplicated = [
        { 'Work.category': 'Dup', 'Work.count': 10 },
        { 'Work.category': 'Dup', 'Work.count': 70 },
        { 'Work.category': 'Dup', 'Work.count': 20 },
      ]
      render(
        <ProportionBarChart
          data={duplicated}
          chartConfig={config}
          displayConfig={{ sortSegments: true }}
        />
      )
      const segments = screen.getAllByTestId('proportion-bar-segment')
      expect(segments.map(s => s.style.width)).toEqual(['70%', '20%', '10%'])
      // distinct colours, i.e. no two segments collapsed onto one identity
      const colours = new Set(segments.map(s => s.style.backgroundColor))
      expect(colours.size).toBe(3)
    })

    it('excludes non-positive rows from the breakdown', () => {
      render(
        <ProportionBarChart
          data={[...workMix, { 'Work.category': 'Void', 'Work.count': -3 }]}
          chartConfig={config}
        />
      )
      expect(screen.getAllByTestId('proportion-bar-segment')).toHaveLength(3)
      expect(screen.queryByText('Void')).not.toBeInTheDocument()
    })
  })
})

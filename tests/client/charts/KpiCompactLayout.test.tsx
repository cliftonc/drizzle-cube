/**
 * Tests for the compact KPI layout shared by KpiNumber and KpiDelta.
 *
 * The point of `layout: 'compact'` is that nothing scales with the container —
 * so these assert on the fixed type scale and on the pieces the reference
 * design calls for (coloured delta, before/after sub-line). The label
 * deliberately matches the default KPI layout so the two read as a set.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KpiNumber from '../../../src/client/components/charts/KpiNumber'
import KpiDelta from '../../../src/client/components/charts/KpiDelta'

vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

vi.mock('../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => field.split('.').pop() ?? field,
}))

const valueConfig = { yAxis: ['Metrics.engineers'] }

const series = [
  { 'Metrics.engineers': 160 },
  { 'Metrics.engineers': 140 },
]

describe('KPI compact layout', () => {
  describe('KpiNumber', () => {
    it('renders the value at the fixed compact size rather than a container-derived one', () => {
      render(
        <KpiNumber
          data={[{ 'Metrics.engineers': 604 }]}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact' }}
        />
      )
      const value = screen.getByText('604')
      expect(value).toBeInTheDocument()
      expect(value.style.fontSize).toBe('30px')
    })

    it('renders the suffix next to the value', () => {
      render(
        <KpiNumber
          data={[{ 'Metrics.engineers': 604 }]}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact', suffix: 'FTE' }}
        />
      )
      expect(screen.getByText('FTE')).toBeInTheDocument()
    })

    it('shows the target comparison as the detail line', () => {
      render(
        <KpiNumber
          data={[{ 'Metrics.engineers': 604 }]}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact', target: '500' }}
        />
      )
      expect(screen.getByText(/vs 500/)).toBeInTheDocument()
    })

    it('styles the label like the default KPI layout', () => {
      render(
        <KpiNumber
          data={[{ 'Metrics.engineers': 604 }]}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact' }}
        />
      )
      const label = screen.getByText('engineers')
      expect(label.parentElement?.className).toContain('dc:font-bold')
      expect(label.parentElement?.className).toContain('text-dc-text-secondary')
      expect(label.parentElement?.className).not.toContain('uppercase')
      expect(label.parentElement?.style.fontSize).toBe('14px')
    })

    it('falls back to the auto layout when layout is not set', () => {
      render(
        <KpiNumber
          data={[{ 'Metrics.engineers': 604 }]}
          chartConfig={valueConfig}
          displayConfig={{}}
        />
      )
      // Auto layout derives its font size from the measured container, which is
      // 0x0 in jsdom, so it clamps to the hook's minimum rather than 30px.
      expect(screen.getByText('604').style.fontSize).not.toBe('30px')
    })
  })

  describe('KpiDelta', () => {
    it('keeps the latest value as the headline and puts the delta beside it', () => {
      render(
        <KpiDelta
          data={series}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact', decimals: 0 }}
        />
      )
      expect(screen.getByText('140').style.fontSize).toBe('30px')
      expect(screen.getByText(/-12\.5%/)).toBeInTheDocument()
    })

    it('renders the before/after pair when showBaseline is on', () => {
      render(
        <KpiDelta
          data={series}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact', showBaseline: true, decimals: 0 }}
        />
      )
      expect(screen.getByText('160 → 140')).toBeInTheDocument()
    })

    it('omits the before/after pair by default', () => {
      render(
        <KpiDelta
          data={series}
          chartConfig={valueConfig}
          displayConfig={{ layout: 'compact', decimals: 0 }}
        />
      )
      expect(screen.queryByText('160 → 140')).not.toBeInTheDocument()
    })
  })
})

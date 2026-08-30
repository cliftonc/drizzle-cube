/**
 * The threshold-bands editor for the gauge.
 *
 * A band's `value` is persisted as a 0-1 fraction of the gauge's min->max
 * range, but is edited in the gauge's own units. That conversion is the part
 * that fails silently, so it is pinned here in both directions.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DisplayOptionControl from '../../../../src/client/components/AnalysisBuilder/DisplayOptionControl'
import type { DisplayOptionConfig } from '../../../../src/client/charts/chartConfigs'
import type { ChartDisplayConfig } from '../../../../src/client/types'

const option: DisplayOptionConfig = {
  key: 'thresholds',
  label: 'chart.configText.threshold_bands',
  type: 'thresholdBands',
}

function renderControl(displayConfig: ChartDisplayConfig) {
  const onDisplayConfigChange = vi.fn()
  const view = render(
    <DisplayOptionControl
      option={option}
      displayConfig={displayConfig}
      onDisplayConfigChange={onDisplayConfigChange}
    />
  )
  return { onDisplayConfigChange, ...view }
}

/** The last `thresholds` value the control committed. */
const committed = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls[spy.mock.calls.length - 1][0].thresholds

describe('ThresholdBandsOption', () => {
  const bands = [
    { value: 0, color: '#ef4444' },
    { value: 0.5, color: '#f59e0b' },
    { value: 0.7, color: '#22c55e' },
  ]

  it('shows band boundaries on the gauge scale, not as raw fractions', () => {
    renderControl({ thresholds: bands, minValue: 0, maxValue: 100 })

    const inputs = screen.getAllByLabelText('Band starts at') as HTMLInputElement[]
    expect(inputs.map(i => i.value)).toEqual(['0', '50', '70'])
  })

  it('maps the scale onto a range that does not start at zero', () => {
    renderControl({ thresholds: [{ value: 0.5, color: '#f59e0b' }], minValue: 50, maxValue: 150 })

    const input = screen.getByLabelText('Band starts at') as HTMLInputElement
    expect(input.value).toBe('100')
  })

  it('converts an edited value back to a fraction', () => {
    const { onDisplayConfigChange } = renderControl({ thresholds: bands, minValue: 0, maxValue: 200 })

    const inputs = screen.getAllByLabelText('Band starts at')
    fireEvent.change(inputs[1], { target: { value: '150' } })

    // 150 of 200 is 0.75, which re-sorts above the 0.7 band.
    const values = committed(onDisplayConfigChange).map((b: { value: number }) => b.value)
    expect(values[2]).toBeCloseTo(0.75)
    expect(values).toHaveLength(3)
  })

  it('accepts a JSON string, which is how older configs stored it', () => {
    renderControl({ thresholds: JSON.stringify(bands), minValue: 0, maxValue: 100 })

    expect(screen.getAllByLabelText('Band starts at')).toHaveLength(3)
  })

  it('keeps bands ordered when one is dragged past another', () => {
    const { onDisplayConfigChange } = renderControl({ thresholds: bands, minValue: 0, maxValue: 100 })

    const inputs = screen.getAllByLabelText('Band starts at')
    fireEvent.change(inputs[0], { target: { value: '90' } })

    expect(committed(onDisplayConfigChange).map((b: { value: number }) => b.value))
      .toEqual([0.5, 0.7, 0.9])
  })

  it('adds and removes bands', () => {
    const { onDisplayConfigChange } = renderControl({ thresholds: bands, minValue: 0, maxValue: 100 })

    fireEvent.click(screen.getByText('Add band'))
    expect(committed(onDisplayConfigChange)).toHaveLength(4)

    fireEvent.click(screen.getAllByTitle('Remove band')[0])
    expect(committed(onDisplayConfigChange)).toHaveLength(2)
  })

  it('clears the option rather than storing an empty list', () => {
    const { onDisplayConfigChange } = renderControl({
      thresholds: [{ value: 0, color: '#ef4444' }],
      minValue: 0,
      maxValue: 100,
    })

    fireEvent.click(screen.getAllByTitle('Remove band')[0])
    expect(committed(onDisplayConfigChange)).toBeUndefined()
  })

  it('falls back to editing the fraction when the range has no span', () => {
    // min === max would otherwise divide by zero and render NaN.
    renderControl({ thresholds: [{ value: 0.5, color: '#f59e0b' }], minValue: 10, maxValue: 10 })

    const input = screen.getByLabelText('Band starts at') as HTMLInputElement
    expect(input.value).toBe('0.5')
  })

  it('renders nothing but the add button when no bands are configured', () => {
    renderControl({ minValue: 0, maxValue: 100 })

    expect(screen.queryAllByLabelText('Band starts at')).toHaveLength(0)
    expect(screen.getByText('Add band')).toBeInTheDocument()
  })
})

import { arc } from 'd3-shape'
import { formatAxisValue } from '../../utils/chartUtils'
import type { AxisFormatConfig, ThresholdBand } from '../../types'

/**
 * Co-located helpers for GaugeChart: pure geometry/value math and threshold
 * parsing extracted from the component so the render body stays flat. Pure
 * extraction — no behaviour change.
 */

export const START_ANGLE = -Math.PI * 0.75
export const END_ANGLE = Math.PI * 0.75
export const TRACK_COLOR = '#e2e8f0'
export const DEFAULT_FILL = '#6366f1'

export function parseNum(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function valueToAngle(value: number, min: number, max: number): number {
  const span = max === min ? 1 : max - min
  const t = clamp((value - min) / span, 0, 1)
  return START_ANGLE + t * (END_ANGLE - START_ANGLE)
}

export function resolveColor(fraction: number, thresholds: ThresholdBand[]): string {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value)
  let color = DEFAULT_FILL
  for (const t of sorted) {
    if (fraction >= t.value) color = t.color
  }
  return color
}

export function buildArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const pathFn = arc()
  return pathFn({ innerRadius, outerRadius, startAngle, endAngle }) ?? ''
}

function isThresholdBand(entry: unknown): entry is ThresholdBand {
  return (
    entry !== null &&
    typeof entry === 'object' &&
    typeof (entry as ThresholdBand).value === 'number' &&
    typeof (entry as ThresholdBand).color === 'string'
  )
}

/** Parse the displayConfig.thresholds value (array or JSON string) into bands. */
export function parseThresholds(raw: unknown): ThresholdBand[] {
  let arr: unknown[] | null = null
  if (Array.isArray(raw)) {
    arr = raw
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) arr = parsed
    } catch (e) {
      console.warn('GaugeChart: invalid threshold JSON', e)
      return []
    }
  }
  if (!arr) return []
  return arr.filter(isThresholdBand)
}

export interface ThresholdArcBand {
  color: string
  start: number
  end: number
}

/** Build the outer-ring threshold arc bands (in fraction space 0..1). */
export function buildThresholdBands(thresholds: ThresholdBand[]): ThresholdArcBand[] {
  if (thresholds.length === 0) return []
  const sorted = [...thresholds].sort((a, b) => a.value - b.value)
  return sorted.map((t, i) => ({
    color: t.color,
    start: i === 0 ? START_ANGLE : valueToAngle(sorted[i - 1].value, 0, 1),
    end: valueToAngle(t.value, 0, 1)
  }))
}

export interface GaugeGeometry {
  effectiveMax: number
  clampedValue: number
  fraction: number
  fillColor: string
  fillAngle: number
  needleAngle: number
}

/** Compute the gauge's clamped value, fraction, fill colour, and angles. */
export function computeGaugeGeometry(
  rawValue: number,
  minValue: number,
  maxValue: number,
  thresholds: ThresholdBand[]
): GaugeGeometry {
  const effectiveMax = maxValue === minValue ? minValue + 1 : maxValue
  const clampedValue = clamp(rawValue, minValue, effectiveMax)
  const fraction = (clampedValue - minValue) / (effectiveMax - minValue)
  const fillColor = thresholds.length > 0 ? resolveColor(fraction, thresholds) : DEFAULT_FILL
  const angle = valueToAngle(clampedValue, minValue, effectiveMax)
  return { effectiveMax, clampedValue, fraction, fillColor, fillAngle: angle, needleAngle: angle }
}

/** Format a gauge value with the optional axis format, else locale string. */
export function formatGaugeValue(value: number, yAxisFormat?: AxisFormatConfig): string {
  return yAxisFormat ? formatAxisValue(value, yAxisFormat) : value.toLocaleString()
}

/**
 * Co-located helpers for KpiDelta.
 *
 * Pure data-shaping + colour resolution extracted from the component. No
 * behaviour change — these mirror the original inline logic exactly.
 */
import type { ChartAxisConfig } from '../../types'

/** Coerce a config axis value (string | array | undefined) to a field list. */
export function toFieldList(axis: ChartAxisConfig['yAxis']): string[] {
  if (!axis) return []
  return Array.isArray(axis) ? axis : [axis]
}

/** Sort rows ascending by the dimension field (stable when absent). */
export function sortByDimension<T extends Record<string, any>>(
  data: T[],
  dimensionField: string | undefined
): T[] {
  const sorted = [...data]
  if (!dimensionField) return sorted
  return sorted.sort((a, b) => {
    const aVal = a[dimensionField]
    const bVal = b[dimensionField]
    if (aVal < bVal) return -1
    if (aVal > bVal) return 1
    return 0
  })
}

/** Extract finite numeric values for a field. */
export function extractNumericValues(
  rows: Record<string, any>[],
  valueField: string
): number[] {
  return rows
    .map((row) => row[valueField])
    .filter((val) => val !== null && val !== undefined && !isNaN(Number(val)))
    .map((val) => Number(val))
}

export interface DeltaStats {
  lastValue: number
  absoluteChange: number
  percentageChange: number
  isPositiveChange: boolean
}

/** Compute last value + delta vs the previous value. Requires >= 2 values. */
export function computeDelta(values: number[]): DeltaStats {
  const lastValue = values[values.length - 1]
  const secondLastValue = values[values.length - 2]
  const absoluteChange = lastValue - secondLastValue
  const percentageChange =
    secondLastValue !== 0 ? (absoluteChange / Math.abs(secondLastValue)) * 100 : 0
  return {
    lastValue,
    absoluteChange,
    percentageChange,
    isPositiveChange: absoluteChange >= 0
  }
}

/**
 * Resolve a palette colour by index, falling back to a default. Used for both
 * the positive and negative delta colours.
 */
export function resolvePaletteColor(
  colorIndex: number | undefined,
  colors: string[] | undefined,
  fallback: string
): string {
  if (colorIndex !== undefined && colors) {
    if (colorIndex >= 0 && colorIndex < colors.length) {
      return colors[colorIndex]
    }
  }
  return fallback
}

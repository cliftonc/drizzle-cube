/**
 * Co-located helpers for KpiNumber.
 *
 * Pure data-shaping + formatting extracted from the component to keep the
 * render function lean. No behaviour change — these mirror the original inline
 * logic exactly.
 */
import type { ChartAxisConfig, ChartDisplayConfig } from '../../types'

/** Extract the value field list from chart config (string | array | undefined). */
export function getKpiValueFields(yAxis: ChartAxisConfig['yAxis']): string[] {
  if (!yAxis) return []
  if (typeof yAxis === 'string') return [yAxis]
  if (Array.isArray(yAxis)) return yAxis
  return []
}

/** Sort rows ascending by the time-dimension field (stable when absent). */
export function sortKpiData<T extends Record<string, any>>(
  data: T[] | undefined,
  timeDimensionField: string | undefined
): T[] {
  if (!data || data.length === 0) return []
  const sorted = [...data]
  if (!timeDimensionField) return sorted
  return sorted.sort((a, b) => {
    const aVal = a[timeDimensionField]
    const bVal = b[timeDimensionField]
    if (aVal < bVal) return -1
    if (aVal > bVal) return 1
    return 0
  })
}

/**
 * Extract numeric values for the configured field, falling back to the first
 * numeric field on each row when the configured field is absent.
 */
export function extractKpiValues(
  dataToUse: Record<string, any>[],
  valueField: string
): number[] {
  if (!valueField || dataToUse.length === 0) return []

  const rawValues = dataToUse.map(row => {
    if (row[valueField] !== undefined) {
      return row[valueField]
    }
    const numericFields = Object.keys(row).filter(key =>
      typeof row[key] === 'number' && !isNaN(row[key])
    )
    if (numericFields.length > 0) {
      return row[numericFields[0]]
    }
    return undefined
  })

  return rawValues
    .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
    .map(val => Number(val))
}

/** Compute avg/min/max over a numeric series (0s when empty). */
export function computeKpiStats(values: number[]): { avg: number; min: number; max: number } {
  if (values.length === 0) return { avg: 0, min: 0, max: 0 }
  const sum = values.reduce((acc, val) => acc + val, 0)
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values)
  }
}

/**
 * Format a numeric KPI value with thousands/millions/billions suffixes,
 * honouring a custom `formatValue`, `decimals` and `prefix` from displayConfig.
 */
export function formatKpiNumber(
  value: number | null | undefined,
  displayConfig: ChartDisplayConfig
): string {
  if (displayConfig.formatValue) {
    return displayConfig.formatValue(value)
  }

  if (value === null || value === undefined) {
    return '—'
  }

  const decimals = displayConfig.decimals ?? 0
  const prefix = displayConfig.prefix ?? ''

  let formattedValue: string

  if (Math.abs(value) >= 1e9) {
    formattedValue = (value / 1e9).toFixed(decimals) + 'B'
  } else if (Math.abs(value) >= 1e6) {
    formattedValue = (value / 1e6).toFixed(decimals) + 'M'
  } else if (Math.abs(value) >= 1e3) {
    formattedValue = (value / 1e3).toFixed(decimals) + 'K'
  } else {
    formattedValue = value.toFixed(decimals)
  }

  return prefix + formattedValue
}

/**
 * Resolve the label to display for a KPI field: prefer the resolved field label,
 * but fall back to the raw field name when the label looks empty/too short.
 */
export function resolveDisplayLabel(label: string | undefined, fieldName: string): string {
  return label && label.length > 1 ? label : fieldName
}

/** Resolve the main value colour from the palette / displayConfig overrides. */
export function resolveValueColor(
  valueColorIndex: number | undefined,
  colors: string[] | undefined
): string {
  if (valueColorIndex !== undefined && colors) {
    if (valueColorIndex >= 0 && valueColorIndex < colors.length) {
      return colors[valueColorIndex]
    }
  }
  return colors?.[0] || '#1f2937'
}

/** Resolve the variance colour (green/red based on sign), with palette overrides. */
export function resolveVarianceColor(
  variance: number | null,
  positiveColorIndex: number | undefined,
  negativeColorIndex: number | undefined,
  colors: string[] | undefined
): string {
  if (variance === null) return '#6B7280'
  if (variance >= 0) {
    const positiveIndex = positiveColorIndex ?? 1
    return colors?.[positiveIndex] || '#10B981'
  }
  const negativeIndex = negativeColorIndex ?? 7
  return colors?.[negativeIndex] || '#EF4444'
}

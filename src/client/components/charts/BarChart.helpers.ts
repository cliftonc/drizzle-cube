/**
 * Co-located helpers for BarChart.
 *
 * Pure decisions about stacking and bar colouring extracted from the component
 * render body. No behaviour change — these mirror the original inline logic.
 */
import { isValidNumericValue } from '../../utils/chartUtils.js'
import type { ChartDisplayConfig } from '../../types.js'

export interface StackMode {
  shouldStack: boolean
  isPercentStack: boolean
}

/** Derive stacking flags from `stackType` (new) or `stacked` (legacy). */
export function resolveStackMode(displayConfig: ChartDisplayConfig | undefined): StackMode {
  const stackType = displayConfig?.stackType ?? (displayConfig?.stacked ? 'normal' : 'none')
  return {
    shouldStack: stackType !== 'none',
    isPercentStack: stackType === 'percent'
  }
}

/**
 * Filter out rows where every series value is null, returning the kept rows and
 * the number skipped (used to render the "N hidden" footer note).
 */
export function filterEmptyRows(
  transformedData: Record<string, any>[],
  seriesKeys: string[]
): { chartData: Record<string, any>[]; skippedCount: number } {
  if (transformedData.length === 0 || seriesKeys.length === 0) {
    return { chartData: [], skippedCount: 0 }
  }
  const filtered = transformedData.filter(row =>
    seriesKeys.some(key => isValidNumericValue(row[key]))
  )
  return { chartData: filtered, skippedCount: transformedData.length - filtered.length }
}

export interface BarColoringMode {
  /** Single series with mixed positive/negative values → green/red bars. */
  usePositiveNegativeColoring: boolean
  /** Single measure, no series dimension, multiple categories → colour per category. */
  useColorByCategory: boolean
}

/** Decide which special per-bar colouring mode (if any) applies. */
export function resolveBarColoringMode(
  seriesKeys: string[],
  chartData: Record<string, any>[],
  seriesFieldsLength: number
): BarColoringMode {
  const usePositiveNegativeColoring =
    seriesKeys.length === 1 &&
    chartData.some(row => {
      const value = row[seriesKeys[0]]
      return typeof value === 'number' && value < 0
    })

  const useColorByCategory =
    seriesKeys.length === 1 &&
    !usePositiveNegativeColoring &&
    !seriesFieldsLength &&
    chartData.length > 1

  return { usePositiveNegativeColoring, useColorByCategory }
}

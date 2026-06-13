/**
 * Measure window-function classification.
 *
 * Pure, SQL-free helpers for classifying measures (window vs aggregate,
 * post-aggregation windows, base-measure dependencies). These live outside the
 * `builders/` (SQL-generation) layer so the planning layer can classify measures
 * without depending on a SQL builder. `MeasureBuilder` re-exposes these as static
 * methods for the physical-plan/builder call sites.
 */

import type { Cube } from './types'

/**
 * Measure types that are window functions. Window functions require special
 * handling: no GROUP BY in the CTE, no re-aggregation in the outer query, and
 * they return individual rows rather than grouped results.
 */
export const WINDOW_FUNCTION_TYPES = [
  'lag', 'lead', 'rank', 'denseRank', 'rowNumber',
  'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'
] as const

/** Check if a measure type is a window function. */
export function isWindowFunction(measureType: string): boolean {
  return (WINDOW_FUNCTION_TYPES as readonly string[]).includes(measureType)
}

/**
 * Check if a measure is a post-aggregation window function.
 * Post-aggregation windows reference a base `measure` in their windowConfig,
 * indicating they operate on aggregated data rather than raw rows.
 */
export function isPostAggregationWindow(measure: any): boolean {
  return (
    isWindowFunction(measure.type) &&
    measure.windowConfig?.measure !== undefined
  )
}

/**
 * Resolve the base-measure reference for a post-aggregation window function to a
 * fully qualified name (e.g. 'totalRevenue' -> 'Sales.totalRevenue').
 * Returns null when the measure is not a post-aggregation window.
 */
export function getWindowBaseMeasure(measure: any, cubeName: string): string | null {
  if (!measure.windowConfig?.measure) {
    return null
  }
  const ref = measure.windowConfig.measure
  return ref.includes('.') ? ref : `${cubeName}.${ref}`
}

/**
 * Default operation for a window function type.
 * - lag/lead default to 'difference' (compare current vs previous/next)
 * - all others default to 'raw'
 */
export function getDefaultWindowOperation(windowType: string): 'raw' | 'difference' | 'ratio' | 'percentChange' {
  switch (windowType) {
    case 'lag':
    case 'lead':
      return 'difference'
    default:
      return 'raw'
  }
}

/**
 * Categorize measures for post-aggregation window-function handling.
 * - aggregateMeasures: regular aggregates (count, sum, avg, etc.)
 * - postAggWindowMeasures: window functions referencing a base measure
 * - requiredBaseMeasures: base measures those windows depend on (auto-added)
 */
export function categorizeForPostAggregation(
  measureNames: string[],
  cubeMap: Map<string, Cube>
): {
  aggregateMeasures: string[]
  postAggWindowMeasures: string[]
  requiredBaseMeasures: Set<string>
} {
  const aggregateMeasures: string[] = []
  const postAggWindowMeasures: string[] = []
  const requiredBaseMeasures = new Set<string>()

  for (const measureName of measureNames) {
    const [cubeName, fieldName] = measureName.split('.')
    const cube = cubeMap.get(cubeName)

    if (cube?.measures?.[fieldName]) {
      const measure = cube.measures[fieldName]

      if (isPostAggregationWindow(measure)) {
        postAggWindowMeasures.push(measureName)

        const baseMeasure = getWindowBaseMeasure(measure, cubeName)
        if (baseMeasure) {
          requiredBaseMeasures.add(baseMeasure)
        }
      } else if (!isWindowFunction(measure.type)) {
        aggregateMeasures.push(measureName)
      }
    }
  }

  return { aggregateMeasures, postAggWindowMeasures, requiredBaseMeasures }
}

/** Whether any measure in the list is a post-aggregation window function. */
export function hasPostAggregationWindows(
  measureNames: string[],
  cubeMap: Map<string, Cube>
): boolean {
  return categorizeForPostAggregation(measureNames, cubeMap).postAggWindowMeasures.length > 0
}

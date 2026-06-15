/**
 * Pure helpers for useDrillInteraction.
 *
 * These functions compute "what should happen" for a drill interaction without
 * touching React state. The hook applies the resulting descriptors via its
 * setters, preserving the original ordering of state updates.
 */

import type {
  DrillOption,
  DrillPathEntry,
} from '../types/drill'
import type { ChartAxisConfig, CubeQuery } from '../types'

/**
 * Find an existing drill-path level for the given option and compute the
 * "navigate back" descriptor (the truncated path + the query/chartConfig to
 * restore). Returns null when there is no matching existing level.
 *
 * Used for both time-granularity drilling (matched by `granularity`) and
 * hierarchy-dimension drilling (matched by `dimension`).
 */
export function findNavigateBackToExistingLevel(
  drillPath: DrillPathEntry[],
  matches: (entry: DrillPathEntry) => boolean
): { newPath: DrillPathEntry[]; query: CubeQuery; chartConfig: ChartAxisConfig | null } | null {
  const existingLevelIndex = drillPath.findIndex(matches)
  if (existingLevelIndex === -1) return null

  const targetIndex = existingLevelIndex + 1
  if (targetIndex < drillPath.length) {
    const newPath = drillPath.slice(0, targetIndex)
    const targetEntry = newPath[newPath.length - 1]
    return {
      newPath,
      query: targetEntry.query,
      chartConfig: targetEntry.chartConfig || null,
    }
  }
  // Existing level is already the deepest entry: only close the menu (no path change).
  return null
}

/**
 * Whether selecting this option means returning all the way to the root via the
 * original time granularity.
 */
export function isDrillBackToRootGranularity(
  option: DrillOption,
  originalGranularity: string | null
): boolean {
  return Boolean(
    option.targetGranularity &&
      originalGranularity &&
      option.targetGranularity === originalGranularity
  )
}

/**
 * Compute the granularity to remember as the "original" when first drilling via
 * a time-granularity option. Returns null when nothing should be stored.
 */
export function computeOriginalGranularity(
  option: DrillOption,
  query: CubeQuery
): string | null {
  if (option.targetGranularity && query.timeDimensions?.[0]) {
    return query.timeDimensions[0].granularity ?? null
  }
  return null
}

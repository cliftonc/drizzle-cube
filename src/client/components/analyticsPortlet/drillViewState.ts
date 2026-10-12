/**
 * The drill part of a portlet view state: what a new AnalyticsPortlet needs to
 * start at the drill level of another instance of the same portlet.
 *
 * The host passes this value through without reading it, so it is checked
 * here before use. A value with an unknown shape, or one taken from a
 * different base query, gives the root level.
 */

import type { ChartAxisConfig, CubeQuery } from '../../types.js'
import type { DrillInteractionState, DrillPathEntry } from '../../types/drill.js'

export interface PortletDrillViewState extends DrillInteractionState {
  version: 1
  /** JSON of the base query that the drill started from */
  baseQuery: string
  /** The query of the current drill level */
  drilledQuery: CubeQuery
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRecordOrNull(value: unknown): value is Record<string, unknown> | null {
  return value === null || isRecord(value)
}

function isDrillPathEntry(value: unknown): value is DrillPathEntry {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    isRecord(value.query)
}

/**
 * Returns the drill view state when `value` has the expected shape and was
 * taken from the same base query, else null.
 */
export function parsePortletDrillViewState(
  value: unknown,
  baseQuery: string | null
): PortletDrillViewState | null {
  if (!isRecord(value) || value.version !== 1) return null
  if (baseQuery === null || value.baseQuery !== baseQuery) return null
  if (!isRecord(value.drilledQuery)) return null
  if (!Array.isArray(value.drillPath) || !value.drillPath.every(isDrillPathEntry)) return null
  if (value.originalGranularity !== null && typeof value.originalGranularity !== 'string') return null
  if (!isRecordOrNull(value.originalChartConfig)) return null
  if (!isRecordOrNull(value.currentChartConfig)) return null
  if (!isRecordOrNull(value.originalQuery)) return null

  return {
    version: 1,
    baseQuery,
    drilledQuery: value.drilledQuery as CubeQuery,
    drillPath: value.drillPath,
    originalGranularity: value.originalGranularity,
    originalChartConfig: value.originalChartConfig as ChartAxisConfig | null,
    currentChartConfig: value.currentChartConfig as ChartAxisConfig | null,
    originalQuery: value.originalQuery as CubeQuery | null
  }
}

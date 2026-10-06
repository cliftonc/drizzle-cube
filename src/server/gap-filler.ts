/**
 * Server-side gap filling.
 *
 * The server only fills a time dimension when asked to — by the query's
 * `fillMissingDates`, or by the cube time dimension's `fillMissingDates` when
 * the query leaves it unset. Otherwise it returns observed rows only and leaves
 * filling to the chart, as Cube.js does (issue #1368). The bucket logic itself
 * lives in `src/shared/gap-filler.ts` so the client fills identically.
 */

import type { Cube } from './types/cube.js'
import type { SemanticQuery } from './types/query.js'
import { applyGapFilling, type GapFillTimeDimension } from '../shared/gap-filler.js'

export {
  generateTimeBuckets,
  fillTimeSeriesGaps,
  parseDateRange,
  MAX_GAP_FILL_BUCKETS,
  type GapFillerConfig
} from '../shared/gap-filler.js'

/** The cube time dimension's `fillMissingDates`, if the dimension declares one. */
function cubeFillMissingDates(
  cubes: Map<string, Cube> | undefined,
  member: string
): boolean | undefined {
  const [cubeName, fieldName] = member.split('.')
  return cubes?.get(cubeName)?.dimensions?.[fieldName]?.fillMissingDates
}

/**
 * Apply server-side gap filling to query result rows.
 *
 * Precedence per time dimension: the query's `fillMissingDates`, then the cube
 * dimension's, then `fillByDefault`. Ungrouped queries are never filled.
 *
 * @param fillByDefault - Fill when neither the query nor the cube says. Only
 *   comparison-period sub-queries pass `true`, to keep periods aligned.
 */
export function applyServerGapFilling(
  data: Record<string, unknown>[],
  query: SemanticQuery,
  cubes?: Map<string, Cube>,
  fillByDefault = false
): Record<string, unknown>[] {
  if (query.ungrouped) return data

  return applyGapFilling(data, query, query.measures || [], (td: GapFillTimeDimension) =>
    td.fillMissingDates ?? cubeFillMissingDates(cubes, td.dimension) ?? fillByDefault
  )
}

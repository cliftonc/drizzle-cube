/**
 * ResultPostProcessor — post-processes raw query result rows before they are
 * returned: normalises time-dimension date values via the database adapter and
 * applies time-series gap filling. Extracted from QueryExecutor.
 */

import type { SemanticQuery } from '../types'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import { applyGapFilling } from '../gap-filler'

/**
 * Normalise time-dimension values in result rows and apply gap filling.
 *
 * @param data Raw rows from the database executor
 * @param query The semantic query (for timeDimensions + measures)
 * @param databaseAdapter Adapter used to convert engine-specific date results
 */
export function postProcessResultRows(
  data: unknown,
  query: SemanticQuery,
  databaseAdapter: DatabaseAdapter
): Record<string, unknown>[] {
  // Process time dimension results
  const mappedData = Array.isArray(data) ? data.map(row => {
    const mappedRow = { ...row }
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        if (timeDim.dimension in mappedRow) {
          let dateValue = mappedRow[timeDim.dimension]

          // If we have a date that is not 'T' in the center and Z at the end, we need to fix it
          if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
            const isoString = dateValue.replace(' ', 'T')
            const finalIsoString = !isoString.endsWith('Z') && !isoString.includes('+')
              ? isoString + 'Z'
              : isoString
            dateValue = new Date(finalIsoString)
          }

          // Convert time dimension result using database adapter if required
          dateValue = databaseAdapter.convertTimeDimensionResult(dateValue)
          mappedRow[timeDim.dimension] = dateValue
        }
      }
    }
    return mappedRow
  }) : [data]

  // Apply gap filling for time series if requested
  const measureNames = query.measures || []
  return applyGapFilling(mappedData, query, measureNames)
}

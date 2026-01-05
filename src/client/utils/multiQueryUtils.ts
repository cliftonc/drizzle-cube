/**
 * Multi-Query Data Utilities
 * Handles merging results from multiple CubeQuery executions
 *
 * Pattern follows comparisonUtils.ts for metadata injection:
 * - __queryIndex: numeric index of the source query (0-based)
 * - __queryLabel: user-defined or auto-generated label for the query
 */

import type { CubeResultSet, CubeQuery, QueryMergeStrategy } from '../types'

/**
 * Metadata fields injected into multi-query data
 */
export interface MultiQueryMetadata {
  __queryIndex: number
  __queryLabel: string
}

/**
 * Check if data contains multi-query metadata
 */
export function isMultiQueryData(data: unknown[]): boolean {
  return data.length > 0 && typeof data[0] === 'object' && data[0] !== null && '__queryIndex' in data[0]
}

/**
 * Get unique query labels from multi-query data
 */
export function getQueryLabels(data: unknown[]): string[] {
  if (!isMultiQueryData(data)) return []

  const labels = new Set<string>()
  for (const row of data) {
    const label = (row as Record<string, unknown>).__queryLabel
    if (typeof label === 'string') {
      labels.add(label)
    }
  }
  return Array.from(labels)
}

/**
 * Get query indices from multi-query data
 */
export function getQueryIndices(data: unknown[]): number[] {
  if (!isMultiQueryData(data)) return []

  const indices = new Set<number>()
  for (const row of data) {
    const index = (row as Record<string, unknown>).__queryIndex
    if (typeof index === 'number') {
      indices.add(index)
    }
  }
  return Array.from(indices).sort((a, b) => a - b)
}

/**
 * Merge results using 'concat' strategy
 * Appends all rows with __queryIndex and __queryLabel metadata
 *
 * @param resultSets - Array of CubeResultSet from each query
 * @param queries - Original CubeQuery objects
 * @param labels - Optional user-defined labels per query
 * @returns Merged data array with query metadata
 */
export function mergeResultsConcat(
  resultSets: CubeResultSet[],
  _queries: CubeQuery[],
  labels?: string[]
): unknown[] {
  const merged: unknown[] = []

  resultSets.forEach((resultSet, queryIndex) => {
    const data = resultSet.rawData()
    const label = labels?.[queryIndex] || `Query ${queryIndex + 1}`

    data.forEach(row => {
      merged.push({
        ...row,
        __queryIndex: queryIndex,
        __queryLabel: label
      })
    })
  })

  return merged
}

/**
 * Merge results using 'merge' strategy
 * Aligns data by common dimensions (composite key), combining measures from all queries
 *
 * Example:
 *   Query 1: [{ date: '2024-01', revenue: 100 }]
 *   Query 2: [{ date: '2024-01', cost: 50 }]
 *   Result:  [{ date: '2024-01', revenue: 100, cost: 50 }]
 *
 * If multiple queries have the same measure, the first query's value is used.
 *
 * @param resultSets - Array of CubeResultSet from each query
 * @param queries - Original CubeQuery objects
 * @param mergeKeys - Dimension fields to align data on (composite key)
 * @param _labels - Optional user-defined labels per query (unused, kept for API compatibility)
 * @returns Merged data array with combined measures
 */
export function mergeResultsByKey(
  resultSets: CubeResultSet[],
  queries: CubeQuery[],
  mergeKeys: string[],
  _labels?: string[]
): unknown[] {
  const mergedMap = new Map<string, Record<string, unknown>>()

  resultSets.forEach((resultSet, queryIndex) => {
    const data = resultSet.rawData()
    const measures = queries[queryIndex].measures || []

    data.forEach(row => {
      // Create composite key from all merge dimensions
      const keyValue = mergeKeys.map(k => String(row[k] ?? '')).join('|')

      if (!mergedMap.has(keyValue)) {
        // Initialize with all dimension values
        const baseRow: Record<string, unknown> = {}
        mergeKeys.forEach(k => { baseRow[k] = row[k] })
        mergedMap.set(keyValue, baseRow)
      }

      const mergedRow = mergedMap.get(keyValue)!

      // Add measures using raw field names (no prefix)
      // If same measure exists in multiple queries, first one wins
      measures.forEach(measure => {
        if (!(measure in mergedRow)) {
          mergedRow[measure] = row[measure]
        }
      })

      // Copy other dimensions (non-measure, non-merge-key fields) from first query
      if (queryIndex === 0) {
        Object.keys(row).forEach(field => {
          if (!mergeKeys.includes(field) && !measures.includes(field)) {
            if (!(field in mergedRow)) {
              mergedRow[field] = row[field]
            }
          }
        })
      }
    })
  })

  // Sort by first merge key for consistent ordering
  return Array.from(mergedMap.values()).sort((a, b) => {
    const aKey = String(a[mergeKeys[0]] ?? '')
    const bKey = String(b[mergeKeys[0]] ?? '')
    return aKey.localeCompare(bKey)
  })
}

/**
 * Main entry point for merging query results
 * Delegates to appropriate strategy implementation
 *
 * @param resultSets - Array of CubeResultSet from each query
 * @param queries - Original CubeQuery objects
 * @param strategy - Merge strategy ('concat' or 'merge')
 * @param mergeKeys - Dimension fields to align on (required for 'merge' strategy)
 * @param labels - Optional user-defined labels per query
 * @returns Merged data array
 */
export function mergeQueryResults(
  resultSets: CubeResultSet[],
  queries: CubeQuery[],
  strategy: QueryMergeStrategy,
  mergeKeys?: string[],
  labels?: string[]
): unknown[] {
  // Handle edge cases
  if (resultSets.length === 0) return []
  if (resultSets.length === 1) return resultSets[0].rawData()

  // Use merge strategy if we have merge keys
  if (strategy === 'merge' && mergeKeys && mergeKeys.length > 0) {
    return mergeResultsByKey(resultSets, queries, mergeKeys, labels)
  }

  // Fall back to concat strategy
  return mergeResultsConcat(resultSets, queries, labels)
}

/**
 * Get combined fields from all queries
 * Used for chart configuration to show all available measures/dimensions
 *
 * @param queries - Array of CubeQuery objects
 * @param _labels - Optional user-defined labels per query (unused, kept for API compatibility)
 * @returns Object containing combined measures, dimensions, and time dimensions
 */
export function getCombinedFields(
  queries: CubeQuery[],
  _labels?: string[]
): {
  measures: string[]
  dimensions: string[]
  timeDimensions: string[]
} {
  const measures = new Set<string>()
  const dimensions = new Set<string>()
  const timeDimensions = new Set<string>()

  queries.forEach((query) => {
    // Measures use raw field names (no prefix), de-duplicated
    query.measures?.forEach(m => measures.add(m))

    // Dimensions are shared across queries (de-duplicated)
    query.dimensions?.forEach(d => dimensions.add(d))

    // Time dimensions are also shared
    query.timeDimensions?.forEach(td => timeDimensions.add(td.dimension))
  })

  return {
    measures: Array.from(measures),
    dimensions: Array.from(dimensions),
    timeDimensions: Array.from(timeDimensions)
  }
}

/**
 * Generate a default label for a query based on its measures
 * Used when user doesn't provide custom labels
 */
export function generateQueryLabel(query: CubeQuery, index: number): string {
  // Try to use first measure name without cube prefix
  if (query.measures && query.measures.length > 0) {
    const firstMeasure = query.measures[0]
    const parts = firstMeasure.split('.')
    if (parts.length > 1) {
      return parts[parts.length - 1] // Use measure name without cube prefix
    }
    return firstMeasure
  }

  // Fall back to indexed label
  return `Query ${index + 1}`
}

/**
 * Validate merge key exists in all queries
 * Returns validation result with details
 */
export function validateMergeKey(
  queries: CubeQuery[],
  mergeKey: string
): {
  isValid: boolean
  missingInQueries: number[]
} {
  const missingInQueries: number[] = []

  queries.forEach((query, index) => {
    const allDimensions = [
      ...(query.dimensions || []),
      ...(query.timeDimensions?.map(td => td.dimension) || [])
    ]

    if (!allDimensions.includes(mergeKey)) {
      missingInQueries.push(index)
    }
  })

  return {
    isValid: missingInQueries.length === 0,
    missingInQueries
  }
}

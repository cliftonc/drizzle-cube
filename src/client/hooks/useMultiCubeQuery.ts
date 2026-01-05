/**
 * React hook for executing multiple Cube queries
 * Extends useCubeQuery pattern for multi-query support
 *
 * Integrates with BatchCoordinator for dashboard-level batching:
 * - All queries are registered individually with BatchCoordinator
 * - Gets batched with other portlet queries in the same render cycle
 * - Single network request for entire dashboard load
 */

import { useState, useEffect, useRef } from 'react'
import { useCubeContext } from '../providers/CubeProvider'
import type { CubeQueryOptions, CubeResultSet, MultiQueryConfig } from '../types'
import { mergeQueryResults } from '../utils/multiQueryUtils'

export interface UseMultiCubeQueryResult {
  /** Merged data from all queries (null while loading) */
  data: unknown[] | null
  /** Individual result sets from each query */
  resultSets: CubeResultSet[] | null
  /** Whether any query is still loading */
  isLoading: boolean
  /** First error encountered (null if all succeeded) */
  error: Error | null
  /** Per-query errors (null for successful queries) */
  errors: (Error | null)[]
  /** Unique identifier for this query execution */
  queryId: string | null
}

/**
 * Hook for executing multiple Cube queries with merged results
 *
 * @param config - MultiQueryConfig containing queries and merge settings
 * @param options - Query options (skip, resetResultSetOnChange)
 * @returns Query results with merged data and per-query error tracking
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useMultiCubeQuery({
 *   queries: [
 *     { measures: ['Sales.revenue'] },
 *     { measures: ['Costs.total'] }
 *   ],
 *   mergeStrategy: 'merge',
 *   mergeKey: 'Sales.date',
 *   queryLabels: ['Revenue', 'Costs']
 * })
 * ```
 */
export function useMultiCubeQuery(
  config: MultiQueryConfig | null,
  options: CubeQueryOptions = {}
): UseMultiCubeQueryResult {
  const { cubeApi, batchCoordinator, enableBatching } = useCubeContext()

  const [state, setState] = useState<UseMultiCubeQueryResult>({
    data: null,
    resultSets: null,
    isLoading: false,
    error: null,
    errors: [],
    queryId: null
  })

  // Track the last config to avoid unnecessary re-fetches
  const lastConfigRef = useRef<string>('')

  useEffect(() => {
    // Skip if config is null, skip option is true, or no queries
    if (!config || options.skip || config.queries.length === 0) {
      return
    }

    // Create a stable config string for comparison
    const configString = JSON.stringify(config)

    // Skip if config hasn't changed (unless resetResultSetOnChange is true)
    if (configString === lastConfigRef.current && !options.resetResultSetOnChange) {
      return
    }

    lastConfigRef.current = configString

    // Create a unique ID for this query execution
    const queryId = `multi_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Update state atomically with new query ID and loading state
    setState(prevState => ({
      data: options.resetResultSetOnChange ? null : prevState.data,
      resultSets: options.resetResultSetOnChange ? null : prevState.resultSets,
      isLoading: true,
      error: null,
      errors: config.queries.map(() => null),
      queryId
    }))

    // Execute queries using BatchCoordinator if enabled, otherwise use direct batchLoad
    const executeQueries = (): Promise<CubeResultSet[]> => {
      if (enableBatching && batchCoordinator) {
        // All queries go through BatchCoordinator - batched with entire dashboard
        return Promise.all(
          config.queries.map(query => batchCoordinator.register(query))
        )
      }
      // Fallback: direct batch call if batching disabled
      return cubeApi.batchLoad(config.queries)
    }

    executeQueries()
      .then((resultSets) => {
        setState(prevState => {
          // Only update if this is still the current query
          if (prevState.queryId !== queryId) return prevState

          // Check for per-query errors
          const errors = resultSets.map(rs => {
            if (rs && 'error' in rs && (rs as { error?: string }).error) {
              return new Error((rs as { error: string }).error)
            }
            return null
          })

          const firstError = errors.find(e => e !== null) || null

          // Filter successful results for merging
          const successfulResults = resultSets.filter((_, i) => !errors[i])
          const successfulQueries = config.queries.filter((_, i) => !errors[i])

          // Merge results using configured strategy
          const data = successfulResults.length > 0
            ? mergeQueryResults(
              successfulResults,
              successfulQueries,
              config.mergeStrategy,
              config.mergeKeys,
              config.queryLabels
            )
            : []

          return {
            data,
            resultSets,
            isLoading: false,
            error: firstError,
            errors,
            queryId
          }
        })
      })
      .catch((err) => {
        setState(prevState => {
          // Only update if this is still the current query
          if (prevState.queryId !== queryId) return prevState

          const error = err instanceof Error ? err : new Error(String(err))

          return {
            data: null,
            resultSets: null,
            isLoading: false,
            error,
            // All queries failed with the same error
            errors: config.queries.map(() => error),
            queryId
          }
        })
      })
  }, [config, cubeApi, batchCoordinator, enableBatching, options.skip, options.resetResultSetOnChange])

  return state
}

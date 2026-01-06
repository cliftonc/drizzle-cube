/**
 * useAnalysisQueryExecution
 *
 * Coordinates TanStack Query execution for single and multi-query modes.
 * Provides unified loading states, results, and refetch functionality.
 */

import { useMemo, useCallback } from 'react'
import {
  useCubeLoadQuery,
  useMultiCubeLoadQuery,
  useDryRunQueries,
  type DebugDataEntry,
} from './queries'
import type { CubeQuery, MultiQueryConfig } from '../types'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'

export interface UseAnalysisQueryExecutionOptions {
  /** Current query (for single-query mode) */
  currentQuery: CubeQuery
  /** All queries (for dry-run and multi-query) */
  allQueries: CubeQuery[]
  /** Multi-query config (null if single-query mode) */
  multiQueryConfig: MultiQueryConfig | null
  /** Whether in multi-query mode */
  isMultiQueryMode: boolean
  /** Whether current query is valid */
  isValidQuery: boolean
  /** Initial data (skip first fetch) */
  initialData?: unknown[]
}

export interface UseAnalysisQueryExecutionResult {
  /** Query execution status */
  executionStatus: ExecutionStatus
  /** Query results (merged for multi-query) */
  executionResults: unknown[] | null
  /** Per-query results (for table view in multi-query mode) */
  perQueryResults: (unknown[] | null)[] | null
  /** Whether query is loading */
  isLoading: boolean
  /** Whether query is fetching (includes refetch) */
  isFetching: boolean
  /** Query error */
  error: Error | null
  /** Debug data per query */
  debugDataPerQuery: DebugDataEntry[]
  /** Whether query has been debounced (for smart defaults trigger) */
  hasDebounced: boolean
  /** Refetch function */
  refetch: () => void
}

export function useAnalysisQueryExecution(
  options: UseAnalysisQueryExecutionOptions
): UseAnalysisQueryExecutionResult {
  const {
    currentQuery,
    allQueries,
    multiQueryConfig,
    isMultiQueryMode,
    isValidQuery,
    initialData,
  } = options

  // Single query execution
  const singleQueryResult = useCubeLoadQuery(currentQuery, {
    skip: !isValidQuery || isMultiQueryMode,
    debounceMs: 300,
  })

  // Multi-query execution
  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: !multiQueryConfig || !isMultiQueryMode,
    debounceMs: 300,
  })

  // Dry-run queries for debug data
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: !isValidQuery,
  })

  // Unify results
  const isLoading = isMultiQueryMode ? multiQueryResult.isLoading : singleQueryResult.isLoading
  const isFetching = isMultiQueryMode ? multiQueryResult.isFetching : singleQueryResult.isFetching
  const error = isMultiQueryMode ? multiQueryResult.error : singleQueryResult.error

  // Has debounced (for smart defaults trigger)
  const hasDebounced = Boolean(singleQueryResult.debouncedQuery || multiQueryResult.debouncedConfig)

  // Unified refetch function
  const refetch = useCallback(() => {
    if (isMultiQueryMode) {
      multiQueryResult.refetch()
    } else {
      singleQueryResult.refetch()
    }
  }, [isMultiQueryMode, multiQueryResult, singleQueryResult])

  // Execution status
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = isMultiQueryMode ? multiQueryResult.data : singleQueryResult.rawData
    if (initialData && initialData.length > 0 && !hasResults) return 'success'
    if (!isValidQuery) return 'idle'
    if (isLoading && !hasResults) return 'loading'
    if (isFetching && hasResults) return 'refreshing'
    if (error) return 'error'
    if (hasResults) return 'success'
    return 'idle'
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, initialData, isMultiQueryMode])

  // Execution results
  const executionResults = useMemo(() => {
    if (isMultiQueryMode && multiQueryResult.data) {
      return multiQueryResult.data as unknown[]
    }
    if (singleQueryResult.rawData) {
      return singleQueryResult.rawData
    }
    if (initialData && initialData.length > 0) {
      return initialData
    }
    return null
  }, [singleQueryResult.rawData, multiQueryResult.data, initialData, isMultiQueryMode])

  // Per-query results for table view
  const perQueryResults = useMemo(() => {
    if (!isMultiQueryMode || !multiQueryResult.perQueryData) return null
    return multiQueryResult.perQueryData
  }, [isMultiQueryMode, multiQueryResult.perQueryData])

  return {
    executionStatus,
    executionResults,
    perQueryResults,
    isLoading,
    isFetching,
    error,
    debugDataPerQuery: dryRunResult.debugDataPerQuery,
    hasDebounced,
    refetch,
  }
}

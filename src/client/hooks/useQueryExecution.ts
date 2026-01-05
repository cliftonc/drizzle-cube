/**
 * useQueryExecution Hook
 *
 * Manages debounced query execution for AnalysisBuilder:
 * - Debounce timer management
 * - Query string comparison for change detection
 * - Single and multi-query execution via useCubeQuery/useMultiCubeQuery
 * - Result aggregation and status computation
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import type { CubeQuery, MultiQueryConfig } from '../types'
import { useCubeQuery } from './useCubeQuery'
import { useMultiCubeQuery } from './useMultiCubeQuery'
import { cleanQueryForServer } from '../shared/utils'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'

// Debounce delay for auto-execute (ms)
const AUTO_EXECUTE_DELAY = 300

export interface UseQueryExecutionOptions {
  /** Current query for single-query mode */
  currentQuery: CubeQuery
  /** All queries for multi-query mode */
  allQueries: CubeQuery[]
  /** Whether we're in multi-query mode */
  isMultiQueryMode: boolean
  /** Multi-query configuration */
  multiQueryConfig: MultiQueryConfig | null
  /** Merge strategy for multi-query */
  mergeStrategy: string
  /** Merge keys for multi-query */
  mergeKeys: string[] | undefined
  /** Initial data (to skip first auto-execute) */
  initialData?: any[]
  /** Initial query (to skip first auto-execute) */
  initialQuery?: CubeQuery | MultiQueryConfig
  /** Whether results are stale */
  resultsStale: boolean
  /** Callback to clear resultsStale flag */
  onResultsStaleChange: (stale: boolean) => void
}

export interface UseQueryExecutionReturn {
  /** Current execution status */
  executionStatus: ExecutionStatus
  /** Execution results (merged for multi-query) */
  executionResults: any[] | null
  /** Per-query results for table view in multi-query mode */
  perQueryResults: (any[] | null)[] | undefined
  /** Whether query is loading */
  isLoading: boolean
  /** Query error if any */
  error: Error | null
  /** The debounced query */
  debouncedQuery: CubeQuery | null
  /** Set debounced query (for clearing) */
  setDebouncedQuery: React.Dispatch<React.SetStateAction<CubeQuery | null>>
  /** The debounce timer ref (for clearing) */
  debounceTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  /** Whether current query is valid */
  isValidQuery: boolean
  /** Whether multi-query config is valid */
  hasValidMultiQuery: boolean
  /** Active table index for multi-query view */
  activeTableIndex: number
  /** Set active table index */
  setActiveTableIndex: React.Dispatch<React.SetStateAction<number>>
  /** The raw resultSet from single query */
  resultSet: any
  /** Server-ready query (with filter groups converted) */
  serverQuery: CubeQuery | null
}

export function useQueryExecution({
  currentQuery,
  allQueries,
  isMultiQueryMode,
  multiQueryConfig,
  mergeStrategy,
  mergeKeys,
  initialData,
  initialQuery,
  resultsStale,
  onResultsStaleChange
}: UseQueryExecutionOptions): UseQueryExecutionReturn {
  // Serialize query for comparison (prevents object reference issues)
  const currentQueryString = useMemo(() => {
    if (isMultiQueryMode) {
      return JSON.stringify({ queries: allQueries, mergeStrategy, mergeKeys })
    }
    return JSON.stringify(currentQuery)
  }, [currentQuery, allQueries, isMultiQueryMode, mergeStrategy, mergeKeys])

  // Debounced query for auto-execution
  const [debouncedQuery, setDebouncedQuery] = useState<CubeQuery | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastQueryStringRef = useRef<string>('')

  // Track if we should skip the first auto-execute (when initialData is provided)
  const hasInitialDataRef = useRef<boolean>(!!initialData && initialData.length > 0)
  const initialQueryStringRef = useRef<string>(initialQuery ? JSON.stringify(initialQuery) : '')

  // Determine if query is valid (has at least one measure OR one dimension)
  const isValidQuery =
    (currentQuery.measures && currentQuery.measures.length > 0) ||
    (currentQuery.dimensions && currentQuery.dimensions.length > 0) ||
    (currentQuery.timeDimensions && currentQuery.timeDimensions.length > 0)

  // In multi-query mode, check if we have 2+ valid queries (for debounce purposes)
  const hasValidMultiQuery = useMemo(() => {
    if (!isMultiQueryMode) return false
    const validQueries = allQueries.filter(q =>
      (q.measures && q.measures.length > 0) ||
      (q.dimensions && q.dimensions.length > 0) ||
      (q.timeDimensions && q.timeDimensions.length > 0)
    )
    return validQueries.length >= 2
  }, [isMultiQueryMode, allQueries])

  // Debounce query changes - use string comparison to avoid infinite loops
  useEffect(() => {
    // Skip if query hasn't actually changed
    if (currentQueryString === lastQueryStringRef.current) {
      return
    }

    // Skip initial auto-execution if initialData was provided and query hasn't changed from initial
    // This prevents re-fetching data that was already provided
    if (hasInitialDataRef.current && currentQueryString === initialQueryStringRef.current) {
      // Mark the query as "seen" so we don't skip future executions
      lastQueryStringRef.current = currentQueryString
      // Clear the flag so subsequent changes will execute
      hasInitialDataRef.current = false
      return
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Only debounce if we have a valid query (single or multi-query mode)
    const shouldExecute = isValidQuery || hasValidMultiQuery
    if (shouldExecute) {
      debounceTimerRef.current = setTimeout(() => {
        lastQueryStringRef.current = currentQueryString
        // For multi-query, debouncedQuery just needs to be truthy to trigger execution
        // The actual value isn't used - multiQueryConfig is used instead
        // Using allQueries[0] provides stability - doesn't change on tab switch
        setDebouncedQuery(hasValidMultiQuery ? allQueries[0] : currentQuery)
      }, AUTO_EXECUTE_DELAY)
    } else {
      // Clear debounced query if no valid query
      lastQueryStringRef.current = currentQueryString
      setDebouncedQuery(null)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [currentQueryString, isValidQuery, hasValidMultiQuery, allQueries, currentQuery, isMultiQueryMode])

  // Transform debounced query to server format (converts filter groups)
  const serverQuery = useMemo(() => {
    if (!debouncedQuery) return null
    return cleanQueryForServer(debouncedQuery)
  }, [debouncedQuery])

  // Debounced multi-query config for auto-execution
  // This syncs with debouncedQuery - when debouncedQuery fires, we also fire multi-query
  const debouncedMultiConfig = useMemo(() => {
    // Only create multi-query config when:
    // 1. In multi-query mode (2+ queries with content)
    // 2. A debounced query has fired (indicating user finished typing)
    if (!isMultiQueryMode || !multiQueryConfig || !debouncedQuery) {
      return null
    }
    return multiQueryConfig
  }, [isMultiQueryMode, multiQueryConfig, debouncedQuery])

  // Execute SINGLE query using useCubeQuery hook (when not in multi-query mode)
  // Reset resultSet when query changes to avoid showing stale data after clearing
  const singleQueryResult = useCubeQuery(serverQuery, {
    skip: !serverQuery || isMultiQueryMode,
    resetResultSetOnChange: true
  })

  // Execute MULTI query using useMultiCubeQuery hook (when in multi-query mode)
  const multiQueryResult = useMultiCubeQuery(debouncedMultiConfig, {
    skip: !debouncedMultiConfig || !isMultiQueryMode,
    resetResultSetOnChange: true
  })

  // Unify results from single or multi query
  const resultSet = isMultiQueryMode ? null : singleQueryResult.resultSet
  const isLoading = isMultiQueryMode ? multiQueryResult.isLoading : singleQueryResult.isLoading
  const error = isMultiQueryMode ? multiQueryResult.error : singleQueryResult.error

  // Derive execution status - show success with initialData even before first query
  const executionStatus: ExecutionStatus = useMemo(() => {
    // If we have initialData and haven't started querying yet, show success
    const hasResults = isMultiQueryMode ? multiQueryResult.data : resultSet
    if (initialData && initialData.length > 0 && !debouncedQuery && !hasResults) {
      return 'success'
    }
    if (!debouncedQuery && !debouncedMultiConfig) return 'idle'
    // If results are stale (query changed but debounce hasn't fired yet), show refreshing
    // This prevents flash when toggling comparison mode
    // In multi-query mode, don't use per-tab resultsStale - the chart shows shared merged
    // data that doesn't change on tab switch. We rely on isLoading for actual refreshes.
    if (!isMultiQueryMode && resultsStale && hasResults) return 'refreshing'
    if (isLoading && !hasResults) return 'loading'
    if (isLoading && hasResults) return 'refreshing'
    if (error) return 'error'
    if (hasResults) return 'success'
    return 'idle'
  }, [debouncedQuery, debouncedMultiConfig, isLoading, error, resultSet, multiQueryResult.data, initialData, resultsStale, isMultiQueryMode])

  // Get execution results - use initialData if no resultSet yet
  // For chart: use merged results from all queries
  const executionResults = useMemo(() => {
    // Multi-query mode: use merged data from useMultiCubeQuery
    if (isMultiQueryMode && multiQueryResult.data) {
      return multiQueryResult.data as any[]
    }

    // Single query mode: use resultSet
    if (resultSet) {
      try {
        return resultSet.rawData()
      } catch {
        return null
      }
    }
    // Use initialData if provided and no resultSet yet
    if (initialData && initialData.length > 0) {
      return initialData
    }
    return null
  }, [resultSet, initialData, isMultiQueryMode, multiQueryResult.data])

  // Get per-query results for table view in multi-query mode
  const perQueryResults = useMemo(() => {
    if (!isMultiQueryMode || !multiQueryResult.resultSets) {
      return undefined
    }
    return multiQueryResult.resultSets.map(rs => {
      if (!rs) return null
      try {
        return rs.rawData()
      } catch {
        return null
      }
    })
  }, [isMultiQueryMode, multiQueryResult.resultSets])

  // Active table index for multi-query table view
  const [activeTableIndex, setActiveTableIndex] = useState(0)

  // Clear resultsStale flag when new results arrive
  useEffect(() => {
    if (resultSet && resultsStale) {
      onResultsStaleChange(false)
    }
  }, [resultSet, resultsStale, onResultsStaleChange])

  return {
    executionStatus,
    executionResults,
    perQueryResults,
    isLoading,
    error,
    debouncedQuery,
    setDebouncedQuery,
    debounceTimerRef,
    isValidQuery: isValidQuery || false,
    hasValidMultiQuery,
    activeTableIndex,
    setActiveTableIndex,
    resultSet,
    serverQuery
  }
}

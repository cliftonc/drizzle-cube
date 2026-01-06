/**
 * useAnalysisQueryBuilder
 *
 * Builds and validates queries from Zustand store state.
 * Handles single-query and multi-query modes.
 */

import { useMemo } from 'react'
import { useAnalysisBuilderStore } from '../stores/analysisBuilderStore'
import { validateMultiQueryConfig, type MultiQueryValidationResult } from '../utils/multiQueryValidation'
import type { CubeQuery, MultiQueryConfig, QueryMergeStrategy } from '../types'
import type { AnalysisBuilderState } from '../components/AnalysisBuilder/types'

export interface UseAnalysisQueryBuilderResult {
  /** Current query state (active query) */
  queryState: AnalysisBuilderState
  /** All query states (for multi-query mode) */
  queryStates: AnalysisBuilderState[]
  /** Active query index */
  activeQueryIndex: number
  /** Merge strategy for multi-query */
  mergeStrategy: QueryMergeStrategy
  /** Whether in multi-query mode */
  isMultiQueryMode: boolean
  /** Merge keys (computed from Q1 breakdowns) */
  mergeKeys: string[] | undefined
  /** Current query as CubeQuery */
  currentQuery: CubeQuery
  /** All queries as CubeQuery[] */
  allQueries: CubeQuery[]
  /** MultiQueryConfig (if in multi-query mode) */
  multiQueryConfig: MultiQueryConfig | null
  /** Multi-query validation result */
  multiQueryValidation: MultiQueryValidationResult | null
  /** Whether current query is valid */
  isValidQuery: boolean | undefined

  // Actions
  setActiveQueryIndex: (index: number) => void
  setMergeStrategy: (strategy: QueryMergeStrategy) => void
  addQuery: () => void
  removeQuery: (index: number) => void
}

export function useAnalysisQueryBuilder(): UseAnalysisQueryBuilderResult {
  // Store state
  const queryStates = useAnalysisBuilderStore((state) => state.queryStates)
  const activeQueryIndex = useAnalysisBuilderStore((state) => state.activeQueryIndex)
  const mergeStrategy = useAnalysisBuilderStore((state) => state.mergeStrategy)

  // Store actions
  const setActiveQueryIndex = useAnalysisBuilderStore((state) => state.setActiveQueryIndex)
  const setMergeStrategy = useAnalysisBuilderStore((state) => state.setMergeStrategy)
  const addQuery = useAnalysisBuilderStore((state) => state.addQuery)
  const removeQuery = useAnalysisBuilderStore((state) => state.removeQuery)

  // Store getters
  const getCurrentState = useAnalysisBuilderStore((state) => state.getCurrentState)
  const getMergeKeys = useAnalysisBuilderStore((state) => state.getMergeKeys)
  const isMultiQueryModeGetter = useAnalysisBuilderStore((state) => state.isMultiQueryMode)
  const buildCurrentQuery = useAnalysisBuilderStore((state) => state.buildCurrentQuery)
  const buildAllQueries = useAnalysisBuilderStore((state) => state.buildAllQueries)
  const buildMultiQueryConfig = useAnalysisBuilderStore((state) => state.buildMultiQueryConfig)

  // Derived state
  const queryState = getCurrentState()
  const isMultiQueryMode = isMultiQueryModeGetter()
  const mergeKeys = getMergeKeys()

  // Build current query
  // NOTE: queryStates and activeQueryIndex must be in deps because buildCurrentQuery
  // reads them via get() internally, but the function reference itself is stable
  const currentQuery = useMemo(
    () => buildCurrentQuery(),
    [buildCurrentQuery, queryStates, activeQueryIndex]
  )

  // Build all queries
  // NOTE: queryStates and mergeStrategy must be in deps for same reason
  const allQueries = useMemo(
    () => buildAllQueries(),
    [buildAllQueries, queryStates, mergeStrategy]
  )

  // Build multi-query config
  const multiQueryConfig = useMemo(
    () => buildMultiQueryConfig(),
    [buildMultiQueryConfig, queryStates, mergeStrategy]
  )

  // Validate multi-query configuration
  const multiQueryValidation = useMemo((): MultiQueryValidationResult | null => {
    if (!isMultiQueryMode) return null
    return validateMultiQueryConfig(allQueries, mergeStrategy, mergeKeys || [])
  }, [isMultiQueryMode, allQueries, mergeStrategy, mergeKeys])

  // Check if query is valid
  const isValidQuery = useMemo(() => {
    return (
      (currentQuery.measures && currentQuery.measures.length > 0) ||
      (currentQuery.dimensions && currentQuery.dimensions.length > 0) ||
      (currentQuery.timeDimensions && currentQuery.timeDimensions.length > 0)
    )
  }, [currentQuery])

  return {
    queryState,
    queryStates,
    activeQueryIndex,
    mergeStrategy,
    isMultiQueryMode,
    mergeKeys,
    currentQuery,
    allQueries,
    multiQueryConfig,
    multiQueryValidation,
    isValidQuery,

    // Actions
    setActiveQueryIndex,
    setMergeStrategy,
    addQuery,
    removeQuery,
  }
}

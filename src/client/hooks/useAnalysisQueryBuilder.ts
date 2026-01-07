/**
 * useAnalysisQueryBuilder
 *
 * Builds and validates queries from Zustand store state.
 * Handles single-query and multi-query modes.
 */

import { useMemo } from 'react'
import { useAnalysisBuilderStore } from '../stores/analysisBuilderStore'
import { validateMultiQueryConfig, type MultiQueryValidationResult } from '../utils/multiQueryValidation'
import { buildCubeQuery } from '../components/AnalysisBuilder/utils'
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
  // Derived state
  const queryState = getCurrentState()
  const isMultiQueryMode = isMultiQueryModeGetter()
  const mergeKeys = getMergeKeys()

  // Build current query from active state
  const currentQuery = useMemo(() => {
    const current = queryStates[activeQueryIndex] || queryState
    return buildCubeQuery(current.metrics, current.breakdowns, current.filters, current.order)
  }, [queryStates, activeQueryIndex, queryState])

  // Build all queries (respect merge mode for shared breakdowns)
  const allQueries = useMemo(() => {
    const q1Breakdowns = queryStates[0]?.breakdowns || []
    return queryStates.map((qs, index) => {
      const breakdowns = mergeStrategy === 'merge' && index > 0 ? q1Breakdowns : qs.breakdowns
      return buildCubeQuery(qs.metrics, breakdowns, qs.filters, qs.order)
    })
  }, [queryStates, mergeStrategy])

  // Build multi-query config from queries
  const multiQueryConfig = useMemo(() => {
    if (queryStates.length <= 1) return null

    const validQueries = allQueries.filter(
      (q) =>
        (q.measures && q.measures.length > 0) ||
        (q.dimensions && q.dimensions.length > 0) ||
        (q.timeDimensions && q.timeDimensions.length > 0)
    )

    if (validQueries.length < 2) return null

    return {
      queries: validQueries,
      mergeStrategy,
      mergeKeys,
      queryLabels: validQueries.map((_, i) => `Q${i + 1}`),
    }
  }, [allQueries, queryStates.length, mergeStrategy, mergeKeys])

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

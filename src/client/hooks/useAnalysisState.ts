/**
 * useAnalysisState Hook
 *
 * Manages the core query state for AnalysisBuilder:
 * - Multi-query state management (queryStates array)
 * - Active query index tracking
 * - Merge strategy for combining query results
 * - Breakdown synchronization for merge mode
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { CubeQuery, QueryMergeStrategy, MultiQueryConfig } from '../types'
import { isMultiQueryConfig } from '../types'
import type { AnalysisBuilderState, AnalysisBuilderStorageState } from '../components/AnalysisBuilder/types'
import { generateId, generateMetricLabel, createInitialState } from '../components/AnalysisBuilder/utils'

export interface UseAnalysisStateOptions {
  /** Initial query configuration (single or multi-query) */
  initialQuery?: CubeQuery | MultiQueryConfig
  /** Cached state from localStorage */
  cachedStorage: AnalysisBuilderStorageState | null
}

export interface UseAnalysisStateReturn {
  /** Array of query states (one per tab) */
  queryStates: AnalysisBuilderState[]
  /** Setter for queryStates */
  setQueryStates: React.Dispatch<React.SetStateAction<AnalysisBuilderState[]>>
  /** Index of the currently active query tab */
  activeQueryIndex: number
  /** Setter for activeQueryIndex */
  setActiveQueryIndex: React.Dispatch<React.SetStateAction<number>>
  /** Strategy for merging multi-query results */
  mergeStrategy: QueryMergeStrategy
  /** Setter for mergeStrategy */
  setMergeStrategy: React.Dispatch<React.SetStateAction<QueryMergeStrategy>>
  /** Current active query state (convenience accessor) */
  state: AnalysisBuilderState
  /** Update the active query state */
  setState: (updater: AnalysisBuilderState | ((prev: AnalysisBuilderState) => AnalysisBuilderState)) => void
  /** Dimension keys for merge strategy (computed from Q1 breakdowns) */
  mergeKeys: string[] | undefined
  /** Whether we're in multi-query mode */
  isMultiQueryMode: boolean
  /** Convert a CubeQuery to AnalysisBuilderState */
  queryToState: (query: CubeQuery) => AnalysisBuilderState
}

/**
 * Convert a CubeQuery to AnalysisBuilderState
 */
function createQueryToState() {
  return (query: CubeQuery): AnalysisBuilderState => ({
    ...createInitialState(),
    metrics: (query.measures || []).map((field, index) => ({
      id: generateId(),
      field,
      label: generateMetricLabel(index)
    })),
    breakdowns: [
      ...(query.dimensions || []).map((field) => ({
        id: generateId(),
        field,
        isTimeDimension: false
      })),
      ...(query.timeDimensions || []).map((td) => ({
        id: generateId(),
        field: td.dimension,
        granularity: td.granularity,
        isTimeDimension: true
      }))
    ],
    filters: query.filters || [],
    order: query.order
  })
}

export function useAnalysisState({
  initialQuery,
  cachedStorage
}: UseAnalysisStateOptions): UseAnalysisStateReturn {
  // Create stable queryToState function
  const queryToState = useMemo(() => createQueryToState(), [])

  // Multi-query state management
  // queryStates holds an array of query configurations (one per tab)
  // For single-query mode, this is an array with one element
  const [queryStates, setQueryStates] = useState<AnalysisBuilderState[]>(() => {
    // If initialQuery is provided, detect if it's multi-query or single query internally
    if (initialQuery) {
      if (isMultiQueryConfig(initialQuery)) {
        // Multi-query config - parse each query
        const multiConfig = initialQuery as MultiQueryConfig
        return multiConfig.queries.map(queryToState)
      }
      // Single query - wrap in array
      const singleQuery = initialQuery as CubeQuery
      return [queryToState(singleQuery)]
    }

    // Use cached localStorage data if available
    if (cachedStorage) {
      // Support legacy single-query format and new multi-query format
      const queries = cachedStorage.queryStates || [{
        ...createInitialState(),
        metrics: cachedStorage.metrics || [],
        breakdowns: cachedStorage.breakdowns || [],
        filters: cachedStorage.filters || [],
        order: cachedStorage.order
      }]
      return queries
    }

    return [createInitialState()]
  })

  // Index of the currently active query tab
  const [activeQueryIndex, setActiveQueryIndex] = useState<number>(() => {
    if (cachedStorage?.activeQueryIndex !== undefined) {
      return cachedStorage.activeQueryIndex
    }
    return 0
  })

  // Merge strategy for combining multiple query results
  const [mergeStrategy, setMergeStrategy] = useState<QueryMergeStrategy>(() => {
    // Priority: initialQuery (if multi-query) > cached localStorage > default
    if (initialQuery && isMultiQueryConfig(initialQuery)) {
      const multiConfig = initialQuery as MultiQueryConfig
      if (multiConfig.mergeStrategy) {
        return multiConfig.mergeStrategy
      }
    }
    if (cachedStorage?.mergeStrategy) {
      return cachedStorage.mergeStrategy
    }
    return 'concat'
  })

  // Dimension keys to align data on for 'merge' strategy - auto-computed from Q1 breakdowns
  const mergeKeys = useMemo(() => {
    if (mergeStrategy !== 'merge' || queryStates.length === 0) return undefined
    const q1Breakdowns = queryStates[0].breakdowns
    if (q1Breakdowns.length === 0) return undefined
    return q1Breakdowns.map(b => b.field)
  }, [mergeStrategy, queryStates])

  // Derive the active query state (convenience accessor)
  const state = queryStates[activeQueryIndex] || createInitialState()

  // Helper to update the active query state
  const setState = useCallback((updater: AnalysisBuilderState | ((prev: AnalysisBuilderState) => AnalysisBuilderState)) => {
    setQueryStates(prevStates => {
      const newStates = [...prevStates]
      if (typeof updater === 'function') {
        newStates[activeQueryIndex] = updater(prevStates[activeQueryIndex] || createInitialState())
      } else {
        newStates[activeQueryIndex] = updater
      }
      return newStates
    })
  }, [activeQueryIndex])

  // Sync breakdowns from Q1 to other queries when in merge mode
  useEffect(() => {
    if (mergeStrategy !== 'merge' || queryStates.length <= 1) return

    const q1Breakdowns = queryStates[0].breakdowns

    // Check if other queries need syncing
    let needsSync = false
    for (let i = 1; i < queryStates.length; i++) {
      if (JSON.stringify(queryStates[i].breakdowns) !== JSON.stringify(q1Breakdowns)) {
        needsSync = true
        break
      }
    }

    if (needsSync) {
      setQueryStates(prev => prev.map((qs, i) =>
        i === 0 ? qs : { ...qs, breakdowns: [...q1Breakdowns] }
      ))
    }
  }, [mergeStrategy, queryStates])

  // Check if we're in multi-query mode (more than one query with content)
  const isMultiQueryMode = useMemo(() => {
    if (queryStates.length <= 1) return false
    // Check if at least 2 queries have content
    const queriesWithContent = queryStates.filter(qs =>
      qs.metrics.length > 0 || qs.breakdowns.length > 0
    )
    return queriesWithContent.length > 1
  }, [queryStates])

  return {
    queryStates,
    setQueryStates,
    activeQueryIndex,
    setActiveQueryIndex,
    mergeStrategy,
    setMergeStrategy,
    state,
    setState,
    mergeKeys,
    isMultiQueryMode,
    queryToState
  }
}

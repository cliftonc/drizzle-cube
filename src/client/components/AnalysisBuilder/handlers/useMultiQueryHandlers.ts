/**
 * Hook for multi-query related handlers in AnalysisBuilder
 *
 * Handles:
 * - Adding new query tabs
 * - Removing query tabs
 * - Switching between query tabs
 * - Changing merge strategy
 */

import { useCallback } from 'react'
import type { AnalysisBuilderState } from '../types'
import type { QueryMergeStrategy } from '../../../types'
import { createInitialState } from '../utils'

interface UseMultiQueryHandlersOptions {
  /** All query states */
  queryStates: AnalysisBuilderState[]
  /** Set all query states */
  setQueryStates: (updater: (prev: AnalysisBuilderState[]) => AnalysisBuilderState[]) => void
  /** Active query index */
  activeQueryIndex: number
  /** Set active query index */
  setActiveQueryIndex: (index: number) => void
  /** Set merge strategy */
  setMergeStrategy: (strategy: QueryMergeStrategy) => void
}

interface UseMultiQueryHandlersResult {
  /** Add a new query tab (copies current query's config) */
  handleAddQuery: () => void
  /** Remove a query tab at specified index */
  handleRemoveQuery: (index: number) => void
  /** Change active query tab */
  handleActiveQueryChange: (index: number) => void
  /** Update merge strategy */
  handleMergeStrategyChange: (strategy: QueryMergeStrategy) => void
}

export function useMultiQueryHandlers({
  queryStates,
  setQueryStates,
  activeQueryIndex,
  setActiveQueryIndex,
  setMergeStrategy
}: UseMultiQueryHandlersOptions): UseMultiQueryHandlersResult {
  /**
   * Add a new query tab - copies current query's metrics, breakdowns, filters
   */
  const handleAddQuery = useCallback(() => {
    const currentState = queryStates[activeQueryIndex] || createInitialState()
    const newState: AnalysisBuilderState = {
      ...createInitialState(),
      metrics: [...currentState.metrics],
      breakdowns: [...currentState.breakdowns],
      filters: [...currentState.filters]
    }
    setQueryStates(prev => [...prev, newState])
    // Switch to the new tab
    setActiveQueryIndex(queryStates.length)
  }, [queryStates, activeQueryIndex, setQueryStates, setActiveQueryIndex])

  /**
   * Remove a query tab at specified index
   * Adjusts active index if needed (never removes last query)
   */
  const handleRemoveQuery = useCallback((index: number) => {
    setQueryStates(prev => {
      // Don't allow removing the last query
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
    // Adjust active index if needed
    if (index === activeQueryIndex) {
      // If removing active tab, switch to previous (or first if removing first)
      setActiveQueryIndex(Math.max(0, activeQueryIndex - 1))
    } else if (index < activeQueryIndex) {
      // Shift active index down if removing a tab before it
      setActiveQueryIndex(activeQueryIndex - 1)
    }
  }, [activeQueryIndex, setQueryStates, setActiveQueryIndex])

  /**
   * Change active query tab
   */
  const handleActiveQueryChange = useCallback((index: number) => {
    setActiveQueryIndex(index)
  }, [setActiveQueryIndex])

  /**
   * Update merge strategy
   */
  const handleMergeStrategyChange = useCallback((strategy: QueryMergeStrategy) => {
    setMergeStrategy(strategy)
  }, [setMergeStrategy])

  return {
    handleAddQuery,
    handleRemoveQuery,
    handleActiveQueryChange,
    handleMergeStrategyChange
  }
}

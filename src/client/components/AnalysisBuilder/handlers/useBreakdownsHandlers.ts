/**
 * Hook for breakdown-related handlers in AnalysisBuilder
 *
 * Handles:
 * - Adding breakdowns (opens field modal)
 * - Removing breakdowns
 * - Changing granularity for time dimensions
 * - Toggling comparison mode for time dimensions
 * - Reordering breakdowns via drag/drop
 */

import { useCallback } from 'react'
import type { AnalysisBuilderState, BreakdownItem } from '../types'
import type { Filter, ChartType, ChartAxisConfig, QueryMergeStrategy } from '../../../types'
import { findDateFilterForField } from '../utils'
import { convertDateRangeTypeToValue } from '../../../shared/utils'
import { getSmartChartDefaults } from '../../../shared/chartDefaults'

/** Modal mode for field search - subset used in AnalysisBuilder */
type FieldModalMode = 'metrics' | 'breakdown'

interface UseBreakdownsHandlersOptions {
  /** Set state function for the current query */
  setState: (updater: (prev: AnalysisBuilderState) => AnalysisBuilderState) => void
  /** Set the field modal open state */
  setShowFieldModal: (show: boolean) => void
  /** Set the field modal mode */
  setFieldModalMode: (mode: FieldModalMode) => void
  /** Current merge strategy for multi-query mode */
  mergeStrategy: QueryMergeStrategy
  /** Active query index in multi-query mode */
  activeQueryIndex: number
  /** All query states in multi-query mode */
  queryStates: AnalysisBuilderState[]
  /** Set all query states */
  setQueryStates: (updater: (prev: AnalysisBuilderState[]) => AnalysisBuilderState[]) => void
  /** Current chart type */
  chartType: ChartType
  /** Set chart type */
  setChartType: (type: ChartType) => void
  /** Set chart config */
  setChartConfig: (config: ChartAxisConfig) => void
  /** Current state (for reading breakdowns, filters, metrics) */
  state: AnalysisBuilderState
}

interface UseBreakdownsHandlersResult {
  /** Open field modal in breakdown mode */
  handleAddBreakdown: () => void
  /** Remove a breakdown by ID */
  handleRemoveBreakdown: (id: string) => void
  /** Change granularity for a time dimension breakdown */
  handleBreakdownGranularityChange: (id: string, granularity: string) => void
  /** Toggle comparison mode for a time dimension breakdown */
  handleBreakdownComparisonToggle: (breakdownId: string) => void
  /** Reorder breakdowns via drag/drop */
  handleReorderBreakdowns: (fromIndex: number, toIndex: number) => void
}

export function useBreakdownsHandlers({
  setState,
  setShowFieldModal,
  setFieldModalMode,
  mergeStrategy,
  activeQueryIndex,
  queryStates,
  setQueryStates,
  chartType,
  setChartType,
  setChartConfig,
  state
}: UseBreakdownsHandlersOptions): UseBreakdownsHandlersResult {
  /**
   * Open the field modal in breakdown mode
   */
  const handleAddBreakdown = useCallback(() => {
    setFieldModalMode('breakdown')
    setShowFieldModal(true)
  }, [setFieldModalMode, setShowFieldModal])

  /**
   * Remove a breakdown by ID and clean up any associated sort order
   */
  const handleRemoveBreakdown = useCallback((id: string) => {
    setState((prev) => {
      // Find the field name before removing
      const fieldToRemove = prev.breakdowns.find((b) => b.id === id)?.field
      const newBreakdowns = prev.breakdowns.filter((b) => b.id !== id)

      // Clean up any sort order for the removed field
      let newOrder = prev.order
      if (fieldToRemove && newOrder && newOrder[fieldToRemove]) {
        newOrder = { ...newOrder }
        delete newOrder[fieldToRemove]
        if (Object.keys(newOrder).length === 0) {
          newOrder = undefined
        }
      }

      return {
        ...prev,
        breakdowns: newBreakdowns,
        order: newOrder,
        resultsStale: true
      }
    })
  }, [setState])

  /**
   * Change granularity for a time dimension breakdown
   * In merge mode, updates Q1's breakdowns (source of truth)
   */
  const handleBreakdownGranularityChange = useCallback(
    (id: string, granularity: string) => {
      // In merge mode, granularity changes should update Q1's breakdowns (source of truth)
      // since the sync effect copies Q1 → other queries
      if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
        // Update Q1's breakdowns directly
        setQueryStates(prev => {
          const newStates = [...prev]
          newStates[0] = {
            ...newStates[0],
            breakdowns: newStates[0].breakdowns.map((b) =>
              b.id === id ? { ...b, granularity } : b
            ),
            resultsStale: true
          }
          return newStates
        })
      } else {
        // Normal case: update active query's breakdowns
        setState((prev) => ({
          ...prev,
          breakdowns: prev.breakdowns.map((b) =>
            b.id === id ? { ...b, granularity } : b
          ),
          resultsStale: true
        }))
      }
    },
    [mergeStrategy, activeQueryIndex, setState, setQueryStates]
  )

  /**
   * Toggle comparison mode for a time dimension breakdown
   *
   * When enabling comparison:
   * - Auto-adds a date filter if none exists (last 30 days)
   * - Switches chart type to 'line' if not already
   * - Clears comparison from other time dimensions (only one allowed)
   */
  const handleBreakdownComparisonToggle = useCallback(
    (breakdownId: string) => {
      // Check if we're enabling comparison (the breakdown currently doesn't have it)
      // In merge mode, use Q1's breakdowns as the source of truth
      const sourceBreakdowns = (mergeStrategy === 'merge' && activeQueryIndex > 0)
        ? queryStates[0]?.breakdowns || []
        : state.breakdowns
      const targetBreakdown = sourceBreakdowns.find(b => b.id === breakdownId)
      const isEnabling = targetBreakdown && !targetBreakdown.enableComparison

      // If enabling comparison and no date filter exists, auto-add one (last 30 days)
      if (isEnabling && targetBreakdown) {
        const currentFilters = (mergeStrategy === 'merge' && activeQueryIndex > 0)
          ? queryStates[0]?.filters || []
          : state.filters
        const hasDateFilter = findDateFilterForField(currentFilters, targetBreakdown.field)

        if (!hasDateFilter) {
          // Auto-add a date filter with 'last 30 days' range
          const newFilter: Filter = {
            member: targetBreakdown.field,
            operator: 'inDateRange',
            values: [],
            dateRange: convertDateRangeTypeToValue('last_30_days')
          } as Filter

          // Add the filter to the appropriate query's filters
          if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
            setQueryStates(prev => {
              const newStates = [...prev]
              newStates[0] = {
                ...newStates[0],
                filters: [...newStates[0].filters, newFilter]
              }
              return newStates
            })
          } else {
            setState((prev) => ({
              ...prev,
              filters: [...prev.filters, newFilter]
            }))
          }
        }
      }

      // If enabling comparison and chart type is not 'line', switch to line chart first
      // (comparison only works well with line charts)
      if (isEnabling && chartType !== 'line') {
        setChartType('line')
        // Update chart config for line chart
        const { chartConfig: newChartConfig } = getSmartChartDefaults(
          state.metrics,
          state.breakdowns,
          'line'
        )
        setChartConfig(newChartConfig)
      }

      // Helper to update breakdowns with comparison toggle
      const updateBreakdowns = (breakdowns: BreakdownItem[]) =>
        breakdowns.map((b) => {
          if (b.id === breakdownId) {
            // Toggle this breakdown's comparison
            return { ...b, enableComparison: !b.enableComparison }
          }
          // Clear comparison from other time dimensions when enabling (only one allowed)
          if (b.isTimeDimension && b.enableComparison) {
            return { ...b, enableComparison: false }
          }
          return b
        })

      // In merge mode, update Q1's breakdowns (source of truth)
      if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
        setQueryStates(prev => {
          const newStates = [...prev]
          newStates[0] = {
            ...newStates[0],
            breakdowns: updateBreakdowns(newStates[0].breakdowns),
            resultsStale: true
          }
          return newStates
        })
      } else {
        // Normal case: update active query's breakdowns
        setState((prev) => ({
          ...prev,
          breakdowns: updateBreakdowns(prev.breakdowns),
          resultsStale: true
        }))
      }
    },
    [chartType, state.breakdowns, state.filters, state.metrics, mergeStrategy, activeQueryIndex, queryStates, setState, setQueryStates, setChartType, setChartConfig]
  )

  /**
   * Reorder breakdowns via drag and drop
   */
  const handleReorderBreakdowns = useCallback(
    (fromIndex: number, toIndex: number) => {
      setState((prev) => {
        const newBreakdowns = [...prev.breakdowns]
        const [movedItem] = newBreakdowns.splice(fromIndex, 1)
        newBreakdowns.splice(toIndex, 0, movedItem)
        return {
          ...prev,
          breakdowns: newBreakdowns,
          resultsStale: true
        }
      })
    },
    [setState]
  )

  return {
    handleAddBreakdown,
    handleRemoveBreakdown,
    handleBreakdownGranularityChange,
    handleBreakdownComparisonToggle,
    handleReorderBreakdowns
  }
}

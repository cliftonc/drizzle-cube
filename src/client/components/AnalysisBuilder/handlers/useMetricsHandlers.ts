/**
 * Hook for metrics-related handlers in AnalysisBuilder
 *
 * Handles:
 * - Adding metrics (opens field modal)
 * - Removing metrics
 * - Selecting fields from modal
 * - Reordering metrics via drag/drop
 */

import { useCallback } from 'react'
import type { AnalysisBuilderState, MetricItem, BreakdownItem } from '../types'
import type { MetaField } from '../../../shared/types'
import { generateId, generateMetricLabel } from '../utils'

/** Modal mode for field search - subset used in AnalysisBuilder */
type FieldModalMode = 'metrics' | 'breakdown'

interface UseMetricsHandlersOptions {
  /** Set state function for the current query */
  setState: (updater: (prev: AnalysisBuilderState) => AnalysisBuilderState) => void
  /** Current field modal mode */
  fieldModalMode: FieldModalMode
  /** Set the field modal open state */
  setShowFieldModal: (show: boolean) => void
  /** Set the field modal mode */
  setFieldModalMode: (mode: FieldModalMode) => void
}

interface UseMetricsHandlersResult {
  /** Open field modal in metrics mode */
  handleAddMetric: () => void
  /** Remove a metric by ID */
  handleRemoveMetric: (id: string) => void
  /** Handle field selection from modal (for metrics mode) */
  handleFieldSelected: (
    field: MetaField,
    fieldType: 'measure' | 'dimension' | 'timeDimension',
    cubeName: string,
    keepOpen?: boolean
  ) => void
  /** Reorder metrics via drag/drop */
  handleReorderMetrics: (fromIndex: number, toIndex: number) => void
}

export function useMetricsHandlers({
  setState,
  fieldModalMode,
  setShowFieldModal,
  setFieldModalMode
}: UseMetricsHandlersOptions): UseMetricsHandlersResult {
  /**
   * Open the field modal in metrics mode
   */
  const handleAddMetric = useCallback(() => {
    setFieldModalMode('metrics')
    setShowFieldModal(true)
  }, [setFieldModalMode, setShowFieldModal])

  /**
   * Remove a metric by ID and clean up any associated sort order
   */
  const handleRemoveMetric = useCallback((id: string) => {
    setState((prev) => {
      // Find the field name before removing
      const fieldToRemove = prev.metrics.find((m) => m.id === id)?.field
      const newMetrics = prev.metrics.filter((m) => m.id !== id)

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
        metrics: newMetrics,
        order: newOrder,
        resultsStale: true
      }
    })
  }, [setState])

  /**
   * Handle field selection from the modal
   * - In metrics mode: toggles measure selection
   * - In breakdown mode: toggles dimension selection
   */
  const handleFieldSelected = useCallback(
    (field: MetaField, fieldType: 'measure' | 'dimension' | 'timeDimension', _cubeName: string, keepOpen?: boolean) => {
      if (fieldModalMode === 'metrics' && fieldType === 'measure') {
        // Toggle metric - add if not present, remove if already added
        setState((prev) => {
          const existingIndex = prev.metrics.findIndex((m) => m.field === field.name)
          if (existingIndex >= 0) {
            // Remove existing metric
            return {
              ...prev,
              metrics: prev.metrics.filter((_, i) => i !== existingIndex),
              resultsStale: true
            }
          }
          // Add new metric
          const newMetric: MetricItem = {
            id: generateId(),
            field: field.name,
            label: generateMetricLabel(prev.metrics.length)
          }
          return {
            ...prev,
            metrics: [...prev.metrics, newMetric],
            resultsStale: true
          }
        })
      } else if (fieldModalMode === 'breakdown') {
        // Toggle breakdown - add if not present, remove if already added
        const isTimeDimension = fieldType === 'timeDimension'
        setState((prev) => {
          const existingIndex = prev.breakdowns.findIndex((b) => b.field === field.name)
          if (existingIndex >= 0) {
            // Remove existing breakdown
            return {
              ...prev,
              breakdowns: prev.breakdowns.filter((_, i) => i !== existingIndex),
              resultsStale: true
            }
          }

          // Check if we already have a time dimension breakdown (only allow one)
          if (isTimeDimension) {
            const hasExistingTimeDimension = prev.breakdowns.some((b) => b.isTimeDimension)
            if (hasExistingTimeDimension) {
              // Don't add - already have a time dimension breakdown
              // Could show a notification here in the future
              return prev
            }
          }

          // Add new breakdown
          const newBreakdown: BreakdownItem = {
            id: generateId(),
            field: field.name,
            isTimeDimension,
            granularity: isTimeDimension ? 'month' : undefined
          }
          return {
            ...prev,
            breakdowns: [...prev.breakdowns, newBreakdown],
            resultsStale: true
          }
        })
      }
      // Only close modal if not doing shift-click multi-select
      if (!keepOpen) {
        setShowFieldModal(false)
      }
    },
    [fieldModalMode, setState, setShowFieldModal]
  )

  /**
   * Reorder metrics via drag and drop
   */
  const handleReorderMetrics = useCallback(
    (fromIndex: number, toIndex: number) => {
      setState((prev) => {
        const newMetrics = [...prev.metrics]
        const [movedItem] = newMetrics.splice(fromIndex, 1)
        newMetrics.splice(toIndex, 0, movedItem)
        return {
          ...prev,
          metrics: newMetrics,
          resultsStale: true
        }
      })
    },
    [setState]
  )

  return {
    handleAddMetric,
    handleRemoveMetric,
    handleFieldSelected,
    handleReorderMetrics
  }
}

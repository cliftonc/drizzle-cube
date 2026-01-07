/**
 * useAnalysisCombinedFields
 *
 * Computes combined metrics and breakdowns from all queries in multi-query mode.
 * In single-query mode, returns the current query's metrics and breakdowns.
 */

import { useMemo } from 'react'
import type { AnalysisBuilderState, MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types'
import type { QueryMergeStrategy } from '../types'

export interface UseAnalysisCombinedFieldsOptions {
  queryState: AnalysisBuilderState
  queryStates: AnalysisBuilderState[]
  isMultiQueryMode: boolean
  mergeStrategy: QueryMergeStrategy
  activeQueryIndex: number
}

export interface UseAnalysisCombinedFieldsResult {
  /** Combined metrics from all queries (for chart config) */
  combinedMetrics: MetricItem[]
  /** Combined breakdowns from all queries (for chart config) */
  combinedBreakdowns: BreakdownItem[]
  /** Effective breakdowns for display (Q1's in merge mode, otherwise current query's) */
  effectiveBreakdowns: BreakdownItem[]
}

export function useAnalysisCombinedFields(
  options: UseAnalysisCombinedFieldsOptions
): UseAnalysisCombinedFieldsResult {
  const { queryState, queryStates, isMultiQueryMode, mergeStrategy, activeQueryIndex } = options

  // Combined metrics from all queries
  const combinedMetrics = useMemo(() => {
    if (!isMultiQueryMode) return queryState.metrics
    const seen = new Set<string>()
    const combined: MetricItem[] = []
    for (let qIndex = 0; qIndex < queryStates.length; qIndex++) {
      const qs = queryStates[qIndex]
      for (const metric of qs.metrics) {
        const key = `Q${qIndex + 1}:${metric.field}`
        if (!seen.has(key)) {
          seen.add(key)
          combined.push({
            ...metric,
            label: `${metric.label} (Q${qIndex + 1})`,
          })
        }
      }
    }
    return combined
  }, [isMultiQueryMode, queryStates, queryState.metrics])

  // Combined breakdowns from all queries
  const combinedBreakdowns = useMemo(() => {
    if (!isMultiQueryMode) return queryState.breakdowns
    const seen = new Set<string>()
    const combined: BreakdownItem[] = []
    for (const qs of queryStates) {
      for (const breakdown of qs.breakdowns) {
        if (!seen.has(breakdown.field)) {
          seen.add(breakdown.field)
          combined.push(breakdown)
        }
      }
    }
    return combined
  }, [isMultiQueryMode, queryStates, queryState.breakdowns])

  // Effective breakdowns for the current view
  // In merge mode, Q2+ should visually show Q1's breakdowns since they're shared
  const effectiveBreakdowns = useMemo(() => {
    if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
      // Show Q1's breakdowns for Q2+ in merge mode
      return queryStates[0]?.breakdowns || []
    }
    return queryState.breakdowns
  }, [mergeStrategy, activeQueryIndex, queryStates, queryState.breakdowns])

  return {
    combinedMetrics,
    combinedBreakdowns,
    effectiveBreakdowns,
  }
}

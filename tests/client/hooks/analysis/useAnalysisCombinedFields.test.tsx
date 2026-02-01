/**
 * Tests for useAnalysisCombinedFields hook
 *
 * This hook computes combined metrics and breakdowns from all queries
 * in multi-query mode. In single-query mode, it returns the current
 * query's metrics and breakdowns.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalysisCombinedFields } from '../../../../src/client/hooks/useAnalysisCombinedFields'
import type { AnalysisBuilderState } from '../../../../src/client/components/AnalysisBuilder/types'
import type { FilterOperator, Filter } from '../../../../src/client/types'

// Helper to create a mock query state
function createQueryState(
  metrics: Array<{ id: string; field: string; label: string }> = [],
  breakdowns: Array<{ id: string; field: string; isTimeDimension: boolean; granularity?: string }> = [],
  filters: Array<{ member: string; operator: FilterOperator; values: string[] }> = []
): AnalysisBuilderState {
  return {
    metrics,
    breakdowns,
    filters,
    validationStatus: 'idle',
    validationError: null,
  }
}

describe('useAnalysisCombinedFields', () => {
  // ==========================================================================
  // Single Query Mode Tests
  // ==========================================================================
  describe('single query mode', () => {
    it('should return current query metrics when not in multi-query mode', () => {
      const queryState = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
        { id: '2', field: 'Employees.avgSalary', label: 'B' },
      ])

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState,
          queryStates: [queryState],
          isMultiQueryMode: false,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedMetrics).toHaveLength(2)
      expect(result.current.combinedMetrics[0].field).toBe('Employees.count')
      expect(result.current.combinedMetrics[1].field).toBe('Employees.avgSalary')
    })

    it('should return current query breakdowns when not in multi-query mode', () => {
      const queryState = createQueryState(
        [],
        [
          { id: '1', field: 'Employees.department', isTimeDimension: false },
          { id: '2', field: 'Employees.createdAt', isTimeDimension: true, granularity: 'day' },
        ]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState,
          queryStates: [queryState],
          isMultiQueryMode: false,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedBreakdowns).toHaveLength(2)
      expect(result.current.combinedBreakdowns[0].field).toBe('Employees.department')
      expect(result.current.combinedBreakdowns[1].isTimeDimension).toBe(true)
    })

    it('should return current query breakdowns as effectiveBreakdowns in single-query mode', () => {
      const queryState = createQueryState(
        [],
        [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState,
          queryStates: [queryState],
          isMultiQueryMode: false,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.effectiveBreakdowns).toHaveLength(1)
      expect(result.current.effectiveBreakdowns[0].field).toBe('Employees.department')
    })

    it('should handle empty metrics and breakdowns', () => {
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState,
          queryStates: [queryState],
          isMultiQueryMode: false,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedMetrics).toHaveLength(0)
      expect(result.current.combinedBreakdowns).toHaveLength(0)
      expect(result.current.effectiveBreakdowns).toHaveLength(0)
    })
  })

  // ==========================================================================
  // Multi-Query Mode Tests
  // ==========================================================================
  describe('multi-query mode', () => {
    it('should combine metrics from all queries with query prefix labels', () => {
      const q1 = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
      ])
      const q2 = createQueryState([
        { id: '2', field: 'Employees.avgSalary', label: 'A' },
      ])

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedMetrics).toHaveLength(2)
      expect(result.current.combinedMetrics[0].label).toBe('A (Q1)')
      expect(result.current.combinedMetrics[1].label).toBe('A (Q2)')
    })

    it('should combine breakdowns from all queries without duplicates', () => {
      const q1 = createQueryState(
        [],
        [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      )
      const q2 = createQueryState(
        [],
        [
          { id: '2', field: 'Employees.department', isTimeDimension: false }, // duplicate
          { id: '3', field: 'Employees.name', isTimeDimension: false },
        ]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      // Should deduplicate breakdowns by field
      expect(result.current.combinedBreakdowns).toHaveLength(2)
      expect(result.current.combinedBreakdowns[0].field).toBe('Employees.department')
      expect(result.current.combinedBreakdowns[1].field).toBe('Employees.name')
    })

    it('should deduplicate metrics with same field in same query', () => {
      const q1 = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
        { id: '2', field: 'Employees.count', label: 'B' }, // same field, different label
      ])

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      // Hook deduplicates by Q{index}:field, so same field only appears once
      expect(result.current.combinedMetrics).toHaveLength(1)
    })

    it('should preserve original metric data with modified label', () => {
      const q1 = createQueryState([
        { id: 'metric-1', field: 'Employees.count', label: 'Count' },
      ])

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedMetrics[0].id).toBe('metric-1')
      expect(result.current.combinedMetrics[0].field).toBe('Employees.count')
      expect(result.current.combinedMetrics[0].label).toBe('Count (Q1)')
    })

    it('should handle three or more queries', () => {
      const q1 = createQueryState([{ id: '1', field: 'Employees.count', label: 'A' }])
      const q2 = createQueryState([{ id: '2', field: 'Employees.avgSalary', label: 'A' }])
      const q3 = createQueryState([{ id: '3', field: 'Employees.totalSalary', label: 'A' }])

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1, q2, q3],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedMetrics).toHaveLength(3)
      expect(result.current.combinedMetrics[0].label).toBe('A (Q1)')
      expect(result.current.combinedMetrics[1].label).toBe('A (Q2)')
      expect(result.current.combinedMetrics[2].label).toBe('A (Q3)')
    })
  })

  // ==========================================================================
  // Merge Strategy Tests
  // ==========================================================================
  describe('merge strategy', () => {
    it('should show Q1 breakdowns for Q2+ in merge mode', () => {
      const q1 = createQueryState(
        [],
        [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      )
      const q2 = createQueryState(
        [],
        [{ id: '2', field: 'Employees.name', isTimeDimension: false }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q2,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'merge',
          activeQueryIndex: 1, // Viewing Q2
        })
      )

      // effectiveBreakdowns should show Q1's breakdowns for Q2
      expect(result.current.effectiveBreakdowns).toHaveLength(1)
      expect(result.current.effectiveBreakdowns[0].field).toBe('Employees.department')
    })

    it('should show own breakdowns for Q1 in merge mode', () => {
      const q1 = createQueryState(
        [],
        [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      )
      const q2 = createQueryState(
        [],
        [{ id: '2', field: 'Employees.name', isTimeDimension: false }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'merge',
          activeQueryIndex: 0, // Viewing Q1
        })
      )

      // effectiveBreakdowns should show Q1's own breakdowns
      expect(result.current.effectiveBreakdowns).toHaveLength(1)
      expect(result.current.effectiveBreakdowns[0].field).toBe('Employees.department')
    })

    it('should show own breakdowns in concat mode regardless of query index', () => {
      const q1 = createQueryState(
        [],
        [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      )
      const q2 = createQueryState(
        [],
        [{ id: '2', field: 'Employees.name', isTimeDimension: false }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q2,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 1, // Viewing Q2
        })
      )

      // In concat mode, Q2 should show its own breakdowns
      expect(result.current.effectiveBreakdowns).toHaveLength(1)
      expect(result.current.effectiveBreakdowns[0].field).toBe('Employees.name')
    })

    it('should handle empty Q1 breakdowns in merge mode', () => {
      const q1 = createQueryState([], []) // No breakdowns
      const q2 = createQueryState(
        [],
        [{ id: '2', field: 'Employees.name', isTimeDimension: false }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q2,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'merge',
          activeQueryIndex: 1,
        })
      )

      // effectiveBreakdowns should be empty (Q1's breakdowns)
      expect(result.current.effectiveBreakdowns).toHaveLength(0)
    })
  })

  // ==========================================================================
  // Memoization Tests
  // ==========================================================================
  describe('memoization', () => {
    it('should return stable references when inputs do not change', () => {
      const queryState = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
      ])
      const queryStates = [queryState]

      const { result, rerender } = renderHook(
        () =>
          useAnalysisCombinedFields({
            queryState,
            queryStates,
            isMultiQueryMode: false,
            mergeStrategy: 'concat',
            activeQueryIndex: 0,
          })
      )

      const firstMetrics = result.current.combinedMetrics
      const firstBreakdowns = result.current.combinedBreakdowns
      const firstEffective = result.current.effectiveBreakdowns

      // Rerender with same props
      rerender()

      expect(result.current.combinedMetrics).toBe(firstMetrics)
      expect(result.current.combinedBreakdowns).toBe(firstBreakdowns)
      expect(result.current.effectiveBreakdowns).toBe(firstEffective)
    })

    it('should update when queryState changes', () => {
      const queryState1 = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
      ])
      const queryState2 = createQueryState([
        { id: '2', field: 'Employees.avgSalary', label: 'B' },
      ])

      const { result, rerender } = renderHook(
        ({ qs }) =>
          useAnalysisCombinedFields({
            queryState: qs,
            queryStates: [qs],
            isMultiQueryMode: false,
            mergeStrategy: 'concat',
            activeQueryIndex: 0,
          }),
        { initialProps: { qs: queryState1 } }
      )

      expect(result.current.combinedMetrics[0].field).toBe('Employees.count')

      rerender({ qs: queryState2 })

      expect(result.current.combinedMetrics[0].field).toBe('Employees.avgSalary')
    })

    it('should update when isMultiQueryMode changes', () => {
      const queryState = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
      ])

      const { result, rerender } = renderHook(
        ({ multi }) =>
          useAnalysisCombinedFields({
            queryState,
            queryStates: [queryState],
            isMultiQueryMode: multi,
            mergeStrategy: 'concat',
            activeQueryIndex: 0,
          }),
        { initialProps: { multi: false } }
      )

      expect(result.current.combinedMetrics[0].label).toBe('A')

      rerender({ multi: true })

      expect(result.current.combinedMetrics[0].label).toBe('A (Q1)')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('edge cases', () => {
    it('should handle undefined queryStates gracefully', () => {
      const queryState = createQueryState([
        { id: '1', field: 'Employees.count', label: 'A' },
      ])

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState,
          queryStates: [],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedMetrics).toHaveLength(0)
      expect(result.current.combinedBreakdowns).toHaveLength(0)
    })

    it('should handle out-of-bounds activeQueryIndex in merge mode', () => {
      const q1 = createQueryState(
        [],
        [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1],
          isMultiQueryMode: true,
          mergeStrategy: 'merge',
          activeQueryIndex: 5, // Out of bounds
        })
      )

      // Should still return Q1 breakdowns since Q1 exists
      expect(result.current.effectiveBreakdowns).toHaveLength(1)
    })

    it('should handle time dimensions with different granularities', () => {
      const q1 = createQueryState(
        [],
        [{ id: '1', field: 'Employees.createdAt', isTimeDimension: true, granularity: 'day' }]
      )
      const q2 = createQueryState(
        [],
        [{ id: '2', field: 'Employees.createdAt', isTimeDimension: true, granularity: 'month' }]
      )

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: q1,
          queryStates: [q1, q2],
          isMultiQueryMode: true,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      // First instance should be kept (deduplication by field)
      expect(result.current.combinedBreakdowns).toHaveLength(1)
      expect(result.current.combinedBreakdowns[0].granularity).toBe('day')
    })

    it('should preserve breakdown enableComparison flag', () => {
      const queryState = createQueryState(
        [],
        [{
          id: '1',
          field: 'Employees.createdAt',
          isTimeDimension: true,
          granularity: 'day',
        }]
      )

      // Add enableComparison to the breakdown
      const stateWithComparison = {
        ...queryState,
        breakdowns: [{
          ...queryState.breakdowns[0],
          enableComparison: true,
        }]
      }

      const { result } = renderHook(() =>
        useAnalysisCombinedFields({
          queryState: stateWithComparison,
          queryStates: [stateWithComparison],
          isMultiQueryMode: false,
          mergeStrategy: 'concat',
          activeQueryIndex: 0,
        })
      )

      expect(result.current.combinedBreakdowns[0].enableComparison).toBe(true)
    })
  })
})

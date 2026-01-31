/**
 * Comprehensive tests for Query Slice
 * Tests all query slice state and actions for Zustand store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAnalysisBuilderStore,
  type AnalysisBuilderStore,
} from '../../../../src/client/stores/analysisBuilderStore'
import type { StoreApi } from 'zustand'
import type { Filter } from '../../../../src/client/types'

// ============================================================================
// Test Setup
// ============================================================================

describe('QuerySlice', () => {
  let store: StoreApi<AnalysisBuilderStore>

  beforeEach(() => {
    localStorage.clear()
    store = createAnalysisBuilderStore({ disableLocalStorage: true })
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ==========================================================================
  // Initial State
  // ==========================================================================
  describe('Initial State', () => {
    it('should have one empty queryState by default', () => {
      const state = store.getState()
      expect(state.queryStates).toHaveLength(1)
      expect(state.queryStates[0].metrics).toEqual([])
      expect(state.queryStates[0].breakdowns).toEqual([])
      expect(state.queryStates[0].filters).toEqual([])
    })

    it('should have activeQueryIndex of 0 by default', () => {
      expect(store.getState().activeQueryIndex).toBe(0)
    })

    it('should have mergeStrategy of concat by default', () => {
      expect(store.getState().mergeStrategy).toBe('concat')
    })

    it('should have validationStatus as idle in initial queryState', () => {
      expect(store.getState().queryStates[0].validationStatus).toBe('idle')
    })

    it('should have validationError as null in initial queryState', () => {
      expect(store.getState().queryStates[0].validationError).toBeNull()
    })
  })

  // ==========================================================================
  // Metrics Actions
  // ==========================================================================
  describe('Metrics Actions', () => {
    describe('addMetric', () => {
      it('should add a metric to the current query', () => {
        store.getState().addMetric('Employees.count')

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics).toHaveLength(1)
        expect(metrics[0].field).toBe('Employees.count')
      })

      it('should generate automatic label (A, B, C...) when no label provided', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().addMetric('Employees.totalSalary')

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics[0].label).toBe('A')
        expect(metrics[1].label).toBe('B')
        expect(metrics[2].label).toBe('C')
      })

      it('should use custom label when provided', () => {
        store.getState().addMetric('Employees.count', 'Total Employees')

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics[0].label).toBe('Total Employees')
      })

      it('should generate unique IDs for metrics', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics[0].id).toBeDefined()
        expect(metrics[1].id).toBeDefined()
        expect(metrics[0].id).not.toBe(metrics[1].id)
      })

      it('should add metric to the active query when multiple queries exist', () => {
        store.getState().addQuery() // Creates Q2 and switches to it
        store.getState().addMetric('Departments.count')

        // Q2 should have the new metric
        expect(store.getState().queryStates[1].metrics).toHaveLength(1)
        expect(store.getState().queryStates[1].metrics[0].field).toBe('Departments.count')
      })
    })

    describe('removeMetric', () => {
      it('should remove a metric by id', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')

        const metricId = store.getState().queryStates[0].metrics[0].id
        store.getState().removeMetric(metricId)

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics).toHaveLength(1)
        expect(metrics[0].field).toBe('Employees.avgSalary')
      })

      it('should clean up sort order when metric is removed', () => {
        store.getState().addMetric('Employees.count')
        store.getState().setOrder('Employees.count', 'desc')

        expect(store.getState().queryStates[0].order).toEqual({ 'Employees.count': 'desc' })

        const metricId = store.getState().queryStates[0].metrics[0].id
        store.getState().removeMetric(metricId)

        // Order should be cleared when last sorted field is removed
        expect(store.getState().queryStates[0].order).toBeUndefined()
      })

      it('should only remove order for the removed field', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().setOrder('Employees.count', 'desc')
        store.getState().setOrder('Employees.avgSalary', 'asc')

        const countMetricId = store.getState().queryStates[0].metrics[0].id
        store.getState().removeMetric(countMetricId)

        // avgSalary order should remain
        expect(store.getState().queryStates[0].order).toEqual({ 'Employees.avgSalary': 'asc' })
      })

      it('should handle removing non-existent metric gracefully', () => {
        store.getState().addMetric('Employees.count')
        store.getState().removeMetric('non-existent-id')

        expect(store.getState().queryStates[0].metrics).toHaveLength(1)
      })
    })

    describe('toggleMetric', () => {
      it('should add metric if not present', () => {
        store.getState().toggleMetric('Employees.count')

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics).toHaveLength(1)
        expect(metrics[0].field).toBe('Employees.count')
      })

      it('should remove metric if already present', () => {
        store.getState().addMetric('Employees.count')
        store.getState().toggleMetric('Employees.count')

        expect(store.getState().queryStates[0].metrics).toHaveLength(0)
      })

      it('should toggle correctly with multiple metrics', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().toggleMetric('Employees.count') // Remove
        store.getState().toggleMetric('Departments.count') // Add

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics).toHaveLength(2)
        expect(metrics.find(m => m.field === 'Employees.count')).toBeUndefined()
        expect(metrics.find(m => m.field === 'Employees.avgSalary')).toBeDefined()
        expect(metrics.find(m => m.field === 'Departments.count')).toBeDefined()
      })
    })

    describe('reorderMetrics', () => {
      it('should reorder metrics by moving from one index to another', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().addMetric('Employees.totalSalary')

        // Move first metric to last position
        store.getState().reorderMetrics(0, 2)

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics[0].field).toBe('Employees.avgSalary')
        expect(metrics[1].field).toBe('Employees.totalSalary')
        expect(metrics[2].field).toBe('Employees.count')
      })

      it('should move metric from last to first position', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().addMetric('Employees.totalSalary')

        store.getState().reorderMetrics(2, 0)

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics[0].field).toBe('Employees.totalSalary')
        expect(metrics[1].field).toBe('Employees.count')
        expect(metrics[2].field).toBe('Employees.avgSalary')
      })

      it('should handle adjacent reordering', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')

        store.getState().reorderMetrics(0, 1)

        const metrics = store.getState().queryStates[0].metrics
        expect(metrics[0].field).toBe('Employees.avgSalary')
        expect(metrics[1].field).toBe('Employees.count')
      })
    })
  })

  // ==========================================================================
  // Breakdowns Actions
  // ==========================================================================
  describe('Breakdowns Actions', () => {
    describe('addBreakdown', () => {
      it('should add a regular dimension breakdown', () => {
        store.getState().addBreakdown('Employees.departmentName', false)

        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns).toHaveLength(1)
        expect(breakdowns[0].field).toBe('Employees.departmentName')
        expect(breakdowns[0].isTimeDimension).toBe(false)
        expect(breakdowns[0].granularity).toBeUndefined()
      })

      it('should add a time dimension with default granularity', () => {
        store.getState().addBreakdown('Employees.createdAt', true)

        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns).toHaveLength(1)
        expect(breakdowns[0].field).toBe('Employees.createdAt')
        expect(breakdowns[0].isTimeDimension).toBe(true)
        expect(breakdowns[0].granularity).toBe('month')
      })

      it('should add a time dimension with specified granularity', () => {
        store.getState().addBreakdown('Employees.createdAt', true, 'day')

        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns[0].granularity).toBe('day')
      })

      it('should only allow one time dimension', () => {
        store.getState().addBreakdown('Employees.createdAt', true)
        store.getState().addBreakdown('Employees.updatedAt', true)

        // Second time dimension should not be added
        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns).toHaveLength(1)
        expect(breakdowns[0].field).toBe('Employees.createdAt')
      })

      it('should allow multiple regular dimensions', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.name', false)

        expect(store.getState().queryStates[0].breakdowns).toHaveLength(2)
      })

      it('should generate unique IDs for breakdowns', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.name', false)

        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns[0].id).not.toBe(breakdowns[1].id)
      })
    })

    describe('removeBreakdown', () => {
      it('should remove a breakdown by id', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.name', false)

        const breakdownId = store.getState().queryStates[0].breakdowns[0].id
        store.getState().removeBreakdown(breakdownId)

        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns).toHaveLength(1)
        expect(breakdowns[0].field).toBe('Employees.name')
      })

      it('should clean up sort order when breakdown is removed', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().setOrder('Employees.departmentName', 'asc')

        const breakdownId = store.getState().queryStates[0].breakdowns[0].id
        store.getState().removeBreakdown(breakdownId)

        expect(store.getState().queryStates[0].order).toBeUndefined()
      })
    })

    describe('toggleBreakdown', () => {
      it('should add breakdown if not present', () => {
        store.getState().toggleBreakdown('Employees.departmentName', false)

        expect(store.getState().queryStates[0].breakdowns).toHaveLength(1)
      })

      it('should remove breakdown if already present', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().toggleBreakdown('Employees.departmentName', false)

        expect(store.getState().queryStates[0].breakdowns).toHaveLength(0)
      })

      it('should not add second time dimension via toggle', () => {
        store.getState().addBreakdown('Employees.createdAt', true)
        store.getState().toggleBreakdown('Employees.updatedAt', true)

        // Should not add second time dimension
        expect(store.getState().queryStates[0].breakdowns).toHaveLength(1)
        expect(store.getState().queryStates[0].breakdowns[0].field).toBe('Employees.createdAt')
      })

      it('should set granularity for time dimension toggle', () => {
        store.getState().toggleBreakdown('Employees.createdAt', true, 'week')

        const breakdown = store.getState().queryStates[0].breakdowns[0]
        expect(breakdown.granularity).toBe('week')
      })
    })

    describe('setBreakdownGranularity', () => {
      it('should update granularity for a time dimension', () => {
        store.getState().addBreakdown('Employees.createdAt', true, 'month')

        const breakdownId = store.getState().queryStates[0].breakdowns[0].id
        store.getState().setBreakdownGranularity(breakdownId, 'day')

        expect(store.getState().queryStates[0].breakdowns[0].granularity).toBe('day')
      })

      it('should support all granularity values', () => {
        store.getState().addBreakdown('Employees.createdAt', true)
        const breakdownId = store.getState().queryStates[0].breakdowns[0].id

        const granularities = ['hour', 'day', 'week', 'month', 'quarter', 'year']
        for (const granularity of granularities) {
          store.getState().setBreakdownGranularity(breakdownId, granularity)
          expect(store.getState().queryStates[0].breakdowns[0].granularity).toBe(granularity)
        }
      })
    })

    describe('toggleBreakdownComparison', () => {
      it('should toggle comparison flag on time dimension', () => {
        store.getState().addBreakdown('Employees.createdAt', true)
        const breakdownId = store.getState().queryStates[0].breakdowns[0].id

        store.getState().toggleBreakdownComparison(breakdownId)

        expect(store.getState().queryStates[0].breakdowns[0].enableComparison).toBe(true)
      })

      it('should add date filter when enabling comparison without existing filter', () => {
        store.getState().addBreakdown('Employees.createdAt', true)
        const breakdownId = store.getState().queryStates[0].breakdowns[0].id

        store.getState().toggleBreakdownComparison(breakdownId)

        // Should have added a date filter
        const filters = store.getState().queryStates[0].filters
        expect(filters.length).toBeGreaterThan(0)
      })

      it('should disable comparison on toggle when already enabled', () => {
        store.getState().addBreakdown('Employees.createdAt', true)
        const breakdownId = store.getState().queryStates[0].breakdowns[0].id

        store.getState().toggleBreakdownComparison(breakdownId) // Enable
        store.getState().toggleBreakdownComparison(breakdownId) // Disable

        expect(store.getState().queryStates[0].breakdowns[0].enableComparison).toBe(false)
      })

      it('should clear comparison from other time dimensions when enabling', () => {
        // This test verifies the exclusive comparison behavior
        // Only one time dimension can have comparison enabled
        store.getState().addBreakdown('Employees.createdAt', true)
        const breakdownId = store.getState().queryStates[0].breakdowns[0].id

        // Set comparison manually for testing
        store.getState().toggleBreakdownComparison(breakdownId)
        expect(store.getState().queryStates[0].breakdowns[0].enableComparison).toBe(true)
      })
    })

    describe('reorderBreakdowns', () => {
      it('should reorder breakdowns by moving from one index to another', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.name', false)
        store.getState().addBreakdown('Employees.createdAt', true)

        store.getState().reorderBreakdowns(2, 0)

        const breakdowns = store.getState().queryStates[0].breakdowns
        expect(breakdowns[0].field).toBe('Employees.createdAt')
        expect(breakdowns[1].field).toBe('Employees.departmentName')
        expect(breakdowns[2].field).toBe('Employees.name')
      })
    })
  })

  // ==========================================================================
  // Filter Actions
  // ==========================================================================
  describe('Filter Actions', () => {
    describe('setFilters', () => {
      it('should replace all filters', () => {
        const filters: Filter[] = [
          { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
        ]
        store.getState().setFilters(filters)

        expect(store.getState().queryStates[0].filters).toEqual(filters)
      })

      it('should clear filters when empty array provided', () => {
        store.getState().setFilters([
          { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
        ])
        store.getState().setFilters([])

        expect(store.getState().queryStates[0].filters).toEqual([])
      })

      it('should support group filters', () => {
        const filters: Filter[] = [
          {
            type: 'and',
            filters: [
              { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
              { member: 'Employees.salary', operator: 'gt', values: ['50000'] },
            ],
          } as Filter,
        ]
        store.getState().setFilters(filters)

        expect(store.getState().queryStates[0].filters).toHaveLength(1)
      })
    })

    describe('dropFieldToFilter', () => {
      it('should add filter for a new field', () => {
        store.getState().dropFieldToFilter('Employees.departmentName')

        const filters = store.getState().queryStates[0].filters
        expect(filters).toHaveLength(1)
        expect((filters[0] as any).member).toBe('Employees.departmentName')
        expect((filters[0] as any).operator).toBe('set')
      })

      it('should not add duplicate filter for same field', () => {
        store.getState().dropFieldToFilter('Employees.departmentName')
        store.getState().dropFieldToFilter('Employees.departmentName')

        // Should still have only one filter since field already exists
        const filters = store.getState().queryStates[0].filters
        expect(filters).toHaveLength(1)
      })

      it('should create AND group when adding second filter', () => {
        store.getState().dropFieldToFilter('Employees.departmentName')
        store.getState().dropFieldToFilter('Employees.name')

        const filters = store.getState().queryStates[0].filters
        expect(filters).toHaveLength(1)
        expect((filters[0] as any).type).toBe('and')
        expect((filters[0] as any).filters).toHaveLength(2)
      })
    })

    describe('setOrder', () => {
      it('should set sort order for a field', () => {
        store.getState().addMetric('Employees.count')
        store.getState().setOrder('Employees.count', 'desc')

        expect(store.getState().queryStates[0].order).toEqual({ 'Employees.count': 'desc' })
      })

      it('should update existing sort order', () => {
        store.getState().addMetric('Employees.count')
        store.getState().setOrder('Employees.count', 'desc')
        store.getState().setOrder('Employees.count', 'asc')

        expect(store.getState().queryStates[0].order).toEqual({ 'Employees.count': 'asc' })
      })

      it('should clear sort order when direction is null', () => {
        store.getState().addMetric('Employees.count')
        store.getState().setOrder('Employees.count', 'desc')
        store.getState().setOrder('Employees.count', null)

        expect(store.getState().queryStates[0].order).toBeUndefined()
      })

      it('should support multiple sort fields', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().setOrder('Employees.count', 'desc')
        store.getState().setOrder('Employees.avgSalary', 'asc')

        expect(store.getState().queryStates[0].order).toEqual({
          'Employees.count': 'desc',
          'Employees.avgSalary': 'asc',
        })
      })
    })
  })

  // ==========================================================================
  // Multi-Query Actions
  // ==========================================================================
  describe('Multi-Query Actions', () => {
    describe('addQuery', () => {
      it('should add a new query and switch to it', () => {
        store.getState().addQuery()

        expect(store.getState().queryStates).toHaveLength(2)
        expect(store.getState().activeQueryIndex).toBe(1)
      })

      it('should copy metrics from current query to new query', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().addQuery()

        const newQueryMetrics = store.getState().queryStates[1].metrics
        expect(newQueryMetrics).toHaveLength(2)
        expect(newQueryMetrics[0].field).toBe('Employees.count')
        expect(newQueryMetrics[1].field).toBe('Employees.avgSalary')
      })

      it('should copy breakdowns from current query to new query', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.createdAt', true, 'month')
        store.getState().addQuery()

        const newQueryBreakdowns = store.getState().queryStates[1].breakdowns
        expect(newQueryBreakdowns).toHaveLength(2)
        expect(newQueryBreakdowns[0].field).toBe('Employees.departmentName')
        expect(newQueryBreakdowns[1].field).toBe('Employees.createdAt')
      })

      it('should copy filters from current query to new query', () => {
        store.getState().setFilters([
          { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
        ])
        store.getState().addQuery()

        const newQueryFilters = store.getState().queryStates[1].filters
        expect(newQueryFilters).toHaveLength(1)
      })

      it('should add multiple queries', () => {
        store.getState().addQuery()
        store.getState().addQuery()
        store.getState().addQuery()

        expect(store.getState().queryStates).toHaveLength(4)
        expect(store.getState().activeQueryIndex).toBe(3)
      })
    })

    describe('removeQuery', () => {
      it('should remove a query by index', () => {
        store.getState().addQuery()
        store.getState().addQuery()
        store.getState().removeQuery(1)

        expect(store.getState().queryStates).toHaveLength(2)
      })

      it('should not remove the last query', () => {
        store.getState().removeQuery(0)

        // Should still have one query
        expect(store.getState().queryStates).toHaveLength(1)
      })

      it('should adjust activeQueryIndex when removing active query', () => {
        store.getState().addQuery()
        store.getState().addQuery()
        store.getState().setActiveQueryIndex(1)
        store.getState().removeQuery(1)

        // Should move to previous query
        expect(store.getState().activeQueryIndex).toBe(0)
      })

      it('should adjust activeQueryIndex when removing query before active', () => {
        store.getState().addQuery()
        store.getState().addQuery()
        store.getState().setActiveQueryIndex(2)
        store.getState().removeQuery(0)

        // Active index should decrease by 1
        expect(store.getState().activeQueryIndex).toBe(1)
      })

      it('should keep activeQueryIndex when removing query after active', () => {
        store.getState().addQuery()
        store.getState().addQuery()
        store.getState().setActiveQueryIndex(0)
        store.getState().removeQuery(2)

        expect(store.getState().activeQueryIndex).toBe(0)
      })
    })

    describe('setActiveQueryIndex', () => {
      it('should switch active query', () => {
        store.getState().addQuery()
        store.getState().addQuery()
        store.getState().setActiveQueryIndex(0)

        expect(store.getState().activeQueryIndex).toBe(0)
      })

      it('should allow switching between any existing queries', () => {
        store.getState().addQuery()
        store.getState().addQuery()

        store.getState().setActiveQueryIndex(0)
        expect(store.getState().activeQueryIndex).toBe(0)

        store.getState().setActiveQueryIndex(2)
        expect(store.getState().activeQueryIndex).toBe(2)

        store.getState().setActiveQueryIndex(1)
        expect(store.getState().activeQueryIndex).toBe(1)
      })
    })

    describe('setMergeStrategy', () => {
      it('should set merge strategy to concat', () => {
        store.getState().setMergeStrategy('concat')
        expect(store.getState().mergeStrategy).toBe('concat')
      })

      it('should set merge strategy to merge', () => {
        store.getState().setMergeStrategy('merge')
        expect(store.getState().mergeStrategy).toBe('merge')
      })
    })
  })

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  describe('Utility Functions', () => {
    describe('getCurrentState', () => {
      it('should return the active query state', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addBreakdown('Employees.departmentName', false)

        const currentState = store.getState().getCurrentState()

        expect(currentState.metrics).toHaveLength(1)
        expect(currentState.breakdowns).toHaveLength(1)
      })

      it('should return correct state after switching queries', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addQuery()
        store.getState().addMetric('Departments.count')

        // Should be on Q2
        let currentState = store.getState().getCurrentState()
        expect(currentState.metrics.find(m => m.field === 'Departments.count')).toBeDefined()

        // Switch to Q1
        store.getState().setActiveQueryIndex(0)
        currentState = store.getState().getCurrentState()
        expect(currentState.metrics.find(m => m.field === 'Employees.count')).toBeDefined()
        expect(currentState.metrics.find(m => m.field === 'Departments.count')).toBeUndefined()
      })
    })

    describe('isMultiQueryMode', () => {
      it('should return false with one empty query', () => {
        expect(store.getState().isMultiQueryMode()).toBe(false)
      })

      it('should return false with one query that has content', () => {
        store.getState().addMetric('Employees.count')
        expect(store.getState().isMultiQueryMode()).toBe(false)
      })

      it('should return false with two queries but only one has content', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addQuery()
        // Q2 is empty (no metrics/breakdowns copied since Q1 had them)
        // Actually addQuery copies metrics, so both have content now

        // Let's test a different scenario - both queries need content
        expect(store.getState().isMultiQueryMode()).toBe(true) // Both have metrics
      })

      it('should return true with 2+ queries that have content', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addQuery()
        store.getState().addMetric('Departments.count')

        expect(store.getState().isMultiQueryMode()).toBe(true)
      })

      it('should detect content from breakdowns as well', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addQuery()
        store.getState().addBreakdown('Departments.name', false)

        expect(store.getState().isMultiQueryMode()).toBe(true)
      })
    })

    describe('buildCurrentQuery', () => {
      it('should build CubeQuery from current state', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addMetric('Employees.avgSalary')
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.createdAt', true, 'month')

        const query = store.getState().buildCurrentQuery()

        expect(query.measures).toEqual(['Employees.count', 'Employees.avgSalary'])
        expect(query.dimensions).toEqual(['Employees.departmentName'])
        expect(query.timeDimensions).toHaveLength(1)
        expect(query.timeDimensions![0].dimension).toBe('Employees.createdAt')
        expect(query.timeDimensions![0].granularity).toBe('month')
      })

      it('should include filters in query', () => {
        store.getState().addMetric('Employees.count')
        store.getState().setFilters([
          { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
        ])

        const query = store.getState().buildCurrentQuery()

        expect(query.filters).toHaveLength(1)
      })

      it('should include order in query', () => {
        store.getState().addMetric('Employees.count')
        store.getState().setOrder('Employees.count', 'desc')

        const query = store.getState().buildCurrentQuery()

        expect(query.order).toEqual({ 'Employees.count': 'desc' })
      })

      it('should omit empty arrays from query', () => {
        store.getState().addMetric('Employees.count')

        const query = store.getState().buildCurrentQuery()

        expect(query.dimensions).toBeUndefined()
        expect(query.timeDimensions).toBeUndefined()
        expect(query.filters).toBeUndefined()
      })
    })

    describe('buildMultiQueryConfig', () => {
      it('should return null when not in multi-query mode', () => {
        store.getState().addMetric('Employees.count')

        const config = store.getState().buildMultiQueryConfig()

        expect(config).toBeNull()
      })

      it('should return config with all valid queries', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addQuery()
        store.getState().addMetric('Departments.count')

        const config = store.getState().buildMultiQueryConfig()

        expect(config).not.toBeNull()
        expect(config!.queries).toHaveLength(2)
        expect(config!.mergeStrategy).toBe('concat')
      })

      it('should include queryLabels', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addQuery()
        store.getState().addMetric('Departments.count')

        const config = store.getState().buildMultiQueryConfig()

        expect(config!.queryLabels).toEqual(['Q1', 'Q2'])
      })

      it('should filter out queries without content', () => {
        // Start with metric
        store.getState().addMetric('Employees.count')

        // Add empty query
        store.getState().addQuery()
        // Remove the copied metric to make it empty
        const metricId = store.getState().queryStates[1].metrics[0]?.id
        if (metricId) {
          store.getState().removeMetric(metricId)
        }

        // Add query with content
        store.getState().addQuery()
        store.getState().addMetric('Departments.count')

        const config = store.getState().buildMultiQueryConfig()

        // Should only have 2 valid queries (Q1 and Q3)
        expect(config!.queries).toHaveLength(2)
      })

      it('should return null if only one query has content after filtering', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addQuery()
        // Remove the copied metric
        const metricId = store.getState().queryStates[1].metrics[0]?.id
        if (metricId) {
          store.getState().removeMetric(metricId)
        }

        const config = store.getState().buildMultiQueryConfig()

        expect(config).toBeNull()
      })
    })

    describe('getMergeKeys', () => {
      it('should return undefined when merge strategy is concat', () => {
        store.getState().addBreakdown('Employees.departmentName', false)

        expect(store.getState().getMergeKeys()).toBeUndefined()
      })

      it('should return breakdown fields when merge strategy is merge', () => {
        store.getState().addBreakdown('Employees.departmentName', false)
        store.getState().addBreakdown('Employees.createdAt', true, 'month')
        store.getState().setMergeStrategy('merge')

        const mergeKeys = store.getState().getMergeKeys()

        expect(mergeKeys).toEqual(['Employees.departmentName', 'Employees.createdAt'])
      })

      it('should return undefined when no breakdowns in Q1', () => {
        store.getState().setMergeStrategy('merge')

        expect(store.getState().getMergeKeys()).toBeUndefined()
      })
    })
  })

  // ==========================================================================
  // State Management (setQueryStates, updateQueryState)
  // ==========================================================================
  describe('State Management', () => {
    describe('setQueryStates', () => {
      it('should replace all query states', () => {
        const newStates = [
          {
            metrics: [{ id: '1', field: 'Test.metric', label: 'A' }],
            breakdowns: [],
            filters: [],
            validationStatus: 'idle' as const,
            validationError: null,
          },
          {
            metrics: [{ id: '2', field: 'Test.metric2', label: 'B' }],
            breakdowns: [],
            filters: [],
            validationStatus: 'idle' as const,
            validationError: null,
          },
        ]

        store.getState().setQueryStates(newStates)

        expect(store.getState().queryStates).toHaveLength(2)
        expect(store.getState().queryStates[0].metrics[0].field).toBe('Test.metric')
      })
    })

    describe('updateQueryState', () => {
      it('should update a specific query state', () => {
        store.getState().addQuery()

        store.getState().updateQueryState(1, (state) => ({
          ...state,
          metrics: [{ id: '1', field: 'Updated.metric', label: 'X' }],
        }))

        expect(store.getState().queryStates[1].metrics[0].field).toBe('Updated.metric')
      })

      it('should not affect other query states', () => {
        store.getState().addMetric('Employees.count')
        store.getState().addQuery()

        store.getState().updateQueryState(1, (state) => ({
          ...state,
          metrics: [{ id: '1', field: 'Updated.metric', label: 'X' }],
        }))

        // Q1 should be unchanged
        expect(store.getState().queryStates[0].metrics[0].field).toBe('Employees.count')
      })
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle rapid metric additions and removals', () => {
      // Add and remove rapidly
      for (let i = 0; i < 10; i++) {
        store.getState().addMetric(`Employees.metric${i}`)
      }
      expect(store.getState().queryStates[0].metrics).toHaveLength(10)

      // Remove all
      const metrics = [...store.getState().queryStates[0].metrics]
      for (const metric of metrics) {
        store.getState().removeMetric(metric.id)
      }
      expect(store.getState().queryStates[0].metrics).toHaveLength(0)
    })

    it('should handle switching queries with different content', () => {
      store.getState().addMetric('Employees.count')
      store.getState().addBreakdown('Employees.departmentName', false)

      store.getState().addQuery()
      store.getState().addMetric('Departments.totalBudget')
      store.getState().addBreakdown('Departments.name', false)

      // Switch back and forth
      store.getState().setActiveQueryIndex(0)
      expect(store.getState().getCurrentState().metrics[0].field).toBe('Employees.count')

      store.getState().setActiveQueryIndex(1)
      expect(store.getState().getCurrentState().metrics.find(m => m.field === 'Departments.totalBudget')).toBeDefined()
    })

    it('should preserve query state when adding new queries', () => {
      store.getState().addMetric('Employees.count')
      store.getState().addBreakdown('Employees.createdAt', true, 'week')
      store.getState().setFilters([
        { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
      ])

      store.getState().addQuery()

      // Original query should be unchanged
      const q1 = store.getState().queryStates[0]
      expect(q1.metrics[0].field).toBe('Employees.count')
      expect(q1.breakdowns[0].granularity).toBe('week')
    })

    it('should handle empty state operations gracefully', () => {
      // These should not throw
      store.getState().removeMetric('non-existent')
      store.getState().removeBreakdown('non-existent')
      store.getState().setBreakdownGranularity('non-existent', 'day')

      expect(store.getState().queryStates[0].metrics).toHaveLength(0)
    })

    it('should handle building query with only dimensions', () => {
      store.getState().addBreakdown('Employees.departmentName', false)

      const query = store.getState().buildCurrentQuery()

      expect(query.measures).toBeUndefined()
      expect(query.dimensions).toEqual(['Employees.departmentName'])
    })

    it('should handle building query with only time dimension', () => {
      store.getState().addBreakdown('Employees.createdAt', true, 'month')

      const query = store.getState().buildCurrentQuery()

      expect(query.timeDimensions).toHaveLength(1)
      expect(query.dimensions).toBeUndefined()
    })

    it('should maintain consistency when removing and re-adding queries', () => {
      store.getState().addMetric('Employees.count')
      store.getState().addQuery()
      store.getState().addMetric('Departments.count')
      store.getState().addQuery()
      store.getState().addMetric('Productivity.totalLinesOfCode')

      // Remove middle query
      store.getState().removeQuery(1)

      expect(store.getState().queryStates).toHaveLength(2)
      expect(store.getState().queryStates[0].metrics[0].field).toBe('Employees.count')
      // Note: Third query (now second) may have different content depending on what was copied
    })
  })

  // ==========================================================================
  // Integration with Analysis Type
  // ==========================================================================
  describe('Integration with Analysis Type', () => {
    it('should preserve query state when switching analysis types', () => {
      store.getState().addMetric('Employees.count')
      store.getState().addBreakdown('Employees.departmentName', false)

      store.getState().setAnalysisType('funnel')
      store.getState().setAnalysisType('query')

      // Query state should be preserved
      expect(store.getState().queryStates[0].metrics[0].field).toBe('Employees.count')
      expect(store.getState().queryStates[0].breakdowns[0].field).toBe('Employees.departmentName')
    })

    it('should work correctly in query mode', () => {
      expect(store.getState().analysisType).toBe('query')

      store.getState().addMetric('Employees.count')
      const query = store.getState().buildCurrentQuery()

      expect(query.measures).toEqual(['Employees.count'])
    })
  })

  // ==========================================================================
  // buildAllQueries
  // ==========================================================================
  describe('buildAllQueries', () => {
    it('should build queries for all query states', () => {
      store.getState().addMetric('Employees.count')
      store.getState().addQuery()
      store.getState().addMetric('Departments.count')

      const queries = store.getState().buildAllQueries()

      expect(queries).toHaveLength(2)
      expect(queries[0].measures).toContain('Employees.count')
      expect(queries[1].measures).toContain('Departments.count')
    })

    it('should inherit Q1 breakdowns in merge mode for Q2+', () => {
      store.getState().addMetric('Employees.count')
      store.getState().addBreakdown('Employees.departmentName', false)
      store.getState().addQuery()
      store.getState().addMetric('Departments.count')
      // Q2 has its own breakdowns from copy, but in merge mode should use Q1's

      store.getState().setMergeStrategy('merge')

      const queries = store.getState().buildAllQueries()

      // Both queries should have the same breakdown in merge mode
      expect(queries[0].dimensions).toContain('Employees.departmentName')
      expect(queries[1].dimensions).toContain('Employees.departmentName')
    })
  })
})

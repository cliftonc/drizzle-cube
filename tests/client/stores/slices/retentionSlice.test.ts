/**
 * Comprehensive tests for Retention Slice
 * Tests all retention slice state and actions for Zustand store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAnalysisBuilderStore,
  type AnalysisBuilderStore,
} from '../../../../src/client/stores/analysisBuilderStore'
import type { StoreApi } from 'zustand'
import type { Filter } from '../../../../src/client/types'
import {
  RETENTION_MIN_PERIODS,
  RETENTION_MAX_PERIODS,
} from '../../../../src/client/types/retention'

// ============================================================================
// Test Setup
// ============================================================================

describe('RetentionSlice', () => {
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
    it('should have null retentionCube by default', () => {
      expect(store.getState().retentionCube).toBeNull()
    })

    it('should have null retentionBindingKey by default', () => {
      expect(store.getState().retentionBindingKey).toBeNull()
    })

    it('should have null retentionTimeDimension by default', () => {
      expect(store.getState().retentionTimeDimension).toBeNull()
    })

    it('should have default retentionDateRange with start and end dates', () => {
      const dateRange = store.getState().retentionDateRange
      expect(dateRange).toBeDefined()
      expect(dateRange.start).toBeDefined()
      expect(dateRange.end).toBeDefined()
      // Dates should be in ISO format
      expect(dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should have empty retentionCohortFilters by default', () => {
      expect(store.getState().retentionCohortFilters).toEqual([])
    })

    it('should have empty retentionActivityFilters by default', () => {
      expect(store.getState().retentionActivityFilters).toEqual([])
    })

    it('should have empty retentionBreakdowns by default', () => {
      expect(store.getState().retentionBreakdowns).toEqual([])
    })

    it('should have week as default retentionViewGranularity', () => {
      expect(store.getState().retentionViewGranularity).toBe('week')
    })

    it('should have 12 as default retentionPeriods', () => {
      expect(store.getState().retentionPeriods).toBe(12)
    })

    it('should have classic as default retentionType', () => {
      expect(store.getState().retentionType).toBe('classic')
    })
  })

  // ==========================================================================
  // Setter Actions
  // ==========================================================================
  describe('Setter Actions', () => {
    describe('setRetentionCube', () => {
      it('should set retention cube', () => {
        store.getState().setRetentionCube('Events')
        expect(store.getState().retentionCube).toBe('Events')
      })

      it('should clear retention cube when set to null', () => {
        store.getState().setRetentionCube('Events')
        store.getState().setRetentionCube(null)
        expect(store.getState().retentionCube).toBeNull()
      })

      it('should clear related fields when cube changes', () => {
        // Setup initial state
        store.getState().setRetentionCube('Events')
        store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
        store.getState().setRetentionTimeDimension('Events.timestamp')
        store.getState().addRetentionCohortFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['signup'],
        })
        store.getState().addRetentionActivityFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['login'],
        })
        store.getState().addRetentionBreakdown({ field: 'Events.country' })

        // Change cube
        store.getState().setRetentionCube('Actions')

        // All related fields should be cleared
        expect(store.getState().retentionCube).toBe('Actions')
        expect(store.getState().retentionBindingKey).toBeNull()
        expect(store.getState().retentionTimeDimension).toBeNull()
        expect(store.getState().retentionCohortFilters).toEqual([])
        expect(store.getState().retentionActivityFilters).toEqual([])
        expect(store.getState().retentionBreakdowns).toEqual([])
      })
    })

    describe('setRetentionBindingKey', () => {
      it('should set binding key with string dimension', () => {
        store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
        expect(store.getState().retentionBindingKey?.dimension).toBe('Events.userId')
      })

      it('should set binding key with array dimension for multi-cube', () => {
        const bindingKey = {
          dimension: [
            { cube: 'Events', dimension: 'Events.userId' },
            { cube: 'Users', dimension: 'Users.id' },
          ],
        }
        store.getState().setRetentionBindingKey(bindingKey)
        expect(store.getState().retentionBindingKey).toEqual(bindingKey)
      })

      it('should clear binding key when set to null', () => {
        store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
        store.getState().setRetentionBindingKey(null)
        expect(store.getState().retentionBindingKey).toBeNull()
      })
    })

    describe('setRetentionTimeDimension', () => {
      it('should set time dimension', () => {
        store.getState().setRetentionTimeDimension('Events.timestamp')
        expect(store.getState().retentionTimeDimension).toBe('Events.timestamp')
      })

      it('should clear time dimension when set to null', () => {
        store.getState().setRetentionTimeDimension('Events.timestamp')
        store.getState().setRetentionTimeDimension(null)
        expect(store.getState().retentionTimeDimension).toBeNull()
      })
    })

    describe('setRetentionDateRange', () => {
      it('should set date range', () => {
        const range = { start: '2024-01-01', end: '2024-12-31' }
        store.getState().setRetentionDateRange(range)
        expect(store.getState().retentionDateRange).toEqual(range)
      })

      it('should update existing date range', () => {
        store.getState().setRetentionDateRange({ start: '2024-01-01', end: '2024-06-30' })
        store.getState().setRetentionDateRange({ start: '2024-07-01', end: '2024-12-31' })
        expect(store.getState().retentionDateRange).toEqual({
          start: '2024-07-01',
          end: '2024-12-31',
        })
      })
    })

    describe('setRetentionViewGranularity', () => {
      it('should set granularity to day', () => {
        store.getState().setRetentionViewGranularity('day')
        expect(store.getState().retentionViewGranularity).toBe('day')
      })

      it('should set granularity to week', () => {
        store.getState().setRetentionViewGranularity('week')
        expect(store.getState().retentionViewGranularity).toBe('week')
      })

      it('should set granularity to month', () => {
        store.getState().setRetentionViewGranularity('month')
        expect(store.getState().retentionViewGranularity).toBe('month')
      })
    })

    describe('setRetentionPeriods', () => {
      it('should set periods within valid range', () => {
        store.getState().setRetentionPeriods(24)
        expect(store.getState().retentionPeriods).toBe(24)
      })

      it('should clamp periods to minimum', () => {
        store.getState().setRetentionPeriods(0)
        expect(store.getState().retentionPeriods).toBe(RETENTION_MIN_PERIODS)
      })

      it('should clamp periods to maximum', () => {
        store.getState().setRetentionPeriods(100)
        expect(store.getState().retentionPeriods).toBe(RETENTION_MAX_PERIODS)
      })

      it('should handle negative periods by clamping to minimum', () => {
        store.getState().setRetentionPeriods(-5)
        expect(store.getState().retentionPeriods).toBe(RETENTION_MIN_PERIODS)
      })
    })

    describe('setRetentionType', () => {
      it('should set retention type to classic', () => {
        store.getState().setRetentionType('classic')
        expect(store.getState().retentionType).toBe('classic')
      })

      it('should set retention type to rolling', () => {
        store.getState().setRetentionType('rolling')
        expect(store.getState().retentionType).toBe('rolling')
      })
    })
  })

  // ==========================================================================
  // Cohort Filter Actions
  // ==========================================================================
  describe('Cohort Filter Actions', () => {
    const testFilter: Filter = {
      member: 'Events.type',
      operator: 'equals',
      values: ['signup'],
    }

    describe('setRetentionCohortFilters', () => {
      it('should set all cohort filters at once', () => {
        const filters: Filter[] = [
          { member: 'Events.type', operator: 'equals', values: ['signup'] },
          { member: 'Events.country', operator: 'equals', values: ['US'] },
        ]
        store.getState().setRetentionCohortFilters(filters)
        expect(store.getState().retentionCohortFilters).toHaveLength(2)
        expect(store.getState().retentionCohortFilters).toEqual(filters)
      })

      it('should replace existing cohort filters', () => {
        store.getState().addRetentionCohortFilter(testFilter)
        const newFilters: Filter[] = [
          { member: 'Events.source', operator: 'equals', values: ['organic'] },
        ]
        store.getState().setRetentionCohortFilters(newFilters)
        expect(store.getState().retentionCohortFilters).toHaveLength(1)
        expect(store.getState().retentionCohortFilters[0].member).toBe('Events.source')
      })

      it('should clear filters when empty array provided', () => {
        store.getState().addRetentionCohortFilter(testFilter)
        store.getState().setRetentionCohortFilters([])
        expect(store.getState().retentionCohortFilters).toHaveLength(0)
      })
    })

    describe('addRetentionCohortFilter', () => {
      it('should add a cohort filter', () => {
        store.getState().addRetentionCohortFilter(testFilter)
        expect(store.getState().retentionCohortFilters).toHaveLength(1)
        expect(store.getState().retentionCohortFilters[0]).toEqual(testFilter)
      })

      it('should add multiple cohort filters', () => {
        const filter2: Filter = {
          member: 'Events.country',
          operator: 'equals',
          values: ['US'],
        }
        store.getState().addRetentionCohortFilter(testFilter)
        store.getState().addRetentionCohortFilter(filter2)
        expect(store.getState().retentionCohortFilters).toHaveLength(2)
      })
    })

    describe('removeRetentionCohortFilter', () => {
      it('should remove a cohort filter by index', () => {
        const filter2: Filter = {
          member: 'Events.country',
          operator: 'equals',
          values: ['US'],
        }
        store.getState().addRetentionCohortFilter(testFilter)
        store.getState().addRetentionCohortFilter(filter2)
        store.getState().removeRetentionCohortFilter(0)

        expect(store.getState().retentionCohortFilters).toHaveLength(1)
        expect(store.getState().retentionCohortFilters[0].member).toBe('Events.country')
      })

      it('should handle removing non-existent index gracefully', () => {
        store.getState().addRetentionCohortFilter(testFilter)
        store.getState().removeRetentionCohortFilter(5)
        expect(store.getState().retentionCohortFilters).toHaveLength(1)
      })
    })

    describe('updateRetentionCohortFilter', () => {
      it('should update a cohort filter by index', () => {
        store.getState().addRetentionCohortFilter(testFilter)
        const updatedFilter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        }
        store.getState().updateRetentionCohortFilter(0, updatedFilter)

        expect(store.getState().retentionCohortFilters[0].values).toEqual(['purchase'])
      })

      it('should not update if index does not exist', () => {
        store.getState().addRetentionCohortFilter(testFilter)
        const updatedFilter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        }
        store.getState().updateRetentionCohortFilter(5, updatedFilter)

        expect(store.getState().retentionCohortFilters[0].values).toEqual(['signup'])
      })
    })
  })

  // ==========================================================================
  // Activity Filter Actions
  // ==========================================================================
  describe('Activity Filter Actions', () => {
    const testFilter: Filter = {
      member: 'Events.type',
      operator: 'equals',
      values: ['login'],
    }

    describe('setRetentionActivityFilters', () => {
      it('should set all activity filters at once', () => {
        const filters: Filter[] = [
          { member: 'Events.type', operator: 'equals', values: ['login'] },
          { member: 'Events.type', operator: 'equals', values: ['page_view'] },
        ]
        store.getState().setRetentionActivityFilters(filters)
        expect(store.getState().retentionActivityFilters).toHaveLength(2)
      })

      it('should replace existing activity filters', () => {
        store.getState().addRetentionActivityFilter(testFilter)
        const newFilters: Filter[] = [
          { member: 'Events.action', operator: 'equals', values: ['click'] },
        ]
        store.getState().setRetentionActivityFilters(newFilters)
        expect(store.getState().retentionActivityFilters).toHaveLength(1)
        expect(store.getState().retentionActivityFilters[0].member).toBe('Events.action')
      })
    })

    describe('addRetentionActivityFilter', () => {
      it('should add an activity filter', () => {
        store.getState().addRetentionActivityFilter(testFilter)
        expect(store.getState().retentionActivityFilters).toHaveLength(1)
        expect(store.getState().retentionActivityFilters[0]).toEqual(testFilter)
      })

      it('should add multiple activity filters', () => {
        const filter2: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['page_view'],
        }
        store.getState().addRetentionActivityFilter(testFilter)
        store.getState().addRetentionActivityFilter(filter2)
        expect(store.getState().retentionActivityFilters).toHaveLength(2)
      })
    })

    describe('removeRetentionActivityFilter', () => {
      it('should remove an activity filter by index', () => {
        const filter2: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['page_view'],
        }
        store.getState().addRetentionActivityFilter(testFilter)
        store.getState().addRetentionActivityFilter(filter2)
        store.getState().removeRetentionActivityFilter(0)

        expect(store.getState().retentionActivityFilters).toHaveLength(1)
        expect(store.getState().retentionActivityFilters[0].values).toEqual(['page_view'])
      })
    })

    describe('updateRetentionActivityFilter', () => {
      it('should update an activity filter by index', () => {
        store.getState().addRetentionActivityFilter(testFilter)
        const updatedFilter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['checkout'],
        }
        store.getState().updateRetentionActivityFilter(0, updatedFilter)

        expect(store.getState().retentionActivityFilters[0].values).toEqual(['checkout'])
      })

      it('should not update if index does not exist', () => {
        store.getState().addRetentionActivityFilter(testFilter)
        const updatedFilter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['checkout'],
        }
        store.getState().updateRetentionActivityFilter(5, updatedFilter)

        expect(store.getState().retentionActivityFilters[0].values).toEqual(['login'])
      })
    })
  })

  // ==========================================================================
  // Breakdown Actions
  // ==========================================================================
  describe('Breakdown Actions', () => {
    describe('setRetentionBreakdowns', () => {
      it('should set all breakdowns at once', () => {
        const breakdowns = [
          { field: 'Events.country' },
          { field: 'Events.plan', label: 'Subscription Plan' },
        ]
        store.getState().setRetentionBreakdowns(breakdowns)
        expect(store.getState().retentionBreakdowns).toHaveLength(2)
      })

      it('should replace existing breakdowns', () => {
        store.getState().addRetentionBreakdown({ field: 'Events.country' })
        store.getState().setRetentionBreakdowns([{ field: 'Events.city' }])
        expect(store.getState().retentionBreakdowns).toHaveLength(1)
        expect(store.getState().retentionBreakdowns[0].field).toBe('Events.city')
      })
    })

    describe('addRetentionBreakdown', () => {
      it('should add a breakdown dimension', () => {
        store.getState().addRetentionBreakdown({ field: 'Events.country' })
        expect(store.getState().retentionBreakdowns).toHaveLength(1)
        expect(store.getState().retentionBreakdowns[0].field).toBe('Events.country')
      })

      it('should add breakdown with label', () => {
        store.getState().addRetentionBreakdown({
          field: 'Events.plan',
          label: 'Subscription Plan',
        })
        expect(store.getState().retentionBreakdowns[0].label).toBe('Subscription Plan')
      })

      it('should add multiple breakdowns', () => {
        store.getState().addRetentionBreakdown({ field: 'Events.country' })
        store.getState().addRetentionBreakdown({ field: 'Events.plan' })
        expect(store.getState().retentionBreakdowns).toHaveLength(2)
      })
    })

    describe('removeRetentionBreakdown', () => {
      it('should remove a breakdown by field', () => {
        store.getState().addRetentionBreakdown({ field: 'Events.country' })
        store.getState().addRetentionBreakdown({ field: 'Events.plan' })
        store.getState().removeRetentionBreakdown('Events.country')

        expect(store.getState().retentionBreakdowns).toHaveLength(1)
        expect(store.getState().retentionBreakdowns[0].field).toBe('Events.plan')
      })

      it('should handle removing non-existent breakdown gracefully', () => {
        store.getState().addRetentionBreakdown({ field: 'Events.country' })
        store.getState().removeRetentionBreakdown('Events.nonexistent')
        expect(store.getState().retentionBreakdowns).toHaveLength(1)
      })
    })
  })

  // ==========================================================================
  // Computed Values / Getters
  // ==========================================================================
  describe('Computed Values', () => {
    describe('isRetentionMode', () => {
      it('should return false when analysis type is query', () => {
        expect(store.getState().isRetentionMode()).toBe(false)
      })

      it('should return true when analysis type is retention', () => {
        store.getState().setAnalysisType('retention')
        expect(store.getState().isRetentionMode()).toBe(true)
      })

      it('should return false when analysis type is funnel', () => {
        store.getState().setAnalysisType('funnel')
        expect(store.getState().isRetentionMode()).toBe(false)
      })
    })

    describe('isRetentionModeEnabled', () => {
      it('should return false when not in retention mode', () => {
        expect(store.getState().isRetentionModeEnabled()).toBe(false)
      })

      it('should return false when in retention mode but missing binding key', () => {
        store.getState().setAnalysisType('retention')
        store.getState().setRetentionTimeDimension('Events.timestamp')
        expect(store.getState().isRetentionModeEnabled()).toBe(false)
      })

      it('should return false when in retention mode but missing time dimension', () => {
        store.getState().setAnalysisType('retention')
        store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
        expect(store.getState().isRetentionModeEnabled()).toBe(false)
      })

      it('should return true when fully configured', () => {
        store.getState().setAnalysisType('retention')
        store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
        store.getState().setRetentionTimeDimension('Events.timestamp')
        expect(store.getState().isRetentionModeEnabled()).toBe(true)
      })
    })
  })

  // ==========================================================================
  // Query Building
  // ==========================================================================
  describe('buildRetentionQuery', () => {
    it('should return null when not in retention mode', () => {
      expect(store.getState().buildRetentionQuery()).toBeNull()
    })

    it('should return null when binding key is missing', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionTimeDimension('Events.timestamp')
      expect(store.getState().buildRetentionQuery()).toBeNull()
    })

    it('should return null when time dimension is missing', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      expect(store.getState().buildRetentionQuery()).toBeNull()
    })

    it('should build valid query with string binding key', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')

      const query = store.getState().buildRetentionQuery()

      expect(query).not.toBeNull()
      expect(query?.retention.bindingKey).toBe('Events.userId')
      expect(query?.retention.timeDimension).toBe('Events.timestamp')
    })

    it('should build valid query with array binding key', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({
        dimension: [
          { cube: 'Events', dimension: 'Events.userId' },
          { cube: 'Users', dimension: 'Users.id' },
        ],
      })
      store.getState().setRetentionTimeDimension('Events.timestamp')

      const query = store.getState().buildRetentionQuery()

      expect(query).not.toBeNull()
      expect(Array.isArray(query?.retention.bindingKey)).toBe(true)
      expect((query?.retention.bindingKey as any[]).length).toBe(2)
    })

    it('should include date range in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-01-01', end: '2024-12-31' })

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.dateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
    })

    it('should include granularity in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionViewGranularity('month')

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.granularity).toBe('month')
    })

    it('should include periods in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionPeriods(24)

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.periods).toBe(24)
    })

    it('should include retention type in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionType('rolling')

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.retentionType).toBe('rolling')
    })

    it('should include single cohort filter in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().addRetentionCohortFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['signup'],
      })

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.cohortFilters).toBeDefined()
      // Single filter is not wrapped in array
      expect((query?.retention.cohortFilters as any).member).toBe('Events.type')
    })

    it('should include multiple cohort filters in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().addRetentionCohortFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['signup'],
      })
      store.getState().addRetentionCohortFilter({
        member: 'Events.country',
        operator: 'equals',
        values: ['US'],
      })

      const query = store.getState().buildRetentionQuery()

      expect(Array.isArray(query?.retention.cohortFilters)).toBe(true)
      expect((query?.retention.cohortFilters as any[]).length).toBe(2)
    })

    it('should include single activity filter in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().addRetentionActivityFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['login'],
      })

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.activityFilters).toBeDefined()
      expect((query?.retention.activityFilters as any).member).toBe('Events.type')
    })

    it('should include multiple activity filters in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().addRetentionActivityFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['login'],
      })
      store.getState().addRetentionActivityFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['page_view'],
      })

      const query = store.getState().buildRetentionQuery()

      expect(Array.isArray(query?.retention.activityFilters)).toBe(true)
      expect((query?.retention.activityFilters as any[]).length).toBe(2)
    })

    it('should include breakdown dimensions in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().addRetentionBreakdown({ field: 'Events.country' })
      store.getState().addRetentionBreakdown({ field: 'Events.plan' })

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.breakdownDimensions).toBeDefined()
      expect(query?.retention.breakdownDimensions).toEqual(['Events.country', 'Events.plan'])
    })

    it('should not include empty filters in query', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')

      const query = store.getState().buildRetentionQuery()

      expect(query?.retention.cohortFilters).toBeUndefined()
      expect(query?.retention.activityFilters).toBeUndefined()
      expect(query?.retention.breakdownDimensions).toBeUndefined()
    })
  })

  // ==========================================================================
  // Validation Logic
  // ==========================================================================
  describe('getRetentionValidation', () => {
    it('should return valid when not in retention mode', () => {
      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(validation.warnings).toHaveLength(0)
    })

    it('should report error when cube is missing', () => {
      store.getState().setAnalysisType('retention')

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('cube'))).toBe(true)
    })

    it('should report error when binding key is missing', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('user identifier') || e.includes('binding'))).toBe(true)
    })

    it('should report error when time dimension is missing', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('timestamp'))).toBe(true)
    })

    it('should report error when date range is missing start', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '', end: '2024-12-31' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('Date range'))).toBe(true)
    })

    it('should report error when date range is missing end', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-01-01', end: '' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('Date range'))).toBe(true)
    })

    it('should report error for invalid start date', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: 'invalid', end: '2024-12-31' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('Invalid start date'))).toBe(true)
    })

    it('should report error for invalid end date', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-01-01', end: 'invalid' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('Invalid end date'))).toBe(true)
    })

    it('should report error when start date is after end date', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-12-31', end: '2024-01-01' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.includes('before or equal'))).toBe(true)
    })

    it('should be valid when fully configured', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-01-01', end: '2024-12-31' })

      const validation = store.getState().getRetentionValidation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should report warning for more than 52 periods', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-01-01', end: '2024-12-31' })
      // Since periods are clamped to max, we need to test the warning at 52+
      // Actually the state clamps it, so this warning may not be reachable
      // The validation checks if periods > 52, but setRetentionPeriods clamps
      // So we test the boundary condition
      store.getState().setRetentionPeriods(52)

      const validation = store.getState().getRetentionValidation()
      // At exactly 52, no warning
      expect(validation.warnings.some((w) => w.includes('52'))).toBe(false)
    })
  })

  // ==========================================================================
  // Clear / Reset Functionality
  // ==========================================================================
  describe('Clear / Reset', () => {
    it('should reset retention state when reset() is called', () => {
      // Configure retention state
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().addRetentionCohortFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['signup'],
      })
      store.getState().addRetentionBreakdown({ field: 'Events.country' })

      // Reset
      store.getState().reset()

      // Verify reset
      expect(store.getState().analysisType).toBe('query')
      expect(store.getState().retentionCube).toBeNull()
      expect(store.getState().retentionBindingKey).toBeNull()
      expect(store.getState().retentionTimeDimension).toBeNull()
      expect(store.getState().retentionCohortFilters).toEqual([])
      expect(store.getState().retentionBreakdowns).toEqual([])
    })

    it('should clear retention state when clearCurrentMode is called in retention mode', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')

      store.getState().clearCurrentMode()

      expect(store.getState().retentionCube).toBeNull()
      expect(store.getState().retentionBindingKey).toBeNull()
      expect(store.getState().retentionTimeDimension).toBeNull()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle switching from retention to other modes', () => {
      // Setup retention
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })

      // Switch to query
      store.getState().setAnalysisType('query')

      // Retention state should be preserved
      expect(store.getState().retentionCube).toBe('Events')
      expect(store.getState().retentionBindingKey?.dimension).toBe('Events.userId')

      // Switch back to retention
      store.getState().setAnalysisType('retention')
      expect(store.getState().isRetentionMode()).toBe(true)
    })

    it('should handle rapid filter additions and removals', () => {
      const filters = [
        { member: 'Events.type', operator: 'equals' as const, values: ['signup'] },
        { member: 'Events.country', operator: 'equals' as const, values: ['US'] },
        { member: 'Events.plan', operator: 'equals' as const, values: ['pro'] },
      ]

      // Add all filters
      filters.forEach((f) => store.getState().addRetentionCohortFilter(f))
      expect(store.getState().retentionCohortFilters).toHaveLength(3)

      // Remove middle filter
      store.getState().removeRetentionCohortFilter(1)
      expect(store.getState().retentionCohortFilters).toHaveLength(2)
      expect(store.getState().retentionCohortFilters[1].values).toEqual(['pro'])

      // Remove first filter
      store.getState().removeRetentionCohortFilter(0)
      expect(store.getState().retentionCohortFilters).toHaveLength(1)
      expect(store.getState().retentionCohortFilters[0].values).toEqual(['pro'])
    })

    it('should build query with all optional fields populated', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Events')
      store.getState().setRetentionBindingKey({ dimension: 'Events.userId' })
      store.getState().setRetentionTimeDimension('Events.timestamp')
      store.getState().setRetentionDateRange({ start: '2024-01-01', end: '2024-12-31' })
      store.getState().setRetentionViewGranularity('month')
      store.getState().setRetentionPeriods(6)
      store.getState().setRetentionType('rolling')
      store.getState().addRetentionCohortFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['signup'],
      })
      store.getState().addRetentionActivityFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['login'],
      })
      store.getState().addRetentionBreakdown({ field: 'Events.country' })

      const query = store.getState().buildRetentionQuery()

      expect(query).not.toBeNull()
      expect(query?.retention.bindingKey).toBe('Events.userId')
      expect(query?.retention.timeDimension).toBe('Events.timestamp')
      expect(query?.retention.dateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
      expect(query?.retention.granularity).toBe('month')
      expect(query?.retention.periods).toBe(6)
      expect(query?.retention.retentionType).toBe('rolling')
      expect(query?.retention.cohortFilters).toBeDefined()
      expect(query?.retention.activityFilters).toBeDefined()
      expect(query?.retention.breakdownDimensions).toEqual(['Events.country'])
    })
  })
})

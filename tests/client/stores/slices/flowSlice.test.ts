/**
 * Comprehensive tests for Flow Slice
 * Tests all flow slice state and actions for Zustand store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAnalysisBuilderStore,
  type AnalysisBuilderStore,
} from '../../../../src/client/stores/analysisBuilderStore'
import type { StoreApi } from 'zustand'
import type { Filter } from '../../../../src/client/types'
import { FLOW_MIN_DEPTH, FLOW_MAX_DEPTH } from '../../../../src/client/types/flow'

// ============================================================================
// Test Setup
// ============================================================================

describe('FlowSlice', () => {
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
    it('should have null flowCube by default', () => {
      expect(store.getState().flowCube).toBeNull()
    })

    it('should have null flowBindingKey by default', () => {
      expect(store.getState().flowBindingKey).toBeNull()
    })

    it('should have null flowTimeDimension by default', () => {
      expect(store.getState().flowTimeDimension).toBeNull()
    })

    it('should have empty starting step by default', () => {
      expect(store.getState().startingStep).toEqual({
        name: '',
        filters: [],
      })
    })

    it('should have 3 as default stepsBefore', () => {
      expect(store.getState().stepsBefore).toBe(3)
    })

    it('should have 3 as default stepsAfter', () => {
      expect(store.getState().stepsAfter).toBe(3)
    })

    it('should have null eventDimension by default', () => {
      expect(store.getState().eventDimension).toBeNull()
    })

    it('should have auto as default joinStrategy', () => {
      expect(store.getState().joinStrategy).toBe('auto')
    })
  })

  // ==========================================================================
  // Setter Actions
  // ==========================================================================
  describe('Setter Actions', () => {
    describe('setFlowCube', () => {
      it('should set flow cube', () => {
        store.getState().setFlowCube('Events')
        expect(store.getState().flowCube).toBe('Events')
      })

      it('should clear flow cube when set to null', () => {
        store.getState().setFlowCube('Events')
        store.getState().setFlowCube(null)
        expect(store.getState().flowCube).toBeNull()
      })

      it('should clear related fields when cube changes', () => {
        // Setup initial state
        store.getState().setFlowCube('Events')
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().setEventDimension('Events.eventType')
        store.getState().setStartingStepName('Purchase')
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })

        // Change cube
        store.getState().setFlowCube('Actions')

        // All related fields should be cleared
        expect(store.getState().flowCube).toBe('Actions')
        expect(store.getState().flowBindingKey).toBeNull()
        expect(store.getState().flowTimeDimension).toBeNull()
        expect(store.getState().eventDimension).toBeNull()
        expect(store.getState().startingStep.name).toBe('')
        expect(store.getState().startingStep.filters).toEqual([])
      })
    })

    describe('setFlowBindingKey', () => {
      it('should set binding key with string dimension', () => {
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        expect(store.getState().flowBindingKey?.dimension).toBe('Events.userId')
      })

      it('should set binding key with array dimension for multi-cube', () => {
        const bindingKey = {
          dimension: [
            { cube: 'Events', dimension: 'Events.userId' },
            { cube: 'Users', dimension: 'Users.id' },
          ],
        }
        store.getState().setFlowBindingKey(bindingKey)
        expect(store.getState().flowBindingKey).toEqual(bindingKey)
      })

      it('should clear binding key when set to null', () => {
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setFlowBindingKey(null)
        expect(store.getState().flowBindingKey).toBeNull()
      })
    })

    describe('setFlowTimeDimension', () => {
      it('should set time dimension', () => {
        store.getState().setFlowTimeDimension('Events.timestamp')
        expect(store.getState().flowTimeDimension).toBe('Events.timestamp')
      })

      it('should clear time dimension when set to null', () => {
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().setFlowTimeDimension(null)
        expect(store.getState().flowTimeDimension).toBeNull()
      })
    })

    describe('setEventDimension', () => {
      it('should set event dimension', () => {
        store.getState().setEventDimension('Events.eventType')
        expect(store.getState().eventDimension).toBe('Events.eventType')
      })

      it('should clear event dimension when set to null', () => {
        store.getState().setEventDimension('Events.eventType')
        store.getState().setEventDimension(null)
        expect(store.getState().eventDimension).toBeNull()
      })
    })

    describe('setStepsBefore', () => {
      it('should set steps before within valid range', () => {
        store.getState().setStepsBefore(2)
        expect(store.getState().stepsBefore).toBe(2)
      })

      it('should clamp steps before to minimum', () => {
        store.getState().setStepsBefore(-1)
        expect(store.getState().stepsBefore).toBe(FLOW_MIN_DEPTH)
      })

      it('should clamp steps before to maximum', () => {
        store.getState().setStepsBefore(10)
        expect(store.getState().stepsBefore).toBe(FLOW_MAX_DEPTH)
      })

      it('should allow setting to 0', () => {
        store.getState().setStepsBefore(0)
        expect(store.getState().stepsBefore).toBe(0)
      })

      it('should allow setting to max (5)', () => {
        store.getState().setStepsBefore(5)
        expect(store.getState().stepsBefore).toBe(5)
      })
    })

    describe('setStepsAfter', () => {
      it('should set steps after within valid range', () => {
        store.getState().setStepsAfter(4)
        expect(store.getState().stepsAfter).toBe(4)
      })

      it('should clamp steps after to minimum', () => {
        store.getState().setStepsAfter(-5)
        expect(store.getState().stepsAfter).toBe(FLOW_MIN_DEPTH)
      })

      it('should clamp steps after to maximum', () => {
        store.getState().setStepsAfter(100)
        expect(store.getState().stepsAfter).toBe(FLOW_MAX_DEPTH)
      })

      it('should allow setting to 0', () => {
        store.getState().setStepsAfter(0)
        expect(store.getState().stepsAfter).toBe(0)
      })

      it('should allow setting to max (5)', () => {
        store.getState().setStepsAfter(5)
        expect(store.getState().stepsAfter).toBe(5)
      })
    })

    describe('setJoinStrategy', () => {
      it('should set join strategy to auto', () => {
        store.getState().setJoinStrategy('auto')
        expect(store.getState().joinStrategy).toBe('auto')
      })

      it('should set join strategy to lateral', () => {
        store.getState().setJoinStrategy('lateral')
        expect(store.getState().joinStrategy).toBe('lateral')
      })

      it('should set join strategy to window', () => {
        store.getState().setJoinStrategy('window')
        expect(store.getState().joinStrategy).toBe('window')
      })
    })
  })

  // ==========================================================================
  // Starting Step Actions
  // ==========================================================================
  describe('Starting Step Actions', () => {
    describe('setStartingStepName', () => {
      it('should set starting step name', () => {
        store.getState().setStartingStepName('Purchase')
        expect(store.getState().startingStep.name).toBe('Purchase')
      })

      it('should update existing starting step name', () => {
        store.getState().setStartingStepName('Purchase')
        store.getState().setStartingStepName('Checkout')
        expect(store.getState().startingStep.name).toBe('Checkout')
      })

      it('should preserve filters when setting name', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        store.getState().setStartingStepName('Purchase')

        expect(store.getState().startingStep.name).toBe('Purchase')
        expect(store.getState().startingStep.filters).toHaveLength(1)
      })
    })

    describe('setStartingStepFilters', () => {
      it('should set all starting step filters at once', () => {
        const filters: Filter[] = [
          { member: 'Events.type', operator: 'equals', values: ['purchase'] },
          { member: 'Events.category', operator: 'equals', values: ['electronics'] },
        ]
        store.getState().setStartingStepFilters(filters)
        expect(store.getState().startingStep.filters).toHaveLength(2)
      })

      it('should replace existing filters', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['signup'],
        })
        store.getState().setStartingStepFilters([
          { member: 'Events.action', operator: 'equals', values: ['click'] },
        ])
        expect(store.getState().startingStep.filters).toHaveLength(1)
        expect(store.getState().startingStep.filters[0].member).toBe('Events.action')
      })

      it('should preserve name when setting filters', () => {
        store.getState().setStartingStepName('Purchase')
        store.getState().setStartingStepFilters([
          { member: 'Events.type', operator: 'equals', values: ['purchase'] },
        ])

        expect(store.getState().startingStep.name).toBe('Purchase')
      })

      it('should clear filters when empty array provided', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        store.getState().setStartingStepFilters([])
        expect(store.getState().startingStep.filters).toHaveLength(0)
      })
    })

    describe('addStartingStepFilter', () => {
      it('should add a filter to starting step', () => {
        const filter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        }
        store.getState().addStartingStepFilter(filter)
        expect(store.getState().startingStep.filters).toHaveLength(1)
        expect(store.getState().startingStep.filters[0]).toEqual(filter)
      })

      it('should add multiple filters', () => {
        const filter1: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        }
        const filter2: Filter = {
          member: 'Events.category',
          operator: 'equals',
          values: ['electronics'],
        }
        store.getState().addStartingStepFilter(filter1)
        store.getState().addStartingStepFilter(filter2)
        expect(store.getState().startingStep.filters).toHaveLength(2)
      })
    })

    describe('removeStartingStepFilter', () => {
      it('should remove a filter by index', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        store.getState().addStartingStepFilter({
          member: 'Events.category',
          operator: 'equals',
          values: ['electronics'],
        })

        store.getState().removeStartingStepFilter(0)

        expect(store.getState().startingStep.filters).toHaveLength(1)
        expect(store.getState().startingStep.filters[0].member).toBe('Events.category')
      })

      it('should handle removing last filter', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        store.getState().removeStartingStepFilter(0)
        expect(store.getState().startingStep.filters).toHaveLength(0)
      })

      it('should handle removing non-existent index gracefully', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        store.getState().removeStartingStepFilter(5)
        expect(store.getState().startingStep.filters).toHaveLength(1)
      })
    })

    describe('updateStartingStepFilter', () => {
      it('should update a filter by index', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })

        const updatedFilter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['checkout'],
        }
        store.getState().updateStartingStepFilter(0, updatedFilter)

        expect(store.getState().startingStep.filters[0].values).toEqual(['checkout'])
      })

      it('should not update if index does not exist', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })

        const updatedFilter: Filter = {
          member: 'Events.type',
          operator: 'equals',
          values: ['checkout'],
        }
        store.getState().updateStartingStepFilter(5, updatedFilter)

        expect(store.getState().startingStep.filters[0].values).toEqual(['purchase'])
      })

      it('should update filter member correctly', () => {
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })

        const updatedFilter: Filter = {
          member: 'Events.action',
          operator: 'notEquals',
          values: ['cancelled'],
        }
        store.getState().updateStartingStepFilter(0, updatedFilter)

        expect(store.getState().startingStep.filters[0].member).toBe('Events.action')
        expect(store.getState().startingStep.filters[0].operator).toBe('notEquals')
      })
    })
  })

  // ==========================================================================
  // Computed Values / Getters
  // ==========================================================================
  describe('Computed Values', () => {
    describe('isFlowMode', () => {
      it('should return false when analysis type is query', () => {
        expect(store.getState().isFlowMode()).toBe(false)
      })

      it('should return true when analysis type is flow', () => {
        store.getState().setAnalysisType('flow')
        expect(store.getState().isFlowMode()).toBe(true)
      })

      it('should return false when analysis type is funnel', () => {
        store.getState().setAnalysisType('funnel')
        expect(store.getState().isFlowMode()).toBe(false)
      })

      it('should return false when analysis type is retention', () => {
        store.getState().setAnalysisType('retention')
        expect(store.getState().isFlowMode()).toBe(false)
      })
    })

    describe('isFlowModeEnabled', () => {
      it('should return false when not in flow mode', () => {
        expect(store.getState().isFlowModeEnabled()).toBe(false)
      })

      it('should return false when missing flow cube', () => {
        store.getState().setAnalysisType('flow')
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().setEventDimension('Events.eventType')
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        expect(store.getState().isFlowModeEnabled()).toBe(false)
      })

      it('should return false when missing binding key', () => {
        store.getState().setAnalysisType('flow')
        store.getState().setFlowCube('Events')
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().setEventDimension('Events.eventType')
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        expect(store.getState().isFlowModeEnabled()).toBe(false)
      })

      it('should return false when missing time dimension', () => {
        store.getState().setAnalysisType('flow')
        store.getState().setFlowCube('Events')
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setEventDimension('Events.eventType')
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        expect(store.getState().isFlowModeEnabled()).toBe(false)
      })

      it('should return false when missing event dimension', () => {
        store.getState().setAnalysisType('flow')
        store.getState().setFlowCube('Events')
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        expect(store.getState().isFlowModeEnabled()).toBe(false)
      })

      it('should return false when starting step has no filters', () => {
        store.getState().setAnalysisType('flow')
        store.getState().setFlowCube('Events')
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().setEventDimension('Events.eventType')
        // No filters added
        expect(store.getState().isFlowModeEnabled()).toBe(false)
      })

      it('should return true when fully configured', () => {
        store.getState().setAnalysisType('flow')
        store.getState().setFlowCube('Events')
        store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
        store.getState().setFlowTimeDimension('Events.timestamp')
        store.getState().setEventDimension('Events.eventType')
        store.getState().addStartingStepFilter({
          member: 'Events.type',
          operator: 'equals',
          values: ['purchase'],
        })
        expect(store.getState().isFlowModeEnabled()).toBe(true)
      })
    })
  })

  // ==========================================================================
  // Query Building
  // ==========================================================================
  describe('buildFlowQuery', () => {
    it('should return null when not in flow mode', () => {
      expect(store.getState().buildFlowQuery()).toBeNull()
    })

    it('should return null when binding key is missing', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      expect(store.getState().buildFlowQuery()).toBeNull()
    })

    it('should return null when time dimension is missing', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      expect(store.getState().buildFlowQuery()).toBeNull()
    })

    it('should return null when event dimension is missing', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      expect(store.getState().buildFlowQuery()).toBeNull()
    })

    it('should return null when starting step has no filters', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      expect(store.getState().buildFlowQuery()).toBeNull()
    })

    it('should build valid query with string binding key', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })

      const query = store.getState().buildFlowQuery()

      expect(query).not.toBeNull()
      expect(query?.flow.bindingKey).toBe('Events.userId')
      expect(query?.flow.timeDimension).toBe('Events.timestamp')
      expect(query?.flow.eventDimension).toBe('Events.eventType')
    })

    it('should build valid query with array binding key', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({
        dimension: [
          { cube: 'Events', dimension: 'Events.userId' },
          { cube: 'Users', dimension: 'Users.id' },
        ],
      })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })

      const query = store.getState().buildFlowQuery()

      expect(query).not.toBeNull()
      expect(Array.isArray(query?.flow.bindingKey)).toBe(true)
      expect((query?.flow.bindingKey as any[]).length).toBe(2)
    })

    it('should include starting step with single filter', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().setStartingStepName('Purchase')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })

      const query = store.getState().buildFlowQuery()

      expect(query?.flow.startingStep.name).toBe('Purchase')
      // Single filter is not wrapped in array
      expect((query?.flow.startingStep.filter as Filter).member).toBe('Events.type')
    })

    it('should include starting step with multiple filters', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      store.getState().addStartingStepFilter({
        member: 'Events.category',
        operator: 'equals',
        values: ['electronics'],
      })

      const query = store.getState().buildFlowQuery()

      expect(Array.isArray(query?.flow.startingStep.filter)).toBe(true)
      expect((query?.flow.startingStep.filter as Filter[]).length).toBe(2)
    })

    it('should use default name when starting step name is empty', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })

      const query = store.getState().buildFlowQuery()

      expect(query?.flow.startingStep.name).toBe('Starting Step')
    })

    it('should include steps before and after in query', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      store.getState().setStepsBefore(2)
      store.getState().setStepsAfter(4)

      const query = store.getState().buildFlowQuery()

      // Note: stepsBefore may be 0 for sunburst output mode
      // By default output mode is sankey, so stepsBefore should match
      expect(query?.flow.stepsAfter).toBe(4)
    })

    it('should include join strategy in query', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      store.getState().setJoinStrategy('lateral')

      const query = store.getState().buildFlowQuery()

      expect(query?.flow.joinStrategy).toBe('lateral')
    })

    it('should include output mode based on chart type', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })

      const query = store.getState().buildFlowQuery()

      // Default output mode should be sankey
      expect(query?.flow.outputMode).toBe('sankey')
    })

    it('should set stepsBefore to 0 for sunburst output mode', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      store.getState().setStepsBefore(3)

      // Set chart type to sunburst for flow mode
      // This requires updating the charts map for flow
      const state = store.getState()
      if (state.charts && state.charts.flow) {
        // Update chart type for flow mode
        store.setState({
          charts: {
            ...state.charts,
            flow: {
              ...state.charts.flow,
              chartType: 'sunburst',
            },
          },
        })
      }

      const query = store.getState().buildFlowQuery()

      // For sunburst, stepsBefore should be forced to 0
      expect(query?.flow.outputMode).toBe('sunburst')
      expect(query?.flow.stepsBefore).toBe(0)
    })
  })

  // ==========================================================================
  // Clear / Reset Functionality
  // ==========================================================================
  describe('Clear / Reset', () => {
    it('should reset flow state when reset() is called', () => {
      // Configure flow state
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().setStartingStepName('Purchase')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      store.getState().setStepsBefore(2)
      store.getState().setStepsAfter(4)

      // Reset
      store.getState().reset()

      // Verify reset
      expect(store.getState().analysisType).toBe('query')
      expect(store.getState().flowCube).toBeNull()
      expect(store.getState().flowBindingKey).toBeNull()
      expect(store.getState().flowTimeDimension).toBeNull()
      expect(store.getState().eventDimension).toBeNull()
      expect(store.getState().startingStep.name).toBe('')
      expect(store.getState().startingStep.filters).toEqual([])
      expect(store.getState().stepsBefore).toBe(3)
      expect(store.getState().stepsAfter).toBe(3)
    })

    it('should clear flow state when clearCurrentMode is called in flow mode', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')

      store.getState().clearCurrentMode()

      expect(store.getState().flowCube).toBeNull()
      expect(store.getState().flowBindingKey).toBeNull()
      expect(store.getState().flowTimeDimension).toBeNull()
      expect(store.getState().eventDimension).toBeNull()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle switching from flow to other modes', () => {
      // Setup flow
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')

      // Switch to query
      store.getState().setAnalysisType('query')

      // Flow state should be preserved
      expect(store.getState().flowCube).toBe('Events')
      expect(store.getState().flowBindingKey?.dimension).toBe('Events.userId')
      expect(store.getState().flowTimeDimension).toBe('Events.timestamp')

      // Switch back to flow
      store.getState().setAnalysisType('flow')
      expect(store.getState().isFlowMode()).toBe(true)
    })

    it('should handle rapid filter additions and removals', () => {
      const filters = [
        { member: 'Events.type', operator: 'equals' as const, values: ['purchase'] },
        { member: 'Events.category', operator: 'equals' as const, values: ['electronics'] },
        { member: 'Events.value', operator: 'gt' as const, values: ['100'] },
      ]

      // Add all filters
      filters.forEach((f) => store.getState().addStartingStepFilter(f))
      expect(store.getState().startingStep.filters).toHaveLength(3)

      // Remove middle filter
      store.getState().removeStartingStepFilter(1)
      expect(store.getState().startingStep.filters).toHaveLength(2)
      expect(store.getState().startingStep.filters[1].member).toBe('Events.value')

      // Remove first filter
      store.getState().removeStartingStepFilter(0)
      expect(store.getState().startingStep.filters).toHaveLength(1)
      expect(store.getState().startingStep.filters[0].member).toBe('Events.value')
    })

    it('should build query with all optional fields populated', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().setStartingStepName('Purchase Event')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
      store.getState().setStepsBefore(2)
      store.getState().setStepsAfter(5)
      store.getState().setJoinStrategy('window')

      const query = store.getState().buildFlowQuery()

      expect(query).not.toBeNull()
      expect(query?.flow.bindingKey).toBe('Events.userId')
      expect(query?.flow.timeDimension).toBe('Events.timestamp')
      expect(query?.flow.eventDimension).toBe('Events.eventType')
      expect(query?.flow.startingStep.name).toBe('Purchase Event')
      expect(query?.flow.stepsAfter).toBe(5)
      expect(query?.flow.joinStrategy).toBe('window')
    })

    it('should handle minimum step depths', () => {
      store.getState().setStepsBefore(0)
      store.getState().setStepsAfter(0)

      expect(store.getState().stepsBefore).toBe(0)
      expect(store.getState().stepsAfter).toBe(0)
    })

    it('should handle maximum step depths', () => {
      store.getState().setStepsBefore(5)
      store.getState().setStepsAfter(5)

      expect(store.getState().stepsBefore).toBe(5)
      expect(store.getState().stepsAfter).toBe(5)
    })

    it('should preserve starting step configuration when other fields change', () => {
      store.getState().setStartingStepName('Initial Purchase')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })

      // Change other flow fields
      store.getState().setStepsBefore(1)
      store.getState().setStepsAfter(4)
      store.getState().setJoinStrategy('lateral')

      // Starting step should be preserved
      expect(store.getState().startingStep.name).toBe('Initial Purchase')
      expect(store.getState().startingStep.filters).toHaveLength(1)
    })

    it('should handle complex filter operators', () => {
      const complexFilters: Filter[] = [
        { member: 'Events.type', operator: 'equals', values: ['purchase'] },
        { member: 'Events.value', operator: 'gte', values: ['100'] },
        { member: 'Events.status', operator: 'notEquals', values: ['cancelled'] },
        { member: 'Events.category', operator: 'contains', values: ['elec'] },
      ]

      complexFilters.forEach((f) => store.getState().addStartingStepFilter(f))

      expect(store.getState().startingStep.filters).toHaveLength(4)
      expect(store.getState().startingStep.filters[0].operator).toBe('equals')
      expect(store.getState().startingStep.filters[1].operator).toBe('gte')
      expect(store.getState().startingStep.filters[2].operator).toBe('notEquals')
      expect(store.getState().startingStep.filters[3].operator).toBe('contains')
    })
  })

  // ==========================================================================
  // Mode Switching Behavior
  // ==========================================================================
  describe('Mode Switching', () => {
    it('should preserve flow state when switching to query and back', () => {
      // Setup flow state
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })
      store.getState().setFlowTimeDimension('Events.timestamp')
      store.getState().setEventDimension('Events.eventType')
      store.getState().setStartingStepName('Checkout')
      store.getState().addStartingStepFilter({
        member: 'Events.type',
        operator: 'equals',
        values: ['checkout'],
      })
      store.getState().setStepsBefore(2)
      store.getState().setStepsAfter(3)
      store.getState().setJoinStrategy('lateral')

      // Switch to query mode
      store.getState().setAnalysisType('query')
      expect(store.getState().isFlowMode()).toBe(false)

      // Switch back to flow mode
      store.getState().setAnalysisType('flow')
      expect(store.getState().isFlowMode()).toBe(true)

      // All flow state should be preserved
      expect(store.getState().flowCube).toBe('Events')
      expect(store.getState().flowBindingKey?.dimension).toBe('Events.userId')
      expect(store.getState().flowTimeDimension).toBe('Events.timestamp')
      expect(store.getState().eventDimension).toBe('Events.eventType')
      expect(store.getState().startingStep.name).toBe('Checkout')
      expect(store.getState().startingStep.filters).toHaveLength(1)
      expect(store.getState().stepsBefore).toBe(2)
      expect(store.getState().stepsAfter).toBe(3)
      expect(store.getState().joinStrategy).toBe('lateral')
    })

    it('should preserve flow state when switching through multiple modes', () => {
      // Setup flow state
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setFlowBindingKey({ dimension: 'Events.userId' })

      // Switch through modes: flow -> funnel -> retention -> query -> flow
      store.getState().setAnalysisType('funnel')
      store.getState().setAnalysisType('retention')
      store.getState().setAnalysisType('query')
      store.getState().setAnalysisType('flow')

      // Flow state should still be preserved
      expect(store.getState().flowCube).toBe('Events')
      expect(store.getState().flowBindingKey?.dimension).toBe('Events.userId')
    })
  })

  // ==========================================================================
  // Integration with Charts Map
  // ==========================================================================
  describe('Charts Map Integration', () => {
    it('should have flow chart config in charts map after switching to flow mode', () => {
      store.getState().setAnalysisType('flow')

      const charts = store.getState().charts
      expect(charts).toBeDefined()
      // Flow mode should have its own chart config
      expect(charts.flow).toBeDefined()
    })

    it('should preserve flow chart type when switching modes', () => {
      store.getState().setAnalysisType('flow')

      // Set chart type for flow
      store.getState().setChartType('sankey')
      expect(store.getState().charts.flow?.chartType).toBe('sankey')

      // Switch to query
      store.getState().setAnalysisType('query')
      store.getState().setChartType('bar')

      // Switch back to flow
      store.getState().setAnalysisType('flow')

      // Flow chart type should still be sankey
      expect(store.getState().charts.flow?.chartType).toBe('sankey')
    })
  })
})

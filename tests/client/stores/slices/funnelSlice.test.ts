/**
 * Comprehensive tests for Funnel Slice
 * Tests all funnel slice state and actions for Zustand store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAnalysisBuilderStore,
  type AnalysisBuilderStore,
} from '../../../../src/client/stores/analysisBuilderStore'
import type { StoreApi } from 'zustand'
import type { Filter, SimpleFilter } from '../../../../src/client/types'

// ============================================================================
// Test Setup
// ============================================================================

describe('FunnelSlice', () => {
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
    it('should have null funnelCube by default', () => {
      expect(store.getState().funnelCube).toBeNull()
    })

    it('should have empty funnelSteps array by default', () => {
      expect(store.getState().funnelSteps).toEqual([])
    })

    it('should have 0 as default activeFunnelStepIndex', () => {
      expect(store.getState().activeFunnelStepIndex).toBe(0)
    })

    it('should have null funnelTimeDimension by default', () => {
      expect(store.getState().funnelTimeDimension).toBeNull()
    })

    it('should have null funnelBindingKey by default', () => {
      expect(store.getState().funnelBindingKey).toBeNull()
    })

    it('should have empty stepTimeToConvert array by default (deprecated)', () => {
      expect(store.getState().stepTimeToConvert).toEqual([])
    })
  })

  // ==========================================================================
  // Step Management Actions
  // ==========================================================================
  describe('Step Management', () => {
    describe('addFunnelStep', () => {
      it('should add a funnel step with correct defaults', () => {
        store.getState().addFunnelStep()

        const state = store.getState()
        expect(state.funnelSteps).toHaveLength(1)
        expect(state.funnelSteps[0].name).toBe('Step 1')
        expect(state.funnelSteps[0].cube).toBe('')
        expect(state.funnelSteps[0].filters).toEqual([])
        expect(state.funnelSteps[0].id).toBeDefined()
      })

      it('should add step with funnelCube if set', () => {
        store.getState().setFunnelCube('Events')
        store.getState().addFunnelStep()

        expect(store.getState().funnelSteps[0].cube).toBe('Events')
      })

      it('should increment step name for subsequent steps', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()

        expect(store.getState().funnelSteps[0].name).toBe('Step 1')
        expect(store.getState().funnelSteps[1].name).toBe('Step 2')
        expect(store.getState().funnelSteps[2].name).toBe('Step 3')
      })

      it('should copy filters from last step when adding', () => {
        const filter: Filter = {
          member: 'Events.category',
          operator: 'equals',
          values: ['purchase'],
        }
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { filters: [filter] })

        store.getState().addFunnelStep()

        expect(store.getState().funnelSteps[1].filters).toHaveLength(1)
        expect((store.getState().funnelSteps[1].filters[0] as SimpleFilter).member).toBe('Events.category')
      })

      it('should deep copy filters (not reference copy)', () => {
        const filter: Filter = {
          member: 'Events.category',
          operator: 'equals',
          values: ['purchase'],
        }
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { filters: [filter] })

        store.getState().addFunnelStep()

        // Modify the first step's filter
        store.getState().updateFunnelStep(0, {
          filters: [{ member: 'Events.type', operator: 'equals', values: ['click'] }],
        })

        // Second step should not be affected (deep copy)
        expect((store.getState().funnelSteps[1].filters[0] as SimpleFilter).member).toBe('Events.category')
      })

      it('should copy timeToConvert from last step when adding', () => {
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { timeToConvert: 'P7D' })

        store.getState().addFunnelStep()

        expect(store.getState().funnelSteps[1].timeToConvert).toBe('P7D')
      })

      it('should set active index to the new step', () => {
        store.getState().addFunnelStep()
        expect(store.getState().activeFunnelStepIndex).toBe(0)

        store.getState().addFunnelStep()
        expect(store.getState().activeFunnelStepIndex).toBe(1)

        store.getState().addFunnelStep()
        expect(store.getState().activeFunnelStepIndex).toBe(2)
      })

      it('should generate unique IDs for each step', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()

        const ids = store.getState().funnelSteps.map((s) => s.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(3)
      })
    })

    describe('removeFunnelStep', () => {
      it('should remove a funnel step by index', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()

        store.getState().removeFunnelStep(1)

        expect(store.getState().funnelSteps).toHaveLength(2)
        expect(store.getState().funnelSteps[0].name).toBe('Step 1')
        expect(store.getState().funnelSteps[1].name).toBe('Step 3')
      })

      it('should not remove the last step (minimum 1 step)', () => {
        store.getState().addFunnelStep()
        expect(store.getState().funnelSteps).toHaveLength(1)

        store.getState().removeFunnelStep(0)
        expect(store.getState().funnelSteps).toHaveLength(1)
      })

      it('should adjust active index when removing step before active', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().setActiveFunnelStepIndex(2)

        store.getState().removeFunnelStep(0)

        // Active was 2, after removing 0, it should clamp to valid range
        expect(store.getState().activeFunnelStepIndex).toBeLessThanOrEqual(1)
      })

      it('should adjust active index when removing active step', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().setActiveFunnelStepIndex(2)

        store.getState().removeFunnelStep(2)

        expect(store.getState().activeFunnelStepIndex).toBe(1)
      })

      it('should clamp active index to valid range after removal', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().setActiveFunnelStepIndex(1)

        store.getState().removeFunnelStep(1)

        expect(store.getState().activeFunnelStepIndex).toBe(0)
      })
    })

    describe('updateFunnelStep', () => {
      it('should update step name', () => {
        store.getState().addFunnelStep()

        store.getState().updateFunnelStep(0, { name: 'Signup' })

        expect(store.getState().funnelSteps[0].name).toBe('Signup')
      })

      it('should update step cube', () => {
        store.getState().addFunnelStep()

        store.getState().updateFunnelStep(0, { cube: 'Users' })

        expect(store.getState().funnelSteps[0].cube).toBe('Users')
      })

      it('should update step filters', () => {
        store.getState().addFunnelStep()

        const filters: Filter[] = [
          { member: 'Events.type', operator: 'equals', values: ['purchase'] },
        ]
        store.getState().updateFunnelStep(0, { filters })

        expect(store.getState().funnelSteps[0].filters).toHaveLength(1)
        expect((store.getState().funnelSteps[0].filters[0] as SimpleFilter).member).toBe('Events.type')
      })

      it('should update step timeToConvert', () => {
        store.getState().addFunnelStep()

        store.getState().updateFunnelStep(0, { timeToConvert: 'P30D' })

        expect(store.getState().funnelSteps[0].timeToConvert).toBe('P30D')
      })

      it('should handle partial updates', () => {
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { name: 'Signup', cube: 'Events' })

        store.getState().updateFunnelStep(0, { name: 'Registration' })

        expect(store.getState().funnelSteps[0].name).toBe('Registration')
        expect(store.getState().funnelSteps[0].cube).toBe('Events')
      })

      it('should not update if index does not exist', () => {
        store.getState().addFunnelStep()

        store.getState().updateFunnelStep(5, { name: 'Invalid' })

        expect(store.getState().funnelSteps[0].name).toBe('Step 1')
      })
    })

    describe('reorderFunnelSteps', () => {
      it('should reorder steps from lower to higher index', () => {
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { name: 'A' })
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(1, { name: 'B' })
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(2, { name: 'C' })

        store.getState().reorderFunnelSteps(0, 2)

        expect(store.getState().funnelSteps[0].name).toBe('B')
        expect(store.getState().funnelSteps[1].name).toBe('C')
        expect(store.getState().funnelSteps[2].name).toBe('A')
      })

      it('should reorder steps from higher to lower index', () => {
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { name: 'A' })
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(1, { name: 'B' })
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(2, { name: 'C' })

        store.getState().reorderFunnelSteps(2, 0)

        expect(store.getState().funnelSteps[0].name).toBe('C')
        expect(store.getState().funnelSteps[1].name).toBe('A')
        expect(store.getState().funnelSteps[2].name).toBe('B')
      })

      it('should handle no-op when fromIndex equals toIndex', () => {
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(0, { name: 'A' })
        store.getState().addFunnelStep()
        store.getState().updateFunnelStep(1, { name: 'B' })

        store.getState().reorderFunnelSteps(1, 1)

        expect(store.getState().funnelSteps[0].name).toBe('A')
        expect(store.getState().funnelSteps[1].name).toBe('B')
      })
    })

    describe('setActiveFunnelStepIndex', () => {
      it('should set the active step index', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()

        store.getState().setActiveFunnelStepIndex(1)

        expect(store.getState().activeFunnelStepIndex).toBe(1)
      })

      it('should allow setting index to 0', () => {
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()
        store.getState().setActiveFunnelStepIndex(1)

        store.getState().setActiveFunnelStepIndex(0)

        expect(store.getState().activeFunnelStepIndex).toBe(0)
      })
    })
  })

  // ==========================================================================
  // Cube/Dimension Setters
  // ==========================================================================
  describe('Cube/Dimension Setters', () => {
    describe('setFunnelCube', () => {
      it('should set funnel cube', () => {
        store.getState().setFunnelCube('Events')

        expect(store.getState().funnelCube).toBe('Events')
      })

      it('should clear funnel cube when set to null', () => {
        store.getState().setFunnelCube('Events')
        store.getState().setFunnelCube(null)

        expect(store.getState().funnelCube).toBeNull()
      })

      it('should clear bindingKey when cube changes', () => {
        store.getState().setFunnelCube('Events')
        store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })

        store.getState().setFunnelCube('Actions')

        expect(store.getState().funnelBindingKey).toBeNull()
      })

      it('should clear timeDimension when cube changes', () => {
        store.getState().setFunnelCube('Events')
        store.getState().setFunnelTimeDimension('Events.timestamp')

        store.getState().setFunnelCube('Actions')

        expect(store.getState().funnelTimeDimension).toBeNull()
      })

      it('should update all existing steps cube when cube changes', () => {
        store.getState().setFunnelCube('Events')
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()

        expect(store.getState().funnelSteps[0].cube).toBe('Events')
        expect(store.getState().funnelSteps[1].cube).toBe('Events')

        store.getState().setFunnelCube('Actions')

        expect(store.getState().funnelSteps[0].cube).toBe('Actions')
        expect(store.getState().funnelSteps[1].cube).toBe('Actions')
      })

      it('should set steps cube to empty string when cube is null', () => {
        store.getState().setFunnelCube('Events')
        store.getState().addFunnelStep()

        store.getState().setFunnelCube(null)

        expect(store.getState().funnelSteps[0].cube).toBe('')
      })
    })

    describe('setFunnelTimeDimension', () => {
      it('should set time dimension', () => {
        store.getState().setFunnelTimeDimension('Events.timestamp')

        expect(store.getState().funnelTimeDimension).toBe('Events.timestamp')
      })

      it('should clear time dimension when set to null', () => {
        store.getState().setFunnelTimeDimension('Events.timestamp')
        store.getState().setFunnelTimeDimension(null)

        expect(store.getState().funnelTimeDimension).toBeNull()
      })
    })

    describe('setFunnelBindingKey', () => {
      it('should set binding key with string dimension', () => {
        store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })

        expect(store.getState().funnelBindingKey?.dimension).toBe('Events.userId')
      })

      it('should set binding key with array dimension for multi-cube', () => {
        const bindingKey = {
          dimension: [
            { cube: 'Events', dimension: 'Events.userId' },
            { cube: 'Users', dimension: 'Users.id' },
          ],
        }
        store.getState().setFunnelBindingKey(bindingKey)

        expect(store.getState().funnelBindingKey).toEqual(bindingKey)
      })

      it('should clear binding key when set to null', () => {
        store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
        store.getState().setFunnelBindingKey(null)

        expect(store.getState().funnelBindingKey).toBeNull()
      })
    })
  })

  // ==========================================================================
  // Query Building
  // ==========================================================================
  describe('buildFunnelQueryFromSteps', () => {
    it('should return null when not in funnel mode', () => {
      expect(store.getState().buildFunnelQueryFromSteps()).toBeNull()
    })

    it('should return null when binding key is missing', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      expect(store.getState().buildFunnelQueryFromSteps()).toBeNull()
    })

    it('should return null when time dimension is missing', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      expect(store.getState().buildFunnelQueryFromSteps()).toBeNull()
    })

    it('should return null when fewer than 2 steps', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()

      expect(store.getState().buildFunnelQueryFromSteps()).toBeNull()
    })

    it('should return null when steps lack cube or name', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()
      // Steps have empty cube by default when funnelCube is not set

      expect(store.getState().buildFunnelQueryFromSteps()).toBeNull()
    })

    it('should return valid ServerFunnelQuery when properly configured', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Signup' })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Purchase' })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query).not.toBeNull()
      expect(query?.funnel.bindingKey).toBe('Events.userId')
      expect(query?.funnel.timeDimension).toBe('Events.timestamp')
      expect(query?.funnel.steps).toHaveLength(2)
      expect(query?.funnel.steps[0].name).toBe('Signup')
      expect(query?.funnel.steps[1].name).toBe('Purchase')
      expect(query?.funnel.includeTimeMetrics).toBe(true)
    })

    it('should include step filters in query', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, {
        name: 'Signup',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
      })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, {
        name: 'Purchase',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
      })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query?.funnel.steps[0].filter).toHaveLength(1)
      expect(query?.funnel.steps[1].filter).toHaveLength(1)
    })

    it('should omit filters when step has no filters', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Signup' })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Purchase' })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query?.funnel.steps[0].filter).toBeUndefined()
      expect(query?.funnel.steps[1].filter).toBeUndefined()
    })

    it('should include timeToConvert when set', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Signup', timeToConvert: 'P1D' })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Purchase', timeToConvert: 'P7D' })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query?.funnel.steps[0].timeToConvert).toBe('P1D')
      expect(query?.funnel.steps[1].timeToConvert).toBe('P7D')
    })

    it('should include cube in each step', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Signup' })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Purchase' })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query?.funnel.steps[0].cube).toBe('Events')
      expect(query?.funnel.steps[1].cube).toBe('Events')
    })
  })

  // ==========================================================================
  // Mode Checking Methods
  // ==========================================================================
  describe('isFunnelMode', () => {
    it('should return false when analysis type is query', () => {
      expect(store.getState().isFunnelMode()).toBe(false)
    })

    it('should return true when analysis type is funnel', () => {
      store.getState().setAnalysisType('funnel')
      expect(store.getState().isFunnelMode()).toBe(true)
    })

    it('should return false when analysis type is flow', () => {
      store.getState().setAnalysisType('flow')
      expect(store.getState().isFunnelMode()).toBe(false)
    })

    it('should return false when analysis type is retention', () => {
      store.getState().setAnalysisType('retention')
      expect(store.getState().isFunnelMode()).toBe(false)
    })
  })

  describe('isFunnelModeEnabled', () => {
    it('should return false when not in funnel mode', () => {
      expect(store.getState().isFunnelModeEnabled()).toBe(false)
    })

    it('should return false when missing binding key', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      expect(store.getState().isFunnelModeEnabled()).toBe(false)
    })

    it('should return false when missing time dimension', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      expect(store.getState().isFunnelModeEnabled()).toBe(false)
    })

    it('should return false when fewer than 2 steps', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()

      expect(store.getState().isFunnelModeEnabled()).toBe(false)
    })

    it('should return false when steps lack valid cube', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      // Don't set funnelCube, so steps have empty cube
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      expect(store.getState().isFunnelModeEnabled()).toBe(false)
    })

    it('should return true when fully configured', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      expect(store.getState().isFunnelModeEnabled()).toBe(true)
    })
  })

  // ==========================================================================
  // Deprecated Actions
  // ==========================================================================
  describe('Deprecated Actions', () => {
    describe('setStepTimeToConvert', () => {
      it('should be a no-op (deprecated)', () => {
        const stateBefore = store.getState().stepTimeToConvert
        store.getState().setStepTimeToConvert(0, 'P7D')
        const stateAfter = store.getState().stepTimeToConvert

        expect(stateAfter).toEqual(stateBefore)
      })
    })

    describe('buildFunnelConfig', () => {
      it('should always return null (deprecated)', () => {
        store.getState().setAnalysisType('funnel')
        store.getState().setFunnelCube('Events')
        store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
        store.getState().setFunnelTimeDimension('Events.timestamp')
        store.getState().addFunnelStep()
        store.getState().addFunnelStep()

        expect(store.getState().buildFunnelConfig()).toBeNull()
      })
    })
  })

  // ==========================================================================
  // Clear / Reset Functionality
  // ==========================================================================
  describe('Clear / Reset', () => {
    it('should reset funnel state when reset() is called', () => {
      // Configure funnel state
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Signup' })
      store.getState().addFunnelStep()

      // Reset
      store.getState().reset()

      // Verify reset
      expect(store.getState().analysisType).toBe('query')
      expect(store.getState().funnelCube).toBeNull()
      expect(store.getState().funnelBindingKey).toBeNull()
      expect(store.getState().funnelTimeDimension).toBeNull()
      expect(store.getState().funnelSteps).toEqual([])
      expect(store.getState().activeFunnelStepIndex).toBe(0)
    })

    it('should clear funnel state when clearCurrentMode is called in funnel mode', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      store.getState().clearCurrentMode()

      expect(store.getState().funnelCube).toBeNull()
      expect(store.getState().funnelBindingKey).toBeNull()
      expect(store.getState().funnelTimeDimension).toBeNull()
      expect(store.getState().funnelSteps).toEqual([])
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle switching from funnel to other modes', () => {
      // Setup funnel
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')

      // Switch to query
      store.getState().setAnalysisType('query')

      // Funnel state should be preserved
      expect(store.getState().funnelCube).toBe('Events')
      expect(store.getState().funnelBindingKey?.dimension).toBe('Events.userId')
      expect(store.getState().funnelTimeDimension).toBe('Events.timestamp')

      // Switch back to funnel
      store.getState().setAnalysisType('funnel')
      expect(store.getState().isFunnelMode()).toBe(true)
    })

    it('should handle rapid step additions and removals', () => {
      store.getState().setFunnelCube('Events')

      // Add many steps
      for (let i = 0; i < 10; i++) {
        store.getState().addFunnelStep()
      }
      expect(store.getState().funnelSteps).toHaveLength(10)

      // Remove several
      store.getState().removeFunnelStep(5)
      store.getState().removeFunnelStep(3)
      store.getState().removeFunnelStep(1)
      expect(store.getState().funnelSteps).toHaveLength(7)

      // Active index should be valid
      expect(store.getState().activeFunnelStepIndex).toBeLessThan(7)
    })

    it('should build query with all optional fields populated', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, {
        name: 'Signup Event',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
        timeToConvert: 'P1D',
      })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, {
        name: 'Purchase Event',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        timeToConvert: 'P7D',
      })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query).not.toBeNull()
      expect(query?.funnel.bindingKey).toBe('Events.userId')
      expect(query?.funnel.timeDimension).toBe('Events.timestamp')
      expect(query?.funnel.steps).toHaveLength(2)
      expect(query?.funnel.steps[0].name).toBe('Signup Event')
      expect(query?.funnel.steps[0].filter).toHaveLength(1)
      expect(query?.funnel.steps[0].timeToConvert).toBe('P1D')
      expect(query?.funnel.steps[1].name).toBe('Purchase Event')
      expect(query?.funnel.steps[1].filter).toHaveLength(1)
      expect(query?.funnel.steps[1].timeToConvert).toBe('P7D')
      expect(query?.funnel.includeTimeMetrics).toBe(true)
    })

    it('should handle complex filter operators in steps', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()

      const complexFilters: Filter[] = [
        { member: 'Events.type', operator: 'equals', values: ['purchase'] },
        { member: 'Events.value', operator: 'gte', values: ['100'] },
        { member: 'Events.status', operator: 'notEquals', values: ['cancelled'] },
        { member: 'Events.category', operator: 'contains', values: ['elec'] },
      ]
      store.getState().updateFunnelStep(0, { name: 'Complex', filters: complexFilters })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Simple' })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query?.funnel.steps[0].filter).toHaveLength(4)
    })

    it('should preserve step configuration when other fields change', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, {
        name: 'Initial Signup',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
        timeToConvert: 'P3D',
      })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Purchase' })

      // Change binding key and time dimension
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')

      // Step configuration should be preserved
      expect(store.getState().funnelSteps[0].name).toBe('Initial Signup')
      expect(store.getState().funnelSteps[0].filters).toHaveLength(1)
      expect(store.getState().funnelSteps[0].timeToConvert).toBe('P3D')
    })
  })

  // ==========================================================================
  // Mode Switching Behavior
  // ==========================================================================
  describe('Mode Switching', () => {
    it('should preserve funnel state when switching to query and back', () => {
      // Setup funnel state
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, {
        name: 'Signup',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
      })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Purchase' })

      // Switch to query mode
      store.getState().setAnalysisType('query')
      expect(store.getState().isFunnelMode()).toBe(false)

      // Switch back to funnel mode
      store.getState().setAnalysisType('funnel')
      expect(store.getState().isFunnelMode()).toBe(true)

      // All funnel state should be preserved
      expect(store.getState().funnelCube).toBe('Events')
      expect(store.getState().funnelBindingKey?.dimension).toBe('Events.userId')
      expect(store.getState().funnelTimeDimension).toBe('Events.timestamp')
      expect(store.getState().funnelSteps).toHaveLength(2)
      expect(store.getState().funnelSteps[0].name).toBe('Signup')
      expect(store.getState().funnelSteps[0].filters).toHaveLength(1)
      expect(store.getState().funnelSteps[1].name).toBe('Purchase')
    })

    it('should preserve funnel state when switching through multiple modes', () => {
      // Setup funnel state
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().addFunnelStep()
      store.getState().addFunnelStep()

      // Switch through modes: funnel -> flow -> retention -> query -> funnel
      store.getState().setAnalysisType('flow')
      store.getState().setAnalysisType('retention')
      store.getState().setAnalysisType('query')
      store.getState().setAnalysisType('funnel')

      // Funnel state should still be preserved
      expect(store.getState().funnelCube).toBe('Events')
      expect(store.getState().funnelBindingKey?.dimension).toBe('Events.userId')
      expect(store.getState().funnelSteps).toHaveLength(2)
    })
  })

  // ==========================================================================
  // Integration with Charts Map
  // ==========================================================================
  describe('Charts Map Integration', () => {
    it('should have funnel chart config in charts map after switching to funnel mode', () => {
      store.getState().setAnalysisType('funnel')

      const charts = store.getState().charts
      expect(charts).toBeDefined()
      // Funnel mode should have its own chart config
      expect(charts.funnel).toBeDefined()
    })

    it('should preserve funnel chart type when switching modes', () => {
      store.getState().setAnalysisType('funnel')

      // Set chart type for funnel
      store.getState().setChartType('funnel')
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')

      // Switch to query
      store.getState().setAnalysisType('query')
      store.getState().setChartType('bar')

      // Switch back to funnel
      store.getState().setAnalysisType('funnel')

      // Funnel chart type should still be funnel
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')
    })
  })

  // ==========================================================================
  // Filter Handling in Steps
  // ==========================================================================
  describe('Filter Handling in Steps', () => {
    it('should support multiple filters per step', () => {
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()

      const filters: Filter[] = [
        { member: 'Events.type', operator: 'equals', values: ['purchase'] },
        { member: 'Events.category', operator: 'equals', values: ['electronics'] },
        { member: 'Events.value', operator: 'gt', values: ['100'] },
      ]
      store.getState().updateFunnelStep(0, { filters })

      expect(store.getState().funnelSteps[0].filters).toHaveLength(3)
    })

    it('should allow clearing filters from a step', () => {
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, {
        filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
      })

      store.getState().updateFunnelStep(0, { filters: [] })

      expect(store.getState().funnelSteps[0].filters).toHaveLength(0)
    })

    it('should handle group filters (and/or)', () => {
      store.getState().setFunnelCube('Events')
      store.getState().addFunnelStep()

      const groupFilter: Filter = {
        type: 'or',
        filters: [
          { member: 'Events.type', operator: 'equals', values: ['purchase'] },
          { member: 'Events.type', operator: 'equals', values: ['checkout'] },
        ],
      }
      store.getState().updateFunnelStep(0, { filters: [groupFilter] })

      expect(store.getState().funnelSteps[0].filters).toHaveLength(1)
      expect((store.getState().funnelSteps[0].filters[0] as any).type).toBe('or')
    })
  })

  // ==========================================================================
  // Multi-Cube Binding Key Support
  // ==========================================================================
  describe('Multi-Cube Binding Key', () => {
    it('should support array binding key for multi-cube funnels', () => {
      const multiCubeBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      }

      store.getState().setFunnelBindingKey(multiCubeBindingKey)

      expect(Array.isArray(store.getState().funnelBindingKey?.dimension)).toBe(true)
      const dimension = store.getState().funnelBindingKey?.dimension as any[]
      expect(dimension).toHaveLength(2)
      expect(dimension[0].cube).toBe('Signups')
      expect(dimension[1].cube).toBe('Purchases')
    })

    it('should build query with array binding key', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({
        dimension: [
          { cube: 'Events', dimension: 'Events.userId' },
          { cube: 'Users', dimension: 'Users.id' },
        ],
      })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Step 1' })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Step 2' })

      const query = store.getState().buildFunnelQueryFromSteps()

      expect(query).not.toBeNull()
      expect(Array.isArray(query?.funnel.bindingKey)).toBe(true)
    })
  })

  // ==========================================================================
  // Validation Edge Cases
  // ==========================================================================
  describe('Validation Edge Cases', () => {
    it('should require all steps to have both cube and name for valid query', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: '' }) // Empty name
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Valid Step' })

      // Query should be null because first step has no name
      expect(store.getState().buildFunnelQueryFromSteps()).toBeNull()
    })

    it('should filter out invalid steps when building query', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(0, { name: 'Step 1' })
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(1, { name: 'Step 2', cube: '' }) // Invalid cube
      store.getState().addFunnelStep()
      store.getState().updateFunnelStep(2, { name: 'Step 3' })

      // Update step 1 back to have valid cube
      store.getState().updateFunnelStep(1, { cube: 'Events' })

      const query = store.getState().buildFunnelQueryFromSteps()
      expect(query).not.toBeNull()
      expect(query?.funnel.steps).toHaveLength(3)
    })
  })
})

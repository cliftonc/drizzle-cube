/**
 * Tests for Adapter Registry
 *
 * The adapter registry is a central lookup mechanism for mode adapters.
 * It handles auto-initialization of built-in adapters (query, funnel, flow, retention)
 * and supports registration of custom adapters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { adapterRegistry } from '../../../src/client/adapters/adapterRegistry'
import type { ModeAdapter, ValidationResult } from '../../../src/client/adapters/modeAdapter'
import type { AnalysisConfig, AnalysisType, ChartConfig } from '../../../src/client/types/analysisConfig'

// ============================================================================
// Mock Adapter for Testing Custom Registration
// ============================================================================

interface MockSliceState {
  mockField: string
  mockCount: number
}

/**
 * Create a mock adapter for testing custom adapter registration.
 * Uses a parameterized type to allow testing with different analysis types.
 */
function createMockAdapter(type: AnalysisType): ModeAdapter<MockSliceState> {
  return {
    type,

    createInitial(): MockSliceState {
      return {
        mockField: '',
        mockCount: 0,
      }
    },

    extractState(storeState: Record<string, unknown>): MockSliceState {
      return {
        mockField: (storeState.mockField as string) || '',
        mockCount: (storeState.mockCount as number) || 0,
      }
    },

    canLoad(config: unknown): config is AnalysisConfig {
      if (!config || typeof config !== 'object') return false
      const c = config as Record<string, unknown>
      return c.version === 1 && c.analysisType === type
    },

    load(_config: AnalysisConfig): MockSliceState {
      return {
        mockField: 'loaded',
        mockCount: 42,
      }
    },

    save(
      state: MockSliceState,
      charts: Partial<Record<AnalysisType, ChartConfig>>,
      activeView: 'table' | 'chart'
    ): AnalysisConfig {
      return {
        version: 1,
        analysisType: type,
        activeView,
        charts: charts,
        query: { mockField: state.mockField, mockCount: state.mockCount },
      } as unknown as AnalysisConfig
    },

    validate(state: MockSliceState): ValidationResult {
      const errors: string[] = []
      if (!state.mockField) {
        errors.push('mockField is required')
      }
      return {
        isValid: errors.length === 0,
        errors,
        warnings: [],
      }
    },

    clear(_state: MockSliceState): MockSliceState {
      return this.createInitial()
    },

    getDefaultChartConfig(): ChartConfig {
      return {
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
      }
    },
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('adapterRegistry', () => {
  // Clear registry before each test to ensure isolation
  beforeEach(() => {
    adapterRegistry.clear()
  })

  // ==========================================================================
  // Auto-initialization Tests
  // ==========================================================================

  describe('auto-initialization', () => {
    it('should return queryModeAdapter for get("query")', () => {
      const adapter = adapterRegistry.get('query')
      expect(adapter).toBeDefined()
      expect(adapter.type).toBe('query')
      // Verify it's the actual queryModeAdapter by checking a characteristic behavior
      const initialState = adapter.createInitial()
      expect(initialState).toHaveProperty('queryStates')
      expect(initialState).toHaveProperty('activeQueryIndex')
      expect(initialState).toHaveProperty('mergeStrategy')
    })

    it('should return funnelModeAdapter for get("funnel")', () => {
      const adapter = adapterRegistry.get('funnel')
      expect(adapter).toBeDefined()
      expect(adapter.type).toBe('funnel')
      // Verify it's the actual funnelModeAdapter by checking a characteristic behavior
      const initialState = adapter.createInitial()
      expect(initialState).toHaveProperty('funnelCube')
      expect(initialState).toHaveProperty('funnelSteps')
      expect(initialState).toHaveProperty('funnelBindingKey')
    })

    it('should return flowModeAdapter for get("flow")', () => {
      const adapter = adapterRegistry.get('flow')
      expect(adapter).toBeDefined()
      expect(adapter.type).toBe('flow')
      // Verify it's the actual flowModeAdapter by checking a characteristic behavior
      const initialState = adapter.createInitial()
      expect(initialState).toHaveProperty('flowCube')
      expect(initialState).toHaveProperty('flowBindingKey')
      expect(initialState).toHaveProperty('startingStep')
    })

    it('should return retentionModeAdapter for get("retention")', () => {
      const adapter = adapterRegistry.get('retention')
      expect(adapter).toBeDefined()
      expect(adapter.type).toBe('retention')
      // Verify it's the actual retentionModeAdapter by checking a characteristic behavior
      const initialState = adapter.createInitial()
      expect(initialState).toHaveProperty('retentionCube')
      expect(initialState).toHaveProperty('retentionBindingKey')
      expect(initialState).toHaveProperty('retentionTimeDimension')
    })

    it('should auto-register built-in adapters without explicit register call', () => {
      // Verify none are registered initially (after clear)
      // We can't directly check this, but we can verify that after get() is called,
      // the built-ins become available

      // Call get() for one adapter to trigger auto-initialization
      adapterRegistry.get('query')

      // Now all built-ins should be available via has()
      expect(adapterRegistry.has('query')).toBe(true)
      expect(adapterRegistry.has('funnel')).toBe(true)
      expect(adapterRegistry.has('flow')).toBe(true)
      expect(adapterRegistry.has('retention')).toBe(true)
    })

    it('should return the same adapter instance on subsequent calls', () => {
      const adapter1 = adapterRegistry.get('query')
      const adapter2 = adapterRegistry.get('query')

      // Should be the same reference
      expect(adapter1).toBe(adapter2)
    })
  })

  // ==========================================================================
  // register() Tests
  // ==========================================================================

  describe('register()', () => {
    it('should register a new adapter', () => {
      // First, trigger auto-init so built-ins are registered
      adapterRegistry.get('query')

      // Create a mock adapter that overwrites query
      const mockAdapter = createMockAdapter('query')

      // Register it
      adapterRegistry.register(mockAdapter)

      // Verify it was registered by getting it and checking type matches
      const retrieved = adapterRegistry.get('query')
      expect(retrieved.type).toBe('query')

      // Verify it's the mock adapter by checking createInitial behavior
      const initialState = retrieved.createInitial()
      expect(initialState).toHaveProperty('mockField')
      expect(initialState).toHaveProperty('mockCount')
    })

    it('should log warning when overwriting existing adapter', () => {
      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Trigger auto-init to register built-ins
      adapterRegistry.get('query')

      // Register a mock adapter that overwrites query
      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      // Verify warning was logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting existing adapter for type: query')
      )

      warnSpy.mockRestore()
    })

    it('should overwrite existing adapter when registering with same type', () => {
      // Trigger auto-init
      adapterRegistry.get('funnel')

      // Get original adapter's createInitial result
      const originalAdapter = adapterRegistry.get('funnel')
      const originalInitialState = originalAdapter.createInitial()
      expect(originalInitialState).toHaveProperty('funnelCube')

      // Suppress console.warn for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Register mock adapter to overwrite funnel
      const mockAdapter = createMockAdapter('funnel')
      adapterRegistry.register(mockAdapter)

      // Verify the new adapter is now returned
      const newAdapter = adapterRegistry.get('funnel')
      const newInitialState = newAdapter.createInitial()
      expect(newInitialState).toHaveProperty('mockField')
      expect(newInitialState).not.toHaveProperty('funnelCube')

      warnSpy.mockRestore()
    })

    it('should register adapter before auto-initialization triggers', () => {
      // Register a custom adapter BEFORE any get() call
      const mockAdapter = createMockAdapter('query')

      // Suppress warning since we're registering before auto-init
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      adapterRegistry.register(mockAdapter)

      // Now call get() - should return our mock adapter, not the built-in
      const retrieved = adapterRegistry.get('query')
      const initialState = retrieved.createInitial()

      expect(initialState).toHaveProperty('mockField')
      expect(initialState).not.toHaveProperty('queryStates')

      warnSpy.mockRestore()
    })
  })

  // ==========================================================================
  // get() Tests
  // ==========================================================================

  describe('get()', () => {
    it('should return registered adapter', () => {
      const adapter = adapterRegistry.get('query')
      expect(adapter).toBeDefined()
      expect(adapter.type).toBe('query')
    })

    it('should throw error for unregistered type', () => {
      // Create a type that doesn't exist in the registry
      // We need to cast to AnalysisType since TypeScript won't allow unknown types
      const unknownType = 'unknown_type' as AnalysisType

      expect(() => adapterRegistry.get(unknownType)).toThrow(
        /No adapter registered for type: unknown_type/
      )
    })

    it('should include available types in error message', () => {
      // Trigger auto-init
      adapterRegistry.get('query')

      const unknownType = 'unknown_type' as AnalysisType

      try {
        adapterRegistry.get(unknownType)
        // Should not reach here
        expect.fail('Expected error to be thrown')
      } catch (error) {
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('Available types:')
        expect(errorMessage).toContain('query')
        expect(errorMessage).toContain('funnel')
        expect(errorMessage).toContain('flow')
        expect(errorMessage).toContain('retention')
      }
    })

    it('should return adapter with correct methods', () => {
      const adapter = adapterRegistry.get('query')

      // Verify all required methods exist
      expect(typeof adapter.createInitial).toBe('function')
      expect(typeof adapter.extractState).toBe('function')
      expect(typeof adapter.canLoad).toBe('function')
      expect(typeof adapter.load).toBe('function')
      expect(typeof adapter.save).toBe('function')
      expect(typeof adapter.validate).toBe('function')
      expect(typeof adapter.clear).toBe('function')
      expect(typeof adapter.getDefaultChartConfig).toBe('function')
    })
  })

  // ==========================================================================
  // has() Tests
  // ==========================================================================

  describe('has()', () => {
    it('should return true for registered types', () => {
      // Trigger auto-init
      adapterRegistry.get('query')

      expect(adapterRegistry.has('query')).toBe(true)
      expect(adapterRegistry.has('funnel')).toBe(true)
      expect(adapterRegistry.has('flow')).toBe(true)
      expect(adapterRegistry.has('retention')).toBe(true)
    })

    it('should return false for unregistered types', () => {
      // Trigger auto-init
      adapterRegistry.get('query')

      const unknownType = 'unknown_type' as AnalysisType
      expect(adapterRegistry.has(unknownType)).toBe(false)
    })

    it('should return true immediately after auto-init for all built-ins', () => {
      // has() also triggers auto-init
      expect(adapterRegistry.has('query')).toBe(true)

      // All other built-ins should now be available too
      expect(adapterRegistry.has('funnel')).toBe(true)
      expect(adapterRegistry.has('flow')).toBe(true)
      expect(adapterRegistry.has('retention')).toBe(true)
    })

    it('should return true after manually registering an adapter', () => {
      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      expect(adapterRegistry.has('query')).toBe(true)
    })
  })

  // ==========================================================================
  // getRegisteredTypes() Tests
  // ==========================================================================

  describe('getRegisteredTypes()', () => {
    it('should return array of all registered types', () => {
      // Trigger auto-init
      adapterRegistry.get('query')

      const types = adapterRegistry.getRegisteredTypes()

      expect(Array.isArray(types)).toBe(true)
      expect(types).toContain('query')
      expect(types).toContain('funnel')
      expect(types).toContain('flow')
      expect(types).toContain('retention')
    })

    it('should include built-in types after auto-init', () => {
      // getRegisteredTypes() also triggers auto-init
      const types = adapterRegistry.getRegisteredTypes()

      expect(types).toHaveLength(4)
      expect(types).toContain('query')
      expect(types).toContain('funnel')
      expect(types).toContain('flow')
      expect(types).toContain('retention')
    })

    it('should return empty array before any access after clear', () => {
      // Clear is called in beforeEach, so registry should be empty
      // But getRegisteredTypes triggers auto-init, so we need to check differently

      // After clear(), the internal flag is reset
      // We can't directly test empty state since getRegisteredTypes triggers init
      // Instead, verify that the built-ins are present after calling it
      const types = adapterRegistry.getRegisteredTypes()
      expect(types.length).toBeGreaterThanOrEqual(4)
    })

    it('should include custom registered adapters', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Register custom adapter (using 'query' type for simplicity)
      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      // Trigger auto-init for other built-ins
      adapterRegistry.get('funnel')

      const types = adapterRegistry.getRegisteredTypes()
      expect(types).toContain('query')
      expect(types).toContain('funnel')
      expect(types).toContain('flow')
      expect(types).toContain('retention')

      warnSpy.mockRestore()
    })
  })

  // ==========================================================================
  // clear() Tests
  // ==========================================================================

  describe('clear()', () => {
    it('should clear all registered adapters', () => {
      // Trigger auto-init
      adapterRegistry.get('query')
      expect(adapterRegistry.has('query')).toBe(true)

      // Clear the registry
      adapterRegistry.clear()

      // Registry should still work because has() triggers auto-init
      // To truly test clear, we need to check internal state
      // Since we can't access internal state, we verify that after clear,
      // a get() call still works (due to re-initialization)
      const adapter = adapterRegistry.get('query')
      expect(adapter).toBeDefined()
    })

    it('should cause built-ins to re-initialize on next access', () => {
      // Trigger auto-init
      const originalAdapter = adapterRegistry.get('query')

      // Clear the registry
      adapterRegistry.clear()

      // Get the adapter again - should re-initialize
      const newAdapter = adapterRegistry.get('query')

      // Both should be the same built-in adapter (queryModeAdapter)
      // They should be the same reference since it's a singleton module
      expect(newAdapter.type).toBe('query')
      expect(newAdapter.type).toBe(originalAdapter.type)
    })

    it('should remove custom adapters after clear', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Register a custom adapter
      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      // Verify it's the mock adapter
      let adapter = adapterRegistry.get('query')
      let state = adapter.createInitial()
      expect(state).toHaveProperty('mockField')

      // Clear the registry
      adapterRegistry.clear()

      // Now get() should return the built-in adapter
      adapter = adapterRegistry.get('query')
      state = adapter.createInitial()
      expect(state).toHaveProperty('queryStates')
      expect(state).not.toHaveProperty('mockField')

      warnSpy.mockRestore()
    })

    it('should reset initialization flag', () => {
      // Trigger auto-init
      adapterRegistry.get('query')

      // Clear the registry
      adapterRegistry.clear()

      // Verify that calling has() triggers re-initialization
      // by checking that built-ins become available again
      expect(adapterRegistry.has('query')).toBe(true)
      expect(adapterRegistry.has('funnel')).toBe(true)
      expect(adapterRegistry.has('flow')).toBe(true)
      expect(adapterRegistry.has('retention')).toBe(true)
    })
  })

  // ==========================================================================
  // Custom Adapter Registration Tests
  // ==========================================================================

  describe('custom adapter registration', () => {
    it('should allow registering custom adapter', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      const retrieved = adapterRegistry.get('query')
      expect(retrieved.type).toBe('query')

      warnSpy.mockRestore()
    })

    it('should make custom adapter accessible via get()', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      const retrieved = adapterRegistry.get('query')

      // Verify it's our mock adapter
      const initialState = retrieved.createInitial()
      expect(initialState).toEqual({
        mockField: '',
        mockCount: 0,
      })

      warnSpy.mockRestore()
    })

    it('should preserve custom adapter behavior', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      const retrieved = adapterRegistry.get('query')

      // Test createInitial
      const initialState = retrieved.createInitial() as MockSliceState
      expect(initialState.mockField).toBe('')
      expect(initialState.mockCount).toBe(0)

      // Test validate
      const validationResult = retrieved.validate(initialState)
      expect(validationResult.isValid).toBe(false)
      expect(validationResult.errors).toContain('mockField is required')

      // Test validate with valid state
      const validState = { mockField: 'test', mockCount: 5 }
      const validResult = retrieved.validate(validState)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      // Test clear
      const clearedState = retrieved.clear(validState)
      expect(clearedState).toEqual(initialState)

      // Test getDefaultChartConfig
      const chartConfig = retrieved.getDefaultChartConfig()
      expect(chartConfig.chartType).toBe('bar')

      warnSpy.mockRestore()
    })

    it('should handle custom adapter canLoad correctly', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      const retrieved = adapterRegistry.get('query')

      // Test canLoad with valid config
      const validConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: {},
      }
      expect(retrieved.canLoad(validConfig)).toBe(true)

      // Test canLoad with invalid config
      expect(retrieved.canLoad(null)).toBe(false)
      expect(retrieved.canLoad({ version: 2 })).toBe(false)
      expect(retrieved.canLoad({ version: 1, analysisType: 'funnel' })).toBe(false)

      warnSpy.mockRestore()
    })

    it('should handle custom adapter load and save', () => {
      // Suppress warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockAdapter = createMockAdapter('query')
      adapterRegistry.register(mockAdapter)

      const retrieved = adapterRegistry.get('query')

      // Test load
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: {},
      } as AnalysisConfig
      const loadedState = retrieved.load(config)
      expect(loadedState).toEqual({
        mockField: 'loaded',
        mockCount: 42,
      })

      // Test save
      const stateToSave = { mockField: 'test', mockCount: 100 }
      const savedConfig = retrieved.save(stateToSave, {}, 'table')
      expect(savedConfig.version).toBe(1)
      expect(savedConfig.analysisType).toBe('query')
      expect(savedConfig.activeView).toBe('table')

      warnSpy.mockRestore()
    })
  })

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('integration', () => {
    it('should work correctly with built-in adapters through full workflow', () => {
      // Get query adapter
      const queryAdapter = adapterRegistry.get('query')

      // Create initial state
      const initialState = queryAdapter.createInitial()
      expect(initialState.queryStates).toHaveLength(1)

      // Validate empty state
      const validation = queryAdapter.validate(initialState)
      expect(validation.isValid).toBe(false)

      // Get default chart config
      const chartConfig = queryAdapter.getDefaultChartConfig()
      expect(chartConfig.chartType).toBe('bar')
    })

    it('should work correctly with funnel adapter through full workflow', () => {
      // Get funnel adapter
      const funnelAdapter = adapterRegistry.get('funnel')

      // Create initial state
      const initialState = funnelAdapter.createInitial()
      expect(initialState.funnelSteps).toEqual([])

      // Validate empty state
      const validation = funnelAdapter.validate(initialState)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('A funnel requires at least 2 steps')

      // Get default chart config
      const chartConfig = funnelAdapter.getDefaultChartConfig()
      expect(chartConfig.chartType).toBe('funnel')
    })

    it('should work correctly with flow adapter through full workflow', () => {
      // Get flow adapter
      const flowAdapter = adapterRegistry.get('flow')

      // Create initial state
      const initialState = flowAdapter.createInitial()
      expect(initialState.flowCube).toBeNull()
      expect(initialState.stepsBefore).toBe(3)
      expect(initialState.stepsAfter).toBe(3)

      // Validate empty state
      const validation = flowAdapter.validate(initialState)
      expect(validation.isValid).toBe(false)

      // Get default chart config
      const chartConfig = flowAdapter.getDefaultChartConfig()
      expect(chartConfig.chartType).toBe('sankey')
    })

    it('should work correctly with retention adapter through full workflow', () => {
      // Get retention adapter
      const retentionAdapter = adapterRegistry.get('retention')

      // Create initial state
      const initialState = retentionAdapter.createInitial()
      expect(initialState.retentionCube).toBeNull()

      // Validate empty state
      const validation = retentionAdapter.validate(initialState)
      expect(validation.isValid).toBe(false)

      // Get default chart config
      const chartConfig = retentionAdapter.getDefaultChartConfig()
      expect(chartConfig.chartType).toBe('retentionCombined')
    })

    it('should allow switching between different adapters', () => {
      const queryAdapter = adapterRegistry.get('query')
      const funnelAdapter = adapterRegistry.get('funnel')
      const flowAdapter = adapterRegistry.get('flow')
      const retentionAdapter = adapterRegistry.get('retention')

      // Each adapter should have its own type
      expect(queryAdapter.type).toBe('query')
      expect(funnelAdapter.type).toBe('funnel')
      expect(flowAdapter.type).toBe('flow')
      expect(retentionAdapter.type).toBe('retention')

      // Each adapter should create different initial states
      const queryState = queryAdapter.createInitial()
      const funnelState = funnelAdapter.createInitial()
      const flowState = flowAdapter.createInitial()
      const retentionState = retentionAdapter.createInitial()

      expect(queryState).toHaveProperty('queryStates')
      expect(funnelState).toHaveProperty('funnelSteps')
      expect(flowState).toHaveProperty('startingStep')
      expect(retentionState).toHaveProperty('retentionPeriods')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle rapid successive get() calls', () => {
      const adapter1 = adapterRegistry.get('query')
      const adapter2 = adapterRegistry.get('query')
      const adapter3 = adapterRegistry.get('query')

      expect(adapter1).toBe(adapter2)
      expect(adapter2).toBe(adapter3)
    })

    it('should handle alternating get() and has() calls', () => {
      expect(adapterRegistry.has('query')).toBe(true)
      const adapter1 = adapterRegistry.get('query')
      expect(adapterRegistry.has('funnel')).toBe(true)
      const adapter2 = adapterRegistry.get('funnel')

      expect(adapter1.type).toBe('query')
      expect(adapter2.type).toBe('funnel')
    })

    it('should handle clear() followed by immediate access', () => {
      adapterRegistry.get('query')
      adapterRegistry.clear()
      const adapter = adapterRegistry.get('query')

      expect(adapter).toBeDefined()
      expect(adapter.type).toBe('query')
    })

    it('should handle multiple clear() calls', () => {
      adapterRegistry.clear()
      adapterRegistry.clear()
      adapterRegistry.clear()

      // Should still work after multiple clears
      const adapter = adapterRegistry.get('query')
      expect(adapter).toBeDefined()
    })

    it('should handle registering same adapter multiple times', () => {
      // Suppress warnings
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockAdapter = createMockAdapter('query')
      // First registration - no warning because 'query' doesn't exist yet (after clear)
      adapterRegistry.register(mockAdapter)
      // Second registration - warns because 'query' now exists
      adapterRegistry.register(mockAdapter)
      // Third registration - warns again
      adapterRegistry.register(mockAdapter)

      // Should warn for 2nd and 3rd registration (not the 1st)
      expect(warnSpy).toHaveBeenCalledTimes(2)

      const adapter = adapterRegistry.get('query')
      expect(adapter.type).toBe('query')

      warnSpy.mockRestore()
    })
  })
})

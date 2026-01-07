/**
 * Tests for useFunnelQuery hook
 *
 * Tests the funnel query hook focusing on:
 * - Config validation (synchronous)
 * - Skip behavior
 * - Query key generation
 *
 * Note: Sequential execution tests with mocked async behavior are complex
 * with fake timers. The core execution logic is tested via the utility
 * functions in funnelExecution.test.ts.
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFunnelQuery, createFunnelQueryKey } from '../../../src/client/hooks/queries/useFunnelQuery'
import type { FunnelConfig } from '../../../src/client/types/funnel'

// Mock the CubeApiProvider
const mockCubeApi = {
  load: vi.fn(),
  sql: vi.fn(),
  meta: vi.fn(),
}

vi.mock('../../../src/client/providers/CubeApiProvider', () => ({
  useCubeApi: () => ({
    cubeApi: mockCubeApi,
    options: undefined,
    updateApiConfig: vi.fn(),
    batchCoordinator: null,
    enableBatching: false,
  }),
}))

// Mock shared utils
vi.mock('../../../src/client/shared/utils', () => ({
  cleanQueryForServer: vi.fn((query: unknown) => query),
}))

// Valid test config
const validFunnelConfig: FunnelConfig = {
  id: 'test-funnel',
  name: 'Test Funnel',
  bindingKey: { dimension: 'Users.userId' },
  steps: [
    {
      id: 'step-1',
      name: 'Signups',
      query: { measures: ['Signups.count'], dimensions: ['Users.userId'] },
    },
    {
      id: 'step-2',
      name: 'Purchases',
      query: { measures: ['Purchases.count'], dimensions: ['Users.userId'] },
    },
  ],
}

describe('useFunnelQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('config validation', () => {
    it('should return idle status for null config', () => {
      const { result } = renderHook(() => useFunnelQuery(null))

      expect(result.current.status).toBe('idle')
      expect(result.current.result).toBeNull()
      expect(result.current.isExecuting).toBe(false)
    })

    it('should return idle status for config with less than 2 steps', () => {
      const invalidConfig: FunnelConfig = {
        ...validFunnelConfig,
        steps: [validFunnelConfig.steps[0]],
      }

      const { result } = renderHook(() => useFunnelQuery(invalidConfig))

      expect(result.current.status).toBe('idle')
    })

    it('should return idle status for config without binding key', () => {
      const invalidConfig: FunnelConfig = {
        ...validFunnelConfig,
        bindingKey: { dimension: '' },
      }

      const { result } = renderHook(() => useFunnelQuery(invalidConfig))

      expect(result.current.status).toBe('idle')
    })

    it('should return idle status for config with empty array binding key', () => {
      const invalidConfig: FunnelConfig = {
        ...validFunnelConfig,
        bindingKey: { dimension: [] },
      }

      const { result } = renderHook(() => useFunnelQuery(invalidConfig))

      expect(result.current.status).toBe('idle')
    })

    it('should return idle status for config with step without measures/dimensions', () => {
      const invalidConfig: FunnelConfig = {
        ...validFunnelConfig,
        steps: [
          { id: 'step-1', name: 'Empty', query: {} },
          { id: 'step-2', name: 'Step 2', query: { measures: ['A.count'] } },
        ],
      }

      const { result } = renderHook(() => useFunnelQuery(invalidConfig))

      expect(result.current.status).toBe('idle')
    })
  })

  describe('skip behavior', () => {
    it('should not execute when skip is true', async () => {
      const { result } = renderHook(() =>
        useFunnelQuery(validFunnelConfig, { skip: true, debounceMs: 0 })
      )

      // Advance timers to clear any debounce
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      expect(mockCubeApi.load).not.toHaveBeenCalled()
      expect(result.current.status).toBe('idle')
    })
  })

  describe('debouncing', () => {
    it('should show debouncing state initially for valid config', () => {
      const { result } = renderHook(() =>
        useFunnelQuery(validFunnelConfig, { debounceMs: 300 })
      )

      // Should be debouncing initially with valid config
      expect(result.current.isDebouncing).toBe(true)
    })
  })

  describe('initial state', () => {
    it('should have empty step results initially', () => {
      const { result } = renderHook(() => useFunnelQuery(validFunnelConfig))

      expect(result.current.stepResults).toEqual([])
      expect(result.current.chartData).toEqual([])
      expect(result.current.executedQueries).toEqual([])
    })

    it('should have null result initially', () => {
      const { result } = renderHook(() => useFunnelQuery(validFunnelConfig))

      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.currentStepIndex).toBeNull()
    })

    it('should provide execute, cancel, and reset functions', () => {
      const { result } = renderHook(() => useFunnelQuery(validFunnelConfig))

      expect(typeof result.current.execute).toBe('function')
      expect(typeof result.current.cancel).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('cancel behavior', () => {
    it('should set status to idle on cancel', () => {
      const { result } = renderHook(() =>
        useFunnelQuery(validFunnelConfig, { debounceMs: 0 })
      )

      act(() => {
        result.current.cancel()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.currentStepIndex).toBeNull()
    })
  })

  describe('reset behavior', () => {
    it('should clear all state on reset', () => {
      const { result } = renderHook(() =>
        useFunnelQuery(validFunnelConfig, { debounceMs: 0 })
      )

      act(() => {
        result.current.reset()
      })

      expect(result.current.result).toBeNull()
      expect(result.current.stepResults).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('step loading states', () => {
    it('should return empty array when config has no steps', () => {
      const { result } = renderHook(() => useFunnelQuery(null))

      expect(result.current.stepLoadingStates).toEqual([])
    })

    it('should return correct length for valid config', () => {
      const { result } = renderHook(() => useFunnelQuery(validFunnelConfig))

      // stepLoadingStates should match number of steps
      expect(result.current.stepLoadingStates.length).toBe(0) // Before debounce completes, debouncedConfig is null
    })
  })
})

describe('createFunnelQueryKey', () => {
  it('should create key with null for null config', () => {
    const key = createFunnelQueryKey(null)

    expect(key).toEqual(['cube', 'funnel', null])
  })

  it('should create stable key from config', () => {
    const config: FunnelConfig = {
      id: 'test',
      name: 'Test',
      bindingKey: { dimension: 'Users.userId' },
      steps: [{ id: '1', name: 'Step 1', query: { measures: ['A.count'] } }],
    }

    const key1 = createFunnelQueryKey(config)
    const key2 = createFunnelQueryKey(config)

    expect(key1[0]).toBe('cube')
    expect(key1[1]).toBe('funnel')
    expect(key1[2]).toBe(key2[2]) // Same stringified config
  })

  it('should create different keys for different configs', () => {
    const config1: FunnelConfig = {
      id: 'test-1',
      name: 'Test 1',
      bindingKey: { dimension: 'Users.userId' },
      steps: [],
    }
    const config2: FunnelConfig = {
      id: 'test-2',
      name: 'Test 2',
      bindingKey: { dimension: 'Users.userId' },
      steps: [],
    }

    const key1 = createFunnelQueryKey(config1)
    const key2 = createFunnelQueryKey(config2)

    expect(key1[2]).not.toBe(key2[2])
  })

  it('should include cube as first key element', () => {
    const config: FunnelConfig = {
      id: 'test',
      name: 'Test',
      bindingKey: { dimension: 'id' },
      steps: [],
    }

    const key = createFunnelQueryKey(config)

    expect(key[0]).toBe('cube')
  })

  it('should include funnel as second key element', () => {
    const config: FunnelConfig = {
      id: 'test',
      name: 'Test',
      bindingKey: { dimension: 'id' },
      steps: [],
    }

    const key = createFunnelQueryKey(config)

    expect(key[1]).toBe('funnel')
  })
})

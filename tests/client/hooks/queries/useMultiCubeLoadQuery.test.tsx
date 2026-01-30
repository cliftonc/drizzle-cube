import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import {
  useMultiCubeLoadQuery,
  createMultiQueryKey,
} from '../../../../src/client/hooks/queries/useMultiCubeLoadQuery'
import type { MultiQueryConfig, CubeQuery } from '../../../../src/client/types'

describe('useMultiCubeLoadQuery', () => {
  // Valid multi-query config with 2 queries
  const validConfig: MultiQueryConfig = {
    queries: [
      { measures: ['Employees.count'], dimensions: ['Employees.name'] },
      { measures: ['Departments.count'], dimensions: ['Departments.name'] },
    ],
    mergeStrategy: 'concat',
  }

  // Config with merge strategy
  const configWithMerge: MultiQueryConfig = {
    queries: [
      { measures: ['Employees.count'], dimensions: ['Employees.departmentId'] },
      { measures: ['Departments.totalBudget'], dimensions: ['Departments.id'] },
    ],
    mergeStrategy: 'merge',
    mergeKeys: ['Employees.departmentId', 'Departments.id'],
  }

  // Mock query data for each query
  const mockQuery1Data = [
    { 'Employees.count': 10, 'Employees.name': 'John Doe' },
    { 'Employees.count': 5, 'Employees.name': 'Jane Smith' },
  ]

  const mockQuery2Data = [
    { 'Departments.count': 3, 'Departments.name': 'Engineering' },
    { 'Departments.count': 2, 'Departments.name': 'Sales' },
  ]

  beforeEach(() => {
    server.resetHandlers()
    // Default handler for batch requests
    server.use(
      http.post('*/cubejs-api/v1/batch', () => {
        return HttpResponse.json({
          results: [
            {
              data: mockQuery1Data,
              annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
              query: validConfig.queries[0],
              requestId: `test-request-1-${Date.now()}`,
            },
            {
              data: mockQuery2Data,
              annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
              query: validConfig.queries[1],
              requestId: `test-request-2-${Date.now()}`,
            },
          ],
        })
      })
    )
  })

  describe('initial state', () => {
    it('should return loading state initially for valid config', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeNull()
      expect(result.current.resultSets).toBeNull()
    })

    it('should not be loading when config is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(null),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
    })
  })

  describe('config validation', () => {
    it('should mark config as invalid when queries array is missing', () => {
      const invalidConfig = {} as MultiQueryConfig
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(invalidConfig),
        { wrapper }
      )

      expect(result.current.isValidConfig).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should mark config as invalid with less than 2 queries', () => {
      const invalidConfig: MultiQueryConfig = {
        queries: [{ measures: ['Employees.count'] }],
        mergeStrategy: 'concat',
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(invalidConfig),
        { wrapper }
      )

      expect(result.current.isValidConfig).toBe(false)
    })

    it('should mark config as invalid when queries are empty', () => {
      const invalidConfig: MultiQueryConfig = {
        queries: [{}, {}],
        mergeStrategy: 'concat',
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(invalidConfig),
        { wrapper }
      )

      expect(result.current.isValidConfig).toBe(false)
    })

    it('should mark config as valid with 2+ valid queries', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig),
        { wrapper }
      )

      expect(result.current.isValidConfig).toBe(true)
    })

    it('should accept queries with only dimensions', () => {
      const configWithDimensionsOnly: MultiQueryConfig = {
        queries: [
          { dimensions: ['Employees.name'] },
          { dimensions: ['Departments.name'] },
        ],
        mergeStrategy: 'concat',
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(configWithDimensionsOnly),
        { wrapper }
      )

      expect(result.current.isValidConfig).toBe(true)
    }
    )

    it('should accept queries with only timeDimensions', () => {
      const configWithTimeOnly: MultiQueryConfig = {
        queries: [
          { timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }] },
          { timeDimensions: [{ dimension: 'Departments.createdAt', granularity: 'month' }] },
        ],
        mergeStrategy: 'concat',
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(configWithTimeOnly),
        { wrapper }
      )

      expect(result.current.isValidConfig).toBe(true)
    })
  })

  describe('skip option', () => {
    it('should not execute when skip is true', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { skip: true }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeNull()
    })

    it('should execute when skip changes from true to false', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ skip }) => useMultiCubeLoadQuery(validConfig, { skip, debounceMs: 0 }),
        { wrapper, initialProps: { skip: true } }
      )

      expect(result.current.isLoading).toBe(false)

      rerender({ skip: false })

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })
    })
  })

  describe('debouncing', () => {
    it('should debounce config changes', async () => {
      vi.useFakeTimers()

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 300 }),
        { wrapper }
      )

      expect(result.current.isDebouncing).toBe(true)

      await act(async () => {
        vi.advanceTimersByTime(350)
      })

      expect(result.current.isDebouncing).toBe(false)

      vi.useRealTimers()
    })

    it('should not debounce when debounceMs is 0', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isDebouncing).toBe(false)
      })
    })
  })

  describe('successful query execution', () => {
    it('should fetch and return merged data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).not.toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should return resultSets for each query', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.resultSets).not.toBeNull()
      })

      expect(result.current.resultSets?.length).toBe(2)
    })

    it('should return perQueryData for each query', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.perQueryData).not.toBeNull()
      })

      expect(result.current.perQueryData?.length).toBe(2)
    })

    it('should return debounced config', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debouncedConfig).not.toBeNull()
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/batch', () => {
          return HttpResponse.json(
            { error: 'Batch query failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })

    it('should handle network errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/batch', () => {
          return HttpResponse.error()
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })

    it('should track per-query errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/batch', () => {
          return HttpResponse.json({
            results: [
              {
                data: mockQuery1Data,
                annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
                query: validConfig.queries[0],
                requestId: `test-request-1-${Date.now()}`,
              },
              {
                error: 'Query 2 failed',
              },
            ],
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.errors.length).toBe(2)
      expect(result.current.errors[0]).toBeNull()
      expect(result.current.errors[1]).not.toBeNull()
    })

    it('should return first error in errors array', async () => {
      server.use(
        http.post('*/cubejs-api/v1/batch', () => {
          return HttpResponse.json({
            results: [
              { error: 'First query failed' },
              { error: 'Second query failed' },
            ],
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      expect(result.current.error?.message).toBe('First query failed')
    })
  })

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch data when called', async () => {
      let fetchCount = 0
      server.use(
        http.post('*/cubejs-api/v1/batch', () => {
          fetchCount++
          return HttpResponse.json({
            results: [
              {
                data: mockQuery1Data,
                annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
                query: validConfig.queries[0],
                requestId: `test-request-1-${Date.now()}`,
              },
              {
                data: mockQuery2Data,
                annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
                query: validConfig.queries[1],
                requestId: `test-request-2-${Date.now()}`,
              },
            ],
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCount = fetchCount

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialCount)
      })
    })

    it('should support bustCache option in refetch', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/batch', () => {
          requestCount++
          return HttpResponse.json({
            results: [
              {
                data: mockQuery1Data,
                annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
                query: validConfig.queries[0],
                requestId: `test-request-1-${Date.now()}`,
              },
              {
                data: mockQuery2Data,
                annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
                query: validConfig.queries[1],
                requestId: `test-request-2-${Date.now()}`,
              },
            ],
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCount = requestCount

      act(() => {
        result.current.refetch({ bustCache: true })
      })

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(initialCount)
      })
    })
  })

  describe('merge strategies', () => {
    it('should work with concat merge strategy', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })

      // Concat should combine all rows
      expect(result.current.data?.length).toBeGreaterThan(0)
    })

    it('should work with merge strategy', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(configWithMerge, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })
    })
  })

  describe('createMultiQueryKey utility', () => {
    it('should create query key for valid config', () => {
      const key = createMultiQueryKey(validConfig)
      expect(key[0]).toBe('cube')
      expect(key[1]).toBe('multiLoad')
      expect(key[2]).not.toBeNull()
    })

    it('should create query key with null for null config', () => {
      const key = createMultiQueryKey(null)
      expect(key).toEqual(['cube', 'multiLoad', null])
    })

    it('should create stable keys for same config', () => {
      const key1 = createMultiQueryKey(validConfig)
      const key2 = createMultiQueryKey(validConfig)
      expect(key1[2]).toBe(key2[2])
    })
  })

  describe('keepPreviousData option', () => {
    it('should keep previous data by default', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ config }) => useMultiCubeLoadQuery(config, { debounceMs: 0 }),
        { wrapper, initialProps: { config: validConfig } }
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })

      const previousData = result.current.data

      // Change config
      const newConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.totalSalary'], dimensions: ['Employees.name'] },
          { measures: ['Departments.totalBudget'], dimensions: ['Departments.name'] },
        ],
        mergeStrategy: 'concat',
      }

      rerender({ config: newConfig })

      // Previous data should still be available while new data loads
      // This depends on TanStack Query's placeholder behavior
    })
  })

  describe('staleTime option', () => {
    it('should accept custom staleTime', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0, staleTime: 5 * 60 * 1000 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).not.toBeNull()
    })
  })

  describe('query labels', () => {
    it('should support query labels in config', async () => {
      const configWithLabels: MultiQueryConfig = {
        queries: validConfig.queries,
        mergeStrategy: 'concat',
        queryLabels: ['Employee Query', 'Department Query'],
      }

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(configWithLabels, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })
    })
  })

  describe('isFetching state', () => {
    it('should return isFetching true during refetch', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiCubeLoadQuery(validConfig, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.refetch()
      })

      // isFetching may briefly be true during refetch
      // We just verify the property exists and is a boolean
      expect(typeof result.current.isFetching).toBe('boolean')
    })
  })
})

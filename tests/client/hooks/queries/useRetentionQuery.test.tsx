import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import { useRetentionQuery } from '../../../../src/client/hooks/queries/useRetentionQuery'
import type { ServerRetentionQuery } from '../../../../src/client/types/retention'

describe('useRetentionQuery', () => {
  // Valid retention query with all required fields
  const validRetentionQuery: ServerRetentionQuery = {
    retention: {
      timeDimension: 'Events.timestamp',
      bindingKey: 'Events.userId',
      dateRange: { start: '2024-01-01', end: '2024-03-31' },
      granularity: 'week',
      periods: 12,
      retentionType: 'classic',
    },
  }

  // Retention query with breakdown
  const retentionQueryWithBreakdown: ServerRetentionQuery = {
    retention: {
      ...validRetentionQuery.retention,
      breakdownDimensions: ['Events.country'],
    },
  }

  // Mock retention data
  const mockRetentionData = [
    { period: 0, cohortSize: 100, retainedUsers: 100, retentionRate: 1.0 },
    { period: 1, cohortSize: 100, retainedUsers: 80, retentionRate: 0.8 },
    { period: 2, cohortSize: 100, retainedUsers: 60, retentionRate: 0.6 },
    { period: 3, cohortSize: 100, retainedUsers: 45, retentionRate: 0.45 },
  ]

  // Mock retention data with breakdown
  const mockRetentionDataWithBreakdown = [
    { period: 0, cohortSize: 50, retainedUsers: 50, retentionRate: 1.0, breakdownValues: { 'Events.country': 'US' } },
    { period: 1, cohortSize: 50, retainedUsers: 40, retentionRate: 0.8, breakdownValues: { 'Events.country': 'US' } },
    { period: 0, cohortSize: 50, retainedUsers: 50, retentionRate: 1.0, breakdownValues: { 'Events.country': 'UK' } },
    { period: 1, cohortSize: 50, retainedUsers: 35, retentionRate: 0.7, breakdownValues: { 'Events.country': 'UK' } },
  ]

  beforeEach(() => {
    server.resetHandlers()
    // Default handler returns mock retention data for both GET and POST
    server.use(
      http.get('*/cubejs-api/v1/load', () => {
        return HttpResponse.json({
          data: mockRetentionData,
          annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
          query: validRetentionQuery,
          requestId: `test-request-${Date.now()}`,
        })
      }),
      http.post('*/cubejs-api/v1/load', () => {
        return HttpResponse.json({
          data: mockRetentionData,
          annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
          query: validRetentionQuery,
          requestId: `test-request-${Date.now()}`,
        })
      })
    )
  })

  describe('initial state', () => {
    it('should return null data initially before query completes', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // Initially data should be null
      expect(result.current.chartData).toBeNull()
      expect(result.current.rawData).toBeNull()
    })

    it('should return idle status when query is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(null),
        { wrapper }
      )

      expect(result.current.status).toBe('idle')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.chartData).toBeNull()
    })
  })

  describe('query validation', () => {
    it('should not execute when query is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(null),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })

    it('should not execute when retention config is missing', () => {
      const invalidQuery = {} as ServerRetentionQuery
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when timeDimension is missing', () => {
      const invalidQuery: ServerRetentionQuery = {
        retention: {
          ...validRetentionQuery.retention,
          timeDimension: undefined as unknown as string,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when bindingKey is missing', () => {
      const invalidQuery: ServerRetentionQuery = {
        retention: {
          ...validRetentionQuery.retention,
          bindingKey: undefined as unknown as string,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when periods is 0', () => {
      const invalidQuery: ServerRetentionQuery = {
        retention: {
          ...validRetentionQuery.retention,
          periods: 0,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('skip option', () => {
    it('should not execute when skip is true', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { skip: true }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.chartData).toBeNull()
    })

    it('should execute when skip changes from true to false', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ skip }) => useRetentionQuery(validRetentionQuery, { skip, debounceMs: 0 }),
        { wrapper, initialProps: { skip: true } }
      )

      expect(result.current.isLoading).toBe(false)

      rerender({ skip: false })

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })
    })
  })

  describe('debouncing', () => {
    it('should debounce query changes', async () => {
      vi.useFakeTimers()

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 300 }),
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
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isDebouncing).toBe(false)
      })
    })
  })

  describe('successful query execution', () => {
    it('should fetch and return chart data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(result.current.chartData).not.toBeNull()
      expect(result.current.chartData?.rows).toBeDefined()
      expect(result.current.chartData?.periods).toBeDefined()
    })

    it('should return raw data from server response', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.rawData).not.toBeNull()
      })

      // Raw data should be array of retention rows
      expect(Array.isArray(result.current.rawData)).toBe(true)
    })

    it('should transform data with periods array', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      // Periods should be extracted from result data
      expect(Array.isArray(result.current.chartData?.periods)).toBe(true)
    })

    it('should calculate summary statistics', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData?.summary).toBeDefined()
      })

      // Summary should be defined with expected properties
      expect(result.current.chartData?.summary).toBeDefined()
      expect(typeof result.current.chartData?.summary?.totalUsers).toBe('number')
    })

    it('should include granularity in chart data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      expect(result.current.chartData?.granularity).toBe('week')
    })
  })

  describe('breakdown handling', () => {
    it('should extract breakdown values from results', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: mockRetentionDataWithBreakdown,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: retentionQueryWithBreakdown,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: mockRetentionDataWithBreakdown,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: retentionQueryWithBreakdown,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(retentionQueryWithBreakdown, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      // Breakdown values should be extracted when present
      expect(result.current.chartData?.breakdownValues).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Retention query failed' },
            { status: 500 }
          )
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Retention query failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      }, { timeout: 3000 })

      expect(result.current.status).toBe('error')
    })

    it('should handle network errors', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.error()
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.error()
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      }, { timeout: 3000 })
    })

    it('should call onError callback on failure', async () => {
      const onError = vi.fn()

      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Query failed' },
            { status: 500 }
          )
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Query failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0, onError }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('callbacks', () => {
    it('should call onComplete callback on success', async () => {
      const onComplete = vi.fn()

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0, onComplete }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
        rows: expect.any(Array),
        periods: expect.any(Array),
      }))
    })
  })

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch data when called', async () => {
      let fetchCount = 0
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          fetchCount++
          return HttpResponse.json({
            data: mockRetentionData,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validRetentionQuery,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          fetchCount++
          return HttpResponse.json({
            data: mockRetentionData,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validRetentionQuery,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      const initialCount = fetchCount

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialCount)
      })
    })
  })

  describe('execute function (manual refresh mode)', () => {
    it('should provide execute function', async () => {
      const { wrapper } = createHookWrapper({ features: { manualRefresh: true } })
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      expect(typeof result.current.execute).toBe('function')
    })

    it('should execute query when called', async () => {
      const { wrapper } = createHookWrapper({ features: { manualRefresh: true } })
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // Wait for initial auto-execution
      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Call execute
      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.chartData).not.toBeNull()
    })
  })

  describe('binding key label extraction', () => {
    it('should extract binding key label from string format', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      expect(result.current.chartData?.bindingKeyLabel).toBe('userId')
    })

    it('should extract binding key label from array format', async () => {
      const queryWithArrayBindingKey: ServerRetentionQuery = {
        retention: {
          ...validRetentionQuery.retention,
          bindingKey: [{ cube: 'Events', dimension: 'Events.customerId' }],
        },
      }

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(queryWithArrayBindingKey, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      expect(result.current.chartData?.bindingKeyLabel).toBe('customerId')
    })

    it('should use getFieldLabel when provided', async () => {
      const getFieldLabel = vi.fn().mockReturnValue('User ID')

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0, getFieldLabel }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      expect(getFieldLabel).toHaveBeenCalledWith('Events.userId')
      expect(result.current.chartData?.bindingKeyLabel).toBe('User ID')
    })
  })

  describe('empty data handling', () => {
    it('should handle empty data array', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validRetentionQuery,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validRetentionQuery,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Empty data should result in empty rows and periods
      expect(result.current.chartData?.rows).toEqual([])
      expect(result.current.chartData?.periods).toEqual([])
    })
  })

  describe('cache info', () => {
    it('should return cache info when available', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: mockRetentionData,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validRetentionQuery,
            requestId: `test-request-${Date.now()}`,
            cacheInfo: { hit: true, cachedAt: '2024-01-01T00:00:00Z', ttlMs: 60000, ttlRemainingMs: 30000 },
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: mockRetentionData,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validRetentionQuery,
            requestId: `test-request-${Date.now()}`,
            cacheInfo: { hit: true, cachedAt: '2024-01-01T00:00:00Z', ttlMs: 60000, ttlRemainingMs: 30000 },
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Cache info depends on server response - may or may not be present
      // Just verify the property exists
      expect('cacheInfo' in result.current).toBe(true)
    })
  })

  describe('needsRefresh in manual mode', () => {
    it('should return needsRefresh false initially', async () => {
      const { wrapper } = createHookWrapper({ features: { manualRefresh: true } })
      const { result } = renderHook(
        () => useRetentionQuery(validRetentionQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // Initial value should be false
      expect(result.current.needsRefresh).toBe(false)
    })

    it('should return needsRefresh true when query changes after execution', async () => {
      const { wrapper } = createHookWrapper({ features: { manualRefresh: true } })
      const { result, rerender } = renderHook(
        ({ query }) => useRetentionQuery(query, { debounceMs: 0 }),
        { wrapper, initialProps: { query: validRetentionQuery } }
      )

      // Wait for initial execution
      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Change query
      const newQuery: ServerRetentionQuery = {
        retention: {
          ...validRetentionQuery.retention,
          periods: 24,
        },
      }
      rerender({ query: newQuery })

      await waitFor(() => {
        expect(result.current.needsRefresh).toBe(true)
      })
    })
  })
})

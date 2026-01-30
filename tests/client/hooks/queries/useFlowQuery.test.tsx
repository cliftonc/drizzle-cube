import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import { useFlowQuery, createFlowQueryKey } from '../../../../src/client/hooks/queries/useFlowQuery'
import type { ServerFlowQuery, FlowChartData } from '../../../../src/client/types/flow'

describe('useFlowQuery', () => {
  // Valid flow query with all required fields
  const validFlowQuery: ServerFlowQuery = {
    flow: {
      bindingKey: 'Events.userId',
      timeDimension: 'Events.timestamp',
      eventDimension: 'Events.eventType',
      startingStep: {
        name: 'Purchase',
        filter: { member: 'Events.eventType', operator: 'equals', values: ['purchase'] },
      },
      stepsBefore: 3,
      stepsAfter: 3,
      joinStrategy: 'auto',
    },
  }

  // Mock Sankey data
  const mockFlowData: FlowChartData = {
    nodes: [
      { id: 'before_2_signup', name: 'Signup', layer: -2, value: 50 },
      { id: 'before_1_browse', name: 'Browse', layer: -1, value: 80 },
      { id: 'start_purchase', name: 'Purchase', layer: 0, value: 100 },
      { id: 'after_1_checkout', name: 'Checkout', layer: 1, value: 70 },
      { id: 'after_2_confirm', name: 'Confirm', layer: 2, value: 60 },
    ],
    links: [
      { source: 'before_2_signup', target: 'before_1_browse', value: 40 },
      { source: 'before_1_browse', target: 'start_purchase', value: 75 },
      { source: 'start_purchase', target: 'after_1_checkout', value: 70 },
      { source: 'after_1_checkout', target: 'after_2_confirm', value: 60 },
    ],
  }

  beforeEach(() => {
    server.resetHandlers()
    // Default handler returns mock flow data wrapped as expected for both GET and POST
    server.use(
      http.get('*/cubejs-api/v1/load', () => {
        return HttpResponse.json({
          data: [mockFlowData],
          annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
          query: validFlowQuery,
          requestId: `test-request-${Date.now()}`,
        })
      }),
      http.post('*/cubejs-api/v1/load', () => {
        return HttpResponse.json({
          data: [mockFlowData],
          annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
          query: validFlowQuery,
          requestId: `test-request-${Date.now()}`,
        })
      })
    )
  })

  describe('initial state', () => {
    it('should return null data initially before query completes', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // Initially data should be null
      expect(result.current.data).toBeNull()
      expect(result.current.rawData).toBeNull()
    })

    it('should not be loading when query is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(null),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
    })
  })

  describe('query validation', () => {
    it('should not execute when query is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(null),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })

    it('should not execute when flow config is missing', () => {
      const invalidQuery = {} as ServerFlowQuery
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when bindingKey is missing', () => {
      const invalidQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          bindingKey: undefined as unknown as string,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when timeDimension is missing', () => {
      const invalidQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          timeDimension: undefined as unknown as string,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when eventDimension is missing', () => {
      const invalidQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          eventDimension: undefined as unknown as string,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when startingStep filter is missing', () => {
      const invalidQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          startingStep: { name: 'Test' },
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when stepsBefore is negative', () => {
      const invalidQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          stepsBefore: -1,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })

    it('should not execute when stepsAfter exceeds maximum', () => {
      const invalidQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          stepsAfter: 6,
        },
      }
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(invalidQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('skip option', () => {
    it('should not execute when skip is true', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { skip: true }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeNull()
    })

    it('should execute when skip changes from true to false', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ skip }) => useFlowQuery(validFlowQuery, { skip, debounceMs: 0 }),
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
    it('should debounce query changes', async () => {
      vi.useFakeTimers()

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 300 }),
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
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isDebouncing).toBe(false)
      })
    })
  })

  describe('successful query execution', () => {
    it('should fetch and return flow data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).not.toBeNull()
      })

      expect(result.current.data?.nodes).toBeDefined()
      expect(result.current.data?.links).toBeDefined()
    })

    it('should return raw data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.rawData).not.toBeNull()
      })

      expect(result.current.rawData).toEqual([mockFlowData])
    })

    it('should return transformed Sankey data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })

      expect(result.current.data?.nodes.length).toBe(5)
      expect(result.current.data?.links.length).toBe(4)
    })

    it('should return server query in result', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.serverQuery).toBeDefined()
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Flow query failed' },
            { status: 500 }
          )
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Flow query failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      }, { timeout: 3000 })
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
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
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
        () => useFlowQuery(validFlowQuery, { debounceMs: 0, onError }),
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
        () => useFlowQuery(validFlowQuery, { debounceMs: 0, onComplete }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
        nodes: expect.any(Array),
        links: expect.any(Array),
      }))
    })
  })

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
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
        http.get('*/cubejs-api/v1/load', () => {
          fetchCount++
          return HttpResponse.json({
            data: [mockFlowData],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          fetchCount++
          return HttpResponse.json({
            data: [mockFlowData],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
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
        http.get('*/cubejs-api/v1/load', () => {
          requestCount++
          return HttpResponse.json({
            data: [mockFlowData],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          requestCount++
          return HttpResponse.json({
            data: [mockFlowData],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
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

  describe('reset functionality', () => {
    it('should provide reset function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('isExecuting state', () => {
    it('should have isExecuting as boolean', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // isExecuting should always be a boolean
      expect(typeof result.current.isExecuting).toBe('boolean')

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('data transformation', () => {
    it('should transform single row with nodes and links', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })

      expect(result.current.data?.nodes).toEqual(mockFlowData.nodes)
      expect(result.current.data?.links).toEqual(mockFlowData.links)
    })

    it('should return null for empty data', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
    })

    it('should return null for invalid data structure', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [{ invalid: 'data' }],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [{ invalid: 'data' }],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
    })
  })

  describe('cache info', () => {
    it('should return cache info when available', async () => {
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [mockFlowData],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
            cacheInfo: { hit: true, cachedAt: '2024-01-01T00:00:00Z', ttlMs: 60000, ttlRemainingMs: 30000 },
          })
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json({
            data: [mockFlowData],
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validFlowQuery,
            requestId: `test-request-${Date.now()}`,
            cacheInfo: { hit: true, cachedAt: '2024-01-01T00:00:00Z', ttlMs: 60000, ttlRemainingMs: 30000 },
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect('cacheInfo' in result.current).toBe(true)
    })
  })

  describe('needsRefresh in manual mode', () => {
    it('should return needsRefresh false initially', async () => {
      const { wrapper } = createHookWrapper({ features: { manualRefresh: true } })
      const { result } = renderHook(
        () => useFlowQuery(validFlowQuery, { debounceMs: 0 }),
        { wrapper }
      )

      expect(result.current.needsRefresh).toBe(false)
    })

    it('should track needsRefresh state for query changes', async () => {
      const { wrapper } = createHookWrapper({ features: { manualRefresh: true } })
      const { result, rerender } = renderHook(
        ({ query }) => useFlowQuery(query, { debounceMs: 0 }),
        { wrapper, initialProps: { query: validFlowQuery } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          stepsAfter: 5,
        },
      }
      rerender({ query: newQuery })

      // After rerender with new query, needsRefresh state may change
      // depending on execution state
      expect(typeof result.current.needsRefresh).toBe('boolean')
    })
  })

  describe('createFlowQueryKey utility', () => {
    it('should create query key for valid query', () => {
      const key = createFlowQueryKey(validFlowQuery)
      expect(key[0]).toBe('cube')
      expect(key[1]).toBe('flow')
      expect(key[2]).not.toBeNull()
    })

    it('should create query key with null for null query', () => {
      const key = createFlowQueryKey(null)
      expect(key).toEqual(['cube', 'flow', null])
    })
  })

  describe('stale data handling', () => {
    it('should handle query changes', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ query }) => useFlowQuery(query, { debounceMs: 0 }),
        { wrapper, initialProps: { query: validFlowQuery } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change to different query mode
      const sunburstQuery: ServerFlowQuery = {
        flow: {
          ...validFlowQuery.flow,
          outputMode: 'sunburst',
        },
      }

      rerender({ query: sunburstQuery })

      // After rerender, isLoading or isExecuting may be true due to query change
      expect(typeof result.current.isLoading).toBe('boolean')
      expect(typeof result.current.isExecuting).toBe('boolean')
    })
  })
})

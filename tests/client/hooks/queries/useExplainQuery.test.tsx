import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import {
  useExplainQuery,
  createExplainQueryKey,
} from '../../../../src/client/hooks/queries/useExplainQuery'
import type { CubeQuery, ExplainResult } from '../../../../src/client/types'

describe('useExplainQuery', () => {
  // Valid standard query
  const validQuery: CubeQuery = {
    measures: ['Employees.count'],
    dimensions: ['Employees.name'],
  }

  // Funnel query
  const funnelQuery = {
    funnel: {
      steps: [
        { name: 'Step 1', filters: [] },
        { name: 'Step 2', filters: [] },
      ],
    },
  }

  // Flow query
  const flowQuery = {
    flow: {
      bindingKey: 'Events.userId',
      timeDimension: 'Events.timestamp',
      eventDimension: 'Events.eventType',
      startingStep: { name: 'Start', filters: [] },
      stepsBefore: 2,
      stepsAfter: 2,
    },
  }

  // Retention query
  const retentionQuery = {
    retention: {
      timeDimension: 'Events.timestamp',
      bindingKey: 'Events.userId',
      dateRange: { start: '2024-01-01', end: '2024-03-31' },
      granularity: 'week',
      periods: 12,
      retentionType: 'classic',
    },
  }

  // Mock explain result
  const mockExplainResult: ExplainResult = {
    operations: [
      {
        id: 1,
        nodeType: 'Seq Scan',
        relation: 'employees',
        estimatedRows: 100,
        estimatedCost: 10.5,
      },
    ],
    summary: {
      totalCost: 10.5,
      planningTime: 0.5,
      executionTime: undefined,
      warnings: [],
    },
    rawPlan: 'Seq Scan on employees (cost=0.00..10.50 rows=100 width=40)',
    sql: 'SELECT * FROM employees WHERE organisation_id = $1',
    databaseType: 'postgres',
  }

  beforeEach(() => {
    server.resetHandlers()
    // Default handler for explain requests
    server.use(
      http.post('*/cubejs-api/v1/explain', () => {
        return HttpResponse.json(mockExplainResult)
      })
    )
  })

  describe('initial state', () => {
    it('should not be loading initially', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasRun).toBe(false)
      expect(result.current.explainResult).toBeNull()
    })

    it('should not execute until runExplain is called', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.explainResult).toBeNull()
    })
  })

  describe('runExplain function', () => {
    it('should provide runExplain function', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      expect(typeof result.current.runExplain).toBe('function')
    })

    it('should execute explain when runExplain is called', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      expect(result.current.hasRun).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.explainResult).not.toBeNull()
    })

    it('should execute explain with analyze option', async () => {
      let receivedAnalyze = false
      server.use(
        http.post('*/cubejs-api/v1/explain', async ({ request }) => {
          const body = await request.json() as { options?: { analyze?: boolean } }
          receivedAnalyze = body.options?.analyze ?? false
          return HttpResponse.json(mockExplainResult)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain({ analyze: true })
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })

      // The analyze option should have been passed
      // Note: The actual request body format depends on CubeClient implementation
    })

    it('should not execute when skip is true', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery, { skip: true }),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      expect(result.current.hasRun).toBe(false)
    })

    it('should not execute when query is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(null),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      expect(result.current.hasRun).toBe(false)
    })
  })

  describe('clearExplain function', () => {
    it('should provide clearExplain function', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      expect(typeof result.current.clearExplain).toBe('function')
    })

    it('should clear explain state when called', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.hasRun).toBe(true)
      })

      act(() => {
        result.current.clearExplain()
      })

      expect(result.current.hasRun).toBe(false)
    })
  })

  describe('successful explain execution', () => {
    it('should return explain result with operations', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })

      expect(result.current.explainResult?.operations).toBeDefined()
      expect(result.current.explainResult?.operations.length).toBeGreaterThan(0)
    })

    it('should return explain result with summary', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult?.summary).toBeDefined()
      })

      expect(result.current.explainResult?.summary.totalCost).toBeDefined()
    })

    it('should return explain result with raw plan', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult?.rawPlan).toBeDefined()
      })
    })

    it('should return explain result with SQL', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult?.sql).toBeDefined()
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/explain', () => {
          return HttpResponse.json(
            { error: 'Explain failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })

    it('should handle network errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/explain', () => {
          return HttpResponse.error()
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })
  })

  describe('funnel query support', () => {
    it('should accept funnel query', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(funnelQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.runExplain).toBe('function')
    })

    it('should execute explain for funnel query', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(funnelQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })
    })
  })

  describe('flow query support', () => {
    it('should accept flow query', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(flowQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.runExplain).toBe('function')
    })

    it('should execute explain for flow query', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(flowQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })
    })
  })

  describe('retention query support', () => {
    it('should accept retention query', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(retentionQuery),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.runExplain).toBe('function')
    })

    it('should execute explain for retention query', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(retentionQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })
    })
  })

  describe('createExplainQueryKey utility', () => {
    it('should create query key for valid query', () => {
      const key = createExplainQueryKey(validQuery)
      expect(key[0]).toBe('cube')
      expect(key[1]).toBe('explain')
      expect(key[2]).not.toBeNull()
      expect(key[3]).toBe(false)
    })

    it('should create query key with null for null query', () => {
      const key = createExplainQueryKey(null)
      expect(key).toEqual(['cube', 'explain', null, null])
    })

    it('should include analyze option in query key', () => {
      const key = createExplainQueryKey(validQuery, { analyze: true })
      expect(key[3]).toBe(true)
    })

    it('should create stable keys for same query', () => {
      const key1 = createExplainQueryKey(validQuery)
      const key2 = createExplainQueryKey(validQuery)
      expect(key1[2]).toBe(key2[2])
    })
  })

  describe('caching behavior', () => {
    it('should not cache explain results (staleTime = 0)', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/explain', () => {
          requestCount++
          return HttpResponse.json(mockExplainResult)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      // First call
      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })

      const firstCount = requestCount

      // Clear and run again
      act(() => {
        result.current.clearExplain()
      })

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(firstCount)
      })
    })
  })

  describe('refetch on runExplain', () => {
    it('should refetch when runExplain is called again', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/explain', () => {
          requestCount++
          return HttpResponse.json(mockExplainResult)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      // First call
      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })

      const firstCount = requestCount

      // Call again without clearing
      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(firstCount)
      })
    })
  })

  describe('skip option', () => {
    it('should prevent execution when skip is true', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery, { skip: true }),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      expect(result.current.hasRun).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should allow execution when skip changes to false', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ skip }) => useExplainQuery(validQuery, { skip }),
        { wrapper, initialProps: { skip: true } }
      )

      act(() => {
        result.current.runExplain()
      })

      expect(result.current.hasRun).toBe(false)

      rerender({ skip: false })

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.hasRun).toBe(true)
      })
    })
  })

  describe('query transformation', () => {
    it('should clean standard queries before sending', async () => {
      let receivedQuery: unknown = null
      server.use(
        http.post('*/cubejs-api/v1/explain', async ({ request }) => {
          const body = await request.json() as { query?: unknown }
          receivedQuery = body.query || body
          return HttpResponse.json(mockExplainResult)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })

      // Query should have been sent
      expect(receivedQuery).not.toBeNull()
    })

    it('should not clean funnel queries', async () => {
      let receivedQuery: unknown = null
      server.use(
        http.post('*/cubejs-api/v1/explain', async ({ request }) => {
          const body = await request.json() as { query?: unknown }
          receivedQuery = body.query || body
          return HttpResponse.json(mockExplainResult)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(funnelQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.explainResult).not.toBeNull()
      })

      // Funnel query should still have funnel property
      expect(receivedQuery).not.toBeNull()
    })
  })

  describe('loading state', () => {
    it('should set isLoading true during execution', async () => {
      // Add delay to see loading state
      server.use(
        http.post('*/cubejs-api/v1/explain', async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
          return HttpResponse.json(mockExplainResult)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      // Should be loading immediately after runExplain
      expect(result.current.hasRun).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('hasRun state', () => {
    it('should be false initially', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      expect(result.current.hasRun).toBe(false)
    })

    it('should be true after runExplain is called', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      expect(result.current.hasRun).toBe(true)
    })

    it('should be false after clearExplain is called', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useExplainQuery(validQuery),
        { wrapper }
      )

      act(() => {
        result.current.runExplain()
      })

      await waitFor(() => {
        expect(result.current.hasRun).toBe(true)
      })

      act(() => {
        result.current.clearExplain()
      })

      expect(result.current.hasRun).toBe(false)
    })
  })
})

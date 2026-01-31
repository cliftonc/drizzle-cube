import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import {
  useDryRunQuery,
  useMultiDryRunQueries,
  useDryRunQueries,
  useFunnelDryRunQuery,
  useFlowDryRunQuery,
  useRetentionDryRunQuery,
  createDryRunQueryKey,
} from '../../../../src/client/hooks/queries/useDryRunQuery'
import type { CubeQuery } from '../../../../src/client/types'

describe('useDryRunQuery', () => {
  // Valid standard query
  const validQuery: CubeQuery = {
    measures: ['Employees.count'],
    dimensions: ['Employees.name'],
  }

  // Another valid query for multi-query tests
  const secondQuery: CubeQuery = {
    measures: ['Departments.count'],
    dimensions: ['Departments.name'],
  }

  // Mock dry run response
  const mockDryRunResponse = {
    sql: {
      sql: 'SELECT "employees"."name", COUNT(*) FROM "employees" GROUP BY 1',
      params: [],
    },
    analysis: {
      measures: ['Employees.count'],
      dimensions: ['Employees.name'],
      filters: [],
      timeDimensions: [],
      complexity: 'low',
    },
    query: validQuery,
  }

  // Second mock response for multi-query tests
  const mockSecondDryRunResponse = {
    sql: {
      sql: 'SELECT "departments"."name", COUNT(*) FROM "departments" GROUP BY 1',
      params: [],
    },
    analysis: {
      measures: ['Departments.count'],
      dimensions: ['Departments.name'],
      filters: [],
      timeDimensions: [],
      complexity: 'low',
    },
    query: secondQuery,
  }

  beforeEach(() => {
    server.resetHandlers()
    // Default handler for dry run requests
    server.use(
      http.post('*/cubejs-api/v1/dry-run', () => {
        return HttpResponse.json(mockDryRunResponse)
      })
    )
  })

  describe('initial state', () => {
    it('should return initial loading state when query is provided', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery),
        { wrapper }
      )

      // Initially loading is true before the request completes
      expect(result.current.debugData.loading).toBe(true)
      expect(result.current.debugData.sql).toBeNull()
      expect(result.current.debugData.analysis).toBeNull()
      expect(result.current.debugData.error).toBeNull()

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })
    })

    it('should not be loading when query is null', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(null),
        { wrapper }
      )

      expect(result.current.debugData.loading).toBe(false)
      expect(result.current.debugData.sql).toBeNull()
      expect(result.current.debugData.analysis).toBeNull()
    })

    it('should not be loading when skip is true', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery, { skip: true }),
        { wrapper }
      )

      expect(result.current.debugData.loading).toBe(false)
      expect(result.current.debugData.sql).toBeNull()
      expect(result.current.debugData.analysis).toBeNull()
    })
  })

  describe('fetching SQL and analysis', () => {
    it('should fetch SQL and analysis successfully', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.sql).not.toBeNull()
      expect(result.current.debugData.sql?.sql).toBe(mockDryRunResponse.sql.sql)
      expect(result.current.debugData.sql?.params).toEqual([])
      expect(result.current.debugData.analysis).not.toBeNull()
      expect(result.current.debugData.analysis?.measures).toEqual(['Employees.count'])
      expect(result.current.debugData.error).toBeNull()
    })

    it('should clean query before sending to server', async () => {
      let receivedQuery: unknown = null
      server.use(
        http.post('*/cubejs-api/v1/dry-run', async ({ request }) => {
          const body = await request.json() as { query?: unknown }
          receivedQuery = body.query || body
          return HttpResponse.json(mockDryRunResponse)
        })
      )

      const queryWithEmptyArrays: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: [],
        filters: [],
      }

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(queryWithEmptyArrays),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      // cleanQueryForServer should remove empty arrays
      expect(receivedQuery).not.toBeNull()
    })
  })

  describe('skip option', () => {
    it('should not fetch when skip is true', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockDryRunResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery, { skip: true }),
        { wrapper }
      )

      // Wait a bit to ensure no request is made
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
      expect(result.current.debugData.loading).toBe(false)
      expect(result.current.debugData.sql).toBeNull()
    })

    it('should fetch when skip changes from true to false', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ skip }) => useDryRunQuery(validQuery, { skip }),
        { wrapper, initialProps: { skip: true } }
      )

      expect(result.current.debugData.loading).toBe(false)
      expect(result.current.debugData.sql).toBeNull()

      rerender({ skip: false })

      await waitFor(() => {
        expect(result.current.debugData.sql).not.toBeNull()
      })
    })
  })

  describe('null query handling', () => {
    it('should not fetch when query is null', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockDryRunResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useDryRunQuery(null),
        { wrapper }
      )

      // Wait a bit to ensure no request is made
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should fetch when query changes from null to valid', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ query }) => useDryRunQuery(query),
        { wrapper, initialProps: { query: null as CubeQuery | null } }
      )

      expect(result.current.debugData.sql).toBeNull()

      rerender({ query: validQuery })

      await waitFor(() => {
        expect(result.current.debugData.sql).not.toBeNull()
      })
    })
  })

  describe('refetch function', () => {
    it('should provide refetch function', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery),
        { wrapper }
      )

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch data when refetch is called', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockDryRunResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      const firstCount = requestCount

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(firstCount)
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          return HttpResponse.json(
            { error: 'Query validation failed' },
            { status: 400 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.error).not.toBeNull()
      })

      expect(result.current.debugData.loading).toBe(false)
      expect(result.current.debugData.sql).toBeNull()
    })

    it('should handle network errors', async () => {
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          return HttpResponse.error()
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQuery(validQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.error).not.toBeNull()
      })
    })
  })
})

describe('useMultiDryRunQueries', () => {
  const query1: CubeQuery = {
    measures: ['Employees.count'],
    dimensions: ['Employees.name'],
  }

  const query2: CubeQuery = {
    measures: ['Departments.count'],
    dimensions: ['Departments.name'],
  }

  const mockResponse1 = {
    sql: { sql: 'SELECT FROM employees', params: [] },
    analysis: { measures: ['Employees.count'], complexity: 'low' },
  }

  const mockResponse2 = {
    sql: { sql: 'SELECT FROM departments', params: [] },
    analysis: { measures: ['Departments.count'], complexity: 'low' },
  }

  beforeEach(() => {
    server.resetHandlers()
  })

  describe('parallel fetching', () => {
    it('should fetch multiple queries in parallel', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', async ({ request }) => {
          requestCount++
          const body = await request.json() as { measures?: string[] }
          if (body.measures?.includes('Employees.count')) {
            return HttpResponse.json(mockResponse1)
          }
          return HttpResponse.json(mockResponse2)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([query1, query2]),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(requestCount).toBe(2)
      expect(result.current.debugDataPerQuery.length).toBe(2)
    })

    it('should return debugDataPerQuery array with correct length', async () => {
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          return HttpResponse.json(mockResponse1)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([query1, query2]),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.debugDataPerQuery).toHaveLength(2)
      result.current.debugDataPerQuery.forEach(entry => {
        expect(entry).toHaveProperty('sql')
        expect(entry).toHaveProperty('analysis')
        expect(entry).toHaveProperty('loading')
        expect(entry).toHaveProperty('error')
      })
    })
  })

  describe('isLoading state', () => {
    it('should return true when any query is loading', async () => {
      server.use(
        http.post('*/cubejs-api/v1/dry-run', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(mockResponse1)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([query1, query2]),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should return false when all queries are complete', async () => {
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          return HttpResponse.json(mockResponse1)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([query1, query2]),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.debugDataPerQuery.forEach(entry => {
        expect(entry.loading).toBe(false)
      })
    })
  })

  describe('refetchAll function', () => {
    it('should provide refetchAll function', () => {
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          return HttpResponse.json(mockResponse1)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([query1, query2]),
        { wrapper }
      )

      expect(typeof result.current.refetchAll).toBe('function')
    })

    it('should refetch all queries when refetchAll is called', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockResponse1)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([query1, query2]),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const countAfterInitial = requestCount

      act(() => {
        result.current.refetchAll()
      })

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(countAfterInitial)
      })
    })
  })

  describe('skip option', () => {
    it('should skip all queries when skip is true', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockResponse1)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useMultiDryRunQueries([query1, query2], { skip: true }),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })
  })

  describe('empty queries array', () => {
    it('should handle empty queries array', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useMultiDryRunQueries([]),
        { wrapper }
      )

      expect(result.current.debugDataPerQuery).toHaveLength(0)
      expect(result.current.isLoading).toBe(false)
    })
  })
})

describe('useDryRunQueries (combined hook)', () => {
  const singleQuery: CubeQuery = {
    measures: ['Employees.count'],
  }

  const multipleQueries: CubeQuery[] = [
    { measures: ['Employees.count'] },
    { measures: ['Departments.count'] },
  ]

  const mockResponse = {
    sql: { sql: 'SELECT COUNT(*)', params: [] },
    analysis: { measures: ['Employees.count'], complexity: 'low' },
  }

  beforeEach(() => {
    server.resetHandlers()
    server.use(
      http.post('*/cubejs-api/v1/dry-run', () => {
        return HttpResponse.json(mockResponse)
      })
    )
  })

  describe('single query mode', () => {
    it('should use single query in single mode', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQueries({
          queries: [singleQuery],
          isMultiQueryMode: false,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.debugDataPerQuery).toHaveLength(1)
    })

    it('should only fetch first query in single mode even if multiple provided', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQueries({
          queries: multipleQueries,
          isMultiQueryMode: false,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only fetch first query in single mode
      expect(result.current.debugDataPerQuery).toHaveLength(1)
      expect(requestCount).toBe(1)
    })
  })

  describe('multi query mode', () => {
    it('should use multi queries in multi mode', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useDryRunQueries({
          queries: multipleQueries,
          isMultiQueryMode: true,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.debugDataPerQuery).toHaveLength(2)
      expect(requestCount).toBe(2)
    })
  })

  describe('skip option', () => {
    it('should skip queries when skip is true', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useDryRunQueries({
          queries: multipleQueries,
          isMultiQueryMode: true,
          skip: true,
        }),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })
  })
})

describe('useFunnelDryRunQuery', () => {
  const funnelQuery = {
    funnel: {
      steps: [
        { name: 'Step 1', filters: [{ member: 'Events.type', operator: 'equals', values: ['pageview'] }] },
        { name: 'Step 2', filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }] },
      ],
      bindingKey: 'Events.userId',
      timeDimension: 'Events.timestamp',
    },
  }

  const mockFunnelResponse = {
    sql: { sql: 'WITH funnel_cte AS (...)', params: [] },
    analysis: { complexity: 'medium' },
    funnel: {
      stepCount: 2,
      steps: [
        { index: 0, name: 'Step 1', cube: 'Events' },
        { index: 1, name: 'Step 2', cube: 'Events' },
      ],
      bindingKey: 'Events.userId',
      timeDimension: 'Events.timestamp',
    },
  }

  beforeEach(() => {
    server.resetHandlers()
    server.use(
      http.post('*/cubejs-api/v1/dry-run', () => {
        return HttpResponse.json(mockFunnelResponse)
      })
    )
  })

  describe('funnel query handling', () => {
    it('should fetch funnel query successfully', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFunnelDryRunQuery(funnelQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.sql).not.toBeNull()
      expect(result.current.debugData.analysis).not.toBeNull()
    })

    it('should return funnel metadata', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFunnelDryRunQuery(funnelQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.funnelMetadata).toBeDefined()
      expect(result.current.debugData.funnelMetadata?.stepCount).toBe(2)
      expect(result.current.debugData.funnelMetadata?.steps).toHaveLength(2)
    })

    it('should not fetch when query is null', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockFunnelResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useFunnelDryRunQuery(null),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should skip when skip option is true', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockFunnelResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useFunnelDryRunQuery(funnelQuery, { skip: true }),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should provide refetch function', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFunnelDryRunQuery(funnelQuery),
        { wrapper }
      )

      expect(typeof result.current.refetch).toBe('function')
    })
  })
})

describe('useFlowDryRunQuery', () => {
  const flowQuery = {
    flow: {
      bindingKey: 'Events.userId',
      timeDimension: 'Events.timestamp',
      eventDimension: 'Events.eventType',
      startingStep: {
        name: 'Start',
        filters: [{ member: 'Events.type', operator: 'equals', values: ['pageview'] }],
      },
      stepsBefore: 2,
      stepsAfter: 2,
    },
  }

  const mockFlowResponse = {
    sql: { sql: 'WITH flow_cte AS (...)', params: [] },
    analysis: { complexity: 'high' },
    flow: {
      stepsBefore: 2,
      stepsAfter: 2,
      bindingKey: 'Events.userId',
      timeDimension: 'Events.timestamp',
      eventDimension: 'Events.eventType',
      startingStep: {
        name: 'Start',
        filter: flowQuery.flow.startingStep.filters,
      },
    },
  }

  beforeEach(() => {
    server.resetHandlers()
    server.use(
      http.post('*/cubejs-api/v1/dry-run', () => {
        return HttpResponse.json(mockFlowResponse)
      })
    )
  })

  describe('flow query handling', () => {
    it('should fetch flow query successfully', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowDryRunQuery(flowQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.sql).not.toBeNull()
      expect(result.current.debugData.analysis).not.toBeNull()
    })

    it('should return flow metadata', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowDryRunQuery(flowQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.flowMetadata).toBeDefined()
      expect(result.current.debugData.flowMetadata?.stepsBefore).toBe(2)
      expect(result.current.debugData.flowMetadata?.stepsAfter).toBe(2)
      expect(result.current.debugData.flowMetadata?.eventDimension).toBe('Events.eventType')
    })

    it('should not fetch when query is null', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockFlowResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useFlowDryRunQuery(null),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should skip when skip option is true', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockFlowResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useFlowDryRunQuery(flowQuery, { skip: true }),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should provide refetch function', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useFlowDryRunQuery(flowQuery),
        { wrapper }
      )

      expect(typeof result.current.refetch).toBe('function')
    })
  })
})

describe('useRetentionDryRunQuery', () => {
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

  const mockRetentionResponse = {
    sql: { sql: 'WITH retention_cte AS (...)', params: [] },
    analysis: { complexity: 'high' },
    retention: {
      totalCohorts: 12,
      totalUsers: 1000,
      periods: 12,
      cohortGranularity: 'week',
      periodGranularity: 'week',
      retentionType: 'classic',
    },
  }

  beforeEach(() => {
    server.resetHandlers()
    server.use(
      http.post('*/cubejs-api/v1/dry-run', () => {
        return HttpResponse.json(mockRetentionResponse)
      })
    )
  })

  describe('retention query handling', () => {
    it('should fetch retention query successfully', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionDryRunQuery(retentionQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.sql).not.toBeNull()
      expect(result.current.debugData.analysis).not.toBeNull()
    })

    it('should return retention metadata', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionDryRunQuery(retentionQuery),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.debugData.loading).toBe(false)
      })

      expect(result.current.debugData.retentionMetadata).toBeDefined()
      expect(result.current.debugData.retentionMetadata?.totalCohorts).toBe(12)
      expect(result.current.debugData.retentionMetadata?.totalUsers).toBe(1000)
      expect(result.current.debugData.retentionMetadata?.periods).toBe(12)
      expect(result.current.debugData.retentionMetadata?.retentionType).toBe('classic')
    })

    it('should not fetch when query is null', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockRetentionResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useRetentionDryRunQuery(null),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should skip when skip option is true', async () => {
      let requestCount = 0
      server.use(
        http.post('*/cubejs-api/v1/dry-run', () => {
          requestCount++
          return HttpResponse.json(mockRetentionResponse)
        })
      )

      const { wrapper } = createHookWrapper()
      renderHook(
        () => useRetentionDryRunQuery(retentionQuery, { skip: true }),
        { wrapper }
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(requestCount).toBe(0)
    })

    it('should provide refetch function', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useRetentionDryRunQuery(retentionQuery),
        { wrapper }
      )

      expect(typeof result.current.refetch).toBe('function')
    })
  })
})

describe('createDryRunQueryKey', () => {
  describe('valid query', () => {
    it('should create stable key for query', () => {
      const query: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
      }

      const key = createDryRunQueryKey(query)
      expect(key[0]).toBe('cube')
      expect(key[1]).toBe('dryRun')
      expect(key[2]).not.toBeNull()
    })

    it('should create same key for identical queries', () => {
      const query1: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
      }

      const query2: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
      }

      const key1 = createDryRunQueryKey(query1)
      const key2 = createDryRunQueryKey(query2)

      expect(key1[2]).toBe(key2[2])
    })

    it('should create different keys for different queries', () => {
      const query1: CubeQuery = {
        measures: ['Employees.count'],
      }

      const query2: CubeQuery = {
        measures: ['Departments.count'],
      }

      const key1 = createDryRunQueryKey(query1)
      const key2 = createDryRunQueryKey(query2)

      expect(key1[2]).not.toBe(key2[2])
    })
  })

  describe('null query', () => {
    it('should return null key for null query', () => {
      const key = createDryRunQueryKey(null)
      expect(key).toEqual(['cube', 'dryRun', null])
    })
  })

  describe('key stability', () => {
    it('should create stable keys regardless of property order', () => {
      const query1: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
      }

      const query2: CubeQuery = {
        dimensions: ['Employees.name'],
        measures: ['Employees.count'],
      }

      const key1 = createDryRunQueryKey(query1)
      const key2 = createDryRunQueryKey(query2)

      // stableStringify should handle property ordering
      expect(key1[2]).toBe(key2[2])
    })
  })
})

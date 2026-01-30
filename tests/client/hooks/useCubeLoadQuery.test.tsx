import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
  mockQueryData,
} from '../../client-setup/test-utils'
import { useCubeLoadQuery } from '../../../src/client/hooks/queries/useCubeLoadQuery'
import type { CubeQuery } from '../../../src/client/types'

describe('useCubeLoadQuery', () => {
  const validQuery: CubeQuery = {
    measures: ['Employees.count'],
    dimensions: ['Employees.name'],
  }

  const queryWithFilters: CubeQuery = {
    measures: ['Employees.count'],
    dimensions: ['Employees.name'],
    filters: [
      { member: 'Employees.name', operator: 'contains', values: ['John'] }
    ]
  }

  beforeEach(() => {
    // Clear any custom handlers between tests
    server.resetHandlers()
  })

  describe('basic functionality', () => {
    it('should return initial loading state', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery),
        { wrapper }
      )

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.rawData).toBeNull()
      expect(result.current.resultSet).toBeNull()
    })

    it('should fetch and return data', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.rawData).toBeDefined()
      expect(result.current.error).toBeNull()
    })

    it('should return resultSet with rawData method', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.resultSet).not.toBeNull()
      })

      expect(result.current.resultSet?.rawData()).toBeDefined()
    })
  })

  describe('query validation', () => {
    it('should mark empty query as invalid', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(null),
        { wrapper }
      )

      expect(result.current.isValidQuery).toBe(false)
    })

    it('should mark query with no measures or dimensions as invalid', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery({}),
        { wrapper }
      )

      expect(result.current.isValidQuery).toBe(false)
    })

    it('should mark query with measures as valid', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery({ measures: ['Employees.count'] }),
        { wrapper }
      )

      expect(result.current.isValidQuery).toBe(true)
    })

    it('should mark query with dimensions as valid', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery({ dimensions: ['Employees.name'] }),
        { wrapper }
      )

      expect(result.current.isValidQuery).toBe(true)
    })

    it('should mark query with timeDimensions as valid', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery({
          timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }]
        }),
        { wrapper }
      )

      expect(result.current.isValidQuery).toBe(true)
    })
  })

  describe('skip option', () => {
    it('should not fetch when skip is true', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { skip: true }),
        { wrapper }
      )

      // Should not be loading when skipped
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.rawData).toBeNull()
    })

    it('should fetch when skip changes to false', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ skip }) => useCubeLoadQuery(validQuery, { skip, debounceMs: 0 }),
        { wrapper, initialProps: { skip: true } }
      )

      expect(result.current.isLoading).toBe(false)

      // Change skip to false
      rerender({ skip: false })

      await waitFor(() => {
        expect(result.current.rawData).not.toBeNull()
      })
    })
  })

  describe('debouncing', () => {
    it('should debounce query changes', async () => {
      vi.useFakeTimers()

      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ query }) => useCubeLoadQuery(query, { debounceMs: 300 }),
        { wrapper, initialProps: { query: validQuery } }
      )

      // Should be debouncing initially
      expect(result.current.isDebouncing).toBe(true)

      // Change query rapidly
      rerender({ query: { ...validQuery, measures: ['Employees.totalSalary'] } })
      rerender({ query: { ...validQuery, measures: ['Employees.avgSalary'] } })

      // Still debouncing
      expect(result.current.isDebouncing).toBe(true)

      // Advance time past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(350)
      })

      expect(result.current.isDebouncing).toBe(false)

      vi.useRealTimers()
    })

    it('should not debounce when debounceMs is 0', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      // Should start loading immediately (no debouncing)
      await waitFor(() => {
        expect(result.current.isDebouncing).toBe(false)
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      // Override handler to return error (handle both GET and POST)
      server.use(
        http.get('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Query execution failed' },
            { status: 500 }
          )
        }),
        http.post('*/cubejs-api/v1/load', () => {
          return HttpResponse.json(
            { error: 'Query execution failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
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
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })
  })

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
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
            data: mockQueryData,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validQuery
          })
        }),
        http.post('*/cubejs-api/v1/load', async () => {
          fetchCount++
          return HttpResponse.json({
            data: mockQueryData,
            annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
            query: validQuery
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialFetchCount = fetchCount

      // Trigger refetch
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialFetchCount)
      })
    })
  })

  describe('clearCache', () => {
    it('should provide clearCache function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      expect(typeof result.current.clearCache).toBe('function')
    })
  })

  describe('with filters', () => {
    it('should handle queries with filters', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(queryWithFilters, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.rawData).toBeDefined()
      expect(result.current.error).toBeNull()
    })
  })

  describe('custom response data', () => {
    it('should return data from custom handler', async () => {
      const customData = [
        { 'Employees.count': 42, 'Employees.name': 'Custom User' }
      ]

      const customResponse = {
        data: customData,
        annotation: {
          measures: { 'Employees.count': { title: 'Count', type: 'number' } },
          dimensions: { 'Employees.name': { title: 'Name', type: 'string' } },
          timeDimensions: {}
        },
        query: validQuery
      }

      server.use(
        http.get('*/cubejs-api/v1/load', () => HttpResponse.json(customResponse)),
        http.post('*/cubejs-api/v1/load', () => HttpResponse.json(customResponse))
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeLoadQuery(validQuery, { debounceMs: 0 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.rawData).toEqual(customData)
      })
    })
  })
})

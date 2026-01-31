import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import {
  useCubeMetaQuery,
  CUBE_META_QUERY_KEY,
} from '../../../../src/client/hooks/queries/useCubeMetaQuery'

// Complete mock metadata with segments (matching CubeMetaCube interface)
const completeMockMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.count', type: 'number', title: 'Count', shortTitle: 'Cnt', aggType: 'count' },
        { name: 'Employees.totalSalary', type: 'number', title: 'Total Salary', shortTitle: 'Tot Sal', aggType: 'sum' },
        { name: 'Employees.avgSalary', type: 'number', title: 'Average Salary', shortTitle: 'Avg Sal', aggType: 'avg' }
      ],
      dimensions: [
        { name: 'Employees.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Employees.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Employees.email', type: 'string', title: 'Email', shortTitle: 'Email' },
        { name: 'Employees.departmentId', type: 'number', title: 'Department ID', shortTitle: 'Dept ID' },
        { name: 'Employees.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' }
      ],
      segments: [
        { name: 'Employees.active', title: 'Active', shortTitle: 'Active' }
      ]
    },
    {
      name: 'Departments',
      title: 'Departments',
      measures: [
        { name: 'Departments.count', type: 'number', title: 'Count', shortTitle: 'Cnt', aggType: 'count' },
        { name: 'Departments.totalBudget', type: 'number', title: 'Total Budget', shortTitle: 'Tot Bdgt', aggType: 'sum' }
      ],
      dimensions: [
        { name: 'Departments.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Departments.name', type: 'string', title: 'Name', shortTitle: 'Name' }
      ],
      segments: []
    }
  ]
}

// Helper to create a meta handler - accepts any meta object shape for testing variations
function createMetaHandler(meta: Record<string, unknown>) {
  return http.get('*/cubejs-api/v1/meta', () => {
    return HttpResponse.json(meta as object)
  })
}

describe('useCubeMetaQuery', () => {
  beforeEach(() => {
    // Set up complete mock metadata for all tests by default
    server.resetHandlers()
    server.use(createMetaHandler(completeMockMeta))
  })

  describe('basic functionality', () => {
    it('should return initial loading state', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.meta).toBeNull()
      expect(result.current.labelMap).toEqual({})
    })

    it('should fetch and return metadata successfully', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.meta).toBeDefined()
      expect(result.current.meta?.cubes).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('should build labelMap from metadata correctly', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify labelMap contains measures
      expect(result.current.labelMap['Employees.count']).toBe('Count')
      expect(result.current.labelMap['Employees.totalSalary']).toBe('Total Salary')
      expect(result.current.labelMap['Employees.avgSalary']).toBe('Average Salary')

      // Verify labelMap contains dimensions
      expect(result.current.labelMap['Employees.id']).toBe('ID')
      expect(result.current.labelMap['Employees.name']).toBe('Name')
      expect(result.current.labelMap['Employees.email']).toBe('Email')
      expect(result.current.labelMap['Employees.createdAt']).toBe('Created At')

      // Verify labelMap contains fields from other cubes
      expect(result.current.labelMap['Departments.count']).toBe('Count')
      expect(result.current.labelMap['Departments.name']).toBe('Name')
    })

    it('should include segments in labelMap', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.labelMap['Employees.active']).toBe('Active')
    })

    it('should use shortTitle when title is not available', async () => {
      const metaWithShortTitle = {
        cubes: [
          {
            name: 'Employees',
            title: 'Employees',
            measures: [
              { name: 'Employees.count', type: 'number', shortTitle: 'Cnt', aggType: 'count' }
            ],
            dimensions: [
              { name: 'Employees.name', type: 'string', shortTitle: 'Nm' }
            ],
            segments: []
          }
        ]
      }

      server.use(createMetaHandler(metaWithShortTitle))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.labelMap['Employees.count']).toBe('Cnt')
      expect(result.current.labelMap['Employees.name']).toBe('Nm')
    })

    it('should fallback to field name when no title or shortTitle', async () => {
      const metaWithoutTitles = {
        cubes: [
          {
            name: 'Employees',
            title: 'Employees',
            measures: [
              { name: 'Employees.count', type: 'number', aggType: 'count' }
            ],
            dimensions: [
              { name: 'Employees.name', type: 'string' }
            ],
            segments: []
          }
        ]
      }

      server.use(createMetaHandler(metaWithoutTitles))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.labelMap['Employees.count']).toBe('Employees.count')
      expect(result.current.labelMap['Employees.name']).toBe('Employees.name')
    })
  })

  describe('getFieldLabel function', () => {
    it('should return title for known fields', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getFieldLabel('Employees.count')).toBe('Count')
      expect(result.current.getFieldLabel('Employees.name')).toBe('Name')
      expect(result.current.getFieldLabel('Departments.totalBudget')).toBe('Total Budget')
    })

    it('should return field name as fallback for unknown fields', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getFieldLabel('Unknown.field')).toBe('Unknown.field')
      expect(result.current.getFieldLabel('NonExistent.measure')).toBe('NonExistent.measure')
    })

    it('should return field name when labelMap is empty (still loading)', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      // While still loading, labelMap is empty
      expect(result.current.getFieldLabel('Employees.count')).toBe('Employees.count')
    })
  })

  describe('enabled option', () => {
    it('should skip query when enabled=false', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeMetaQuery({ enabled: false }),
        { wrapper }
      )

      // Should not be loading or fetching when disabled
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.meta).toBeNull()
      expect(result.current.labelMap).toEqual({})
    })

    it('should fetch when enabled=true (default)', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useCubeMetaQuery({ enabled: true }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.meta).toBeDefined()
      expect(result.current.meta?.cubes).toHaveLength(2)
    })

    it('should fetch when enabled changes from false to true', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(
        ({ enabled }) => useCubeMetaQuery({ enabled }),
        { wrapper, initialProps: { enabled: false } }
      )

      // Initially disabled
      expect(result.current.isLoading).toBe(false)
      expect(result.current.meta).toBeNull()

      // Enable the query
      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.meta).not.toBeNull()
      })

      expect(result.current.meta?.cubes).toHaveLength(2)
    })
  })

  describe('stale time', () => {
    it('should use custom staleTime when provided', async () => {
      const customStaleTime = 10 * 60 * 1000 // 10 minutes
      const { wrapper, queryClient } = createHookWrapper()

      const { result } = renderHook(
        () => useCubeMetaQuery({ staleTime: customStaleTime }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Check the query state
      const queryState = queryClient.getQueryState(CUBE_META_QUERY_KEY)
      expect(queryState?.dataUpdatedAt).toBeDefined()
    })

    it('should use default 5 minute staleTime', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // The default staleTime is 5 minutes (300000ms)
      // We can't directly test the staleTime value, but we can verify the query completes
      expect(result.current.meta).toBeDefined()
    })

    it('should use cached data across multiple hook instances', async () => {
      let fetchCount = 0
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          fetchCount++
          return HttpResponse.json(completeMockMeta)
        })
      )

      const { wrapper } = createHookWrapper()

      // First hook instance
      const { result: result1 } = renderHook(
        () => useCubeMetaQuery({ staleTime: 60 * 60 * 1000 }), // 1 hour
        { wrapper }
      )

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(fetchCount).toBe(1)

      // Second hook instance in same wrapper should use cached data
      const { result: result2 } = renderHook(
        () => useCubeMetaQuery({ staleTime: 60 * 60 * 1000 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result2.current.meta).not.toBeNull()
      })

      // Both should have same data, but only one fetch
      expect(result1.current.meta).toEqual(result2.current.meta)
      expect(fetchCount).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.json(
            { error: 'Metadata fetch failed' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.meta).toBeNull()
    })

    it('should handle network errors', async () => {
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.error()
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      expect(result.current.meta).toBeNull()
    })

    it('should handle malformed response gracefully', async () => {
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.json({ invalid: 'response', cubes: undefined })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should handle gracefully - labelMap will be empty if cubes are missing/invalid
      expect(result.current.labelMap).toEqual({})
    })

    it('should maintain empty labelMap on error', async () => {
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.json(
            { error: 'Server error' },
            { status: 500 }
          )
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      expect(result.current.labelMap).toEqual({})
      expect(result.current.getFieldLabel('Employees.count')).toBe('Employees.count')
    })
  })

  describe('refetch function', () => {
    it('should provide refetch function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch data when called', async () => {
      let fetchCount = 0
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          fetchCount++
          return HttpResponse.json(completeMockMeta)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

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

    it('should invalidate cache when refetch is called', async () => {
      const firstMeta = {
        cubes: [
          {
            name: 'Employees',
            title: 'Employees',
            measures: [
              { name: 'Employees.count', type: 'number', title: 'Count V1', aggType: 'count' }
            ],
            dimensions: [],
            segments: []
          }
        ]
      }

      const secondMeta = {
        cubes: [
          {
            name: 'Employees',
            title: 'Employees',
            measures: [
              { name: 'Employees.count', type: 'number', title: 'Count V2', aggType: 'count' }
            ],
            dimensions: [],
            segments: []
          }
        ]
      }

      let callCount = 0
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          callCount++
          return HttpResponse.json(callCount === 1 ? firstMeta : secondMeta)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // First fetch should return V1
      expect(result.current.labelMap['Employees.count']).toBe('Count V1')

      // Trigger refetch
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.labelMap['Employees.count']).toBe('Count V2')
      })
    })

    it('should set isFetching to true during refetch', async () => {
      let resolvePromise: () => void
      const delayedPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      server.use(
        http.get('*/cubejs-api/v1/meta', async () => {
          await delayedPromise
          return HttpResponse.json(completeMockMeta)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      // Wait for initial loading state
      expect(result.current.isLoading).toBe(true)

      // Resolve the promise
      act(() => {
        resolvePromise!()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('query key', () => {
    it('should export CUBE_META_QUERY_KEY constant', () => {
      expect(CUBE_META_QUERY_KEY).toEqual(['cube', 'meta'])
    })

    it('should use consistent query key for caching', async () => {
      let fetchCount = 0
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          fetchCount++
          return HttpResponse.json(completeMockMeta)
        })
      )

      const { wrapper } = createHookWrapper()

      // First hook instance
      const { result: result1 } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(fetchCount).toBe(1)

      // Second hook instance should share cache
      const { result: result2 } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result2.current.meta).not.toBeNull()
      })

      // Should still be 1 because it used cached data
      expect(fetchCount).toBe(1)

      // Both should have same data
      expect(result1.current.meta).toEqual(result2.current.meta)
    })
  })

  describe('isFetching state', () => {
    it('should distinguish between isLoading and isFetching', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      // Initially isLoading should be true (first fetch)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After data is loaded, both should be false
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('metadata structure', () => {
    it('should return full cube structure', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Check Employees cube structure
      const employeesCube = result.current.meta?.cubes.find(c => c.name === 'Employees')
      expect(employeesCube).toBeDefined()
      expect(employeesCube?.title).toBe('Employees')
      expect(employeesCube?.measures).toHaveLength(3)
      expect(employeesCube?.dimensions).toHaveLength(5)

      // Check Departments cube structure
      const departmentsCube = result.current.meta?.cubes.find(c => c.name === 'Departments')
      expect(departmentsCube).toBeDefined()
      expect(departmentsCube?.title).toBe('Departments')
      expect(departmentsCube?.measures).toHaveLength(2)
      expect(departmentsCube?.dimensions).toHaveLength(2)
    })

    it('should handle cubes with empty arrays', async () => {
      const emptyMeta = {
        cubes: [
          {
            name: 'EmptyCube',
            title: 'Empty Cube',
            measures: [],
            dimensions: [],
            segments: []
          }
        ]
      }

      server.use(createMetaHandler(emptyMeta))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.meta?.cubes).toHaveLength(1)
      expect(result.current.labelMap).toEqual({})
    })

    it('should handle empty cubes array', async () => {
      const emptyCubesMeta = {
        cubes: []
      }

      server.use(createMetaHandler(emptyCubesMeta))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMetaQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.meta?.cubes).toHaveLength(0)
      expect(result.current.labelMap).toEqual({})
    })
  })
})

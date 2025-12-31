/**
 * Tests for useCubeQuery hook
 * Covers query execution, loading states, race conditions, error handling, and query deduplication
 */

import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { useCubeQuery } from '../../src/client/hooks/useCubeQuery'
import { CubeProvider } from '../../src/client/providers/CubeProvider'
import type { CubeQuery, CubeQueryOptions, CubeResultSet } from '../../src/client/types'

// Mock createCubeClient to return our mock client
vi.mock('../../src/client/client/CubeClient', () => ({
  createCubeClient: vi.fn(() => mockCubeClient)
}))

// Mock the CubeClient
const mockLoad = vi.fn()
const mockCubeClient = {
  load: mockLoad,
  sql: vi.fn(),
  meta: vi.fn(),
  batchLoad: vi.fn() // Required for BatchCoordinator
}

// Mock the CubeProvider to provide our mocked client with batching disabled
// We disable batching to test the basic query behavior directly
// BatchCoordinator has its own dedicated tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CubeProvider
    apiOptions={{ apiUrl: '/cubejs-api/v1' }}
    token="test-token"
    enableBatching={false}
  >
    {children}
  </CubeProvider>
)

describe('useCubeQuery', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset createCubeClient mock to return our mockCubeClient
    const { createCubeClient } = await import('../../src/client/client/CubeClient')
    ;(createCubeClient as Mock).mockReturnValue(mockCubeClient)
    // Don't use fake timers for async tests - this was causing the timeouts
    // vi.useFakeTimers()
  })

  afterEach(() => {
    // vi.useRealTimers()
  })

  const mockResultSet: CubeResultSet = {
    rawData: () => [{ 'Users.count': 5 }],
    tablePivot: () => [{ 'Users.count': 5 }],
    series: () => [],
    annotation: () => ({ measures: {}, dimensions: {} })
  }

  const sampleQuery: CubeQuery = {
    measures: ['Users.count']
  }

  describe('initial state', () => {
    it('should return initial state when no query provided', () => {
      const { result } = renderHook(() => useCubeQuery(null), {
        wrapper: TestWrapper
      })

      expect(result.current).toEqual({
        resultSet: null,
        isLoading: false,
        error: null,
        queryId: null
      })
    })

    it('should return initial state when skip option is true', () => {
      const { result } = renderHook(() => useCubeQuery(sampleQuery, { skip: true }), {
        wrapper: TestWrapper
      })

      expect(result.current).toEqual({
        resultSet: null,
        isLoading: false,
        error: null,
        queryId: null
      })
    })
  })

  describe('query execution', () => {
    it('should execute query and update state correctly', async () => {
      mockLoad.mockResolvedValueOnce(mockResultSet)

      const { result } = renderHook(() => useCubeQuery(sampleQuery), {
        wrapper: TestWrapper
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.resultSet).toBe(null)
      expect(result.current.queryId).toBeTruthy()

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.resultSet).toBe(mockResultSet)
      expect(result.current.error).toBe(null)
      expect(mockLoad).toHaveBeenCalledWith(sampleQuery)
    })

    it('should handle query errors correctly', async () => {
      const mockError = new Error('Query failed')
      mockLoad.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useCubeQuery(sampleQuery), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.resultSet).toBe(null)
      expect(result.current.error).toEqual(mockError)
    })

    it('should handle non-Error exceptions correctly', async () => {
      mockLoad.mockRejectedValueOnce('String error')

      const { result } = renderHook(() => useCubeQuery(sampleQuery), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.resultSet).toBe(null)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('String error')
    })
  })

  describe('query deduplication', () => {
    it('should not re-execute the same query', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result, rerender } = renderHook(
        ({ query }) => useCubeQuery(query),
        {
          wrapper: TestWrapper,
          initialProps: { query: sampleQuery }
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLoad).toHaveBeenCalledTimes(1)

      // Rerender with the same query
      rerender({ query: sampleQuery })

      // Should not call load again
      expect(mockLoad).toHaveBeenCalledTimes(1)
    })

    it('should re-execute query when query changes', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result, rerender } = renderHook(
        ({ query }) => useCubeQuery(query),
        {
          wrapper: TestWrapper,
          initialProps: { query: sampleQuery }
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLoad).toHaveBeenCalledTimes(1)

      // Change the query
      const newQuery = { measures: ['Orders.count'] }
      rerender({ query: newQuery })

      expect(result.current.isLoading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLoad).toHaveBeenCalledTimes(2)
      expect(mockLoad).toHaveBeenLastCalledWith(newQuery)
    })
  })

  describe('resetResultSetOnChange option', () => {
    it('should clear result set when resetResultSetOnChange is true', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result, rerender } = renderHook(
        ({ query, options }) => useCubeQuery(query, options),
        {
          wrapper: TestWrapper,
          initialProps: { 
            query: sampleQuery, 
            options: { resetResultSetOnChange: true } as CubeQueryOptions
          }
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.resultSet).toBe(mockResultSet)

      // Change query - should clear result set immediately
      const newQuery = { measures: ['Orders.count'] }
      rerender({ 
        query: newQuery, 
        options: { resetResultSetOnChange: true } 
      })

      expect(result.current.resultSet).toBe(null)
      expect(result.current.isLoading).toBe(true)
    })

    it('should re-execute same query when resetResultSetOnChange is true', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result, rerender } = renderHook(
        ({ options }) => useCubeQuery(sampleQuery, options),
        {
          wrapper: TestWrapper,
          initialProps: { 
            options: { resetResultSetOnChange: false } as CubeQueryOptions 
          }
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLoad).toHaveBeenCalledTimes(1)

      // Enable resetResultSetOnChange - should trigger re-execution
      rerender({ options: { resetResultSetOnChange: true } })

      expect(result.current.isLoading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLoad).toHaveBeenCalledTimes(2)
    })
  })

  describe('race condition prevention', () => {
    it('should ignore results from outdated queries', async () => {
      let resolveFirst: (value: any) => void
      let resolveSecond: (value: any) => void

      const firstPromise = new Promise(resolve => { resolveFirst = resolve })
      const secondPromise = new Promise(resolve => { resolveSecond = resolve })

      const firstResult = { ...mockResultSet, rawData: () => [{ 'Users.count': 1 }] }
      const secondResult = { ...mockResultSet, rawData: () => [{ 'Users.count': 2 }] }

      mockLoad
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)

      const { result, rerender } = renderHook(
        ({ query }) => useCubeQuery(query),
        {
          wrapper: TestWrapper,
          initialProps: { query: { measures: ['Users.count'] } }
        }
      )

      expect(result.current.isLoading).toBe(true)

      // Start second query before first completes
      rerender({ query: { measures: ['Orders.count'] } })

      expect(result.current.isLoading).toBe(true)

      // Resolve first query (should be ignored)
      act(() => {
        resolveFirst!(firstResult)
      })

      // Should still be loading as we wait for the second query
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve second query
      act(() => {
        resolveSecond!(secondResult)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have the second result, not the first
      expect(result.current.resultSet).toBe(secondResult)
    })

    it('should ignore errors from outdated queries', async () => {
      let rejectFirst: (error: any) => void
      let resolveSecond: (value: any) => void

      const firstPromise = new Promise((_, reject) => { rejectFirst = reject })
      const secondPromise = new Promise(resolve => { resolveSecond = resolve })

      // Add catch handler to prevent unhandled rejection warning
      firstPromise.catch(() => {})

      const firstError = new Error('First query error')
      const secondResult = mockResultSet

      mockLoad
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)

      const { result, rerender } = renderHook(
        ({ query }) => useCubeQuery(query),
        {
          wrapper: TestWrapper,
          initialProps: { query: { measures: ['Users.count'] } }
        }
      )

      // Start second query
      rerender({ query: { measures: ['Orders.count'] } })

      // Reject first query (should be ignored)
      act(() => {
        rejectFirst!(firstError)
      })

      // Should still be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve second query
      act(() => {
        resolveSecond!(secondResult)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have successful result, not the error
      expect(result.current.resultSet).toBe(secondResult)
      expect(result.current.error).toBe(null)
    })
  })

  describe('queryId generation', () => {
    it('should generate unique query IDs for each execution', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result, rerender } = renderHook(
        ({ query }) => useCubeQuery(query),
        {
          wrapper: TestWrapper,
          initialProps: { query: sampleQuery }
        }
      )

      const firstQueryId = result.current.queryId

      expect(firstQueryId).toBeTruthy()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change query to trigger new execution
      rerender({ query: { measures: ['Orders.count'] } })

      const secondQueryId = result.current.queryId

      expect(secondQueryId).toBeTruthy()
      expect(secondQueryId).not.toBe(firstQueryId)
    })

    it('should maintain queryId through successful completion', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result } = renderHook(() => useCubeQuery(sampleQuery), {
        wrapper: TestWrapper
      })

      const queryId = result.current.queryId

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.queryId).toBe(queryId)
    })

    it('should maintain queryId through error completion', async () => {
      const mockError = new Error('Query failed')
      mockLoad.mockRejectedValue(mockError)

      const { result } = renderHook(() => useCubeQuery(sampleQuery), {
        wrapper: TestWrapper
      })

      const queryId = result.current.queryId

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.queryId).toBe(queryId)
      expect(result.current.error).toEqual(mockError)
    })
  })

  describe('options handling', () => {
    it('should handle skip option dynamically', async () => {
      mockLoad.mockResolvedValue(mockResultSet)

      const { result, rerender } = renderHook(
        ({ skip }) => useCubeQuery(sampleQuery, { skip }),
        {
          wrapper: TestWrapper,
          initialProps: { skip: true }
        }
      )

      // Should not execute when skip is true
      expect(result.current.isLoading).toBe(false)
      expect(mockLoad).not.toHaveBeenCalled()

      // Enable execution
      rerender({ skip: false })

      expect(result.current.isLoading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockLoad).toHaveBeenCalledWith(sampleQuery)
      expect(result.current.resultSet).toBe(mockResultSet)
    })
  })

  describe('context requirement', () => {
    it('should throw error when used outside CubeProvider', () => {
      // Temporarily suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useCubeQuery(sampleQuery))
      }).toThrow('useCubeApi must be used within CubeApiProvider')

      console.error = originalError
    })
  })
})
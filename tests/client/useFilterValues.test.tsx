/**
 * Tests for useFilterValues hook
 * Covers filter value management, search functionality, result extraction, and error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { useFilterValues } from '../../src/client/hooks/useFilterValues'
import { useCubeQuery } from '../../src/client/hooks/useCubeQuery'

// Mock the useCubeQuery hook
vi.mock('../../src/client/hooks/useCubeQuery', () => ({
  useCubeQuery: vi.fn()
}))

const mockUseCubeQuery = vi.mocked(useCubeQuery)

// Mock console.error to avoid noise during error tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useFilterValues', () => {
  let mockResultSet: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockResultSet = {
      tablePivot: vi.fn(() => [
        { 'Users.name': 'Alice' },
        { 'Users.name': 'Bob' },
        { 'Users.name': 'Charlie' },
        { 'Users.name': 'Alice' }, // Duplicate - should be filtered out
        { 'Users.name': null }, // Null - should be filtered out
        { 'Users.name': '' }, // Empty - should be filtered out
        { 'Users.name': 'David' }
      ])
    }

    // Default mock return value
    mockUseCubeQuery.mockReturnValue({
      resultSet: null,
      isLoading: false,
      error: null,
      queryId: null
    })
  })

  describe('initialization', () => {
    it('should return initial state when field is null', () => {
      const { result } = renderHook(() => useFilterValues(null))

      expect(result.current).toEqual({
        values: [],
        loading: false,
        error: null,
        refetch: expect.any(Function),
        searchValues: expect.any(Function)
      })
    })

    it('should return initial state when disabled', () => {
      const { result } = renderHook(() => useFilterValues('Users.name', false))

      expect(result.current.values).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should call useCubeQuery with skip when field is null', () => {
      renderHook(() => useFilterValues(null))

      expect(mockUseCubeQuery).toHaveBeenCalledWith(null, {
        skip: true,
        resetResultSetOnChange: true
      })
    })

    it('should call useCubeQuery with skip when disabled', () => {
      renderHook(() => useFilterValues('Users.name', false))

      expect(mockUseCubeQuery).toHaveBeenCalledWith(null, {
        skip: true,
        resetResultSetOnChange: true
      })
    })
  })

  describe('value extraction', () => {
    it('should extract unique values from result set', () => {
      const queryId = 'test-query-1'
      
      mockUseCubeQuery.mockReturnValue({
        resultSet: mockResultSet,
        isLoading: false,
        error: null,
        queryId
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])
    })

    it('should filter out null, undefined, and empty values', () => {
      const resultSetWithNulls = {
        tablePivot: () => [
          { 'Users.status': 'active' },
          { 'Users.status': null },
          { 'Users.status': undefined },
          { 'Users.status': '' },
          { 'Users.status': 'inactive' },
          { 'Users.status': 'pending' }
        ]
      }

      mockUseCubeQuery.mockReturnValue({
        resultSet: resultSetWithNulls,
        isLoading: false,
        error: null,
        queryId: 'test-query-nulls'
      })

      const { result } = renderHook(() => useFilterValues('Users.status'))

      expect(result.current.values).toEqual(['active', 'inactive', 'pending'])
    })

    it('should handle different data types', () => {
      const mixedDataResultSet = {
        tablePivot: () => [
          { 'Orders.amount': 100 },
          { 'Orders.amount': 200.50 },
          { 'Orders.amount': 0 }, // Should include zero
          { 'Orders.amount': 300 }
        ]
      }

      mockUseCubeQuery.mockReturnValue({
        resultSet: mixedDataResultSet,
        isLoading: false,
        error: null,
        queryId: 'test-query-mixed'
      })

      const { result } = renderHook(() => useFilterValues('Orders.amount'))

      expect(result.current.values).toEqual([100, 200.50, 0, 300])
    })

    it('should handle boolean values', () => {
      const booleanResultSet = {
        tablePivot: () => [
          { 'Users.isActive': true },
          { 'Users.isActive': false },
          { 'Users.isActive': true }, // Duplicate
          { 'Users.isActive': false } // Duplicate
        ]
      }

      mockUseCubeQuery.mockReturnValue({
        resultSet: booleanResultSet,
        isLoading: false,
        error: null,
        queryId: 'test-query-boolean'
      })

      const { result } = renderHook(() => useFilterValues('Users.isActive'))

      expect(result.current.values).toEqual([true, false])
    })
  })

  describe('loading state', () => {
    it('should reflect loading state from useCubeQuery', () => {
      mockUseCubeQuery.mockReturnValue({
        resultSet: null,
        isLoading: true,
        error: null,
        queryId: 'loading-query'
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.loading).toBe(true)
    })

    it('should not process results while loading', () => {
      mockUseCubeQuery.mockReturnValue({
        resultSet: mockResultSet,
        isLoading: true,
        error: null,
        queryId: 'loading-query'
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual([])
      expect(result.current.loading).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle query errors', () => {
      const queryError = new Error('Query failed')
      
      mockUseCubeQuery.mockReturnValue({
        resultSet: null,
        isLoading: false,
        error: queryError,
        queryId: 'error-query'
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.error).toBe('Query failed')
      expect(result.current.values).toEqual([])
    })

    it('should handle non-Error query errors', () => {
      mockUseCubeQuery.mockReturnValue({
        resultSet: null,
        isLoading: false,
        error: 'String error',
        queryId: 'error-query'
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.error).toBe('String error')
    })

    it('should handle result set extraction errors', async () => {
      // Set up a fresh console spy for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const brokenResultSet = {
        tablePivot: () => {
          throw new Error('ResultSet error')
        }
      }

      mockUseCubeQuery.mockReturnValue({
        resultSet: brokenResultSet,
        isLoading: false,
        error: null,
        queryId: 'broken-query'
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      // Trigger a search to create a query that will process the broken result set
      act(() => {
        result.current.searchValues('test')
      })

      // Wait for useEffect to process the result set
      await waitFor(() => {
        expect(result.current.values).toEqual([])
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error extracting values from result set:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('query ID tracking', () => {
    it('should not reprocess same query results', () => {
      const queryId = 'same-query'
      
      mockUseCubeQuery.mockReturnValue({
        resultSet: mockResultSet,
        isLoading: false,
        error: null,
        queryId
      })

      const { result, rerender } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])

      // Rerender with same query ID - should not reprocess
      rerender()

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])
      expect(mockResultSet.tablePivot).toHaveBeenCalledTimes(1)
    })

    it('should process new query results', () => {
      let queryId = 'first-query'
      
      mockUseCubeQuery.mockReturnValue({
        resultSet: mockResultSet,
        isLoading: false,
        error: null,
        queryId
      })

      const { result, rerender } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])

      // Change query ID - should reprocess
      queryId = 'second-query'
      mockUseCubeQuery.mockReturnValue({
        resultSet: mockResultSet,
        isLoading: false,
        error: null,
        queryId
      })

      rerender()

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])
      expect(mockResultSet.tablePivot).toHaveBeenCalledTimes(2)
    })
  })

  describe('refetch functionality', () => {
    it('should trigger new query when refetch is called', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.refetch()
      })

      expect(mockUseCubeQuery).toHaveBeenCalledWith(
        {
          dimensions: ['Users.name'],
          limit: 25,
          order: { 'Users.name': 'asc' }
        },
        {
          skip: false,
          resetResultSetOnChange: true
        }
      )
    })

    it('should not refetch when field is null', () => {
      const { result } = renderHook(() => useFilterValues(null))

      act(() => {
        result.current.refetch()
      })

      // Should still be skipping
      expect(mockUseCubeQuery).toHaveBeenLastCalledWith(null, {
        skip: true,
        resetResultSetOnChange: true
      })
    })

    it('should handle refetch errors gracefully', () => {
      // Mock console.error to capture the error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a field name that will cause an error when used in object property access
      const problematicField = {
        toString: () => { throw new Error('Field name error') }
      }

      const { result } = renderHook(() => useFilterValues(problematicField as any))

      act(() => {
        result.current.refetch()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error creating query:', expect.any(Error))

      // Restore
      consoleSpy.mockRestore()
    })
  })

  describe('search functionality', () => {
    it('should create query with filter when searching', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.searchValues('Alice')
      })

      expect(mockUseCubeQuery).toHaveBeenCalledWith(
        {
          dimensions: ['Users.name'],
          limit: 25,
          order: { 'Users.name': 'asc' },
          filters: [{
            member: 'Users.name',
            operator: 'contains',
            values: ['Alice']
          }]
        },
        {
          skip: false,
          resetResultSetOnChange: true
        }
      )
    })

    it('should create query without filter when search term is empty', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.searchValues('', true)
      })

      expect(mockUseCubeQuery).toHaveBeenLastCalledWith(
        {
          dimensions: ['Users.name'],
          limit: 25,
          order: { 'Users.name': 'asc' }
        },
        {
          skip: false,
          resetResultSetOnChange: true
        }
      )
    })

    it('should trim whitespace from search terms', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.searchValues('  Alice  ')
      })

      expect(mockUseCubeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [{
            member: 'Users.name',
            operator: 'contains',
            values: ['Alice'] // Should be trimmed
          }]
        }),
        expect.any(Object)
      )
    })

    it('should not create new query for same search term', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      // First search
      act(() => {
        result.current.searchValues('Alice')
      })

      const firstCallCount = mockUseCubeQuery.mock.calls.length

      // Same search - should not create new query
      act(() => {
        result.current.searchValues('Alice')
      })

      expect(mockUseCubeQuery.mock.calls.length).toBe(firstCallCount)
    })

    it('should force new query when force parameter is true', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      // First search
      act(() => {
        result.current.searchValues('Alice')
      })

      const firstCallCount = mockUseCubeQuery.mock.calls.length

      // Same search with force=true - should create new query
      act(() => {
        result.current.searchValues('Alice', true)
      })

      expect(mockUseCubeQuery.mock.calls.length).toBe(firstCallCount + 1)
    })

    it('should not search when field is null', () => {
      const { result } = renderHook(() => useFilterValues(null))

      act(() => {
        result.current.searchValues('test')
      })

      // Should still be skipping
      expect(mockUseCubeQuery).toHaveBeenLastCalledWith(null, {
        skip: true,
        resetResultSetOnChange: true
      })
    })

    it('should handle search errors gracefully', () => {
      // Test what happens when the search query results in an error from the API
      mockUseCubeQuery.mockReturnValue({
        resultSet: null,
        isLoading: false,
        error: new Error('Search API error'),
        queryId: 'search-error-query'
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.searchValues('Alice')
      })

      // Should handle the API error gracefully by clearing values and showing error
      expect(result.current.values).toEqual([])
      expect(result.current.error).toBe('Search API error')
    })
  })

  describe('field name changes', () => {
    it('should handle field name changes', () => {
      const { result, rerender } = renderHook(
        ({ fieldName }) => useFilterValues(fieldName),
        {
          initialProps: { fieldName: 'Users.name' }
        }
      )

      // Change field name
      rerender({ fieldName: 'Users.email' })

      act(() => {
        result.current.refetch()
      })

      expect(mockUseCubeQuery).toHaveBeenCalledWith(
        {
          dimensions: ['Users.email'],
          limit: 25,
          order: { 'Users.email': 'asc' }
        },
        {
          skip: false,
          resetResultSetOnChange: true
        }
      )
    })

    it('should reset values when field becomes null', () => {
      mockUseCubeQuery.mockReturnValue({
        resultSet: mockResultSet,
        isLoading: false,
        error: null,
        queryId: 'initial-query'
      })

      const { result, rerender } = renderHook(
        ({ fieldName }) => useFilterValues(fieldName),
        {
          initialProps: { fieldName: 'Users.name' }
        }
      )

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])

      // Change field to null
      mockUseCubeQuery.mockReturnValue({
        resultSet: null,
        isLoading: false,
        error: null,
        queryId: null
      })

      rerender({ fieldName: null })

      expect(result.current.values).toEqual([])
    })
  })

  describe('enabled state changes', () => {
    it('should handle enable/disable changes', () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useFilterValues('Users.name', enabled),
        {
          initialProps: { enabled: false }
        }
      )

      expect(result.current.values).toEqual([])

      // Enable the hook
      rerender({ enabled: true })

      expect(mockUseCubeQuery).toHaveBeenLastCalledWith(null, {
        skip: true, // Still true because no query has been set yet
        resetResultSetOnChange: true
      })
    })
  })
})
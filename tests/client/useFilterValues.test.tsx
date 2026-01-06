/**
 * Tests for useFilterValues hook
 * Covers filter value management, search functionality, result extraction, and error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { useFilterValues } from '../../src/client/hooks/useFilterValues'
import { useCubeLoadQuery } from '../../src/client/hooks/queries/useCubeLoadQuery'

// Mock the useCubeLoadQuery hook
vi.mock('../../src/client/hooks/queries/useCubeLoadQuery', () => ({
  useCubeLoadQuery: vi.fn()
}))

const mockUseCubeLoadQuery = vi.mocked(useCubeLoadQuery)

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
    mockUseCubeLoadQuery.mockReturnValue({
      resultSet: null,
      rawData: null,
      isLoading: false,
      isFetching: false,
      isDebouncing: false,
      error: null,
      debouncedQuery: null,
      isValidQuery: false,
      refetch: vi.fn(),
      clearCache: vi.fn()
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

    it('should call useCubeLoadQuery with skip when field is null', () => {
      renderHook(() => useFilterValues(null))

      expect(mockUseCubeLoadQuery).toHaveBeenCalledWith(null, {
        skip: true,
        debounceMs: 150,
        keepPreviousData: true
      })
    })

    it('should call useCubeLoadQuery with skip when disabled', () => {
      renderHook(() => useFilterValues('Users.name', false))

      expect(mockUseCubeLoadQuery).toHaveBeenCalledWith(null, {
        skip: true,
        debounceMs: 150,
        keepPreviousData: true
      })
    })
  })

  describe('value extraction', () => {
    it('should extract unique values from result set', () => {
      // Add rawData method to mock for deduplication tracking
      const rawDataResult = [{ 'Users.name': 'Alice' }, { 'Users.name': 'Bob' }]
      const resultSetWithRawData = {
        ...mockResultSet,
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: resultSetWithRawData,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])
    })

    it('should filter out null, undefined, and empty values', () => {
      const rawDataResult = [{ 'Users.status': 'active' }]
      const resultSetWithNulls = {
        tablePivot: () => [
          { 'Users.status': 'active' },
          { 'Users.status': null },
          { 'Users.status': undefined },
          { 'Users.status': '' },
          { 'Users.status': 'inactive' },
          { 'Users.status': 'pending' }
        ],
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: resultSetWithNulls,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.status'))

      expect(result.current.values).toEqual(['active', 'inactive', 'pending'])
    })

    it('should handle different data types', () => {
      const rawDataResult = [{ 'Orders.amount': 100 }]
      const mixedDataResultSet = {
        tablePivot: () => [
          { 'Orders.amount': 100 },
          { 'Orders.amount': 200.50 },
          { 'Orders.amount': 0 }, // Should include zero
          { 'Orders.amount': 300 }
        ],
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: mixedDataResultSet,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Orders.amount'))

      expect(result.current.values).toEqual([100, 200.50, 0, 300])
    })

    it('should handle boolean values', () => {
      const rawDataResult = [{ 'Users.isActive': true }]
      const booleanResultSet = {
        tablePivot: () => [
          { 'Users.isActive': true },
          { 'Users.isActive': false },
          { 'Users.isActive': true }, // Duplicate
          { 'Users.isActive': false } // Duplicate
        ],
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: booleanResultSet,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.isActive'))

      expect(result.current.values).toEqual([true, false])
    })
  })

  describe('loading state', () => {
    it('should reflect loading state from useCubeLoadQuery', () => {
      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: null,
        rawData: null,
        isLoading: true,
        isFetching: true,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: false,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.loading).toBe(true)
    })

    it('should not process results while loading', () => {
      const rawDataResult = [{ 'Users.name': 'Alice' }]
      const resultSetWithRawData = {
        ...mockResultSet,
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: resultSetWithRawData,
        rawData: rawDataResult,
        isLoading: true,
        isFetching: true,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual([])
      expect(result.current.loading).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle query errors', () => {
      const queryError = new Error('Query failed')

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: null,
        rawData: null,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: queryError,
        debouncedQuery: null,
        isValidQuery: false,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.error).toBe('Query failed')
      expect(result.current.values).toEqual([])
    })

    it('should handle non-Error query errors', () => {
      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: null,
        rawData: null,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: 'String error' as any,
        debouncedQuery: null,
        isValidQuery: false,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.error).toBe('String error')
    })

    it('should handle result set extraction errors', async () => {
      // Set up a fresh console spy for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const rawDataResult = [{}]
      const brokenResultSet = {
        tablePivot: () => {
          throw new Error('ResultSet error')
        },
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: brokenResultSet,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
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

  describe('result tracking', () => {
    it('should not reprocess same query results (same rawData reference)', () => {
      // Use the same rawData array reference to simulate unchanged results
      const rawDataResult = [{ 'Users.name': 'Alice' }, { 'Users.name': 'Bob' }]
      const resultSetWithRawData = {
        ...mockResultSet,
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: resultSetWithRawData,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result, rerender } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])

      // Rerender with same rawData reference - should not reprocess
      rerender()

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])
      expect(mockResultSet.tablePivot).toHaveBeenCalledTimes(1)
    })

    it('should process new query results (different rawData reference)', () => {
      // First result
      const firstRawData = [{ 'Users.name': 'Alice' }]
      const firstResultSet = {
        ...mockResultSet,
        rawData: () => firstRawData
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: firstResultSet,
        rawData: firstRawData,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result, rerender } = renderHook(() => useFilterValues('Users.name'))

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])

      // New rawData reference - should reprocess
      const secondRawData = [{ 'Users.name': 'Eve' }]
      const secondResultSet = {
        ...mockResultSet,
        rawData: () => secondRawData
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: secondResultSet,
        rawData: secondRawData,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
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

      expect(mockUseCubeLoadQuery).toHaveBeenCalledWith(
        {
          dimensions: ['Users.name'],
          limit: 25,
          order: { 'Users.name': 'asc' }
        },
        {
          skip: false,
          debounceMs: 150,
          keepPreviousData: true
        }
      )
    })

    it('should not refetch when field is null', () => {
      const { result } = renderHook(() => useFilterValues(null))

      act(() => {
        result.current.refetch()
      })

      // Should still be skipping
      expect(mockUseCubeLoadQuery).toHaveBeenLastCalledWith(null, {
        skip: true,
        debounceMs: 150,
        keepPreviousData: true
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

      expect(mockUseCubeLoadQuery).toHaveBeenCalledWith(
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
          debounceMs: 150,
          keepPreviousData: true
        }
      )
    })

    it('should create query without filter when search term is empty', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.searchValues('', true)
      })

      expect(mockUseCubeLoadQuery).toHaveBeenLastCalledWith(
        {
          dimensions: ['Users.name'],
          limit: 25,
          order: { 'Users.name': 'asc' }
        },
        {
          skip: false,
          debounceMs: 150,
          keepPreviousData: true
        }
      )
    })

    it('should trim whitespace from search terms', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      act(() => {
        result.current.searchValues('  Alice  ')
      })

      expect(mockUseCubeLoadQuery).toHaveBeenCalledWith(
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

      const firstCallCount = mockUseCubeLoadQuery.mock.calls.length

      // Same search - should not create new query
      act(() => {
        result.current.searchValues('Alice')
      })

      expect(mockUseCubeLoadQuery.mock.calls.length).toBe(firstCallCount)
    })

    it('should force new query when force parameter is true', () => {
      const { result } = renderHook(() => useFilterValues('Users.name'))

      // First search
      act(() => {
        result.current.searchValues('Alice')
      })

      const firstCallCount = mockUseCubeLoadQuery.mock.calls.length

      // Same search with force=true - should create new query
      act(() => {
        result.current.searchValues('Alice', true)
      })

      expect(mockUseCubeLoadQuery.mock.calls.length).toBe(firstCallCount + 1)
    })

    it('should not search when field is null', () => {
      const { result } = renderHook(() => useFilterValues(null))

      act(() => {
        result.current.searchValues('test')
      })

      // Should still be skipping
      expect(mockUseCubeLoadQuery).toHaveBeenLastCalledWith(null, {
        skip: true,
        debounceMs: 150,
        keepPreviousData: true
      })
    })

    it('should handle search errors gracefully', () => {
      // Test what happens when the search query results in an error from the API
      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: null,
        rawData: null,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: new Error('Search API error'),
        debouncedQuery: null,
        isValidQuery: false,
        refetch: vi.fn(),
        clearCache: vi.fn()
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

      expect(mockUseCubeLoadQuery).toHaveBeenCalledWith(
        {
          dimensions: ['Users.email'],
          limit: 25,
          order: { 'Users.email': 'asc' }
        },
        {
          skip: false,
          debounceMs: 150,
          keepPreviousData: true
        }
      )
    })

    it('should reset values when field becomes null', () => {
      const rawDataResult = [{ 'Users.name': 'Alice' }]
      const resultSetWithRawData = {
        ...mockResultSet,
        rawData: () => rawDataResult
      }

      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: resultSetWithRawData,
        rawData: rawDataResult,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: true,
        refetch: vi.fn(),
        clearCache: vi.fn()
      })

      const { result, rerender } = renderHook(
        ({ fieldName }) => useFilterValues(fieldName),
        {
          initialProps: { fieldName: 'Users.name' }
        }
      )

      expect(result.current.values).toEqual(['Alice', 'Bob', 'Charlie', 'David'])

      // Change field to null
      mockUseCubeLoadQuery.mockReturnValue({
        resultSet: null,
        rawData: null,
        isLoading: false,
        isFetching: false,
        isDebouncing: false,
        error: null,
        debouncedQuery: null,
        isValidQuery: false,
        refetch: vi.fn(),
        clearCache: vi.fn()
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

      expect(mockUseCubeLoadQuery).toHaveBeenLastCalledWith(null, {
        skip: true, // Still true because no query has been set yet
        debounceMs: 150,
        keepPreviousData: true
      })
    })
  })
})
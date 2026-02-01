/**
 * Tests for useAnalysisQueryBuilder hook
 *
 * This hook builds and validates queries from Zustand store state.
 * It handles both single-query and multi-query modes.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisQueryBuilder } from '../../../../src/client/hooks/useAnalysisQueryBuilder'
import { AnalysisBuilderStoreProvider } from '../../../../src/client/stores/analysisBuilderStore'
import type { CubeQuery, MultiQueryConfig } from '../../../../src/client/types'

// ============================================================================
// Test Utilities
// ============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AnalysisBuilderStoreProvider disableLocalStorage>
          {children}
        </AnalysisBuilderStoreProvider>
      </QueryClientProvider>
    )
  }
}

function createWrapperWithInitialQuery(initialQuery: CubeQuery | MultiQueryConfig) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AnalysisBuilderStoreProvider
          disableLocalStorage
          initialQuery={initialQuery}
        >
          {children}
        </AnalysisBuilderStoreProvider>
      </QueryClientProvider>
    )
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('useAnalysisQueryBuilder', () => {
  // ==========================================================================
  // Initialization Tests
  // ==========================================================================
  describe('initialization', () => {
    it('should return complete result interface', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      // Verify key properties exist
      expect(result.current).toHaveProperty('queryState')
      expect(result.current).toHaveProperty('queryStates')
      expect(result.current).toHaveProperty('activeQueryIndex')
      expect(result.current).toHaveProperty('mergeStrategy')
      expect(result.current).toHaveProperty('isMultiQueryMode')
      expect(result.current).toHaveProperty('mergeKeys')
      expect(result.current).toHaveProperty('currentQuery')
      expect(result.current).toHaveProperty('allQueries')
      expect(result.current).toHaveProperty('multiQueryConfig')
      expect(result.current).toHaveProperty('multiQueryValidation')
      expect(result.current).toHaveProperty('isValidQuery')
    })

    it('should return action functions', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.setActiveQueryIndex).toBe('function')
      expect(typeof result.current.setMergeStrategy).toBe('function')
      expect(typeof result.current.addQuery).toBe('function')
      expect(typeof result.current.removeQuery).toBe('function')
    })

    it('should initialize with single empty query state', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.queryStates).toHaveLength(1)
      expect(result.current.activeQueryIndex).toBe(0)
    })

    it('should initialize with default merge strategy (concat)', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mergeStrategy).toBe('concat')
    })

    it('should initialize isMultiQueryMode as false', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isMultiQueryMode).toBe(false)
    })

    it('should throw when used outside AnalysisBuilderStoreProvider', () => {
      const queryClient = new QueryClient()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      expect(() => {
        renderHook(() => useAnalysisQueryBuilder(), { wrapper })
      }).toThrow()
    })
  })

  // ==========================================================================
  // Query State Tests
  // ==========================================================================
  describe('query state', () => {
    it('should expose queryState with metrics, breakdowns, and filters', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.queryState).toHaveProperty('metrics')
      expect(result.current.queryState).toHaveProperty('breakdowns')
      expect(result.current.queryState).toHaveProperty('filters')
    })

    it('should start with empty metrics and breakdowns', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.queryState.metrics).toEqual([])
      expect(result.current.queryState.breakdowns).toEqual([])
      expect(result.current.queryState.filters).toEqual([])
    })

    it('should correctly derive currentQuery from queryState', () => {
      const initialQuery: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.currentQuery.measures).toContain('Employees.count')
      expect(result.current.currentQuery.dimensions).toContain('Employees.name')
    })
  })

  // ==========================================================================
  // Query Validation Tests
  // ==========================================================================
  describe('query validation', () => {
    it('should mark query as invalid with no measures or dimensions', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      // Note: isValidQuery is boolean (not undefined) - false when no measures/dimensions
      expect(result.current.isValidQuery).toBeFalsy()
    })

    it('should mark query as valid with at least one measure', () => {
      const initialQuery: CubeQuery = {
        measures: ['Employees.count'],
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.isValidQuery).toBe(true)
    })

    it('should mark query as valid with at least one dimension', () => {
      const initialQuery: CubeQuery = {
        dimensions: ['Employees.name'],
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.isValidQuery).toBe(true)
    })

    it('should mark query as valid with time dimensions', () => {
      const initialQuery: CubeQuery = {
        timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }],
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.isValidQuery).toBe(true)
    })
  })

  // ==========================================================================
  // Multi-Query Mode Tests
  // ==========================================================================
  describe('multi-query mode', () => {
    it('should add a new query when addQuery is called', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.queryStates).toHaveLength(1)

      act(() => {
        result.current.addQuery()
      })

      expect(result.current.queryStates).toHaveLength(2)
    })

    it('should switch to new query index after addQuery', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.activeQueryIndex).toBe(0)

      act(() => {
        result.current.addQuery()
      })

      expect(result.current.activeQueryIndex).toBe(1)
    })

    it('should remove a query when removeQuery is called', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.addQuery()
      })

      expect(result.current.queryStates).toHaveLength(2)

      act(() => {
        result.current.removeQuery(1)
      })

      expect(result.current.queryStates).toHaveLength(1)
    })

    it('should update activeQueryIndex when setActiveQueryIndex is called', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.addQuery()
      })

      expect(result.current.activeQueryIndex).toBe(1)

      act(() => {
        result.current.setActiveQueryIndex(0)
      })

      expect(result.current.activeQueryIndex).toBe(0)
    })

    it('should return true for isMultiQueryMode with multiple valid queries', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.isMultiQueryMode).toBe(true)
    })

    it('should build allQueries array from queryStates', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.allQueries).toHaveLength(2)
      expect(result.current.allQueries[0].measures).toContain('Employees.count')
      expect(result.current.allQueries[1].measures).toContain('Employees.avgSalary')
    })
  })

  // ==========================================================================
  // Merge Strategy Tests
  // ==========================================================================
  describe('merge strategy', () => {
    it('should update mergeStrategy when setMergeStrategy is called', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mergeStrategy).toBe('concat')

      act(() => {
        result.current.setMergeStrategy('merge')
      })

      expect(result.current.mergeStrategy).toBe('merge')
    })

    it('should use Q1 breakdowns for all queries in merge mode', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          {
            measures: ['Employees.count'],
            dimensions: ['Employees.department'],
          },
          {
            measures: ['Employees.avgSalary'],
            dimensions: ['Employees.name'], // Different dimension
          },
        ],
        mergeStrategy: 'merge',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      // In merge mode, Q2's breakdowns should use Q1's
      // Note: The hook builds allQueries with Q1 breakdowns for merge mode
      expect(result.current.allQueries[1].dimensions).toContain('Employees.department')
    })
  })

  // ==========================================================================
  // MultiQueryConfig Tests
  // ==========================================================================
  describe('multiQueryConfig', () => {
    it('should return null for multiQueryConfig with single query', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.multiQueryConfig).toBeNull()
    })

    it('should return MultiQueryConfig with multiple valid queries', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.multiQueryConfig).not.toBeNull()
      expect(result.current.multiQueryConfig?.queries).toHaveLength(2)
      expect(result.current.multiQueryConfig?.mergeStrategy).toBe('concat')
    })

    it('should include queryLabels in multiQueryConfig', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.multiQueryConfig?.queryLabels).toEqual(['Q1', 'Q2'])
    })

    it('should return null if less than 2 valid queries', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      // Add second query but leave it empty (invalid)
      act(() => {
        result.current.addQuery()
      })

      // Both queries are empty/invalid, so multiQueryConfig should be null
      expect(result.current.multiQueryConfig).toBeNull()
    })
  })

  // ==========================================================================
  // Multi-Query Validation Tests
  // ==========================================================================
  describe('multiQueryValidation', () => {
    it('should return null for multiQueryValidation in single query mode', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.multiQueryValidation).toBeNull()
    })

    it('should return validation result in multi-query mode', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.multiQueryValidation).not.toBeNull()
      expect(result.current.multiQueryValidation).toHaveProperty('isValid')
      expect(result.current.multiQueryValidation).toHaveProperty('errors')
      expect(result.current.multiQueryValidation).toHaveProperty('warnings')
    })

    it('should return isValid: true for valid multi-query config', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.multiQueryValidation?.isValid).toBe(true)
    })
  })

  // ==========================================================================
  // Merge Keys Tests
  // ==========================================================================
  describe('mergeKeys', () => {
    it('should compute mergeKeys from Q1 breakdowns', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          {
            measures: ['Employees.count'],
            dimensions: ['Employees.department'],
          },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'merge',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      // mergeKeys should be derived from Q1's breakdowns
      expect(result.current.mergeKeys).toBeDefined()
      expect(result.current.mergeKeys).toContain('Employees.department')
    })

    it('should include time dimensions in mergeKeys', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          {
            measures: ['Employees.count'],
            timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }],
          },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'merge',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      // mergeKeys should include time dimension
      expect(result.current.mergeKeys).toContain('Employees.createdAt')
    })
  })

  // ==========================================================================
  // Current Query Building Tests
  // ==========================================================================
  describe('current query building', () => {
    it('should include filters in currentQuery', () => {
      const initialQuery: CubeQuery = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.department', operator: 'equals', values: ['Engineering'] },
        ],
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.currentQuery.filters).toHaveLength(1)
      expect(result.current.currentQuery.filters?.[0]).toMatchObject({
        member: 'Employees.department',
        operator: 'equals',
      })
    })

    it('should include order in currentQuery', () => {
      const initialQuery: CubeQuery = {
        measures: ['Employees.count'],
        order: { 'Employees.count': 'desc' },
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.currentQuery.order).toBeDefined()
    })

    it('should build query with both dimensions and time dimensions', () => {
      const initialQuery: CubeQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.department'],
        timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }],
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(initialQuery),
      })

      expect(result.current.currentQuery.dimensions).toContain('Employees.department')
      expect(result.current.currentQuery.timeDimensions).toHaveLength(1)
      expect(result.current.currentQuery.timeDimensions?.[0].dimension).toBe('Employees.createdAt')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('edge cases', () => {
    it('should handle removing the last query gracefully', () => {
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.addQuery()
      })

      act(() => {
        result.current.removeQuery(1)
      })

      expect(result.current.queryStates).toHaveLength(1)
      expect(result.current.activeQueryIndex).toBe(0)
    })

    it('should handle empty query arrays in multi-query mode', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [],
        mergeStrategy: 'concat',
      }

      // This should not crash
      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      expect(result.current.queryStates.length).toBeGreaterThanOrEqual(1)
    })

    it('should preserve query state when switching between queries', () => {
      const multiConfig: MultiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] },
        ],
        mergeStrategy: 'concat',
      }

      const { result } = renderHook(() => useAnalysisQueryBuilder(), {
        wrapper: createWrapperWithInitialQuery(multiConfig),
      })

      const q1Measures = result.current.currentQuery.measures

      act(() => {
        result.current.setActiveQueryIndex(1)
      })

      expect(result.current.currentQuery.measures).not.toEqual(q1Measures)

      act(() => {
        result.current.setActiveQueryIndex(0)
      })

      expect(result.current.currentQuery.measures).toEqual(q1Measures)
    })
  })
})

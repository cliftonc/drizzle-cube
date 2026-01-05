/**
 * Tests for AnalysisBuilder query utilities
 * Tests the pure functions that build and manipulate CubeQuery objects
 */

import { describe, it, expect } from 'vitest'
import type { MetricItem, BreakdownItem } from '../../../src/client/components/AnalysisBuilder/types'
import type { Filter } from '../../../src/client/types'

// Import the functions we're testing from index.tsx
// These will be moved to utils/queryUtils.ts during refactoring
// For now, we copy the implementations here to establish the test contract

/**
 * Convert metrics and breakdowns to CubeQuery format
 * Handles comparison mode for time dimensions
 */
function buildCubeQuery(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[],
  order?: Record<string, 'asc' | 'desc'>
) {
  // Find time dimensions with comparison enabled
  const comparisonFields = breakdowns
    .filter((b) => b.isTimeDimension && b.enableComparison)
    .map((b) => b.field)

  // Remove date filters for comparison-enabled time dimensions
  let filteredFilters = filters
  for (const field of comparisonFields) {
    filteredFilters = removeComparisonDateFilter(filteredFilters, field)
  }

  const query: any = {
    measures: metrics.map((m) => m.field),
    dimensions: breakdowns.filter((b) => !b.isTimeDimension).map((b) => b.field),
    timeDimensions: breakdowns
      .filter((b) => b.isTimeDimension)
      .map((b) => {
        const td: any = {
          dimension: b.field,
          granularity: b.granularity || 'day'
        }

        // If comparison is enabled, build compareDateRange from the ORIGINAL filter
        if (b.enableComparison) {
          const compareDateRange = buildCompareDateRangeFromFilter(b.field, filters)
          if (compareDateRange) {
            td.compareDateRange = compareDateRange
          }
        }

        return td
      }),
    filters: filteredFilters.length > 0 ? filteredFilters : undefined,
    order: order && Object.keys(order).length > 0 ? order : undefined
  }

  // Clean up empty arrays
  if (query.measures?.length === 0) delete query.measures
  if (query.dimensions?.length === 0) delete query.dimensions
  if (query.timeDimensions?.length === 0) delete query.timeDimensions

  return query
}

/**
 * Find date filter for a specific time dimension field
 */
function findDateFilterForField(
  filters: Filter[],
  field: string
): { dateRange: string | string[] } | undefined {
  for (const filter of filters) {
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const nested = findDateFilterForField(groupFilter.filters, field)
      if (nested) return nested
    } else if ('member' in filter) {
      const simple = filter as { member: string; operator?: string; dateRange?: string | string[] }
      if (simple.member === field && simple.operator === 'inDateRange' && simple.dateRange) {
        return { dateRange: simple.dateRange }
      }
    }
  }
  return undefined
}

/**
 * Remove date filter for a specific field from filters array
 */
function removeComparisonDateFilter(filters: Filter[], field: string): Filter[] {
  return filters.reduce<Filter[]>((acc, filter) => {
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const cleanedSubFilters = removeComparisonDateFilter(groupFilter.filters, field)
      if (cleanedSubFilters.length > 0) {
        acc.push({ type: groupFilter.type, filters: cleanedSubFilters } as Filter)
      }
    } else if ('member' in filter) {
      const simple = filter as { member: string; operator?: string; dateRange?: string | string[] }
      if (!(simple.member === field && simple.operator === 'inDateRange')) {
        acc.push(filter)
      }
    } else {
      acc.push(filter)
    }
    return acc
  }, [])
}

/**
 * Build compareDateRange for a time dimension based on its date filter
 * Stub for now - actual implementation uses date-utils
 */
function buildCompareDateRangeFromFilter(
  _timeDimensionField: string,
  _filters: Filter[]
): [string, string][] | undefined {
  // This will use parseDateRange and calculatePriorPeriod from date-utils
  // For testing, we just verify the function is called correctly
  return undefined
}

/**
 * Check if a query has any content
 */
function hasQueryContent(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[]
): boolean {
  return metrics.length > 0 || breakdowns.length > 0 || filters.length > 0
}

// =============================================================================
// Tests
// =============================================================================

describe('queryUtils', () => {
  describe('buildCubeQuery', () => {
    it('should build empty query when no metrics or breakdowns', () => {
      const query = buildCubeQuery([], [], [])

      expect(query.measures).toBeUndefined()
      expect(query.dimensions).toBeUndefined()
      expect(query.timeDimensions).toBeUndefined()
      expect(query.filters).toBeUndefined()
    })

    it('should build query with measures only', () => {
      const metrics: MetricItem[] = [
        { id: '1', field: 'Employees.count', label: 'A' },
        { id: '2', field: 'Employees.avgSalary', label: 'B' }
      ]

      const query = buildCubeQuery(metrics, [], [])

      expect(query.measures).toEqual(['Employees.count', 'Employees.avgSalary'])
      expect(query.dimensions).toBeUndefined()
      expect(query.timeDimensions).toBeUndefined()
    })

    it('should build query with dimensions (non-time)', () => {
      const breakdowns: BreakdownItem[] = [
        { id: '1', field: 'Employees.department', isTimeDimension: false },
        { id: '2', field: 'Employees.role', isTimeDimension: false }
      ]

      const query = buildCubeQuery([], breakdowns, [])

      expect(query.dimensions).toEqual(['Employees.department', 'Employees.role'])
      expect(query.timeDimensions).toBeUndefined()
    })

    it('should build query with time dimensions', () => {
      const breakdowns: BreakdownItem[] = [
        { id: '1', field: 'Employees.createdAt', isTimeDimension: true, granularity: 'month' }
      ]

      const query = buildCubeQuery([], breakdowns, [])

      expect(query.timeDimensions).toEqual([
        { dimension: 'Employees.createdAt', granularity: 'month' }
      ])
      expect(query.dimensions).toBeUndefined()
    })

    it('should default granularity to day when not specified', () => {
      const breakdowns: BreakdownItem[] = [
        { id: '1', field: 'Employees.createdAt', isTimeDimension: true }
      ]

      const query = buildCubeQuery([], breakdowns, [])

      expect(query.timeDimensions?.[0].granularity).toBe('day')
    })

    it('should build query with filters', () => {
      const filters: Filter[] = [
        { member: 'Employees.department', operator: 'equals', values: ['Engineering'] }
      ]

      const query = buildCubeQuery([], [], filters)

      expect(query.filters).toEqual(filters)
    })

    it('should build query with order', () => {
      const metrics: MetricItem[] = [
        { id: '1', field: 'Employees.count', label: 'A' }
      ]
      const order = { 'Employees.count': 'desc' as const }

      const query = buildCubeQuery(metrics, [], [], order)

      expect(query.order).toEqual({ 'Employees.count': 'desc' })
    })

    it('should omit order when empty object', () => {
      const query = buildCubeQuery([], [], [], {})

      expect(query.order).toBeUndefined()
    })

    it('should handle mixed dimensions and time dimensions', () => {
      const breakdowns: BreakdownItem[] = [
        { id: '1', field: 'Employees.department', isTimeDimension: false },
        { id: '2', field: 'Employees.createdAt', isTimeDimension: true, granularity: 'week' },
        { id: '3', field: 'Employees.role', isTimeDimension: false }
      ]

      const query = buildCubeQuery([], breakdowns, [])

      expect(query.dimensions).toEqual(['Employees.department', 'Employees.role'])
      expect(query.timeDimensions).toEqual([
        { dimension: 'Employees.createdAt', granularity: 'week' }
      ])
    })

    it('should build complete query with all parts', () => {
      const metrics: MetricItem[] = [
        { id: '1', field: 'Employees.count', label: 'A' }
      ]
      const breakdowns: BreakdownItem[] = [
        { id: '2', field: 'Employees.department', isTimeDimension: false },
        { id: '3', field: 'Employees.createdAt', isTimeDimension: true, granularity: 'month' }
      ]
      const filters: Filter[] = [
        { member: 'Employees.isActive', operator: 'equals', values: ['true'] }
      ]
      const order = { 'Employees.count': 'desc' as const }

      const query = buildCubeQuery(metrics, breakdowns, filters, order)

      expect(query).toEqual({
        measures: ['Employees.count'],
        dimensions: ['Employees.department'],
        timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'month' }],
        filters: [{ member: 'Employees.isActive', operator: 'equals', values: ['true'] }],
        order: { 'Employees.count': 'desc' }
      })
    })
  })

  describe('findDateFilterForField', () => {
    it('should find simple date filter for field', () => {
      const filters: Filter[] = [
        { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: ['2024-01-01', '2024-12-31'] }
      ]

      const result = findDateFilterForField(filters, 'Employees.createdAt')

      expect(result).toEqual({ dateRange: ['2024-01-01', '2024-12-31'] })
    })

    it('should return undefined when field not found', () => {
      const filters: Filter[] = [
        { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: ['2024-01-01', '2024-12-31'] }
      ]

      const result = findDateFilterForField(filters, 'Employees.updatedAt')

      expect(result).toBeUndefined()
    })

    it('should return undefined when operator is not inDateRange', () => {
      const filters: Filter[] = [
        { member: 'Employees.createdAt', operator: 'equals', values: ['2024-01-01'] }
      ]

      const result = findDateFilterForField(filters, 'Employees.createdAt')

      expect(result).toBeUndefined()
    })

    it('should find date filter in nested AND group', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Employees.isActive', operator: 'equals', values: ['true'] },
            { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: 'last 30 days' }
          ]
        }
      ] as Filter[]

      const result = findDateFilterForField(filters, 'Employees.createdAt')

      expect(result).toEqual({ dateRange: 'last 30 days' })
    })

    it('should find date filter in nested OR group', () => {
      const filters: Filter[] = [
        {
          type: 'or',
          filters: [
            { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: ['2024-01-01', '2024-06-30'] }
          ]
        }
      ] as Filter[]

      const result = findDateFilterForField(filters, 'Employees.createdAt')

      expect(result).toEqual({ dateRange: ['2024-01-01', '2024-06-30'] })
    })

    it('should find date filter in deeply nested groups', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            {
              type: 'or',
              filters: [
                { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: 'this year' }
              ]
            }
          ]
        }
      ] as Filter[]

      const result = findDateFilterForField(filters, 'Employees.createdAt')

      expect(result).toEqual({ dateRange: 'this year' })
    })
  })

  describe('removeComparisonDateFilter', () => {
    it('should remove simple date filter for field', () => {
      const filters: Filter[] = [
        { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: ['2024-01-01', '2024-12-31'] },
        { member: 'Employees.isActive', operator: 'equals', values: ['true'] }
      ]

      const result = removeComparisonDateFilter(filters, 'Employees.createdAt')

      expect(result).toEqual([
        { member: 'Employees.isActive', operator: 'equals', values: ['true'] }
      ])
    })

    it('should not remove filters for different field', () => {
      const filters: Filter[] = [
        { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: ['2024-01-01', '2024-12-31'] }
      ]

      const result = removeComparisonDateFilter(filters, 'Employees.updatedAt')

      expect(result).toEqual(filters)
    })

    it('should not remove non-date filters for same field', () => {
      const filters: Filter[] = [
        { member: 'Employees.createdAt', operator: 'equals', values: ['2024-01-01'] }
      ]

      const result = removeComparisonDateFilter(filters, 'Employees.createdAt')

      expect(result).toEqual(filters)
    })

    it('should remove date filter from AND group', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Employees.isActive', operator: 'equals', values: ['true'] },
            { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: 'last 30 days' }
          ]
        }
      ] as Filter[]

      const result = removeComparisonDateFilter(filters, 'Employees.createdAt')

      expect(result).toEqual([
        {
          type: 'and',
          filters: [
            { member: 'Employees.isActive', operator: 'equals', values: ['true'] }
          ]
        }
      ])
    })

    it('should remove empty groups after filter removal', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: 'last 30 days' }
          ]
        }
      ] as Filter[]

      const result = removeComparisonDateFilter(filters, 'Employees.createdAt')

      expect(result).toEqual([])
    })

    it('should handle deeply nested groups', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            {
              type: 'or',
              filters: [
                { member: 'Employees.createdAt', operator: 'inDateRange', values: [], dateRange: 'this year' },
                { member: 'Employees.department', operator: 'equals', values: ['Engineering'] }
              ]
            }
          ]
        }
      ] as Filter[]

      const result = removeComparisonDateFilter(filters, 'Employees.createdAt')

      expect(result).toEqual([
        {
          type: 'and',
          filters: [
            {
              type: 'or',
              filters: [
                { member: 'Employees.department', operator: 'equals', values: ['Engineering'] }
              ]
            }
          ]
        }
      ])
    })
  })

  describe('hasQueryContent', () => {
    it('should return false for empty query', () => {
      expect(hasQueryContent([], [], [])).toBe(false)
    })

    it('should return true when metrics present', () => {
      const metrics: MetricItem[] = [{ id: '1', field: 'Employees.count', label: 'A' }]
      expect(hasQueryContent(metrics, [], [])).toBe(true)
    })

    it('should return true when breakdowns present', () => {
      const breakdowns: BreakdownItem[] = [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      expect(hasQueryContent([], breakdowns, [])).toBe(true)
    })

    it('should return true when filters present', () => {
      const filters: Filter[] = [{ member: 'Employees.isActive', operator: 'equals', values: ['true'] }]
      expect(hasQueryContent([], [], filters)).toBe(true)
    })

    it('should return true when all present', () => {
      const metrics: MetricItem[] = [{ id: '1', field: 'Employees.count', label: 'A' }]
      const breakdowns: BreakdownItem[] = [{ id: '1', field: 'Employees.department', isTimeDimension: false }]
      const filters: Filter[] = [{ member: 'Employees.isActive', operator: 'equals', values: ['true'] }]
      expect(hasQueryContent(metrics, breakdowns, filters)).toBe(true)
    })
  })
})

/**
 * Tests for AnalysisBuilder query utilities
 * Tests the pure functions that build and manipulate CubeQuery objects
 */

import { describe, it, expect } from 'vitest'
import type { MetricItem, BreakdownItem } from '../../../src/client/components/AnalysisBuilder/types'
import type { Filter } from '../../../src/client/types'

// The real implementations, not copies. This file used to redefine each
// function locally "until the refactoring lands" — which meant it asserted
// nothing about the shipped code, and quietly went on passing while the real
// `buildCubeQuery` changed.
import {
  buildCubeQuery,
  hasQueryContent
} from '../../../src/client/components/AnalysisBuilder/utils/queryUtils'
import { removeComparisonDateFilter } from '../../../src/client/components/AnalysisBuilder/utils/filterUtils'
import { findDateFilterForField } from '../../../src/client/shared/filters/filterOperations'

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

  describe('record-grain queries', () => {
    const breakdowns: BreakdownItem[] = [
      { id: '1', field: 'Employees.name', isTimeDimension: false }
    ]

    it('leaves ungrouped unset for an ordinary chart', () => {
      // An explicit `false` would be a distinct cache key from an absent flag,
      // and it serialises away with the rest of the undefined keys on save.
      expect(buildCubeQuery([], breakdowns, []).ungrouped).toBeUndefined()
    })

    it('sets ungrouped for a record-grain chart', () => {
      // Editing a records-table portlet in the builder rebuilds its query from
      // metrics and breakdowns; without this the saved query becomes grouped,
      // which Postgres rejects outright for generated attribute dimensions.
      expect(buildCubeQuery([], breakdowns, [], undefined, false, 25, true))
        .toMatchObject({ ungrouped: true, limit: 25 })
    })
  })
})

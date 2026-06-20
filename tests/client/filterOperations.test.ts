/**
 * Tests for the shared filter module (src/client/shared/filters).
 *
 * Covers operator metadata, type guards, creation, traversal, structural
 * grouping manipulation (add/remove/toggle), member extraction, server-format
 * transforms, and cube validation — the logic both filter surfaces consume.
 */

import { describe, it, expect } from 'vitest'
import {
  // operators
  FILTER_OPERATORS,
  getAvailableOperators,
  normalizeFilterFieldType,
  // type guards
  isSimpleFilter,
  isGroupFilter,
  isAndFilter,
  isOrFilter,
  // creation
  createSimpleFilter,
  createAndFilter,
  createOrFilter,
  // traversal
  flattenFilters,
  countFilters,
  extractFilterMembers,
  // structural manipulation
  addFilterAtPath,
  removeFilterAtIndex,
  toggleGroupType,
  findDateFilterForField,
  removeFilterForMember,
  // transforms
  transformFiltersForServer,
  transformFiltersFromServer,
  // validation
  validateFilterForCube
} from '../../src/client/shared/filters'
import type { Filter, SimpleFilter, GroupFilter, CubeMeta } from '../../src/client/types'

function simple(member: string, operator: string = 'equals', values: any[] = ['v']): SimpleFilter {
  return { member, operator: operator as any, values }
}

describe('shared/filters', () => {
  describe('getAvailableOperators', () => {
    const names = (fieldType: string) => getAvailableOperators(fieldType).map(o => o.operator)

    it('returns {operator, label} entries with i18n key labels', () => {
      const ops = getAvailableOperators('string')
      expect(ops.length).toBeGreaterThan(0)
      for (const op of ops) {
        expect(typeof op.operator).toBe('string')
        expect(op.label).toBe(FILTER_OPERATORS[op.operator as keyof typeof FILTER_OPERATORS].label)
        expect(op.label.startsWith('filter.operator.')).toBe(true)
      }
    })

    it('offers string operators for string fields, not numeric/date ones', () => {
      const ops = names('string')
      expect(ops).toEqual(expect.arrayContaining(['equals', 'contains', 'startsWith', 'in', 'set']))
      expect(ops).not.toContain('gt')
      expect(ops).not.toContain('inDateRange')
    })

    it('offers comparison operators for number fields, not string ones', () => {
      const ops = names('number')
      expect(ops).toEqual(expect.arrayContaining(['equals', 'gt', 'gte', 'between', 'in']))
      expect(ops).not.toContain('contains')
    })

    it('offers date operators for time fields', () => {
      const ops = names('time')
      expect(ops).toEqual(expect.arrayContaining(['inDateRange', 'beforeDate', 'afterDate', 'equals', 'set']))
      expect(ops).not.toContain('contains')
    })

    it('treats measure aggregation types as numeric (regression: countDistinct had no operators)', () => {
      for (const aggType of ['count', 'countDistinct', 'countDistinctApprox', 'sum', 'avg', 'median', 'stddev', 'calculated', 'movingAvg', 'runningTotal', 'rank']) {
        const ops = names(aggType)
        expect(ops, aggType).toEqual(expect.arrayContaining(['equals', 'gt', 'between', 'in', 'set']))
        expect(ops, aggType).not.toContain('contains')
      }
    })
  })

  describe('normalizeFilterFieldType', () => {
    it('keeps string, time, and boolean field types', () => {
      expect(normalizeFilterFieldType('string')).toBe('string')
      expect(normalizeFilterFieldType('time')).toBe('time')
      expect(normalizeFilterFieldType('boolean')).toBe('boolean')
    })

    it('collapses numeric and measure aggregation types to number', () => {
      for (const t of ['number', 'count', 'countDistinct', 'sum', 'avg', 'median', 'stddev', 'calculated', 'lag', 'rows']) {
        expect(normalizeFilterFieldType(t), t).toBe('number')
      }
    })
  })

  describe('type guards', () => {
    it('distinguishes simple and group filters', () => {
      const s = simple('A.x')
      const g: GroupFilter = { type: 'and', filters: [s] }
      expect(isSimpleFilter(s)).toBe(true)
      expect(isSimpleFilter(g)).toBe(false)
      expect(isGroupFilter(g)).toBe(true)
      expect(isGroupFilter(s)).toBe(false)
    })

    it('distinguishes AND from OR groups', () => {
      const and: GroupFilter = { type: 'and', filters: [] }
      const or: GroupFilter = { type: 'or', filters: [] }
      expect(isAndFilter(and)).toBe(true)
      expect(isAndFilter(or)).toBe(false)
      expect(isOrFilter(or)).toBe(true)
      expect(isOrFilter(and)).toBe(false)
    })
  })

  describe('creation', () => {
    it('creates simple filters with defaults', () => {
      expect(createSimpleFilter('A.x')).toEqual({ member: 'A.x', operator: 'equals', values: [] })
      expect(createSimpleFilter('A.x', 'gt', [5])).toEqual({ member: 'A.x', operator: 'gt', values: [5] })
    })

    it('creates AND and OR groups', () => {
      expect(createAndFilter()).toEqual({ type: 'and', filters: [] })
      const s = simple('A.x')
      expect(createOrFilter([s])).toEqual({ type: 'or', filters: [s] })
    })
  })

  describe('flattenFilters / countFilters / extractFilterMembers', () => {
    const tree: Filter[] = [
      simple('A.x'),
      { type: 'and', filters: [simple('B.y'), { type: 'or', filters: [simple('C.z')] }] }
    ]

    it('flattens nested groups to their simple filters', () => {
      expect(flattenFilters(tree).map(f => f.member)).toEqual(['A.x', 'B.y', 'C.z'])
    })

    it('counts simple filters across the tree', () => {
      expect(countFilters(tree)).toBe(3)
      expect(countFilters([])).toBe(0)
    })

    it('extracts member names in traversal order', () => {
      expect(extractFilterMembers(tree)).toEqual(['A.x', 'B.y', 'C.z'])
    })
  })

  describe('addFilterAtPath', () => {
    it('adds to an empty root', () => {
      const result = addFilterAtPath([], [], simple('A.x'))
      expect(result).toEqual([simple('A.x')])
    })

    it('wraps a single bare filter in an AND group', () => {
      const existing = simple('A.x')
      const result = addFilterAtPath([existing], [], simple('B.y'))
      expect(result).toEqual([{ type: 'and', filters: [existing, simple('B.y')] }])
    })

    it('appends to a single existing root group', () => {
      const group: GroupFilter = { type: 'or', filters: [simple('A.x')] }
      const result = addFilterAtPath([group], [], simple('B.y'))
      expect(result).toEqual([{ type: 'or', filters: [simple('A.x'), simple('B.y')] }])
    })

    it('wraps multiple root filters in an AND group', () => {
      const result = addFilterAtPath([simple('A.x'), simple('B.y')], [], simple('C.z'))
      expect(result).toEqual([{ type: 'and', filters: [simple('A.x'), simple('B.y'), simple('C.z')] }])
    })

    it('adds into a nested group by path', () => {
      const tree: Filter[] = [{ type: 'and', filters: [simple('A.x')] }]
      const result = addFilterAtPath(tree, [0], simple('B.y'))
      expect(result).toEqual([{ type: 'and', filters: [simple('A.x'), simple('B.y')] }])
    })

    it('recurses into a deeper path', () => {
      const tree: Filter[] = [
        { type: 'and', filters: [simple('A.x'), { type: 'or', filters: [simple('B.y')] }] }
      ]
      const result = addFilterAtPath(tree, [0, 1], simple('C.z'))
      expect(result).toEqual([
        { type: 'and', filters: [simple('A.x'), { type: 'or', filters: [simple('B.y'), simple('C.z')] }] }
      ])
    })
  })

  describe('removeFilterAtIndex', () => {
    it('removes a filter by index', () => {
      expect(removeFilterAtIndex([simple('A.x'), simple('B.y')], 0)).toEqual([simple('B.y')])
    })

    it('unwraps a sole remaining single-filter group', () => {
      const tree: Filter[] = [simple('A.x'), { type: 'and', filters: [simple('B.y')] }]
      expect(removeFilterAtIndex(tree, 0)).toEqual([simple('B.y')])
    })

    it('does not unwrap a remaining group that still has multiple filters', () => {
      const group: GroupFilter = { type: 'and', filters: [simple('B.y'), simple('C.z')] }
      const tree: Filter[] = [simple('A.x'), group]
      expect(removeFilterAtIndex(tree, 0)).toEqual([group])
    })
  })

  describe('toggleGroupType', () => {
    it('toggles AND to OR and back, preserving filters immutably', () => {
      const and: GroupFilter = { type: 'and', filters: [simple('A.x')] }
      const toggled = toggleGroupType(and)
      expect(toggled).toEqual({ type: 'or', filters: [simple('A.x')] })
      expect(and.type).toBe('and') // original untouched
      expect(toggleGroupType(toggled).type).toBe('and')
    })
  })

  describe('findDateFilterForField', () => {
    it('finds an inDateRange filter nested inside groups', () => {
      const tree: Filter[] = [
        simple('A.x'),
        { type: 'and', filters: [{ ...simple('A.created', 'inDateRange', []), dateRange: 'last 7 days' }] }
      ]
      expect(findDateFilterForField(tree, 'A.created')).toEqual({ dateRange: 'last 7 days' })
    })

    it('returns undefined when no matching date filter exists', () => {
      expect(findDateFilterForField([simple('A.x')], 'A.created')).toBeUndefined()
    })
  })

  describe('removeFilterForMember', () => {
    it('removes only the matching operator when one is given', () => {
      const tree: Filter[] = [
        { ...simple('A.created', 'inDateRange', []), dateRange: 'last 7 days' },
        simple('A.created', 'equals', ['x'])
      ]
      const result = removeFilterForMember(tree, 'A.created', 'inDateRange')
      expect(result).toEqual([simple('A.created', 'equals', ['x'])])
    })

    it('removes all filters for a member when no operator is given', () => {
      const tree: Filter[] = [simple('A.created', 'equals'), simple('B.y')]
      expect(removeFilterForMember(tree, 'A.created')).toEqual([simple('B.y')])
    })

    it('prunes groups that become empty', () => {
      const tree: Filter[] = [
        { type: 'and', filters: [{ ...simple('A.created', 'inDateRange', []), dateRange: 'today' }] }
      ]
      expect(removeFilterForMember(tree, 'A.created', 'inDateRange')).toEqual([])
    })
  })

  describe('server-format transforms', () => {
    it('transforms UI groups to legacy and/or server format', () => {
      const filters: Filter[] = [
        { type: 'and', filters: [simple('A.x'), { type: 'or', filters: [simple('B.y'), simple('C.z')] }] }
      ]
      expect(transformFiltersForServer(filters)).toEqual([
        { and: [simple('A.x'), { or: [simple('B.y'), simple('C.z')] }] }
      ])
    })

    it('round-trips through server and back to UI format', () => {
      const filters: Filter[] = [
        { type: 'and', filters: [simple('A.x'), { type: 'or', filters: [simple('B.y'), simple('C.z')] }] }
      ]
      const back = transformFiltersFromServer(transformFiltersForServer(filters))
      expect(back).toEqual(filters)
    })
  })

  describe('validateFilterForCube', () => {
    const cubeMeta: CubeMeta = {
      cubes: [
        {
          name: 'Sales',
          title: 'Sales',
          segments: [],
          measures: [
            { name: 'Sales.count', title: 'Sales.count', shortTitle: 'Sales.count', type: 'count' },
            { name: 'Sales.total', title: 'Sales.total', shortTitle: 'Sales.total', type: 'sum' }
          ],
          dimensions: [
            { name: 'Sales.category', title: 'Sales.category', shortTitle: 'Sales.category', type: 'string' },
            { name: 'Sales.region', title: 'Sales.region', shortTitle: 'Sales.region', type: 'string' }
          ]
        }
      ]
    }

    it('returns true when no metadata available (fail open)', () => {
      expect(validateFilterForCube(simple('Unknown.field'), null)).toBe(true)
    })

    it('returns true for a valid dimension filter', () => {
      expect(validateFilterForCube(simple('Sales.category', 'equals', ['A']), cubeMeta)).toBe(true)
    })

    it('returns true for a valid measure filter', () => {
      expect(validateFilterForCube(simple('Sales.count', 'equals', ['100']), cubeMeta)).toBe(true)
    })

    it('returns false for an invalid field', () => {
      expect(validateFilterForCube(simple('Unknown.field', 'equals', ['A']), cubeMeta)).toBe(false)
    })

    it('handles group filters recursively', () => {
      const filter: Filter = {
        type: 'and',
        filters: [simple('Sales.category', 'equals', ['A']), simple('Sales.region', 'equals', ['US'])]
      }
      expect(validateFilterForCube(filter, cubeMeta)).toBe(true)
    })

    it('returns false when all nested filters are invalid', () => {
      const filter: Filter = {
        type: 'and',
        filters: [simple('Unknown.field1', 'equals', ['A']), simple('Unknown.field2', 'equals', ['B'])]
      }
      expect(validateFilterForCube(filter, cubeMeta)).toBe(false)
    })
  })
})

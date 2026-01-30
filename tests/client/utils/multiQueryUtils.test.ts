/**
 * Tests for multiQueryUtils
 * Covers multi-query data merging, metadata detection, and query label generation
 */

import { describe, it, expect } from 'vitest'
import {
  isMultiQueryData,
  getQueryLabels,
  getQueryIndices,
  mergeResultsConcat,
  mergeResultsByKey,
  mergeQueryResults,
  getCombinedFields,
  generateQueryLabel,
  validateMergeKey
} from '../../../src/client/utils/multiQueryUtils'
import type { CubeResultSet, CubeQuery } from '../../../src/client/types'

// Helper to create mock CubeResultSet
function createMockResultSet(data: any[]): CubeResultSet {
  return {
    rawData: () => data,
    tablePivot: () => data,
    series: () => [],
    annotation: () => ({})
  }
}

describe('multiQueryUtils', () => {
  describe('isMultiQueryData', () => {
    it('should return true when data has __queryIndex', () => {
      const data = [{ __queryIndex: 0, __queryLabel: 'Query 1', value: 10 }]
      expect(isMultiQueryData(data)).toBe(true)
    })

    it('should return true for __queryIndex of 0', () => {
      const data = [{ __queryIndex: 0, value: 100 }]
      expect(isMultiQueryData(data)).toBe(true)
    })

    it('should return true for __queryIndex of higher values', () => {
      const data = [{ __queryIndex: 5, value: 100 }]
      expect(isMultiQueryData(data)).toBe(true)
    })

    it('should return false for data without __queryIndex', () => {
      const data = [{ value: 10 }]
      expect(isMultiQueryData(data)).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(isMultiQueryData([])).toBe(false)
    })

    it('should return false for null first element', () => {
      expect(isMultiQueryData([null as any])).toBe(false)
    })

    it('should return false for primitive first element', () => {
      expect(isMultiQueryData([42 as any])).toBe(false)
    })

    it('should return false for string first element', () => {
      expect(isMultiQueryData(['test' as any])).toBe(false)
    })
  })

  describe('getQueryLabels', () => {
    it('should extract unique query labels', () => {
      const data = [
        { __queryIndex: 0, __queryLabel: 'Revenue' },
        { __queryIndex: 0, __queryLabel: 'Revenue' },
        { __queryIndex: 1, __queryLabel: 'Cost' }
      ]
      expect(getQueryLabels(data)).toEqual(['Revenue', 'Cost'])
    })

    it('should preserve order of first occurrence', () => {
      const data = [
        { __queryIndex: 1, __queryLabel: 'Second' },
        { __queryIndex: 0, __queryLabel: 'First' },
        { __queryIndex: 1, __queryLabel: 'Second' }
      ]
      expect(getQueryLabels(data)).toEqual(['Second', 'First'])
    })

    it('should return empty array for non-multi-query data', () => {
      const data = [{ value: 100 }]
      expect(getQueryLabels(data)).toEqual([])
    })

    it('should return empty array for empty data', () => {
      expect(getQueryLabels([])).toEqual([])
    })

    it('should skip rows with non-string labels', () => {
      const data = [
        { __queryIndex: 0, __queryLabel: 'Valid' },
        { __queryIndex: 1, __queryLabel: 123 },
        { __queryIndex: 2, __queryLabel: null },
        { __queryIndex: 3 }
      ]
      expect(getQueryLabels(data)).toEqual(['Valid'])
    })

    it('should handle single query data', () => {
      const data = [
        { __queryIndex: 0, __queryLabel: 'Only Query', value: 100 }
      ]
      expect(getQueryLabels(data)).toEqual(['Only Query'])
    })

    it('should handle many unique labels', () => {
      const data = [
        { __queryIndex: 0, __queryLabel: 'Q1' },
        { __queryIndex: 1, __queryLabel: 'Q2' },
        { __queryIndex: 2, __queryLabel: 'Q3' },
        { __queryIndex: 3, __queryLabel: 'Q4' }
      ]
      expect(getQueryLabels(data)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    })
  })

  describe('getQueryIndices', () => {
    it('should extract and sort unique query indices', () => {
      const data = [
        { __queryIndex: 2 },
        { __queryIndex: 0 },
        { __queryIndex: 1 },
        { __queryIndex: 0 }
      ]
      expect(getQueryIndices(data)).toEqual([0, 1, 2])
    })

    it('should return empty array for non-multi-query data', () => {
      expect(getQueryIndices([{ value: 100 }])).toEqual([])
    })

    it('should return empty array for empty data', () => {
      expect(getQueryIndices([])).toEqual([])
    })

    it('should skip rows with non-numeric indices', () => {
      const data = [
        { __queryIndex: 0 },
        { __queryIndex: 'invalid' },
        { __queryIndex: 1 },
        { __queryIndex: null }
      ]
      expect(getQueryIndices(data)).toEqual([0, 1])
    })

    it('should handle single index', () => {
      const data = [
        { __queryIndex: 0 },
        { __queryIndex: 0 },
        { __queryIndex: 0 }
      ]
      expect(getQueryIndices(data)).toEqual([0])
    })

    it('should handle large indices', () => {
      const data = [
        { __queryIndex: 100 },
        { __queryIndex: 50 },
        { __queryIndex: 0 }
      ]
      expect(getQueryIndices(data)).toEqual([0, 50, 100])
    })
  })

  describe('mergeResultsConcat', () => {
    it('should concatenate results with query metadata', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', value: 100 }]),
        createMockResultSet([{ date: '2024-01', value: 200 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]

      const result = mergeResultsConcat(resultSets, queries)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        date: '2024-01',
        value: 100,
        __queryIndex: 0,
        __queryLabel: 'Query 1'
      })
      expect(result[1]).toEqual({
        date: '2024-01',
        value: 200,
        __queryIndex: 1,
        __queryLabel: 'Query 2'
      })
    })

    it('should use custom labels when provided', () => {
      const resultSets = [
        createMockResultSet([{ value: 100 }]),
        createMockResultSet([{ value: 200 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]
      const labels = ['Revenue', 'Costs']

      const result = mergeResultsConcat(resultSets, queries, labels)

      expect(result[0].__queryLabel).toBe('Revenue')
      expect(result[1].__queryLabel).toBe('Costs')
    })

    it('should handle multiple rows per result set', () => {
      const resultSets = [
        createMockResultSet([
          { date: '2024-01', value: 100 },
          { date: '2024-02', value: 110 }
        ]),
        createMockResultSet([
          { date: '2024-01', value: 50 },
          { date: '2024-02', value: 55 }
        ])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]

      const result = mergeResultsConcat(resultSets, queries)

      expect(result).toHaveLength(4)
      expect(result.filter((r: any) => r.__queryIndex === 0)).toHaveLength(2)
      expect(result.filter((r: any) => r.__queryIndex === 1)).toHaveLength(2)
    })

    it('should handle empty result sets', () => {
      const resultSets = [
        createMockResultSet([]),
        createMockResultSet([{ value: 100 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]

      const result = mergeResultsConcat(resultSets, queries)

      expect(result).toHaveLength(1)
      expect(result[0].__queryIndex).toBe(1)
    })

    it('should handle single result set', () => {
      const resultSets = [
        createMockResultSet([{ value: 100 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }]

      const result = mergeResultsConcat(resultSets, queries)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        value: 100,
        __queryIndex: 0,
        __queryLabel: 'Query 1'
      })
    })

    it('should fallback to default label when custom label is undefined', () => {
      const resultSets = [
        createMockResultSet([{ value: 100 }]),
        createMockResultSet([{ value: 200 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]
      const labels = ['Custom'] // Only first label provided

      const result = mergeResultsConcat(resultSets, queries, labels)

      expect(result[0].__queryLabel).toBe('Custom')
      expect(result[1].__queryLabel).toBe('Query 2')
    })

    it('should preserve all original row properties', () => {
      const resultSets = [
        createMockResultSet([{
          date: '2024-01',
          category: 'Electronics',
          revenue: 1000,
          units: 50
        }])
      ]
      const queries: CubeQuery[] = [{ measures: ['Sales.revenue'] }]

      const result = mergeResultsConcat(resultSets, queries)

      expect(result[0]).toMatchObject({
        date: '2024-01',
        category: 'Electronics',
        revenue: 1000,
        units: 50
      })
    })
  })

  describe('mergeResultsByKey', () => {
    it('should merge results by single key', () => {
      // Note: mergeResultsByKey uses measure names from query to extract values from raw data
      // So data must have keys matching the measure names
      const resultSets = [
        createMockResultSet([{ date: '2024-01', 'Sales.revenue': 100 }]),
        createMockResultSet([{ date: '2024-01', 'Sales.cost': 50 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        date: '2024-01',
        'Sales.revenue': 100,
        'Sales.cost': 50
      })
    })

    it('should merge results by composite key', () => {
      const resultSets = [
        createMockResultSet([
          { date: '2024-01', category: 'A', 'Sales.revenue': 100 }
        ]),
        createMockResultSet([
          { date: '2024-01', category: 'A', 'Sales.cost': 50 }
        ])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]

      const result = mergeResultsByKey(resultSets, queries, ['date', 'category'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        date: '2024-01',
        category: 'A',
        'Sales.revenue': 100,
        'Sales.cost': 50
      })
    })

    it('should handle non-matching keys', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', 'Sales.revenue': 100 }]),
        createMockResultSet([{ date: '2024-02', 'Sales.cost': 50 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result).toHaveLength(2)
      expect(result.find((r: any) => r.date === '2024-01')).toMatchObject({
        'Sales.revenue': 100
      })
      expect(result.find((r: any) => r.date === '2024-02')).toMatchObject({
        'Sales.cost': 50
      })
    })

    it('should sort results by first merge key', () => {
      const resultSets = [
        createMockResultSet([
          { date: '2024-03', revenue: 300 },
          { date: '2024-01', revenue: 100 },
          { date: '2024-02', revenue: 200 }
        ])
      ]
      const queries: CubeQuery[] = [{ measures: ['Sales.revenue'] }]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result[0].date).toBe('2024-01')
      expect(result[1].date).toBe('2024-02')
      expect(result[2].date).toBe('2024-03')
    })

    it('should use first value when same measure exists in multiple queries', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', 'Sales.revenue': 100 }]),
        createMockResultSet([{ date: '2024-01', 'Sales.revenue': 200 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.revenue'] }
      ]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      // First query's value wins
      expect(result[0]['Sales.revenue']).toBe(100)
    })

    it('should handle null and undefined key values', () => {
      const resultSets = [
        createMockResultSet([
          { date: null, revenue: 100 },
          { date: '2024-01', revenue: 200 }
        ])
      ]
      const queries: CubeQuery[] = [{ measures: ['Sales.revenue'] }]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result).toHaveLength(2)
    })

    it('should handle empty measures array', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', value: 100 }])
      ]
      const queries: CubeQuery[] = [{ measures: [] }]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01')
    })

    it('should handle undefined measures', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', value: 100 }])
      ]
      const queries: CubeQuery[] = [{}]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result).toHaveLength(1)
    })

    it('should copy extra dimensions from first query only', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', extra: 'from-first', revenue: 100 }]),
        createMockResultSet([{ date: '2024-01', extra: 'from-second', cost: 50 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result[0].extra).toBe('from-first')
    })

    it('should handle many result sets', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', m1: 1 }]),
        createMockResultSet([{ date: '2024-01', m2: 2 }]),
        createMockResultSet([{ date: '2024-01', m3: 3 }]),
        createMockResultSet([{ date: '2024-01', m4: 4 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['m1'] },
        { measures: ['m2'] },
        { measures: ['m3'] },
        { measures: ['m4'] }
      ]

      const result = mergeResultsByKey(resultSets, queries, ['date'])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ m1: 1, m2: 2, m3: 3, m4: 4 })
    })
  })

  describe('mergeQueryResults', () => {
    it('should return empty array for empty result sets', () => {
      const result = mergeQueryResults([], [], 'concat')
      expect(result).toEqual([])
    })

    it('should return raw data for single result set', () => {
      const rawData = [{ value: 100 }, { value: 200 }]
      const resultSets = [createMockResultSet(rawData)]
      const queries: CubeQuery[] = [{ measures: ['m1'] }]

      const result = mergeQueryResults(resultSets, queries, 'concat')

      expect(result).toBe(rawData)
    })

    it('should use concat strategy by default', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', value: 100 }]),
        createMockResultSet([{ date: '2024-01', value: 200 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]

      const result = mergeQueryResults(resultSets, queries, 'concat')

      expect(result).toHaveLength(2)
      expect((result[0] as any).__queryIndex).toBe(0)
      expect((result[1] as any).__queryIndex).toBe(1)
    })

    it('should use merge strategy when merge keys provided', () => {
      const resultSets = [
        createMockResultSet([{ date: '2024-01', 'Sales.revenue': 100 }]),
        createMockResultSet([{ date: '2024-01', 'Sales.cost': 50 }])
      ]
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.cost'] }
      ]

      const result = mergeQueryResults(resultSets, queries, 'merge', ['date'])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        date: '2024-01',
        'Sales.revenue': 100,
        'Sales.cost': 50
      })
    })

    it('should fallback to concat when merge strategy but no merge keys', () => {
      const resultSets = [
        createMockResultSet([{ value: 100 }]),
        createMockResultSet([{ value: 200 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]

      const result = mergeQueryResults(resultSets, queries, 'merge')

      expect(result).toHaveLength(2)
      expect((result[0] as any).__queryIndex).toBe(0)
    })

    it('should fallback to concat when merge strategy with empty merge keys', () => {
      const resultSets = [
        createMockResultSet([{ value: 100 }]),
        createMockResultSet([{ value: 200 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]

      const result = mergeQueryResults(resultSets, queries, 'merge', [])

      expect(result).toHaveLength(2)
      expect((result[0] as any).__queryIndex).toBeDefined()
    })

    it('should pass labels to concat strategy', () => {
      const resultSets = [
        createMockResultSet([{ value: 100 }]),
        createMockResultSet([{ value: 200 }])
      ]
      const queries: CubeQuery[] = [{ measures: ['m1'] }, { measures: ['m2'] }]
      const labels = ['First', 'Second']

      const result = mergeQueryResults(resultSets, queries, 'concat', undefined, labels)

      expect((result[0] as any).__queryLabel).toBe('First')
      expect((result[1] as any).__queryLabel).toBe('Second')
    })
  })

  describe('getCombinedFields', () => {
    it('should combine measures from all queries', () => {
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue', 'Sales.units'] },
        { measures: ['Sales.cost'] }
      ]

      const result = getCombinedFields(queries)

      expect(result.measures).toEqual(['Sales.revenue', 'Sales.units', 'Sales.cost'])
    })

    it('should deduplicate measures', () => {
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] },
        { measures: ['Sales.revenue', 'Sales.cost'] }
      ]

      const result = getCombinedFields(queries)

      expect(result.measures).toEqual(['Sales.revenue', 'Sales.cost'])
    })

    it('should combine dimensions from all queries', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.category'] },
        { measures: ['m2'], dimensions: ['Sales.region'] }
      ]

      const result = getCombinedFields(queries)

      expect(result.dimensions).toEqual(['Sales.category', 'Sales.region'])
    })

    it('should deduplicate dimensions', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.category'] },
        { measures: ['m2'], dimensions: ['Sales.category', 'Sales.region'] }
      ]

      const result = getCombinedFields(queries)

      expect(result.dimensions).toEqual(['Sales.category', 'Sales.region'])
    })

    it('should extract time dimensions', () => {
      const queries: CubeQuery[] = [
        {
          measures: ['m1'],
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        },
        {
          measures: ['m2'],
          timeDimensions: [{ dimension: 'Sales.updatedAt', granularity: 'week' }]
        }
      ]

      const result = getCombinedFields(queries)

      expect(result.timeDimensions).toEqual(['Sales.createdAt', 'Sales.updatedAt'])
    })

    it('should deduplicate time dimensions', () => {
      const queries: CubeQuery[] = [
        {
          measures: ['m1'],
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        },
        {
          measures: ['m2'],
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'week' }]
        }
      ]

      const result = getCombinedFields(queries)

      expect(result.timeDimensions).toEqual(['Sales.createdAt'])
    })

    it('should handle queries with no measures', () => {
      const queries: CubeQuery[] = [
        { dimensions: ['Sales.category'] }
      ]

      const result = getCombinedFields(queries)

      expect(result.measures).toEqual([])
      expect(result.dimensions).toEqual(['Sales.category'])
    })

    it('should handle queries with no dimensions', () => {
      const queries: CubeQuery[] = [
        { measures: ['Sales.revenue'] }
      ]

      const result = getCombinedFields(queries)

      expect(result.dimensions).toEqual([])
      expect(result.timeDimensions).toEqual([])
    })

    it('should handle empty queries array', () => {
      const result = getCombinedFields([])

      expect(result.measures).toEqual([])
      expect(result.dimensions).toEqual([])
      expect(result.timeDimensions).toEqual([])
    })

    it('should handle empty query object', () => {
      const queries: CubeQuery[] = [{}]

      const result = getCombinedFields(queries)

      expect(result.measures).toEqual([])
      expect(result.dimensions).toEqual([])
      expect(result.timeDimensions).toEqual([])
    })
  })

  describe('generateQueryLabel', () => {
    it('should generate label from first measure without cube prefix', () => {
      const query: CubeQuery = { measures: ['Sales.revenue', 'Sales.units'] }
      expect(generateQueryLabel(query, 0)).toBe('revenue')
    })

    it('should handle measure without prefix', () => {
      const query: CubeQuery = { measures: ['revenue'] }
      expect(generateQueryLabel(query, 0)).toBe('revenue')
    })

    it('should handle nested cube names', () => {
      const query: CubeQuery = { measures: ['Org.Sales.totalRevenue'] }
      expect(generateQueryLabel(query, 0)).toBe('totalRevenue')
    })

    it('should fallback to indexed label when no measures', () => {
      const query: CubeQuery = { dimensions: ['Sales.category'] }
      expect(generateQueryLabel(query, 0)).toBe('Query 1')
      expect(generateQueryLabel(query, 1)).toBe('Query 2')
    })

    it('should fallback to indexed label for empty measures array', () => {
      const query: CubeQuery = { measures: [] }
      expect(generateQueryLabel(query, 2)).toBe('Query 3')
    })

    it('should use 1-based indexing for fallback labels', () => {
      const query: CubeQuery = {}
      expect(generateQueryLabel(query, 0)).toBe('Query 1')
      expect(generateQueryLabel(query, 4)).toBe('Query 5')
    })

    it('should handle single part measure name', () => {
      const query: CubeQuery = { measures: ['count'] }
      expect(generateQueryLabel(query, 0)).toBe('count')
    })
  })

  describe('validateMergeKey', () => {
    it('should return valid when merge key exists in all queries as dimension', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.date'] },
        { measures: ['m2'], dimensions: ['Sales.date'] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(true)
      expect(result.missingInQueries).toEqual([])
    })

    it('should return valid when merge key exists as time dimension', () => {
      const queries: CubeQuery[] = [
        {
          measures: ['m1'],
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        },
        {
          measures: ['m2'],
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'week' }]
        }
      ]

      const result = validateMergeKey(queries, 'Sales.createdAt')

      expect(result.isValid).toBe(true)
      expect(result.missingInQueries).toEqual([])
    })

    it('should return invalid with missing query indices', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.date'] },
        { measures: ['m2'], dimensions: ['Sales.category'] },
        { measures: ['m3'], dimensions: ['Sales.date'] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(false)
      expect(result.missingInQueries).toEqual([1])
    })

    it('should handle mixed dimension and time dimension', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.date'] },
        {
          measures: ['m2'],
          timeDimensions: [{ dimension: 'Sales.date', granularity: 'day' }]
        }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(true)
    })

    it('should return invalid for completely missing key', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.category'] },
        { measures: ['m2'], dimensions: ['Sales.region'] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(false)
      expect(result.missingInQueries).toEqual([0, 1])
    })

    it('should handle undefined dimensions', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'] },
        { measures: ['m2'] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(false)
      expect(result.missingInQueries).toEqual([0, 1])
    })

    it('should handle undefined time dimensions', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: [] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(false)
      expect(result.missingInQueries).toEqual([0])
    })

    it('should handle empty queries array', () => {
      const result = validateMergeKey([], 'Sales.date')

      expect(result.isValid).toBe(true)
      expect(result.missingInQueries).toEqual([])
    })

    it('should handle single query with valid key', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.date'] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(true)
    })

    it('should handle single query with invalid key', () => {
      const queries: CubeQuery[] = [
        { measures: ['m1'], dimensions: ['Sales.category'] }
      ]

      const result = validateMergeKey(queries, 'Sales.date')

      expect(result.isValid).toBe(false)
      expect(result.missingInQueries).toEqual([0])
    })
  })
})

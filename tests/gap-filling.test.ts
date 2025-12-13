/**
 * Gap Filling Test Suite
 * Tests the fillMissingDates functionality for time series queries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'
import type { Cube } from '../src/server/types'
import {
  generateTimeBuckets,
  fillTimeSeriesGaps,
  parseDateRange,
  applyGapFilling
} from '../src/server/gap-filler'

describe('Gap Filling', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Productivity', 'Employees'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Unit Tests - generateTimeBuckets', () => {
    it('should generate daily buckets correctly', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-05T00:00:00Z')
      const buckets = generateTimeBuckets(start, end, 'day')

      expect(buckets).toHaveLength(5)
      expect(buckets[0].toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(buckets[4].toISOString()).toBe('2024-01-05T00:00:00.000Z')
    })

    it('should generate weekly buckets aligned to Monday', () => {
      const start = new Date('2024-01-01T00:00:00Z') // Monday
      const end = new Date('2024-01-15T00:00:00Z') // Monday
      const buckets = generateTimeBuckets(start, end, 'week')

      expect(buckets).toHaveLength(3)
      // Each bucket should be a Monday
      for (const bucket of buckets) {
        expect(bucket.getUTCDay()).toBe(1) // Monday = 1
      }
    })

    it('should generate monthly buckets correctly', () => {
      const start = new Date('2024-01-15T00:00:00Z')
      const end = new Date('2024-04-15T00:00:00Z')
      const buckets = generateTimeBuckets(start, end, 'month')

      expect(buckets).toHaveLength(4)
      expect(buckets[0].toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(buckets[1].toISOString()).toBe('2024-02-01T00:00:00.000Z')
      expect(buckets[2].toISOString()).toBe('2024-03-01T00:00:00.000Z')
      expect(buckets[3].toISOString()).toBe('2024-04-01T00:00:00.000Z')
    })

    it('should generate quarterly buckets correctly', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-12-31T00:00:00Z')
      const buckets = generateTimeBuckets(start, end, 'quarter')

      expect(buckets).toHaveLength(4)
      expect(buckets[0].toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(buckets[1].toISOString()).toBe('2024-04-01T00:00:00.000Z')
      expect(buckets[2].toISOString()).toBe('2024-07-01T00:00:00.000Z')
      expect(buckets[3].toISOString()).toBe('2024-10-01T00:00:00.000Z')
    })

    it('should generate yearly buckets correctly', () => {
      const start = new Date('2022-06-15T00:00:00Z')
      const end = new Date('2024-06-15T00:00:00Z')
      const buckets = generateTimeBuckets(start, end, 'year')

      expect(buckets).toHaveLength(3)
      expect(buckets[0].toISOString()).toBe('2022-01-01T00:00:00.000Z')
      expect(buckets[1].toISOString()).toBe('2023-01-01T00:00:00.000Z')
      expect(buckets[2].toISOString()).toBe('2024-01-01T00:00:00.000Z')
    })

    it('should generate hourly buckets correctly', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-01T05:00:00Z')
      const buckets = generateTimeBuckets(start, end, 'hour')

      expect(buckets).toHaveLength(6)
      expect(buckets[0].toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(buckets[5].toISOString()).toBe('2024-01-01T05:00:00.000Z')
    })

    it('should limit buckets to prevent infinite loops', () => {
      const start = new Date('2000-01-01T00:00:00Z')
      const end = new Date('2100-01-01T00:00:00Z')
      const buckets = generateTimeBuckets(start, end, 'day')

      // Should be limited to 10000 buckets
      expect(buckets.length).toBeLessThanOrEqual(10000)
    })
  })

  describe('Unit Tests - parseDateRange', () => {
    it('should parse array date range', () => {
      const result = parseDateRange(['2024-01-01', '2024-01-31'])

      expect(result).not.toBeNull()
      expect(result![0].toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(result![1].toISOString()).toBe('2024-01-31T00:00:00.000Z')
    })

    it('should parse ISO date strings', () => {
      const result = parseDateRange(['2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z'])

      expect(result).not.toBeNull()
      expect(result![0].toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(result![1].toISOString()).toBe('2024-01-31T23:59:59.000Z')
    })

    it('should return null for undefined', () => {
      expect(parseDateRange(undefined)).toBeNull()
    })

    it('should return null for invalid array', () => {
      expect(parseDateRange(['2024-01-01'])).toBeNull() // Only one element
    })

    it('should return null for invalid dates', () => {
      expect(parseDateRange(['not-a-date', 'also-not-a-date'])).toBeNull()
    })
  })

  describe('Unit Tests - fillTimeSeriesGaps', () => {
    it('should fill missing days with default value', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Sales.date': '2024-01-03T00:00:00.000Z', 'Sales.revenue': 150 }
      ]

      const result = fillTimeSeriesGaps(data, {
        timeDimensionKey: 'Sales.date',
        granularity: 'day',
        dateRange: [new Date('2024-01-01'), new Date('2024-01-03')],
        fillValue: 0,
        measures: ['Sales.revenue'],
        dimensions: []
      })

      expect(result).toHaveLength(3)
      expect(result[0]['Sales.revenue']).toBe(100) // Original
      expect(result[1]['Sales.revenue']).toBe(0)   // Filled
      expect(result[2]['Sales.revenue']).toBe(150) // Original
    })

    it('should fill with null when specified', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = fillTimeSeriesGaps(data, {
        timeDimensionKey: 'Sales.date',
        granularity: 'day',
        dateRange: [new Date('2024-01-01'), new Date('2024-01-02')],
        fillValue: null,
        measures: ['Sales.revenue'],
        dimensions: []
      })

      expect(result).toHaveLength(2)
      expect(result[0]['Sales.revenue']).toBe(100)
      expect(result[1]['Sales.revenue']).toBeNull()
    })

    it('should fill multiple measures', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100, 'Sales.count': 5 }
      ]

      const result = fillTimeSeriesGaps(data, {
        timeDimensionKey: 'Sales.date',
        granularity: 'day',
        dateRange: [new Date('2024-01-01'), new Date('2024-01-02')],
        fillValue: 0,
        measures: ['Sales.revenue', 'Sales.count'],
        dimensions: []
      })

      expect(result).toHaveLength(2)
      expect(result[1]['Sales.revenue']).toBe(0)
      expect(result[1]['Sales.count']).toBe(0)
    })

    it('should fill within dimension groups', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.region': 'US', 'Sales.revenue': 100 },
        { 'Sales.date': '2024-01-03T00:00:00.000Z', 'Sales.region': 'US', 'Sales.revenue': 150 },
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.region': 'EU', 'Sales.revenue': 80 }
      ]

      const result = fillTimeSeriesGaps(data, {
        timeDimensionKey: 'Sales.date',
        granularity: 'day',
        dateRange: [new Date('2024-01-01'), new Date('2024-01-03')],
        fillValue: 0,
        measures: ['Sales.revenue'],
        dimensions: ['Sales.region']
      })

      // Should have 3 days x 2 regions = 6 rows
      expect(result).toHaveLength(6)

      // Check US region has all 3 days
      const usRows = result.filter(r => r['Sales.region'] === 'US')
      expect(usRows).toHaveLength(3)
      expect(usRows[1]['Sales.revenue']).toBe(0) // Filled gap for Jan 2

      // Check EU region has all 3 days
      const euRows = result.filter(r => r['Sales.region'] === 'EU')
      expect(euRows).toHaveLength(3)
      expect(euRows[1]['Sales.revenue']).toBe(0) // Filled gap for Jan 2
      expect(euRows[2]['Sales.revenue']).toBe(0) // Filled gap for Jan 3
    })

    it('should handle empty data array', () => {
      const result = fillTimeSeriesGaps([], {
        timeDimensionKey: 'Sales.date',
        granularity: 'day',
        dateRange: [new Date('2024-01-01'), new Date('2024-01-03')],
        fillValue: 0,
        measures: ['Sales.revenue'],
        dimensions: []
      })

      // Should create 3 empty rows for each day
      expect(result).toHaveLength(3)
      expect(result[0]['Sales.revenue']).toBe(0)
    })
  })

  describe('Unit Tests - applyGapFilling', () => {
    it('should skip filling when fillMissingDates is false', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = applyGapFilling(data, {
        measures: ['Sales.revenue'],
        timeDimensions: [{
          dimension: 'Sales.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-03'],
          fillMissingDates: false
        }]
      }, ['Sales.revenue'])

      expect(result).toHaveLength(1) // Not filled
    })

    it('should fill by default (fillMissingDates defaults to true)', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = applyGapFilling(data, {
        measures: ['Sales.revenue'],
        timeDimensions: [{
          dimension: 'Sales.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-03']
          // fillMissingDates not specified - should default to true
        }]
      }, ['Sales.revenue'])

      expect(result).toHaveLength(3) // Filled
    })

    it('should skip when no granularity', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = applyGapFilling(data, {
        measures: ['Sales.revenue'],
        timeDimensions: [{
          dimension: 'Sales.date',
          dateRange: ['2024-01-01', '2024-01-03']
          // No granularity - cannot fill gaps
        }]
      }, ['Sales.revenue'])

      expect(result).toHaveLength(1) // Not filled
    })

    it('should skip when no dateRange', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = applyGapFilling(data, {
        measures: ['Sales.revenue'],
        timeDimensions: [{
          dimension: 'Sales.date',
          granularity: 'day'
          // No dateRange - cannot determine bounds
        }]
      }, ['Sales.revenue'])

      expect(result).toHaveLength(1) // Not filled
    })

    it('should use custom fill value', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = applyGapFilling(data, {
        measures: ['Sales.revenue'],
        timeDimensions: [{
          dimension: 'Sales.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-02']
        }],
        fillMissingDatesValue: null
      }, ['Sales.revenue'])

      expect(result).toHaveLength(2)
      expect(result[1]['Sales.revenue']).toBeNull()
    })
  })

  describe('Integration Tests - Query Execution', () => {
    it('should fill gaps in time series query results', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-07']
          // fillMissingDates defaults to true
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have 7 days of data (gaps filled)
      expect(result.data).toHaveLength(7)

      // All dates should be present
      const dates = result.data.map(row => {
        const date = new Date(row['Productivity.date'] as string)
        return date.toISOString().split('T')[0]
      })

      expect(dates).toContain('2024-01-01')
      expect(dates).toContain('2024-01-02')
      expect(dates).toContain('2024-01-03')
      expect(dates).toContain('2024-01-04')
      expect(dates).toContain('2024-01-05')
      expect(dates).toContain('2024-01-06')
      expect(dates).toContain('2024-01-07')
    })

    it('should not fill gaps when explicitly disabled', async () => {
      // First, get the unfilled count
      const unfilledQuery = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-31'],
          fillMissingDates: false
        }])
        .build()

      const unfilledResult = await testExecutor.executeQuery(unfilledQuery)

      // Then get the filled count
      const filledQuery = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-31'],
          fillMissingDates: true
        }])
        .build()

      const filledResult = await testExecutor.executeQuery(filledQuery)

      // Filled should have 31 days, unfilled should have <= 31
      expect(filledResult.data).toHaveLength(31)
      expect(unfilledResult.data.length).toBeLessThanOrEqual(31)
    })

    it('should fill gaps with custom fill value', async () => {
      const query = {
        measures: ['Productivity.recordCount'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-03']
        }],
        fillMissingDatesValue: null
      }

      const result = await testExecutor.executeQuery(query)

      // Should have 3 days
      expect(result.data).toHaveLength(3)

      // Gaps should be filled with null
      for (const row of result.data) {
        const count = row['Productivity.recordCount']
        // Value should be either a number (real data) or null (filled)
        expect(count === null || typeof count === 'number').toBe(true)
      }
    })

    it('should fill gaps within dimension groups', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.departmentId'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-03']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Group by departmentId and verify each group has 3 days
      const byDepartment = new Map<string, any[]>()
      for (const row of result.data) {
        const deptId = String(row['Employees.departmentId'])
        if (!byDepartment.has(deptId)) {
          byDepartment.set(deptId, [])
        }
        byDepartment.get(deptId)!.push(row)
      }

      // Each department should have exactly 3 days of data
      for (const [deptId, rows] of byDepartment) {
        expect(rows).toHaveLength(3)
      }
    })

    it('should handle monthly granularity gap filling', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: ['2024-01-01', '2024-06-30']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have 6 months
      expect(result.data).toHaveLength(6)
    })

    it('should handle weekly granularity gap filling', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'week',
          dateRange: ['2024-01-01', '2024-01-28']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have 4 weeks
      expect(result.data).toHaveLength(4)
    })

    it('should handle yearly granularity gap filling', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'year',
          dateRange: ['2022-01-01', '2024-12-31']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have 3 years
      expect(result.data).toHaveLength(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single day date range', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-15', '2024-01-15']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
    })

    it('should handle empty result set', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2030-01-01', '2030-01-03'] // Future dates - no data
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should still fill gaps even with no real data
      expect(result.data).toHaveLength(3)
      for (const row of result.data) {
        expect(row['Productivity.recordCount']).toBe(0)
      }
    })

    it('should preserve original data when no gaps exist', async () => {
      // Query for a range where data exists for all days
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: ['2024-01-01', '2024-01-31']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have exactly 1 month bucket
      expect(result.data).toHaveLength(1)
    })

    it('should handle quarter granularity gap filling', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'quarter',
          dateRange: ['2024-01-01', '2024-12-31']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have 4 quarters
      expect(result.data).toHaveLength(4)
    })
  })
})

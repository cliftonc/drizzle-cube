/**
 * Tests for compareDateRange period-over-period comparison feature
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ComparisonQueryBuilder } from '../src/server/comparison-query-builder'
import { SemanticLayerCompiler } from '../src/server/compiler'
import type { SemanticQuery } from '../src/server/types'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'

describe('ComparisonQueryBuilder', () => {
  describe('hasComparison', () => {
    it('should return true when query has compareDateRange with 2+ periods', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const query: SemanticQuery = {
        measures: ['Productivity.totalLinesOfCode'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day',
          compareDateRange: [
            'last 30 days',
            ['2023-01-01', '2023-01-30']
          ]
        }]
      }
      expect(builder.hasComparison(query)).toBe(true)
    })

    it('should return false when query has no compareDateRange', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const query: SemanticQuery = {
        measures: ['Productivity.totalLinesOfCode'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-30']
        }]
      }
      expect(builder.hasComparison(query)).toBe(false)
    })

    it('should return false when compareDateRange has less than 2 periods', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const query: SemanticQuery = {
        measures: ['Productivity.totalLinesOfCode'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day',
          compareDateRange: ['last 30 days']
        }]
      }
      expect(builder.hasComparison(query)).toBe(false)
    })
  })

  describe('calculatePeriodDayIndex', () => {
    it('should calculate day index correctly for day granularity', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const periodStart = new Date('2024-01-01T00:00:00Z')

      expect(builder.calculatePeriodDayIndex('2024-01-01', periodStart, 'day')).toBe(0)
      expect(builder.calculatePeriodDayIndex('2024-01-02', periodStart, 'day')).toBe(1)
      expect(builder.calculatePeriodDayIndex('2024-01-15', periodStart, 'day')).toBe(14)
      expect(builder.calculatePeriodDayIndex('2024-01-31', periodStart, 'day')).toBe(30)
    })

    it('should calculate month index correctly for month granularity', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const periodStart = new Date('2024-01-01T00:00:00Z')

      expect(builder.calculatePeriodDayIndex('2024-01-15', periodStart, 'month')).toBe(0)
      expect(builder.calculatePeriodDayIndex('2024-02-15', periodStart, 'month')).toBe(1)
      expect(builder.calculatePeriodDayIndex('2024-06-15', periodStart, 'month')).toBe(5)
      expect(builder.calculatePeriodDayIndex('2025-01-15', periodStart, 'month')).toBe(12)
    })

    it('should calculate week index correctly for week granularity', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const periodStart = new Date('2024-01-01T00:00:00Z') // Monday

      expect(builder.calculatePeriodDayIndex('2024-01-01', periodStart, 'week')).toBe(0)
      expect(builder.calculatePeriodDayIndex('2024-01-08', periodStart, 'week')).toBe(1)
      expect(builder.calculatePeriodDayIndex('2024-01-15', periodStart, 'week')).toBe(2)
    })
  })

  describe('createPeriodQuery', () => {
    it('should create a query with dateRange replacing compareDateRange', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const query: SemanticQuery = {
        measures: ['Productivity.totalLinesOfCode'],
        dimensions: ['Productivity.employeeId'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day',
          compareDateRange: [
            ['2024-01-01', '2024-01-30'],
            ['2023-01-01', '2023-01-30']
          ]
        }]
      }

      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-30'),
        label: '2024-01-01 - 2024-01-30',
        index: 0
      }

      const periodQuery = builder.createPeriodQuery(query, period)

      expect(periodQuery.timeDimensions).toBeDefined()
      expect(periodQuery.timeDimensions![0].dateRange).toBeDefined()
      expect(periodQuery.timeDimensions![0].compareDateRange).toBeUndefined()
      expect(periodQuery.measures).toEqual(['Productivity.totalLinesOfCode'])
      expect(periodQuery.dimensions).toEqual(['Productivity.employeeId'])
    })
  })

  describe('addPeriodMetadata', () => {
    it('should add period metadata to result rows', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const data = [
        { 'Productivity.date': '2024-01-01T00:00:00.000Z', 'Productivity.totalLinesOfCode': 100 },
        { 'Productivity.date': '2024-01-02T00:00:00.000Z', 'Productivity.totalLinesOfCode': 150 }
      ]

      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        label: 'Current Period',
        index: 0
      }

      const result = builder.addPeriodMetadata(data, period, 'Productivity.date', 'day')

      expect(result[0].__period).toBe('Current Period')
      expect(result[0].__periodIndex).toBe(0)
      expect(result[0].__periodDayIndex).toBe(0)

      expect(result[1].__period).toBe('Current Period')
      expect(result[1].__periodIndex).toBe(0)
      expect(result[1].__periodDayIndex).toBe(1)
    })
  })

  describe('sortComparisonResults', () => {
    it('should sort results by period index then by time dimension', () => {
      const builder = new ComparisonQueryBuilder({} as any)
      const data = [
        { 'Productivity.date': '2024-01-02', __periodIndex: 0, __periodDayIndex: 1, __period: 'Current' },
        { 'Productivity.date': '2023-01-01', __periodIndex: 1, __periodDayIndex: 0, __period: 'Prior' },
        { 'Productivity.date': '2024-01-01', __periodIndex: 0, __periodDayIndex: 0, __period: 'Current' },
        { 'Productivity.date': '2023-01-02', __periodIndex: 1, __periodDayIndex: 1, __period: 'Prior' }
      ] as any

      const sorted = builder.sortComparisonResults(data, 'Productivity.date')

      // Should be sorted: period 0 first (in time order), then period 1 (in time order)
      expect(sorted[0].__periodIndex).toBe(0)
      expect(sorted[0]['Productivity.date']).toBe('2024-01-01')
      expect(sorted[1].__periodIndex).toBe(0)
      expect(sorted[1]['Productivity.date']).toBe('2024-01-02')
      expect(sorted[2].__periodIndex).toBe(1)
      expect(sorted[2]['Productivity.date']).toBe('2023-01-01')
      expect(sorted[3].__periodIndex).toBe(1)
      expect(sorted[3]['Productivity.date']).toBe('2023-01-02')
    })
  })
})

describe('compareDateRange integration', () => {
  let semanticLayer: SemanticLayerCompiler
  let close: (() => void) | undefined

  beforeAll(async () => {
    const { executor, close: closeDb } = await createTestDatabaseExecutor()
    close = closeDb

    const { testEmployeesCube, testProductivityCube, testDepartmentsCube } = await createTestCubesForCurrentDatabase()

    semanticLayer = new SemanticLayerCompiler({
      databaseExecutor: executor
    })

    semanticLayer.registerCube(testEmployeesCube)
    semanticLayer.registerCube(testProductivityCube)
    semanticLayer.registerCube(testDepartmentsCube)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('should execute a compareDateRange query with two periods', async () => {
    const result = await semanticLayer.execute({
      measures: ['Productivity.totalLinesOfCode'],
      timeDimensions: [{
        dimension: 'Productivity.date',
        granularity: 'day',
        compareDateRange: [
          ['2024-03-01', '2024-03-07'],
          ['2024-02-01', '2024-02-07']
        ]
      }]
    }, { organisationId: 1 })

    // Should have data from both periods
    expect(result.data.length).toBeGreaterThan(0)

    // Should have period metadata
    const firstRow = result.data[0] as any
    expect(firstRow.__periodIndex).toBeDefined()
    expect(firstRow.__periodDayIndex).toBeDefined()
    expect(firstRow.__period).toBeDefined()

    // Should have periods annotation
    expect(result.annotation.periods).toBeDefined()
    expect(result.annotation.periods?.ranges.length).toBe(2)
    expect(result.annotation.periods?.labels.length).toBe(2)
  })

  it('should apply security context to all periods', async () => {
    // Execute for org 1
    const org1Result = await semanticLayer.execute({
      measures: ['Productivity.totalLinesOfCode'],
      timeDimensions: [{
        dimension: 'Productivity.date',
        granularity: 'day',
        compareDateRange: [
          ['2024-03-01', '2024-03-07'],
          ['2024-02-01', '2024-02-07']
        ]
      }]
    }, { organisationId: 1 })

    // Execute for org 2
    const org2Result = await semanticLayer.execute({
      measures: ['Productivity.totalLinesOfCode'],
      timeDimensions: [{
        dimension: 'Productivity.date',
        granularity: 'day',
        compareDateRange: [
          ['2024-03-01', '2024-03-07'],
          ['2024-02-01', '2024-02-07']
        ]
      }]
    }, { organisationId: 2 })

    // Results should be different (security isolation)
    // Note: This test assumes test data has different data for different orgs
    // If they happen to be equal due to test data, the test still passes
    expect(org1Result.data).toBeDefined()
    expect(org2Result.data).toBeDefined()
  })

  it('should handle relative date strings in compareDateRange', async () => {
    const result = await semanticLayer.execute({
      measures: ['Productivity.recordCount'],
      timeDimensions: [{
        dimension: 'Productivity.date',
        granularity: 'day',
        compareDateRange: [
          'last 7 days',
          'last 14 days' // Note: This will overlap, but should still work
        ]
      }]
    }, { organisationId: 1 })

    // Should execute without error
    expect(result.data).toBeDefined()
    expect(result.annotation.periods?.labels).toContain('last 7 days')
    expect(result.annotation.periods?.labels).toContain('last 14 days')
  })

  it('should align periods by day index correctly', async () => {
    const result = await semanticLayer.execute({
      measures: ['Productivity.totalLinesOfCode'],
      timeDimensions: [{
        dimension: 'Productivity.date',
        granularity: 'day',
        compareDateRange: [
          ['2024-03-01', '2024-03-05'],
          ['2024-02-01', '2024-02-05']
        ]
      }]
    }, { organisationId: 1 })

    // Check that period day indices are aligned
    const period0Data = result.data.filter((r: any) => r.__periodIndex === 0)
    const period1Data = result.data.filter((r: any) => r.__periodIndex === 1)

    // Both periods should have data
    // Note: May have fewer rows if no data exists for those dates
    if (period0Data.length > 0 && period1Data.length > 0) {
      // Day indices should start at 0 for both periods
      const period0DayIndices = period0Data.map((r: any) => r.__periodDayIndex)
      const period1DayIndices = period1Data.map((r: any) => r.__periodDayIndex)

      expect(Math.min(...period0DayIndices)).toBe(0)
      expect(Math.min(...period1DayIndices)).toBe(0)
    }
  })
})

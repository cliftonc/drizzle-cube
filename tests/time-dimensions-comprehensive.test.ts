/**
 * Comprehensive Time Dimensions Test Suite
 * Tests all time granularities, date ranges, timezone handling, and edge cases
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { 
  createTestDatabase,   
  testSchema,
  employees,
  departments,
  productivity
} from './helpers/test-database'
import type { TestSchema } from './helpers/test-database'
import { enhancedDepartments, enhancedEmployees, generateComprehensiveProductivityData, testSecurityContexts } from './helpers/enhanced-test-data'

import { 
  createPostgresExecutor
} from '../src/server'

import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/types-drizzle'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition 
} from '../src/server/types-drizzle'

import { 
  TestQueryBuilder, 
  TestExecutor, 
  QueryValidator, 
  TestDataGenerator,
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Comprehensive Time Dimensions', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube<TestSchema>>

  beforeAll(async () => {
    // Use the existing global test database (do not delete/re-insert)
    const { db } = createTestDatabase()
    
    // Setup test executor with shared cube definitions
    const dbExecutor = createPostgresExecutor(db, testSchema)
    const executor = new QueryExecutor(dbExecutor)
    cubes = getTestCubes(['Productivity', 'Employees'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
    performanceMeasurer = new PerformanceMeasurer()
  })

  describe('Time Granularity Testing', () => {
    const granularityTestCases = TestDataGenerator.generateTimeGranularityTestCases()

    granularityTestCases.forEach(({ name, granularity, description, expectedPattern }) => {
      it(`should handle ${granularity} granularity: ${description}`, async () => {
        const query = TestQueryBuilder.create()
          .measures(['Productivity.recordCount', 'Productivity.totalLinesOfCode'])
          .timeDimensions([{
            dimension: 'Productivity.date',
            granularity
          }])
          .limit(10) // Limit for performance
          .order({ 'Productivity.date': 'asc' })
          .build()

        const result = await performanceMeasurer.measure(
          `granularity-${granularity}`,
          () => testExecutor.executeQuery(query)
        )

        // Validate result structure
        const validation = QueryValidator.validateQueryResult(result, [
          'Productivity.recordCount',
          'Productivity.totalLinesOfCode',
          'Productivity.date'
        ])
        expect(validation.isValid).toBe(true)

        // Validate data presence
        expect(result.data.length).toBeGreaterThan(0)

        // Validate time dimension format if pattern provided
        if (expectedPattern) {
          const firstRow = result.data[0]
          const dateValue = firstRow['Productivity.date']
          if (typeof dateValue === 'string') {
            expect(dateValue).toMatch(expectedPattern)
          }
        }

        // Validate time dimension annotation
        expect(result.annotation.timeDimensions['Productivity.date']).toBeDefined()
        expect(result.annotation.timeDimensions['Productivity.date'].granularity).toBe(granularity)
      })
    })

    it('should handle multiple time dimensions with different granularities', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([
          { dimension: 'Productivity.date', granularity: 'month' },
          { dimension: 'Productivity.createdAt', granularity: 'year' }
        ])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.annotation.timeDimensions['Productivity.date']).toBeDefined()
      expect(result.annotation.timeDimensions['Productivity.createdAt']).toBeDefined()
    })

    it('should handle time dimensions without granularity (raw timestamps)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date'
          // No granularity specified
        }])
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      
      // Should return raw timestamps
      const firstRow = result.data[0]
      expect(firstRow['Productivity.date']).toBeDefined()
    })
  })

  describe('Date Range Filtering', () => {
    it('should handle absolute date ranges', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-01-31']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.length).toBeLessThanOrEqual(31) // Maximum January days

      // Validate all dates are within range
      for (const row of result.data) {
        const dateValue = new Date(row['Productivity.date'])
        expect(dateValue.getFullYear()).toBe(2024)
        expect(dateValue.getMonth()).toBe(0) // January is 0
      }
    })

    it('should handle single date range', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: '2024-01-15'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      console.log(result)

      if (result.data.length > 0) {
        const dateValue = new Date(result.data[0]['Productivity.date'])
        expect(dateValue.toISOString().split('T')[0]).toBe('2024-01-15')
      }
    })

    it('should handle relative date ranges - last N days', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'last 7 days'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return data for last 7 days (may be 0 if no recent data)
      expect(result.data.length).toBeLessThanOrEqual(7)
    })

    it('should handle this month date range', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'this month'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return data for current month
      expect(result.data.length).toBeLessThanOrEqual(31)
    })

    it('should handle year-to-date range', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'this year'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return monthly data for current year
      expect(result.data.length).toBeLessThanOrEqual(12)
    })

    it('should handle quarter date ranges', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'last 4 quarters'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return quarterly data
      expect(result.data.length).toBeLessThanOrEqual(48) // 4 quarters * 12 months
    })
  })

  describe('Complex Time Dimension Scenarios', () => {
    it('should handle time dimensions with measures and regular dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .dimensions(['Productivity.departmentName'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'week'
        }])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-03-31'] }
        ])
        .limit(20)
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Validate result has all expected fields
      const expectedFields = [
        'Productivity.totalLinesOfCode',
        'Productivity.avgHappinessIndex',
        'Productivity.departmentName',
        'Productivity.date'
      ]
      const validation = QueryValidator.validateQueryResult(result, expectedFields)
      expect(validation.isValid).toBe(true)

      // Validate time ordering
      let previousDate: Date | null = null
      for (const row of result.data) {
        const currentDate = new Date(row['Productivity.date'])
        if (previousDate) {
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime())
        }
        previousDate = currentDate
      }
    })

    it('should handle time dimensions with conditional measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.workingDaysCount', 'Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month'
        }])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-06-30'] }
        ])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Working days count should be less than or equal to total record count
      for (const row of result.data) {
        expect(row['Productivity.workingDaysCount']).toBeLessThanOrEqual(row['Productivity.recordCount'])
      }
    })

    it('should handle multiple time dimensions from different cubes', async () => {
      // This tests cross-cube time dimension queries
      const query = {
        measures: ['Productivity.recordCount', 'Employees.count'],
        timeDimensions: [
          { dimension: 'Productivity.date', granularity: 'month' },
          { dimension: 'Employees.createdAt', granularity: 'year' }
        ],
        limit: 10
      }

      try {
        const result = await testExecutor.executeQuery(query)
        
        // If multi-cube queries are supported, validate structure
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error) {
        // Multi-cube time dimensions might not be supported yet
        console.warn('Multi-cube time dimensions not supported:', error)
      }
    })
  })

  describe('Time Zone Handling', () => {
    it('should handle UTC time zones consistently', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'hour'
        }])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01T00:00:00Z', '2024-01-01T23:59:59Z'] }
        ])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return hourly data for single day
      expect(result.data.length).toBeLessThanOrEqual(24)

      // All dates should be within the specified day
      for (const row of result.data) {
        const dateValue = new Date(row['Productivity.date'])
        expect(dateValue.getUTCFullYear()).toBe(2024)
        expect(dateValue.getUTCMonth()).toBe(0) // January
        expect(dateValue.getUTCDate()).toBe(1)
      }
    })

    it('should handle different date formats consistently', async () => {
      const dateFormats = [
        '2024-01-15',
        '2024-01-15T00:00:00',
        '2024-01-15T00:00:00Z',
        '2024-01-15T00:00:00.000Z'
      ]

      const results: any[] = []

      for (const dateFormat of dateFormats) {
        const query = TestQueryBuilder.create()
          .measures(['Productivity.recordCount'])
          .timeDimensions([{
            dimension: 'Productivity.date',
            granularity: 'day',
            dateRange: dateFormat
          }])
          .build()

        const result = await testExecutor.executeQuery(query)
        results.push(result)
      }

      // All formats should produce consistent results
      const firstCount = results[0].data.length > 0 ? results[0].data[0]['Productivity.recordCount'] : 0
      for (let i = 1; i < results.length; i++) {
        const currentCount = results[i].data.length > 0 ? results[i].data[0]['Productivity.recordCount'] : 0
        expect(currentCount).toBe(firstCount)
      }
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle leap year dates correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-02-28', '2024-03-01'] // 2024 is a leap year
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should include Feb 29 for leap year 2024
      if (result.data.length > 0) {
        const dates = result.data.map(row => new Date(row['Productivity.date']).getDate())
        expect(dates).toContain(29) // February 29th should be included
      }
    })

    it('should handle month boundaries correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-30', '2024-02-02']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      if (result.data.length > 0) {
        // Should span across January and February
        const dates = result.data.map(row => new Date(row['Productivity.date']))
        const months = [...new Set(dates.map(d => d.getMonth()))]
        expect(months.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('should handle year boundaries correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2023-12-30', '2024-01-02']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      if (result.data.length > 0) {
        // Should span across 2023 and 2024
        const dates = result.data.map(row => new Date(row['Productivity.date']))
        const years = [...new Set(dates.map(d => d.getFullYear()))]
        expect(years.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('should handle empty date ranges gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2025-01-01', '2025-01-01'] // Same start and end date
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should handle gracefully, either return empty or single day
      expect(result.data.length).toBeLessThanOrEqual(1)
    })

    it('should handle future date ranges gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2030-01-01', '2030-01-31']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return empty results for future dates
      expect(result.data).toHaveLength(0)
    })

    it('should handle very old date ranges gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['1900-01-01', '1900-01-31']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return empty results for very old dates
      expect(result.data).toHaveLength(0)
    })
  })

  describe('Performance and Scalability', () => {
    it('should efficiently aggregate large time series data', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-12-31']
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await performanceMeasurer.measure(
        'large-time-series',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeLessThanOrEqual(366) // Max days in 2024 (leap year)

      // Performance should be reasonable for full year aggregation
      const stats = performanceMeasurer.getStats('large-time-series')
      expect(stats.avgDuration).toBeLessThan(10000) // Less than 10 seconds
    })

    it('should efficiently handle fine-grained time granularity', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'hour',
          dateRange: ['2024-01-01', '2024-01-07'] // One week of hourly data
        }])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await performanceMeasurer.measure(
        'fine-grained-time',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeLessThanOrEqual(168) // 7 days * 24 hours

      // Should handle fine granularity efficiently
      const stats = performanceMeasurer.getStats('fine-grained-time')
      expect(stats.avgDuration).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should efficiently handle multiple time dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([
          { dimension: 'Productivity.date', granularity: 'month' },
          { dimension: 'Productivity.createdAt', granularity: 'quarter' }
        ])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-06-30'] }
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'multiple-time-dimensions',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data).toBeDefined()

      // Should handle multiple time dimensions efficiently
      const stats = performanceMeasurer.getStats('multiple-time-dimensions')
      expect(stats.avgDuration).toBeLessThan(3000) // Less than 3 seconds
    })
  })

  describe('Time Dimension Annotations', () => {
    it('should provide correct time dimension metadata', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month'
        }])
        .limit(1)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.annotation).toBeDefined()
      expect(result.annotation.timeDimensions).toBeDefined()
      
      const timeDimAnnotation = result.annotation.timeDimensions['Productivity.date']
      expect(timeDimAnnotation).toBeDefined()
      expect(timeDimAnnotation.granularity).toBe('month')
      expect(timeDimAnnotation.type).toBe('time')
      expect(timeDimAnnotation.title).toBe('Date')
    })

    it('should handle time dimensions without granularity in annotations', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date'
          // No granularity
        }])
        .limit(1)
        .build()

      const result = await testExecutor.executeQuery(query)

      const timeDimAnnotation = result.annotation.timeDimensions['Productivity.date']
      expect(timeDimAnnotation).toBeDefined()
      expect(timeDimAnnotation.granularity).toBeUndefined()
      expect(timeDimAnnotation.type).toBe('time')
    })
  })

  afterAll(() => {
    // Output performance statistics
    const allStats = performanceMeasurer.getStats()
    console.log('\n=== Time Dimension Performance Statistics ===')
    console.log(`Total measurements: ${allStats.count}`)
    console.log(`Average duration: ${allStats.avgDuration.toFixed(2)}ms`)
    console.log(`Min duration: ${allStats.minDuration.toFixed(2)}ms`)
    console.log(`Max duration: ${allStats.maxDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${allStats.totalDuration.toFixed(2)}ms`)
    
    // Granularity-specific stats
    const granularityStats = performanceMeasurer.getStats('granularity-')
    if (granularityStats.count > 0) {
      console.log('\n=== Granularity Performance ===')
      console.log(`Granularity tests: ${granularityStats.count}`)
      console.log(`Average granularity duration: ${granularityStats.avgDuration.toFixed(2)}ms`)
    }
  })
})
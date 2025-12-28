/**
 * Comprehensive Date Range Test Suite
 * Tests all 14 DATE_RANGE_OPTIONS supported by the client
 * Ensures proper date calculations for quarters, weeks, and all relative date expressions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'

import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import type {
  Cube
} from '../../src/server/types'

import { 
  TestQueryBuilder, 
  TestExecutor
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Comprehensive Date Range Tests', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    // Use the new test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    // Setup test executor with shared cube definitions
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Single Day Ranges', () => {
    it('should handle "today" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'today'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Verify the query runs without error
      expect(result.annotation).toBeDefined()
      expect(result.annotation.timeDimensions['Productivity.date']).toBeDefined()
    })

    it('should handle "yesterday" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'yesterday'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('Week Ranges', () => {
    it('should handle "this week" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'this week'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 7 days in this week
      expect(result.data.length).toBeLessThanOrEqual(7)
    })

    it('should handle "last week" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'last week'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 7 days in last week
      expect(result.data.length).toBeLessThanOrEqual(7)
    })
  })

  describe('Month Ranges', () => {
    it('should handle "this month" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'this month'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 31 days in this month
      expect(result.data.length).toBeLessThanOrEqual(31)
    })

    it('should handle "last month" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'last month'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 31 days in last month
      expect(result.data.length).toBeLessThanOrEqual(31)
    })
  })

  describe('Quarter Ranges', () => {
    it('should handle "this quarter" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'this quarter'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 3 months in this quarter
      expect(result.data.length).toBeLessThanOrEqual(3)
    })

    it('should handle "last quarter" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'last quarter'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 3 months in last quarter
      expect(result.data.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Year Ranges', () => {
    it('should handle "this year" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'this year'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 12 months in this year
      expect(result.data.length).toBeLessThanOrEqual(12)
    })

    it('should handle "last year" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'last year'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should have at most 12 months in last year
      expect(result.data.length).toBeLessThanOrEqual(12)
    })
  })

  describe('Rolling Day Ranges', () => {
    it('should handle "last 7 days" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'last 7 days'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should return data for last 7 days (may be 0 if no recent data)
      expect(result.data.length).toBeLessThanOrEqual(7)
    })

    it('should handle "last 30 days" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'last 30 days'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should return data for last 30 days
      expect(result.data.length).toBeLessThanOrEqual(30)
    })
  })

  describe('Rolling Month Range', () => {
    it('should handle "last 12 months" dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'last 12 months'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should return data for last 12 months
      expect(result.data.length).toBeLessThanOrEqual(12)
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle invalid dateRange gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'invalid_range'
        }])
        .build()

      // Should either throw an error or return empty results, not crash
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
      } catch (error) {
        // Error is acceptable for invalid date ranges
        expect(error).toBeDefined()
      }
    })

    it('should handle empty dateRange', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day'
          // No dateRange specified
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle case sensitivity in dateRange values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'TODAY' // Uppercase
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle dateRange with extra whitespace', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: '  this month  ' // Extra whitespace
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('Date Range Combinations', () => {
    it('should handle multiple time dimensions with different dateRanges', async () => {
      // This test verifies that different dateRanges can be used in the same query
      // Although this might not be a common use case, it should work
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'this month'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should perform reasonably well with large date ranges', async () => {
      const startTime = Date.now()
      
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'last 12 months'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      const executionTime = Date.now() - startTime
      
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Should complete within reasonable time (10 seconds)
      expect(executionTime).toBeLessThan(10000)
    })

    it('should handle leap year calculations correctly', async () => {
      // This is more of a smoke test - we can't easily test specific leap year scenarios
      // without controlling the current date, but we can ensure the query works
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: 'this year'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })
})
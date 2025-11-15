/**
 * SQL Wrapping Pattern Tests
 *
 * These tests verify that the isolateSqlExpression() helper correctly prevents
 * Drizzle SQL object mutation when column objects are reused across multiple
 * query contexts (SELECT, WHERE, GROUP BY, etc.)
 *
 * The pattern is tested indirectly by ensuring queries with reused dimensions
 * execute correctly without corruption, duplication, or SQL errors.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import type { Cube } from '../src/server/types'

describe('SQL Wrapping Pattern - Prevention of SQL Object Mutation', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes()
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Single Dimension Reuse', () => {
    it('should handle same dimension in SELECT and GROUP BY without corruption', async () => {
      // This query uses Employees.id in both SELECT and GROUP BY
      // If SQL wrapping fails, Drizzle mutation would cause duplicate SQL fragments
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.id'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify each row has the expected fields
      result.data.forEach((row: any) => {
        expect(row['Employees.id']).toBeDefined()
        expect(row['Employees.count']).toBeGreaterThan(0)
      })
    })

    it('should handle same dimension in SELECT, GROUP BY, and ORDER BY', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Data should be sorted by name
      const names = result.data.map((row: any) => row['Employees.name'])
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })
  })

  describe('Dimension Reuse with Filters', () => {
    it('should handle dimension used in SELECT, GROUP BY, and WHERE without corruption', async () => {
      // This query uses Employees.id in SELECT, GROUP BY, and WHERE clause
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.id'])
        .filter('Employees.id', 'gt', [0])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // All returned IDs should be > 0
      result.data.forEach((row: any) => {
        expect(row['Employees.id']).toBeGreaterThan(0)
      })
    })

    it('should handle string dimension used in multiple contexts', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'notEquals', [''])
        .order({ 'Employees.name': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // All names should be non-empty and sorted
      const names = result.data.map((row: any) => row['Employees.name'])
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)

      // Verify all names are truthy
      names.forEach((name: string) => {
        expect(name).toBeTruthy()
      })
    })
  })

  describe('Multi-Cube Dimension Reuse', () => {
    it('should handle dimensions from multiple cubes without corruption', async () => {
      // Uses dimensions from Employees cube
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.id', 'Employees.departmentId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify both dimensions are present
      result.data.forEach((row: any) => {
        expect(row['Employees.id']).toBeDefined()
        expect(row['Employees.departmentId']).toBeDefined()
      })
    })

    it('should handle complex multi-cube query with filters and ordering', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'notEquals', [''])
        .order({ 'Employees.name': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      // Verify measures are aggregated correctly
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeGreaterThan(0)
        expect(row['Productivity.totalLinesOfCode']).toBeDefined()
      })
    })
  })

  describe('Time Dimension Reuse', () => {
    it('should handle time dimension in SELECT, GROUP BY, and filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .timeDimensions([{
          dimension: 'Employees.createdAt',
          granularity: 'day'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Each row should have a count
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeGreaterThan(0)
      })
    })

    it('should handle time dimension with date range filter', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .timeDimensions([{
          dimension: 'Employees.createdAt',
          granularity: 'month',
          dateRange: ['2024-01-01', '2024-12-31']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      // Should have results (test data includes 2024 dates)
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('Measure Expression Reuse', () => {
    it('should handle calculated measures that reference same base columns', async () => {
      // Employees.count and Employees.activeCount both use employees.id internally
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.activeCount'])
        .dimensions(['Employees.departmentId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify both measures are computed correctly
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeGreaterThanOrEqual(row['Employees.activeCount'])
      })
    })

    it('should handle multiple aggregations on same column', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.totalSalary',
          'Employees.avgSalary',
          'Employees.minSalary',
          'Employees.maxSalary'
        ])
        .dimensions(['Employees.departmentId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      // Verify aggregations make logical sense
      result.data.forEach((row: any) => {
        const avg = Number(row['Employees.avgSalary'])
        const min = Number(row['Employees.minSalary'])
        const max = Number(row['Employees.maxSalary'])

        expect(avg).toBeGreaterThanOrEqual(min)
        expect(avg).toBeLessThanOrEqual(max)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle query with only dimensions (no measures)', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.id', 'Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle filter that excludes all results', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.id'])
        .filter('Employees.id', 'equals', [-99999]) // Non-existent ID
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      // With a dimension and filter that matches nothing, we get zero rows
      expect(result.data.length).toBe(0)
    })

    it('should handle very complex query with many reused dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions([
          'Employees.id',
          'Employees.name',
          'Employees.email',
          'Employees.departmentId',
          'Employees.active'
        ])
        .filter('Employees.active', 'equals', [true])
        .order({ 'Employees.name': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      // Verify all dimensions are present
      result.data.forEach((row: any) => {
        expect(row['Employees.id']).toBeDefined()
        expect(row['Employees.name']).toBeDefined()
        expect(row['Employees.email']).toBeDefined()
        expect(row['Employees.departmentId']).toBeDefined()
        expect(row['Employees.active']).toBe(true)
      })
    })
  })
})

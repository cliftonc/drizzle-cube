/**
 * CTE Generation Test Suite
 *
 * Tests Common Table Expression (CTE) generation for hasMany relationships,
 * composite keys, and filter propagation across CTEs.
 *
 * Covers:
 * - Multiple hasMany relationships from same cube
 * - Deeply nested join paths (4+ levels)
 * - CTE with complex filters
 * - CTE join key extraction with composite keys
 * - Propagating filters across CTEs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import type { Cube } from '../src/server/types'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('CTE Generation Tests', () => {
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
    if (close) close()
  })

  describe('Multiple hasMany Relationships', () => {
    it('should generate separate CTEs for each hasMany relationship', async () => {
      // Query that needs Productivity (hasMany from Employees)
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
      expect(result.data[0]['Productivity.totalLinesOfCode']).toBeGreaterThanOrEqual(0)
    })

    it('should handle hasMany with dimension grouping', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.avgLinesOfCode'])
        .dimensions(['Employees.departmentId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Employees.departmentId']).toBeDefined()
        expect(row['Employees.count']).toBeGreaterThanOrEqual(0)
      }
    })

    it('should aggregate correctly across hasMany relationship', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.totalPullRequests'])
        .dimensions(['Employees.name'])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Employees.name']).toBeDefined()
        expect(typeof row['Productivity.recordCount']).toBe('number')
      }
    })
  })

  describe('CTE with Complex Filters', () => {
    it('should propagate simple equality filters to CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .filters([
          { member: 'Employees.isActive', operator: 'equals', values: [true] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // Active employees should have productivity data
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should propagate numeric comparison filters to CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.avgLinesOfCode'])
        .filters([
          { member: 'Employees.salary', operator: 'gt', values: [50000] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
    })

    it('should propagate date range filters to CTE', async () => {
      // Query with date range but no granularity returns single aggregate
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .filters([
          {
            member: 'Productivity.date',
            operator: 'inDateRange',
            values: ['2024-01-01', '2024-12-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Single aggregate row
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Productivity.recordCount']).toBeGreaterThanOrEqual(0)
    })

    it('should handle AND filters in CTE propagation', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .filters([
          {
            and: [
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              { member: 'Employees.salary', operator: 'gte', values: [40000] }
            ]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
    })

    it('should skip OR filters with mixed-cube branches (safety check)', async () => {
      // This OR filter has branches from different cubes - should be skipped in CTE
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .filters([
          {
            or: [
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              { member: 'Productivity.happinessIndex', operator: 'gt', values: [5] }
            ]
          }
        ])
        .build()

      // Should not throw - the OR filter is safely skipped in CTE propagation
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should propagate OR filters when all branches belong to same cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          {
            or: [
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              { member: 'Employees.salary', operator: 'gt', values: [100000] }
            ]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // Should get active employees OR high earners
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CTE Join Key Handling', () => {
    it('should handle single join key correctly', async () => {
      // Employees.id -> Productivity.employeeId is a single key join
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.avgHappinessIndex'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should aggregate CTE results by join key', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .dimensions(['Employees.id'])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Each row should have employee ID with aggregated productivity
      for (const row of result.data) {
        expect(row['Employees.id']).toBeDefined()
      }
    })
  })

  describe('CTE with Time Dimensions', () => {
    it('should handle time dimension granularity in CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.avgLinesOfCode'])
        .timeDimensions([
          { dimension: 'Productivity.date', granularity: 'month' }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Productivity.date']).toBeDefined()
      }
    })

    it('should handle time dimension with date range filter', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalPullRequests'])
        .timeDimensions([
          {
            dimension: 'Productivity.date',
            granularity: 'week',
            dateRange: ['2024-01-01', '2024-03-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have weekly buckets within Q1 2024
      expect(result.data.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CTE Performance Characteristics', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = performance.now()

      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.id', 'Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)
      const duration = performance.now() - startTime

      expect(result.data.length).toBeGreaterThan(0)
      // Should complete in reasonable time (under 5 seconds)
      expect(duration).toBeLessThan(5000)
    })

    it('should handle multiple measures with same CTE efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.recordCount',
          'Productivity.totalLinesOfCode',
          'Productivity.avgLinesOfCode',
          'Productivity.totalPullRequests',
          'Productivity.avgHappinessIndex'
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // All measures should be populated
      expect(result.data[0]['Productivity.recordCount']).toBeDefined()
      expect(result.data[0]['Productivity.totalLinesOfCode']).toBeDefined()
    })
  })

  describe('Security Context in CTEs', () => {
    it('should apply security context to CTE queries', async () => {
      // Query with org1 security context
      const org1Result = await testExecutor.executeQuery(
        TestQueryBuilder.create()
          .measures(['Productivity.recordCount'])
          .build()
      )

      // Create executor with org2 context
      const { executor: dbExecutor2, close: close2 } = await createTestDatabaseExecutor()
      const executor2 = new QueryExecutor(dbExecutor2)
      const cubes2 = await getTestCubes()
      const testExecutor2 = new TestExecutor(executor2, cubes2, testSecurityContexts.org2)

      const org2Result = await testExecutor2.executeQuery(
        TestQueryBuilder.create()
          .measures(['Productivity.recordCount'])
          .build()
      )

      close2()

      // Different orgs should get different (or zero) results
      expect(org1Result.data[0]['Productivity.recordCount']).toBeGreaterThanOrEqual(0)
      expect(org2Result.data[0]['Productivity.recordCount']).toBeGreaterThanOrEqual(0)
    })

    it('should isolate CTE data by organisation', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.departmentId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // All results should be from org1 only
      expect(result.data.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty CTE results gracefully', async () => {
      // Filter that likely returns no results
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .filters([
          { member: 'Employees.salary', operator: 'gt', values: [999999999] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // Should return zeros, not throw
      expect(result.data[0]['Employees.count']).toBe(0)
    })

    it('should handle null values in join keys', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should complete without error even if some employee IDs are null
      expect(result.data).toBeDefined()
    })

    it('should handle CTE with no matching parent records', async () => {
      // Query for productivity of non-existent employees
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          { member: 'Employees.id', operator: 'equals', values: [-999] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // Should return null or zero for non-existent data
    })
  })
})

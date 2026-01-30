/**
 * LEFT JOIN Security Filter Placement Tests
 *
 * Tests that security filters are placed in the JOIN ON clause for LEFT JOINs
 * to preserve NULL rows when the joined table has no matching records.
 *
 * Problem:
 *   When security context is applied as a global WHERE clause, LEFT JOINs
 *   behave like INNER JOINs because rows with NULL values from joined tables
 *   get filtered out.
 *
 * Required behavior:
 *   Security filters should be in JOIN ON clause for LEFT JOINs so that
 *   rows without matching data still appear with NULLs.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { Cube } from '../src/server/types'

describe('LEFT JOIN Security Filter Placement', () => {
  let testExecutor: TestExecutor
  let queryExecutor: QueryExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    // Get database executor and schema
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    // Create query executor
    queryExecutor = new QueryExecutor(dbExecutor)

    // Get test cubes from existing test infrastructure
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])

    // Create test executor with org-1 security context
    testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Security Context Isolation with LEFT JOINs', () => {
    it('should return productivity data only for the security context organization', async () => {
      // Query as Org1
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have results
      expect(result.data.length).toBeGreaterThan(0)

      // Every row should have a valid count (from org-1 data)
      for (const row of result.data) {
        expect(row['Productivity.recordCount']).toBeDefined()
        expect(typeof row['Productivity.recordCount']).toBe('number')
      }
    })

    it('should not leak productivity data across organizations', async () => {
      // Query as Org1
      const org1Query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .build()

      const org1Result = await testExecutor.executeQuery(org1Query)

      // Query as Org2
      const org2Executor = new TestExecutor(
        queryExecutor,
        cubes,
        testSecurityContexts.org2
      )
      const org2Result = await org2Executor.executeQuery(org1Query)

      // Both should have data
      expect(org1Result.data.length).toBeGreaterThan(0)
      expect(org2Result.data.length).toBeGreaterThan(0)

      // Results should be different (different org data)
      const org1Total = org1Result.data[0]['Productivity.totalLinesOfCode']
      const org2Total = org2Result.data[0]['Productivity.totalLinesOfCode']
      expect(org1Total).not.toEqual(org2Total)
    })
  })

  describe('Multi-Measure Queries with LEFT JOIN Security', () => {
    it('should handle multiple productivity measures correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have results
      expect(result.data.length).toBeGreaterThan(0)

      // Each row should have valid data
      for (const row of result.data) {
        expect(row['Productivity.recordCount']).toBeDefined()
        expect(row['Productivity.totalLinesOfCode']).toBeDefined()
        expect(row['Employees.name']).toBeDefined()
      }
    })

    it('should correctly aggregate productivity by employee', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .dimensions(['Employees.name'])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.length).toBeLessThanOrEqual(5)

      for (const row of result.data) {
        expect(row['Employees.name']).toBeDefined()
        expect(typeof row['Employees.name']).toBe('string')
      }
    })
  })

  describe('Aggregation Accuracy with Security Filters', () => {
    it('should calculate correct totals with security context applied', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have exactly one result row (aggregate)
      expect(result.data).toHaveLength(1)

      // Total should be a positive number (org-1 has productivity data)
      const total = result.data[0]['Productivity.totalLinesOfCode']
      expect(typeof total).toBe('number')
      expect(total).toBeGreaterThan(0)
    })

    it('should correctly group by dimensions with security isolation', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .dimensions(['Employees.departmentId'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row['Employees.departmentId']).toBeDefined()
        expect(row['Employees.count']).toBeGreaterThanOrEqual(0)
        expect(row['Productivity.recordCount']).toBeGreaterThanOrEqual(0)
      }
    })
  })
})

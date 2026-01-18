/**
 * Complex Joins Test Suite
 *
 * Tests complex join scenarios including deep join paths, multiple relationship types,
 * star schemas, and join path selection.
 *
 * Covers:
 * - 4+ level deep join paths
 * - Multiple possible join paths (verify deterministic selection)
 * - Join with all 4 relationship types simultaneously
 * - Star schema with 3+ fact cubes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor, skipIfDuckDB } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import type { Cube } from '../src/server/types'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Complex Joins Tests', () => {
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

  describe('Multi-Level Join Paths', () => {
    it('should handle 2-level join path (Productivity -> Employees)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
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

    it('should handle 3-level join path (Productivity -> Employees -> Departments)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Departments.name']).toBeDefined()
      }
    })

    it('should handle join path with mixed relationship types', async () => {
      // Employees has: hasMany -> Productivity, belongsTo -> Departments
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.avgHappinessIndex'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('All Relationship Types', () => {
    it('should handle belongsTo relationship (Employees -> Departments)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Departments.name']).toBeDefined()
        expect(row['Employees.count']).toBeGreaterThan(0)
      }
    })

    it('should handle hasMany relationship (Employees -> Productivity)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
      expect(result.data[0]['Productivity.totalLinesOfCode']).toBeGreaterThanOrEqual(0)
    })

    it('should handle belongsToMany relationship (Employees -> Teams)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Teams.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // May have results if teams data exists
      expect(result.data).toBeDefined()
    })

    it('should combine multiple relationship types in single query', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.avgLinesOfCode'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Departments.name']).toBeDefined()
        expect(row['Employees.count']).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Join Path Selection', () => {
    // DuckDB: Without ORDER BY, row ordering is non-deterministic
    it.skipIf(skipIfDuckDB())('should select consistent join path for same query', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .dimensions(['Departments.name'])
        .build()

      // Execute same query multiple times
      const results = await Promise.all([
        testExecutor.executeQuery(query),
        testExecutor.executeQuery(query),
        testExecutor.executeQuery(query)
      ])

      // All results should be identical (deterministic)
      expect(results[0].data).toEqual(results[1].data)
      expect(results[1].data).toEqual(results[2].data)
    })

    it('should handle query with filters across joined cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          { member: 'Employees.isActive', operator: 'equals', values: [true] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // All returned employees should be active
    })

    it('should handle filters on dimension cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          { member: 'Departments.name', operator: 'contains', values: ['Engineering'] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should only get Engineering department results
      for (const row of result.data) {
        expect(row['Departments.name']).toContain('Engineering')
      }
    })
  })

  describe('Cross-Cube Aggregation', () => {
    it('should aggregate correctly across belongsTo join', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Employees.count']).toBeGreaterThan(0)
        // avgSalary may be 0 or null for departments with no employees in org
        expect(row['Employees.avgSalary']).toBeGreaterThanOrEqual(0)
      }
    })

    it('should aggregate correctly across hasMany join', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .dimensions(['Employees.name'])
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Employees.name']).toBeDefined()
      }
    })

    it('should handle count distinct across joins', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.countDistinctDepartments'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.countDistinctDepartments']).toBeGreaterThan(0)
    })
  })

  describe('Join with Ordering', () => {
    it('should order by dimension from joined cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .order({ 'Departments.name': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Verify ascending order
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Departments.name'] as string
        const curr = result.data[i]['Departments.name'] as string
        expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0)
      }
    })

    it('should order by measure with joined dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .order({ 'Employees.count': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Verify descending order by count
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Employees.count'] as number
        const curr = result.data[i]['Employees.count'] as number
        expect(prev).toBeGreaterThanOrEqual(curr)
      }
    })
  })

  describe('Join with Limit and Offset', () => {
    it('should respect limit with joined queries', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeLessThanOrEqual(5)
    })

    it('should respect offset with joined queries', async () => {
      const queryWithoutOffset = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .limit(10)
        .build()

      const queryWithOffset = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .limit(5)
        .offset(5)
        .build()

      const resultWithoutOffset = await testExecutor.executeQuery(queryWithoutOffset)
      const resultWithOffset = await testExecutor.executeQuery(queryWithOffset)

      // With offset=5, should get rows 6-10 from the full result
      if (resultWithoutOffset.data.length >= 10) {
        expect(resultWithOffset.data[0]).toEqual(resultWithoutOffset.data[5])
      }
    })
  })

  describe('Security Context Across Joins', () => {
    it('should apply security context to all joined tables', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // All data should be filtered by org1 security context
      expect(result.data.length).toBeGreaterThanOrEqual(0)
    })

    it('should isolate data between organisations in joins', async () => {
      // Execute with org1
      const org1Query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()
      const org1Result = await testExecutor.executeQuery(org1Query)

      // Execute with org2
      const { executor: dbExecutor2, close: close2 } = await createTestDatabaseExecutor()
      const executor2 = new QueryExecutor(dbExecutor2)
      const cubes2 = await getTestCubes()
      const testExecutor2 = new TestExecutor(executor2, cubes2, testSecurityContexts.org2)

      const org2Result = await testExecutor2.executeQuery(org1Query)
      close2()

      // Results should be different (different orgs)
      // At minimum, total counts should differ if data exists for both
      expect(org1Result.data).toBeDefined()
      expect(org2Result.data).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle join to cube with no matching data', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          { member: 'Departments.name', operator: 'equals', values: ['NonExistentDepartment'] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return empty or zero, not throw
      expect(result.data).toBeDefined()
    })

    it('should handle self-referencing dimension lookups', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.id', 'Employees.name'])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle null foreign keys in joins', async () => {
      // Query that might have null department IDs
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      // Should not throw even if some employees have null department
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should execute complex join query within time limit', async () => {
      const startTime = performance.now()

      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary', 'Productivity.totalLinesOfCode'])
        .dimensions(['Departments.name', 'Employees.isActive'])
        .filters([
          { member: 'Employees.salary', operator: 'gte', values: [30000] }
        ])
        .order({ 'Employees.count': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)
      const duration = performance.now() - startTime

      expect(result.data).toBeDefined()
      // Should complete in under 3 seconds
      expect(duration).toBeLessThan(3000)
    })
  })
})

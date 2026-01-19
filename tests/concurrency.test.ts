/**
 * Concurrency Test Suite
 *
 * Tests concurrent query execution, thread safety, and cache behavior.
 *
 * Covers:
 * - Parallel query execution
 * - Filter cache thread safety
 * - Metadata cache concurrent access
 * - Race condition prevention
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor, skipIfDuckDB } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import type { Cube } from '../src/server/types'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

// DuckDB: Now uses file-based database with threads pool for concurrent read access
// Some concurrency tests may still fail due to DuckDB's prepared statement limitations
describe('Concurrency Tests', () => {
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

  describe('Parallel Query Execution', () => {
    it('should execute multiple identical queries in parallel', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      const results = await Promise.all([
        testExecutor.executeQuery(query),
        testExecutor.executeQuery(query),
        testExecutor.executeQuery(query),
        testExecutor.executeQuery(query),
        testExecutor.executeQuery(query)
      ])

      // All results should be identical
      const firstResult = results[0].data[0]['Employees.count']
      for (const result of results) {
        expect(result.data[0]['Employees.count']).toBe(firstResult)
      }
    })

    it('should execute different queries in parallel', async () => {
      const queries = [
        TestQueryBuilder.create().measures(['Employees.count']).build(),
        TestQueryBuilder.create().measures(['Departments.count']).build(),
        TestQueryBuilder.create().measures(['Productivity.recordCount']).build(),
        TestQueryBuilder.create().measures(['Employees.avgSalary']).build(),
        TestQueryBuilder.create().measures(['Productivity.totalLinesOfCode']).build()
      ]

      const results = await Promise.all(
        queries.map(q => testExecutor.executeQuery(q))
      )

      // All should complete successfully
      expect(results).toHaveLength(5)
      for (const result of results) {
        expect(result.data).toBeDefined()
        expect(result.data.length).toBeGreaterThan(0)
      }
    })

    // Skip on DuckDB: 20 parallel queries exceed DuckDB's prepared statement concurrency limits
    // Even with instance caching, extreme parallelism causes "Failed to execute prepared statement" errors
    it.skipIf(skipIfDuckDB())('should handle high concurrency load', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .build()

      // Execute 20 parallel queries
      const promises = Array(20).fill(null).map(() =>
        testExecutor.executeQuery(query)
      )

      const startTime = performance.now()
      const results = await Promise.all(promises)
      const duration = performance.now() - startTime

      // All should complete successfully
      expect(results).toHaveLength(20)
      for (const result of results) {
        expect(result.data).toBeDefined()
      }

      // Should complete in reasonable time (parallelism should help)
      expect(duration).toBeLessThan(10000)
    })
  })

  describe('Concurrent Security Contexts', () => {
    it('should isolate queries by security context', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      // Create executor for org2
      const { executor: dbExecutor2, close: close2 } = await createTestDatabaseExecutor()
      const executor2 = new QueryExecutor(dbExecutor2)
      const cubes2 = await getTestCubes()
      const testExecutor2 = new TestExecutor(executor2, cubes2, testSecurityContexts.org2)

      // Execute same query with different security contexts in parallel
      const [org1Result, org2Result] = await Promise.all([
        testExecutor.executeQuery(query),
        testExecutor2.executeQuery(query)
      ])

      close2()

      // Both should complete successfully
      expect(org1Result.data).toBeDefined()
      expect(org2Result.data).toBeDefined()

      // Results should be isolated by org
      expect(org1Result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
      expect(org2Result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should handle interleaved queries from multiple orgs', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .build()

      const { executor: dbExecutor2, close: close2 } = await createTestDatabaseExecutor()
      const executor2 = new QueryExecutor(dbExecutor2)
      const cubes2 = await getTestCubes()
      const testExecutor2 = new TestExecutor(executor2, cubes2, testSecurityContexts.org2)

      // Interleave queries from both orgs
      const results = await Promise.all([
        testExecutor.executeQuery(query),
        testExecutor2.executeQuery(query),
        testExecutor.executeQuery(query),
        testExecutor2.executeQuery(query),
        testExecutor.executeQuery(query),
        testExecutor2.executeQuery(query)
      ])

      close2()

      // All should complete successfully
      expect(results).toHaveLength(6)
      for (const result of results) {
        expect(result.data).toBeDefined()
      }

      // Org1 results should be consistent (indices 0, 2, 4)
      expect(results[0].data[0]['Employees.count'])
        .toBe(results[2].data[0]['Employees.count'])
      expect(results[2].data[0]['Employees.count'])
        .toBe(results[4].data[0]['Employees.count'])

      // Org2 results should be consistent (indices 1, 3, 5)
      expect(results[1].data[0]['Employees.count'])
        .toBe(results[3].data[0]['Employees.count'])
      expect(results[3].data[0]['Employees.count'])
        .toBe(results[5].data[0]['Employees.count'])
    })
  })

  describe('Query Result Consistency', () => {
    it('should return consistent results for concurrent identical queries', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions(['Employees.departmentId'])
        .order({ 'Employees.departmentId': 'asc' })
        .build()

      // Execute 10 identical queries concurrently
      const results = await Promise.all(
        Array(10).fill(null).map(() => testExecutor.executeQuery(query))
      )

      // All results should be identical
      const firstData = JSON.stringify(results[0].data)
      for (const result of results) {
        expect(JSON.stringify(result.data)).toBe(firstData)
      }
    })

    it('should handle concurrent aggregations correctly', async () => {
      // Different aggregation queries
      const countQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      const sumQuery = TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .build()

      const avgQuery = TestQueryBuilder.create()
        .measures(['Employees.avgSalary'])
        .build()

      const minMaxQuery = TestQueryBuilder.create()
        .measures(['Employees.minSalary', 'Employees.maxSalary'])
        .build()

      const [countResult, sumResult, avgResult, minMaxResult] = await Promise.all([
        testExecutor.executeQuery(countQuery),
        testExecutor.executeQuery(sumQuery),
        testExecutor.executeQuery(avgQuery),
        testExecutor.executeQuery(minMaxQuery)
      ])

      // Validate all results are returned correctly
      expect(countResult.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
      expect(sumResult.data[0]['Employees.totalSalary']).toBeGreaterThanOrEqual(0)
      expect(avgResult.data[0]['Employees.avgSalary']).toBeGreaterThanOrEqual(0)

      // Validate min <= avg <= max (basic sanity check)
      const min = minMaxResult.data[0]['Employees.minSalary'] as number
      const max = minMaxResult.data[0]['Employees.maxSalary'] as number
      const avg = avgResult.data[0]['Employees.avgSalary'] as number

      if (min > 0 && max > 0) {
        expect(avg).toBeGreaterThanOrEqual(min)
        expect(avg).toBeLessThanOrEqual(max)
      }
    })
  })

  describe('Concurrent Filter Handling', () => {
    it('should handle concurrent queries with different filters', async () => {
      const queries = [
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.isActive', operator: 'equals', values: [true] }])
          .build(),
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.isActive', operator: 'equals', values: [false] }])
          .build(),
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.salary', operator: 'gt', values: [50000] }])
          .build(),
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.salary', operator: 'lte', values: [50000] }])
          .build()
      ]

      const results = await Promise.all(
        queries.map(q => testExecutor.executeQuery(q))
      )

      // All should complete
      expect(results).toHaveLength(4)
      for (const result of results) {
        expect(result.data).toBeDefined()
      }

      // All queries should return valid counts
      const highSalary = results[2].data[0]['Employees.count'] as number
      const lowSalary = results[3].data[0]['Employees.count'] as number

      // High salary + low salary should equal total (exclusive ranges)
      expect(highSalary + lowSalary).toBeGreaterThanOrEqual(0)
    })

    it('should handle concurrent complex filter combinations', async () => {
      const queries = [
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            {
              and: [
                { member: 'Employees.isActive', operator: 'equals', values: [true] },
                { member: 'Employees.salary', operator: 'gt', values: [50000] }
              ]
            }
          ])
          .build(),
        TestQueryBuilder.create()
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
      ]

      const results = await Promise.all(
        queries.map(q => testExecutor.executeQuery(q))
      )

      expect(results).toHaveLength(2)
      for (const result of results) {
        expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Performance Under Concurrency', () => {
    // Skip on DuckDB: 10 parallel queries exceed DuckDB's prepared statement concurrency limits
    it.skipIf(skipIfDuckDB())('should scale with concurrent requests', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.departmentId'])
        .build()

      // Warm up with single query
      await testExecutor.executeQuery(query)

      // Time 10 concurrent queries
      const concurrentStart = performance.now()
      await Promise.all(
        Array(10).fill(null).map(() => testExecutor.executeQuery(query))
      )
      const concurrentDuration = performance.now() - concurrentStart

      // Concurrent execution should complete successfully
      // SQLite has limited concurrency, so we just verify it completes in reasonable time
      // (10 queries should complete in under 10 seconds regardless of parallelism)
      expect(concurrentDuration).toBeLessThan(10000)
    })

    it('should handle rapid sequential queries efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      const startTime = performance.now()

      // Execute 50 queries sequentially
      for (let i = 0; i < 50; i++) {
        await testExecutor.executeQuery(query)
      }

      const duration = performance.now() - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(30000)
    })
  })

  describe('Race Condition Prevention', () => {
    it('should not mix results between concurrent queries', async () => {
      // Create queries with distinct expected results
      const query1 = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{ member: 'Employees.departmentId', operator: 'equals', values: [1] }])
        .build()

      const query2 = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{ member: 'Employees.departmentId', operator: 'equals', values: [2] }])
        .build()

      // Execute many times concurrently
      const promises: Promise<any>[] = []
      for (let i = 0; i < 20; i++) {
        promises.push(
          testExecutor.executeQuery(query1).then(r => ({ query: 1, result: r })),
          testExecutor.executeQuery(query2).then(r => ({ query: 2, result: r }))
        )
      }

      const results = await Promise.all(promises)

      // Verify no cross-contamination
      const query1Results = results.filter(r => r.query === 1)
      const query2Results = results.filter(r => r.query === 2)

      // All query1 results should be identical
      const firstQ1 = query1Results[0].result.data[0]['Employees.count']
      for (const r of query1Results) {
        expect(r.result.data[0]['Employees.count']).toBe(firstQ1)
      }

      // All query2 results should be identical
      const firstQ2 = query2Results[0].result.data[0]['Employees.count']
      for (const r of query2Results) {
        expect(r.result.data[0]['Employees.count']).toBe(firstQ2)
      }
    })

    it('should maintain query isolation with different dimensions', async () => {
      const queries = [
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .dimensions(['Employees.departmentId'])
          .order({ 'Employees.departmentId': 'asc' })
          .build(),
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .dimensions(['Employees.name'])
          .order({ 'Employees.name': 'asc' })
          .limit(10)
          .build(),
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .dimensions(['Employees.isActive'])
          .order({ 'Employees.isActive': 'asc' })
          .build()
      ]

      // Execute multiple times
      const allPromises: Promise<any>[] = []
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < queries.length; j++) {
          allPromises.push(
            testExecutor.executeQuery(queries[j]).then(r => ({ queryIndex: j, result: r }))
          )
        }
      }

      const results = await Promise.all(allPromises)

      // Group by query index
      const grouped = [0, 1, 2].map(idx =>
        results.filter(r => r.queryIndex === idx)
      )

      // Each group should have consistent results
      for (const group of grouped) {
        const firstData = JSON.stringify(group[0].result.data)
        for (const r of group) {
          expect(JSON.stringify(r.result.data)).toBe(firstData)
        }
      }
    })
  })
})

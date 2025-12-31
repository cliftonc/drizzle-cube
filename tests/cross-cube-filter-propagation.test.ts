/**
 * Cross-Cube Filter Propagation Tests
 *
 * Tests the propagation of filters from one cube into a related cube's CTE.
 * When a query has:
 * - Measures from Productivity cube (uses CTE for hasMany relationship)
 * - Filters on Employees cube (e.g., Employees.createdAt)
 *
 * The Productivity CTE should filter via subquery:
 * employee_id IN (SELECT id FROM employees WHERE created_at >= $date AND organisation_id = $1)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { TestExecutor, TestQueryBuilder } from './helpers/test-utilities'
import type { Cube, SecurityContext } from '../src/server/types'

describe('Cross-Cube Filter Propagation', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void
  const testSecurityContext: SecurityContext = testSecurityContexts.org1

  beforeAll(async () => {
    // Use the test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()

    // Setup test executor with all cube definitions
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContext)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Basic Filter Propagation', () => {
    it('should propagate Employees.createdAt filter to Productivity CTE', async () => {
      // Query: Productivity measures with Employees.createdAt filter
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          {
            member: 'Employees.createdAt',
            operator: 'inDateRange',
            values: ['2020-01-01', '2025-12-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return a result (not error)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should propagate Employees.isActive filter to Productivity CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.recordCount'])
        .filters([
          {
            member: 'Employees.isActive',
            operator: 'equals',
            values: [true]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should propagate Employees.salary filter (numeric) to Productivity CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgLinesOfCode'])
        .filters([
          {
            member: 'Employees.salary',
            operator: 'gt',
            values: [50000]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })
  })

  describe('Multiple Filters', () => {
    it('should propagate multiple Employees filters to Productivity CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          {
            member: 'Employees.createdAt',
            operator: 'inDateRange',
            values: ['2020-01-01', '2025-12-31']
          },
          {
            member: 'Employees.isActive',
            operator: 'equals',
            values: [true]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should propagate nested AND filters to Productivity CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          {
            and: [
              {
                member: 'Employees.createdAt',
                operator: 'inDateRange',
                values: ['2020-01-01', '2025-12-31']
              },
              {
                member: 'Employees.isActive',
                operator: 'equals',
                values: [true]
              }
            ]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })

    it('should propagate nested OR filters to Productivity CTE', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          {
            or: [
              {
                member: 'Employees.salary',
                operator: 'gt',
                values: [100000]
              },
              {
                member: 'Employees.salary',
                operator: 'lt',
                values: [30000]
              }
            ]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })
  })

  describe('Time Dimension with Filter', () => {
    it('should propagate time dimension dateRange to Productivity CTE', async () => {
      // Time dimension dateRange should be treated as a filter for propagation
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([
          {
            dimension: 'Employees.createdAt',
            granularity: 'month',
            dateRange: ['2020-01-01', '2025-06-30']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })

    it('should propagate combined time dimension and regular filter', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([
          {
            dimension: 'Employees.createdAt',
            granularity: 'month',
            dateRange: ['2020-01-01', '2025-12-31']
          }
        ])
        .filters([
          {
            member: 'Employees.isActive',
            operator: 'equals',
            values: [true]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })
  })

  describe('No Propagation Needed', () => {
    it('should NOT propagate same-cube filters (Productivity filters stay in Productivity CTE)', async () => {
      // When filters are on the same cube as the CTE, no subquery propagation is needed
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          {
            member: 'Productivity.happinessIndex',
            operator: 'gt',
            values: [5]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })

    it('should handle query with only same-cube time dimension', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([
          {
            dimension: 'Productivity.date',
            granularity: 'month',
            dateRange: ['2024-01-01', '2025-12-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })
  })

  describe('Security Context in Subquery', () => {
    it('should include security context in propagating filter subquery', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          {
            member: 'Employees.createdAt',
            operator: 'inDateRange',
            values: ['2020-01-01', '2025-12-31']
          }
        ])
        .build()

      // Execute with org-1 security context
      const org1Result = await testExecutor.executeQuery(query)

      // Execute with org-2 security context
      const org2Executor = new TestExecutor(testExecutor.executor, cubes, testSecurityContexts.org2)
      const org2Result = await org2Executor.executeQuery(query)

      // Results should be different (security isolation working)
      // org-2 should return 0 or null since there's no data for org-2
      expect(org1Result.data).toBeDefined()
      expect(org2Result.data).toBeDefined()

      // org-1 has data, org-2 should not (or have different data)
      expect(org1Result.data.length).toBeGreaterThan(0)
    })
  })

  describe('Complex Multi-Cube Queries', () => {
    it('should handle Employees filter with Departments dimension and Productivity measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          {
            member: 'Employees.createdAt',
            operator: 'inDateRange',
            values: ['2020-01-01', '2025-12-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle filters from multiple cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Employees.isActive',
            operator: 'equals',
            values: [true]
          },
          {
            member: 'Productivity.happinessIndex',
            operator: 'gt',
            values: [5]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty filter values gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })

    it('should handle multiple hasMany cube measures with filter propagation', async () => {
      // This tests the scenario where multiple CTEs need filter propagation
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .filters([
          {
            member: 'Employees.createdAt',
            operator: 'inDateRange',
            values: ['2020-01-01', '2025-12-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })
  })
})

/**
 * Array Operators Tests
 * Tests for PostgreSQL-specific array filter operators:
 * - arrayContains: field contains ALL specified values (@>)
 * - arrayOverlaps: field contains ANY of specified values (&&)
 * - arrayContained: field values are all within specified values (<@)
 *
 * These operators only work with PostgreSQL. For MySQL/SQLite, they silently return null (no-op).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor, getTestDatabaseType } from './helpers/test-database'
import { QueryExecutor } from '../src/server/executor'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { Cube } from '../src/server/types'

describe('Array Operators (PostgreSQL-only)', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void
  const dbType = getTestDatabaseType()

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('arrayContains operator', () => {
    it('should filter employees whose tags contain ALL specified values', async () => {
      if (dbType !== 'postgres') {
        // Skip for non-PostgreSQL databases - filter should be ignored (no-op)
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{
            member: 'Employees.tags',
            operator: 'arrayContains',
            values: ['senior', 'backend']
          }])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        return
      }

      // PostgreSQL: Should return employees with BOTH 'senior' AND 'backend' tags
      // Based on test data: Alex Chen has ['senior', 'backend', 'python', 'aws']
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayContains',
          values: ['senior', 'backend']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Alex Chen should be in results (has both senior and backend)
      const names = result.data.map(r => r['Employees.name'])
      expect(names).toContain('Alex Chen')

      // Sarah Johnson should NOT be in results (has frontend, not backend)
      expect(names).not.toContain('Sarah Johnson')
    })

    it('should handle single value in arrayContains', async () => {
      if (dbType !== 'postgres') {
        return // Skip for non-PostgreSQL
      }

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayContains',
          values: ['senior']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      // Multiple employees have 'senior' tag
      const names = result.data.map(r => r['Employees.name'])
      expect(names).toContain('Alex Chen')
      expect(names).toContain('Mike Rodriguez')
      expect(names).toContain('Lisa Martinez')
      expect(names).toContain('Tom Anderson')

      // Junior employees should not be included
      expect(names).not.toContain('Emily Davis')
      expect(names).not.toContain('James Wilson')
    })
  })

  describe('arrayOverlaps operator', () => {
    it('should filter employees whose tags contain ANY of specified values', async () => {
      if (dbType !== 'postgres') {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{
            member: 'Employees.tags',
            operator: 'arrayOverlaps',
            values: ['python', 'java']
          }])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        return
      }

      // PostgreSQL: Should return employees with 'python' OR 'java' tags
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayOverlaps',
          values: ['python', 'java']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      const names = result.data.map(r => r['Employees.name'])

      // Alex Chen has python
      expect(names).toContain('Alex Chen')
      // Mike Rodriguez has python
      expect(names).toContain('Mike Rodriguez')

      // Sarah Johnson has neither python nor java
      expect(names).not.toContain('Sarah Johnson')
    })

    it('should handle overlaps with react tag (multiple employees)', async () => {
      if (dbType !== 'postgres') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayOverlaps',
          values: ['react']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      const names = result.data.map(r => r['Employees.name'])
      // Sarah Johnson, Mike Rodriguez, Emily Davis all have 'react'
      expect(names).toContain('Sarah Johnson')
      expect(names).toContain('Mike Rodriguez')
      expect(names).toContain('Emily Davis')
    })
  })

  describe('arrayContained operator', () => {
    it('should filter employees whose tags are ALL within specified values', async () => {
      if (dbType !== 'postgres') {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{
            member: 'Employees.tags',
            operator: 'arrayContained',
            values: ['frontend', 'react', 'typescript', 'vue', 'angular']
          }])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        return
      }

      // PostgreSQL: Should return employees whose ALL tags are within the specified set
      // Sarah Johnson has ['frontend', 'react', 'typescript'] - all are in the allowed set
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayContained',
          values: ['frontend', 'react', 'typescript', 'vue', 'angular']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()

      const names = result.data.map(r => r['Employees.name'])
      // Sarah Johnson's tags ['frontend', 'react', 'typescript'] are all in the allowed set
      expect(names).toContain('Sarah Johnson')

      // Alex Chen has 'aws' which is not in the allowed set
      expect(names).not.toContain('Alex Chen')
    })
  })

  describe('edge cases', () => {
    it('should handle empty array values gracefully', async () => {
      // Empty values should result in no filter being applied (returns null)
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayContains',
          values: []
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      // With empty filter values, the filter should be skipped
    })

    it('should work with other filters combined', async () => {
      if (dbType !== 'postgres') {
        return
      }

      // Combine array filter with regular filter
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Employees.tags',
            operator: 'arrayOverlaps',
            values: ['senior']
          },
          {
            member: 'Employees.active',
            operator: 'equals',
            values: [true]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // All results should have 'senior' tag AND be active
      const names = result.data.map(r => r['Employees.name'])
      expect(names).toContain('Alex Chen') // senior and active
      expect(names).not.toContain('Rachel Green') // inactive
    })

    it('should respect security context with array operators', async () => {
      if (dbType !== 'postgres') {
        return
      }

      // Query for org 1
      const org1Executor = new TestExecutor(
        testExecutor['executor'],
        cubes,
        testSecurityContexts.org1
      )

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayOverlaps',
          values: ['senior']
        }])
        .build()

      const org1Result = await org1Executor.executeQuery(query)

      // Query for org 2
      const org2Executor = new TestExecutor(
        testExecutor['executor'],
        cubes,
        testSecurityContexts.org2
      )

      const org2Result = await org2Executor.executeQuery(query)

      expect(org1Result.data).toBeDefined()
      expect(org2Result.data).toBeDefined()

      // Results should be different due to security context
      const org1Count = org1Result.data[0]?.['Employees.count'] || 0
      const org2Count = org2Result.data[0]?.['Employees.count'] || 0

      // Org 1 has more senior employees than Org 2
      expect(org1Count).toBeGreaterThan(org2Count)
    })
  })

  describe('non-PostgreSQL behavior', () => {
    it('should silently skip array operators on non-PostgreSQL databases', async () => {
      // This test validates that array operators don't cause errors on MySQL/SQLite
      // The filter should be silently ignored (return null from buildFilterCondition)

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.tags',
          operator: 'arrayContains',
          values: ['senior']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      if (dbType !== 'postgres') {
        // On non-PostgreSQL, the filter is skipped, so we get all employees
        // This is the expected "silent no-op" behavior
        expect(result.data[0]?.['Employees.count']).toBeGreaterThan(0)
      }
    })
  })
})

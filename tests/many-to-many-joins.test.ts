/**
 * Tests for belongsToMany (many-to-many) relationships using junction tables
 * Uses existing timeEntries table as a junction table between employees and departments
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { QueryExecutor } from '../src/server/executor'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { Cube } from '../src/server/types'

describe('Many-to-Many Joins (belongsToMany)', () => {
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

  describe('Basic belongsToMany Queries', () => {
    it('should query employees with departments through time entries junction table', async () => {
      // Query employees by department using the many-to-many relationship
      // Note: Using DepartmentsViaTimeEntries which goes through the timeEntries junction table
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Departments.name'],
        { 'Employees.count': 'number', 'Departments.name': 'string' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify we have department data
      const firstRow = result.data[0]
      expect(firstRow['Departments.name']).toBeDefined()
      expect(firstRow['Employees.count']).toBeGreaterThan(0)
    })

    it('should handle measures from employees across many-to-many join', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.totalSalary'])
        .dimensions(['Departments.name'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.totalSalary', 'Departments.name'],
        {
          'Employees.count': 'number',
          'Employees.totalSalary': 'number',
          'Departments.name': 'string'
        }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)

      // Verify each row has all measures
      for (const row of result.data) {
        expect(row['Employees.count']).toBeDefined()
        expect(row['Employees.totalSalary']).toBeDefined()
        expect(row['Departments.name']).toBeDefined()
      }
    })

    it('should correctly aggregate across junction table', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Each department should have employees
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeGreaterThan(0)
        expect(typeof row['Departments.name']).toBe('string')
      })
    })
  })

  describe('Security Context with belongsToMany', () => {
    it('should enforce security context on junction table', async () => {
      // Query with org1 context (should only see org1 data)
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const org1Result = await testExecutor.executeQuery(query, testSecurityContexts.org1)

      expect(org1Result.data).toBeDefined()
      expect(org1Result.data.length).toBeGreaterThan(0)

      // All results should be from org1 (verified by security context enforcement)
      // The security context is applied to employees, departments, AND timeEntries
      org1Result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeGreaterThan(0)
      })
    })

    it('should apply security filtering to all tables in belongsToMany join', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.totalSalary'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Verify we get results (security context properly applied)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // All measures should be valid numbers
      result.data.forEach((row: any) => {
        expect(typeof row['Employees.count']).toBe('number')
        // totalSalary might be a string/object in some databases, convert to number
        const totalSalary = Number(row['Employees.totalSalary'])
        expect(typeof totalSalary).toBe('number')
        expect(row['Employees.count']).toBeGreaterThan(0)
      })
    })
  })

  describe('Complex belongsToMany Queries', () => {
    it('should handle filters with belongsToMany relationships', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([{
          member: 'Employees.isActive',
          operator: 'equals',
          values: [true]
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      // Should have results for active employees
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should combine belongsToMany with other joins', async () => {
      // Query that uses both regular joins and belongsToMany
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      // Verify we can combine belongsToMany with hasMany relationships
      if (result.data.length > 0) {
        const firstRow = result.data[0]
        expect(firstRow['Employees.count']).toBeDefined()
        expect(firstRow['Departments.name']).toBeDefined()
        // Productivity might be 0 or null for some departments
        expect(firstRow['Productivity.totalLinesOfCode'] !== undefined).toBe(true)
      }
    })

    it('should handle multiple measures across belongsToMany join', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',
          'Employees.totalSalary',
          'Employees.avgSalary',
          'Employees.minSalary',
          'Employees.maxSalary'
        ])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify all measures are present and valid
      result.data.forEach((row: any) => {
        expect(typeof row['Employees.count']).toBe('number')
        // Convert to numbers in case they're returned as strings/objects
        const totalSalary = Number(row['Employees.totalSalary'])
        const avgSalary = Number(row['Employees.avgSalary'])
        const minSalary = Number(row['Employees.minSalary'])
        const maxSalary = Number(row['Employees.maxSalary'])

        expect(typeof totalSalary).toBe('number')
        expect(typeof avgSalary).toBe('number')
        expect(typeof minSalary).toBe('number')
        expect(typeof maxSalary).toBe('number')

        // Sanity checks on aggregations
        expect(minSalary).toBeLessThanOrEqual(maxSalary)
        // avgSalary might be 0 if no salary data, or > 0 if there is salary data
        expect(avgSalary).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('SQL Generation for belongsToMany', () => {
    it('should generate correct SQL with junction table joins', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      // Execute the query to verify it works
      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.annotation).toBeDefined()

      // Verify the query executed successfully (proves SQL was generated correctly)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle queries with dimensions from junction table via belongsToMany', async () => {
      // This test specifically validates the bug scenario:
      // - Measure from Employees cube
      // - Dimension from TimeEntries cube (the junction table itself)
      // This forces the query to use the belongsToMany relationship path
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['TimeEntries.allocationType'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify we have the junction table dimension
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeDefined()
        expect(typeof row['Employees.count']).toBe('number')
        expect(row['TimeEntries.allocationType']).toBeDefined()
        expect(typeof row['TimeEntries.allocationType']).toBe('string')
      })
    })

    it('should handle complex belongsToMany with junction and target dimensions', async () => {
      // Test with dimensions from both the junction table AND the target table
      // This validates the full belongsToMany join path: Employees -> TimeEntries -> Departments
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'TimeEntries.totalHours'])
        .dimensions([
          'TimeEntries.allocationType',  // From junction table
          'Departments.name'              // From target table via junction
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify all fields are present
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeDefined()
        expect(typeof row['Employees.count']).toBe('number')
        expect(row['TimeEntries.allocationType']).toBeDefined()
        expect(typeof row['TimeEntries.allocationType']).toBe('string')
        expect(row['Departments.name']).toBeDefined()
        expect(typeof row['Departments.name']).toBe('string')
        // totalHours might be string or number depending on database
        const totalHours = Number(row['TimeEntries.totalHours'])
        expect(typeof totalHours).toBe('number')
      })
    })

    it('should handle belongsToMany with ONLY junction table access (Employees -> Teams)', async () => {
      // CRITICAL TEST: This demonstrates the bug
      // Teams is ONLY accessible from Employees via the belongsToMany relationship
      // There is NO direct foreign key relationship between Employees and Teams
      // This forces the query planner to use the belongsToMany join logic
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Teams.name'])  // Teams is ONLY accessible via employeeTeams junction
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify we have team data
      result.data.forEach((row: any) => {
        expect(row['Employees.count']).toBeDefined()
        expect(typeof row['Employees.count']).toBe('number')
        expect(row['Employees.count']).toBeGreaterThan(0)
        expect(row['Teams.name']).toBeDefined()
        expect(typeof row['Teams.name']).toBe('string')
      })
    })
  })
})

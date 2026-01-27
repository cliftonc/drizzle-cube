/**
 * CTE Downstream Join Bug Tests
 *
 * Tests the scenario where:
 * 1. A cube is CTE'd (hasMany relationship from primary)
 * 2. A filter or dimension is on a cube that COULD be reached through the CTE'd cube
 * 3. The query planner should prefer the direct join path, not through the CTE
 *
 * Bug Scenario:
 *   Query: measures from Productivity (CTE'd), dimensions from Employees, filters on Departments
 *   Primary cube: Employees (has dimensions)
 *   Join paths to Departments:
 *     - Direct: Employees → Departments (length 1, via employees.departmentId)
 *     - Through CTE: Employees → Productivity → Departments (length 2, Productivity is CTE'd)
 *
 * Expected: Use direct path (Employees → Departments)
 * Bug: Path scorer prefers "already processed" cubes, choosing the longer path through
 *      the CTE'd Productivity cube, which causes SQL errors because the join references
 *      the original table name instead of the CTE alias.
 *
 * Note: The test schema's productivity table doesn't have a departmentId column, so we
 * can't test the exact bug scenario. Instead, we test that:
 * 1. The fix doesn't break existing functionality (regression tests)
 * 2. CTE queries with filters on directly-joinable cubes work correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('CTE Downstream Join Bug', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    // Get database executor and schema
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    // Create cubes for testing
    cubes = await createCTETestCubes()

    // Create test executor
    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('CTE cube with filters on directly-joinable cube', () => {
    it('should handle filters on cube joined directly from primary (not through CTE)', async () => {
      // Productivity.avgHappinessIndex → Productivity becomes CTE (hasMany from Employees)
      // Employees.name → Employees is primary cube
      // Departments.name filter → Should join via Employees→Departments directly
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgHappinessIndex'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Departments.name',
            operator: 'equals',
            values: ['Engineering']
          }
        ])
        .limit(100)
        .build()

      // This should work - Departments is joined directly from Employees, not through Productivity CTE
      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle dimensions on cube joined directly from primary (not through CTE)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgHappinessIndex'])
        .dimensions(['Employees.name', 'Departments.name'])
        .limit(100)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)

      // Verify structure includes all requested dimensions
      if (result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('Employees.name')
        expect(result.data[0]).toHaveProperty('Departments.name')
        expect(result.data[0]).toHaveProperty('Productivity.avgHappinessIndex')
      }
    })

    it('should handle multiple measures from CTE cube with filters on primary-joinable cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgHappinessIndex', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Departments.name',
            operator: 'equals',
            values: ['Engineering']
          }
        ])
        .limit(100)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle combined measures from primary and CTE cubes with filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.avgHappinessIndex'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Departments.name',
            operator: 'equals',
            values: ['Engineering']
          }
        ])
        .limit(100)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('Regression: Direct join paths should still work', () => {
    it('should still use direct path when no CTE is involved', async () => {
      // No Productivity measures, so no CTE created
      // Should use direct Employees → Departments path
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name', 'Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle filters on direct join without CTE interference', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Departments.name',
            operator: 'equals',
            values: ['Engineering']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
    })

    it('should handle CTE cube measures without filters on other cubes', async () => {
      // Just CTE cube measures and primary cube dimensions - no third cube involvement
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgHappinessIndex', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('Filter-only cubes (not in dimensions)', () => {
    it('should handle filter-only cube with notEquals operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgHappinessIndex'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Departments.name',
            operator: 'notEquals',
            values: ['HR']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })
})

/**
 * Create cubes for CTE downstream join testing
 *
 * Schema Structure:
 *   Employees ──belongsTo──→ Departments
 *       │
 *       └─hasMany─→ Productivity ──belongsTo──→ Employees
 *
 * Note: In the test schema, Productivity does NOT have a direct path to Departments.
 * The fix ensures that when Productivity is CTE'd, the path finder still correctly
 * uses the direct Employees → Departments path instead of trying to go through
 * the CTE'd Productivity cube.
 */
async function createCTETestCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, productivity } = await getTestSchema()

  // Declare cube variables for forward references
  let employeesCube: Cube
  let departmentsCube: Cube
  let productivityCube: Cube

  // Departments Cube
  departmentsCube = defineCube('Departments', {
    title: 'Departments',
    description: 'Department analytics',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),

    dimensions: {
      id: {
        name: 'id',
        title: 'Department ID',
        type: 'number',
        sql: departments.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Department Name',
        type: 'string',
        sql: departments.name
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Department Count',
        type: 'count',
        sql: departments.id
      }
    }
  })

  // Employees Cube - Primary cube with belongsTo Departments and hasMany Productivity
  employeesCube = defineCube('Employees', {
    title: 'Employees',
    description: 'Employee analytics with department and productivity relationships',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      // Direct relationship to Departments (belongsTo)
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [
          { source: employees.departmentId, target: departments.id }
        ]
      },
      // hasMany relationship to Productivity - this triggers CTE creation when measures are used
      Productivity: {
        targetCube: () => productivityCube,
        relationship: 'hasMany',
        on: [
          { source: employees.id, target: productivity.employeeId }
        ]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Employee ID',
        type: 'number',
        sql: employees.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Employee Name',
        type: 'string',
        sql: employees.name
      },
      departmentId: {
        name: 'departmentId',
        title: 'Department ID',
        type: 'number',
        sql: employees.departmentId
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Total Employees',
        type: 'countDistinct',
        sql: employees.id
      },
      avgSalary: {
        name: 'avgSalary',
        title: 'Average Salary',
        type: 'avg',
        sql: employees.salary
      }
    }
  })

  // Productivity Cube - only has belongsTo Employees (test schema has no departmentId on productivity)
  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    description: 'Productivity metrics with employee relationship',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: [
          { source: productivity.employeeId, target: employees.id }
        ]
      }
      // Note: No Departments join - test schema productivity table doesn't have departmentId
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Record ID',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      },
      date: {
        name: 'date',
        title: 'Date',
        type: 'time',
        sql: productivity.date
      },
      happinessIndex: {
        name: 'happinessIndex',
        title: 'Happiness Index',
        type: 'number',
        sql: productivity.happinessIndex
      }
    },

    measures: {
      recordCount: {
        name: 'recordCount',
        title: 'Total Records',
        type: 'count',
        sql: productivity.id
      },
      avgHappinessIndex: {
        name: 'avgHappinessIndex',
        title: 'Average Happiness',
        type: 'avg',
        sql: productivity.happinessIndex
      },
      totalLinesOfCode: {
        name: 'totalLinesOfCode',
        title: 'Total Lines of Code',
        type: 'sum',
        sql: productivity.linesOfCode
      },
      avgLinesOfCode: {
        name: 'avgLinesOfCode',
        title: 'Average Lines of Code',
        type: 'avg',
        sql: productivity.linesOfCode
      }
    }
  })

  return new Map([
    ['Employees', employeesCube],
    ['Departments', departmentsCube],
    ['Productivity', productivityCube]
  ])
}

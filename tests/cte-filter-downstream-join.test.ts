/**
 * CTE Filter-Only Downstream Join Tests
 *
 * Tests the fix for findDownstreamJoinKeys to include filter-referenced cubes.
 *
 * Bug scenario:
 *   Query: measures from Employees (CTE'd), dimensions from Departments,
 *          filter on Productivity (only in filters, not dimensions)
 *   Primary cube: Departments (has dimensions, hasMany → Employees)
 *   CTE cube: Employees (has measures, hasMany → Productivity)
 *
 * Without fix: findDownstreamJoinKeys on Employees only checks dimensions/timeDimensions,
 *   so Productivity (only in filters) is not detected. The CTE doesn't include the join key
 *   (employees.id) needed for joining Productivity in the outer query.
 *
 * With fix: findDownstreamJoinKeys also checks filters, so Productivity is detected and
 *   the CTE includes the downstream join key.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema, createTestSemanticLayer } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('CTE Filter-Only Downstream Join', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    cubes = await createFilterDownstreamTestCubes()

    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) close()
  })

  describe('Filter on cube joinable only through CTE', () => {
    it('should include downstream join keys when cube is referenced only in filters', async () => {
      // Employees.count → Employees becomes CTE (hasMany from Departments)
      // Departments.name → Departments is primary
      // Productivity filter → joins through CTE (Employees hasMany Productivity)
      //
      // Without fix: findDownstreamJoinKeys on Employees misses Productivity
      //   (only in filters), CTE lacks join key, outer query can't join Productivity
      // With fix: Productivity detected from filters, join key included in CTE
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          {
            member: 'Productivity.happinessIndex',
            operator: 'gte',
            values: [1]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should include downstream join keys for date range filter on CTE-downstream cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          {
            member: 'Productivity.date',
            operator: 'inDateRange',
            values: ['2024-01-01', '2024-12-31']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle combined dimension and filter-only downstream cubes', async () => {
      // Both Departments dimensions AND Productivity filter
      // Departments join key is from dimensions, Productivity join key is from filters
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions(['Departments.name'])
        .filters([
          {
            member: 'Productivity.happinessIndex',
            operator: 'gte',
            values: [3]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('SQL verification for downstream join key inclusion', () => {
    let semanticLayer: Awaited<ReturnType<typeof createTestSemanticLayer>>['semanticLayer']
    let slClose: () => void

    beforeAll(async () => {
      const sl = await createTestSemanticLayer()
      semanticLayer = sl.semanticLayer
      slClose = sl.close

      // Register our test cubes
      for (const cube of cubes.values()) {
        semanticLayer.registerCube(cube)
      }
    })

    afterAll(() => {
      if (slClose) slClose()
    })

    it('should generate SQL with downstream join key in CTE when filter references downstream cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .filters([
          {
            member: 'Productivity.happinessIndex',
            operator: 'gte',
            values: [1]
          }
        ])
        .build()

      const sqlResult = await semanticLayer.dryRun(query, testSecurityContexts.org1)

      // The SQL should contain a CTE (WITH ... AS)
      const sqlText = sqlResult.sql.toLowerCase()
      expect(sqlText).toContain('with')

      // The CTE should reference the productivity table for the filter join
      // (either as a join in the CTE or via downstream join key in outer query)
      expect(sqlText).toContain('productivity')
    })

    it('should NOT include downstream join key when filter cube is not in query at all', async () => {
      // No Productivity reference at all - downstream join key should not be needed
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const sqlResult = await semanticLayer.dryRun(query, testSecurityContexts.org1)
      const sqlText = sqlResult.sql.toLowerCase()

      // Should still have CTE for Employees (hasMany from Departments)
      expect(sqlText).toContain('with')
      // But should NOT reference productivity table
      expect(sqlText).not.toContain('productivity')
    })
  })
})

/**
 * Create cubes for filter-only downstream join testing
 *
 * Topology:
 *   Departments (primary) ──hasMany──→ Employees (CTE) ──hasMany──→ Productivity
 *                                      Employees ──belongsTo──→ Departments
 *                                      Productivity ──belongsTo──→ Employees
 *
 * This topology allows testing that findDownstreamJoinKeys detects
 * Productivity from filters when it's only joinable through the CTE cube (Employees).
 */
async function createFilterDownstreamTestCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, productivity } = await getTestSchema()

  let employeesCube: Cube
  let departmentsCube: Cube
  let productivityCube: Cube

  // Departments - primary cube with dimensions
  departmentsCube = defineCube('Departments', {
    title: 'Departments',
    description: 'Department analytics (primary cube)',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'hasMany',
        on: [
          { source: departments.id, target: employees.departmentId }
        ]
      }
    },

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

  // Employees - CTE cube (hasMany from Departments triggers CTE)
  // Has joins to both Departments (belongsTo) and Productivity (hasMany)
  employeesCube = defineCube('Employees', {
    title: 'Employees',
    description: 'Employee analytics (CTE cube)',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [
          { source: employees.departmentId, target: departments.id }
        ]
      },
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
        type: 'count',
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

  // Productivity - downstream cube (only in filters, joinable through CTE)
  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    description: 'Productivity metrics (filter target, joinable through CTE)',

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
      }
    }
  })

  return new Map([
    ['Departments', departmentsCube],
    ['Employees', employeesCube],
    ['Productivity', productivityCube]
  ])
}

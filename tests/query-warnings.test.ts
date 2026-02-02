/**
 * Query Warnings Tests
 *
 * Tests for the query warning system that alerts users to potential issues
 * with their queries, such as fan-out edge cases.
 *
 * Key scenarios:
 * - FAN_OUT_NO_DIMENSIONS: Multi-cube query with hasMany but no dimensions
 * - No warning when dimensions are present
 * - No warning for single-cube queries
 * - No warning when time dimensions with granularity are present
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition, QueryWarning } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Query Warnings System', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    cubes = await createWarningTestCubes()

    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('FAN_OUT_NO_DIMENSIONS Warning', () => {
    /**
     * Test: Multi-cube query without dimensions should produce warning
     *
     * When querying measures from multiple cubes with hasMany relationships
     * but without any dimensions, users may be confused by the aggregated results.
     */
    it('should produce FAN_OUT_NO_DIMENSIONS warning for multi-cube query without dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        // No dimensions - this is the edge case
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have warnings
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)

      // Find the fan-out warning
      const fanOutWarning = result.warnings!.find(
        (w: QueryWarning) => w.code === 'FAN_OUT_NO_DIMENSIONS'
      )
      expect(fanOutWarning).toBeDefined()

      // Verify warning structure
      expect(fanOutWarning!.severity).toBe('warning')
      expect(fanOutWarning!.message).toContain('hasMany')
      expect(fanOutWarning!.message).toContain('no dimensions')
      expect(fanOutWarning!.suggestion).toBeDefined()
      expect(fanOutWarning!.cubes).toBeDefined()
      expect(fanOutWarning!.cubes!.length).toBeGreaterThanOrEqual(2)
      expect(fanOutWarning!.measures).toBeDefined()
    })

    /**
     * Test: Multi-cube query WITH dimensions should NOT produce warning
     */
    it('should NOT produce warning when dimensions are present', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name']) // Has dimension
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have no warnings (or empty array)
      if (result.warnings) {
        const fanOutWarning = result.warnings.find(
          (w: QueryWarning) => w.code === 'FAN_OUT_NO_DIMENSIONS'
        )
        expect(fanOutWarning).toBeUndefined()
      }
    })

    /**
     * Test: Single-cube query without dimensions should NOT produce warning
     */
    it('should NOT produce warning for single-cube query without dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        // No dimensions, but only one cube
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have no FAN_OUT_NO_DIMENSIONS warning
      if (result.warnings) {
        const fanOutWarning = result.warnings.find(
          (w: QueryWarning) => w.code === 'FAN_OUT_NO_DIMENSIONS'
        )
        expect(fanOutWarning).toBeUndefined()
      }
    })

    /**
     * Test: Time dimension with granularity should NOT produce warning
     *
     * When a time dimension has granularity, it acts as a grouping dimension
     * and provides context for the aggregated results.
     */
    it('should NOT produce warning when time dimension with granularity is present', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        // No regular dimensions, but has time dimension with granularity
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month'
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have no FAN_OUT_NO_DIMENSIONS warning
      if (result.warnings) {
        const fanOutWarning = result.warnings.find(
          (w: QueryWarning) => w.code === 'FAN_OUT_NO_DIMENSIONS'
        )
        expect(fanOutWarning).toBeUndefined()
      }
    })

    /**
     * Test: Time dimension WITHOUT granularity should produce warning
     *
     * A time dimension without granularity doesn't provide grouping context,
     * so the warning should still appear.
     */
    it('should produce warning when time dimension has no granularity', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        // Time dimension without granularity - doesn't count as grouping
        .timeDimensions([{
          dimension: 'Productivity.date',
          dateRange: ['2024-01-01', '2024-12-31']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have the warning
      expect(result.warnings).toBeDefined()
      const fanOutWarning = result.warnings!.find(
        (w: QueryWarning) => w.code === 'FAN_OUT_NO_DIMENSIONS'
      )
      expect(fanOutWarning).toBeDefined()
    })
  })

  describe('Warning Structure', () => {
    /**
     * Test: Warning contains all required fields
     */
    it('should include all required fields in warning', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.warnings).toBeDefined()
      const warning = result.warnings![0]

      // Required fields
      expect(warning.code).toBeDefined()
      expect(typeof warning.code).toBe('string')
      expect(warning.message).toBeDefined()
      expect(typeof warning.message).toBe('string')
      expect(warning.severity).toBeDefined()
      expect(['info', 'warning', 'error']).toContain(warning.severity)

      // Optional but expected fields
      expect(warning.suggestion).toBeDefined()
    })

    /**
     * Test: Warning cubes list contains all queried cubes
     */
    it('should list all involved cubes in warning', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.warnings).toBeDefined()
      const fanOutWarning = result.warnings!.find(
        (w: QueryWarning) => w.code === 'FAN_OUT_NO_DIMENSIONS'
      )

      expect(fanOutWarning!.cubes).toBeDefined()
      expect(fanOutWarning!.cubes).toContain('Employees')
      expect(fanOutWarning!.cubes).toContain('Productivity')
    })
  })
})

/**
 * Create cubes for warning testing
 */
async function createWarningTestCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, productivity } = await getTestSchema()

  let employeesCube: Cube
  let departmentsCube: Cube
  let productivityCube: Cube

  employeesCube = defineCube('Employees', {
    title: 'Employees',
    description: 'Employee data',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Productivity: {
        targetCube: () => productivityCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: productivity.employeeId }]
      },
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }]
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
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Employee Count',
        type: 'count',
        sql: employees.id
      }
    }
  })

  departmentsCube = defineCube('Departments', {
    title: 'Departments',
    description: 'Department data',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
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

  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    description: 'Productivity metrics',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: [{ source: productivity.employeeId, target: employees.id }]
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
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: productivity.employeeId
      },
      date: {
        name: 'date',
        title: 'Date',
        type: 'time',
        sql: productivity.date
      }
    },

    measures: {
      recordCount: {
        name: 'recordCount',
        title: 'Record Count',
        type: 'count',
        sql: productivity.id
      },
      totalLinesOfCode: {
        name: 'totalLinesOfCode',
        title: 'Total Lines of Code',
        type: 'sum',
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

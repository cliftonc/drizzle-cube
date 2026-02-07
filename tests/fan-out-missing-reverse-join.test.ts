/**
 * Regression test for issue #363 follow-up:
 * - Missing reverse join on the middle cube causes primary selection to stay on fact cube
 * - hasMany CTE measure is re-aggregated with SUM and gets inflated
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Fan-Out with Missing Reverse Join', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    cubes = await createMissingReverseJoinCubes()

    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('should not inflate hasMany CTE counts when grouping by middle cube key', async () => {
    // Baseline: count memberships per employee id (middle cube is primary here)
    const baselineQuery = TestQueryBuilder.create()
      .measures(['EmployeeTeams.count'])
      .dimensions(['Employees.id'])
      .build()

    const baselineResult = await testExecutor.executeQuery(baselineQuery)

    const expectedCountByEmployeeId = new Map<number, number>()
    for (const row of baselineResult.data) {
      const employeeId = Number(row['Employees.id'])
      const count = Number(row['EmployeeTeams.count'] || 0)
      expectedCountByEmployeeId.set(employeeId, count)
    }

    // Reproduction query: primary will be Productivity due missing reverse join
    // Employees cannot "reach all", so EmployeeTeams CTE count gets re-aggregated.
    const reproductionQuery = TestQueryBuilder.create()
      .measures(['Productivity.totalLinesOfCode', 'EmployeeTeams.count'])
      .dimensions(['Employees.id'])
      .build()

    const reproductionResult = await testExecutor.executeQuery(reproductionQuery)

    let validatedRows = 0
    for (const row of reproductionResult.data) {
      const employeeId = Number(row['Employees.id'])
      const actualCount = Number(row['EmployeeTeams.count'] || 0)
      const expectedCount = expectedCountByEmployeeId.get(employeeId)

      if (expectedCount !== undefined && expectedCount > 0) {
        validatedRows++
        expect(
          actualCount,
          `Employee ${employeeId} count should be ${expectedCount}, got ${actualCount}`
        ).toBe(expectedCount)
      }
    }

    expect(validatedRows, 'Should validate at least one employee with memberships').toBeGreaterThan(0)
  })
})

async function createMissingReverseJoinCubes(): Promise<Map<string, Cube>> {
  const { employees, productivity, employeeTeams } = await getTestSchema()

  let employeesCube: Cube
  let productivityCube: Cube
  let employeeTeamsCube: Cube

  employeesCube = defineCube('Employees', {
    title: 'Employees',
    description: 'Employees (middle cube)',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      // Intentionally present (middle -> right side)
      EmployeeTeams: {
        targetCube: () => employeeTeamsCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: employeeTeams.employeeId }]
      }
      // Intentionally missing reverse hasMany to Productivity
    },
    dimensions: {
      id: {
        name: 'id',
        title: 'Employee ID',
        type: 'number',
        sql: employees.id,
        primaryKey: true
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

  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    description: 'Productivity (fact cube)',
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
        title: 'Productivity ID',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      }
    },
    measures: {
      totalLinesOfCode: {
        name: 'totalLinesOfCode',
        title: 'Total LOC',
        type: 'sum',
        sql: productivity.linesOfCode
      }
    }
  })

  employeeTeamsCube = defineCube('EmployeeTeams', {
    title: 'Employee Teams',
    description: 'Membership records',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employeeTeams,
      where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {},
    dimensions: {
      id: {
        name: 'id',
        title: 'Membership ID',
        type: 'number',
        sql: employeeTeams.id,
        primaryKey: true
      }
    },
    measures: {
      count: {
        name: 'count',
        title: 'Membership Count',
        type: 'count',
        sql: employeeTeams.id
      }
    }
  })

  return new Map([
    ['Employees', employeesCube],
    ['Productivity', productivityCube],
    ['EmployeeTeams', employeeTeamsCube]
  ])
}

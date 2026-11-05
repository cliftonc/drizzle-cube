/**
 * Regression test: a cube that the join plan reaches through a belongsToMany
 * junction from the primary cube, while a pre-aggregation CTE also carries its
 * join key (downstream join key).
 *
 * Topology:
 *   Departments (primary) ──hasMany──→ TimeEntries (CTE) ──belongsTo──→ Employees
 *   Departments ──belongsToMany through time_entries (preferredFor Employees)──→ Employees
 *
 * The TimeEntries CTE groups by department_id and employee_id. Before the fix,
 * the outer query joined time_entries a second time as the junction, on
 * department_id only, and joined Employees through that copy. Every CTE row
 * repeated once per junction row of its department, and an Employees filter or
 * dimension did not apply to the CTE rows.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition, Filter } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('CTE downstream join through a junction from the primary cube', () => {
  let testExecutor: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    const cubes = await createDownstreamJunctionCubes()
    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  const isTrue = (value: unknown) => value === true || value === 1 || value === 'true' || value === '1'

  async function countsBy(
    dimensions: string[],
    filters: Filter[] = []
  ): Promise<Map<string, number>> {
    const query = TestQueryBuilder.create()
      .measures(['TimeEntries.count'])
      .dimensions(dimensions)
      .filters(filters)
      .build()
    const result = await testExecutor.executeQuery(query)
    const counts = new Map<string, number>()
    for (const row of result.data) {
      const key = dimensions
        .map(dimension => (dimension === 'Employees.active' ? String(isTrue(row[dimension])) : String(Number(row[dimension]))))
        .join('|')
      counts.set(key, Number(row['TimeEntries.count'] || 0))
    }
    return counts
  }

  it('should not inflate the CTE count when a filter cube is reached through the junction', async () => {
    const activeEmployees: Filter[] = [
      { member: 'Employees.active', operator: 'equals', values: [true] }
    ]

    // Baseline: TimeEntries is primary, so Employees joins with belongsTo and
    // nothing fans out.
    const expected = await countsBy(['TimeEntries.departmentId'], activeEmployees)
    expect(expected.size).toBeGreaterThan(0)

    // Departments is primary, TimeEntries becomes a hasMany CTE, and the join
    // plan reaches Employees through the time_entries junction.
    const actual = await countsBy(['Departments.id'], activeEmployees)

    expect(actual).toEqual(expected)
  })

  it('should not inflate the CTE count when a dimension cube is reached through the junction', async () => {
    const expected = await countsBy(['TimeEntries.departmentId', 'Employees.active'])
    expect(expected.size).toBeGreaterThan(0)

    const actual = await countsBy(['Departments.id', 'Employees.active'])

    expect(actual).toEqual(expected)
  })
})

/**
 * The CTE cube reaches the target through its own belongsToMany junction.
 *
 * Topology:
 *   Employees (primary) ──hasMany──→ Productivity (CTE) ──belongsToMany through employee_teams──→ Teams
 *   Employees ──belongsToMany through employee_teams (preferredFor Teams)──→ Teams
 *
 * The downstream join keys of the Productivity CTE point at employee_teams, not
 * at Teams, so Teams must keep its junction join from Employees.
 */
describe('CTE downstream join keys that point at the CTE cube junction', () => {
  let testExecutor: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    const cubes = await createCteJunctionCubes()
    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('should keep the junction join when the CTE cube reaches the target through its own junction', async () => {
    const linesByEmployee = new Map<number, number>()
    const perEmployee = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.id'])
        .build()
    )
    for (const row of perEmployee.data) {
      linesByEmployee.set(Number(row['Employees.id']), Number(row['Productivity.totalLinesOfCode'] || 0))
    }

    const memberships = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .dimensions(['EmployeeTeams.employeeId', 'EmployeeTeams.teamId'])
        .build()
    )
    const expected = new Map<string, number>()
    for (const row of memberships.data) {
      const employeeId = Number(row['EmployeeTeams.employeeId'])
      if (!linesByEmployee.has(employeeId)) continue
      expected.set(`${employeeId}|${Number(row['EmployeeTeams.teamId'])}`, linesByEmployee.get(employeeId)!)
    }
    expect(expected.size).toBeGreaterThan(0)

    const result = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.id', 'Teams.id'])
        .build()
    )
    const actual = new Map<string, number>()
    for (const row of result.data) {
      if (row['Teams.id'] == null) continue
      actual.set(
        `${Number(row['Employees.id'])}|${Number(row['Teams.id'])}`,
        Number(row['Productivity.totalLinesOfCode'] || 0)
      )
    }

    expect(actual).toEqual(expected)
  })
})

async function createCteJunctionCubes(): Promise<Map<string, Cube>> {
  const { employees, productivity, teams, employeeTeams } = await getTestSchema()

  let employeesCube: Cube
  let productivityCube: Cube
  let teamsCube: Cube

  const employeeTeamsSecurity = (securityContext: { organisationId?: unknown }) =>
    eq(employeeTeams.organisationId, securityContext.organisationId as any)

  employeesCube = defineCube('Employees', {
    title: 'Employees',
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
      Teams: {
        targetCube: () => teamsCube,
        relationship: 'belongsToMany',
        on: [],
        preferredFor: ['Teams'],
        through: {
          table: employeeTeams,
          sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
          targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
          securitySql: employeeTeamsSecurity
        }
      }
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
    measures: {}
  })

  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      Teams: {
        targetCube: () => teamsCube,
        relationship: 'belongsToMany',
        on: [],
        through: {
          table: employeeTeams,
          sourceKey: [{ source: productivity.employeeId, target: employeeTeams.employeeId }],
          targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
          securitySql: employeeTeamsSecurity
        }
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
        title: 'Total Lines of Code',
        type: 'sum',
        sql: productivity.linesOfCode
      }
    }
  })

  teamsCube = defineCube('Teams', {
    title: 'Teams',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: teams,
      where: eq(teams.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {},
    dimensions: {
      id: {
        name: 'id',
        title: 'Team ID',
        type: 'number',
        sql: teams.id,
        primaryKey: true
      }
    },
    measures: {}
  })

  const employeeTeamsCube = defineCube('EmployeeTeams', {
    title: 'Employee Teams',
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
      },
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: employeeTeams.employeeId
      },
      teamId: {
        name: 'teamId',
        title: 'Team ID',
        type: 'number',
        sql: employeeTeams.teamId
      }
    },
    measures: {}
  })

  return new Map([
    ['Employees', employeesCube],
    ['Productivity', productivityCube],
    ['Teams', teamsCube],
    ['EmployeeTeams', employeeTeamsCube]
  ])
}

async function createDownstreamJunctionCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, timeEntries } = await getTestSchema()

  let departmentsCube: Cube
  let employeesCube: Cube
  let timeEntriesCube: Cube

  departmentsCube = defineCube('Departments', {
    title: 'Departments',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      TimeEntries: {
        targetCube: () => timeEntriesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: timeEntries.departmentId }]
      },
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsToMany',
        on: [],
        preferredFor: ['Employees'],
        through: {
          table: timeEntries,
          sourceKey: [{ source: departments.id, target: timeEntries.departmentId }],
          targetKey: [{ source: timeEntries.employeeId, target: employees.id }],
          securitySql: (securityContext) =>
            eq(timeEntries.organisationId, securityContext.organisationId)
        }
      }
    },
    dimensions: {
      id: {
        name: 'id',
        title: 'Department ID',
        type: 'number',
        sql: departments.id,
        primaryKey: true
      }
    },
    measures: {}
  })

  employeesCube = defineCube('Employees', {
    title: 'Employees',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {},
    dimensions: {
      id: {
        name: 'id',
        title: 'Employee ID',
        type: 'number',
        sql: employees.id,
        primaryKey: true
      },
      active: {
        name: 'active',
        title: 'Active',
        type: 'boolean',
        sql: employees.active
      }
    },
    measures: {}
  })

  timeEntriesCube = defineCube('TimeEntries', {
    title: 'Time Entries',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.departmentId, target: departments.id }],
        preferredFor: ['Departments']
      },
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.employeeId, target: employees.id }],
        preferredFor: ['Employees']
      }
    },
    dimensions: {
      id: {
        name: 'id',
        title: 'Time Entry ID',
        type: 'number',
        sql: timeEntries.id,
        primaryKey: true
      },
      departmentId: {
        name: 'departmentId',
        title: 'Department ID',
        type: 'number',
        sql: timeEntries.departmentId
      }
    },
    measures: {
      count: {
        name: 'count',
        title: 'Time Entry Count',
        type: 'count',
        sql: timeEntries.id
      }
    }
  })

  return new Map([
    ['Departments', departmentsCube],
    ['Employees', employeesCube],
    ['TimeEntries', timeEntriesCube]
  ])
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, CubeJoin, QueryContext, SemanticQuery } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

type KeyMode = 'single' | 'organisationFirst' | 'organisationLast'

const compositeKeyModes = ['organisationFirst', 'organisationLast'] as const

type DepartmentsJoinDeclaredOn = 'Departments' | 'Employees'

async function createCubes(keys: KeyMode, departmentsJoinDeclaredOn: DepartmentsJoinDeclaredOn = 'Departments'): Promise<Map<string, Cube>> {
  const { employees, departments, productivity, employeeTeams, timeEntries } = await getTestSchema()

  const on = (
    org: [AnyColumn, AnyColumn],
    key: [AnyColumn, AnyColumn]
  ): CubeJoin['on'] => {
    const orgPair = { source: org[0], target: org[1] }
    const keyPair = { source: key[0], target: key[1] }
    if (keys === 'organisationFirst') return [orgPair, keyPair]
    if (keys === 'organisationLast') return [keyPair, orgPair]
    return [keyPair]
  }

  let employeesCube: Cube
  let departmentsCube: Cube
  let productivityCube: Cube
  let employeeTeamsCube: Cube
  let timeEntriesCube: Cube

  departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: departmentsJoinDeclaredOn === 'Departments'
      ? {
          Employees: {
            targetCube: () => employeesCube,
            relationship: 'hasMany',
            on: on([departments.organisationId, employees.organisationId], [departments.id, employees.departmentId])
          }
        }
      : {
          TimeEntries: {
            targetCube: () => timeEntriesCube,
            relationship: 'hasMany',
            on: on([departments.organisationId, timeEntries.organisationId], [departments.id, timeEntries.departmentId])
          }
        },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: departments.name }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: departments.id }
    }
  })

  employeesCube = defineCube('Employees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Productivity: {
        targetCube: () => productivityCube,
        relationship: 'hasMany',
        on: on([employees.organisationId, productivity.organisationId], [employees.id, productivity.employeeId])
      },
      ...(departmentsJoinDeclaredOn === 'Employees' && {
        Departments: {
          targetCube: () => departmentsCube,
          relationship: 'belongsTo',
          on: on([employees.organisationId, departments.organisationId], [employees.departmentId, departments.id])
        }
      })
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id }
    }
  })

  productivityCube = defineCube('Productivity', {
    sql: (ctx: QueryContext) => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: on([productivity.organisationId, employees.organisationId], [productivity.employeeId, employees.id])
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: productivity.id, primaryKey: true }
    },
    measures: {
      totalLinesOfCode: { name: 'totalLinesOfCode', type: 'sum', sql: productivity.linesOfCode }
    }
  })

  employeeTeamsCube = defineCube('EmployeeTeams', {
    sql: (ctx: QueryContext) => ({
      from: employeeTeams,
      where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: on([employeeTeams.organisationId, employees.organisationId], [employeeTeams.employeeId, employees.id])
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employeeTeams.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employeeTeams.id }
    }
  })

  timeEntriesCube = defineCube('TimeEntries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: on([timeEntries.organisationId, employees.organisationId], [timeEntries.employeeId, employees.id])
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: timeEntries.id }
    }
  })

  return new Map([
    ['Departments', departmentsCube],
    ['Employees', employeesCube],
    ['Productivity', productivityCube],
    ['EmployeeTeams', employeeTeamsCube],
    ['TimeEntries', timeEntriesCube]
  ])
}

describe('Composite join keys on multi-hop paths', () => {
  let dbExecutor: Awaited<ReturnType<typeof createTestDatabaseExecutor>>['executor']
  let close: () => void

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    dbExecutor = created.executor
    close = created.close
  })

  afterAll(() => {
    close?.()
  })

  async function run(keys: KeyMode, query: SemanticQuery, departmentsJoinDeclaredOn?: DepartmentsJoinDeclaredOn) {
    const executor = new TestExecutor(new QueryExecutor(dbExecutor), await createCubes(keys, departmentsJoinDeclaredOn), testSecurityContexts.org1)
    const result = await executor.executeQuery(query)
    return [...result.data]
      .map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, key.endsWith('.name') ? value : Number(value ?? 0)])))
      .sort((a, b) => String(a['Departments.name']).localeCompare(String(b['Departments.name'])))
  }

  const multiHopQuery: SemanticQuery = {
    measures: ['Productivity.totalLinesOfCode', 'EmployeeTeams.count'],
    dimensions: ['Departments.name']
  }

  it('should return the single-key totals per department when every join on the path has a composite key', async () => {
    const expected = await run('single', multiHopQuery)

    expect(expected.some(row => Number(row['EmployeeTeams.count']) > 0)).toBe(true)
    for (const keys of compositeKeyModes) {
      expect(await run(keys, multiHopQuery), keys).toEqual(expected)
    }
  })

  it('should return the same totals per department when the Departments join is declared only on Employees and Departments reaches Employees through TimeEntries', async () => {
    const query: SemanticQuery = {
      measures: ['Productivity.totalLinesOfCode'],
      dimensions: ['Departments.name']
    }
    const expected = await run('single', query)

    expect(expected.some(row => Number(row['Productivity.totalLinesOfCode']) > 0)).toBe(true)
    expect(await run('single', query, 'Employees')).toEqual(expected)
    for (const keys of compositeKeyModes) {
      expect(await run(keys, query, 'Employees'), keys).toEqual(expected)
    }
  })
})

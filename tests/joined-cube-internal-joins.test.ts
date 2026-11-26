import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { aliasedTable, and, eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { BaseQueryDefinition, Cube, QueryContext, QueryResult } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

async function createCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, productivity } = await getTestSchema()

  const employeesInnerDepartment = defineCube('EmployeesInnerDepartment', {
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      joins: [
        {
          table: departments,
          on: and(
            eq(employees.departmentId, departments.id),
            eq(departments.organisationId, ctx.securityContext.organisationId)
          )!,
          type: 'inner'
        }
      ],
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentName: { name: 'departmentName', type: 'string', sql: departments.name }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id }
    }
  })

  const homeDepartment = aliasedTable(departments, 'home_department')
  const engineeringEmployees = defineCube('EngineeringEmployees', {
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      joins: [
        {
          table: homeDepartment,
          on: eq(employees.departmentId, homeDepartment.id),
          type: 'left'
        }
      ],
      where: and(
        eq(employees.organisationId, ctx.securityContext.organisationId),
        eq(homeDepartment.name, 'Engineering')
      )
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentName: { name: 'departmentName', type: 'string', sql: homeDepartment.name }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id }
    }
  })

  const productivityCube = defineCube('Productivity', {
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      EmployeesInnerDepartment: {
        targetCube: () => employeesInnerDepartment,
        relationship: 'belongsTo',
        sqlJoinType: 'left',
        on: [{ source: productivity.employeeId, target: employees.id }]
      },
      EngineeringEmployees: {
        targetCube: () => engineeringEmployees,
        relationship: 'belongsTo',
        sqlJoinType: 'left',
        on: [{ source: productivity.employeeId, target: employees.id }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: productivity.id, primaryKey: true }
    },
    measures: {
      recordCount: { name: 'recordCount', type: 'count', sql: productivity.id }
    }
  })

  return new Map<string, Cube>([
    ['EmployeesInnerDepartment', employeesInnerDepartment],
    ['EngineeringEmployees', engineeringEmployees],
    ['Productivity', productivityCube]
  ])
}

function countsByName(result: QueryResult, nameField: string, countField: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of result.data) {
    counts[String(row[nameField] ?? '(none)')] = Number(row[countField])
  }
  return counts
}

describe('Joined cube with internal joins', () => {
  let testExecutor: TestExecutor
  let departmentCounts: Record<string, number>
  let totalCount: number
  let close: () => void

  function withNoneGroup(counts: Record<string, number>): Record<string, number> {
    const counted = Object.values(counts).reduce((sum, count) => sum + count, 0)
    return { ...counts, '(none)': totalCount - counted }
  }

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup
    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, await createCubes(), testSecurityContexts.org1)
    const referenceExecutor = new TestExecutor(
      executor,
      await getTestCubes(['Productivity', 'Employees', 'Departments']),
      testSecurityContexts.org1
    )

    const total = await referenceExecutor.executeQuery({ measures: ['Productivity.recordCount'] })
    totalCount = Number(total.data[0]['Productivity.recordCount'])
    const byDepartment = await referenceExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      dimensions: ['Departments.name']
    })
    departmentCounts = countsByName(byDepartment, 'Departments.name', 'Productivity.recordCount')
    delete departmentCounts['(none)']
    expect(withNoneGroup(departmentCounts)['(none)']).toBeGreaterThan(0)
  })

  afterAll(() => {
    close?.()
  })

  it('keeps primary rows whose joined cube row is removed by an internal inner join', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      dimensions: ['EmployeesInnerDepartment.departmentName']
    })

    expect(
      countsByName(result, 'EmployeesInnerDepartment.departmentName', 'Productivity.recordCount')
    ).toEqual(withNoneGroup(departmentCounts))
  })

  it('applies a joined cube where clause that references its aliased internal join table', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      dimensions: ['EngineeringEmployees.departmentName']
    })

    expect(
      countsByName(result, 'EngineeringEmployees.departmentName', 'Productivity.recordCount')
    ).toEqual(withNoneGroup({ Engineering: departmentCounts.Engineering }))
  })

  it('keeps primary rows removed by an internal inner join when the keys deduplication path runs', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount', 'EmployeesInnerDepartment.count'],
      dimensions: ['EmployeesInnerDepartment.departmentName']
    })

    expect(
      countsByName(result, 'EmployeesInnerDepartment.departmentName', 'Productivity.recordCount')
    ).toEqual(withNoneGroup(departmentCounts))
  })

  it('applies a joined cube where clause that references its internal join table when the keys deduplication path runs', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount', 'EngineeringEmployees.count'],
      dimensions: ['EngineeringEmployees.departmentName']
    })

    expect(
      countsByName(result, 'EngineeringEmployees.departmentName', 'Productivity.recordCount')
    ).toEqual(withNoneGroup({ Engineering: departmentCounts.Engineering }))
  })
})

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'

import { defineCube } from '../src/server/cube-utils'
import type { BaseQueryDefinition, Cube, QueryContext } from '../src/server/types'
import { createTestSemanticLayer, getTestDatabaseType, getTestSchema } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'

const dbType = getTestDatabaseType()

describe(`Table-Level Joins (${dbType})`, () => {
  let semanticLayer: any
  let close: () => void

  beforeAll(async () => {
    const created = await createTestSemanticLayer()
    semanticLayer = created.semanticLayer
    close = created.close

    const cubes = await createTableJoinTestCubes()
    semanticLayer.registerCube(cubes.employeeContextCube)
    semanticLayer.registerCube(cubes.productivityCoreCube)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('respects multi-table joins declared in cube.sql when querying the cube directly', async () => {
    const query = {
      measures: ['EmployeeContext.count', 'EmployeeContext.distinctTeamCount'],
      dimensions: ['EmployeeContext.departmentName']
    }

    const result = await semanticLayer.execute(query, testSecurityContexts.org1)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)

    const sqlResult = await semanticLayer.dryRun(query, testSecurityContexts.org1)
    const sqlText = sqlResult.sql.toLowerCase()

    expect(sqlText).toContain('departments')
    expect(sqlText).toContain('employee_teams')
    expect(sqlText).toContain('teams')
  })

  it('applies joined cube table-level joins in cross-cube queries', async () => {
    const query = {
      measures: ['EmployeeContext.distinctTeamCount'],
      dimensions: ['ProductivityCore.id']
    }

    const result = await semanticLayer.execute(query, testSecurityContexts.org1)
    expect(Array.isArray(result.data)).toBe(true)

    const sqlResult = await semanticLayer.dryRun(query, testSecurityContexts.org1)
    const sqlText = sqlResult.sql.toLowerCase()

    expect(sqlText).toContain('productivity')
    expect(sqlText).toContain('employees')
    expect(sqlText).toContain('departments')
    expect(sqlText).toContain('employee_teams')
    expect(sqlText).toContain('teams')
  })
})

async function createTableJoinTestCubes(): Promise<{
  employeeContextCube: Cube
  productivityCoreCube: Cube
}> {
  const { employees, departments, employeeTeams, teams, productivity } = await getTestSchema()

  let employeeContextCube: Cube
  let productivityCoreCube: Cube

  employeeContextCube = defineCube('EmployeeContext', {
    title: 'Employee Context',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      joins: [
        {
          table: departments,
          type: 'left',
          on: and(
            eq(employees.departmentId, departments.id),
            eq(departments.organisationId, ctx.securityContext.organisationId)
          )!
        },
        {
          table: employeeTeams,
          type: 'left',
          on: and(
            eq(employees.id, employeeTeams.employeeId),
            eq(employeeTeams.organisationId, ctx.securityContext.organisationId)
          )!
        },
        {
          table: teams,
          type: 'left',
          on: and(
            eq(employeeTeams.teamId, teams.id),
            eq(teams.organisationId, ctx.securityContext.organisationId)
          )!
        }
      ],
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),

    dimensions: {
      id: {
        name: 'id',
        type: 'number',
        sql: employees.id,
        primaryKey: true
      },
      departmentName: {
        name: 'departmentName',
        type: 'string',
        sql: departments.name
      },
      teamName: {
        name: 'teamName',
        type: 'string',
        sql: teams.name
      }
    },

    measures: {
      count: {
        name: 'count',
        type: 'countDistinct',
        sql: employees.id
      },
      distinctTeamCount: {
        name: 'distinctTeamCount',
        type: 'countDistinct',
        sql: teams.id
      }
    }
  })

  productivityCoreCube = defineCube('ProductivityCore', {
    title: 'Productivity Core',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      EmployeeContext: {
        targetCube: () => employeeContextCube,
        relationship: 'belongsTo',
        on: [
          { source: productivity.employeeId, target: employees.id }
        ]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      }
    },

    measures: {
      count: {
        name: 'count',
        type: 'countDistinct',
        sql: productivity.id
      }
    }
  })

  return { employeeContextCube, productivityCoreCube }
}
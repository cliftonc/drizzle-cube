/**
 * Regression test: belongsToMany joins must include join keys in CTEs
 *
 * When a query triggers CTE (pre-aggregation) for a cube that has a
 * belongsToMany relationship, the CTE must include the join key column
 * from through.sourceKey so the junction table join can work.
 *
 * Scenario:
 *   CteEmployees (primary, hasMany → CteProductivity)
 *   CteProductivity (CTE cube, belongsToMany → CteTeams via employeeTeams)
 *   CteTeams (dimension cube)
 *
 * Query: measures from both CteEmployees + CteProductivity, dimensions from CteTeams
 * This forces CteProductivity into a CTE, which needs employeeId in its SELECT
 * so the junction table (employeeTeams) can join to it.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { QueryExecutor } from '../src/server/executor'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { defineCube } from '../src/server/cube-utils'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'

describe('belongsToMany + CTE join key regression', () => {
  let testExecutor: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup

    const { employees, productivity, teams, employeeTeams } = await getTestSchema()

    // Declare cube variables for forward references
    let cteEmployeesCube: Cube<any>
    let cteProductivityCube: Cube<any>
    let cteTeamsCube: Cube<any>

    // Primary cube: Employees with hasMany → Productivity
    cteEmployeesCube = defineCube('CteEmployees', {
      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId)
      }),

      joins: {
        CteProductivity: {
          targetCube: () => cteProductivityCube,
          relationship: 'hasMany',
          on: [
            { source: employees.id, target: productivity.employeeId }
          ]
        }
      },

      measures: {
        count: {
          type: 'count',
          sql: employees.id
        }
      },

      dimensions: {
        name: {
          type: 'string',
          sql: employees.name
        }
      }
    })

    // CTE cube: Productivity with belongsToMany → Teams through employeeTeams
    // The hasMany from CteEmployees forces this into a CTE.
    // The belongsToMany needs employeeId in the CTE's SELECT for the junction join.
    cteProductivityCube = defineCube('CteProductivity', {
      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),

      joins: {
        CteTeams: {
          targetCube: () => cteTeamsCube,
          relationship: 'belongsToMany',
          on: [],
          through: {
            table: employeeTeams,
            sourceKey: [
              { source: productivity.employeeId, target: employeeTeams.employeeId }
            ],
            targetKey: [
              { source: employeeTeams.teamId, target: teams.id }
            ],
            securitySql: (securityContext) =>
              eq(employeeTeams.organisationId, securityContext.organisationId)
          }
        }
      },

      measures: {
        totalLinesOfCode: {
          type: 'sum',
          sql: productivity.linesOfCode
        },
        recordCount: {
          type: 'count',
          sql: productivity.id
        }
      },

      dimensions: {
        employeeId: {
          type: 'number',
          sql: productivity.employeeId
        },
        date: {
          type: 'time',
          sql: productivity.date
        }
      }
    })

    // Dimension cube: Teams
    cteTeamsCube = defineCube('CteTeams', {
      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: teams,
        where: eq(teams.organisationId, ctx.securityContext.organisationId)
      }),

      measures: {
        count: {
          type: 'count',
          sql: teams.id
        }
      },

      dimensions: {
        name: {
          type: 'string',
          sql: teams.name
        }
      }
    })

    const cubes = new Map<string, Cube<any>>([
      ['CteEmployees', cteEmployeesCube],
      ['CteProductivity', cteProductivityCube],
      ['CteTeams', cteTeamsCube]
    ])

    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) close()
  })

  it('should execute multi-cube query with belongsToMany CTE without SQL error', async () => {
    // This query triggers:
    // 1. hasMany detected: CteEmployees → CteProductivity
    // 2. CteProductivity CTE created (hasMany target with measures)
    // 3. CteProductivity CTE needs belongsToMany join key (employeeId) to connect to CteTeams
    const query = TestQueryBuilder.create()
      .measures(['CteEmployees.count', 'CteProductivity.totalLinesOfCode'])
      .dimensions(['CteTeams.name'])
      .build()

    const result = await testExecutor.executeQuery(query)

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)

    // Verify all fields present
    const firstRow = result.data[0]
    expect(firstRow).toHaveProperty('CteEmployees.count')
    expect(firstRow).toHaveProperty('CteProductivity.totalLinesOfCode')
    expect(firstRow).toHaveProperty('CteTeams.name')
  })

  it('should include data from all three cubes', async () => {
    const query = TestQueryBuilder.create()
      .measures(['CteEmployees.count', 'CteProductivity.totalLinesOfCode'])
      .dimensions(['CteTeams.name'])
      .build()

    const { result, validation } = await testExecutor.validateQuery(
      query,
      ['CteEmployees.count', 'CteProductivity.totalLinesOfCode', 'CteTeams.name'],
      {
        'CteEmployees.count': 'number',
        'CteProductivity.totalLinesOfCode': 'number',
        'CteTeams.name': 'string'
      }
    )

    expect(validation.isValid).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('should work with time dimensions and granularity', async () => {
    const query = TestQueryBuilder.create()
      .measures(['CteEmployees.count', 'CteProductivity.totalLinesOfCode'])
      .dimensions(['CteTeams.name'])
      .timeDimensions([{
        dimension: 'CteProductivity.date',
        granularity: 'month'
      }])
      .build()

    const result = await testExecutor.executeQuery(query)

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)

    const firstRow = result.data[0]
    expect(firstRow).toHaveProperty('CteEmployees.count')
    expect(firstRow).toHaveProperty('CteProductivity.totalLinesOfCode')
    expect(firstRow).toHaveProperty('CteTeams.name')
    expect(firstRow).toHaveProperty('CteProductivity.date')
  })

  it('should work with only CTE cube measures and belongsToMany dimensions', async () => {
    // Only CteProductivity measures (still triggers CTE from hasMany)
    // with CteTeams dimensions via belongsToMany
    const query = TestQueryBuilder.create()
      .measures(['CteProductivity.totalLinesOfCode', 'CteProductivity.recordCount'])
      .dimensions(['CteTeams.name'])
      .build()

    const result = await testExecutor.executeQuery(query)

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('CteProductivity.totalLinesOfCode')
      expect(row).toHaveProperty('CteProductivity.recordCount')
      expect(row).toHaveProperty('CteTeams.name')
    }
  })
})

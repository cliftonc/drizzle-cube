/**
 * Test: belongsToMany defined on the PRIMARY cube, CTE target on the other side
 *
 * This tests the reverse direction from belongsto-many-cte.test.ts.
 * In that test, the belongsToMany is defined on the CTE cube (Productivity → Teams).
 * Here, the belongsToMany is defined on the PRIMARY cube (Teams → Productivity).
 *
 * Topology:
 *   RevTeams (primary, has dimensions)
 *     ├── hasMany → RevTeamMembers       (triggers CTE detection via fanOutPrevention)
 *     └── belongsToMany → RevProductivity through employeeTeams
 *          sourceKey: teams.id → employeeTeams.teamId
 *          targetKey: employeeTeams.employeeId → productivity.employeeId
 *
 *   RevTeamMembers (belongsTo → RevTeams)
 *   RevProductivity (becomes CTE via fanOutPrevention, has measures)
 *
 * The bug: planPreAggregationCTEs used sourceKey (teams.id) for the CTE join key
 * instead of targetKey (productivity.employeeId), causing the CTE to try to
 * SELECT teams.id from the productivity table → SQL error.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { QueryExecutor } from '../src/server/executor'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { defineCube } from '../src/server/cube-utils'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'

describe('reversed belongsToMany + CTE join key resolution', () => {
  let testExecutor: TestExecutor
  let testExecutorOrg2: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup

    const { productivity, teams, employeeTeams } = await getTestSchema()

    // Declare cube variables for forward references
    let revTeamsCube: Cube
    let revTeamMembersCube: Cube
    let revProductivityCube: Cube

    // Primary cube: Teams with belongsToMany → Productivity (the REVERSED direction)
    // Also has hasMany → TeamMembers which triggers fanOutPrevention for Productivity
    revTeamsCube = defineCube('RevTeams', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: teams,
        where: eq(teams.organisationId, ctx.securityContext.organisationId)
      }),

      joins: {
        RevTeamMembers: {
          targetCube: () => revTeamMembersCube,
          relationship: 'hasMany',
          on: [
            { source: teams.id, target: employeeTeams.teamId }
          ]
        },
        RevProductivity: {
          targetCube: () => revProductivityCube,
          relationship: 'belongsToMany',
          on: [],
          through: {
            table: employeeTeams,
            sourceKey: [
              { source: teams.id, target: employeeTeams.teamId }
            ],
            targetKey: [
              { source: employeeTeams.employeeId, target: productivity.employeeId }
            ],
            securitySql: (securityContext) =>
              eq(employeeTeams.organisationId, securityContext.organisationId)
          }
        }
      },

      measures: {
        count: {
          name: 'count',
          type: 'count',
          sql: teams.id
        }
      },

      dimensions: {
        name: {
          name: 'name',
          type: 'string',
          sql: teams.name
        }
      }
    })

    // TeamMembers cube wrapping employeeTeams junction table
    // belongsTo → RevTeams triggers hasMany detection from the other side
    revTeamMembersCube = defineCube('RevTeamMembers', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employeeTeams,
        where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId)
      }),

      joins: {
        RevTeams: {
          targetCube: () => revTeamsCube,
          relationship: 'belongsTo',
          on: [
            { source: employeeTeams.teamId, target: teams.id }
          ]
        }
      },

      measures: {
        count: {
          name: 'count',
          type: 'count',
          sql: employeeTeams.id
        }
      },

      dimensions: {
        role: {
          name: 'role',
          type: 'string',
          sql: employeeTeams.role
        }
      }
    })

    // Productivity cube: becomes CTE via fanOutPrevention
    // (RevTeams hasMany → RevTeamMembers causes fan-out risk for this cube's measures)
    revProductivityCube = defineCube('RevProductivity', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),

      measures: {
        totalLinesOfCode: {
          name: 'totalLinesOfCode',
          type: 'sum',
          sql: productivity.linesOfCode
        },
        recordCount: {
          name: 'recordCount',
          type: 'count',
          sql: productivity.id
        }
      },

      dimensions: {
        employeeId: {
          name: 'employeeId',
          type: 'number',
          sql: productivity.employeeId
        },
        date: {
          name: 'date',
          type: 'time',
          sql: productivity.date
        }
      }
    })

    const cubes = new Map<string, Cube>([
      ['RevTeams', revTeamsCube],
      ['RevTeamMembers', revTeamMembersCube],
      ['RevProductivity', revProductivityCube]
    ])

    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
    testExecutorOrg2 = new TestExecutor(executor, cubes, testSecurityContexts.org2)
  })

  afterAll(() => {
    if (close) close()
  })

  it('should execute query with belongsToMany defined on the primary cube', async () => {
    // This triggers:
    // 1. RevTeams hasMany → RevTeamMembers detected
    // 2. RevProductivity has measures + hasMany elsewhere → fanOutPrevention CTE
    // 3. CTE join key must use targetKey (employeeTeams.employeeId → productivity.employeeId)
    //    NOT sourceKey (teams.id → employeeTeams.teamId)
    const query = TestQueryBuilder.create()
      .measures(['RevProductivity.totalLinesOfCode'])
      .dimensions(['RevTeams.name'])
      .build()

    const result = await testExecutor.executeQuery(query)

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)

    const firstRow = result.data[0]
    expect(firstRow).toHaveProperty('RevProductivity.totalLinesOfCode')
    expect(firstRow).toHaveProperty('RevTeams.name')
  })

  it('should handle multiple CTE measures', async () => {
    const query = TestQueryBuilder.create()
      .measures(['RevProductivity.totalLinesOfCode', 'RevProductivity.recordCount'])
      .dimensions(['RevTeams.name'])
      .build()

    const result = await testExecutor.executeQuery(query)

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('RevProductivity.totalLinesOfCode')
      expect(row).toHaveProperty('RevProductivity.recordCount')
      expect(row).toHaveProperty('RevTeams.name')
    }
  })

  it('should work with time dimensions and granularity', async () => {
    const query = TestQueryBuilder.create()
      .measures(['RevProductivity.totalLinesOfCode'])
      .dimensions(['RevTeams.name'])
      .timeDimensions([{
        dimension: 'RevProductivity.date',
        granularity: 'month'
      }])
      .build()

    const result = await testExecutor.executeQuery(query)

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)

    const firstRow = result.data[0]
    expect(firstRow).toHaveProperty('RevProductivity.totalLinesOfCode')
    expect(firstRow).toHaveProperty('RevTeams.name')
    expect(firstRow).toHaveProperty('RevProductivity.date')
  })

  it('should enforce security isolation between organizations', async () => {
    const query = TestQueryBuilder.create()
      .measures(['RevProductivity.totalLinesOfCode'])
      .dimensions(['RevTeams.name'])
      .build()

    const org1Result = await testExecutor.executeQuery(query)
    const org2Result = await testExecutorOrg2.executeQuery(query)

    expect(org1Result.data).toBeDefined()
    expect(org2Result.data).toBeDefined()

    // Org1 has different teams than org2
    const org1Teams = org1Result.data.map(r => r['RevTeams.name']).sort()
    const org2Teams = org2Result.data.map(r => r['RevTeams.name']).sort()

    // Teams should be different between orgs (security isolation)
    expect(org1Teams).not.toEqual(org2Teams)
  })
})

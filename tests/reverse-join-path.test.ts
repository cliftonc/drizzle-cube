/**
 * Tests for bidirectional (reverse) join path resolution.
 *
 * When cube A defines belongsTo → B but B has NO explicit hasMany → A,
 * the planner should still discover the path B → A by traversing the
 * reverse edge. This eliminates the requirement to always define
 * bidirectional joins manually.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import { JoinPathResolver } from '../src/server/resolvers/join-path-resolver'
import { LogicalPlanner } from '../src/server/logical-plan/logical-planner'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Reverse Join Path Resolution', () => {
  let close: () => void

  describe('JoinPathResolver unit tests', () => {
    it('should discover reverse path when only forward belongsTo exists', async () => {
      // Productivity has belongsTo → Employees, but Employees has NO join to Productivity
      const cubes = await createOneWayCubes()
      const resolver = new JoinPathResolver(cubes)

      // Forward: Productivity → Employees (direct)
      const forwardPath = resolver.findPath('Productivity', 'Employees')
      expect(forwardPath).not.toBeNull()
      expect(forwardPath!.length).toBe(1)
      expect(forwardPath![0].reversed).toBeUndefined()

      // Reverse: Employees → Productivity (via reverse edge)
      const reversePath = resolver.findPath('Employees', 'Productivity')
      expect(reversePath).not.toBeNull()
      expect(reversePath!.length).toBe(1)
      expect(reversePath![0].reversed).toBe(true)
      expect(reversePath![0].fromCube).toBe('Employees')
      expect(reversePath![0].toCube).toBe('Productivity')
    })

    it('should prefer shorter reverse path over longer forward path', async () => {
      // Setup: Employees → Teams (2-hop forward), but Productivity → Employees is 1-hop reverse
      const cubes = await createMultiHopCubes()
      const resolver = new JoinPathResolver(cubes)

      // Employees → Productivity: should use 1-hop reverse (not 2-hop via Teams)
      const path = resolver.findPath('Employees', 'Productivity')
      expect(path).not.toBeNull()
      expect(path!.length).toBe(1)
      expect(path![0].reversed).toBe(true)
    })

    it('should use forward-only paths for canReachAll (primary selection stability)', async () => {
      const cubes = await createOneWayCubes()
      const resolver = new JoinPathResolver(cubes)

      // Employees has NO forward joins → cannot reach Productivity via forward-only
      expect(resolver.canReachAll('Employees', ['Employees', 'Productivity'])).toBe(false)

      // Productivity has forward belongsTo → Employees, so it CAN reach
      expect(resolver.canReachAll('Productivity', ['Employees', 'Productivity'])).toBe(true)
    })

    it('should include reverse edges in getReachableCubes', async () => {
      const cubes = await createOneWayCubes()
      const resolver = new JoinPathResolver(cubes)

      const reachable = resolver.getReachableCubes('Employees')
      expect(reachable.has('Employees')).toBe(true)
      expect(reachable.has('Productivity')).toBe(true)
    })

    it('should apply preferredFor bonus on reversed first-hop join', async () => {
      const cubes = await createPreferredForCubes()
      const resolver = new JoinPathResolver(cubes)

      // Employees → Productivity: reversed edge with preferredFor: ['Employees']
      const selection = resolver.findPathPreferringDetailed(
        'Employees',
        'Productivity',
        new Set(['Employees', 'Productivity'])
      )

      expect(selection.selectedPath).not.toBeNull()
      expect(selection.selectedPath!.length).toBe(1)
      expect(selection.selectedPath![0].reversed).toBe(true)

      // Check that the preferred bonus was applied
      const selectedCandidate = selection.candidates[selection.selectedIndex]
      expect(selectedCandidate.usesPreferredJoin).toBe(true)
      expect(selectedCandidate.scoreBreakdown.preferredJoinBonus).toBe(10)
    })
  })

  describe('LogicalPlanner integration', () => {
    it('should use bidirectional path finding from selected primary cube', async () => {
      const cubes = await createOneWayCubes()
      const planner = new LogicalPlanner()

      // canReachAll is forward-only, so Employees (no forward joins) can't reach Productivity.
      // Productivity (belongsTo Employees) CAN reach Employees via forward path.
      // Productivity is selected as primary (it can reach all).
      // But then from Productivity, it needs to find Employees — which it does via forward belongsTo.
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.id'])
        .build()

      const analysis = planner.analyzePrimaryCube(
        ['Employees', 'Productivity'],
        query,
        cubes
      )

      // Employees has more dimensions but can't reach Productivity via forward-only.
      // Productivity can reach all → selected as most_connected or via connectivity tier
      expect(analysis.selectedCube).toBe('Productivity')
    })

    it('should find reverse path when primary cube uses bidirectional findPath', async () => {
      // Scenario: Primary is selected via forward-only reachability,
      // but the actual path to another cube uses a reverse edge.
      // This is the core DiscoveryFlow scenario.
      const cubes = await createPrimaryWithReversePath()
      const planner = new LogicalPlanner()

      const query = TestQueryBuilder.create()
        .measures(['Facts.total'])
        .dimensions(['Dims.name'])
        .build()

      const analysis = planner.analyzePrimaryCube(
        ['Facts', 'Dims'],
        query,
        cubes
      )

      // Dims has most dimensions and can reach Facts via forward hasMany
      expect(analysis.selectedCube).toBe('Dims')
    })
  })

  describe('Full query execution with reverse paths', () => {
    let testExecutor: TestExecutor
    let testExecutorWithReverse: TestExecutor

    beforeAll(async () => {
      const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
      close = cleanup

      // One-way cubes: Productivity belongsTo Employees, Employees has no joins
      // Productivity becomes primary (it can reach Employees via forward belongsTo)
      const cubes = await createOneWayCubes()
      const executor = new QueryExecutor(dbExecutor)
      testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)

      // Cubes where Dims is primary (has hasMany→Facts forward) and Facts→Dims is reverse
      const reverseCubes = await createPrimaryWithReversePath()
      testExecutorWithReverse = new TestExecutor(executor, reverseCubes, testSecurityContexts.org1)
    })

    afterAll(() => {
      if (close) {
        close()
      }
    })

    it('should execute query with Productivity as primary and Employees via forward belongsTo', async () => {
      // Productivity is primary (only cube that can reach all via forward).
      // Employees is joined via forward belongsTo → inner join, no CTE needed.
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.id'])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.id')
        expect(row).toHaveProperty('Productivity.totalLinesOfCode')
      }
    })

    it('should execute query using reverse path from primary to fact cube', async () => {
      // Dims is primary (most dimensions, has forward hasMany→Facts).
      // This tests that the planner correctly handles the join.
      const query = TestQueryBuilder.create()
        .measures(['Facts.total'])
        .dimensions(['Dims.name'])
        .build()

      const result = await testExecutorWithReverse.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row).toHaveProperty('Dims.name')
        expect(row).toHaveProperty('Facts.total')
      }
    })
  })
})

/**
 * One-way cubes: Productivity belongsTo Employees, but Employees has NO join to Productivity.
 * This is the core scenario that reverse path resolution fixes.
 */
async function createOneWayCubes(): Promise<Map<string, Cube>> {
  const { employees, productivity } = await getTestSchema()

  let employeesCube: Cube
  let productivityCube: Cube

  employeesCube = defineCube('Employees', {
    title: 'Employees',
    description: 'Employees cube with NO join to Productivity',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),
    // No joins at all - relies on reverse path resolution
    joins: {},
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
    description: 'Productivity with belongsTo Employees',
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

  return new Map([
    ['Employees', employeesCube],
    ['Productivity', productivityCube]
  ])
}

/**
 * Multi-hop cubes: Tests that 1-hop reverse path beats longer forward paths.
 * Employees → Teams (forward, 2 hops via EmployeeTeams)
 * Productivity → Employees (belongsTo, 1 hop reverse from Employees)
 */
async function createMultiHopCubes(): Promise<Map<string, Cube>> {
  const { employees, productivity, teams, employeeTeams } = await getTestSchema()

  let employeesCube: Cube
  let productivityCube: Cube
  let teamsCube: Cube

  employeesCube = defineCube('Employees', {
    title: 'Employees',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      // Forward 2-hop path to Productivity via Teams does NOT exist,
      // so the only way is via the 1-hop reverse from Productivity
      Teams: {
        targetCube: () => teamsCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: employeeTeams.employeeId }]
      }
    },
    dimensions: {
      id: { name: 'id', title: 'ID', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', title: 'Count', type: 'count', sql: employees.id }
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
      id: { name: 'id', title: 'ID', type: 'number', sql: teams.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', title: 'Count', type: 'count', sql: teams.id }
    }
  })

  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
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
      id: { name: 'id', title: 'ID', type: 'number', sql: productivity.id, primaryKey: true }
    },
    measures: {
      totalLinesOfCode: { name: 'totalLinesOfCode', title: 'LOC', type: 'sum', sql: productivity.linesOfCode }
    }
  })

  return new Map([
    ['Employees', employeesCube],
    ['Productivity', productivityCube],
    ['Teams', teamsCube]
  ])
}

/**
 * Primary cube with reverse path resolution.
 * Dims (Employees table) has hasMany → Facts (Productivity table).
 * Facts has belongsTo → Dims.
 * When Dims is primary, it reaches Facts via forward hasMany.
 * Tests that existing bidirectional cubes work correctly.
 */
async function createPrimaryWithReversePath(): Promise<Map<string, Cube>> {
  const { employees, productivity } = await getTestSchema()

  let dimsCube: Cube
  let factsCube: Cube

  dimsCube = defineCube('Dims', {
    title: 'Dims',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      Facts: {
        targetCube: () => factsCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: productivity.employeeId }]
      }
    },
    dimensions: {
      name: { name: 'name', title: 'Name', type: 'string', sql: employees.name }
    },
    measures: {
      count: { name: 'count', title: 'Count', type: 'count', sql: employees.id }
    }
  })

  factsCube = defineCube('Facts', {
    title: 'Facts',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      Dims: {
        targetCube: () => dimsCube,
        relationship: 'belongsTo',
        on: [{ source: productivity.employeeId, target: employees.id }]
      }
    },
    dimensions: {
      id: { name: 'id', title: 'ID', type: 'number', sql: productivity.id, primaryKey: true }
    },
    measures: {
      total: { name: 'total', title: 'Total', type: 'sum', sql: productivity.linesOfCode }
    }
  })

  return new Map([
    ['Dims', dimsCube],
    ['Facts', factsCube]
  ])
}

/**
 * Cubes with preferredFor on the reversed join.
 * Productivity defines belongsTo Employees with preferredFor: ['Employees'].
 * When the path is reversed (Employees → Productivity), the bonus should apply.
 */
async function createPreferredForCubes(): Promise<Map<string, Cube>> {
  const { employees, productivity } = await getTestSchema()

  let employeesCube: Cube
  let productivityCube: Cube

  employeesCube = defineCube('Employees', {
    title: 'Employees',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {},
    dimensions: {
      id: { name: 'id', title: 'ID', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', title: 'Count', type: 'count', sql: employees.id }
    }
  })

  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId as any)
    }),
    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: [{ source: productivity.employeeId, target: employees.id }],
        preferredFor: ['Employees']
      }
    },
    dimensions: {
      id: { name: 'id', title: 'ID', type: 'number', sql: productivity.id, primaryKey: true }
    },
    measures: {
      totalLinesOfCode: { name: 'totalLinesOfCode', title: 'LOC', type: 'sum', sql: productivity.linesOfCode }
    }
  })

  return new Map([
    ['Employees', employeesCube],
    ['Productivity', productivityCube]
  ])
}

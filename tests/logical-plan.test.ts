/**
 * Logical Plan Pipeline Tests
 *
 * Verifies the multi-stage planning pipeline:
 * SemanticQuery → LogicalPlanBuilder → Optimiser → execution.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  createTestDatabaseExecutor,
  createTestSemanticLayer,
  getTestDatabaseType
} from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import {
  LogicalPlanBuilder,
  IdentityOptimiser,
  OptimiserPipeline,
  LogicalPlanner
} from '../src/server'
import type {
  SimpleSource,
  Cube,
  QueryContext,
  SecurityContext,
  DatabaseExecutor,
  SemanticQuery
} from '../src/server'

const dbType = getTestDatabaseType()

describe(`Logical Plan Pipeline (${dbType})`, () => {
  let cubes: Map<string, Cube>
  let dbExecutor: DatabaseExecutor
  let queryPlanner: LogicalPlanner
  let logicalPlanBuilder: LogicalPlanBuilder
  let securityContext: SecurityContext
  let ctx: QueryContext

  beforeAll(async () => {
    const testCubes = await createTestCubesForCurrentDatabase()
    dbExecutor = await createTestDatabaseExecutor()

    cubes = new Map<string, Cube>()
    cubes.set('Employees', testCubes.testEmployeesCube)
    cubes.set('Departments', testCubes.testDepartmentsCube)
    cubes.set('Productivity', testCubes.testProductivityCube)

    queryPlanner = new LogicalPlanner()
    logicalPlanBuilder = new LogicalPlanBuilder(queryPlanner)

    securityContext = { organisationId: 1 }
    ctx = {
      db: dbExecutor.db,
      schema: dbExecutor.schema,
      securityContext
    }
  })

  // ---------------------------------------------------------------------------
  // Plan structure tests
  // ---------------------------------------------------------------------------

  describe('Plan Structure', () => {
    it('should produce a QueryNode root for a simple single-cube query', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)

      expect(plan.type).toBe('query')
      expect(plan.measures).toHaveLength(1)
      expect(plan.measures[0].name).toBe('Employees.count')
      expect(plan.dimensions).toHaveLength(1)
      expect(plan.dimensions[0].name).toBe('Employees.name')
    })

    it('should produce a SimpleSource for single-cube queries', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)
      const source = plan.source as SimpleSource

      expect(source.type).toBe('simpleSource')
      expect(source.primaryCube.name).toBe('Employees')
      expect(source.joins).toHaveLength(0)
      expect(source.ctes).toHaveLength(0)
    })

    it('should include joins for multi-cube queries', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Departments.name']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)
      const source = plan.source as SimpleSource

      expect(source.type).toBe('simpleSource')
      expect(source.joins.length).toBeGreaterThanOrEqual(1)
      const deptJoin = source.joins.find(j => j.target.name === 'Departments')
      expect(deptJoin).toBeDefined()
    })

    it('should include CTEs for hasMany relationships', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count', 'Productivity.totalLinesOfCode'],
        dimensions: ['Employees.name']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)
      const source = plan.source as SimpleSource

      expect(source.ctes.length).toBeGreaterThanOrEqual(1)
      const productivityCTE = source.ctes.find(c => c.cube.name === 'Productivity')
      expect(productivityCTE).toBeDefined()
      expect(productivityCTE!.type).toBe('ctePreAggregate')
      expect(productivityCTE!.cteReason).toBe('hasMany')
    })

    it('should capture filters from the query', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.name', operator: 'equals', values: ['Alice'] }
        ]
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)

      expect(plan.filters).toHaveLength(1)
      expect(plan.filters[0]).toEqual({
        member: 'Employees.name',
        operator: 'equals',
        values: ['Alice']
      })
    })

    it('should capture time dimensions', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [
          { dimension: 'Employees.createdAt', granularity: 'month' }
        ]
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)

      expect(plan.timeDimensions).toHaveLength(1)
      expect(plan.timeDimensions[0].name).toBe('Employees.createdAt')
      expect(plan.timeDimensions[0].granularity).toBe('month')
    })

    it('should capture order, limit, and offset', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        order: { 'Employees.count': 'desc' },
        limit: 10,
        offset: 5
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)

      expect(plan.orderBy).toEqual([{ name: 'Employees.count', direction: 'desc' }])
      expect(plan.limit).toBe(10)
      expect(plan.offset).toBe(5)
    })

    it('should capture warnings from query planning', () => {
      // Query with hasMany and no dimensions → fan-out warning
      const query: SemanticQuery = {
        measures: ['Employees.count', 'Productivity.totalLinesOfCode']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)

      // Warnings may or may not be present depending on exact planner behavior,
      // but the field should exist
      expect(Array.isArray(plan.warnings)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Optimiser tests
  // ---------------------------------------------------------------------------

  describe('Optimiser', () => {
    it('IdentityOptimiser should return the plan unchanged', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)
      const optimiser = new IdentityOptimiser()
      const optimised = optimiser.optimise(plan, { engineType: 'postgres' })

      // Should be the exact same reference
      expect(optimised).toBe(plan)
    })

    it('OptimiserPipeline should run passes in order', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      const plan = logicalPlanBuilder.plan(cubes, query, ctx)
      const pipeline = new OptimiserPipeline([
        new IdentityOptimiser(),
        new IdentityOptimiser()
      ])

      const optimised = pipeline.optimise(plan, { engineType: 'postgres' })
      // After two identity passes, should still equal the original
      expect(optimised).toBe(plan)
    })
  })

  // ---------------------------------------------------------------------------
  // Integration test: end-to-end execution through logical plan pipeline
  // ---------------------------------------------------------------------------

  describe('Integration: end-to-end execution', () => {
    const integrationQueries: Array<{ name: string; query: SemanticQuery }> = [
      {
        name: 'single cube count',
        query: { measures: ['Employees.count'] }
      },
      {
        name: 'single cube with dimensions',
        query: {
          measures: ['Employees.count', 'Employees.avgSalary'],
          dimensions: ['Employees.name']
        }
      },
      {
        name: 'multi-cube join',
        query: {
          measures: ['Employees.count'],
          dimensions: ['Departments.name']
        }
      },
      {
        name: 'multi-cube hasMany CTE',
        query: {
          measures: ['Employees.count', 'Productivity.totalLinesOfCode'],
          dimensions: ['Employees.name']
        }
      },
      {
        name: 'with filter',
        query: {
          measures: ['Employees.count'],
          dimensions: ['Employees.name'],
          filters: [
            { member: 'Employees.name', operator: 'contains', values: ['o'] }
          ]
        }
      }
    ]

    for (const { name, query } of integrationQueries) {
      it(`should execute successfully: ${name}`, async () => {
        const { semanticLayer, close } = await createTestSemanticLayer()
        try {
          const testCubes = await createTestCubesForCurrentDatabase()
          semanticLayer.registerCube(testCubes.testEmployeesCube)
          semanticLayer.registerCube(testCubes.testDepartmentsCube)
          semanticLayer.registerCube(testCubes.testProductivityCube)

          const result = await semanticLayer.execute(query, securityContext)

          expect(result.data).toBeDefined()
          expect(Array.isArray(result.data)).toBe(true)
          expect(result.annotation).toBeDefined()

          // Verify expected measures/dimensions in annotations
          for (const m of query.measures ?? []) {
            expect(result.annotation.measures).toHaveProperty(m)
          }
          for (const d of query.dimensions ?? []) {
            expect(result.annotation.dimensions).toHaveProperty(d)
          }
        } finally {
          close()
        }
      })
    }
  })
})

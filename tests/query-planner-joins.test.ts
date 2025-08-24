/**
 * Tests for QueryPlanner join functionality with new array-based joins
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { eq, gte, sql } from 'drizzle-orm'
import { QueryPlanner } from '../src/server/query-planner'
import { getTestSchema } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import type { QueryContext, CubeJoin } from '../src/server/types-drizzle'

describe('QueryPlanner - New Join System', () => {
  let schema: any
  let queryPlanner: QueryPlanner
  let testCubes: any
  let context: QueryContext

  beforeAll(async () => {
    const { schema: testSchema } = await getTestSchema()
    schema = testSchema
    queryPlanner = new QueryPlanner()
    testCubes = await createTestCubesForCurrentDatabase()
    
    // Mock query context for testing
    context = {
      db: {} as any, // Mock database instance
      schema,
      securityContext: { organisationId: 1 }
    }
  })

  describe('buildJoinCondition()', () => {
    it('should build simple join condition with single column', () => {
      const joinDef: CubeJoin = {
        targetCube: () => testCubes.testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: schema.productivity.employeeId, target: schema.employees.id }
        ]
      }

      // Access private method for testing
      const planner = queryPlanner as any
      const condition = planner.buildJoinCondition(
        joinDef,
        'productivity_cube',
        'employees_cube',
        context
      )

      expect(condition).toBeDefined()
      // The condition should be a SQL object containing the join logic
      expect(condition.queryChunks).toBeDefined()
    })

    it('should build join condition with multiple columns', () => {
      const joinDef: CubeJoin = {
        targetCube: () => testCubes.testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: schema.productivity.employeeId, target: schema.employees.id },
          { source: schema.productivity.organisationId, target: schema.employees.organisationId }
        ]
      }

      const planner = queryPlanner as any
      const condition = planner.buildJoinCondition(
        joinDef,
        'productivity_cube', 
        'employees_cube',
        context
      )

      expect(condition).toBeDefined()
      expect(condition.queryChunks).toBeDefined()
    })

    it('should build join condition with custom comparator', () => {
      const joinDef: CubeJoin = {
        targetCube: () => testCubes.testEmployeesCube,
        relationship: 'hasMany',
        on: [
          { 
            source: schema.employees.createdAt, 
            target: schema.productivity.date,
            as: (source, target) => gte(target, source)
          }
        ]
      }

      const planner = queryPlanner as any
      const condition = planner.buildJoinCondition(
        joinDef,
        'employees_cube',
        'productivity_cube', 
        context
      )

      expect(condition).toBeDefined()
      expect(condition.queryChunks).toBeDefined()
    })

    it('should handle null source alias (primary cube)', () => {
      const joinDef: CubeJoin = {
        targetCube: () => testCubes.testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: schema.productivity.employeeId, target: schema.employees.id }
        ]
      }

      const planner = queryPlanner as any
      const condition = planner.buildJoinCondition(
        joinDef,
        null, // Primary cube has no alias
        'employees_cube',
        context
      )

      expect(condition).toBeDefined()
      expect(condition.queryChunks).toBeDefined()
    })
  })

  describe('cube reference resolution', () => {
    it('should resolve lazy cube references correctly', () => {
      const cubes = new Map()
      cubes.set('Employees', testCubes.testEmployeesCube)
      cubes.set('Productivity', testCubes.testProductivityCube)

      // Mock a cube with a lazy reference join
      const mockCube = {
        ...testCubes.testProductivityCube,
        joins: {
          Employees: {
            targetCube: () => testCubes.testEmployeesCube, // Lazy reference
            relationship: 'belongsTo',
            on: [
              { source: schema.productivity.employeeId, target: schema.employees.id }
            ]
          }
        }
      }

      cubes.set('Productivity', mockCube)

      const query = {
        measures: ['Productivity.totalLinesOfCode', 'Employees.count'],
        dimensions: [],
        filters: []
      }

      // This should not throw an error with lazy references
      const plan = queryPlanner.createQueryPlan(cubes, query, context)
      
      expect(plan).toBeDefined()
      expect(plan.primaryCube).toBeDefined()
      expect(plan.joinCubes.length).toBeGreaterThan(0)
    })
  })

  describe('join type derivation', () => {
    it('should derive correct join types from relationships', async () => {
      const { getJoinType } = await import('../src/server/types-drizzle')
      
      expect(getJoinType('belongsTo')).toBe('inner')
      expect(getJoinType('hasOne')).toBe('left') 
      expect(getJoinType('hasMany')).toBe('left')
      expect(getJoinType('belongsTo', 'right')).toBe('right') // Override
    })
  })

  describe('column resolution with aliases', () => {
    it('should resolve column names correctly with table aliases', () => {
      const joinDef: CubeJoin = {
        targetCube: () => testCubes.testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: schema.productivity.employeeId, target: schema.employees.id }
        ]
      }

      const planner = queryPlanner as any
      const condition = planner.buildJoinCondition(
        joinDef,
        'productivity_cube', // Source table alias
        'employees_cube',    // Target table alias
        context
      )

      // Verify the condition contains properly qualified column references
      expect(condition).toBeDefined()
      expect(condition.queryChunks).toBeDefined()
      
      // Convert to SQL to verify proper aliasing
      const sqlString = condition.toSQL ? condition.toSQL().sql : condition.toString()
      
      // Should contain aliased column references
      expect(typeof sqlString).toBe('string')
      // The actual SQL generation will be tested in integration tests
    })

    it('should handle primary cube without alias (sourceAlias = null)', () => {
      const joinDef: CubeJoin = {
        targetCube: () => testCubes.testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: schema.productivity.employeeId, target: schema.employees.id }
        ]
      }

      const planner = queryPlanner as any
      const condition = planner.buildJoinCondition(
        joinDef,
        null, // Primary cube - no alias needed
        'employees_cube',
        context
      )

      expect(condition).toBeDefined()
      expect(condition.queryChunks).toBeDefined()
    })

    it('should validate that Drizzle columns have accessible name property', () => {
      // This test validates that our column resolution logic can access column.name
      expect(schema.productivity.employeeId.name).toBeDefined()
      expect(schema.employees.id.name).toBeDefined()
      expect(typeof schema.productivity.employeeId.name).toBe('string')
      expect(typeof schema.employees.id.name).toBe('string')
      
      console.log('Column names:', {
        productivityEmployeeId: schema.productivity.employeeId.name,
        employeesId: schema.employees.id.name
      })
    })
  })

  describe('pre-aggregation CTE planning', () => {
    it('should detect need for CTEs regardless of measure order', () => {
      const cubes = new Map()
      cubes.set('Employees', testCubes.testEmployeesCube)
      cubes.set('Productivity', testCubes.testProductivityCube)

      // First query: Productivity measure first
      const query1 = {
        measures: ['Productivity.avgLinesOfCode', 'Employees.avgSalary'],
        dimensions: ['Employees.name'],
        order: { 'Employees.name': 'asc' }
      }

      // Second query: Employees measure first (same measures, different order)
      const query2 = {
        measures: ['Employees.avgSalary', 'Productivity.avgLinesOfCode'], 
        dimensions: ['Employees.name'],
        order: { 'Employees.name': 'asc' }
      }

      const plan1 = queryPlanner.createQueryPlan(cubes, query1, context)
      const plan2 = queryPlanner.createQueryPlan(cubes, query2, context)

      // Both plans should have the same CTE detection behavior
      // If one has CTEs, both should have CTEs
      const plan1HasCTEs = plan1.preAggregationCTEs && plan1.preAggregationCTEs.length > 0
      const plan2HasCTEs = plan2.preAggregationCTEs && plan2.preAggregationCTEs.length > 0

      console.log('Plan 1 primary cube:', plan1.primaryCube.name)
      console.log('Plan 1 CTEs:', plan1HasCTEs ? plan1.preAggregationCTEs!.length : 0)
      console.log('Plan 2 primary cube:', plan2.primaryCube.name) 
      console.log('Plan 2 CTEs:', plan2HasCTEs ? plan2.preAggregationCTEs!.length : 0)

      // Both should detect the same need for pre-aggregation
      expect(plan1HasCTEs).toBe(plan2HasCTEs)

      // If they both have CTEs, they should have the same number
      if (plan1HasCTEs && plan2HasCTEs) {
        expect(plan1.preAggregationCTEs!.length).toBe(plan2.preAggregationCTEs!.length)
      }
    })

    it('should always detect CTEs for hasMany relationships with measures', () => {
      const cubes = new Map()
      cubes.set('Employees', testCubes.testEmployeesCube)
      cubes.set('Productivity', testCubes.testProductivityCube)

      // Query without dimensions but with measures from both cubes
      // This tests the case where we need to decide on primary cube based on measures only
      const queryNoMessages = {
        measures: ['Employees.count', 'Productivity.totalLinesOfCode']
      }

      const queryNoDimensions = {
        measures: ['Productivity.totalLinesOfCode', 'Employees.count']
      }

      const plan1 = queryPlanner.createQueryPlan(cubes, queryNoMessages, context)
      const plan2 = queryPlanner.createQueryPlan(cubes, queryNoDimensions, context)

      console.log('No-dim Plan 1 primary:', plan1.primaryCube.name)
      console.log('No-dim Plan 2 primary:', plan2.primaryCube.name)

      // Both should choose the same primary cube (alphabetical fallback: Employees)
      expect(plan1.primaryCube.name).toBe(plan2.primaryCube.name)
      expect(plan1.primaryCube.name).toBe('Employees') // Alphabetically first

      // Both should detect need for pre-aggregation because Productivity has hasMany from Employees
      const plan1HasCTEs = plan1.preAggregationCTEs && plan1.preAggregationCTEs.length > 0
      const plan2HasCTEs = plan2.preAggregationCTEs && plan2.preAggregationCTEs.length > 0

      expect(plan1HasCTEs).toBe(true) 
      expect(plan2HasCTEs).toBe(true)
      expect(plan1.preAggregationCTEs!.length).toBe(plan2.preAggregationCTEs!.length)
    })
  })
})
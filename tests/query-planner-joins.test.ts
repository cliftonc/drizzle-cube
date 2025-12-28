/**
 * Tests for QueryPlanner join functionality with new array-based joins
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { eq, gte } from 'drizzle-orm'
import { QueryPlanner } from '../src/server/query-planner'
import { getTestSchema } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import type { QueryContext, CubeJoin } from '../../src/server/types'

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
      const { getJoinType } = await import('../src/server/cube-utils')
      
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

  describe('analyzeQueryPlan() - Query Analysis', () => {
    describe('Primary Cube Selection Analysis', () => {
      it('should return single_cube reason for single cube queries', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)

        const query = {
          measures: ['Employees.count'],
          dimensions: ['Employees.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        expect(analysis.primaryCube.reason).toBe('single_cube')
        expect(analysis.primaryCube.selectedCube).toBe('Employees')
        expect(analysis.primaryCube.explanation).toBe('Only one cube is used in this query')
        expect(analysis.cubeCount).toBe(1)
        expect(analysis.cubesInvolved).toEqual(['Employees'])
      })

      it('should return most_dimensions when one cube has more dimensions in query', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Departments', testCubes.testDepartmentsCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        // Query with 2 dimensions from Employees, 1 from Departments
        const query = {
          measures: ['Employees.count', 'Departments.count'],
          dimensions: ['Employees.name', 'Employees.email', 'Departments.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Employees has 2 dimensions, Departments has 1 - Employees should be primary
        expect(analysis.primaryCube.selectedCube).toBe('Employees')
        expect(analysis.primaryCube.reason).toBe('most_dimensions')
        expect(analysis.primaryCube.explanation).toContain('dimension')
        expect(analysis.primaryCube.candidates).toBeDefined()
        expect(analysis.primaryCube.candidates!.length).toBeGreaterThan(0)
      })

      it('should return alphabetical_fallback when no cube can reach all others', () => {
        // Create isolated cubes with no joins between them
        const isolatedCube1 = {
          name: 'ZetaCube',
          sql: () => eq(schema.employees.organisationId, 1),
          measures: {
            count: { type: 'count' as const, sql: () => schema.employees.id }
          },
          dimensions: {}
        }
        const isolatedCube2 = {
          name: 'AlphaCube',
          sql: () => eq(schema.departments.organisationId, 1),
          measures: {
            count: { type: 'count' as const, sql: () => schema.departments.id }
          },
          dimensions: {}
        }

        const cubes = new Map()
        cubes.set('ZetaCube', isolatedCube1)
        cubes.set('AlphaCube', isolatedCube2)

        const query = {
          measures: ['ZetaCube.count', 'AlphaCube.count']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Should fall back to alphabetical (AlphaCube before ZetaCube)
        expect(analysis.primaryCube.selectedCube).toBe('AlphaCube')
        expect(analysis.primaryCube.reason).toBe('alphabetical_fallback')
        expect(analysis.primaryCube.explanation).toContain('alphabetically')
      })

      it('should include candidate analysis details', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        const query = {
          measures: ['Employees.count', 'Productivity.totalLinesOfCode'],
          dimensions: ['Employees.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Should have candidate info when multiple cubes are considered
        if (analysis.primaryCube.candidates) {
          for (const candidate of analysis.primaryCube.candidates) {
            expect(candidate.cubeName).toBeDefined()
            expect(typeof candidate.dimensionCount).toBe('number')
            expect(typeof candidate.joinCount).toBe('number')
            expect(typeof candidate.canReachAll).toBe('boolean')
          }
        }
      })
    })

    describe('Join Path Analysis', () => {
      it('should return path steps with joinType and joinColumns', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        const query = {
          measures: ['Employees.count', 'Productivity.totalLinesOfCode'],
          dimensions: ['Employees.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Should have join path from Employees to Productivity
        expect(analysis.joinPaths.length).toBeGreaterThan(0)

        const joinPath = analysis.joinPaths[0]
        expect(joinPath.targetCube).toBeDefined()
        expect(joinPath.pathFound).toBe(true)
        expect(joinPath.path).toBeDefined()
        expect(joinPath.pathLength).toBeGreaterThan(0)

        // Verify path step structure
        if (joinPath.path && joinPath.path.length > 0) {
          const step = joinPath.path[0]
          expect(step.fromCube).toBeDefined()
          expect(step.toCube).toBeDefined()
          expect(step.relationship).toBeDefined()
          expect(step.joinType).toBeDefined()
          expect(step.joinColumns).toBeDefined()
          expect(Array.isArray(step.joinColumns)).toBe(true)
        }
      })

      it('should track visitedCubes during BFS traversal', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        const query = {
          measures: ['Employees.count', 'Productivity.totalLinesOfCode']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        const joinPath = analysis.joinPaths[0]
        expect(joinPath.visitedCubes).toBeDefined()
        expect(Array.isArray(joinPath.visitedCubes)).toBe(true)
        expect(joinPath.visitedCubes!.length).toBeGreaterThan(0)
      })

      it('should return pathFound=false with error when no path exists', () => {
        // Create cubes with no relationship between them
        const disconnectedCube = {
          name: 'DisconnectedCube',
          sql: () => eq(schema.employees.organisationId, 1),
          measures: {
            count: { type: 'count' as const, sql: () => schema.employees.id }
          },
          dimensions: {}
          // No joins defined
        }

        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('DisconnectedCube', disconnectedCube)

        const query = {
          measures: ['Employees.count', 'DisconnectedCube.count']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Should have a failed join path
        const failedPath = analysis.joinPaths.find(p => !p.pathFound)
        expect(failedPath).toBeDefined()
        expect(failedPath!.pathFound).toBe(false)
        expect(failedPath!.error).toBeDefined()
        expect(failedPath!.error).toContain('No join path found')

        // Should have warning in analysis
        expect(analysis.warnings).toBeDefined()
        expect(analysis.warnings!.length).toBeGreaterThan(0)
      })
    })

    describe('Pre-aggregation Analysis', () => {
      it('should detect hasMany relationships requiring pre-aggregation', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        const query = {
          measures: ['Employees.count', 'Productivity.totalLinesOfCode'],
          dimensions: ['Employees.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Employees hasMany Productivity - should require pre-aggregation
        expect(analysis.preAggregations.length).toBeGreaterThan(0)
        expect(analysis.querySummary.hasPreAggregation).toBe(true)
        expect(analysis.querySummary.queryType).toBe('multi_cube_cte')
      })

      it('should extract join keys for CTE generation', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        const query = {
          measures: ['Employees.count', 'Productivity.avgLinesOfCode']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        if (analysis.preAggregations.length > 0) {
          const preAgg = analysis.preAggregations[0]
          expect(preAgg.cubeName).toBeDefined()
          expect(preAgg.cteAlias).toBeDefined()
          expect(preAgg.reason).toContain('hasMany')
          expect(preAgg.measures).toBeDefined()
          expect(Array.isArray(preAgg.measures)).toBe(true)
          expect(preAgg.joinKeys).toBeDefined()
          expect(Array.isArray(preAgg.joinKeys)).toBe(true)

          // Verify join key structure
          if (preAgg.joinKeys.length > 0) {
            expect(preAgg.joinKeys[0].sourceColumn).toBeDefined()
            expect(preAgg.joinKeys[0].targetColumn).toBeDefined()
          }
        }
      })

      it('should skip cubes without measures in query', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Productivity', testCubes.testProductivityCube)

        // Query with only dimensions from Productivity, no measures
        const query = {
          measures: ['Employees.count'],
          dimensions: ['Employees.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Should not have pre-aggregations since only one cube has measures
        expect(analysis.preAggregations.length).toBe(0)
        expect(analysis.querySummary.hasPreAggregation).toBe(false)
      })
    })

    describe('Query Summary', () => {
      it('should return single_cube query type for single cube queries', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)

        const query = {
          measures: ['Employees.count']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        expect(analysis.querySummary.queryType).toBe('single_cube')
        expect(analysis.querySummary.joinCount).toBe(0)
        expect(analysis.querySummary.cteCount).toBe(0)
      })

      it('should return multi_cube_join for multi-cube without pre-aggregation', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)
        cubes.set('Departments', testCubes.testDepartmentsCube)

        // belongsTo relationship doesn't need pre-aggregation
        const query = {
          measures: ['Employees.count'],
          dimensions: ['Departments.name']
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        // Only Employees has measures, so no CTE needed
        expect(analysis.querySummary.queryType).toBe('multi_cube_join')
        expect(analysis.querySummary.hasPreAggregation).toBe(false)
      })

      it('should handle empty query gracefully', () => {
        const cubes = new Map()
        cubes.set('Employees', testCubes.testEmployeesCube)

        const query = {
          measures: [],
          dimensions: []
        }

        const analysis = queryPlanner.analyzeQueryPlan(cubes, query, context)

        expect(analysis.cubeCount).toBe(0)
        expect(analysis.cubesInvolved).toEqual([])
        expect(analysis.warnings).toBeDefined()
        expect(analysis.warnings!.length).toBeGreaterThan(0)
      })
    })
  })
})
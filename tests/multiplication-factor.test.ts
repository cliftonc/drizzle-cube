/**
 * Multiplication Factor Unit Tests
 *
 * Tests that computeCTEReasons() (via buildPreAggregationCTEs) computes
 * CTE reasons from the actual join plan entries, not from all registered cubes.
 *
 * Key scenarios:
 * 1. No hasMany in join plan → no CTEs
 * 2. Single hasMany → target gets 'hasMany', others get 'fanOutPrevention'
 * 3. Unrelated hasMany NOT in join plan → no false positive CTEs
 * 4. Multiple hasMany targets → both get 'hasMany'
 * 5. belongsToMany → treated as causing multiplication
 * 6. Cube without measures → no CTE even if multiplied
 * 7. Primary cube → never gets a CTE reason
 */

import { describe, it, expect } from 'vitest'
import { sql } from 'drizzle-orm'
import { LogicalPlanner } from '../src/server/logical-plan/logical-planner'
import type { Cube, PhysicalQueryPlan, QueryContext, SemanticQuery } from '../src/server/types'

// Helper to create minimal cube definitions for unit testing
function createTestCube(
  name: string,
  options?: {
    measures?: Record<string, { name: string; type: string; sql: any }>
    dimensions?: Record<string, { name: string; type: string; sql: any; primaryKey?: boolean }>
    joins?: Cube['joins']
  }
): Cube {
  return {
    name,
    sql: () => ({ from: {} as any }),
    measures: options?.measures ?? {
      count: { name: 'count', type: 'count', sql: {} as any }
    },
    dimensions: options?.dimensions ?? {
      id: { name: 'id', type: 'number', sql: {} as any, primaryKey: true }
    },
    joins: options?.joins
  } as Cube
}

function createContext(): QueryContext {
  return {
    db: {} as any,
    schema: {},
    securityContext: { organisationId: 'test-org' }
  }
}

// Helper to create a JoinCubePlanEntry
function createJoinEntry(
  cube: Cube,
  relationship?: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
): PhysicalQueryPlan['joinCubes'][number] {
  return {
    cube,
    alias: `${cube.name.toLowerCase()}_cube`,
    joinType: relationship === 'belongsTo' ? 'inner' : 'left',
    joinCondition: sql`1=1`,
    relationship
  }
}

describe('Multiplication Factor (computeCTEReasons)', () => {
  const planner = new LogicalPlanner()

  describe('No hasMany in join plan', () => {
    it('should return fanOutPrevention CTE for belongsTo join with measures', () => {
      // belongsTo from primary means primary has multiple rows per joined row.
      // The joined cube's measures are at risk of inflation.
      const primary = createTestCube('Primary', {
        joins: {
          Joined: {
            targetCube: () => joined,
            relationship: 'belongsTo',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const joined = createTestCube('Joined')

      const cubes = new Map<string, Cube>([
        ['Primary', primary],
        ['Joined', joined]
      ])

      const joinCubes = [createJoinEntry(joined, 'belongsTo')]

      const query: SemanticQuery = {
        measures: ['Primary.count', 'Joined.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, primary, joinCubes, query, createContext()
      )

      // Joined cube's measures need fanOutPrevention because primary has
      // multiple rows per joined row (many-to-one)
      expect(result).toHaveLength(1)
      expect(result![0].cube.name).toBe('Joined')
      expect(result![0].cteReason).toBe('fanOutPrevention')
    })

    it('should return no CTEs when belongsTo join has NO measures', () => {
      const primary = createTestCube('Primary')
      const joined = createTestCube('Joined')

      const cubes = new Map<string, Cube>([
        ['Primary', primary],
        ['Joined', joined]
      ])

      const joinCubes = [createJoinEntry(joined, 'belongsTo')]

      // Only primary has measures — joined cube just provides dimensions
      const query: SemanticQuery = {
        measures: ['Primary.count'],
        dimensions: ['Joined.id']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, primary, joinCubes, query, createContext()
      )

      expect(result).toEqual([])
    })

    it('should return no CTEs when all joins are hasOne', () => {
      const primary = createTestCube('Primary')
      const joined = createTestCube('Joined')

      const cubes = new Map<string, Cube>([
        ['Primary', primary],
        ['Joined', joined]
      ])

      const joinCubes = [createJoinEntry(joined, 'hasOne')]

      const query: SemanticQuery = {
        measures: ['Primary.count', 'Joined.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, primary, joinCubes, query, createContext()
      )

      expect(result).toEqual([])
    })
  })

  describe('Single hasMany', () => {
    it('should assign hasMany CTE reason to direct hasMany target with measures', () => {
      const primary = createTestCube('Employees', {
        joins: {
          Productivity: {
            targetCube: () => productivity,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const productivity = createTestCube('Productivity')

      const cubes = new Map<string, Cube>([
        ['Employees', primary],
        ['Productivity', productivity]
      ])

      const joinCubes = [createJoinEntry(productivity, 'hasMany')]

      const query: SemanticQuery = {
        measures: ['Productivity.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, primary, joinCubes, query, createContext()
      )

      expect(result).toHaveLength(1)
      expect(result![0].cube.name).toBe('Productivity')
      expect(result![0].cteReason).toBe('hasMany')
    })

    it('should assign fanOutPrevention to other cubes with measures', () => {
      const employees = createTestCube('Employees', {
        joins: {
          Productivity: {
            targetCube: () => productivity,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          },
          Departments: {
            targetCube: () => departments,
            relationship: 'belongsTo',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const productivity = createTestCube('Productivity')
      const departments = createTestCube('Departments')

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Productivity', productivity],
        ['Departments', departments]
      ])

      const joinCubes = [
        createJoinEntry(productivity, 'hasMany'),
        createJoinEntry(departments, 'belongsTo')
      ]

      const query: SemanticQuery = {
        measures: ['Productivity.count', 'Departments.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      expect(result).toHaveLength(2)

      const prodCTE = result!.find(c => c.cube.name === 'Productivity')
      const deptCTE = result!.find(c => c.cube.name === 'Departments')

      expect(prodCTE?.cteReason).toBe('hasMany')
      expect(deptCTE?.cteReason).toBe('fanOutPrevention')
    })
  })

  describe('Unrelated hasMany NOT in join plan', () => {
    it('should NOT create hasMany CTEs when hasMany is registered but not in query', () => {
      // This is the KEY regression test.
      // SurveyResponses has hasMany from Employees, but is not in the join plan.
      // The only CTE should be for the belongsTo grain mismatch (if Departments has measures),
      // NOT for an unrelated hasMany→SurveyResponses.
      const surveys = createTestCube('SurveyResponses')
      const employees = createTestCube('Employees', {
        joins: {
          SurveyResponses: {
            targetCube: () => surveys,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          },
          Departments: {
            targetCube: () => departments,
            relationship: 'belongsTo',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const departments = createTestCube('Departments')

      // Register ALL cubes (including SurveyResponses)
      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Departments', departments],
        ['SurveyResponses', surveys]
      ])

      // But only Departments is in the join plan (SurveyResponses is NOT queried)
      const joinCubes = [createJoinEntry(departments, 'belongsTo')]

      const query: SemanticQuery = {
        measures: ['Employees.count', 'Departments.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      // Departments gets fanOutPrevention due to belongsTo grain mismatch
      // (primary has multiple rows per department). NOT because of unrelated hasMany.
      expect(result).toHaveLength(1)
      expect(result![0].cube.name).toBe('Departments')
      expect(result![0].cteReason).toBe('fanOutPrevention')

      // Crucially: no SurveyResponses CTE (the unrelated hasMany)
      const cubeNames = result!.map(c => c.cube.name)
      expect(cubeNames).not.toContain('SurveyResponses')
    })

    it('should NOT create any CTEs when unrelated hasMany exists and belongsTo has no measures', () => {
      const surveys = createTestCube('SurveyResponses')
      const employees = createTestCube('Employees', {
        joins: {
          SurveyResponses: {
            targetCube: () => surveys,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          },
          Departments: {
            targetCube: () => departments,
            relationship: 'belongsTo',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const departments = createTestCube('Departments')

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Departments', departments],
        ['SurveyResponses', surveys]
      ])

      const joinCubes = [createJoinEntry(departments, 'belongsTo')]

      // Only Employees has measures — Departments just provides dimensions
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Departments.id']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      // No CTEs needed — Departments has no measures, and the hasMany→SurveyResponses
      // is not in the join plan
      expect(result).toEqual([])
    })
  })

  describe('Multiple hasMany targets', () => {
    it('should assign hasMany to both targets', () => {
      const employees = createTestCube('Employees', {
        joins: {
          Productivity: {
            targetCube: () => productivity,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          },
          Tasks: {
            targetCube: () => tasks,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const productivity = createTestCube('Productivity')
      const tasks = createTestCube('Tasks')

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Productivity', productivity],
        ['Tasks', tasks]
      ])

      const joinCubes = [
        createJoinEntry(productivity, 'hasMany'),
        createJoinEntry(tasks, 'hasMany')
      ]

      const query: SemanticQuery = {
        measures: ['Productivity.count', 'Tasks.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      expect(result).toHaveLength(2)
      expect(result!.find(c => c.cube.name === 'Productivity')?.cteReason).toBe('hasMany')
      expect(result!.find(c => c.cube.name === 'Tasks')?.cteReason).toBe('hasMany')
    })
  })

  describe('belongsToMany', () => {
    it('should treat belongsToMany as causing multiplication', () => {
      // belongsToMany join entries have relationship: 'belongsToMany'
      // which computeCTEReasons treats as hasMany (causes row multiplication)
      const mockCol = {} as any
      const departments = createTestCube('Departments')
      const employees = createTestCube('Employees', {
        joins: {
          Departments: {
            targetCube: () => departments,
            relationship: 'belongsToMany',
            on: [],
            through: {
              table: {} as any,
              sourceKey: [{ source: mockCol, target: mockCol }],
              targetKey: [{ source: mockCol, target: mockCol }]
            }
          } as any
        }
      })

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Departments', departments]
      ])

      const joinCubes = [createJoinEntry(departments, 'belongsToMany')]

      const query: SemanticQuery = {
        measures: ['Departments.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      // The CTE is created with 'hasMany' reason because belongsToMany causes multiplication
      expect(result).toHaveLength(1)
      expect(result![0].cube.name).toBe('Departments')
      expect(result![0].cteReason).toBe('hasMany')
    })
  })

  describe('Cube without measures', () => {
    it('should not create CTE for cube without measures in query', () => {
      const employees = createTestCube('Employees', {
        joins: {
          Productivity: {
            targetCube: () => productivity,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const productivity = createTestCube('Productivity')

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Productivity', productivity]
      ])

      const joinCubes = [createJoinEntry(productivity, 'hasMany')]

      // Only Employees has measures in query, Productivity doesn't
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Productivity.id']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      // No CTE because Productivity has no measures in the query
      expect(result).toEqual([])
    })
  })

  describe('Primary cube', () => {
    it('should never assign CTE reason to primary cube', () => {
      // Even if primary has measures and there's a hasMany, primary doesn't get a CTE
      const employees = createTestCube('Employees', {
        joins: {
          Productivity: {
            targetCube: () => productivity,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const productivity = createTestCube('Productivity')

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Productivity', productivity]
      ])

      const joinCubes = [createJoinEntry(productivity, 'hasMany')]

      const query: SemanticQuery = {
        measures: ['Employees.count', 'Productivity.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      // Only Productivity should get a CTE, not the primary Employees
      const cubeNames = result!.map(c => c.cube.name)
      expect(cubeNames).not.toContain('Employees')
      expect(cubeNames).toContain('Productivity')
    })
  })

  describe('hasMany source is always primary cube', () => {
    it('should assign fanOutPrevention to all non-target join cubes with measures', () => {
      // Primary is Projects, joins to Departments (belongsTo) and Employees (hasMany)
      // In the join plan, Projects is the hasMany SOURCE (it's the primary/FROM clause)
      // Employees is the hasMany TARGET → gets 'hasMany'
      // Departments has measures and is joined via belongsTo → gets 'fanOutPrevention'
      // (even though Departments may define hasMany→Employees in its cube definition,
      // what matters is the join plan relationship, not the cube definition)
      const departments = createTestCube('Departments', {
        joins: {
          Employees: {
            targetCube: () => employees,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })
      const employees = createTestCube('Employees')
      const projects = createTestCube('Projects', {
        joins: {
          Departments: {
            targetCube: () => departments,
            relationship: 'belongsTo',
            on: [{ source: {} as any, target: {} as any }]
          },
          Employees: {
            targetCube: () => employees,
            relationship: 'hasMany',
            on: [{ source: {} as any, target: {} as any }]
          }
        }
      })

      const cubes = new Map<string, Cube>([
        ['Projects', projects],
        ['Departments', departments],
        ['Employees', employees]
      ])

      const joinCubes = [
        createJoinEntry(departments, 'belongsTo'),
        createJoinEntry(employees, 'hasMany')
      ]

      const query: SemanticQuery = {
        measures: ['Departments.count', 'Employees.count']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, projects, joinCubes, query, createContext()
      )

      const empCTE = result!.find(c => c.cube.name === 'Employees')
      expect(empCTE?.cteReason).toBe('hasMany')

      const deptCTE = result!.find(c => c.cube.name === 'Departments')
      expect(deptCTE?.cteReason).toBe('fanOutPrevention')
    })
  })

  describe('No measures in query', () => {
    it('should return empty when query has no measures', () => {
      const employees = createTestCube('Employees')
      const productivity = createTestCube('Productivity')

      const cubes = new Map<string, Cube>([
        ['Employees', employees],
        ['Productivity', productivity]
      ])

      const joinCubes = [createJoinEntry(productivity, 'hasMany')]

      const query: SemanticQuery = {
        dimensions: ['Employees.id', 'Productivity.id']
      }

      const result = planner.buildPreAggregationCTEs(
        cubes, employees, joinCubes, query, createContext()
      )

      expect(result).toEqual([])
    })
  })
})

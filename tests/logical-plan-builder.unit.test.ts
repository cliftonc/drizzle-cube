import { describe, it, expect, vi } from 'vitest'
import { LogicalPlanBuilder } from '../src/server/logical-plan/logical-plan-builder'
import type { Cube, QueryContext, SemanticQuery } from '../src/server/types'
import type { LogicalPlanner } from '../src/server/logical-plan/logical-planner'

function createCube(
  name: string,
  options?: {
    dimensions?: Cube['dimensions']
    measures?: Cube['measures']
  }
): Cube {
  return {
    name,
    sql: () => ({ from: {} as any }),
    dimensions: options?.dimensions ?? {
      id: { name: 'id', type: 'number', sql: {} as any, primaryKey: true }
    },
    measures: options?.measures ?? {
      count: { name: 'count', type: 'count', sql: {} as any }
    }
  }
}

function createContext(): QueryContext {
  return {
    db: {} as any,
    schema: {},
    securityContext: { organisationId: 1 }
  }
}

describe('LogicalPlanBuilder (unit)', () => {
  it('builds directly from planner phases', () => {
    const employeesCube = createCube('Employees')
    const cubes = new Map<string, Cube>([['Employees', employeesCube]])
    const query: SemanticQuery = { measures: ['Employees.count'] }

    const plannerStub = {
      analyzeCubeUsage: vi.fn(() => new Set(['Employees'])),
      analyzePrimaryCube: vi.fn(() => ({
        selectedCube: 'Employees',
        reason: 'single_cube',
        explanation: 'Only one cube is used in this query'
      })),
      analyzeJoinPathForTarget: vi.fn(),
      buildJoinPlanForPrimary: vi.fn(() => []),
      buildPreAggregationCTEs: vi.fn(() => []),
      buildWarnings: vi.fn(() => [])
    } as unknown as LogicalPlanner

    const builder = new LogicalPlanBuilder(plannerStub)
    const plan = builder.plan(cubes, query, createContext())

    expect(plan.type).toBe('query')
    expect(plan.source.type).toBe('simpleSource')
    expect(plan.source.primaryCube.name).toBe('Employees')
    expect(plan.measures.map(m => m.name)).toEqual(['Employees.count'])

    expect((plannerStub as any).analyzeCubeUsage).toHaveBeenCalledTimes(1)
    expect((plannerStub as any).analyzePrimaryCube).toHaveBeenCalledTimes(1)
    expect((plannerStub as any).buildJoinPlanForPrimary).not.toHaveBeenCalled()
    expect((plannerStub as any).buildPreAggregationCTEs).not.toHaveBeenCalled()
    expect((plannerStub as any).buildWarnings).toHaveBeenCalledTimes(1)
  })

  it('uses join and CTE planning phases for multi-cube queries', () => {
    const employeesCube = createCube('Employees')
    const departmentsCube = createCube('Departments')
    const cubes = new Map<string, Cube>([
      ['Employees', employeesCube],
      ['Departments', departmentsCube]
    ])
    const query: SemanticQuery = {
      measures: ['Employees.count'],
      dimensions: ['Departments.id']
    }

    const plannerStub = {
      analyzeCubeUsage: vi.fn(() => new Set(['Employees', 'Departments'])),
      analyzePrimaryCube: vi.fn(() => ({
        selectedCube: 'Employees',
        reason: 'most_dimensions',
        explanation: 'Employees selected for grain'
      })),
      analyzeJoinPathForTarget: vi.fn(() => ({
        targetCube: 'Departments',
        pathFound: true,
        path: [
          {
            fromCube: 'Employees',
            toCube: 'Departments',
            relationship: 'belongsTo',
            joinType: 'left',
            joinColumns: [{ sourceColumn: 'departmentId', targetColumn: 'id' }]
          }
        ],
        pathLength: 1
      })),
      buildJoinPlanForPrimary: vi.fn(() => [
        {
          cube: departmentsCube,
          alias: 'departments_cube',
          joinType: 'left' as const,
          joinCondition: {} as any
        }
      ]),
      buildPreAggregationCTEs: vi.fn(() => []),
      buildWarnings: vi.fn(() => [])
    } as unknown as LogicalPlanner

    const builder = new LogicalPlanBuilder(plannerStub)
    const plan = builder.plan(cubes, query, createContext())

    expect(plan.source.type).toBe('simpleSource')
    expect(plan.source.joins).toHaveLength(1)
    expect(plan.source.joins[0].target.name).toBe('Departments')
    expect((plannerStub as any).buildJoinPlanForPrimary).toHaveBeenCalledTimes(1)
    expect((plannerStub as any).buildPreAggregationCTEs).toHaveBeenCalledTimes(1)
    expect((plannerStub as any).analyzeJoinPathForTarget).toHaveBeenCalledTimes(1)
  })

  it('returns planning analysis from the same planning phases', () => {
    const employeesCube = createCube('Employees')
    const cubes = new Map<string, Cube>([['Employees', employeesCube]])
    const query: SemanticQuery = { measures: ['Employees.count'] }

    const plannerStub = {
      analyzeCubeUsage: vi.fn(() => new Set(['Employees'])),
      analyzePrimaryCube: vi.fn(() => ({
        selectedCube: 'Employees',
        reason: 'single_cube',
        explanation: 'Only one cube is used in this query'
      })),
      analyzeJoinPathForTarget: vi.fn(),
      buildJoinPlanForPrimary: vi.fn(() => []),
      buildPreAggregationCTEs: vi.fn(() => []),
      buildWarnings: vi.fn(() => [])
    } as unknown as LogicalPlanner

    const builder = new LogicalPlanBuilder(plannerStub)
    const result = builder.planWithAnalysis(cubes, query, createContext())

    expect(result.plan.type).toBe('query')
    expect(result.analysis.primaryCube.selectedCube).toBe('Employees')
    expect(result.analysis.querySummary.queryType).toBe('single_cube')
    expect(result.analysis.querySummary.joinCount).toBe(0)
    expect(result.analysis.querySummary.cteCount).toBe(0)
    expect(result.analysis.planningTrace).toBeDefined()
    expect(result.analysis.planningTrace?.steps.length).toBeGreaterThan(0)
  })

  it('emits keysDeduplication source when multiplied measures have primary keys', () => {
    const departmentsCube = createCube('Departments', {
      measures: {
        totalBudget: { name: 'totalBudget', type: 'sum', sql: {} as any }
      }
    })
    const productivityCube = createCube('Productivity', {
      measures: {
        recordCount: { name: 'recordCount', type: 'count', sql: {} as any }
      }
    })
    const cubes = new Map<string, Cube>([
      ['Departments', departmentsCube],
      ['Productivity', productivityCube]
    ])

    const query: SemanticQuery = {
      measures: ['Departments.totalBudget']
    }

    const plannerStub = {
      analyzeCubeUsage: vi.fn(() => new Set(['Departments', 'Productivity'])),
      analyzePrimaryCube: vi.fn(() => ({
        selectedCube: 'Departments',
        reason: 'most_dimensions',
        explanation: 'Departments selected'
      })),
      analyzeJoinPathForTarget: vi.fn(() => ({
        targetCube: 'Productivity',
        pathFound: true,
        path: [],
        pathLength: 0
      })),
      buildJoinPlanForPrimary: vi.fn(() => []),
      buildPreAggregationCTEs: vi.fn(() => [
        {
          cube: departmentsCube,
          alias: 'departments_cube',
          cteAlias: 'departments_agg',
          joinKeys: [
            {
              sourceColumn: 'id',
              targetColumn: 'id',
              sourceColumnObj: {} as any,
              targetColumnObj: {} as any
            }
          ],
          measures: ['Departments.totalBudget'],
          cteType: 'aggregate',
          cteReason: 'fanOutPrevention'
        }
      ]),
      buildWarnings: vi.fn(() => [])
    } as unknown as LogicalPlanner

    const builder = new LogicalPlanBuilder(plannerStub)
    const result = builder.planWithAnalysis(cubes, query, createContext())

    expect(result.plan.source.type).toBe('keysDeduplication')
    if (result.plan.source.type === 'keysDeduplication') {
      expect(result.plan.source.joinOn.length).toBeGreaterThan(0)
      expect(result.plan.source.measureSource.type).toBe('simpleSource')
    }

    const strategyStep = result.analysis.planningTrace?.steps.find(
      step => step.phase === 'measure_strategy'
    )
    expect(strategyStep).toBeDefined()
    expect(strategyStep?.details?.strategy).toBe('keysDeduplication')
  })

  it('falls back to simpleSource when multiplied measures do not have primary keys', () => {
    const departmentsCube = createCube('Departments', {
      dimensions: {
        id: { name: 'id', type: 'number', sql: {} as any }
      },
      measures: {
        totalBudget: { name: 'totalBudget', type: 'sum', sql: {} as any }
      }
    })
    const productivityCube = createCube('Productivity', {
      measures: {
        recordCount: { name: 'recordCount', type: 'count', sql: {} as any }
      }
    })
    const cubes = new Map<string, Cube>([
      ['Departments', departmentsCube],
      ['Productivity', productivityCube]
    ])

    const query: SemanticQuery = {
      measures: ['Departments.totalBudget']
    }

    const plannerStub = {
      analyzeCubeUsage: vi.fn(() => new Set(['Departments', 'Productivity'])),
      analyzePrimaryCube: vi.fn(() => ({
        selectedCube: 'Departments',
        reason: 'most_dimensions',
        explanation: 'Departments selected'
      })),
      analyzeJoinPathForTarget: vi.fn(() => ({
        targetCube: 'Productivity',
        pathFound: true,
        path: [],
        pathLength: 0
      })),
      buildJoinPlanForPrimary: vi.fn(() => []),
      buildPreAggregationCTEs: vi.fn(() => [
        {
          cube: departmentsCube,
          alias: 'departments_cube',
          cteAlias: 'departments_agg',
          joinKeys: [
            {
              sourceColumn: 'id',
              targetColumn: 'id',
              sourceColumnObj: {} as any,
              targetColumnObj: {} as any
            }
          ],
          measures: ['Departments.totalBudget'],
          cteType: 'aggregate',
          cteReason: 'fanOutPrevention'
        }
      ]),
      buildWarnings: vi.fn(() => [])
    } as unknown as LogicalPlanner

    const builder = new LogicalPlanBuilder(plannerStub)
    const result = builder.planWithAnalysis(cubes, query, createContext())

    expect(result.plan.source.type).toBe('simpleSource')
    const strategyStep = result.analysis.planningTrace?.steps.find(
      step => step.phase === 'measure_strategy'
    )
    expect(strategyStep?.details?.strategy).toBe('ctePreAggregateFallback')
  })
})

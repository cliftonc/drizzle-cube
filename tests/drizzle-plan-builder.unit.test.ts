import { describe, it, expect } from 'vitest'

import { DrizzlePlanBuilder } from '../src/server/physical-plan/drizzle-plan-builder'
import type { Cube } from '../src/server/types'
import type { QueryNode, SimpleSource } from '../src/server/logical-plan'

function createCube(name: string): Cube {
  return {
    name,
    sql: () => ({ from: {} as any }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: {} as any, primaryKey: true }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: {} as any }
    }
  }
}

function createSimplePlan(cube: Cube): QueryNode {
  const source: SimpleSource = {
    type: 'simpleSource',
    schema: { measures: [], dimensions: [], timeDimensions: [] },
    primaryCube: { name: cube.name, cube },
    joins: [],
    ctes: []
  }

  return {
    type: 'query',
    schema: { measures: [], dimensions: [], timeDimensions: [] },
    source,
    dimensions: [],
    measures: [],
    filters: [],
    timeDimensions: [],
    orderBy: [],
    warnings: []
  }
}

describe('DrizzlePlanBuilder physical conversion', () => {
  it('accepts keysDeduplication source by resolving a simpleSource child', () => {
    const cube = createCube('Employees')
    const simplePlan = createSimplePlan(cube)

    const keysDedupPlan: QueryNode = {
      ...simplePlan,
      source: {
        type: 'keysDeduplication',
        schema: simplePlan.source.schema,
        keysSource: simplePlan.source,
        measureSource: simplePlan.source,
        joinOn: []
      }
    }

    const builder = new DrizzlePlanBuilder({} as any, {} as any, {} as any)
    const physical = builder.derivePhysicalPlanContext(keysDedupPlan)

    expect(physical.primaryCube.name).toBe('Employees')
    expect(physical.joinCubes).toHaveLength(0)
  })

  it('accepts fullKeyAggregate source by converting query subqueries', () => {
    const cube = createCube('Employees')
    const simplePlan = createSimplePlan(cube)

    const fullKeyAggregatePlan: QueryNode = {
      ...simplePlan,
      source: {
        type: 'fullKeyAggregate',
        schema: simplePlan.source.schema,
        subqueries: [simplePlan],
        dimensions: []
      }
    }

    const builder = new DrizzlePlanBuilder({} as any, {} as any, {} as any)
    const physical = builder.derivePhysicalPlanContext(fullKeyAggregatePlan)

    expect(physical.primaryCube.name).toBe('Employees')
    expect(physical.multiFactMerge).toBeDefined()
    expect(physical.multiFactMerge?.groups).toHaveLength(1)
    expect(physical.multiFactMerge?.groups[0].alias).toBe('fka_group_1')
  })
})

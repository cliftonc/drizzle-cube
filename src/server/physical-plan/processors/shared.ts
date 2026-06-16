import type { SQL } from 'drizzle-orm'

import type { DatabaseAdapter } from '../../adapters/base-adapter.js'
import type { DrizzleSqlBuilder } from '../drizzle-sql-builder.js'
import type { CTEBuilder } from '../../builders/cte-builder.js'
import type {
  Cube,
  PhysicalQueryPlan
} from '../../types/index.js'

export interface PhysicalBuildDependencies {
  queryBuilder: DrizzleSqlBuilder
  cteBuilder: CTEBuilder
  databaseAdapter: DatabaseAdapter
}

export interface DownstreamJoinState {
  cteAlias: string
  joinKeys: Array<{
    sourceColumn: string
    targetColumn: string
    sourceColumnObj?: any
    targetColumnObj?: any
  }>
}

export interface CTEBuildState {
  preBuiltFilterMap: Map<string, SQL[]>
  ctes: any[]
  cteAliasMap: Map<string, string>
  downstreamCubeMap: Map<string, DownstreamJoinState>
}

export interface JoinBuildState {
  drizzleQuery: any
  allWhereConditions: SQL[]
  cubesWithSecurityInJoin: Set<string>
  absorbedIntermediateCubes: Set<string>
}

export type SelectionMap = Record<string, any>

/**
 * Apply a join of the given type to a Drizzle query builder.
 * Shared by the physical-plan builders that assemble CTE/merge queries.
 */
export function applyJoinByType(
  drizzleQuery: any,
  joinType: 'inner' | 'left' | 'right' | 'full',
  joinTarget: any,
  joinCondition: SQL
): any {
  switch (joinType) {
    case 'inner':
      return drizzleQuery.innerJoin(joinTarget, joinCondition)
    case 'right':
      return drizzleQuery.rightJoin(joinTarget, joinCondition)
    case 'full':
      return drizzleQuery.fullJoin(joinTarget, joinCondition)
    case 'left':
    default:
      return drizzleQuery.leftJoin(joinTarget, joinCondition)
  }
}

export function getCubesFromPlan(queryPlan: PhysicalQueryPlan): Map<string, Cube> {
  const cubes = new Map<string, Cube>()
  cubes.set(queryPlan.primaryCube.name, queryPlan.primaryCube)

  if (queryPlan.joinCubes) {
    for (const joinCube of queryPlan.joinCubes) {
      cubes.set(joinCube.cube.name, joinCube.cube)
    }
  }

  return cubes
}

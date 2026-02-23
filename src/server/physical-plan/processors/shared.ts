import type { SQL } from 'drizzle-orm'

import type { DatabaseAdapter } from '../../adapters/base-adapter'
import type { DrizzleSqlBuilder } from '../drizzle-sql-builder'
import type { CTEBuilder } from '../../builders/cte-builder'
import type {
  Cube,
  PhysicalQueryPlan
} from '../../types'

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

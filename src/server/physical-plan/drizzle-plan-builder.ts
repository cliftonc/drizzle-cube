import type { DatabaseAdapter } from '../adapters/base-adapter'
import type { DrizzleSqlBuilder } from './drizzle-sql-builder'
import type { CTEBuilder } from '../builders/cte-builder'
import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../types'
import type { QueryNode, SimpleSource } from '../logical-plan'
import {
  buildCTEState,
  buildModifiedSelections,
  applyJoins,
  applyPredicatesAndFinalize,
  getCubesFromPlan
} from './processors'
import type { PhysicalBuildDependencies } from './processors'

/**
 * Converts optimised logical plans into runtime physical query plans,
 * then builds executable Drizzle queries.
 */
export class DrizzlePlanBuilder {
  constructor(
    private readonly queryBuilder: DrizzleSqlBuilder,
    private readonly cteBuilder: CTEBuilder,
    private readonly databaseAdapter: DatabaseAdapter
  ) {}

  /**
   * Build runtime physical context from an optimised logical plan.
   * This is the physical-builder input for SQL generation.
   */
  derivePhysicalPlanContext(plan: QueryNode): PhysicalQueryPlan {
    const source = plan.source
    if (source.type !== 'simpleSource') {
      throw new Error(
        `Current SQL builder only supports 'simpleSource' logical nodes, got '${source.type}'`
      )
    }

    const simpleSource = source as SimpleSource

    return {
      primaryCube: simpleSource.primaryCube.cube,
      joinCubes: simpleSource.joins.map(join => ({
        cube: join.target.cube,
        alias: join.alias,
        joinType: join.joinType,
        joinCondition: join.joinCondition,
        junctionTable: join.junctionTable
      })),
      preAggregationCTEs: simpleSource.ctes.map(cte => ({
        cube: cte.cube.cube,
        alias: cte.alias,
        cteAlias: cte.cteAlias,
        joinKeys: cte.joinKeys,
        measures: cte.measures,
        propagatingFilters: cte.propagatingFilters,
        downstreamJoinKeys: cte.downstreamJoinKeys,
        intermediateJoins: cte.intermediateJoins,
        cteType: cte.cteType,
        cteReason: cte.cteReason
      })),
      warnings: plan.warnings.length > 0 ? plan.warnings : undefined
    }
  }

  /**
   * Build unified query that works for both single and multi-cube queries.
   */
  build(
    queryPlan: PhysicalQueryPlan,
    query: SemanticQuery,
    context: QueryContext
  ) {
    const deps: PhysicalBuildDependencies = {
      queryBuilder: this.queryBuilder,
      cteBuilder: this.cteBuilder,
      databaseAdapter: this.databaseAdapter
    }

    const cteState = buildCTEState(queryPlan, query, context, deps)
    const primaryCubeBase = queryPlan.primaryCube.sql(context)

    const allCubes = queryPlan.joinCubes.length > 0
      ? getCubesFromPlan(queryPlan)
      : new Map<string, Cube>([[queryPlan.primaryCube.name, queryPlan.primaryCube]])

    const modifiedSelections = buildModifiedSelections(
      queryPlan,
      query,
      context,
      allCubes,
      deps
    )

    const joinState = applyJoins(
      queryPlan,
      context,
      primaryCubeBase,
      modifiedSelections,
      cteState,
      deps
    )

    return applyPredicatesAndFinalize(
      queryPlan,
      query,
      context,
      allCubes,
      primaryCubeBase,
      cteState,
      joinState,
      deps
    )
  }
}

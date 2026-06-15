import type { DatabaseAdapter } from '../adapters/base-adapter'
import type { DrizzleSqlBuilder } from './drizzle-sql-builder'
import type { CTEBuilder } from '../builders/cte-builder'
import type {
  Cube,
  JoinCubePlanEntry,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../types'
import type {
  LogicalNode,
  QueryNode,
  SimpleSource,
  FullKeyAggregate,
  KeysDeduplication,
  MultiFactMerge,
  JoinRef
} from '../logical-plan'
import {
  buildRegularJoinCondition,
  expandBelongsToManyJoin
} from '../cube-utils'
import {
  buildCTEState,
  buildModifiedSelections,
  applyJoins,
  applyPredicatesAndFinalize,
  buildKeysDeduplicationQuery,
  buildMultiFactMergeQuery,
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

    if (source.type === 'multiFactMerge') {
      return this.derivePhysicalPlanContextFromMultiFact(plan, source as MultiFactMerge)
    }
    if (source.type === 'fullKeyAggregate') {
      return this.derivePhysicalPlanContextFromFullKeyAggregate(plan, source as FullKeyAggregate)
    }

    const simpleSource = this.resolvePhysicalSimpleSource(source)
    const keysDeduplicationMeta = this.resolveKeysDeduplicationMeta(source)

    return {
      primaryCube: simpleSource.primaryCube.cube,
      joinCubes: simpleSource.joins.map(join => this.materializeJoin(join)),
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
      keysDeduplication: keysDeduplicationMeta,
      warnings: plan.warnings.length > 0 ? plan.warnings : undefined
    }
  }

  /**
   * Materialize a symbolic JoinRef into a runtime JoinCubePlanEntry, building
   * the Drizzle join condition(s) from the join definition. This is the seam
   * where the logical plan's symbolic join refs become executable SQL — the
   * planner no longer pre-builds any join SQL.
   *
   * Junction-table security is NOT materialized here: the stored
   * `through.securitySql` function is carried forward and applied (in the WHERE
   * clause) at build time with the request's security context.
   */
  private materializeJoin(join: JoinRef): JoinCubePlanEntry {
    if (join.junctionTable) {
      const expanded = expandBelongsToManyJoin(join.joinDef)
      return {
        cube: join.target.cube,
        alias: join.alias,
        joinType: join.joinType,
        // junctionJoins[1] = junction -> target cube condition
        joinCondition: expanded.junctionJoins[1].condition,
        relationship: join.relationship,
        junctionTable: {
          table: join.junctionTable.table,
          alias: join.junctionTable.alias,
          joinType: join.junctionTable.joinType,
          // junctionJoins[0] = source -> junction condition
          joinCondition: expanded.junctionJoins[0].condition,
          securitySql: join.joinDef.through?.securitySql,
          sourceCubeName: join.junctionTable.sourceCubeName
        }
      }
    }

    return {
      cube: join.target.cube,
      alias: join.alias,
      joinType: join.joinType,
      joinCondition: buildRegularJoinCondition(join.joinDef),
      relationship: join.relationship
    }
  }

  private derivePhysicalPlanContextFromMultiFact(
    plan: QueryNode,
    source: MultiFactMerge
  ): PhysicalQueryPlan {
    const groups = source.groups
      .map((groupNode, index) => {
        if (groupNode.type !== 'query') {
          return null
        }

        const groupQueryNode = groupNode as QueryNode
        const groupPhysicalPlan = this.derivePhysicalPlanContext(groupQueryNode)
        const groupQuery = this.toSemanticQuery(groupQueryNode)

        return {
          alias: `mf_group_${index + 1}`,
          query: groupQuery,
          queryPlan: groupPhysicalPlan,
          measures: groupQuery.measures ?? []
        }
      })
      .filter((group): group is NonNullable<typeof group> => Boolean(group))

    if (groups.length === 0) {
      throw new Error('multiFactMerge requires at least one query group')
    }

    const baseGroup = groups[0]

    return {
      primaryCube: baseGroup.queryPlan.primaryCube,
      joinCubes: baseGroup.queryPlan.joinCubes,
      preAggregationCTEs: baseGroup.queryPlan.preAggregationCTEs,
      warnings: plan.warnings.length > 0 ? plan.warnings : undefined,
      multiFactMerge: {
        mergeStrategy: source.mergeStrategy,
        sharedDimensions: source.sharedDimensions.map(dimension => dimension.name),
        groups
      }
    }
  }

  private derivePhysicalPlanContextFromFullKeyAggregate(
    plan: QueryNode,
    source: FullKeyAggregate
  ): PhysicalQueryPlan {
    const groups = source.subqueries.map((subqueryNode, index) => {
      if (subqueryNode.type !== 'query') {
        throw new Error('fullKeyAggregate currently requires query subqueries')
      }

      const groupQueryNode = subqueryNode as QueryNode
      const groupPhysicalPlan = this.derivePhysicalPlanContext(groupQueryNode)
      const groupQuery = this.toSemanticQuery(groupQueryNode)

      return {
        alias: `fka_group_${index + 1}`,
        query: groupQuery,
        queryPlan: groupPhysicalPlan,
        measures: groupQuery.measures ?? []
      }
    })

    if (groups.length === 0) {
      throw new Error('fullKeyAggregate requires at least one subquery')
    }

    const baseGroup = groups[0]
    return {
      primaryCube: baseGroup.queryPlan.primaryCube,
      joinCubes: baseGroup.queryPlan.joinCubes,
      preAggregationCTEs: baseGroup.queryPlan.preAggregationCTEs,
      warnings: plan.warnings.length > 0 ? plan.warnings : undefined,
      multiFactMerge: {
        mergeStrategy: 'fullJoin',
        sharedDimensions: source.dimensions.map(dimension => dimension.name),
        groups
      }
    }
  }

  /**
   * Reconstruct a SemanticQuery from a (possibly optimised) QueryNode.
   *
   * This is the materialization seam that makes the logical plan a real IR:
   * the executor derives the query the physical builder consumes from the
   * optimised plan, so optimiser rewrites of measures/filters/limit/etc. take
   * effect in the generated SQL. Must faithfully round-trip every field the
   * physical builder and processors read off a SemanticQuery.
   */
  toSemanticQuery(node: QueryNode): SemanticQuery {
    const order =
      node.orderBy.length > 0
        ? Object.fromEntries(node.orderBy.map(entry => [entry.name, entry.direction]))
        : undefined

    return {
      measures: node.measures.map(measure => measure.name),
      dimensions: node.dimensions.map(dimension => dimension.name),
      timeDimensions: node.timeDimensions.map(timeDimension => ({
        dimension: timeDimension.name,
        granularity: timeDimension.granularity,
        dateRange: timeDimension.dateRange,
        fillMissingDates: timeDimension.fillMissingDates,
        compareDateRange: timeDimension.compareDateRange
      })),
      filters: node.filters,
      order,
      limit: node.limit,
      offset: node.offset,
      ungrouped: node.ungrouped
    }
  }

  private resolvePhysicalSimpleSource(source: LogicalNode): SimpleSource {
    switch (source.type) {
      case 'simpleSource':
        return source as SimpleSource
      case 'keysDeduplication':
        return this.resolvePhysicalSimpleSourceFromKeysDedup(source as KeysDeduplication)
      default:
        throw new Error(
          `Current SQL builder does not support logical node '${source.type}' in physical conversion`
        )
    }
  }

  private resolvePhysicalSimpleSourceFromKeysDedup(source: KeysDeduplication): SimpleSource {
    const measureSource = source.measureSource
    if (measureSource.type === 'simpleSource') {
      return measureSource as SimpleSource
    }

    const keysSource = source.keysSource
    if (keysSource.type === 'simpleSource') {
      return keysSource as SimpleSource
    }

    throw new Error(
      'keysDeduplication requires at least one simpleSource child for SQL physical conversion'
    )
  }

  private resolveKeysDeduplicationMeta(
    source: LogicalNode
  ): PhysicalQueryPlan['keysDeduplication'] | undefined {
    if (source.type !== 'keysDeduplication') {
      return undefined
    }

    const keysSource = source as KeysDeduplication
    const sourceAliases = new Set<string>()
    for (const joinRef of keysSource.joinOn) {
      if (!joinRef.alias) continue
      const [cubeName, dimensionName] = joinRef.alias.split('.')
      if (cubeName && dimensionName) {
        sourceAliases.add(cubeName)
      }
    }

    const multipliedCubeName = sourceAliases.size === 1
      ? Array.from(sourceAliases)[0]
      : ''

    return multipliedCubeName
      ? {
          multipliedCubeName,
          primaryKeyDimensions: keysSource.joinOn
            .map(joinRef => joinRef.alias?.split('.')[1] ?? '')
            .filter(Boolean),
          regularMeasures: keysSource.regularMeasures
        }
      : undefined
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

    const multiFactMergeQuery = buildMultiFactMergeQuery(
      queryPlan,
      query,
      context,
      deps,
      (groupPlan, groupQuery, groupContext) => this.build(groupPlan, groupQuery, groupContext)
    )
    if (multiFactMergeQuery) {
      return multiFactMergeQuery
    }

    const keysDedupQuery = buildKeysDeduplicationQuery(
      queryPlan,
      query,
      context,
      deps
    )
    if (keysDedupQuery) {
      return keysDedupQuery
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

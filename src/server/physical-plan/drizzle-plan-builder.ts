import {
  and,
  eq,
  sql,
  type SQL
} from 'drizzle-orm'

import type { DatabaseAdapter } from '../adapters/base-adapter'
import type { DrizzleSqlBuilder } from './drizzle-sql-builder'
import type { CTEBuilder } from '../builders/cte-builder'
import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../types'
import type {
  LogicalNode,
  QueryNode,
  SimpleSource,
  KeysDeduplication,
  MultiFactMerge
} from '../logical-plan'
import { resolveSqlExpression } from '../cube-utils'
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

    if (source.type === 'multiFactMerge') {
      return this.derivePhysicalPlanContextFromMultiFact(plan, source as MultiFactMerge)
    }

    const simpleSource = this.resolvePhysicalSimpleSource(source)
    const keysDeduplicationMeta = this.resolveKeysDeduplicationMeta(source)

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
      keysDeduplication: keysDeduplicationMeta,
      warnings: plan.warnings.length > 0 ? plan.warnings : undefined
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

  private toSemanticQuery(node: QueryNode): SemanticQuery {
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
      offset: node.offset
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

    const multiFactMergeQuery = this.tryBuildMultiFactMergeQuery(
      queryPlan,
      query,
      context,
      deps
    )
    if (multiFactMergeQuery) {
      return multiFactMergeQuery
    }

    const keysDedupQuery = this.tryBuildKeysDeduplicationQuery(
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

  private tryBuildKeysDeduplicationQuery(
    queryPlan: PhysicalQueryPlan,
    query: SemanticQuery,
    context: QueryContext,
    deps: PhysicalBuildDependencies
  ): any | null {
    const dedup = queryPlan.keysDeduplication
    if (!dedup?.multipliedCubeName || !query.measures?.length) {
      return null
    }

    const allCubes = queryPlan.joinCubes.length > 0
      ? getCubesFromPlan(queryPlan)
      : new Map<string, Cube>([[queryPlan.primaryCube.name, queryPlan.primaryCube]])
    const multipliedCube = allCubes.get(dedup.multipliedCubeName)
    if (!multipliedCube) {
      return null
    }

    if (!this.canExecuteKeysDeduplication(query, multipliedCube, dedup.multipliedCubeName)) {
      return null
    }

    const pkDimensions = dedup.primaryKeyDimensions.length > 0
      ? dedup.primaryKeyDimensions
      : this.getPrimaryKeyDimensions(multipliedCube)
    if (pkDimensions.length === 0) {
      return null
    }

    const keysAlias = `${dedup.multipliedCubeName.toLowerCase()}_keys`
    const aggAlias = `${dedup.multipliedCubeName.toLowerCase()}_pk_agg`

    const keysSelections: Record<string, any> = {}
    const keyGroupBy: SQL[] = []

    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, localName] = dimensionName.split('.')
        const cube = allCubes.get(cubeName)
        const dimension = cube?.dimensions?.[localName]
        if (!cube || !dimension) {
          return null
        }
        const expr = resolveSqlExpression(dimension.sql, context) as SQL
        keysSelections[dimensionName] = sql`${expr}`.as(dimensionName)
        keyGroupBy.push(expr)
      }
    }

    if (query.timeDimensions) {
      for (const timeDimension of query.timeDimensions) {
        const [cubeName, localName] = timeDimension.dimension.split('.')
        const cube = allCubes.get(cubeName)
        const dimension = cube?.dimensions?.[localName]
        if (!cube || !dimension) {
          return null
        }
        const expr = deps.queryBuilder.buildTimeDimensionExpression(
          dimension.sql,
          timeDimension.granularity,
          context
        )
        keysSelections[timeDimension.dimension] = sql`${expr}`.as(timeDimension.dimension)
        keyGroupBy.push(expr)
      }
    }

    const pkAliases: string[] = []
    for (const pkDimension of pkDimensions) {
      const dimension = multipliedCube.dimensions?.[pkDimension]
      if (!dimension) {
        return null
      }
      const expr = resolveSqlExpression(dimension.sql, context) as SQL
      const pkAlias = `__pk__${pkDimension}`
      keysSelections[pkAlias] = sql`${expr}`.as(pkAlias)
      keyGroupBy.push(expr)
      pkAliases.push(pkAlias)
    }

    // Split measures into multiplied (agg CTE) and regular (keys CTE)
    const regularMeasureNames = dedup.regularMeasures ?? []
    const regularMeasureSet = new Set(regularMeasureNames)
    const multipliedMeasures = query.measures.filter(m => !regularMeasureSet.has(m))

    // Pre-aggregate regular measures in the keys CTE
    if (regularMeasureNames.length > 0) {
      const regularMeasureMap = deps.queryBuilder.buildResolvedMeasures(
        regularMeasureNames,
        allCubes,
        context
      )

      for (const measureName of regularMeasureNames) {
        const [, localName] = measureName.split('.')
        const measureSqlBuilder = regularMeasureMap.get(measureName)
        if (!measureSqlBuilder) {
          return null
        }
        const regAlias = `__reg__${measureName.replace('.', '__')}`
        keysSelections[regAlias] = sql`${measureSqlBuilder()}`.as(regAlias)
      }
    }

    const primaryCubeBase = queryPlan.primaryCube.sql(context)
    const keysWhereConditions: SQL[] = []
    if (primaryCubeBase.where) {
      keysWhereConditions.push(primaryCubeBase.where)
    }

    let keysQuery = context.db
      .select(keysSelections)
      .from(primaryCubeBase.from)

    if (primaryCubeBase.joins) {
      for (const join of primaryCubeBase.joins) {
        keysQuery = this.applyJoinByType(keysQuery, join.type ?? 'left', join.table, join.on)
      }
    }

    for (const joinCube of queryPlan.joinCubes) {
      if (joinCube.junctionTable) {
        keysQuery = this.applyJoinByType(
          keysQuery,
          joinCube.junctionTable.joinType ?? 'left',
          joinCube.junctionTable.table,
          joinCube.junctionTable.joinCondition
        )

        if (joinCube.junctionTable.securitySql) {
          const security = joinCube.junctionTable.securitySql(context.securityContext)
          if (Array.isArray(security)) {
            keysWhereConditions.push(...security)
          } else {
            keysWhereConditions.push(security)
          }
        }
      }

      const joinCubeBase = joinCube.cube.sql(context)
      keysQuery = this.applyJoinByType(
        keysQuery,
        joinCube.joinType ?? 'left',
        joinCubeBase.from,
        joinCube.joinCondition
      )
      if (joinCubeBase.where) {
        keysWhereConditions.push(joinCubeBase.where)
      }
    }

    keysWhereConditions.push(
      ...deps.queryBuilder.buildWhereConditions(allCubes, query, context)
    )

    if (keysWhereConditions.length > 0) {
      keysQuery = keysQuery.where(
        keysWhereConditions.length === 1
          ? keysWhereConditions[0]
          : and(...keysWhereConditions)
      )
    }

    if (keyGroupBy.length > 0) {
      keysQuery = keysQuery.groupBy(...keyGroupBy)
    }

    const keysCte = context.db.$with(keysAlias).as(keysQuery)

    const multipliedBase = multipliedCube.sql(context)
    const aggSelections: Record<string, any> = {}
    const aggGroupBy: SQL[] = []
    for (const pkDimension of pkDimensions) {
      const dimension = multipliedCube.dimensions?.[pkDimension]
      if (!dimension) {
        return null
      }
      const expr = resolveSqlExpression(dimension.sql, context) as SQL
      aggSelections[pkDimension] = sql`${expr}`.as(pkDimension)
      aggGroupBy.push(expr)
    }

    // Identify avg measures that need sum/count decomposition (only for multiplied measures)
    const avgMeasureLocals = new Set<string>()
    for (const measureName of multipliedMeasures) {
      const [, localName] = measureName.split('.')
      const measure = multipliedCube.measures?.[localName]
      if (measure?.type === 'avg') {
        avgMeasureLocals.add(localName)
      }
    }

    // Build non-avg multiplied measures normally
    const nonAvgMultiplied = multipliedMeasures.filter(m => {
      const [, localName] = m.split('.')
      return !avgMeasureLocals.has(localName)
    })

    if (nonAvgMultiplied.length > 0) {
      const measureMap = deps.queryBuilder.buildResolvedMeasures(
        nonAvgMultiplied,
        new Map([[multipliedCube.name, multipliedCube]]),
        context
      )

      for (const measureName of nonAvgMultiplied) {
        const [, localName] = measureName.split('.')
        const measureSqlBuilder = measureMap.get(measureName)
        if (!measureSqlBuilder) {
          return null
        }
        aggSelections[localName] = sql`${measureSqlBuilder()}`.as(localName)
      }
    }

    // Decompose avg measures into sum + count for correct re-aggregation
    for (const measureName of multipliedMeasures) {
      const [, localName] = measureName.split('.')
      if (!avgMeasureLocals.has(localName)) continue

      const measure = multipliedCube.measures?.[localName]
      if (!measure?.sql) return null

      const baseExpr = resolveSqlExpression(measure.sql, context)
      const sumAlias = `__avg_sum__${localName}`
      const countAlias = `__avg_count__${localName}`
      aggSelections[sumAlias] = sql`sum(${baseExpr})`.as(sumAlias)
      aggSelections[countAlias] = sql`count(${baseExpr})`.as(countAlias)
    }

    let aggQuery = context.db
      .select(aggSelections)
      .from(multipliedBase.from)

    const aggWhereConditions: SQL[] = []
    if (multipliedBase.where) {
      aggWhereConditions.push(multipliedBase.where)
    }
    aggWhereConditions.push(
      ...deps.queryBuilder.buildWhereConditions(multipliedCube, query, context)
    )

    if (aggWhereConditions.length > 0) {
      aggQuery = aggQuery.where(
        aggWhereConditions.length === 1
          ? aggWhereConditions[0]
          : and(...aggWhereConditions)
      )
    }

    if (aggGroupBy.length > 0) {
      aggQuery = aggQuery.groupBy(...aggGroupBy)
    }

    const aggCte = context.db.$with(aggAlias).as(aggQuery)

    const outerSelections: Record<string, any> = {}
    for (const dimensionName of query.dimensions ?? []) {
      outerSelections[dimensionName] = sql`${sql.identifier(keysAlias)}.${sql.identifier(dimensionName)}`
        .as(dimensionName)
    }
    for (const timeDimension of query.timeDimensions ?? []) {
      outerSelections[timeDimension.dimension] = sql`${sql.identifier(keysAlias)}.${sql.identifier(timeDimension.dimension)}`
        .as(timeDimension.dimension)
    }
    // Multiplied measures: re-aggregate from agg CTE with type-specific logic
    for (const measureName of multipliedMeasures) {
      const [, localName] = measureName.split('.')
      const measure = multipliedCube.measures?.[localName]
      outerSelections[measureName] = this.buildKeysOuterAggregation(
        measure?.type ?? 'sum', aggAlias, localName, measureName
      )
    }

    // Regular measures: re-aggregate from keys CTE with type-specific logic
    for (const measureName of regularMeasureNames) {
      const [cubeName, localName] = measureName.split('.')
      const regularCube = allCubes.get(cubeName)
      const measure = regularCube?.measures?.[localName]
      const regAlias = `__reg__${measureName.replace('.', '__')}`
      outerSelections[measureName] = this.buildKeysOuterAggregation(
        measure?.type ?? 'sum', keysAlias, regAlias, measureName
      )
    }

    let finalQuery = context.db
      .with(keysCte, aggCte)
      .select(outerSelections)
      .from(sql`${sql.identifier(keysAlias)}`)

    const joinConditions: SQL[] = pkAliases.map((pkAlias, index) =>
      eq(
        sql`${sql.identifier(keysAlias)}.${sql.identifier(pkAlias)}` as any,
        sql`${sql.identifier(aggAlias)}.${sql.identifier(pkDimensions[index])}` as any
      )
    )
    const combinedJoin = joinConditions.length === 1
      ? joinConditions[0]
      : and(...joinConditions)

    finalQuery = finalQuery.leftJoin(sql`${sql.identifier(aggAlias)}`, combinedJoin!)

    const outerGroupBy = [
      ...(query.dimensions ?? []).map(dimension => sql`${sql.identifier(keysAlias)}.${sql.identifier(dimension)}` as SQL),
      ...(query.timeDimensions ?? []).map(timeDimension =>
        sql`${sql.identifier(keysAlias)}.${sql.identifier(timeDimension.dimension)}` as SQL
      )
    ]
    if (outerGroupBy.length > 0) {
      finalQuery = finalQuery.groupBy(...outerGroupBy)
    }

    const orderBy = deps.queryBuilder.buildOrderBy(query, Object.keys(outerSelections))
    if (orderBy.length > 0) {
      finalQuery = finalQuery.orderBy(...orderBy)
    }

    finalQuery = deps.queryBuilder.applyLimitAndOffset(finalQuery, query)
    return finalQuery
  }

  private tryBuildMultiFactMergeQuery(
    queryPlan: PhysicalQueryPlan,
    query: SemanticQuery,
    context: QueryContext,
    deps: PhysicalBuildDependencies
  ): any | null {
    const multiFact = queryPlan.multiFactMerge
    if (!multiFact || multiFact.groups.length < 2) {
      return null
    }

    const sharedKeys = [
      ...(query.dimensions ?? []),
      ...(query.timeDimensions ?? []).map(timeDimension => timeDimension.dimension)
    ]
    const dedupedSharedKeys = Array.from(new Set(sharedKeys))
    const needsFullJoinFallback =
      dedupedSharedKeys.length > 0
      && multiFact.mergeStrategy === 'fullJoin'
      && !this.supportsFullOuterJoin()

    const mergeStrategy = this.selectRuntimeMergeStrategy(
      multiFact.mergeStrategy,
      dedupedSharedKeys.length > 0
    )

    const groupCTEs = multiFact.groups.map(group => {
      const groupQuery = this.build(group.queryPlan, group.query, context)
      return context.db.$with(group.alias).as(groupQuery)
    })

    if (needsFullJoinFallback) {
      return this.buildMultiFactUnionKeysFallbackQuery(
        query,
        context,
        deps,
        multiFact,
        groupCTEs,
        dedupedSharedKeys
      )
    }

    const baseAlias = multiFact.groups[0].alias
    const sourceAliases = multiFact.groups.map(group => group.alias)

    const selectMap: Record<string, any> = {}
    if (dedupedSharedKeys.length > 0) {
      for (const key of dedupedSharedKeys) {
        const keyExpr = this.coalesceQualifiedColumn(sourceAliases, key)
        selectMap[key] = sql`${keyExpr}`.as(key)
      }
    }

    for (const group of multiFact.groups) {
      for (const measureName of group.measures) {
        const measureExpr = sql`${sql.identifier(group.alias)}.${sql.identifier(measureName)}`
        selectMap[measureName] = sql`coalesce(${measureExpr}, 0)`.as(measureName)
      }
    }

    let finalQuery = context.db
      .with(...groupCTEs)
      .select(selectMap)
      .from(sql`${sql.identifier(baseAlias)}`)

    let currentKeyExpressions = new Map<string, SQL>()
    for (const key of dedupedSharedKeys) {
      currentKeyExpressions.set(
        key,
        sql`${sql.identifier(baseAlias)}.${sql.identifier(key)}`
      )
    }

    for (let i = 1; i < multiFact.groups.length; i++) {
      const groupAlias = multiFact.groups[i].alias

      let joinCondition: SQL
      if (dedupedSharedKeys.length === 0) {
        joinCondition = sql`1 = 1`
      } else {
        const conditions: SQL[] = dedupedSharedKeys.map(key =>
          eq(
            currentKeyExpressions.get(key) as any,
            sql`${sql.identifier(groupAlias)}.${sql.identifier(key)}` as any
          )
        )
        joinCondition = conditions.length === 1 ? conditions[0] : and(...conditions)!
      }

      finalQuery = this.applyJoinByType(
        finalQuery,
        mergeStrategy,
        sql`${sql.identifier(groupAlias)}`,
        joinCondition
      )

      if (dedupedSharedKeys.length > 0 && mergeStrategy === 'full') {
        for (const key of dedupedSharedKeys) {
          currentKeyExpressions.set(
            key,
            sql`coalesce(${currentKeyExpressions.get(key)}, ${sql`${sql.identifier(groupAlias)}.${sql.identifier(key)}`})`
          )
        }
      }
    }

    const orderBy = deps.queryBuilder.buildOrderBy(query, Object.keys(selectMap))
    if (orderBy.length > 0) {
      finalQuery = finalQuery.orderBy(...orderBy)
    }

    return deps.queryBuilder.applyLimitAndOffset(finalQuery, query)
  }

  private buildMultiFactUnionKeysFallbackQuery(
    query: SemanticQuery,
    context: QueryContext,
    deps: PhysicalBuildDependencies,
    multiFact: NonNullable<PhysicalQueryPlan['multiFactMerge']>,
    groupCTEs: any[],
    sharedKeys: string[]
  ): any {
    const allKeysAlias = 'mf_all_keys'
    const unionKeyQueries = multiFact.groups.map(group =>
      sql`select ${this.buildSharedKeySelection(group.alias, sharedKeys)} from ${sql.identifier(group.alias)}`
    )
    const unionedKeysSql = sql`${sql.join(unionKeyQueries, sql` union `)}`
    const allKeysCte = context.db.$with(allKeysAlias).as(unionedKeysSql)

    const selectMap: Record<string, any> = {}
    for (const key of sharedKeys) {
      selectMap[key] = sql`${sql.identifier(allKeysAlias)}.${sql.identifier(key)}`.as(key)
    }
    for (const group of multiFact.groups) {
      for (const measureName of group.measures) {
        const measureExpr = sql`${sql.identifier(group.alias)}.${sql.identifier(measureName)}`
        selectMap[measureName] = sql`coalesce(${measureExpr}, 0)`.as(measureName)
      }
    }

    let finalQuery = context.db
      .with(...groupCTEs, allKeysCte)
      .select(selectMap)
      .from(sql`${sql.identifier(allKeysAlias)}`)

    for (const group of multiFact.groups) {
      const joinConditions: SQL[] = sharedKeys.map(key =>
        eq(
          sql`${sql.identifier(allKeysAlias)}.${sql.identifier(key)}` as any,
          sql`${sql.identifier(group.alias)}.${sql.identifier(key)}` as any
        )
      )
      const joinCondition = joinConditions.length === 1
        ? joinConditions[0]
        : and(...joinConditions)

      finalQuery = finalQuery.leftJoin(
        sql`${sql.identifier(group.alias)}`,
        joinCondition!
      )
    }

    const orderBy = deps.queryBuilder.buildOrderBy(query, Object.keys(selectMap))
    if (orderBy.length > 0) {
      finalQuery = finalQuery.orderBy(...orderBy)
    }

    return deps.queryBuilder.applyLimitAndOffset(finalQuery, query)
  }

  private buildSharedKeySelection(groupAlias: string, sharedKeys: string[]): SQL {
    const selections = sharedKeys.map(key =>
      sql`${sql.identifier(groupAlias)}.${sql.identifier(key)} as ${sql.identifier(key)}`
    )
    return sql.join(selections, sql`, `)
  }

  private selectRuntimeMergeStrategy(
    requestedStrategy: 'fullJoin' | 'leftJoin' | 'innerJoin',
    hasSharedKeys: boolean
  ): 'inner' | 'left' | 'full' {
    if (!hasSharedKeys) {
      return 'inner'
    }

    if (requestedStrategy === 'innerJoin') {
      return 'inner'
    }

    if (requestedStrategy === 'leftJoin') {
      return 'left'
    }

    if (this.supportsFullOuterJoin()) {
      return 'full'
    }

    return 'left'
  }

  private supportsFullOuterJoin(): boolean {
    const engine = this.databaseAdapter.getEngineType()
    return engine === 'postgres' || engine === 'duckdb'
  }

  private coalesceQualifiedColumn(aliases: string[], columnName: string): SQL {
    if (aliases.length === 1) {
      return sql`${sql.identifier(aliases[0])}.${sql.identifier(columnName)}`
    }

    const expressions = aliases.map(alias => sql`${sql.identifier(alias)}.${sql.identifier(columnName)}`)
    let expr = expressions[0]
    for (let i = 1; i < expressions.length; i++) {
      expr = sql`coalesce(${expr}, ${expressions[i]})`
    }
    return expr
  }

  private canExecuteKeysDeduplication(
    query: SemanticQuery,
    multipliedCube: Cube,
    multipliedCubeName: string
  ): boolean {
    if (!query.measures?.length) {
      return false
    }

    // Validate multiplied cube measures are supported types
    for (const measureName of query.measures) {
      const [cubeName, localName] = measureName.split('.')
      if (cubeName !== multipliedCubeName) {
        // Regular measures are validated by the logical planner
        continue
      }
      const measure = multipliedCube.measures?.[localName]
      if (!measure) {
        return false
      }
      if (!['sum', 'count', 'number', 'min', 'max', 'avg'].includes(measure.type)) {
        return false
      }
    }

    return !this.queryContainsMeasureFilter(query, multipliedCube, multipliedCubeName)
  }

  private queryContainsMeasureFilter(
    query: SemanticQuery,
    cube: Cube,
    cubeName: string
  ): boolean {
    const visit = (filters?: SemanticQuery['filters']): boolean => {
      if (!filters) return false
      for (const filter of filters) {
        if ('and' in filter) {
          if (visit(filter.and)) return true
          continue
        }
        if ('or' in filter) {
          if (visit(filter.or)) return true
          continue
        }
        if ('member' in filter) {
          const [memberCube, localName] = filter.member.split('.')
          if (memberCube === cubeName && cube.measures?.[localName]) {
            return true
          }
        }
      }
      return false
    }

    return visit(query.filters)
  }

  private getPrimaryKeyDimensions(cube: Cube): string[] {
    return Object.entries(cube.dimensions ?? {})
      .filter(([, dimension]) => Boolean(dimension.primaryKey))
      .map(([name]) => name)
  }

  /**
   * Build type-specific outer aggregation for keys deduplication.
   * Each measure type needs different re-aggregation in the outer query:
   * - sum/count/number: SUM (re-combine additive values)
   * - min: MIN (preserve minimum across groups)
   * - max: MAX (preserve maximum across groups)
   * - avg: SUM(sums) / NULLIF(SUM(counts), 0) (weighted average from decomposed parts)
   */
  private buildKeysOuterAggregation(
    measureType: string,
    aggAlias: string,
    localName: string,
    measureName: string
  ): any {
    switch (measureType) {
      case 'min': {
        const col = sql`${sql.identifier(aggAlias)}.${sql.identifier(localName)}`
        return sql`min(${col})`.as(measureName)
      }
      case 'max': {
        const col = sql`${sql.identifier(aggAlias)}.${sql.identifier(localName)}`
        return sql`max(${col})`.as(measureName)
      }
      case 'avg': {
        const sumCol = sql`${sql.identifier(aggAlias)}.${sql.identifier(`__avg_sum__${localName}`)}`
        const countCol = sql`${sql.identifier(aggAlias)}.${sql.identifier(`__avg_count__${localName}`)}`
        return sql`sum(${sumCol}) / nullif(sum(${countCol}), 0)`.as(measureName)
      }
      case 'sum':
      case 'count':
      case 'number':
      default: {
        const col = sql`${sql.identifier(aggAlias)}.${sql.identifier(localName)}`
        return sql`coalesce(sum(${col}), 0)`.as(measureName)
      }
    }
  }

  private applyJoinByType(
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
}

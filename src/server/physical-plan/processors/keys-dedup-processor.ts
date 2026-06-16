import {
  and,
  eq,
  sql,
  SQL
} from 'drizzle-orm'

import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types/index.js'
import { resolveSqlExpression } from '../../cube-utils.js'
import { applyJoinByType, getCubesFromPlan } from './shared.js'
import type { PhysicalBuildDependencies } from './shared.js'

/** Selections + GROUP BY collected for the keys CTE. */
interface KeysCteSelectionState {
  keysSelections: Record<string, any>
  keyGroupBy: SQL[]
  pkAliases: string[]
  multipliedMeasures: string[]
}

/**
 * Build the dual-CTE keys-deduplication query, or return null when the plan
 * does not qualify (caller falls back to the standard build).
 *
 * The query splits into:
 *  - a "keys" CTE that groups by the query grain + multiplied cube primary key
 *    (pre-aggregating regular measures), and
 *  - a "pk_agg" CTE that pre-aggregates the multiplied cube's measures per PK,
 * then re-aggregates both in an outer query joined on the primary key.
 */
export function buildKeysDeduplicationQuery(
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

  if (!canExecuteKeysDeduplication(query, multipliedCube, dedup.multipliedCubeName)) {
    return null
  }

  const pkDimensions = dedup.primaryKeyDimensions.length > 0
    ? dedup.primaryKeyDimensions
    : getPrimaryKeyDimensions(multipliedCube)
  if (pkDimensions.length === 0) {
    return null
  }

  const keysAlias = `${dedup.multipliedCubeName.toLowerCase()}_keys`
  const aggAlias = `${dedup.multipliedCubeName.toLowerCase()}_pk_agg`
  const regularMeasureNames = dedup.regularMeasures ?? []

  const selectionState = buildKeysCteSelections(
    query,
    context,
    deps,
    allCubes,
    multipliedCube,
    pkDimensions,
    regularMeasureNames
  )
  if (!selectionState) {
    return null
  }

  const keysCte = buildKeysCte(
    queryPlan,
    query,
    context,
    deps,
    allCubes,
    keysAlias,
    selectionState.keysSelections,
    selectionState.keyGroupBy
  )

  const aggCte = buildAggCte(
    query,
    context,
    deps,
    multipliedCube,
    pkDimensions,
    selectionState.multipliedMeasures,
    aggAlias
  )
  if (!aggCte) {
    return null
  }

  return buildKeysOuterQuery(
    query,
    context,
    deps,
    allCubes,
    multipliedCube,
    {
      keysAlias,
      aggAlias,
      keysCte,
      aggCte,
      pkDimensions,
      pkAliases: selectionState.pkAliases,
      multipliedMeasures: selectionState.multipliedMeasures,
      regularMeasureNames
    }
  )
}

/**
 * Collect keys-CTE selections + GROUP BY for query dimensions, time dimensions,
 * multiplied-cube primary keys, and pre-aggregated regular measures.
 */
function buildKeysCteSelections(
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  allCubes: Map<string, Cube>,
  multipliedCube: Cube,
  pkDimensions: string[],
  regularMeasureNames: string[]
): KeysCteSelectionState | null {
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
  const regularMeasureSet = new Set(regularMeasureNames)
  const multipliedMeasures = query.measures!.filter(m => !regularMeasureSet.has(m))

  // Pre-aggregate regular measures in the keys CTE
  if (regularMeasureNames.length > 0) {
    const regularMeasureMap = deps.queryBuilder.buildResolvedMeasures(
      regularMeasureNames,
      allCubes,
      context
    )

    for (const measureName of regularMeasureNames) {
      const measureSqlBuilder = regularMeasureMap.get(measureName)
      if (!measureSqlBuilder) {
        return null
      }
      const regAlias = `__reg__${measureName.replace('.', '__')}`

      keysSelections[regAlias] = sql`${measureSqlBuilder()}`.as(regAlias)
    }
  }

  return { keysSelections, keyGroupBy, pkAliases, multipliedMeasures }
}

/**
 * Build the keys CTE: select grain + PK + pre-aggregated regular measures from
 * the primary cube plus all joined cubes (junction tables included), applying
 * each cube's security WHERE and the query's WHERE conditions.
 */
function buildKeysCte(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  allCubes: Map<string, Cube>,
  keysAlias: string,
  keysSelections: Record<string, any>,
  keyGroupBy: SQL[]
): any {
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
      keysQuery = applyJoinByType(keysQuery, join.type ?? 'left', join.table, join.on)
    }
  }

  for (const joinCube of queryPlan.joinCubes) {
    keysQuery = applyKeysJoinCube(keysQuery, joinCube, context, keysWhereConditions)
  }

  keysWhereConditions.push(
    ...deps.queryBuilder.buildWhereConditions(allCubes, query, context)
  )

  keysQuery = applyWhere(keysQuery, keysWhereConditions)

  if (keyGroupBy.length > 0) {
    keysQuery = keysQuery.groupBy(...keyGroupBy)
  }

  return context.db.$with(keysAlias).as(keysQuery)
}

/**
 * Apply a single joined cube (and its junction table + intra-cube joins) to the
 * keys query, collecting the cube's security WHERE conditions.
 */
function applyKeysJoinCube(
  keysQuery: any,
  joinCube: PhysicalQueryPlan['joinCubes'][number],
  context: QueryContext,
  keysWhereConditions: SQL[]
): any {
  let query = keysQuery
  if (joinCube.junctionTable) {
    query = applyJoinByType(
      query,
      joinCube.junctionTable.joinType ?? 'left',
      joinCube.junctionTable.table,
      joinCube.junctionTable.joinCondition
    )
    collectJunctionSecurity(joinCube.junctionTable.securitySql, context, keysWhereConditions)
  }

  const joinCubeBase = joinCube.cube.sql(context)
  query = applyJoinByType(
    query,
    joinCube.joinType ?? 'left',
    joinCubeBase.from,
    joinCube.joinCondition
  )
  // Apply the joined cube's intra-cube table-level joins
  // (BaseQueryDefinition.joins) so columns from joined tables are in
  // scope for both the keys CTE selection and the WHERE clause.
  if (joinCubeBase.joins) {
    for (const join of joinCubeBase.joins) {
      query = applyJoinByType(query, join.type ?? 'left', join.table, join.on)
    }
  }
  if (joinCubeBase.where) {
    keysWhereConditions.push(joinCubeBase.where)
  }
  return query
}

/** Push a junction table's security SQL (single or array) into the WHERE list. */
function collectJunctionSecurity(
  securitySql: ((securityContext: any) => SQL | SQL[]) | undefined,
  context: QueryContext,
  target: SQL[]
): void {
  if (!securitySql) {
    return
  }
  const security = securitySql(context.securityContext)
  if (Array.isArray(security)) {
    target.push(...security)
  } else {
    target.push(security)
  }
}

/**
 * Build the pk_agg CTE: pre-aggregate the multiplied cube's measures per
 * primary key, decomposing avg measures into sum + count for correct
 * re-aggregation in the outer query. Returns null when a measure is unresolved.
 */
function buildAggCte(
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  multipliedCube: Cube,
  pkDimensions: string[],
  multipliedMeasures: string[],
  aggAlias: string
): any | null {
  const multipliedBase = multipliedCube.sql(context)

  const aggState = buildAggSelections(
    context,
    deps,
    multipliedCube,
    pkDimensions,
    multipliedMeasures
  )
  if (!aggState) {
    return null
  }

  let aggQuery = context.db
    .select(aggState.aggSelections)
    .from(multipliedBase.from)

  // Apply the multiplied cube's intra-cube table-level joins
  // (BaseQueryDefinition.joins) so columns from joined tables are in
  // scope for the agg CTE's measure expressions and WHERE clause.
  if (multipliedBase.joins) {
    for (const join of multipliedBase.joins) {
      aggQuery = applyJoinByType(aggQuery, join.type ?? 'left', join.table, join.on)
    }
  }

  const aggWhereConditions: SQL[] = []
  if (multipliedBase.where) {
    aggWhereConditions.push(multipliedBase.where)
  }
  aggWhereConditions.push(
    ...deps.queryBuilder.buildWhereConditions(multipliedCube, query, context)
  )

  aggQuery = applyWhere(aggQuery, aggWhereConditions)

  if (aggState.aggGroupBy.length > 0) {
    aggQuery = aggQuery.groupBy(...aggState.aggGroupBy)
  }

  return context.db.$with(aggAlias).as(aggQuery)
}

/**
 * Build the pk_agg CTE selections + GROUP BY: primary-key columns, non-avg
 * measure aggregations, and sum/count decompositions for avg measures.
 * Returns null when a PK dimension or measure cannot be resolved.
 */
function buildAggSelections(
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  multipliedCube: Cube,
  pkDimensions: string[],
  multipliedMeasures: string[]
): { aggSelections: Record<string, any>; aggGroupBy: SQL[] } | null {
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
    if (multipliedCube.measures?.[localName]?.type === 'avg') {
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
      if (!measureSqlBuilder || typeof measureSqlBuilder !== 'function') {
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

  return { aggSelections, aggGroupBy }
}

/** Apply a combined WHERE (AND of all conditions) to a query, if any. */
function applyWhere(query: any, conditions: SQL[]): any {
  if (conditions.length === 0) {
    return query
  }
  return query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
}

interface KeysOuterParams {
  keysAlias: string
  aggAlias: string
  keysCte: any
  aggCte: any
  pkDimensions: string[]
  pkAliases: string[]
  multipliedMeasures: string[]
  regularMeasureNames: string[]
}

/**
 * Assemble the outer query: select grain from the keys CTE, re-aggregate both
 * multiplied (agg CTE) and regular (keys CTE) measures per measure type, join
 * the two CTEs on the primary key, then apply GROUP BY / ORDER BY / LIMIT.
 */
function buildKeysOuterQuery(
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  allCubes: Map<string, Cube>,
  multipliedCube: Cube,
  params: KeysOuterParams
): any {
  const { keysAlias, aggAlias, keysCte, aggCte, pkDimensions, pkAliases, multipliedMeasures, regularMeasureNames } = params

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
    outerSelections[measureName] = buildKeysOuterAggregation(
      measure?.type ?? 'sum', aggAlias, localName, measureName
    )
  }

  // Regular measures: re-aggregate from keys CTE with type-specific logic
  for (const measureName of regularMeasureNames) {
    const [cubeName, localName] = measureName.split('.')
    const regularCube = allCubes.get(cubeName)
    const measure = regularCube?.measures?.[localName]
    const regAlias = `__reg__${measureName.replace('.', '__')}`
    outerSelections[measureName] = buildKeysOuterAggregation(
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

  return deps.queryBuilder.applyLimitAndOffset(finalQuery, query)
}

function canExecuteKeysDeduplication(
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

  return !queryContainsMeasureFilter(query, multipliedCube, multipliedCubeName)
}

function queryContainsMeasureFilter(
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

function getPrimaryKeyDimensions(cube: Cube): string[] {
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
function buildKeysOuterAggregation(
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

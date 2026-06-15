import {
  and,
  eq,
  sql,
  SQL
} from 'drizzle-orm'

import type {
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types'
import { applyJoinByType } from './shared'
import type { PhysicalBuildDependencies } from './shared'

type MultiFact = NonNullable<PhysicalQueryPlan['multiFactMerge']>

/**
 * Build a function for `build()` so each group CTE can be materialized through
 * the standard physical-plan builder without a class dependency.
 */
export type GroupQueryBuilder = (
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext
) => any

/**
 * Build a multi-fact-merge query (joining independent measure groups on shared
 * grain keys), or return null when the plan does not qualify. Falls back to a
 * UNION-of-keys strategy when a FULL OUTER JOIN is requested but unsupported.
 */
export function buildMultiFactMergeQuery(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  buildGroup: GroupQueryBuilder
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
  const hasSharedKeys = dedupedSharedKeys.length > 0
  const supportsFullOuter = supportsFullOuterJoin(deps)
  const needsFullJoinFallback =
    hasSharedKeys
    && multiFact.mergeStrategy === 'fullJoin'
    && !supportsFullOuter

  const groupCTEs = multiFact.groups.map(group => {
    const groupQuery = buildGroup(group.queryPlan, group.query, context)
    return context.db.$with(group.alias).as(groupQuery)
  })

  if (needsFullJoinFallback) {
    return buildMultiFactUnionKeysFallbackQuery(
      query,
      context,
      deps,
      multiFact,
      groupCTEs,
      dedupedSharedKeys
    )
  }

  const mergeStrategy = selectRuntimeMergeStrategy(
    multiFact.mergeStrategy,
    hasSharedKeys,
    supportsFullOuter
  )

  return buildMultiFactJoinedQuery(
    query,
    context,
    deps,
    multiFact,
    groupCTEs,
    dedupedSharedKeys,
    mergeStrategy
  )
}

/** Build the shared-key + measure SELECT map for the merged query. */
function buildMergeSelectMap(
  multiFact: MultiFact,
  dedupedSharedKeys: string[],
  sourceAliases: string[]
): Record<string, any> {
  const selectMap: Record<string, any> = {}
  for (const key of dedupedSharedKeys) {
    const keyExpr = coalesceQualifiedColumn(sourceAliases, key)
    selectMap[key] = sql`${keyExpr}`.as(key)
  }

  for (const group of multiFact.groups) {
    for (const measureName of group.measures) {
      const measureExpr = sql`${sql.identifier(group.alias)}.${sql.identifier(measureName)}`
      selectMap[measureName] = sql`coalesce(${measureExpr}, 0)`.as(measureName)
    }
  }
  return selectMap
}

/** Build the join condition between the running merge and the next group. */
function buildGroupJoinCondition(
  groupAlias: string,
  dedupedSharedKeys: string[],
  currentKeyExpressions: Map<string, SQL>
): SQL {
  if (dedupedSharedKeys.length === 0) {
    return sql`1 = 1`
  }
  const conditions: SQL[] = dedupedSharedKeys.map(key =>
    eq(
      currentKeyExpressions.get(key) as any,
      sql`${sql.identifier(groupAlias)}.${sql.identifier(key)}` as any
    )
  )
  return conditions.length === 1 ? conditions[0] : and(...conditions)!
}

/** Assemble the chained-join merge query across all measure groups. */
function buildMultiFactJoinedQuery(
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  multiFact: MultiFact,
  groupCTEs: any[],
  dedupedSharedKeys: string[],
  mergeStrategy: 'inner' | 'left' | 'full'
): any {
  const baseAlias = multiFact.groups[0].alias
  const sourceAliases = multiFact.groups.map(group => group.alias)

  const selectMap = buildMergeSelectMap(multiFact, dedupedSharedKeys, sourceAliases)

  let finalQuery = context.db
    .with(...groupCTEs)
    .select(selectMap)
    .from(sql`${sql.identifier(baseAlias)}`)

  const currentKeyExpressions = new Map<string, SQL>()
  for (const key of dedupedSharedKeys) {
    currentKeyExpressions.set(
      key,
      sql`${sql.identifier(baseAlias)}.${sql.identifier(key)}`
    )
  }

  for (let i = 1; i < multiFact.groups.length; i++) {
    const groupAlias = multiFact.groups[i].alias
    const joinCondition = buildGroupJoinCondition(groupAlias, dedupedSharedKeys, currentKeyExpressions)

    finalQuery = applyJoinByType(
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

function buildMultiFactUnionKeysFallbackQuery(
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies,
  multiFact: MultiFact,
  groupCTEs: any[],
  sharedKeys: string[]
): any {
  const allKeysAlias = 'mf_all_keys'
  const unionKeyQueries = multiFact.groups.map(group =>
    sql`select ${buildSharedKeySelection(group.alias, sharedKeys)} from ${sql.identifier(group.alias)}`
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

function buildSharedKeySelection(groupAlias: string, sharedKeys: string[]): SQL {
  const selections = sharedKeys.map(key =>
    sql`${sql.identifier(groupAlias)}.${sql.identifier(key)} as ${sql.identifier(key)}`
  )
  return sql.join(selections, sql`, `)
}

function selectRuntimeMergeStrategy(
  requestedStrategy: 'fullJoin' | 'leftJoin' | 'innerJoin',
  hasSharedKeys: boolean,
  supportsFullOuter: boolean
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

  if (supportsFullOuter) {
    return 'full'
  }

  return 'left'
}

function supportsFullOuterJoin(deps: PhysicalBuildDependencies): boolean {
  const engine = deps.databaseAdapter.getEngineType()
  return engine === 'postgres' || engine === 'duckdb'
}

function coalesceQualifiedColumn(aliases: string[], columnName: string): SQL {
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

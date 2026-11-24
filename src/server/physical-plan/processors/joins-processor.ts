import {
  and,
  eq,
  isNull,
  or,
  sql,
  SQL
} from 'drizzle-orm'

import type {
  Cube,
  JoinCubePlanEntry,
  PhysicalQueryPlan,
  QueryContext
} from '../../types/index.js'
import { applyJoinByType } from './shared.js'
import { resolveSqlExpression } from '../../cube-utils.js'
import type {
  CTEBuildState,
  JoinBuildState,
  PhysicalBuildDependencies,
  SelectionMap
} from './shared.js'

/**
 * Applies CTEs and JOIN graph construction to the query builder.
 */
export function applyJoins(
  queryPlan: PhysicalQueryPlan,
  context: QueryContext,
  primaryCubeBase: ReturnType<Cube['sql']>,
  modifiedSelections: SelectionMap,
  cteState: CTEBuildState,
  deps: Pick<PhysicalBuildDependencies, 'cteBuilder'>
): JoinBuildState {
  // Collect all WHERE conditions (declared early for junction table security)
  const allWhereConditions: SQL[] = []

  let drizzleQuery = startQuery(context, primaryCubeBase, modifiedSelections, cteState)

  // Add joins from primary cube base (intra-cube joins)
  drizzleQuery = applyBaseJoins(drizzleQuery, primaryCubeBase.joins)

  // Track which cubes have their security handled in JOIN ON clause
  // This prevents duplicate security conditions in WHERE clause
  const cubesWithSecurityInJoin = new Set<string>()

  // Identify cubes that have been absorbed as intermediates into CTEs.
  // These should be SKIPPED in the main join plan because their join logic is
  // handled inside the CTE (e.g. Departments → Employees → EmployeeTeams).
  const absorbedIntermediateCubes = collectAbsorbedIntermediateCubes(queryPlan)

  // Add multi-cube joins (inter-cube joins)
  if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
    for (const joinCube of queryPlan.joinCubes) {
      // Skip cubes that have been absorbed as intermediates into CTEs
      // UNLESS the cube has its own measures in the query (then it needs its own join)
      const cubeName = joinCube.cube.name
      if (absorbedIntermediateCubes.has(cubeName) && !cteState.cteAliasMap.has(cubeName)) {
        // This cube was absorbed as an intermediate - the CTE handles the relationship
        continue
      }

      drizzleQuery = applyJunctionTable(
        drizzleQuery,
        joinCube,
        queryPlan,
        cteState,
        context,
        allWhereConditions
      )

      drizzleQuery = applyInterCubeJoin(
        drizzleQuery,
        joinCube,
        queryPlan,
        cteState,
        context,
        deps,
        cubesWithSecurityInJoin,
        allWhereConditions
      )
    }
  }

  return {
    drizzleQuery,
    allWhereConditions,
    cubesWithSecurityInJoin,
    absorbedIntermediateCubes
  }
}

/** Start the query from the primary cube, prepending CTEs when present. */
function startQuery(
  context: QueryContext,
  primaryCubeBase: ReturnType<Cube['sql']>,
  modifiedSelections: SelectionMap,
  cteState: CTEBuildState
): any {
  // Add CTEs to the query - Drizzle CTEs are added at the start
  if (cteState.ctes.length > 0) {
    return context.db
      .with(...cteState.ctes)
      .select(modifiedSelections)
      .from(primaryCubeBase.from)
  }
  return context.db
    .select(modifiedSelections)
    .from(primaryCubeBase.from)
}

/** Apply a cube's intra-cube table-level joins (BaseQueryDefinition.joins). */
function applyBaseJoins(
  drizzleQuery: any,
  joins: ReturnType<Cube['sql']>['joins']
): any {
  if (!joins) {
    return drizzleQuery
  }
  let query = drizzleQuery
  for (const join of joins) {
    query = applyJoinByType(query, join.type ?? 'left', join.table, join.on)
  }
  return query
}

/** Collect cubes absorbed as intermediates into pre-aggregation CTEs. */
function collectAbsorbedIntermediateCubes(queryPlan: PhysicalQueryPlan): Set<string> {
  const absorbed = new Set<string>()
  if (queryPlan.preAggregationCTEs) {
    for (const cteInfo of queryPlan.preAggregationCTEs) {
      if (cteInfo.intermediateJoins && cteInfo.intermediateJoins.length > 0) {
        for (const intermediate of cteInfo.intermediateJoins) {
          absorbed.add(intermediate.cube.name)
        }
      }
    }
  }
  return absorbed
}

/**
 * Apply a belongsToMany junction table join (if present), rebuilding its
 * condition to reference a source CTE alias when the source cube is a CTE.
 * Junction security stays in the WHERE clause (many-to-many semantics).
 */
function applyJunctionTable(
  drizzleQuery: any,
  joinCube: JoinCubePlanEntry,
  queryPlan: PhysicalQueryPlan,
  cteState: CTEBuildState,
  context: QueryContext,
  allWhereConditions: SQL[]
): any {
  const junctionTable = joinCube.junctionTable
  if (!junctionTable || joinsThroughDownstreamCTE(joinCube, cteState)) {
    return drizzleQuery
  }

  const junctionJoinCondition = resolveJunctionJoinCondition(
    junctionTable,
    joinCube,
    queryPlan,
    cteState
  )

  // Collect junction WHERE conditions including security context
  const junctionWhereConditions: SQL[] = []
  if (junctionTable.securitySql) {
    const junctionSecurity = junctionTable.securitySql(context.securityContext)
    if (Array.isArray(junctionSecurity)) {
      junctionWhereConditions.push(...junctionSecurity)
    } else {
      junctionWhereConditions.push(junctionSecurity)
    }
  }

  // Add junction table join (source -> junction).
  // NOTE: For junction tables (belongsToMany), security filters STAY in WHERE
  // because many-to-many semantics require filtering out non-matching records
  // rather than returning them as NULLs. The security-in-JOIN-ON logic only
  // applies to regular LEFT JOINs (hasMany/hasOne).
  try {
    const query = applyJoinByType(
      drizzleQuery,
      junctionTable.joinType ?? 'left',
      junctionTable.table,
      junctionJoinCondition
    )

    // Junction table security goes in WHERE clause to properly filter records
    if (junctionWhereConditions.length > 0) {
      allWhereConditions.push(...junctionWhereConditions)
    }
    return query
  } catch {
    // Junction table join failed, continuing
    return drizzleQuery
  }
}

/**
 * Build the source -> junction join condition, rebuilt against the source CTE
 * alias when the belongsToMany source cube is materialized as a CTE.
 */
function resolveJunctionJoinCondition(
  junctionTable: NonNullable<JoinCubePlanEntry['junctionTable']>,
  joinCube: JoinCubePlanEntry,
  queryPlan: PhysicalQueryPlan,
  cteState: CTEBuildState
): SQL {
  let junctionJoinCondition = junctionTable.joinCondition
  const sourceCteAlias = junctionTable.sourceCubeName
    ? cteState.cteAliasMap.get(junctionTable.sourceCubeName)
    : undefined
  if (!sourceCteAlias) {
    return junctionJoinCondition
  }

  // Find the CTE's downstream join keys for this target cube
  const cteInfo = queryPlan.preAggregationCTEs?.find(
    (cte: { cube: Cube }) => cte.cube.name === junctionTable.sourceCubeName
  )
  const downstreamInfo = cteInfo?.downstreamJoinKeys?.find(
    (d: { targetCubeName: string }) => d.targetCubeName === joinCube.cube.name
  )
  if (downstreamInfo && downstreamInfo.joinKeys.length > 0) {
    const conditions: SQL[] = []
    for (const joinKey of downstreamInfo.joinKeys) {
      // sourceColumn = CTE cube's column name (e.g., "employeeId")
      // targetColumnObj = junction table's column object
      const cteCol = sql`${sql.identifier(sourceCteAlias)}.${sql.identifier(joinKey.sourceColumn)}`
      const junctionCol = joinKey.targetColumnObj
      if (junctionCol) {
        conditions.push(eq(junctionCol as any, cteCol))
      }
    }
    if (conditions.length > 0) {
      junctionJoinCondition = and(...conditions)!
    }
  }
  return junctionJoinCondition
}

/**
 * True when a belongsToMany target must join through a pre-aggregation CTE
 * instead of through its junction table.
 *
 * The join plan can reach a cube through a junction that starts at a non-CTE
 * cube (usually the primary), while the CTE planner also puts that cube's join
 * key in a CTE, through a direct join of the CTE cube (downstream join keys).
 * The junction joins on the source cube's key only, so every CTE row repeats
 * once per junction row, and a filter or dimension on the target does not apply
 * to the CTE rows. The CTE rows already carry the target's key, so the target
 * joins on that key and the junction is dropped.
 *
 * Example: Departments (primary) hasMany TimeEntries (CTE) belongsTo Employees,
 * and Departments belongsToMany Employees through time_entries. An Employees
 * filter must apply to the TimeEntries CTE rows, not to a second copy of
 * time_entries.
 */
function joinsThroughDownstreamCTE(
  joinCube: JoinCubePlanEntry,
  cteState: CTEBuildState
): boolean {
  const junctionTable = joinCube.junctionTable
  if (!junctionTable) {
    return false
  }
  // A junction that starts at a CTE cube is rewritten by resolveJunctionJoinCondition.
  if (junctionTable.sourceCubeName && cteState.cteAliasMap.has(junctionTable.sourceCubeName)) {
    return false
  }
  const downstreamInfo = cteState.downstreamCubeMap.get(joinCube.cube.name)
  return !!downstreamInfo && !downstreamInfo.throughJunction && downstreamInfo.joinKeys.length > 0
}

interface CubeJoinTarget {
  joinTarget: any
  joinCondition: any
  securityCondition: SQL | undefined
  joinCubeBase: ReturnType<Cube['sql']> | undefined
}

/**
 * Resolve the inter-cube join target/condition. When the cube is a CTE, the
 * CTE already has security applied; otherwise the cube's base table is joined,
 * possibly through a downstream CTE join key, carrying its security WHERE for
 * inclusion in the JOIN ON clause of LEFT/RIGHT/FULL joins.
 */
function resolveCubeJoinTarget(
  joinCube: JoinCubePlanEntry,
  cteAlias: string | undefined,
  cteState: CTEBuildState,
  queryPlan: PhysicalQueryPlan,
  context: QueryContext,
  deps: Pick<PhysicalBuildDependencies, 'cteBuilder'>
): CubeJoinTarget {
  if (cteAlias) {
    // Join to CTE instead of base table - use sql table reference
    return {
      joinTarget: sql`${sql.identifier(cteAlias)}`,
      joinCondition: deps.cteBuilder.buildCTEJoinCondition(joinCube, cteAlias, queryPlan),
      // CTE already has security applied inside it, don't apply again
      securityCondition: undefined,
      // CTE branch leaves joinCubeBase undefined because the CTE definition
      // already contains the cube's intra-cube joins (see cte-builder.ts).
      joinCubeBase: undefined
    }
  }

  // Check if this cube should join through a CTE (downstream cube)
  // Example: Teams joins through EmployeeTeams CTE when EmployeeTeams has measures
  const downstreamInfo = cteState.downstreamCubeMap.get(joinCube.cube.name)

  // Regular join to base table. Get the cube's SQL definition ONCE to avoid
  // SQL object mutation issues.
  const joinCubeBase = joinCube.cube.sql(context)

  let joinCondition: any
  if (downstreamInfo && (!joinCube.junctionTable || joinsThroughDownstreamCTE(joinCube, cteState))) {
    // This cube joins THROUGH a CTE - build join condition referencing CTE alias
    // (e.g., Teams.id = employeeteams_agg.team_id). Skipped when the junction
    // table (belongsToMany) starts at the CTE cube: the junction handles
    // CTE-to-junction separately and the target cube uses its original
    // joinCondition.
    const conditions: SQL[] = []
    for (const joinKey of downstreamInfo.joinKeys) {
      const cteCol = sql`${sql.identifier(downstreamInfo.cteAlias)}.${sql.identifier(joinKey.sourceColumn)}`
      const targetCol = joinKey.targetColumnObj || sql.identifier(joinKey.targetColumn)
      conditions.push(eq(cteCol as any, targetCol as any))
    }
    joinCondition = conditions.length === 1 ? conditions[0] : and(...conditions)
  } else {
    // Standard join using original join condition
    joinCondition = joinCube.joinCondition
  }

  return {
    joinTarget: joinCubeBase.from,
    joinCondition,
    // Security condition for this cube (for LEFT JOINs, added to ON clause)
    securityCondition: joinCubeBase.where,
    joinCubeBase
  }
}

/**
 * Apply a single inter-cube join. Intra-cube joins of the joined cube are
 * applied afterwards so its base table is in scope.
 *
 * Security placement:
 * - INNER: the joined cube's filter stays in WHERE (added by the predicates
 *   processor).
 * - LEFT: the filter goes in the JOIN ON clause. The joined cube is the
 *   NULL-extended side, so its rows failing ON disappear while the primary's
 *   unmatched rows are kept.
 * - RIGHT/FULL: the joined cube is a PRESERVED side, so its rows failing ON
 *   come back anyway — ON alone filters nothing (GHSA-xv8c-hc26-6cq8). The
 *   filter stays in ON (so a hidden row never matches a visible one) and is
 *   enforced again in WHERE; see {@link buildPreservedSideGuard}.
 * - A joined cube whose own `sql` has an internal RIGHT/FULL join: that join
 *   runs after the cube join and keeps every row of its table, so the cube's
 *   filter is also applied in WHERE, exactly as when the cube is queried alone.
 */
function applyInterCubeJoin(
  drizzleQuery: any,
  joinCube: JoinCubePlanEntry,
  queryPlan: PhysicalQueryPlan,
  cteState: CTEBuildState,
  context: QueryContext,
  deps: Pick<PhysicalBuildDependencies, 'cteBuilder'>,
  cubesWithSecurityInJoin: Set<string>,
  allWhereConditions: SQL[]
): any {
  const cteAlias = cteState.cteAliasMap.get(joinCube.cube.name)
  const { joinTarget, joinCondition, securityCondition, joinCubeBase } =
    resolveCubeJoinTarget(joinCube, cteAlias, cteState, queryPlan, context, deps)

  const cubeJoinType = joinCube.joinType || 'left'
  const effectiveJoinCondition =
    cubeJoinType !== 'inner' && securityCondition
      ? and(joinCondition, securityCondition)
      : joinCondition

  // Built before the join is applied so a FULL join that cannot be secured
  // throws instead of being swallowed by the catch below.
  const securityWhere =
    cubeJoinType !== 'inner' && securityCondition
      ? buildJoinedCubeSecurityWhere(joinCube, cubeJoinType, joinCubeBase, context)
      : undefined

  try {
    let query: any
    if (cubeJoinType === 'inner') {
      // Security can go in WHERE for INNER JOINs (no difference)
      query = drizzleQuery.innerJoin(joinTarget, joinCondition)
    } else {
      query = applyJoinByType(drizzleQuery, cubeJoinType, joinTarget, effectiveJoinCondition)
      if (securityCondition) {
        cubesWithSecurityInJoin.add(joinCube.cube.name)
      }
      if (securityWhere) {
        allWhereConditions.push(securityWhere)
      }
    }

    // Apply the joined cube's intra-cube table-level joins
    // (BaseQueryDefinition.joins). These must be added AFTER the inter-cube
    // join above so the cube's base table is in scope for the join ON
    // conditions. Skipped in the CTE branch (joinCubeBase undefined) because
    // the CTE definition already contains these joins.
    return applyBaseJoins(query, joinCubeBase?.joins)
  } catch {
    // If join fails (e.g., duplicate alias), continue
    return drizzleQuery
  }
}

/**
 * The WHERE condition (if any) that must accompany a non-INNER join whose
 * security filter sits in the ON clause, or undefined when ON is enough
 * (a LEFT join of a cube without internal RIGHT/FULL joins). Shared with the
 * keys-deduplication CTE, which joins cubes the same way.
 */
export function buildJoinedCubeSecurityWhere(
  joinCube: JoinCubePlanEntry,
  cubeJoinType: 'left' | 'right' | 'full',
  joinCubeBase: ReturnType<Cube['sql']> | undefined,
  context: QueryContext
): SQL | undefined {
  const hasInternalOuterJoin = (joinCubeBase?.joins ?? []).some(
    join => join.type === 'right' || join.type === 'full'
  )
  if (!hasInternalOuterJoin && cubeJoinType === 'left') {
    return undefined
  }

  // A fresh copy of the filter: the one in ON must not be reused (Drizzle SQL
  // objects are mutable).
  const where = joinCube.cube.sql(context).where
  if (!where) {
    return undefined
  }
  if (hasInternalOuterJoin || cubeJoinType === 'left') {
    // Same semantics as querying the cube alone: its filter applies to every row.
    return where
  }
  return buildPreservedSideGuard(joinCube.cube, cubeJoinType, where, context)
}

/**
 * WHERE guard for a cube on the preserved side of a RIGHT/FULL join:
 * `(filter OR cube is NULL-extended)`.
 *
 * Together with the filter in ON this is equivalent to joining the cube's
 * pre-filtered rows: a hidden row never matches in ON, so it comes back alone
 * with its primary key set and the guard drops it; rows where the cube was
 * NULL-extended by the join carry none of its data and are kept.
 *
 * NULL-extension is detected through the primary key. Without one, a RIGHT
 * join falls back to the plain filter (every row of the joined cube is a real
 * row there), and a FULL join is refused rather than leaking rows.
 */
function buildPreservedSideGuard(
  cube: Cube,
  cubeJoinType: 'right' | 'full',
  where: SQL,
  context: QueryContext
): SQL {
  const primaryKeys = Object.values(cube.dimensions ?? {}).filter(d => d.primaryKey)
  if (primaryKeys.length === 0) {
    if (cubeJoinType === 'right') {
      return where
    }
    throw new Error(
      `Cube '${cube.name}' is joined with a FULL join but has no primaryKey dimension, ` +
      `so its security filter cannot be enforced. Add a primaryKey dimension to '${cube.name}'.`
    )
  }
  const nullExtended = and(
    ...primaryKeys.map(dimension => isNull(resolveSqlExpression(dimension.sql, context)))
  )
  return or(where, nullExtended)!
}

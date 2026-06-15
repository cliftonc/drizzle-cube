import {
  and,
  eq,
  sql,
  SQL
} from 'drizzle-orm'

import type {
  Cube,
  JoinCubePlanEntry,
  PhysicalQueryPlan,
  QueryContext
} from '../../types'
import { applyJoinByType } from './shared'
import type {
  CTEBuildState,
  JoinBuildState,
  PhysicalBuildDependencies,
  SelectionMap
} from './shared'

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
        cubesWithSecurityInJoin
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
  if (!junctionTable) {
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
  if (downstreamInfo && !joinCube.junctionTable) {
    // This cube joins THROUGH a CTE - build join condition referencing CTE alias
    // (e.g., Teams.id = employeeteams_agg.team_id). Skipped when a junction
    // table is present (belongsToMany): the junction handles CTE-to-junction
    // separately and the target cube uses its original joinCondition.
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
 * Apply a single inter-cube join. Security goes into the JOIN ON clause for
 * LEFT/RIGHT/FULL joins (preserving NULL rows + avoiding duplicate WHERE
 * conditions); for INNER joins it can stay in WHERE. Intra-cube joins of the
 * joined cube are applied afterwards so its base table is in scope.
 */
function applyInterCubeJoin(
  drizzleQuery: any,
  joinCube: JoinCubePlanEntry,
  queryPlan: PhysicalQueryPlan,
  cteState: CTEBuildState,
  context: QueryContext,
  deps: Pick<PhysicalBuildDependencies, 'cteBuilder'>,
  cubesWithSecurityInJoin: Set<string>
): any {
  const cteAlias = cteState.cteAliasMap.get(joinCube.cube.name)
  const { joinTarget, joinCondition, securityCondition, joinCubeBase } =
    resolveCubeJoinTarget(joinCube, cteAlias, cteState, queryPlan, context, deps)

  const cubeJoinType = joinCube.joinType || 'left'
  // For LEFT/RIGHT/FULL JOINs, include security in ON clause.
  // For INNER JOINs, security can go in WHERE (no difference in behavior).
  const effectiveJoinCondition =
    cubeJoinType !== 'inner' && securityCondition
      ? and(joinCondition, securityCondition)
      : joinCondition

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

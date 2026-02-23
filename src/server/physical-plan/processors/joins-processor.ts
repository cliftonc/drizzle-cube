import {
  and,
  eq,
  sql,
  SQL
} from 'drizzle-orm'

import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext
} from '../../types'
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

  // Start building the query from the primary cube
  let drizzleQuery = context.db
    .select(modifiedSelections)
    .from(primaryCubeBase.from)

  // Add CTEs to the query - Drizzle CTEs are added at the start
  if (cteState.ctes.length > 0) {
    drizzleQuery = context.db
      .with(...cteState.ctes)
      .select(modifiedSelections)
      .from(primaryCubeBase.from)
  }

  // Add joins from primary cube base (intra-cube joins)
  if (primaryCubeBase.joins) {
    for (const join of primaryCubeBase.joins) {
      switch (join.type || 'left') {
        case 'left':
          drizzleQuery = drizzleQuery.leftJoin(join.table, join.on)
          break
        case 'inner':
          drizzleQuery = drizzleQuery.innerJoin(join.table, join.on)
          break
        case 'right':
          drizzleQuery = drizzleQuery.rightJoin(join.table, join.on)
          break
        case 'full':
          drizzleQuery = drizzleQuery.fullJoin(join.table, join.on)
          break
      }
    }
  }

  // Track which cubes have their security handled in JOIN ON clause
  // This prevents duplicate security conditions in WHERE clause
  const cubesWithSecurityInJoin = new Set<string>()

  // Identify cubes that have been absorbed as intermediates into CTEs
  // These cubes should be SKIPPED in the main join plan because their
  // join logic is handled inside the CTE
  // Example: Departments → Employees → EmployeeTeams
  // - EmployeeTeams CTE absorbs the Employees join
  // - Main query should NOT have a separate Employees join for EmployeeTeams
  const absorbedIntermediateCubes = new Set<string>()
  if (queryPlan.preAggregationCTEs) {
    for (const cteInfo of queryPlan.preAggregationCTEs) {
      if (cteInfo.intermediateJoins && cteInfo.intermediateJoins.length > 0) {
        for (const intermediate of cteInfo.intermediateJoins) {
          absorbedIntermediateCubes.add(intermediate.cube.name)
        }
      }
    }
  }

  // Add multi-cube joins (inter-cube joins)
  if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
    for (const joinCube of queryPlan.joinCubes) {
      // Skip cubes that have been absorbed as intermediates into CTEs
      // UNLESS the cube has its own measures in the query (then it needs its own join)
      const cubeName = joinCube.cube.name
      if (absorbedIntermediateCubes.has(cubeName) && !cteState.cteAliasMap.has(cubeName)) {
        // This cube was absorbed as an intermediate - skip the join
        // The CTE that absorbed it will handle the relationship
        continue
      }

      // Check if this cube has been pre-aggregated into a CTE
      const cteAlias = cteState.cteAliasMap.get(joinCube.cube.name)

      // Handle belongsToMany junction table first if present
      if (joinCube.junctionTable) {
        const junctionTable = joinCube.junctionTable

        // When the source cube of the belongsToMany is a CTE, the junction table
        // join condition references the original table which no longer exists in the
        // outer query. Rebuild the condition to reference the CTE alias instead.
        let junctionJoinCondition = junctionTable.joinCondition
        const sourceCteAlias = junctionTable.sourceCubeName
          ? cteState.cteAliasMap.get(junctionTable.sourceCubeName)
          : undefined
        if (sourceCteAlias) {
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
        }

        // Collect all WHERE conditions for junction table including security context
        const junctionWhereConditions: SQL[] = []
        if (junctionTable.securitySql) {
          const junctionSecurity = junctionTable.securitySql(context.securityContext)
          if (Array.isArray(junctionSecurity)) {
            junctionWhereConditions.push(...junctionSecurity)
          } else {
            junctionWhereConditions.push(junctionSecurity)
          }
        }

        // Add junction table join (source -> junction)
        // NOTE: For junction tables (belongsToMany), security filters STAY in WHERE clause
        // because the semantics of many-to-many relationships require filtering out
        // non-matching records rather than returning them as NULLs.
        // The security-in-JOIN-ON logic only applies to regular LEFT JOINs (hasMany/hasOne).
        try {
          switch (junctionTable.joinType || 'left') {
            case 'left':
              drizzleQuery = drizzleQuery.leftJoin(junctionTable.table, junctionJoinCondition)
              break
            case 'inner':
              drizzleQuery = drizzleQuery.innerJoin(junctionTable.table, junctionJoinCondition)
              break
            case 'right':
              drizzleQuery = drizzleQuery.rightJoin(junctionTable.table, junctionJoinCondition)
              break
            case 'full':
              drizzleQuery = drizzleQuery.fullJoin(junctionTable.table, junctionJoinCondition)
              break
          }

          // Junction table security goes in WHERE clause to properly filter records
          if (junctionWhereConditions.length > 0) {
            allWhereConditions.push(...junctionWhereConditions)
          }
        } catch {
          // Junction table join failed, continuing
        }
      }

      let joinTarget: any
      let joinCondition: any
      let securityCondition: SQL | undefined

      if (cteAlias) {
        // Join to CTE instead of base table - use sql table reference
        joinTarget = sql`${sql.identifier(cteAlias)}`
        // Build CTE join condition using the CTE alias
        joinCondition = deps.cteBuilder.buildCTEJoinCondition(joinCube, cteAlias, queryPlan)
        // CTE already has security applied inside it, don't apply again
        securityCondition = undefined
      } else {
        // Check if this cube should join through a CTE (downstream cube)
        // Example: Teams joins through EmployeeTeams CTE when EmployeeTeams has measures
        const downstreamInfo = cteState.downstreamCubeMap.get(joinCube.cube.name)

        // Regular join to base table
        // Get the cube's SQL definition ONCE to avoid SQL object mutation issues
        const joinCubeBase = joinCube.cube.sql(context)
        joinTarget = joinCubeBase.from

        // Get security condition for this cube (for LEFT JOINs, will be added to ON clause)
        securityCondition = joinCubeBase.where

        if (downstreamInfo && !joinCube.junctionTable) {
          // This cube joins THROUGH a CTE - build join condition referencing CTE alias
          // e.g., Teams.id = employeeteams_agg.team_id
          // Skip when a junction table is present (belongsToMany) because:
          // - The junction table handles CTE-to-junction join separately
          // - The target cube uses its original joinCondition (junction-to-target)
          const conditions: SQL[] = []
          for (const joinKey of downstreamInfo.joinKeys) {
            // Source column is in the CTE (e.g., team_id in employeeteams_agg)
            const cteCol = sql`${sql.identifier(downstreamInfo.cteAlias)}.${sql.identifier(joinKey.sourceColumn)}`
            // Target column is in the downstream cube's table (e.g., id in teams)
            const targetCol = joinKey.targetColumnObj || sql.identifier(joinKey.targetColumn)
            conditions.push(eq(cteCol as any, targetCol as any))
          }
          joinCondition = conditions.length === 1 ? conditions[0] : and(...conditions)
        } else {
          // Standard join using original join condition
          joinCondition = joinCube.joinCondition
        }
      }

      const cubeJoinType = joinCube.joinType || 'left'
      // For LEFT/RIGHT/FULL JOINs, include security in ON clause
      // For INNER JOINs, security can go in WHERE (no difference in behavior)
      const effectiveJoinCondition =
        cubeJoinType !== 'inner' && securityCondition
          ? and(joinCondition, securityCondition)
          : joinCondition

      try {
        switch (cubeJoinType) {
          case 'left':
            drizzleQuery = drizzleQuery.leftJoin(joinTarget, effectiveJoinCondition)
            // Track that this cube's security is handled in JOIN ON
            if (securityCondition) {
              cubesWithSecurityInJoin.add(joinCube.cube.name)
            }
            break
          case 'inner':
            drizzleQuery = drizzleQuery.innerJoin(joinTarget, joinCondition)
            // Security can go in WHERE for INNER JOINs (no difference)
            break
          case 'right':
            drizzleQuery = drizzleQuery.rightJoin(joinTarget, effectiveJoinCondition)
            if (securityCondition) {
              cubesWithSecurityInJoin.add(joinCube.cube.name)
            }
            break
          case 'full':
            drizzleQuery = drizzleQuery.fullJoin(joinTarget, effectiveJoinCondition)
            if (securityCondition) {
              cubesWithSecurityInJoin.add(joinCube.cube.name)
            }
            break
        }
      } catch {
        // If join fails (e.g., duplicate alias), log and continue
        // Multi-cube join failed, continuing
      }
    }
  }

  return {
    drizzleQuery,
    allWhereConditions,
    cubesWithSecurityInJoin,
    absorbedIntermediateCubes
  }
}

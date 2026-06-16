/**
 * CTE (Common Table Expression) Builder
 * Handles pre-aggregation CTE generation for hasMany relationships
 * Extracted from QueryExecutor for single-responsibility
 */

import {
  and,
  eq,
  sql,
  SQL
} from 'drizzle-orm'

import type {
  SemanticQuery,
  QueryContext,
  PhysicalQueryPlan,
  PropagatingFilter
} from '../types/index.js'

import { resolveSqlExpression } from '../cube-utils.js'
import type { DrizzleSqlBuilder } from '../physical-plan/drizzle-sql-builder.js'

/**
 * CTE information type extracted from runtime physical plan context
 */
export type CTEInfo = NonNullable<PhysicalQueryPlan['preAggregationCTEs']>[0]

/**
 * Apply a cube's BaseQueryDefinition.joins (intra-cube table-level joins)
 * to a Drizzle query/subquery built from cubeBase.from. Used by the CTE
 * builder for both pre-aggregation CTEs and propagating-filter subqueries
 * to ensure joined-table columns are in scope for SELECTs and WHEREs.
 */
function applyBaseJoins(
  query: any,
  cubeBase: { joins?: Array<{ table: any; on: SQL; type?: 'left' | 'right' | 'inner' | 'full' }> }
): any {
  if (!cubeBase.joins) return query
  for (const join of cubeBase.joins) {
    switch (join.type || 'left') {
      case 'left':
        query = query.leftJoin(join.table, join.on)
        break
      case 'inner':
        query = query.innerJoin(join.table, join.on)
        break
      case 'right':
        query = query.rightJoin(join.table, join.on)
        break
      case 'full':
        query = query.fullJoin(join.table, join.on)
        break
    }
  }
  return query
}

/**
 * CTEBuilder handles the construction of Common Table Expressions
 * for pre-aggregation in hasMany relationship queries.
 *
 * This enables efficient aggregation of "many" side data before joining,
 * preventing the Cartesian product explosion that would occur with direct JOINs.
 */
export class CTEBuilder {
  constructor(private queryBuilder: DrizzleSqlBuilder) {}

  /**
   * Build pre-aggregation CTE for hasMany relationships
   *
   * Creates a CTE that:
   * 1. Selects join keys and aggregated measures
   * 2. Applies security context filtering
   * 3. Groups by join keys and requested dimensions
   * 4. Handles propagating filters from related cubes
   * 5. Handles multi-hop join paths by absorbing intermediate tables (fan-out prevention)
   */
  buildPreAggregationCTE(
    cteInfo: CTEInfo,
    query: SemanticQuery,
    context: QueryContext,
    queryPlan: PhysicalQueryPlan,
    preBuiltFilterMap?: Map<string, SQL[]>
  ): any {
    const cube = cteInfo.cube
    const cubeBase = cube.sql(context) // Gets security filtering!

    // Check if this CTE needs to absorb intermediate tables (multi-hop fan-out prevention)
    const hasIntermediateJoins = !!(cteInfo.intermediateJoins && cteInfo.intermediateJoins.length > 0)

    // Build selections for CTE - include join keys, measures, and requested dimensions
    const cteSelections = this.buildCTESelections(cteInfo, cube, query, context, hasIntermediateJoins)

    // Ensure we have at least one selection
    if (Object.keys(cteSelections).length === 0) {
      return null
    }

    // Build CTE query with security context applied
    let cteQuery = context.db
      .select(cteSelections)
      .from(cubeBase.from)

    // Apply the cube's intra-cube table-level joins
    // (BaseQueryDefinition.joins) so columns from joined tables are in
    // scope for the CTE's selections, intermediate join chain, and WHERE
    // clause. Must run BEFORE the intermediate-cube join chain below.
    cteQuery = applyBaseJoins(cteQuery, cubeBase)

    // If there are intermediate joins (multi-hop fan-out prevention),
    // add JOINs to the intermediate tables inside the CTE
    cteQuery = this.applyIntermediateJoins(cteQuery, cteInfo, context, hasIntermediateJoins)

    // Combine security context, regular WHERE conditions, and time dimension filters
    const allCteConditions = this.buildCTEWhereConditions(
      cteInfo, cube, query, context, queryPlan, preBuiltFilterMap, cubeBase
    )

    if (allCteConditions.length > 0) {
      const combinedWhere = allCteConditions.length === 1
        ? allCteConditions[0]
        : and(...allCteConditions)
      cteQuery = cteQuery.where(combinedWhere)
    }

    // All CTEs now use GROUP BY for pre-aggregation
    const groupByFields = this.buildCTEGroupByFields(cteInfo, cube, query, context, hasIntermediateJoins)

    if (groupByFields.length > 0) {
      cteQuery = cteQuery.groupBy(...groupByFields)
    }

    return context.db.$with(cteInfo.cteAlias).as(cteQuery)
  }

  /**
   * Build the SELECT map for a pre-aggregation CTE: join keys (or the
   * intermediate primary-connected column), downstream join keys, aggregated
   * measures, and requested dimensions / time dimensions from this cube.
   */
  private buildCTESelections(
    cteInfo: CTEInfo,
    cube: CTEInfo['cube'],
    query: SemanticQuery,
    context: QueryContext,
    hasIntermediateJoins: boolean
  ): Record<string, any> {
    const cteSelections: Record<string, any> = {}

    this.addJoinKeySelections(cteSelections, cteInfo, cube, hasIntermediateJoins)
    this.addDownstreamKeySelections(cteSelections, cteInfo)
    this.addMeasureSelections(cteSelections, cteInfo, cube, context)
    this.addDimensionSelections(cteSelections, cube, query, context)

    return cteSelections
  }

  /** Add join-key columns (or the intermediate primary-connected column) to the CTE SELECT. */
  private addJoinKeySelections(
    cteSelections: Record<string, any>,
    cteInfo: CTEInfo,
    cube: CTEInfo['cube'],
    hasIntermediateJoins: boolean
  ): void {
    // For multi-hop paths with intermediate joins the join key needs to come from
    // the INTERMEDIATE table, not the CTE table (e.g. employees.department_id).
    if (hasIntermediateJoins && cteInfo.intermediateJoins) {
      const primaryConnectCol = cteInfo.intermediateJoins[0].primaryJoinColumn
      if (primaryConnectCol) {
        cteSelections[primaryConnectCol.name] = primaryConnectCol
      }
      return
    }

    // Standard path: Add join key columns - use the stored column objects
    for (const joinKey of cteInfo.joinKeys) {
      if (!joinKey.targetColumnObj) continue
      cteSelections[joinKey.targetColumn] = joinKey.targetColumnObj

      // Also add an aliased version if there's a matching dimension with a different name
      // This allows the main query to reference it by dimension name
      for (const [dimName, dimension] of Object.entries(cube.dimensions || {}) as Array<[string, any]>) {
        if (dimension.sql === joinKey.targetColumnObj && dimName !== joinKey.targetColumn) {
          cteSelections[dimName] = sql`${joinKey.targetColumnObj}`.as(dimName) as unknown as any
        }
      }
    }
  }

  /** Add downstream join-key columns so downstream cubes can be joined through this CTE. */
  private addDownstreamKeySelections(
    cteSelections: Record<string, any>,
    cteInfo: CTEInfo
  ): void {
    if (!cteInfo.downstreamJoinKeys) return
    for (const downstream of cteInfo.downstreamJoinKeys) {
      for (const joinKey of downstream.joinKeys) {
        if (joinKey.sourceColumnObj) {
          cteSelections[joinKey.sourceColumn] = joinKey.sourceColumnObj
        }
      }
    }
  }

  /** Add aggregated measure expressions to the CTE SELECT. */
  private addMeasureSelections(
    cteSelections: Record<string, any>,
    cteInfo: CTEInfo,
    cube: CTEInfo['cube'],
    context: QueryContext
  ): void {
    const cubeMap = new Map([[cube.name, cube]])
    const resolvedMeasures = this.queryBuilder.buildResolvedMeasures(cteInfo.measures, cubeMap, context)
    for (const measureName of cteInfo.measures) {
      const [, fieldName] = measureName.split('.')
      const measureBuilder = resolvedMeasures.get(measureName)
      if (measureBuilder) {
        // Use just the field name as the column alias (SQL identifiers can't have dots)
        cteSelections[fieldName] = sql`${measureBuilder()}`.as(fieldName)
      }
    }
  }

  /** Add requested dimensions and time dimensions (from this cube) to the CTE SELECT. */
  private addDimensionSelections(
    cteSelections: Record<string, any>,
    cube: CTEInfo['cube'],
    query: SemanticQuery,
    context: QueryContext
  ): void {
    const cubeName = cube.name

    for (const dimensionName of query.dimensions || []) {
      const [dimCubeName, fieldName] = dimensionName.split('.')
      if (dimCubeName === cubeName && cube.dimensions?.[fieldName]) {
        const dimensionExpr = this.queryBuilder.buildMeasureExpression(
          { sql: cube.dimensions[fieldName].sql, type: 'number' }, context
        )
        cteSelections[fieldName] = sql`${dimensionExpr}`.as(fieldName)
      }
    }

    for (const timeDim of query.timeDimensions || []) {
      const [timeCubeName, fieldName] = timeDim.dimension.split('.')
      if (timeCubeName === cubeName && cube.dimensions?.[fieldName]) {
        const timeExpr = this.queryBuilder.buildTimeDimensionExpression(
          cube.dimensions[fieldName].sql, timeDim.granularity, context
        )
        cteSelections[fieldName] = sql`${timeExpr}`.as(fieldName)
      }
    }
  }

  /**
   * Add JOINs to intermediate tables inside the CTE (multi-hop fan-out
   * prevention). Joins from CTE-nearest to primary-nearest so each ON clause
   * only references tables already in scope.
   */
  private applyIntermediateJoins(
    cteQuery: any,
    cteInfo: CTEInfo,
    context: QueryContext,
    hasIntermediateJoins: boolean
  ): any {
    if (!hasIntermediateJoins || !cteInfo.intermediateJoins) {
      return cteQuery
    }

    const joinChain = [...cteInfo.intermediateJoins].reverse()
    for (const intermediate of joinChain) {
      const intermediateCubeBase = intermediate.cube.sql(context)
      const joinCondition = eq(intermediate.cteJoinColumn, intermediate.joinDef.on[0]?.target)

      // Add JOIN with security context for the intermediate table. The
      // security WHERE is materialized here (not baked into the plan) from
      // the intermediate cube's sql(context).where.
      const intermediateConditions = [joinCondition]
      if (intermediateCubeBase.where) {
        intermediateConditions.push(intermediateCubeBase.where)
      }

      cteQuery = cteQuery.leftJoin(
        intermediateCubeBase.from,
        and(...intermediateConditions)!
      )
    }
    return cteQuery
  }

  /**
   * Assemble the full WHERE condition list for a pre-aggregation CTE: security
   * context, regular dimension filters, time-dimension date filters, and
   * propagating filters from related cubes.
   *
   * IMPORTANT: Only dimension filters are applied here; measure filters belong
   * in the main query's HAVING clause.
   */
  private buildCTEWhereConditions(
    cteInfo: CTEInfo,
    cube: CTEInfo['cube'],
    query: SemanticQuery,
    context: QueryContext,
    queryPlan: PhysicalQueryPlan,
    preBuiltFilterMap: Map<string, SQL[]> | undefined,
    cubeBase: { where?: SQL }
  ): any[] {
    // Create a modified query plan that doesn't skip filters for the current CTE cube
    const cteQueryPlan = queryPlan ? {
      ...queryPlan,
      preAggregationCTEs: queryPlan.preAggregationCTEs?.filter((cte: any) => cte.cube.name !== cube.name)
    } : undefined

    const whereConditions = this.queryBuilder.buildWhereConditions(cube, query, context, cteQueryPlan, preBuiltFilterMap)
    const cteTimeFilters = this.buildCTETimeFilters(cteInfo, cube, query, context)

    const allCteConditions: any[] = []
    if (cubeBase.where) {
      allCteConditions.push(cubeBase.where)
    }
    allCteConditions.push(...whereConditions, ...cteTimeFilters)
    return allCteConditions
  }

  /**
   * Build the time-dimension date filters (from `timeDimensions.dateRange` and
   * `inDateRange` simple filters) plus propagating-filter subqueries for a CTE.
   */
  private buildCTETimeFilters(
    cteInfo: CTEInfo,
    cube: CTEInfo['cube'],
    query: SemanticQuery,
    context: QueryContext
  ): any[] {
    const cubeName = cube.name
    const cteTimeFilters: any[] = []

    // Handle dateRange from timeDimensions property
    for (const timeDim of query.timeDimensions || []) {
      const [timeCubeName, fieldName] = timeDim.dimension.split('.')
      if (timeCubeName === cubeName && cube.dimensions?.[fieldName] && timeDim.dateRange) {
        // Use the raw field expression for date filtering (not the truncated version)
        const fieldExpr = this.queryBuilder.buildMeasureExpression({ sql: cube.dimensions[fieldName].sql, type: 'number' }, context)
        const dateCondition = this.queryBuilder.buildDateRangeCondition(fieldExpr, timeDim.dateRange)
        if (dateCondition) {
          cteTimeFilters.push(dateCondition)
        }
      }
    }

    // Handle inDateRange filters from filters array for time dimensions of this cube
    for (const filter of query.filters || []) {
      // Only handle simple filter conditions (not logical AND/OR)
      if (('and' in filter) || ('or' in filter) || !('member' in filter) || !('operator' in filter)) {
        continue
      }
      const filterCondition = filter as any
      const [filterCubeName, filterFieldName] = filterCondition.member.split('.')
      if (filterCubeName === cubeName && cube.dimensions?.[filterFieldName] && filterCondition.operator === 'inDateRange') {
        const fieldExpr = this.queryBuilder.buildMeasureExpression({ sql: cube.dimensions[filterFieldName].sql, type: 'number' }, context)
        const dateCondition = this.queryBuilder.buildDateRangeCondition(fieldExpr, filterCondition.values)
        if (dateCondition) {
          cteTimeFilters.push(dateCondition)
        }
      }
    }

    // Handle propagating filters from related cubes
    // When cube A has filters and hasMany relationship to this CTE cube B,
    // A's filters should propagate via subquery: B.FK IN (SELECT A.PK FROM A WHERE filters)
    for (const propFilter of cteInfo.propagatingFilters || []) {
      const subqueryCondition = this.buildPropagatingFilterSubquery(propFilter, context)
      if (subqueryCondition) {
        cteTimeFilters.push(subqueryCondition)
      }
    }

    return cteTimeFilters
  }

  /**
   * Build the GROUP BY fields for a pre-aggregation CTE: join keys (or the
   * intermediate primary-connected column), downstream join keys, and requested
   * dimensions / time dimensions. De-dupes named columns.
   */
  private buildCTEGroupByFields(
    cteInfo: CTEInfo,
    cube: CTEInfo['cube'],
    query: SemanticQuery,
    context: QueryContext,
    hasIntermediateJoins: boolean
  ): any[] {
    const cubeName = cube.name
    const groupByFields: any[] = []
    const addedColumnNames = new Set<string>() // Track added columns to avoid duplicates

    // Add column if not already present (named columns de-duped; expressions added directly)
    const addGroupByField = (col: any) => {
      const colName = col?.name || (typeof col === 'string' ? col : null)
      if (colName && !addedColumnNames.has(colName)) {
        addedColumnNames.add(colName)
        groupByFields.push(col)
      } else if (!colName) {
        groupByFields.push(col)
      }
    }

    this.addJoinKeyGroupBy(addGroupByField, cteInfo, hasIntermediateJoins)

    // Add requested dimensions from this cube to GROUP BY
    for (const dimensionName of query.dimensions || []) {
      const [dimCubeName, fieldName] = dimensionName.split('.')
      if (dimCubeName === cubeName && cube.dimensions?.[fieldName]) {
        groupByFields.push(resolveSqlExpression(cube.dimensions[fieldName].sql, context))
      }
    }

    // Add requested time dimensions from this cube to GROUP BY
    for (const timeDim of query.timeDimensions || []) {
      const [timeCubeName, fieldName] = timeDim.dimension.split('.')
      if (timeCubeName === cubeName && cube.dimensions?.[fieldName]) {
        groupByFields.push(
          this.queryBuilder.buildTimeDimensionExpression(cube.dimensions[fieldName].sql, timeDim.granularity, context)
        )
      }
    }

    return groupByFields
  }

  /**
   * Add join keys (and downstream join keys) to the CTE GROUP BY via the de-dupe
   * callback. For multi-hop paths uses the intermediate table's
   * primary-connected column (e.g. employees.department_id).
   */
  private addJoinKeyGroupBy(
    addGroupByField: (col: any) => void,
    cteInfo: CTEInfo,
    hasIntermediateJoins: boolean
  ): void {
    if (hasIntermediateJoins && cteInfo.intermediateJoins) {
      const firstIntermediate = cteInfo.intermediateJoins[0]
      if (firstIntermediate.primaryJoinColumn) {
        addGroupByField(firstIntermediate.primaryJoinColumn)
      }
    } else {
      for (const joinKey of cteInfo.joinKeys) {
        if (joinKey.targetColumnObj) {
          addGroupByField(joinKey.targetColumnObj)
        }
      }
    }

    // Add downstream join keys (so downstream cubes can join through this CTE)
    if (cteInfo.downstreamJoinKeys) {
      for (const downstream of cteInfo.downstreamJoinKeys) {
        for (const joinKey of downstream.joinKeys) {
          if (joinKey.sourceColumnObj) {
            addGroupByField(joinKey.sourceColumnObj)
          }
        }
      }
    }
  }

  /**
   * Build join condition for CTE
   *
   * Creates the ON clause for joining a CTE to the main query.
   * Uses stored column objects for type-safe joins.
   *
   * For multi-hop paths with intermediate joins:
   * - The CTE includes columns from intermediate tables
   * - The join condition uses the intermediate's primary-connected column
   * - Example: departments.id = employeeteams_agg.department_id (not employee_id!)
   */
  buildCTEJoinCondition(
    joinCube: PhysicalQueryPlan['joinCubes'][0],
    cteAlias: string,
    queryPlan: PhysicalQueryPlan
  ): SQL {
    // Find the pre-aggregation info for this join cube
    const cteInfo = queryPlan.preAggregationCTEs?.find((cte: any) => cte.cube.name === joinCube.cube.name)
    if (!cteInfo) {
      throw new Error(`CTE info not found for cube ${joinCube.cube.name}`)
    }

    const conditions: SQL[] = []

    // Check if this is a multi-hop path with intermediate joins
    if (cteInfo.intermediateJoins && cteInfo.intermediateJoins.length > 0) {
      // Use the intermediate table's primary-connected column
      // Example: departments.id = employeeteams_agg.department_id
      const firstIntermediate = cteInfo.intermediateJoins[0]
      const primaryCol = this.resolveCTEJoinSourceColumn(
        cteInfo.joinKeys[0],
        cteInfo,
        queryPlan
      )
      const cteCol = sql`${sql.identifier(cteAlias)}.${sql.identifier(firstIntermediate.primaryJoinColumn.name)}`
      conditions.push(eq(primaryCol as any, cteCol))
    } else {
      // Standard path: build join conditions using join keys
      for (const joinKey of cteInfo.joinKeys) {
        const sourceCol = this.resolveCTEJoinSourceColumn(joinKey, cteInfo, queryPlan)
        const cteCol = sql`${sql.identifier(cteAlias)}.${sql.identifier(joinKey.targetColumn)}` // CTE column
        conditions.push(eq(sourceCol as any, cteCol))
      }
    }

    return conditions.length === 1 ? conditions[0] : and(...conditions)!
  }

  /**
   * Resolve source-side join expression for CTE joins.
   *
   * When two cubes are both materialized as CTEs in the same query, join keys can
   * still point to the original table column object (e.g. departments.id). In that
   * case the table is no longer present in FROM/JOIN, so rewrite to the upstream CTE
   * alias column (e.g. departments_agg.id).
   */
  private resolveCTEJoinSourceColumn(
    joinKey: CTEInfo['joinKeys'][number] | undefined,
    currentCteInfo: CTEInfo,
    queryPlan: PhysicalQueryPlan
  ): SQL | any {
    if (!joinKey) {
      throw new Error(
        `Missing join key while building CTE join condition for '${currentCteInfo.cube.name}'`
      )
    }

    const defaultSource = joinKey.sourceColumnObj || sql.identifier(joinKey.sourceColumn)
    if (!joinKey.sourceColumnObj || !queryPlan.preAggregationCTEs) {
      return defaultSource
    }

    for (const candidate of queryPlan.preAggregationCTEs) {
      if (candidate.cube.name === currentCteInfo.cube.name) {
        continue
      }

      for (const [dimensionName, dimension] of Object.entries(candidate.cube.dimensions || {}) as Array<[string, any]>) {
        if (typeof dimension.sql === 'function') {
          continue
        }
        if (dimension.sql === joinKey.sourceColumnObj) {
          return sql`${sql.identifier(candidate.cteAlias)}.${sql.identifier(dimensionName)}`
        }
      }
    }

    return defaultSource
  }

  /**
   * Build a subquery filter for propagating filters from related cubes.
   *
   * This generates: cteCube.FK IN (SELECT sourceCube.PK FROM sourceCube WHERE filters...)
   *
   * Example: For Productivity CTE with Employees.createdAt filter:
   * employee_id IN (SELECT id FROM employees WHERE organisation_id = $1 AND created_at >= $date)
   *
   * For composite keys, uses EXISTS instead of IN for better database compatibility:
   * EXISTS (SELECT 1 FROM source WHERE source.pk1 = cte.fk1 AND source.pk2 = cte.fk2 AND <filters>)
   */
  buildPropagatingFilterSubquery(
    propFilter: PropagatingFilter,
    context: QueryContext
  ): SQL | null {
    const sourceCube = propFilter.sourceCube
    const cubeBase = sourceCube.sql(context) // Gets security context filtering

    // Build filter conditions for the source cube
    const filterConditions: SQL[] = []

    // Add security context (already in cubeBase.where)
    if (cubeBase.where) {
      filterConditions.push(cubeBase.where)
    }

    // Use pre-built filter SQL if available (for parameter deduplication)
    // Otherwise fall back to building fresh
    if (propFilter.preBuiltFilterSQL) {
      filterConditions.push(propFilter.preBuiltFilterSQL)
    } else {
      // Fallback: Create a synthetic query with just the propagating filters
      // and use buildWhereConditions to process them
      const syntheticQuery: SemanticQuery = {
        filters: propFilter.filters
      }
      const cubeMap = new Map([[sourceCube.name, sourceCube]])
      const filterSQL = this.queryBuilder.buildWhereConditions(
        cubeMap,
        syntheticQuery,
        context
      )
      filterConditions.push(...filterSQL)
    }

    // If no filter conditions, no subquery needed
    if (filterConditions.length === 0) {
      return null
    }

    // Build the combined WHERE condition from filters
    const combinedWhere = filterConditions.length === 1
      ? filterConditions[0]
      : and(...filterConditions)

    // For composite keys, use EXISTS instead of IN for better database compatibility
    const joinConditions = propFilter.joinConditions

    if (joinConditions.length === 1) {
      // Single key: use simple IN clause
      const { source: sourcePK, target: cteFK } = joinConditions[0]
      let subquery: any = context.db
        .select({ pk: sourcePK })
        .from(cubeBase.from)
      // Apply the source cube's intra-cube table-level joins so any
      // joined-table column referenced by the propagating filter (or
      // security WHERE) is in scope.
      subquery = applyBaseJoins(subquery, cubeBase)
      subquery = subquery.where(combinedWhere!)

      return sql`${cteFK} IN ${subquery}`
    } else {
      // Composite keys: use EXISTS with all join conditions
      // Build join condition: source.pk1 = cte.fk1 AND source.pk2 = cte.fk2 ...
      const joinEqualityConditions = joinConditions.map(jc => eq(jc.source, jc.target))

      // Combine join conditions with filter conditions
      const existsWhere = and(
        ...joinEqualityConditions,
        combinedWhere!
      )

      let existsSubquery: any = context.db
        .select({ one: sql`1` })
        .from(cubeBase.from)
      existsSubquery = applyBaseJoins(existsSubquery, cubeBase)
      existsSubquery = existsSubquery.where(existsWhere!)

      return sql`EXISTS ${existsSubquery}`
    }
  }
}

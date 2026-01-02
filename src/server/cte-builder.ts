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
  QueryPlan,
  PropagatingFilter
} from './types'

import { resolveSqlExpression } from './cube-utils'
import type { QueryBuilder } from './query-builder'

/**
 * CTE information type extracted from QueryPlan
 */
export type CTEInfo = NonNullable<QueryPlan['preAggregationCTEs']>[0]

/**
 * CTEBuilder handles the construction of Common Table Expressions
 * for pre-aggregation in hasMany relationship queries.
 *
 * This enables efficient aggregation of "many" side data before joining,
 * preventing the Cartesian product explosion that would occur with direct JOINs.
 */
export class CTEBuilder {
  constructor(private queryBuilder: QueryBuilder) {}

  /**
   * Build pre-aggregation CTE for hasMany relationships
   *
   * Creates a CTE that:
   * 1. Selects join keys and aggregated measures
   * 2. Applies security context filtering
   * 3. Groups by join keys and requested dimensions
   * 4. Handles propagating filters from related cubes
   */
  buildPreAggregationCTE(
    cteInfo: CTEInfo,
    query: SemanticQuery,
    context: QueryContext,
    queryPlan: QueryPlan,
    preBuiltFilterMap?: Map<string, SQL[]>
  ): any {
    const cube = cteInfo.cube
    const cubeBase = cube.sql(context) // Gets security filtering!

    // Build selections for CTE - include join keys and measures
    const cteSelections: Record<string, any> = {}

    // Add join key columns - use the stored column objects
    for (const joinKey of cteInfo.joinKeys) {
      // Use the stored Drizzle column object if available
      if (joinKey.targetColumnObj) {
        cteSelections[joinKey.targetColumn] = joinKey.targetColumnObj

        // Also add an aliased version if there's a matching dimension with a different name
        // This allows the main query to reference it by dimension name
        for (const [dimName, dimension] of Object.entries(cube.dimensions || {}) as Array<[string, any]>) {
          if (dimension.sql === joinKey.targetColumnObj && dimName !== joinKey.targetColumn) {
            // Add an aliased version: "column_name" as "dimensionName"
            cteSelections[dimName] = sql`${joinKey.targetColumnObj}`.as(dimName) as unknown as any
          }
        }
      }
    }

    // Add measures with aggregation using the centralized helper
    const cubeName = cube.name
    const cubeMap = new Map([[cubeName, cube]])

    const resolvedMeasures = this.queryBuilder.buildResolvedMeasures(
      cteInfo.measures,
      cubeMap,
      context
    )

    // Add all resolved measures to CTE selections
    for (const measureName of cteInfo.measures) {
      const [, fieldName] = measureName.split('.')
      const measureBuilder = resolvedMeasures.get(measureName)
      if (measureBuilder) {
        const measureExpr = measureBuilder()
        // Use just the field name as the column alias (SQL identifiers can't have dots)
        cteSelections[fieldName] = sql`${measureExpr}`.as(fieldName)
      }
    }

    // Add dimensions that are requested in the query from this cube
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [dimCubeName, fieldName] = dimensionName.split('.')
        if (dimCubeName === cubeName && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const dimensionExpr = this.queryBuilder.buildMeasureExpression({ sql: dimension.sql, type: 'number' }, context)
          cteSelections[fieldName] = sql`${dimensionExpr}`.as(fieldName)
        }
      }
    }

    // Add time dimensions that are requested in the query from this cube
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [timeCubeName, fieldName] = timeDim.dimension.split('.')
        if (timeCubeName === cubeName && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const timeExpr = this.queryBuilder.buildTimeDimensionExpression(dimension.sql, timeDim.granularity, context)
          cteSelections[fieldName] = sql`${timeExpr}`.as(fieldName)
        }
      }
    }

    // Ensure we have at least one selection
    if (Object.keys(cteSelections).length === 0) {
      return null
    }

    // Build CTE query with security context applied
    let cteQuery = context.db
      .select(cteSelections)
      .from(cubeBase.from)

    // Add additional query-specific WHERE conditions for this cube
    // IMPORTANT: Only apply dimension filters in CTE WHERE clause, not measure filters
    // Measure filters should only be applied in HAVING clause of the main query

    // Create a modified query plan that doesn't skip filters for the current CTE cube
    const cteQueryPlan = queryPlan ? {
      ...queryPlan,
      preAggregationCTEs: queryPlan.preAggregationCTEs?.filter((cte: any) => cte.cube.name !== cube.name)
    } : undefined

    const whereConditions = this.queryBuilder.buildWhereConditions(cube, query, context, cteQueryPlan, preBuiltFilterMap)

    // Also add time dimension filters for this cube within the CTE
    const cteTimeFilters: any[] = []

    // Handle dateRange from timeDimensions property
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [timeCubeName, fieldName] = timeDim.dimension.split('.')
        if (timeCubeName === cubeName && cube.dimensions && cube.dimensions[fieldName] && timeDim.dateRange) {
          const dimension = cube.dimensions[fieldName]
          // Use the raw field expression for date filtering (not the truncated version)
          const fieldExpr = this.queryBuilder.buildMeasureExpression({ sql: dimension.sql, type: 'number' }, context)
          const dateCondition = this.queryBuilder.buildDateRangeCondition(fieldExpr, timeDim.dateRange)
          if (dateCondition) {
            cteTimeFilters.push(dateCondition)
          }
        }
      }
    }

    // Handle inDateRange filters from filters array for time dimensions of this cube
    if (query.filters) {
      for (const filter of query.filters) {
        // Only handle simple filter conditions (not logical AND/OR)
        if (!('and' in filter) && !('or' in filter) && 'member' in filter && 'operator' in filter) {
          const filterCondition = filter as any
          const [filterCubeName, filterFieldName] = filterCondition.member.split('.')

          // Check if this filter is for a time dimension of this cube
          if (filterCubeName === cubeName && cube.dimensions && cube.dimensions[filterFieldName]) {
            const dimension = cube.dimensions[filterFieldName]
            // Check if this is a time dimension (date/time related) and has inDateRange filter
            if (filterCondition.operator === 'inDateRange') {
              const fieldExpr = this.queryBuilder.buildMeasureExpression({ sql: dimension.sql, type: 'number' }, context)
              const dateCondition = this.queryBuilder.buildDateRangeCondition(fieldExpr, filterCondition.values)
              if (dateCondition) {
                cteTimeFilters.push(dateCondition)
              }
            }
          }
        }
      }
    }

    // Handle propagating filters from related cubes
    // When cube A has filters and hasMany relationship to this CTE cube B,
    // A's filters should propagate via subquery: B.FK IN (SELECT A.PK FROM A WHERE filters)
    if (cteInfo.propagatingFilters && cteInfo.propagatingFilters.length > 0) {
      for (const propFilter of cteInfo.propagatingFilters) {
        const subqueryCondition = this.buildPropagatingFilterSubquery(
          propFilter,
          context
        )
        if (subqueryCondition) {
          cteTimeFilters.push(subqueryCondition)
        }
      }
    }

    // Combine security context, regular WHERE conditions, and time dimension filters into one WHERE clause
    // IMPORTANT: Must combine all conditions in a single WHERE call to avoid overriding
    const allCteConditions = []
    if (cubeBase.where) {
      allCteConditions.push(cubeBase.where)
    }
    allCteConditions.push(...whereConditions, ...cteTimeFilters)

    if (allCteConditions.length > 0) {
      const combinedWhere = allCteConditions.length === 1
        ? allCteConditions[0]
        : and(...allCteConditions)
      cteQuery = cteQuery.where(combinedWhere)
    }

    // Group by join keys (essential for pre-aggregation) and requested dimensions
    const groupByFields: any[] = []

    // Add join key columns to GROUP BY
    for (const joinKey of cteInfo.joinKeys) {
      if (joinKey.targetColumnObj) {
        groupByFields.push(joinKey.targetColumnObj)
      }
    }

    // Add dimensions that are requested in the query from this cube to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [dimCubeName, fieldName] = dimensionName.split('.')
        if (dimCubeName === cubeName && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const dimensionExpr = resolveSqlExpression(dimension.sql, context)
          groupByFields.push(dimensionExpr)
        }
      }
    }

    // Add time dimensions that are requested in the query from this cube to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [timeCubeName, fieldName] = timeDim.dimension.split('.')
        if (timeCubeName === cubeName && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const timeExpr = this.queryBuilder.buildTimeDimensionExpression(dimension.sql, timeDim.granularity, context)
          groupByFields.push(timeExpr)
        }
      }
    }

    if (groupByFields.length > 0) {
      cteQuery = cteQuery.groupBy(...groupByFields)
    }

    return context.db.$with(cteInfo.cteAlias).as(cteQuery)
  }

  /**
   * Build join condition for CTE
   *
   * Creates the ON clause for joining a CTE to the main query.
   * Uses stored column objects for type-safe joins.
   */
  buildCTEJoinCondition(
    joinCube: QueryPlan['joinCubes'][0],
    cteAlias: string,
    queryPlan: QueryPlan
  ): SQL {
    // Find the pre-aggregation info for this join cube
    const cteInfo = queryPlan.preAggregationCTEs?.find((cte: any) => cte.cube.name === joinCube.cube.name)
    if (!cteInfo) {
      throw new Error(`CTE info not found for cube ${joinCube.cube.name}`)
    }

    const conditions: SQL[] = []

    // Build join conditions using join keys
    for (const joinKey of cteInfo.joinKeys) {
      // Use the stored source column object if available, otherwise fall back to identifier
      const sourceCol = joinKey.sourceColumnObj || sql.identifier(joinKey.sourceColumn)
      const cteCol = sql`${sql.identifier(cteAlias)}.${sql.identifier(joinKey.targetColumn)}` // CTE column
      conditions.push(eq(sourceCol as any, cteCol))
    }

    return conditions.length === 1 ? conditions[0] : and(...conditions)!
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
      const subquery = context.db
        .select({ pk: sourcePK })
        .from(cubeBase.from)
        .where(combinedWhere!)

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

      const existsSubquery = context.db
        .select({ one: sql`1` })
        .from(cubeBase.from)
        .where(existsWhere!)

      return sql`EXISTS ${existsSubquery}`
    }
  }
}

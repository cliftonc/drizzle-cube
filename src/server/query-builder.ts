/**
 * Shared Query Builder
 * Contains all SQL building logic that was previously duplicated between executor and multi-cube-builder
 * Single source of truth for all SQL generation
 */

import {
  sql,
  and,
  or,
  count,
  asc,
  desc,
  SQL,
  type AnyColumn
} from 'drizzle-orm'

import type {
  SemanticQuery,
  FilterOperator,
  Filter,
  FilterCondition,
  LogicalFilter,
  Cube,
  QueryContext,
  QueryPlan
} from './types'

import { resolveSqlExpression } from './cube-utils'
import type { DatabaseAdapter } from './adapters/base-adapter'
import { getFilterKey, getTimeDimensionFilterKey } from './filter-cache'
import { DateTimeBuilder, FilterBuilder, GroupByBuilder, MeasureBuilder } from './builders'
import type { ResolvedMeasures } from './template-substitution'

export class QueryBuilder {
  private dateTimeBuilder: DateTimeBuilder
  private filterBuilder: FilterBuilder
  private groupByBuilder: GroupByBuilder
  private measureBuilder: MeasureBuilder

  constructor(databaseAdapter: DatabaseAdapter) {
    this.dateTimeBuilder = new DateTimeBuilder(databaseAdapter)
    this.filterBuilder = new FilterBuilder(databaseAdapter, this.dateTimeBuilder)
    this.groupByBuilder = new GroupByBuilder(this.dateTimeBuilder)
    this.measureBuilder = new MeasureBuilder(databaseAdapter)
  }

  /**
   * Build resolvedMeasures map for a set of measures
   * Delegates to MeasureBuilder
   */
  buildResolvedMeasures(
    measureNames: string[],
    cubeMap: Map<string, Cube>,
    context: QueryContext,
    customMeasureBuilder?: (measureName: string, measure: any, cube: Cube) => SQL
  ): ResolvedMeasures {
    return this.measureBuilder.buildResolvedMeasures(measureNames, cubeMap, context, customMeasureBuilder)
  }

  /**
   * Build dynamic selections for measures, dimensions, and time dimensions
   * Works for both single and multi-cube queries
   * Handles calculated measures with dependency resolution
   */
  buildSelections(
    cubes: Map<string, Cube> | Cube,
    query: SemanticQuery,
    context: QueryContext
  ): Record<string, SQL | AnyColumn> {
    const selections: Record<string, SQL | AnyColumn> = {}

    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])

    // Add dimensions
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const sqlExpr = resolveSqlExpression(dimension.sql, context)
          // Use explicit alias for dimension expressions so they can be referenced in ORDER BY
          selections[dimensionName] = sql`${sqlExpr}`.as(dimensionName) as unknown as SQL
        }
      }
    }

    // Add measures with aggregations using the centralized helper
    if (query.measures) {
      const resolvedMeasures = this.buildResolvedMeasures(
        query.measures,
        cubeMap,
        context
      )

      // Add user-requested measures to selections
      for (const measureName of query.measures) {
        const measureBuilder = resolvedMeasures.get(measureName)
        if (measureBuilder) {
          const measureExpr = measureBuilder()
          selections[measureName] = sql`${measureExpr}`.as(measureName) as unknown as SQL
        }
      }
    }

    // Add time dimensions with granularity
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const timeExpr = this.buildTimeDimensionExpression(
            dimension.sql,
            timeDim.granularity,
            context
          )
          // Use explicit alias for time dimension expressions so they can be referenced in ORDER BY
          selections[timeDim.dimension] = sql`${timeExpr}`.as(timeDim.dimension) as unknown as SQL
        }
      }
    }

    // Default to COUNT(*) if no selections
    if (Object.keys(selections).length === 0) {
      selections.count = count()
    }

    return selections
  }

  /**
   * Build calculated measure expression by substituting {member} references
   * Delegates to MeasureBuilder
   */
  public buildCalculatedMeasure(
    measure: any,
    cube: Cube,
    allCubes: Map<string, Cube>,
    resolvedMeasures: ResolvedMeasures,
    context: QueryContext
  ): SQL {
    return this.measureBuilder.buildCalculatedMeasure(measure, cube, allCubes, resolvedMeasures, context)
  }

  /**
   * Build resolved measures map for a calculated measure from CTE columns
   * Delegates to MeasureBuilder
   */
  public buildCTECalculatedMeasure(
    measure: any,
    cube: Cube,
    cteInfo: { cteAlias: string; measures: string[]; cube: Cube },
    allCubes: Map<string, Cube>,
    context: QueryContext
  ): SQL {
    return this.measureBuilder.buildCTECalculatedMeasure(measure, cube, cteInfo, allCubes, context)
  }

  /**
   * Build measure expression for HAVING clause, handling CTE references correctly
   * Delegates to MeasureBuilder
   */
  private buildHavingMeasureExpression(
    cubeName: string,
    fieldKey: string,
    measure: any,
    context: QueryContext,
    queryPlan?: QueryPlan
  ): SQL {
    return this.measureBuilder.buildHavingMeasureExpression(cubeName, fieldKey, measure, context, queryPlan)
  }

  /**
   * Build measure expression with aggregation and filters
   * Delegates to MeasureBuilder
   */
  buildMeasureExpression(
    measure: any,
    context: QueryContext,
    cube?: Cube
  ): SQL {
    return this.measureBuilder.buildMeasureExpression(measure, context, cube)
  }

  /**
   * Build time dimension expression with granularity using database adapter
   * Delegates to DateTimeBuilder
   */
  buildTimeDimensionExpression(
    dimensionSql: any,
    granularity: string | undefined,
    context: QueryContext
  ): SQL {
    return this.dateTimeBuilder.buildTimeDimensionExpression(dimensionSql, granularity, context)
  }

  /**
   * Build WHERE conditions from semantic query filters (dimensions only)
   * Works for both single and multi-cube queries
   * @param preBuiltFilters - Optional map of cube name to pre-built filter SQL for parameter deduplication
   */
  buildWhereConditions(
    cubes: Map<string, Cube> | Cube,
    query: SemanticQuery,
    context: QueryContext,
    queryPlan?: QueryPlan,
    preBuiltFilters?: Map<string, SQL[]>
  ): SQL[] {
    const conditions: SQL[] = []

    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])

    // Track which cubes have had their pre-built filters added
    const cubesWithPreBuiltFiltersAdded = new Set<string>()

    // Process regular filters (dimensions only for WHERE clause)
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        // Check if this filter's cube has pre-built filters we should use instead
        // IMPORTANT: Only use pre-built filters if the filter's cube is in our current cubeMap
        // This prevents using Employees filters in a Productivity CTE context
        if (preBuiltFilters && 'member' in filter) {
          const [cubeName] = (filter.member as string).split('.')
          const cubeIsInContext = cubeMap.has(cubeName)

          if (cubeIsInContext && preBuiltFilters.has(cubeName) && !cubesWithPreBuiltFiltersAdded.has(cubeName)) {
            // Use the pre-built filter SQL instead of building fresh
            // This deduplicates parameters between CTE subquery and main query
            const preBuilt = preBuiltFilters.get(cubeName)!
            conditions.push(...preBuilt)
            cubesWithPreBuiltFiltersAdded.add(cubeName)
            continue
          } else if (cubesWithPreBuiltFiltersAdded.has(cubeName)) {
            // Skip - already added pre-built filters for this cube
            continue
          }
        }

        const condition = this.processFilter(filter, cubeMap, context, 'where', queryPlan)
        if (condition) {
          conditions.push(condition)
        }
      }
    }    

    // Process time dimension date range filters
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions[fieldName] && timeDim.dateRange) {
          // Check if this cube is in a pre-aggregation CTE - if so, skip this filter in WHERE clause
          // The time dimension filter will be applied within the CTE itself during pre-aggregation
          if (queryPlan?.preAggregationCTEs) {
            const isInCTE = queryPlan.preAggregationCTEs.some((cte: any) => cte.cube.name === cubeName)
            if (isInCTE) {
              continue // Skip this filter - it's handled in the CTE
            }
          }

          // Try to use cached time dimension filter for parameter deduplication
          if (context.filterCache) {
            const key = getTimeDimensionFilterKey(timeDim.dimension, timeDim.dateRange)
            const cached = context.filterCache.get(key)
            if (cached) {
              conditions.push(cached)
              continue
            }
          }

          const dimension = cube.dimensions[fieldName]
          // Use the raw field expression for date filtering (not the truncated version)
          // This ensures we filter on the actual timestamp values before aggregation
          const fieldExpr = resolveSqlExpression(dimension.sql, context)
          const dateCondition = this.buildDateRangeCondition(fieldExpr, timeDim.dateRange)
          if (dateCondition) {
            conditions.push(dateCondition)
          }
        }
      }
    }    
    
    return conditions
  }

  /**
   * Build HAVING conditions from semantic query filters (measures only)
   * Works for both single and multi-cube queries
   */
  buildHavingConditions(
    cubes: Map<string, Cube> | Cube, 
    query: SemanticQuery, 
    context: QueryContext,
    queryPlan?: QueryPlan
  ): SQL[] {
    const conditions: SQL[] = []
    
    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])
    
    // Process regular filters (measures only for HAVING clause)
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        const condition = this.processFilter(filter, cubeMap, context, 'having', queryPlan)
        if (condition) {
          conditions.push(condition)
        }
      }
    }    
    
    return conditions
  }

  /**
   * Process a single filter (basic or logical)
   * @param filterType - 'where' for dimension filters, 'having' for measure filters
   */
  private processFilter(
    filter: Filter,
    cubes: Map<string, Cube>,
    context: QueryContext,
    filterType: 'where' | 'having',
    queryPlan?: QueryPlan
  ): SQL | null {
    // Handle logical filters (AND/OR)
    // NOTE: We do NOT cache logical filters because they can contain mixed cube references.
    // When some cubes are in CTEs, the cached version would reference wrong table contexts.
    // Individual simple filters within logical filters are still cached for deduplication.
    if ('and' in filter || 'or' in filter) {
      const logicalFilter = filter as LogicalFilter

      if (logicalFilter.and) {
        const conditions = logicalFilter.and
          .map(f => this.processFilter(f, cubes, context, filterType, queryPlan))
          .filter((condition): condition is SQL => condition !== null)
        return conditions.length > 0 ? and(...conditions) as SQL : null
      }

      if (logicalFilter.or) {
        const conditions = logicalFilter.or
          .map(f => this.processFilter(f, cubes, context, filterType, queryPlan))
          .filter((condition): condition is SQL => condition !== null)
        return conditions.length > 0 ? or(...conditions) as SQL : null
      }
    }

    // Handle simple filter condition
    const filterCondition = filter as FilterCondition
    const [cubeName, fieldKey] = filterCondition.member.split('.')
    const cube = cubes.get(cubeName)
    if (!cube) return null

    // Find the field in dimensions or measures
    const dimension = cube.dimensions[fieldKey]
    const measure = cube.measures[fieldKey]
    const field = dimension || measure
    if (!field) return null

    // Apply filter based on type and what we're looking for
    if (filterType === 'where' && dimension) {
      // Check if this cube is in a pre-aggregation CTE - if so, skip this filter in WHERE clause
      // The filter will be applied within the CTE itself
      // IMPORTANT: This check MUST come before the cache check, because cached filters
      // would reference the wrong table context (CTE table vs main query table)
      if (queryPlan?.preAggregationCTEs) {
        const isInCTE = queryPlan.preAggregationCTEs.some((cte: any) => cte.cube.name === cubeName)
        if (isInCTE) {
          return null // Skip this filter - it's handled in the CTE
        }
      }

      // For array operators, we need the raw column (not isolated SQL)
      // because Drizzle's array functions need column type metadata for proper encoding
      // These CANNOT be cached because the raw column reference is required
      const isArrayOperator = ['arrayContains', 'arrayOverlaps', 'arrayContained'].includes(filterCondition.operator)

      // Try to use cached filter SQL for parameter deduplication
      // This avoids creating duplicate parameters for the same filter values
      // NOTE: Skip cache for array operators (they require raw column)
      // NOTE: We only use cache for non-CTE cubes (checked above)
      if (!isArrayOperator && context.filterCache) {
        const key = getFilterKey(filter)
        const cached = context.filterCache.get(key)
        if (cached) {
          return cached
        }
      }
      const fieldExpr = isArrayOperator
        ? (typeof dimension.sql === 'function' ? dimension.sql(context) : dimension.sql)
        : resolveSqlExpression(dimension.sql, context)

      return this.buildFilterCondition(
        fieldExpr,
        filterCondition.operator,
        filterCondition.values,
        field,
        filterCondition.dateRange
      )
    } else if (filterType === 'where' && measure) {
      // NEVER apply measure filters in WHERE clause - they should only be in HAVING
      // This prevents incorrect behavior where measure filters are applied before aggregation
      return null
    } else if (filterType === 'having' && measure) {
      // HAVING clause: use aggregated measure expression
      // Note: HAVING filters are NOT cached because they use aggregated expressions
      // which may be different depending on the query context (CTE vs main query)
      const measureExpr = this.buildHavingMeasureExpression(cubeName, fieldKey, measure, context, queryPlan)
      return this.buildFilterCondition(
        measureExpr,
        filterCondition.operator,
        filterCondition.values,
        field,
        filterCondition.dateRange
      )
    }

    // Skip if this filter doesn't match the type we're processing
    return null
  }

  /**
   * Build filter condition using Drizzle operators
   * Delegates to FilterBuilder
   */
  private buildFilterCondition(
    fieldExpr: AnyColumn | SQL,
    operator: FilterOperator,
    values: any[],
    field?: any,
    dateRange?: string | string[]
  ): SQL | null {
    return this.filterBuilder.buildFilterCondition(fieldExpr, operator, values, field, dateRange)
  }

  /**
   * Build date range condition for time dimensions
   * Delegates to DateTimeBuilder
   */
  buildDateRangeCondition(
    fieldExpr: AnyColumn | SQL,
    dateRange: string | string[]
  ): SQL | null {
    return this.dateTimeBuilder.buildDateRangeCondition(fieldExpr, dateRange)
  }

  /**
   * Build GROUP BY fields from dimensions and time dimensions
   * Delegates to GroupByBuilder
   */
  buildGroupByFields(
    cubes: Map<string, Cube> | Cube,
    query: SemanticQuery,
    context: QueryContext,
    queryPlan?: any
  ): (SQL | AnyColumn)[] {
    return this.groupByBuilder.buildGroupByFields(cubes, query, context, queryPlan)
  }

  /**
   * Build ORDER BY clause with automatic time dimension sorting
   */
  buildOrderBy(query: SemanticQuery, selectedFields?: string[]): SQL[] {
    const orderClauses: SQL[] = []
    
    // Get all selected fields (measures + dimensions + timeDimensions)
    const allSelectedFields = selectedFields || [
      ...(query.measures || []),
      ...(query.dimensions || []),
      ...(query.timeDimensions?.map(td => td.dimension) || [])
    ]
    
    // First, add explicit ordering from query.order
    if (query.order && Object.keys(query.order).length > 0) {
      for (const [field, direction] of Object.entries(query.order)) {
        // Validate that the field exists in the selected fields
        if (!allSelectedFields.includes(field)) {
          throw new Error(`Cannot order by '${field}': field is not selected in the query`)
        }
        
        // Use Drizzle's built-in asc/desc functions for proper ordering
        const orderClause = direction === 'desc' ? desc(sql.identifier(field)) : asc(sql.identifier(field))
        orderClauses.push(orderClause)
      }
    }
    
    // Then, automatically add time dimension sorting for any time dimensions not explicitly ordered
    if (query.timeDimensions && query.timeDimensions.length > 0) {
      const explicitlyOrderedFields = new Set(Object.keys(query.order || {}))
      
      // Sort time dimensions by their dimension name to ensure consistent ordering
      const sortedTimeDimensions = [...query.timeDimensions].sort((a, b) => 
        a.dimension.localeCompare(b.dimension)
      )
      
      for (const timeDim of sortedTimeDimensions) {
        if (!explicitlyOrderedFields.has(timeDim.dimension)) {
          // Automatically sort time dimensions in ascending order (earliest to latest)
          orderClauses.push(asc(sql.identifier(timeDim.dimension)))
        }
      }
    }
    
    return orderClauses
  }

  /**
   * Collect numeric field names (measures + numeric dimensions) for type conversion
   * Works for both single and multi-cube queries
   */
  collectNumericFields(cubes: Map<string, Cube> | Cube, query: SemanticQuery): string[] {
    const numericFields: string[] = []
    
    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])
    
    // Add all measure fields (they are always numeric)
    if (query.measures) {
      numericFields.push(...query.measures)
    }
    
    // Add numeric dimension fields
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube) {
          const dimension = cube.dimensions[fieldName]
          if (dimension && dimension.type === 'number') {
            // Use the full name (with prefix) as it appears in the result
            numericFields.push(dimensionName)
          }
        }
      }
    }
    
    return numericFields
  }

  /**
   * Apply LIMIT and OFFSET to a query with validation
   * If offset is provided without limit, add a reasonable default limit
   */
  applyLimitAndOffset<T>(query: T, semanticQuery: SemanticQuery): T {
    // If offset is provided without limit, add a reasonable default limit
    let effectiveLimit = semanticQuery.limit
    if (semanticQuery.offset !== undefined && semanticQuery.offset > 0 && effectiveLimit === undefined) {
      effectiveLimit = 50 // Default limit when offset is used
    }
    
    let result = query
    
    if (effectiveLimit !== undefined) {
      if (effectiveLimit < 0) {
        throw new Error('Limit must be non-negative')
      }
      result = (result as any).limit(effectiveLimit)
    }
    
    if (semanticQuery.offset !== undefined) {
      if (semanticQuery.offset < 0) {
        throw new Error('Offset must be non-negative')
      }
      result = (result as any).offset(semanticQuery.offset)
    }

    return result
  }

  /**
   * Public wrapper for buildFilterCondition - used by executor for cache preloading
   * This allows pre-building filter SQL before query construction
   */
  buildFilterConditionPublic(
    fieldExpr: AnyColumn | SQL,
    operator: FilterOperator,
    values: any[],
    field?: any,
    dateRange?: string | string[]
  ): SQL | null {
    return this.buildFilterCondition(fieldExpr, operator, values, field, dateRange)
  }

  /**
   * Build a logical filter (AND/OR) - used by executor for cache preloading
   * This handles nested filter structures and builds combined SQL
   * Delegates to FilterBuilder
   */
  buildLogicalFilter(
    filter: Filter,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL | null {
    return this.filterBuilder.buildLogicalFilter(filter, cubes, context)
  }
}
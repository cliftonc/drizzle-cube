/**
 * Unified Drizzle Query Executor
 * Handles both single and multi-cube queries through a unified execution path
 * Uses QueryBuilder for SQL generation and QueryPlanner for query planning
 */

import { 
  and,
  eq,
  sql,
  SQL,
  sum,
  min,
  max
} from 'drizzle-orm'

import type { 
  SecurityContext,
  SemanticQuery, 
  QueryResult, 
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation,
  DatabaseExecutor
} from './types'

import type { 
  Cube,
  QueryContext,
  QueryPlan
} from './types-drizzle'

import { resolveSqlExpression } from './types-drizzle'

import { QueryBuilder } from './query-builder'
import { QueryPlanner } from './query-planner'
import { validateQueryAgainstCubes } from './compiler'
import type { DatabaseAdapter } from './adapters/base-adapter'

export class QueryExecutor<TSchema extends Record<string, any> = Record<string, any>> {
  private queryBuilder: QueryBuilder<TSchema>
  private queryPlanner: QueryPlanner<TSchema>
  private databaseAdapter: DatabaseAdapter

  constructor(private dbExecutor: DatabaseExecutor<TSchema>) {
    // Get the database adapter from the executor
    this.databaseAdapter = (dbExecutor as any).databaseAdapter
    if (!this.databaseAdapter) {
      throw new Error('DatabaseExecutor must have a databaseAdapter property')
    }
    this.queryBuilder = new QueryBuilder<TSchema>(this.databaseAdapter)
    this.queryPlanner = new QueryPlanner<TSchema>()
  }

  /**
   * Unified query execution method that handles both single and multi-cube queries
   */
  async execute(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
      // Validate query before execution
      const validation = validateQueryAgainstCubes(cubes, query)
      if (!validation.isValid) {
        throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
      }

      // Create query context
      const context: QueryContext<TSchema> = {
        db: this.dbExecutor.db,
        schema: this.dbExecutor.schema!,
        securityContext
      }

      // Create unified query plan (works for both single and multi-cube)
      const queryPlan = this.queryPlanner.createQueryPlan(cubes, query, context)
      
      // Build the query using unified approach
      const builtQuery = this.buildUnifiedQuery(queryPlan, query, context)
      
      // Log SQL for debugging
      const sqlObj = builtQuery.toSQL()
      console.log('Generated SQL:', sqlObj.sql)
      console.log('Parameters:', sqlObj.params)
            
      // Execute query - pass numeric field names for selective conversion
      const numericFields = this.queryBuilder.collectNumericFields(cubes, query)
      const data = await this.dbExecutor.execute(builtQuery, numericFields)
      
      // Process time dimension results
      const mappedData = Array.isArray(data) ? data.map(row => {
        const mappedRow = { ...row }
        if (query.timeDimensions) {
          for (const timeDim of query.timeDimensions) {
            if (timeDim.dimension in mappedRow) {
              let dateValue = mappedRow[timeDim.dimension]  

              // If we have a date that is not 'T' in the center and Z at the end, we need to fix it
              if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                const isoString = dateValue.replace(' ', 'T')
                const finalIsoString = !isoString.endsWith('Z') && !isoString.includes('+') 
                  ? isoString + 'Z' 
                  : isoString
                dateValue = new Date(finalIsoString)
              }

              // Convert time dimension result using database adapter if required
              dateValue = this.databaseAdapter.convertTimeDimensionResult(dateValue)           
              mappedRow[timeDim.dimension] = dateValue
            }
          }
        }
        return mappedRow
      }) : [data]
      
      // Generate annotations for UI
      const annotation = this.generateAnnotations(queryPlan, query)
      
      return {
        data: mappedData,
        annotation
      }
    } catch (error) {      
      console.error('Query execution error details:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack')
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Legacy interface for single cube queries
   */
  async executeQuery(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Convert single cube to map for unified execution
    const cubes = new Map<string, Cube<TSchema>>()
    cubes.set(cube.name, cube)
    return this.execute(cubes, query, securityContext)
  }

  /**
   * Build pre-aggregation CTE for hasMany relationships
   */
  private buildPreAggregationCTE(
    cteInfo: NonNullable<QueryPlan<TSchema>['preAggregationCTEs']>[0],
    query: SemanticQuery,
    context: QueryContext<TSchema>,
    queryPlan: QueryPlan<TSchema>
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
      } else {
        console.warn(`No target column object stored for CTE join key: ${joinKey.targetColumn}`)
      }
    }

    // Add measures with aggregation
    for (const measureName of cteInfo.measures) {
      const [, fieldName] = measureName.split('.')
      if (cube.measures && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]
        const aggregatedExpr = this.queryBuilder.buildMeasureExpression(measure, context)
        // Use just the field name as the column alias (SQL identifiers can't have dots)
        // Explicitly alias the aggregated expression
        cteSelections[fieldName] = sql`${aggregatedExpr}`.as(fieldName)
      } else {
        // This could be a dimension referenced in filters - skip it here
        // as dimensions are handled separately        
      }
    }
    
    // Add dimensions that are requested in the query from this cube
    const cubeName = cube.name
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
      console.warn(`No selections found for CTE ${cteInfo.cteAlias}`)
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
    
    const whereConditions = this.queryBuilder.buildWhereConditions(cube, query, context, cteQueryPlan)
    
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

  // Removed unused getActualJoinTargetColumn method

  /**
   * Build join condition for CTE
   */
  private buildCTEJoinCondition(
    joinCube: QueryPlan<TSchema>['joinCubes'][0],
    cteAlias: string,
    queryPlan: QueryPlan<TSchema>
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
   * Build unified query that works for both single and multi-cube queries
   */
  private buildUnifiedQuery(
    queryPlan: any,
    query: SemanticQuery,
    context: QueryContext<TSchema>
  ) {
    // Build pre-aggregation CTEs if needed
    const ctes: any[] = []
    const cteAliasMap = new Map<string, string>()
    
    if (queryPlan.preAggregationCTEs && queryPlan.preAggregationCTEs.length > 0) {
      for (const cteInfo of queryPlan.preAggregationCTEs) {
        const cte = this.buildPreAggregationCTE(cteInfo, query, context, queryPlan)
        if (cte) {
          ctes.push(cte)
          cteAliasMap.set(cteInfo.cube.name, cteInfo.cteAlias)
        } else {
          console.warn(`Failed to build CTE for ${cteInfo.cube.name}`)
        }
      }
    }
    
    // Get primary cube's base SQL definition
    const primaryCubeBase = queryPlan.primaryCube.sql(context)
    
    // Build selections using QueryBuilder - but modify for CTEs
    const selections = this.queryBuilder.buildSelections(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context
    )
    
    // Replace selections from pre-aggregated cubes with CTE references
    const modifiedSelections = { ...selections }
    if (queryPlan.preAggregationCTEs) {
      for (const cteInfo of queryPlan.preAggregationCTEs) {
        const cubeName = cteInfo.cube.name
        
        // Handle measures from CTE cubes
        for (const measureName of cteInfo.measures) {
          if (modifiedSelections[measureName]) {
            const [, fieldName] = measureName.split('.')
            const cube = this.getCubesFromPlan(queryPlan).get(cubeName)
            if (cube && cube.measures && cube.measures[fieldName]) {
              const measure = cube.measures[fieldName]
              const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
              
              // Use appropriate Drizzle aggregate function based on measure type
              // Since CTE is already pre-aggregated, we need to aggregate the pre-aggregated values
              let aggregatedExpr: SQL
              switch (measure.type) {
                case 'count':
                case 'countDistinct':
                case 'sum':
                  aggregatedExpr = sum(cteColumn)
                  break
                case 'avg':
                  // For average of averages, we should use a weighted average, but for now use simple avg
                  aggregatedExpr = this.databaseAdapter.buildAvg(cteColumn)
                  break
                case 'min':
                  aggregatedExpr = min(cteColumn)
                  break
                case 'max':
                  aggregatedExpr = max(cteColumn)
                  break
                case 'number':
                  // For number type, use sum to combine values
                  aggregatedExpr = sum(cteColumn)
                  break
                default:
                  aggregatedExpr = sum(cteColumn)
              }
              
              modifiedSelections[measureName] = sql`${aggregatedExpr}`.as(measureName) as unknown as SQL
            }
          }
        }
        
        // Handle dimensions from CTE cubes (these need to reference join keys in CTE)
        for (const selectionName in modifiedSelections) {
          const [selectionCubeName, fieldName] = selectionName.split('.')
          if (selectionCubeName === cubeName) {
            // This is a dimension/time dimension from a CTE cube
            const cube = this.getCubesFromPlan(queryPlan).get(cubeName)
            
            // Check if this is a dimension or time dimension from this cube
            const isDimension = cube && cube.dimensions?.[fieldName]
            const isTimeDimension = selectionName.startsWith(cubeName + '.')
            
            if (isDimension || isTimeDimension) {
              // Check if this is one of the join keys that's already in the CTE
              // First try exact name match
              let matchingJoinKey = cteInfo.joinKeys.find((jk: any) => jk.targetColumn === fieldName)
              
              // If no exact match, check if the dimension SQL matches any join key target column
              if (!matchingJoinKey && cube?.dimensions?.[fieldName]) {
                const dimensionSql = cube.dimensions[fieldName].sql
                matchingJoinKey = cteInfo.joinKeys.find((jk: any) => {
                  // Check if the dimension's SQL column matches the join key's target column object
                  return jk.targetColumnObj === dimensionSql
                })
              }
              
              if (matchingJoinKey) {
                // Reference the join key from the CTE using the dimension name
                modifiedSelections[selectionName] = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`.as(selectionName) as unknown as SQL
              } else if (isTimeDimension && cube?.dimensions?.[fieldName]) {
                // This is a time dimension that should be available in the CTE
                modifiedSelections[selectionName] = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`.as(selectionName) as unknown as SQL
              }
              // For non-join-key dimensions from CTE cubes that aren't handled above,
              // the original selection will be kept (which may cause SQL errors if not properly handled)
            }
          }
        }
      }
    }
    
    // Start building the query from the primary cube
    let drizzleQuery = context.db
      .select(modifiedSelections)
      .from(primaryCubeBase.from)
    
    // Add CTEs to the query - Drizzle CTEs are added at the start
    if (ctes.length > 0) {
      drizzleQuery = context.db
        .with(...ctes)
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

    // Add multi-cube joins (inter-cube joins)
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      for (const joinCube of queryPlan.joinCubes) {
        // Check if this cube has been pre-aggregated into a CTE
        const cteAlias = cteAliasMap.get(joinCube.cube.name)
        
        let joinTarget: any
        let joinCondition: any
        
        if (cteAlias) {
          // Join to CTE instead of base table - use sql table reference
          joinTarget = sql`${sql.identifier(cteAlias)}`
          // Build CTE join condition using the CTE alias
          joinCondition = this.buildCTEJoinCondition(joinCube, cteAlias, queryPlan)
        } else {
          // Regular join to base table
          const joinCubeBase = joinCube.cube.sql(context)
          joinTarget = joinCubeBase.from
          joinCondition = joinCube.joinCondition
        }
        
        try {
          switch (joinCube.joinType || 'left') {
            case 'left':
              drizzleQuery = drizzleQuery.leftJoin(joinTarget, joinCondition)
              break
            case 'inner':
              drizzleQuery = drizzleQuery.innerJoin(joinTarget, joinCondition)
              break
            case 'right':
              drizzleQuery = drizzleQuery.rightJoin(joinTarget, joinCondition)
              break
            case 'full':
              drizzleQuery = drizzleQuery.fullJoin(joinTarget, joinCondition)
              break
          }
        } catch (error) {
          // If join fails (e.g., duplicate alias), log and continue
          console.warn(`Multi-cube join failed for ${joinCube.cube.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Collect all WHERE conditions
    const allWhereConditions: SQL[] = []
    
    // Add base WHERE conditions from primary cube
    if (primaryCubeBase.where) {
      allWhereConditions.push(primaryCubeBase.where)
    }

    // Add query-specific WHERE conditions using QueryBuilder
    const queryWhereConditions = this.queryBuilder.buildWhereConditions(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context,
      queryPlan // Pass the queryPlan to handle CTE scenarios
    )
    if (queryWhereConditions.length > 0) {
      allWhereConditions.push(...queryWhereConditions)
    }

    // Apply combined WHERE conditions
    if (allWhereConditions.length > 0) {
      const combinedWhere = allWhereConditions.length === 1 
        ? allWhereConditions[0] 
        : and(...allWhereConditions) as SQL
      drizzleQuery = drizzleQuery.where(combinedWhere)
    }

    // Add GROUP BY using QueryBuilder
    const groupByFields = this.queryBuilder.buildGroupByFields(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context,
      queryPlan // Pass the queryPlan to handle CTE scenarios
    )
    if (groupByFields.length > 0) {
      drizzleQuery = drizzleQuery.groupBy(...groupByFields)
    }

    // Add HAVING conditions using QueryBuilder (after GROUP BY)
    const havingConditions = this.queryBuilder.buildHavingConditions(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context,
      queryPlan // Pass the queryPlan to handle CTE scenarios
    )
    if (havingConditions.length > 0) {
      const combinedHaving = havingConditions.length === 1 
        ? havingConditions[0] 
        : and(...havingConditions) as SQL
      drizzleQuery = drizzleQuery.having(combinedHaving)
    }

    // Add ORDER BY using QueryBuilder
    const orderByFields = this.queryBuilder.buildOrderBy(query)
    if (orderByFields.length > 0) {
      drizzleQuery = drizzleQuery.orderBy(...orderByFields)
    }

    // Add LIMIT and OFFSET using QueryBuilder
    drizzleQuery = this.queryBuilder.applyLimitAndOffset(drizzleQuery, query)

    return drizzleQuery
  }

  /**
   * Convert query plan to cube map for QueryBuilder methods
   */
  private getCubesFromPlan(queryPlan: any): Map<string, Cube<TSchema>> {
    const cubes = new Map<string, Cube<TSchema>>()
    cubes.set(queryPlan.primaryCube.name, queryPlan.primaryCube)
    
    if (queryPlan.joinCubes) {
      for (const joinCube of queryPlan.joinCubes) {
        cubes.set(joinCube.cube.name, joinCube.cube)
      }
    }
    
    return cubes
  }





  /**
   * Generate raw SQL for debugging (without execution) - unified approach
   */
  async generateSQL(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const cubes = new Map<string, Cube<TSchema>>()
    cubes.set(cube.name, cube)
    return this.generateUnifiedSQL(cubes, query, securityContext)
  }

  /**
   * Generate raw SQL for multi-cube queries without execution - unified approach
   */
  async generateMultiCubeSQL(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    return this.generateUnifiedSQL(cubes, query, securityContext)
  }

  /**
   * Generate SQL using unified approach (works for both single and multi-cube)
   */
  private async generateUnifiedSQL(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const context: QueryContext<TSchema> = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema!,
      securityContext
    }

    // Create unified query plan
    const queryPlan = this.queryPlanner.createQueryPlan(cubes, query, context)
    
    // Build the query using unified approach
    const builtQuery = this.buildUnifiedQuery(queryPlan, query, context)
    
    // Extract SQL from the built query
    const sqlObj = builtQuery.toSQL()
    
    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  /**
   * Generate annotations for UI metadata - unified approach
   */
  private generateAnnotations(
    queryPlan: any,
    query: SemanticQuery
  ) {
    const measures: Record<string, MeasureAnnotation> = {}
    const dimensions: Record<string, DimensionAnnotation> = {}
    const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
    
    // Get all cubes involved (primary + join cubes)
    const allCubes = [queryPlan.primaryCube]
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      allCubes.push(...queryPlan.joinCubes.map((jc: any) => jc.cube))
    }
    
    // Generate measure annotations from all cubes
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = allCubes.find(c => c.name === cubeName)
        if (cube && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]
          measures[measureName] = {
            title: measure.title || fieldName,
            shortTitle: measure.title || fieldName,
            type: measure.type
          }
        }
      }
    }
    
    // Generate dimension annotations from all cubes
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = allCubes.find(c => c.name === cubeName)
        if (cube && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          dimensions[dimensionName] = {
            title: dimension.title || fieldName,
            shortTitle: dimension.title || fieldName,
            type: dimension.type
          }
        }
      }
    }
    
    // Generate time dimension annotations from all cubes
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = allCubes.find(c => c.name === cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          timeDimensions[timeDim.dimension] = {
            title: dimension.title || fieldName,
            shortTitle: dimension.title || fieldName,
            type: dimension.type,
            granularity: timeDim.granularity
          }
        }
      }
    }
    
    return {
      measures,
      dimensions,
      segments: {},
      timeDimensions
    }
  }

























}
/**
 * Unified Drizzle Query Executor
 * Handles both single and multi-cube queries with full Drizzle ORM type safety
 */

import { 
  sql, 
  and, 
  or, 
  eq, 
  ne, 
  gt, 
  gte, 
  lt, 
  lte, 
  isNull,
  isNotNull,
  inArray,
  notInArray,
  count, 
  sum, 
  avg, 
  min, 
  max, 
  countDistinct,
  type SQL,
  type AnyColumn
} from 'drizzle-orm'

import type { 
  SecurityContext,
  SemanticQuery, 
  QueryResult, 
  FilterOperator,
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation,
  Filter,
  FilterCondition,
  LogicalFilter,
  DatabaseExecutor,
  TimeGranularity
} from './types'

import type { 
  Cube,
  QueryContext
} from './types-drizzle'

import { resolveSqlExpression } from './types-drizzle'
import { MultiCubeBuilder } from './multi-cube-builder'
import { validateQueryAgainstCubes } from './compiler'
import type { DatabaseAdapter } from './adapters/base-adapter'

export class QueryExecutor<TSchema extends Record<string, any> = Record<string, any>> {
  private multiCubeBuilder: MultiCubeBuilder<TSchema>
  private databaseAdapter: DatabaseAdapter

  constructor(private dbExecutor: DatabaseExecutor<TSchema>) {
    // Get the database adapter from the executor
    this.databaseAdapter = (dbExecutor as any).databaseAdapter
    if (!this.databaseAdapter) {
      throw new Error('DatabaseExecutor must have a databaseAdapter property')
    }
    this.multiCubeBuilder = new MultiCubeBuilder<TSchema>(this.databaseAdapter)
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

      // Analyze which cubes are involved
      const cubesUsed = this.multiCubeBuilder.analyzeCubeUsage(query)
      
      if (cubesUsed.size === 0) {
        throw new Error('No cubes found for query')
      }
      
      if (cubesUsed.size === 1) {
        // Single cube query - use optimized single-cube path
        const cubeName = Array.from(cubesUsed)[0]
        const cube = cubes.get(cubeName)
        if (!cube) {
          throw new Error(`Cube '${cubeName}' not found`)
        }
        return this.executeSingleCube(cube, query, securityContext)
      } else {
        // Multi-cube query - use multi-cube path
        return this.executeMultiCube(cubes, query, securityContext)
      }
    } catch (error) {
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
   * Execute a single cube query
   */
  private async executeSingleCube(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    return this.executeCube(cube, query, securityContext)
  }

  /**
   * Execute a Cube query (dynamic query building)
   */
  private async executeCube(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
      // Create query context
      const context: QueryContext<TSchema> = {
        db: this.dbExecutor.db,
        schema: this.dbExecutor.schema!,
        securityContext
      }

      // Get base query definition
      const baseQuery = cube.sql(context)
      
      // Build dynamic selections
      const selections = this.buildSelections(cube, query, context)
      
      // Start building the query from the base
      let drizzleQuery = context.db
        .select(selections)
        .from(baseQuery.from)

      // Add joins if any
      if (baseQuery.joins) {
        for (const join of baseQuery.joins) {
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

      // Add base WHERE conditions from cube
      if (baseQuery.where) {
        drizzleQuery = drizzleQuery.where(baseQuery.where)
      }

      // Add query-specific WHERE conditions
      const whereConditions = this.buildWhereConditions(cube, query, context)
      if (whereConditions.length > 0) {
        const combinedWhere = whereConditions.length === 1 
          ? whereConditions[0] 
          : and(...whereConditions) as SQL
        drizzleQuery = drizzleQuery.where(combinedWhere)
      }

      // Add GROUP BY if there are aggregations
      const groupByFields = this.buildGroupByFields(cube, query, context)
      if (groupByFields.length > 0) {
        drizzleQuery = drizzleQuery.groupBy(...groupByFields)
      }

      // Add ORDER BY
      const orderByFields = this.buildOrderBy(query)
      if (orderByFields.length > 0) {
        drizzleQuery = drizzleQuery.orderBy(...orderByFields)
      }

      // Add LIMIT and OFFSET
      drizzleQuery = this.applyLimitAndOffset(drizzleQuery, query)

      // Execute query - pass numeric field names for selective conversion
      const numericFields = this.collectNumericFields(cube, query)
      const data = await this.dbExecutor.execute(drizzleQuery, numericFields)
      
      // TODO: Move timestamp formatting to database level using PostgreSQL timezone functions
      // Format timestamps in the result data
      const mappedData = Array.isArray(data) ? data.map(row => {
        const mappedRow = { ...row }
        if (query.timeDimensions) {
          for (const timeDim of query.timeDimensions) {
            if (timeDim.dimension in mappedRow) {
              let dateValue = mappedRow[timeDim.dimension]
              
              // Convert PostgreSQL timestamp format to ISO format for consistency
              if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                dateValue = dateValue.replace(' ', 'T')
                // Add 'Z' to indicate UTC timezone if not already present
                if (!dateValue.endsWith('Z') && !dateValue.includes('+')) {
                  dateValue = dateValue + 'Z'
                }
              }
              
              mappedRow[timeDim.dimension] = dateValue
            }
          }
        }
        return mappedRow
      }) : [data]
      
      // Generate annotations for UI
      const annotation = this.generateAnnotations(cube, query)
      
      return {
        data: mappedData,
        annotation
      }
    } catch (error) {
      throw new Error(`Cube query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  /**
   * Execute multi-cube query using JOIN resolution
   */
  private async executeMultiCube(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Build the query using the reusable method
    const builtQuery = this.buildMultiCubeQuery(cubes, query, securityContext)
    // Execute the final query - pass numeric field names for selective conversion
    const numericFields = this.collectNumericFieldsMultiCube(cubes, query)
    const data = await this.dbExecutor.execute(builtQuery, numericFields)
    
    // Build context for annotation generation
    const context: QueryContext<TSchema> = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema!,
      securityContext
    }
    
    // Generate query plan for annotations
    const queryPlan = this.multiCubeBuilder.buildMultiCubeQueryPlan(cubes, query, context)
    
    // Generate annotations for UI (using all cubes)
    const annotation = this.generateMultiCubeAnnotations(queryPlan, query)
    
    return {
      data: Array.isArray(data) ? data : [data],
      annotation
    }
  }

  /**
   * Generate raw SQL for debugging (without execution)
   */
  async generateSQL(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    return this.generateCubeSQL(cube, query, securityContext)
  }

  /**
   * Generate raw SQL for multi-cube queries without execution
   */
  async generateMultiCubeSQL(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    // Build the query using the same logic as executeMultiCube but extract SQL
    const builtQuery = this.buildMultiCubeQuery(cubes, query, securityContext)
    
    // Extract SQL from the built query
    const sqlObj = builtQuery.toSQL()
    
    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  /**
   * Build multi-cube query (extracted from executeMultiCube for reuse)
   */
  private buildMultiCubeQuery(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ) {
    const context: QueryContext<TSchema> = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema!,
      securityContext
    }

    const queryPlan = this.multiCubeBuilder.buildMultiCubeQueryPlan(cubes, query, context)
    
    // Build the multi-cube query using CTEs
    const primaryCubeBase = queryPlan.primaryCube.sql(context)
    
    // Build the inner select query with all conditions
    let innerQuery = context.db.select(queryPlan.selections)
      .from(primaryCubeBase.from)

    // Add joins if any from primary cube base
    if (primaryCubeBase.joins) {
      for (const join of primaryCubeBase.joins) {
        switch (join.type || 'left') {
          case 'left':
            innerQuery = innerQuery.leftJoin(join.table, join.on)
            break
          case 'inner':
            innerQuery = innerQuery.innerJoin(join.table, join.on)
            break
          case 'right':
            innerQuery = innerQuery.rightJoin(join.table, join.on)
            break
          case 'full':
            innerQuery = innerQuery.fullJoin(join.table, join.on)
            break
          default:
            innerQuery = innerQuery.leftJoin(join.table, join.on)
        }
      }
    }

    // Add multi-cube joins from query plan (these represent cross-cube relationships)
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      for (const joinCube of queryPlan.joinCubes) {
        const joinCubeBase = joinCube.cube.sql(context)
        
        try {
          switch (joinCube.joinType || 'left') {
            case 'left':
              innerQuery = innerQuery.leftJoin(joinCubeBase.from, joinCube.joinCondition)
              break
            case 'inner':
              innerQuery = innerQuery.innerJoin(joinCubeBase.from, joinCube.joinCondition)
              break
            case 'right':
              innerQuery = innerQuery.rightJoin(joinCubeBase.from, joinCube.joinCondition)
              break
            case 'full':
              innerQuery = innerQuery.fullJoin(joinCubeBase.from, joinCube.joinCondition)
              break
          }
        } catch (error) {
          // If join fails (e.g., duplicate alias), log and continue
          // This might be expected in some multi-cube scenarios
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

    // Add query-specific WHERE conditions  
    if (queryPlan.whereConditions.length > 0) {
      allWhereConditions.push(...queryPlan.whereConditions)
    }

    // Apply combined WHERE conditions
    if (allWhereConditions.length > 0) {
      const combinedWhere = allWhereConditions.length === 1 
        ? allWhereConditions[0] 
        : and(...allWhereConditions) as SQL
      innerQuery = innerQuery.where(combinedWhere)
    }

    // Add GROUP BY if there are aggregations
    if (queryPlan.groupByFields.length > 0) {
      innerQuery = innerQuery.groupBy(...queryPlan.groupByFields)
    }

    // Add ORDER BY
    const orderByFields = this.buildOrderBy(query)
    if (orderByFields.length > 0) {
      innerQuery = innerQuery.orderBy(...orderByFields)
    }

    // Add LIMIT and OFFSET
    innerQuery = this.applyLimitAndOffset(innerQuery, query)

    return innerQuery
  }

  /**
   * Collect numeric field names (measures + numeric dimensions) for type conversion
   */
  private collectNumericFields(cube: Cube<TSchema>, query: SemanticQuery): string[] {
    const numericFields: string[] = []
    
    // Add all measure fields (they are always numeric)
    if (query.measures) {
      numericFields.push(...query.measures)
    }
    
    // Add numeric dimension fields
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        // Strip cube prefix to get the actual dimension key
        const dimensionKey = dimensionName.includes('.') ? dimensionName.split('.')[1] : dimensionName
        const dimension = cube.dimensions[dimensionKey]
        if (dimension && dimension.type === 'number') {
          // Use the full name (with prefix) as it appears in the result
          numericFields.push(dimensionName)
        }
      }
    }
    
    return numericFields
  }

  /**
   * Collect numeric field names for multi-cube queries
   */
  private collectNumericFieldsMultiCube(cubes: Map<string, Cube<TSchema>>, query: SemanticQuery): string[] {
    const numericFields: string[] = []
    
    // Add all measure fields (they are always numeric)
    if (query.measures) {
      numericFields.push(...query.measures)
    }
    
    // Add numeric dimension fields
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        // Strip cube prefix to get the actual dimension key
        const dimensionKey = dimensionName.includes('.') ? dimensionName.split('.')[1] : dimensionName
        // Find which cube contains this dimension
        for (const cube of cubes.values()) {
          const dimension = cube.dimensions[dimensionKey]
          if (dimension && dimension.type === 'number') {
            // Use the full name (with prefix) as it appears in the result
            numericFields.push(dimensionName)
            break // Found it, no need to check other cubes
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
  private applyLimitAndOffset<T>(query: T, semanticQuery: SemanticQuery): T {
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
   * Generate SQL for Cube
   */
  private async generateCubeSQL(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    // Build the same query as executeSingleCube but extract SQL
    const context: QueryContext<TSchema> = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema!,
      securityContext
    }

    const baseQuery = cube.sql(context)
    const selections = this.buildSelections(cube, query, context)
    
    let drizzleQuery = context.db
      .select(selections)
      .from(baseQuery.from)

    // Add all the same query building steps as in executeCube
    if (baseQuery.joins) {
      for (const join of baseQuery.joins) {
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

    if (baseQuery.where) {
      drizzleQuery = drizzleQuery.where(baseQuery.where)
    }

    const whereConditions = this.buildWhereConditions(cube, query, context)
    if (whereConditions.length > 0) {
      const combinedWhere = whereConditions.length === 1 
        ? whereConditions[0] 
        : and(...whereConditions) as SQL
      drizzleQuery = drizzleQuery.where(combinedWhere)
    }

    const groupByFields = this.buildGroupByFields(cube, query, context)
    if (groupByFields.length > 0) {
      drizzleQuery = drizzleQuery.groupBy(...groupByFields)
    }

    const orderByFields = this.buildOrderBy(query)
    if (orderByFields.length > 0) {
      drizzleQuery = drizzleQuery.orderBy(...orderByFields)
    }

    if (query.limit !== undefined) {
      if (query.limit < 0) {
        throw new Error('Limit must be non-negative')
      }
      drizzleQuery = drizzleQuery.limit(query.limit)
    }
    
    if (query.offset !== undefined) {
      if (query.offset < 0) {
        throw new Error('Offset must be non-negative')
      }
      drizzleQuery = drizzleQuery.offset(query.offset)
    }

    // Extract SQL using Drizzle's toSQL method
    const sqlResult = drizzleQuery.toSQL()
    return {
      sql: sqlResult.sql,
      params: sqlResult.params
    }
  }





  /**
   * Build dynamic selections for Cube measures and dimensions
   */
  private buildSelections(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): Record<string, SQL | AnyColumn> {
    const selections: Record<string, SQL | AnyColumn> = {}
    
    // Add dimensions
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const sqlExpr = resolveSqlExpression(dimension.sql, context)
          // Use explicit alias for dimension expressions so they can be referenced in ORDER BY
          selections[dimensionName] = sql`${sqlExpr}`.as(dimensionName) as unknown as SQL
        }
      }
    }
    
    // Add measures with aggregations
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]
          const aggregatedExpr = this.buildMeasureExpression(measure, context)
          // Use explicit alias for measure expressions so they can be referenced in ORDER BY
          selections[measureName] = sql`${aggregatedExpr}`.as(measureName) as unknown as SQL
        }
      }
    }
    
    // Add time dimensions with granularity
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName]) {
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
   * Build measure expression with aggregation and filters for Cube
   */
  private buildMeasureExpression(
    measure: any, 
    context: QueryContext<TSchema>
  ): SQL {
    let baseExpr = resolveSqlExpression(measure.sql, context)
    
    // Apply measure filters if they exist
    if (measure.filters && measure.filters.length > 0) {
      const filterConditions = measure.filters.map((filter: (ctx: QueryContext<TSchema>) => SQL) => {
        return filter(context)
      })
      
      // Use CASE WHEN for conditional aggregation
      baseExpr = sql`CASE WHEN ${and(...filterConditions)} THEN ${baseExpr} END`
    }
    
    // Apply aggregation function based on measure type
    switch (measure.type) {
      case 'count':
        return count(baseExpr)
      case 'countDistinct':
        return countDistinct(baseExpr)
      case 'sum':
        return sum(baseExpr)
      case 'avg':
        return avg(baseExpr)
      case 'min':
        return min(baseExpr)
      case 'max':
        return max(baseExpr)
      case 'number':
        return baseExpr as SQL
      default:
        return count(baseExpr)
    }
  }

  /**
   * Build time dimension expression with granularity using database adapter
   */
  private buildTimeDimensionExpression(
    dimensionSql: any,
    granularity: string | undefined,
    context: QueryContext<TSchema>
  ): SQL {
    const baseExpr = resolveSqlExpression(dimensionSql, context)
    
    if (!granularity) {
      return sql`${baseExpr}`
    }
    
    // Use database adapter for database-specific time dimension building
    return this.databaseAdapter.buildTimeDimension(granularity as TimeGranularity, baseExpr)
  }

  /**
   * Build WHERE conditions from semantic query filters (Cube)
   */
  private buildWhereConditions(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): SQL[] {
    const conditions: SQL[] = []
    
    // Process regular filters
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        const condition = this.processFilter(filter, cube, context)
        if (condition) {
          conditions.push(condition)
        }
      }
    }

    // Process time dimension date range filters
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName] && timeDim.dateRange) {
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
   * Process a single filter for Cube (basic or logical)
   */
  private processFilter(
    filter: Filter,
    cube: Cube<TSchema>,
    context: QueryContext<TSchema>
  ): SQL | null {
    // Handle logical filters (AND/OR)
    if ('and' in filter || 'or' in filter) {
      const logicalFilter = filter as LogicalFilter
      
      if (logicalFilter.and) {
        const conditions = logicalFilter.and
          .map(f => this.processFilter(f, cube, context))
          .filter((condition): condition is SQL => condition !== null)
        return conditions.length > 0 ? and(...conditions) as SQL : null
      }
      
      if (logicalFilter.or) {
        const conditions = logicalFilter.or
          .map(f => this.processFilter(f, cube, context))
          .filter((condition): condition is SQL => condition !== null)
        return conditions.length > 0 ? or(...conditions) as SQL : null
      }
    }
    
    // Handle simple filter condition
    const filterCondition = filter as FilterCondition
    const [cubeName, fieldKey] = filterCondition.member.split('.')
    if (cubeName !== cube.name) return null
    
    // Find the field in dimensions or measures
    const field = cube.dimensions[fieldKey] || cube.measures[fieldKey]
    if (!field) return null
    
    const fieldExpr = resolveSqlExpression(field.sql, context)
    return this.buildFilterCondition(fieldExpr, filterCondition.operator, filterCondition.values)
  }


  /**
   * Build filter condition using Drizzle operators
   */
  private buildFilterCondition(
    fieldExpr: AnyColumn | SQL, 
    operator: FilterOperator, 
    values: any[]
  ): SQL | null {
    // Handle empty values
    if (!values || values.length === 0) {
      // For empty equals filter, return condition that matches nothing
      if (operator === 'equals') {
        return sql`FALSE`
      }
      return null
    }

    // Filter out empty/null values and values containing null bytes for security
    const filteredValues = values.filter(v => {
      if (v === null || v === undefined || v === '') return false
      // Reject values containing null bytes for security
      if (typeof v === 'string' && v.includes('\x00')) return false
      return true
    })
    
    // For certain operators, we need at least one non-empty value
    if (filteredValues.length === 0 && !['set', 'notSet'].includes(operator)) {
      // For empty equals filter, return condition that matches nothing
      if (operator === 'equals') {
        return sql`FALSE`
      }
      return null
    }

    const value = filteredValues[0]
    
    switch (operator) {
      case 'equals':
        if (filteredValues.length > 1) {
          return inArray(fieldExpr as AnyColumn, filteredValues)
        } else if (filteredValues.length === 1) {
          return eq(fieldExpr as AnyColumn, value)
        }
        return sql`FALSE`
      case 'notEquals':
        if (filteredValues.length > 1) {
          return notInArray(fieldExpr as AnyColumn, filteredValues)
        } else if (filteredValues.length === 1) {
          return ne(fieldExpr as AnyColumn, value)
        }
        return null
      case 'contains':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'contains', value)
      case 'notContains':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notContains', value)
      case 'startsWith':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'startsWith', value)
      case 'endsWith':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'endsWith', value)
      case 'gt':
        return gt(fieldExpr as AnyColumn, value)
      case 'gte':
        return gte(fieldExpr as AnyColumn, value)
      case 'lt':
        return lt(fieldExpr as AnyColumn, value)
      case 'lte':
        return lte(fieldExpr as AnyColumn, value)
      case 'set':
        return isNotNull(fieldExpr as AnyColumn)
      case 'notSet':
        return isNull(fieldExpr as AnyColumn)
      case 'inDateRange':
        if (filteredValues.length >= 2) {
          const startDate = this.normalizeDate(filteredValues[0])
          const endDate = this.normalizeDate(filteredValues[1])
          if (startDate && endDate) {
            return and(
              gte(fieldExpr as AnyColumn, startDate), 
              lte(fieldExpr as AnyColumn, endDate)
            ) as SQL
          }
        }
        return null
      case 'beforeDate': {
        const beforeValue = this.normalizeDate(value)
        if (beforeValue) {
          return lt(fieldExpr as AnyColumn, beforeValue)
        }
        return null
      }
      case 'afterDate': {
        const afterValue = this.normalizeDate(value)
        if (afterValue) {
          return gt(fieldExpr as AnyColumn, afterValue)
        }
        return null
      }
      default:
        return null
    }
  }

  /**
   * Build date range condition for time dimensions
   */
  private buildDateRangeCondition(
    fieldExpr: AnyColumn | SQL,
    dateRange: string | string[]
  ): SQL | null {
    if (!dateRange) return null

    // Handle array date range first
    if (Array.isArray(dateRange) && dateRange.length >= 2) {
      const startDate = this.normalizeDate(dateRange[0])
      const endDate = this.normalizeDate(dateRange[1])
      
      if (!startDate || !endDate) return null
      
      return and(
        gte(fieldExpr as AnyColumn, startDate),
        lte(fieldExpr as AnyColumn, endDate)
      ) as SQL
    }

    // Handle string date range
    if (typeof dateRange === 'string') {
      // Handle relative date expressions
      const relativeDates = this.parseRelativeDateRange(dateRange)
      if (relativeDates) {
        return and(
          gte(fieldExpr as AnyColumn, relativeDates.start),
          lte(fieldExpr as AnyColumn, relativeDates.end)
        ) as SQL
      }

      // Handle absolute date (single date)
      const normalizedDate = this.normalizeDate(dateRange)
      if (!normalizedDate) return null
      
      // For single date, create range for the whole day
      const startOfDay = new Date(normalizedDate)
      startOfDay.setUTCHours(0, 0, 0, 0)  // Ensure we start at midnight UTC
      const endOfDay = new Date(normalizedDate)
      endOfDay.setUTCHours(23, 59, 59, 999)  // Ensure we end at 11:59:59.999 UTC
      
      return and(
        gte(fieldExpr as AnyColumn, startOfDay),
        lte(fieldExpr as AnyColumn, endOfDay)
      ) as SQL
    }

    return null
  }

  /**
   * Parse relative date range expressions like "last 7 days", "this month"
   */
  private parseRelativeDateRange(dateRange: string): { start: Date; end: Date } | null {
    const now = new Date()
    const lowerRange = dateRange.toLowerCase().trim()

    // Handle "last N days" pattern
    const lastDaysMatch = lowerRange.match(/^last\s+(\d+)\s+days?$/)
    if (lastDaysMatch) {
      const days = parseInt(lastDaysMatch[1], 10)
      const start = new Date(now)
      start.setDate(now.getDate() - days)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "this month" pattern
    if (lowerRange === 'this month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }

    // Handle "last N months" pattern
    const lastMonthsMatch = lowerRange.match(/^last\s+(\d+)\s+months?$/)
    if (lastMonthsMatch) {
      const months = parseInt(lastMonthsMatch[1], 10)
      const start = new Date(now.getFullYear(), now.getMonth() - months, 1, 0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "this year" pattern
    if (lowerRange === 'this year') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { start, end }
    }

    // Handle "last N years" pattern
    const lastYearsMatch = lowerRange.match(/^last\s+(\d+)\s+years?$/)
    if (lastYearsMatch) {
      const years = parseInt(lastYearsMatch[1], 10)
      const start = new Date(now.getFullYear() - years, 0, 1, 0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    return null
  }

  /**
   * Normalize date values to handle both string and Date objects
   * For PostgreSQL timestamp fields, Drizzle expects Date objects
   */
  private normalizeDate(value: any): Date | null {
    if (!value) return null
    
    // If it's already a Date object, validate and return it
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        return value
      }
      return null
    }
    
    // If it's a string, try to parse it as a Date
    if (typeof value === 'string') {
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
      return null
    }
    
    // Try to parse any other type as date
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
    
    // Invalid date value
    return null
  }

  /**
   * Build GROUP BY fields from dimensions and time dimensions (Cube)
   */
  private buildGroupByFields(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): (SQL | AnyColumn)[] {
    const groupFields: (SQL | AnyColumn)[] = []
    
    // Add dimensions to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const dimensionExpr = resolveSqlExpression(dimension.sql, context)
          groupFields.push(dimensionExpr)
        }
      }
    }
    
    // Add time dimensions to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const timeExpr = this.buildTimeDimensionExpression(
            dimension.sql, 
            timeDim.granularity, 
            context
          )
          groupFields.push(timeExpr)
        }
      }
    }
    
    return groupFields
  }


  /**
   * Build ORDER BY clause with automatic time dimension sorting
   */
  private buildOrderBy(query: SemanticQuery, selectedFields?: string[]): SQL[] {
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
        
        const directionSQL = direction === 'desc' ? sql`DESC` : sql`ASC`
        // Use quoted identifier for proper alias reference
        orderClauses.push(sql`${sql.identifier(field)} ${directionSQL}`)
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
          orderClauses.push(sql`${sql.identifier(timeDim.dimension)} ASC`)
        }
      }
    }
    
    return orderClauses
  }


  /**
   * Generate annotations for UI metadata
   */
  private generateAnnotations(
    cube: Cube<TSchema>, 
    query: SemanticQuery
  ) {
    const measures: Record<string, MeasureAnnotation> = {}
    const dimensions: Record<string, DimensionAnnotation> = {}
    const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
    
    // Generate measure annotations
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]
          measures[measureName] = {
            title: measure.title || fieldName,
            shortTitle: measure.title || fieldName,
            type: measure.type
          }
        }
      }
    }
    
    // Generate dimension annotations
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          dimensions[dimensionName] = {
            title: dimension.title || fieldName,
            shortTitle: dimension.title || fieldName,
            type: dimension.type
          }
        }
      }
    }
    
    // Generate time dimension annotations
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[fieldName]) {
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

  /**
   * Generate annotations for multi-cube queries
   */
  private generateMultiCubeAnnotations(
    queryPlan: any,
    query: SemanticQuery
  ) {
    const measures: Record<string, MeasureAnnotation> = {}
    const dimensions: Record<string, DimensionAnnotation> = {}
    const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
    
    // Get all cubes involved (primary + join cubes)
    const allCubes = [queryPlan.primaryCube]
    if (queryPlan.joinCubes) {
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
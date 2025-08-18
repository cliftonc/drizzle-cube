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
  DatabaseExecutor
} from './types'

import type { 
  Cube,
  CubeWithJoins,
  QueryContext
} from './types-drizzle'

import { resolveSqlExpression } from './types-drizzle'
import { MultiCubeBuilder } from './multi-cube-builder'

export class QueryExecutor<TSchema extends Record<string, any> = Record<string, any>> {
  private multiCubeBuilder: MultiCubeBuilder<TSchema>

  constructor(private dbExecutor: DatabaseExecutor<TSchema>) {
    this.multiCubeBuilder = new MultiCubeBuilder<TSchema>()
  }

  /**
   * Unified query execution method that handles both single and multi-cube queries
   */
  async execute(
    cubes: Map<string, CubeWithJoins<TSchema>>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
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
      if (query.limit) {
        drizzleQuery = drizzleQuery.limit(query.limit)
      }
      
      if (query.offset) {
        drizzleQuery = drizzleQuery.offset(query.offset)
      }

      // Execute query
      const data = await this.dbExecutor.execute(drizzleQuery)
      
      // Generate annotations for UI
      const annotation = this.generateAnnotations(cube, query)
      
      return {
        data: Array.isArray(data) ? data : [data],
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
    cubes: Map<string, CubeWithJoins<TSchema>>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Build the query using the reusable method
    const builtQuery = this.buildMultiCubeQuery(cubes, query, securityContext)

    // Execute the final query
    const data = await this.dbExecutor.execute(builtQuery)
    
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
    cubes: Map<string, CubeWithJoins<TSchema>>,
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
    cubes: Map<string, CubeWithJoins<TSchema>>,
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

    // Add multi-cube joins from query plan
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      for (const joinCube of queryPlan.joinCubes) {
        const joinCubeBase = joinCube.cube.sql(context)
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

    // Add LIMIT if specified
    if (query.limit) {
      innerQuery = innerQuery.limit(query.limit)
    }

    // Add OFFSET if specified
    if (query.offset) {
      innerQuery = innerQuery.offset(query.offset)
    }

    return innerQuery
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

    if (query.limit) {
      drizzleQuery = drizzleQuery.limit(query.limit)
    }
    
    if (query.offset) {
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
          selections[dimensionName] = sqlExpr
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
          selections[measureName] = aggregatedExpr
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
          selections[timeDim.dimension] = timeExpr
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
   * Build time dimension expression with granularity
   */
  private buildTimeDimensionExpression(
    dimensionSql: any,
    granularity: string | undefined,
    context: QueryContext<TSchema>
  ): SQL {
    const baseExpr = resolveSqlExpression(dimensionSql, context)
    
    if (!granularity) {
      return baseExpr as SQL
    }
    
    // TODO: Make this database-agnostic based on dbExecutor type
    // For now, using PostgreSQL DATE_TRUNC syntax
    switch (granularity) {
      case 'year':
        return sql`DATE_TRUNC('year', ${baseExpr}::timestamptz)`
      case 'quarter':
        return sql`DATE_TRUNC('quarter', ${baseExpr}::timestamptz)`
      case 'month':
        return sql`DATE_TRUNC('month', ${baseExpr}::timestamptz)`
      case 'week':
        return sql`DATE_TRUNC('week', ${baseExpr}::timestamptz)`
      case 'day':
        return sql`DATE_TRUNC('day', ${baseExpr}::timestamptz)`
      case 'hour':
        return sql`DATE_TRUNC('hour', ${baseExpr}::timestamptz)`
      case 'minute':
        return sql`DATE_TRUNC('minute', ${baseExpr}::timestamptz)`
      case 'second':
        return sql`DATE_TRUNC('second', ${baseExpr}::timestamptz)`
      default:
        return baseExpr as SQL
    }
  }

  /**
   * Build WHERE conditions from semantic query filters (Cube)
   */
  private buildWhereConditions(
    cube: Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): SQL[] {
    if (!query.filters || query.filters.length === 0) {
      return []
    }

    const conditions: SQL[] = []
    
    for (const filter of query.filters) {
      const condition = this.processFilter(filter, cube, context)
      if (condition) {
        conditions.push(condition)
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
    const value = values[0]
    
    switch (operator) {
      case 'equals':
        if (values.length > 1) {
          return sql`${fieldExpr} IN ${values}`
        } else {
          return eq(fieldExpr as AnyColumn, value)
        }
      case 'notEquals':
        if (values.length > 1) {
          return sql`${fieldExpr} NOT IN ${values}`
        } else {
          return ne(fieldExpr as AnyColumn, value)
        }
      case 'contains':
        return sql`${fieldExpr} ILIKE ${'%' + value + '%'}`
      case 'notContains':
        return sql`${fieldExpr} NOT ILIKE ${'%' + value + '%'}`
      case 'startsWith':
        return sql`${fieldExpr} ILIKE ${value + '%'}`
      case 'endsWith':
        return sql`${fieldExpr} ILIKE ${'%' + value}`
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
        if (values.length >= 2) {
          return and(
            gte(fieldExpr as AnyColumn, values[0]), 
            lte(fieldExpr as AnyColumn, values[1])
          ) as SQL
        }
        return null
      case 'beforeDate':
        return lt(fieldExpr as AnyColumn, value)
      case 'afterDate':
        return gt(fieldExpr as AnyColumn, value)
      default:
        return null
    }
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
   * Build ORDER BY clause
   */
  private buildOrderBy(query: SemanticQuery): SQL[] {
    if (!query.order || Object.keys(query.order).length === 0) {
      return []
    }
    
    const orderClauses: SQL[] = []
    
    for (const [field, direction] of Object.entries(query.order)) {
      const fieldRef = sql.identifier(field)
      const directionSQL = direction === 'desc' ? sql`DESC` : sql`ASC`
      orderClauses.push(sql`${fieldRef} ${directionSQL}`)
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
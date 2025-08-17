/**
 * Semantic Query Executor
 * Drizzle ORM-first query execution with type safety and security
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
  type SQL
} from 'drizzle-orm'

import type { 
  SemanticCube, 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  DatabaseExecutor,
  FilterOperator,
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation,
  QueryContext,
  Filter,
  FilterCondition,
  LogicalFilter,
  DrizzleColumn
} from './types'

export class SemanticQueryExecutor<TSchema extends Record<string, any> = Record<string, any>> {
  constructor(private dbExecutor: DatabaseExecutor<TSchema>) {}

  async executeQuery(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
      // Create query context with Drizzle integration
      const context: QueryContext<TSchema> = {
        db: this.dbExecutor.db,
        schema: this.dbExecutor.schema!,
        securityContext,
        query,
        cube: cube as any // Will be properly typed in compiler
      }

      // Generate SQL string like the original implementation
      const sqlQuery = await this.buildDrizzleQuery(cube, query, context)
      
      // Execute query using Drizzle with sql.raw() like the original implementation
      const data = await this.dbExecutor.execute(sql.raw(sqlQuery))
      
      // Generate annotations
      const annotation = this.generateAnnotations(cube, query)
      
      return {
        data,
        annotation
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate raw SQL for debugging (without execution)
   */
  async generateSQL(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    try {
      const context: QueryContext<TSchema> = {
        db: this.dbExecutor.db,
        schema: this.dbExecutor.schema!,
        securityContext,
        query,
        cube: cube as any
      }

      const drizzleQuery = await this.buildDrizzleQuery(cube, query, context)
      
      // For debugging, we need to extract SQL manually 
      // Since Drizzle SQL objects don't expose raw sql/params directly
      return {
        sql: drizzleQuery.toString(),
        params: [] // Params are embedded in Drizzle SQL objects
      }
    } catch (error) {
      throw new Error(`SQL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build complete SQL string from semantic cube and query (like original implementation)
   */
  private async buildDrizzleQuery(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): Promise<string> {
    // Get base SQL from cube (with security context substitution)
    const baseQuery = await this.resolveBaseQuery(cube, context)
    
    // Build SELECT fields as strings
    const selectFields = this.buildSelectFieldsAsStrings(cube, query, context)
    
    // Build WHERE conditions as strings  
    const whereConditions = this.buildWhereConditionsAsStrings(cube, query, context)
    
    // Build GROUP BY fields as strings
    const groupByFields = this.buildGroupByFieldsAsStrings(cube, query, context)
    
    // Build ORDER BY clause as string
    const orderByClause = this.buildOrderByClauseAsString(query)
    
    // Convert baseQuery to string
    const baseQueryString = typeof baseQuery === 'string' ? baseQuery : baseQuery.toString()
    
    // Construct the complete query as string (like original implementation)
    const queryParts = [
      `SELECT ${selectFields.join(', ')}`,
      `FROM (${baseQueryString}) as base_query`
    ]
    
    if (whereConditions.length > 0) {
      queryParts.push(`WHERE ${whereConditions.join(' AND ')}`)
    }
    
    if (groupByFields.length > 0) {
      queryParts.push(`GROUP BY ${groupByFields.join(', ')}`)
    }
    
    if (orderByClause) {
      queryParts.push(`ORDER BY ${orderByClause}`)
    }
    
    if (query.limit) {
      queryParts.push(`LIMIT ${query.limit}`)
      if (query.offset) {
        queryParts.push(`OFFSET ${query.offset}`)
      }
    }
    
    return queryParts.filter(Boolean).join(' ')
  }
  

  /**
   * Resolve base SQL from cube definition (simplified like original implementation)
   */
  private async resolveBaseQuery(
    cube: SemanticCube<TSchema>, 
    context: QueryContext<TSchema>
  ): Promise<string> {
    if (typeof cube.sql === 'function') {
      const result = await cube.sql(context)
      
      if (typeof result === 'string') {
        return result
      } else if (result && typeof result === 'object') {
        // For function-based SQL that returns a query builder, we need to extract the SQL
        if ('toSQL' in result && typeof result.toSQL === 'function') {
          // Get the compiled SQL with parameters
          const compiledSQL = result.toSQL()
          // Interpolate parameters into the SQL string
          return this.interpolateParameters(compiledSQL.sql, compiledSQL.params)
        } else {
          // Fallback like original implementation
          return 'SELECT 1'
        }
      } else {
        return 'SELECT 1'
      }
    } else if (typeof cube.sql === 'string') {
      // Substitute security context variables in string SQL
      return this.substituteSecurityVariables(cube.sql, context.securityContext)
    } else {
      // Convert SQL object to string if needed
      return cube.sql.toString()
    }
  }

  /**
   * Interpolate parameters into SQL string for safe subquery usage
   */
  private interpolateParameters(sqlTemplate: string, params: any[]): string {
    let result = sqlTemplate
    let paramIndex = 0
    
    // Replace $1, $2, etc. with actual parameter values
    result = result.replace(/\$(\d+)/g, (match, number) => {
      const index = parseInt(number, 10) - 1
      if (index >= 0 && index < params.length) {
        const param = params[index]
        
        // Handle different parameter types
        if (param === null || param === undefined) {
          return 'NULL'
        } else if (typeof param === 'string') {
          // Escape single quotes and wrap in quotes
          return `'${param.replace(/'/g, "''")}'`
        } else if (typeof param === 'number') {
          return param.toString()
        } else if (typeof param === 'boolean') {
          return param.toString()
        } else if (param instanceof Date) {
          return `'${param.toISOString()}'`
        } else {
          // For other types, convert to string and quote
          return `'${String(param).replace(/'/g, "''")}'`
        }
      }
      return match // Keep original if parameter not found
    })
    
    return result
  }

  /**
   * Build SELECT fields as strings (adapted from original implementation)
   */
  private buildSelectFieldsAsStrings(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): string[] {
    const selectClauses: string[] = []
    
    // Add dimensions to select
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const sqlExpr = this.resolveSQLExpressionAsString(dimension.sql, context)
          selectClauses.push(`${sqlExpr} as "${dimensionName}"`)
        }
      }
    }
    
    // Add measures to select
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, measureKey] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[measureKey]) {
          const measure = cube.measures[measureKey]
          const sqlExpr = this.buildMeasureExpressionAsString(measure, context)
          selectClauses.push(`${sqlExpr} as "${measureName}"`)
        }
      }
    }
    
    // Add time dimensions to select
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const sqlExpr = this.buildTimeDimensionExpressionAsString(dimension, timeDim.granularity, context)
          const alias = timeDim.dimension
          selectClauses.push(`${sqlExpr} as "${alias}"`)
        }
      }
    }
    
    // Default select if nothing specified
    if (selectClauses.length === 0) {
      selectClauses.push('COUNT(*) as count')
    }
    
    return selectClauses
  }

  /**
   * Build WHERE conditions as strings
   */
  private buildWhereConditionsAsStrings(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): string[] {
    if (!query.filters || query.filters.length === 0) {
      return []
    }

    const conditions: string[] = []
    
    for (const filter of query.filters) {
      const condition = this.processFilterAsString(filter, cube, context)
      if (condition) {
        conditions.push(condition)
      }
    }
    
    return conditions
  }

  /**
   * Build GROUP BY fields as strings
   */
  private buildGroupByFieldsAsStrings(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): string[] {
    const groupByFields: string[] = []
    
    // Group by dimensions
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const sqlExpr = this.resolveSQLExpressionAsString(dimension.sql, context)
          groupByFields.push(sqlExpr)
        }
      }
    }
    
    // Group by time dimensions
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const sqlExpr = this.buildTimeDimensionExpressionAsString(dimension, timeDim.granularity, context)
          groupByFields.push(sqlExpr)
        }
      }
    }
    
    return groupByFields
  }

  /**
   * Build ORDER BY clause as string
   */
  private buildOrderByClauseAsString(query: SemanticQuery): string {
    if (!query.order || Object.keys(query.order).length === 0) {
      return ''
    }
    
    const orderClauses = Object.entries(query.order).map(([field, direction]) => {
      return `"${field}" ${direction.toUpperCase()}`
    })
    
    return orderClauses.join(', ')
  }

  /**
   * Resolve SQL expression to string (handle Drizzle columns properly)
   */
  private resolveSQLExpressionAsString(sqlExpr: any, context: QueryContext<TSchema>): string {
    if (typeof sqlExpr === 'function') {
      const result = sqlExpr(context)
      return typeof result === 'string' ? result : this.columnToSQLString(result)
    } else if (typeof sqlExpr === 'string') {
      return sqlExpr
    } else if (sqlExpr && typeof sqlExpr === 'object' && 'name' in sqlExpr) {
      // This is likely a Drizzle column - extract the column name
      return this.columnToSQLString(sqlExpr)
    } else {
      return sqlExpr?.toString() || 'NULL'
    }
  }

  /**
   * Convert Drizzle column object to SQL string
   */
  private columnToSQLString(column: any): string {
    if (column && typeof column === 'object') {
      // Try to extract table and column name from Drizzle column object
      if (column.name) {
        // Simple case: just the column name
        return column.name
      } else if (column.table && column.table.name && column.columnName) {
        // Full table.column reference
        return `${column.table.name}.${column.columnName}`
      } else {
        // Fallback: convert to string if possible
        return column.toString && column.toString() !== '[object Object]' 
          ? column.toString() 
          : 'unknown_column'
      }
    }
    return String(column)
  }

  /**
   * Build measure expression as string
   */
  private buildMeasureExpressionAsString(measure: any, context: QueryContext<TSchema>): string {
    const baseSql = this.resolveSQLExpressionAsString(measure.sql, context)
    
    // Apply filters if they exist
    let finalSql = baseSql
    if (measure.filters && measure.filters.length > 0) {
      const filterConditions = measure.filters.map((filter: any) => {
        return this.resolveSQLExpressionAsString(filter.sql, context)
      }).join(' AND ')
      
      finalSql = `CASE WHEN ${filterConditions} THEN ${baseSql} END`
    }
    
    switch (measure.type) {
      case 'count':
        return `COUNT(${finalSql})`
      case 'sum':
        return `SUM(${finalSql})`
      case 'avg':
        return `AVG(${finalSql})`
      case 'min':
        return `MIN(${finalSql})`
      case 'max':
        return `MAX(${finalSql})`
      case 'countDistinct':
        return `COUNT(DISTINCT ${finalSql})`
      default:
        return finalSql
    }
  }

  /**
   * Build time dimension expression as string
   */
  private buildTimeDimensionExpressionAsString(dimension: any, granularity: string | undefined, context: QueryContext<TSchema>): string {
    const baseSql = this.resolveSQLExpressionAsString(dimension.sql, context)
    
    if (!granularity) {
      return baseSql
    }
    
    switch (granularity) {
      case 'year':
        return `DATE_TRUNC('year', ${baseSql}::timestamptz)`
      case 'quarter':
        return `DATE_TRUNC('quarter', ${baseSql}::timestamptz)`
      case 'month':
        return `DATE_TRUNC('month', ${baseSql}::timestamptz)`
      case 'week':
        return `DATE_TRUNC('week', ${baseSql}::timestamptz)`
      case 'day':
        return `DATE_TRUNC('day', ${baseSql}::timestamptz)`
      case 'hour':
        return `DATE_TRUNC('hour', ${baseSql}::timestamptz)`
      case 'minute':
        return `DATE_TRUNC('minute', ${baseSql}::timestamptz)`
      case 'second':
        return `DATE_TRUNC('second', ${baseSql}::timestamptz)`
      default:
        return baseSql
    }
  }

  /**
   * Process filter as string
   */
  private processFilterAsString(filter: any, cube: SemanticCube<TSchema>, context: QueryContext<TSchema>): string | null {
    // For now, implement basic filter logic
    if (filter.member) {
      const [cubeName, memberName] = filter.member.split('.')
      if (cubeName !== cube.name) return null
      
      const dimension = cube.dimensions[memberName]
      if (dimension) {
        const sqlExpr = this.resolveSQLExpressionAsString(dimension.sql, context)
        return this.buildFilterConditionSQL(sqlExpr, filter.operator, filter.values)
      }
    }
    return null
  }

  /**
   * Build filter condition SQL (adapted from original)
   */
  private buildFilterConditionSQL(sqlExpr: string, operator: string, values: any[]): string {
    const formatValue = (value: any): string => {
      if (typeof value === 'boolean') {
        return value.toString()
      }
      if (typeof value === 'number') {
        return value.toString()
      }
      if (value === null || value === undefined) {
        return 'NULL'
      }
      return `'${value.toString().replace(/'/g, "''")}'` // Escape single quotes
    }

    const formattedValue = values.length > 0 ? formatValue(values[0]) : 'NULL'

    switch (operator) {
      case 'equals':
        return `${sqlExpr} = ${formattedValue}`
      case 'notEquals':
        return `${sqlExpr} != ${formattedValue}`
      case 'contains':
        return `LOWER(${sqlExpr}::text) LIKE LOWER('%${values[0]}%')`
      case 'gt':
        return `${sqlExpr} > ${formattedValue}`
      case 'gte':
        return `${sqlExpr} >= ${formattedValue}`
      case 'lt':
        return `${sqlExpr} < ${formattedValue}`
      case 'lte':
        return `${sqlExpr} <= ${formattedValue}`
      case 'set':
        return `${sqlExpr} IS NOT NULL`
      case 'notSet':
        return `${sqlExpr} IS NULL`
      default:
        return ''
    }
  }

  /**
   * Substitute security context variables in SQL strings (like original implementation)
   */
  private substituteSecurityVariables(sqlTemplate: string, securityContext: SecurityContext): string {
    let processedSql = sqlTemplate

    // Replace security context variables
    if (securityContext.organisationId) {
      processedSql = processedSql.replace(/\$\{SECURITY_CONTEXT\.organisationId\}/g, `${securityContext.organisationId}`)
    }

    return processedSql
    
    // Replace security context variables safely using Drizzle's sql template
    Object.entries(securityContext).forEach(([key, _value]) => {
      const placeholder = `\${SECURITY_CONTEXT.${key}}`
      if (processedSql.includes(placeholder)) {
        // Replace with a placeholder that we'll substitute with proper SQL
        processedSql = processedSql.replace(
          new RegExp(`\\$\\{SECURITY_CONTEXT\\.${key}\\}`, 'g'), 
          `__PARAM_${key}__`
        )
      }
    })
    
    // Use sql.raw for the base query
    return sql.raw(processedSql)
  }

  /**
   * Build SELECT fields using Drizzle
   */
  private buildSelectFields(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): SQL[] {
    const fields: SQL[] = []
    
    // Add measures
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, measureKey] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[measureKey]) {
          const measure = cube.measures[measureKey]
          const measureSQL = this.buildMeasureExpression(measure, context)
          fields.push(sql`${measureSQL} as ${sql.identifier(measureName)}`)
        }
      }
    }
    
    // Add dimensions
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = this.resolveSQLExpression(dimension.sql, context)
          fields.push(sql`${dimensionSQL} as ${sql.identifier(dimensionName)}`)
        }
      }
    }
    
    // Add time dimensions
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = this.resolveSQLExpression(dimension.sql, context)
          
          if (timeDim.granularity) {
            const truncatedSQL = sql`DATE_TRUNC(${timeDim.granularity}, ${dimensionSQL})`
            fields.push(sql`${truncatedSQL} as ${sql.identifier(timeDim.dimension)}`)
          } else {
            fields.push(sql`${dimensionSQL} as ${sql.identifier(timeDim.dimension)}`)
          }
        }
      }
    }
    
    // Default to COUNT(*) if no fields
    return fields.length > 0 ? fields : [sql`COUNT(*) as count`]
  }

  /**
   * Build measure expression using Drizzle aggregation functions
   */
  private buildMeasureExpression(
    measure: any, 
    context: QueryContext<TSchema>
  ): SQL {
    const baseSQL = this.resolveSQLExpression(measure.sql, context)
    
    // Apply measure filters if they exist
    let finalSQL = baseSQL
    if (measure.filters && measure.filters.length > 0) {
      const filterConditions = measure.filters.map((filter: any) => {
        const filterSQL = this.resolveSQLExpression(filter.sql, context)
        return filterSQL
      })
      
      // Use CASE WHEN for conditional aggregation
      finalSQL = sql`CASE WHEN ${and(...filterConditions)} THEN ${baseSQL} END`
    }
    
    // Apply aggregation function
    switch (measure.type) {
      case 'count':
        return count(finalSQL)
      case 'countDistinct':
        return countDistinct(finalSQL)
      case 'sum':
        return sum(finalSQL)
      case 'avg':
        return avg(finalSQL)
      case 'min':
        return min(finalSQL)
      case 'max':
        return max(finalSQL)
      case 'number':
        return finalSQL
      default:
        return count(finalSQL)
    }
  }

  /**
   * Resolve SQL expression (string, SQL object, or function)
   */
  private resolveSQLExpression(
    sqlExpr: string | SQL | DrizzleColumn | ((context: QueryContext<TSchema>) => SQL | DrizzleColumn),
    context: QueryContext<TSchema>
  ): SQL {
    if (typeof sqlExpr === 'function') {
      const result = sqlExpr(context)
      return this.convertToSQL(result)
    } else {
      return this.convertToSQL(sqlExpr)
    }
  }

  /**
   * Convert various SQL representations to Drizzle SQL
   */
  private convertToSQL(sqlExpr: string | SQL | DrizzleColumn): SQL {
    if (typeof sqlExpr === 'string') {
      return sql.raw(sqlExpr)
    } else if ('_' in sqlExpr && '_' in sqlExpr) {
      // Drizzle column reference
      return sql`${sqlExpr}`
    } else {
      // Already a SQL object
      return sqlExpr as SQL
    }
  }

  /**
   * Build WHERE conditions using Drizzle operators
   */
  private buildWhereConditions(
    cube: SemanticCube<TSchema>, 
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
   * Process a single filter (simple or logical)
   */
  private processFilter(
    filter: Filter,
    cube: SemanticCube<TSchema>,
    context: QueryContext<TSchema>
  ): SQL | null {
    // Handle logical filters
    if ('and' in filter || 'or' in filter) {
      const logicalFilter = filter as LogicalFilter
      
      if (logicalFilter.and) {
        const conditions = logicalFilter.and
          .map(f => this.processFilter(f, cube, context))
          .filter((condition): condition is SQL => condition !== null)
        return conditions.length > 0 ? (and(...conditions) as SQL) : null
      }
      
      if (logicalFilter.or) {
        const conditions = logicalFilter.or
          .map(f => this.processFilter(f, cube, context))
          .filter((condition): condition is SQL => condition !== null)
        return conditions.length > 0 ? (or(...conditions) as SQL) : null
      }
    }
    
    // Handle simple filter condition
    const filterCondition = filter as FilterCondition
    const [cubeName, fieldKey] = filterCondition.member.split('.')
    if (cubeName !== cube.name) return null
    
    const field = cube.dimensions[fieldKey] || cube.measures[fieldKey]
    if (!field) return null
    
    const fieldSQL = this.resolveSQLExpression(field.sql, context)
    return this.buildDrizzleFilterCondition(fieldSQL, filterCondition.operator, filterCondition.values)
  }

  /**
   * Build filter condition using Drizzle operators
   */
  private buildDrizzleFilterCondition(
    fieldSQL: SQL, 
    operator: FilterOperator, 
    values: any[]
  ): SQL | null {
    const value = values[0]
    
    switch (operator) {
      case 'equals':
        if (values.length > 1) {
          // Multiple values - use IN
          return sql`${fieldSQL} IN ${values}`
        } else {
          return eq(fieldSQL, value)
        }
      case 'notEquals':
        if (values.length > 1) {
          // Multiple values - use NOT IN
          return sql`${fieldSQL} NOT IN ${values}`
        } else {
          return ne(fieldSQL, value)
        }
      case 'contains':
        return sql`${fieldSQL} ILIKE ${'%' + value + '%'}`
      case 'notContains':
        return sql`${fieldSQL} NOT ILIKE ${'%' + value + '%'}`
      case 'startsWith':
        return sql`${fieldSQL} ILIKE ${value + '%'}`
      case 'notStartsWith':
        return sql`${fieldSQL} NOT ILIKE ${value + '%'}`
      case 'endsWith':
        return sql`${fieldSQL} ILIKE ${'%' + value}`
      case 'notEndsWith':
        return sql`${fieldSQL} NOT ILIKE ${'%' + value}`
      case 'gt':
        return gt(fieldSQL, value)
      case 'gte':
        return gte(fieldSQL, value)
      case 'lt':
        return lt(fieldSQL, value)
      case 'lte':
        return lte(fieldSQL, value)
      case 'set':
        return isNotNull(fieldSQL)
      case 'notSet':
        return isNull(fieldSQL)
      case 'inDateRange':
        if (values.length >= 2) {
          return and(gte(fieldSQL, values[0]), lte(fieldSQL, values[1])) || null
        }
        return null
      case 'beforeDate':
        return lt(fieldSQL, value)
      case 'afterDate':
        return gt(fieldSQL, value)
      default:
        return null
    }
  }

  /**
   * Build GROUP BY fields using Drizzle
   */
  private buildGroupByFields(
    cube: SemanticCube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
  ): SQL[] {
    const groupFields: SQL[] = []
    
    // Add dimensions to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = this.resolveSQLExpression(dimension.sql, context)
          groupFields.push(dimensionSQL)
        }
      }
    }
    
    // Add time dimensions to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = this.resolveSQLExpression(dimension.sql, context)
          
          if (timeDim.granularity) {
            groupFields.push(sql`DATE_TRUNC(${timeDim.granularity}, ${dimensionSQL})`)
          } else {
            groupFields.push(dimensionSQL)
          }
        }
      }
    }
    
    return groupFields
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderByClause(query: SemanticQuery): SQL | null {
    if (!query.order || Object.keys(query.order).length === 0) {
      return null
    }
    
    const orderClauses: SQL[] = []
    
    for (const [field, direction] of Object.entries(query.order)) {
      const fieldRef = sql.identifier(field)
      const directionSQL = direction === 'desc' ? sql`DESC` : sql`ASC`
      orderClauses.push(sql`${fieldRef} ${directionSQL}`)
    }
    
    return sql`ORDER BY ${sql.join(orderClauses, sql`, `)}`
  }

  /**
   * Generate annotations for UI metadata
   */
  private generateAnnotations(cube: SemanticCube<TSchema>, query: SemanticQuery) {
    const measures: Record<string, MeasureAnnotation> = {}
    const dimensions: Record<string, DimensionAnnotation> = {}
    const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
    
    // Generate measure annotations
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, measureKey] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[measureKey]) {
          const measure = cube.measures[measureKey]
          measures[measureName] = {
            title: measure.title || measureKey,
            shortTitle: measure.title || measureKey,
            type: measure.type,
            format: measure.format
          }
        }
      }
    }
    
    // Generate dimension annotations
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          dimensions[dimensionName] = {
            title: dimension.title || dimensionKey,
            shortTitle: dimension.title || dimensionKey,
            type: dimension.type,
            format: dimension.format
          }
        }
      }
    }
    
    // Generate time dimension annotations
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          timeDimensions[timeDim.dimension] = {
            title: dimension.title || dimensionKey,
            shortTitle: dimension.title || dimensionKey,
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
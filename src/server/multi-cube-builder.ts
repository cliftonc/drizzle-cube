/**
 * Multi-Cube Query Builder for Dynamic Approach
 * Handles cross-cube queries by building CTEs for each cube and joining them
 */

import { 
  sql, 
  and, 
  or,
  eq,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  type SQL,
  type AnyColumn
} from 'drizzle-orm'

import type { 
  Cube,
  QueryContext,
  MultiCubeQueryPlan
} from './types-drizzle'

import type { 
  SemanticQuery,
  SecurityContext,
  TimeGranularity
} from './types'

import { resolveSqlExpression, createMultiCubeContext } from './types-drizzle'
import type { DatabaseAdapter } from './adapters/base-adapter'

export class MultiCubeBuilder<TSchema extends Record<string, any> = Record<string, any>> {
  constructor(private databaseAdapter?: DatabaseAdapter) {}
  
  /**
   * Set the database adapter (for use when not provided in constructor)
   */
  setDatabaseAdapter(adapter: DatabaseAdapter): void {
    this.databaseAdapter = adapter
  }
  
  /**
   * Analyze a semantic query to determine which cubes are involved
   */
  analyzeCubeUsage(query: SemanticQuery): Set<string> {
    const cubesUsed = new Set<string>()
    
    // Extract cube names from measures
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName] = measure.split('.')
        cubesUsed.add(cubeName)
      }
    }
    
    // Extract cube names from dimensions
    if (query.dimensions) {
      for (const dimension of query.dimensions) {
        const [cubeName] = dimension.split('.')
        cubesUsed.add(cubeName)
      }
    }
    
    // Extract cube names from time dimensions
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName] = timeDim.dimension.split('.')
        cubesUsed.add(cubeName)
      }
    }
    
    return cubesUsed
  }

  /**
   * Build a multi-cube query plan
   */
  buildMultiCubeQueryPlan(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    ctx: QueryContext<TSchema>
  ): MultiCubeQueryPlan<TSchema> {
    const cubesUsed = this.analyzeCubeUsage(query)
    const cubeNames = Array.from(cubesUsed)
    
    if (cubeNames.length === 1) {
      throw new Error('Single cube query should use QueryExecutor directly')
    }
    
    // Choose primary cube (first one mentioned, or the one with most fields)
    const primaryCubeName = this.choosePrimaryCube(cubeNames, query)
    const primaryCube = cubes.get(primaryCubeName)
    
    if (!primaryCube) {
      throw new Error(`Primary cube '${primaryCubeName}' not found`)
    }
    
    // Build join plan
    const joinCubes = this.buildJoinPlan(cubes, primaryCube, cubeNames, ctx)
    
    // Build combined selections
    const selections = this.buildMultiCubeSelections(cubes, query, ctx.securityContext)
    
    // Build WHERE conditions (filters from query)
    const whereConditions = this.buildMultiCubeWhereConditions(cubes, query, ctx)
    
    // Build GROUP BY fields
    const groupByFields = this.buildMultiCubeGroupByFields(cubes, query, ctx.securityContext)
    
    return {
      primaryCube,
      joinCubes,
      selections,
      whereConditions,
      groupByFields
    }
  }

  /**
   * Choose the primary cube based on query analysis
   */
  choosePrimaryCube(cubeNames: string[], query: SemanticQuery): string {
    // For now, use the first cube mentioned in measures, then dimensions
    if (query.measures && query.measures.length > 0) {
      const [firstMeasureCube] = query.measures[0].split('.')
      return firstMeasureCube
    }
    
    if (query.dimensions && query.dimensions.length > 0) {
      const [firstDimensionCube] = query.dimensions[0].split('.')
      return firstDimensionCube
    }
    
    return cubeNames[0]
  }

  /**
   * Build join plan for multi-cube query
   */
  private buildJoinPlan(
    cubes: Map<string, Cube<TSchema>>,
    primaryCube: Cube<TSchema>,
    cubeNames: string[],
    ctx: QueryContext<TSchema>
  ): MultiCubeQueryPlan<TSchema>['joinCubes'] {
    const joinCubes: MultiCubeQueryPlan<TSchema>['joinCubes'] = []
    
    // Find cubes to join (all except primary)
    const cubesToJoin = cubeNames.filter(name => name !== primaryCube.name)
    
    for (const cubeName of cubesToJoin) {
      const cube = cubes.get(cubeName)
      if (!cube) {
        throw new Error(`Cube '${cubeName}' not found`)
      }
      
      // Find join definition in primary cube
      const joinDef = primaryCube.joins?.[cubeName]
      if (!joinDef) {
        throw new Error(`No join definition found from '${primaryCube.name}' to '${cubeName}'`)
      }
      
      // Create multi-cube context for join condition
      const context = createMultiCubeContext(
        ctx,
        cubes,
        cube
      )
      
      const joinCondition = joinDef.condition(context)
      
      joinCubes.push({
        cube,
        alias: `${cubeName.toLowerCase()}_cube`,
        joinType: joinDef.type || 'left',
        joinCondition
      })
    }
    
    return joinCubes
  }

  /**
   * Build selections across multiple cubes
   */
  private buildMultiCubeSelections(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Record<string, SQL | AnyColumn> {
    const selections: Record<string, SQL | AnyColumn> = {}
    
    // Create base context (will be enhanced per cube)
    const baseContext: QueryContext<TSchema> = {
      db: {} as any, // Filled during execution
      schema: {} as any, // Filled during execution
      securityContext
    }
    
    // Add requested dimensions
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = cubes.get(cubeName)
        
        if (cube && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const sqlExpr = resolveSqlExpression(dimension.sql, baseContext)
          // Use explicit alias for dimension expressions so they can be referenced in ORDER BY
          selections[dimensionName] = sql`${sqlExpr}`.as(dimensionName) as unknown as SQL
        }
      }
    }
    
    // Add requested measures with aggregations
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = cubes.get(cubeName)
        
        if (cube && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]
          const aggregatedExpr = this.buildMeasureExpression(measure, baseContext)
          // Use explicit alias for measure expressions so they can be referenced in ORDER BY
          selections[measureName] = sql`${aggregatedExpr}`.as(measureName) as unknown as SQL
        }
      }
    }
    
    // Add time dimensions
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = cubes.get(cubeName)
        
        if (cube && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const timeExpr = this.buildTimeDimensionExpression(
            dimension.sql, 
            timeDim.granularity, 
            baseContext
          )
          // Use explicit alias for time dimension expressions so they can be referenced in ORDER BY
          selections[timeDim.dimension] = sql`${timeExpr}`.as(timeDim.dimension) as unknown as SQL
        }
      }
    }
    
    return selections
  }

  /**
   * Build measure expression with aggregation (similar to single-cube approach)
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
    
    // Apply aggregation function using database adapter for database-specific implementations
    if (!this.databaseAdapter) {
      throw new Error('DatabaseAdapter is required for measure aggregation')
    }
    
    switch (measure.type) {
      case 'count':
        return this.databaseAdapter.buildCount(baseExpr)
      case 'countDistinct':
        return this.databaseAdapter.buildCountDistinct(baseExpr)
      case 'sum':
        return this.databaseAdapter.buildSum(baseExpr)
      case 'avg':
        return this.databaseAdapter.buildAvg(baseExpr)
      case 'min':
        return this.databaseAdapter.buildMin(baseExpr)
      case 'max':
        return this.databaseAdapter.buildMax(baseExpr)
      case 'number':
        return baseExpr as SQL
      default:
        return this.databaseAdapter.buildCount(baseExpr)
    }
  }

  /**
   * Build time dimension expression (similar to single-cube approach)
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
    
    // Use database adapter for database-specific time dimension building
    if (!this.databaseAdapter) {
      throw new Error('DatabaseAdapter is required for time dimension building')
    }
    
    return this.databaseAdapter.buildTimeDimension(granularity as TimeGranularity, baseExpr)
  }

  /**
   * Build WHERE conditions for multi-cube query
   */
  private buildMultiCubeWhereConditions(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    ctx: QueryContext<TSchema>
  ): SQL[] {
    const conditions: SQL[] = []
    
    // Process filters from query
    if (query.filters) {
      for (const filter of query.filters) {
        const condition = this.processMultiCubeFilter(filter, cubes, ctx)
        if (condition) {
          conditions.push(condition)
        }
      }
    }
    
    // Process time dimension date range filters
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        if (timeDim.dateRange) {
          const [cubeName, fieldName] = timeDim.dimension.split('.')
          const cube = cubes.get(cubeName)
          
          if (cube && cube.dimensions[fieldName]) {
            const dimension = cube.dimensions[fieldName]
            // Use the raw field expression for date filtering (not the truncated version)
            const fieldExpr = resolveSqlExpression(dimension.sql, ctx)
            const dateCondition = this.buildDateRangeCondition(fieldExpr, timeDim.dateRange)
            if (dateCondition) {
              conditions.push(dateCondition)
            }
          }
        }
      }
    }
    
    return conditions
  }

  /**
   * Process a single filter for multi-cube queries (handles logical and simple filters)
   */
  private processMultiCubeFilter(
    filter: any,
    cubes: Map<string, Cube<TSchema>>,
    ctx: QueryContext<TSchema>
  ): SQL | null {
    // Handle logical filters (AND/OR)
    if ('and' in filter || 'or' in filter) {
      if (filter.and) {
        const conditions = filter.and
          .map((f: any) => this.processMultiCubeFilter(f, cubes, ctx))
          .filter((condition: SQL | null): condition is SQL => condition !== null)
        return conditions.length > 0 ? and(...conditions) as SQL : null
      }
      
      if (filter.or) {
        const conditions = filter.or
          .map((f: any) => this.processMultiCubeFilter(f, cubes, ctx))
          .filter((condition: SQL | null): condition is SQL => condition !== null)
        return conditions.length > 0 ? or(...conditions) as SQL : null
      }
    }
    
    // Handle simple filter condition
    if ('member' in filter) {
      const [cubeName] = filter.member.split('.')
      const cube = cubes.get(cubeName)
      
      if (cube) {
        return this.buildFilterCondition(filter, cube, ctx)
      }
    }
    
    return null
  }

  /**
   * Filter condition builder with comprehensive operator support
   */
  private buildFilterCondition(
    filter: any, 
    cube: Cube<TSchema>, 
    ctx: QueryContext<TSchema>
  ): SQL | null {
    if (!filter.member || !filter.operator) {
      return null
    }

    const [cubeName, fieldName] = filter.member.split('.')
    if (cubeName !== cube.name) {
      return null
    }

    const field = cube.dimensions[fieldName] || cube.measures[fieldName]
    if (!field) {
      return null
    }

    const fieldExpr = resolveSqlExpression(field.sql, ctx)
    const values = filter.values || []
    
    // Filter out null/undefined values but keep empty strings and zeros
    const filteredValues = values.filter((v: any) => v !== null && v !== undefined)
    
    if (filteredValues.length === 0 && !['set', 'notSet'].includes(filter.operator)) {
      return null
    }

    const value = filteredValues[0]
    
    // Handle different operators
    switch (filter.operator) {
      case 'equals':
        if (filteredValues.length === 0) {
          // Empty equals filter should return no results
          return sql`1 = 0`
        } else if (filteredValues.length === 1) {
          // For time-type fields, normalize the date value
          const normalizedValue = field.type === 'time' ? this.normalizeDate(value) || value : value
          return eq(fieldExpr as AnyColumn, normalizedValue)
        } else {
          // For multiple values, use IN clause with proper normalization for time fields
          if (field.type === 'time') {
            const normalizedValues = filteredValues.map((v: any) => this.normalizeDate(v) || v)
            return sql`${fieldExpr} IN (${sql.join(normalizedValues.map((v: any) => sql`${v}`), sql`, `)})`
          } else {
            return sql`${fieldExpr} IN (${sql.join(filteredValues.map((v: any) => sql`${v}`), sql`, `)})`
          }
        }
      case 'notEquals':
        if (filteredValues.length === 1) {
          return sql`${fieldExpr} <> ${value}`
        } else if (filteredValues.length > 1) {
          return sql`${fieldExpr} NOT IN (${sql.join(filteredValues.map((v: any) => sql`${v}`), sql`, `)})`
        }
        return null
      case 'contains':
        if (!this.databaseAdapter) {
          throw new Error('DatabaseAdapter is required for string conditions')
        }
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'contains', value)
      case 'notContains':
        if (!this.databaseAdapter) {
          throw new Error('DatabaseAdapter is required for string conditions')
        }
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notContains', value)
      case 'startsWith':
        if (!this.databaseAdapter) {
          throw new Error('DatabaseAdapter is required for string conditions')
        }
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'startsWith', value)
      case 'endsWith':
        if (!this.databaseAdapter) {
          throw new Error('DatabaseAdapter is required for string conditions')
        }
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
      // Handle absolute date (single date)
      const normalizedDate = this.normalizeDate(dateRange)
      if (!normalizedDate) return null
      
      // For single date, create range for the whole day
      const startOfDay = new Date(normalizedDate)
      startOfDay.setUTCHours(0, 0, 0, 0)
      const endOfDay = new Date(normalizedDate)
      endOfDay.setUTCHours(23, 59, 59, 999)
      
      return and(
        gte(fieldExpr as AnyColumn, startOfDay),
        lte(fieldExpr as AnyColumn, endOfDay)
      ) as SQL
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
    try {
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    } catch {
      // Ignore parsing errors
    }
    
    return null
  }

  /**
   * Build GROUP BY fields for multi-cube query
   */
  private buildMultiCubeGroupByFields(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): (SQL | AnyColumn)[] {
    const groupFields: (SQL | AnyColumn)[] = []
    
    // Only add GROUP BY if we have measures (aggregations)
    const hasMeasures = query.measures && query.measures.length > 0
    if (!hasMeasures) {
      return []
    }
    
    const baseContext: QueryContext<TSchema> = {
      db: {} as any,
      schema: {} as any,
      securityContext
    }
    
    // Add dimensions to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = cubes.get(cubeName)
        
        if (cube && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const dimensionExpr = resolveSqlExpression(dimension.sql, baseContext)
          groupFields.push(dimensionExpr)
        }
      }
    }
    
    // Add time dimensions to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = cubes.get(cubeName)
        
        if (cube && cube.dimensions[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          const timeExpr = this.buildTimeDimensionExpression(
            dimension.sql, 
            timeDim.granularity, 
            baseContext
          )
          groupFields.push(timeExpr)
        }
      }
    }
    
    return groupFields
  }
}
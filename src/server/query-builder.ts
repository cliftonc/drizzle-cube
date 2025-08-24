/**
 * Shared Query Builder
 * Contains all SQL building logic that was previously duplicated between executor and multi-cube-builder
 * Single source of truth for all SQL generation
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
  min, 
  max, 
  countDistinct,
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
  TimeGranularity
} from './types'

import type { 
  Cube,
  QueryContext,
  QueryPlan
} from './types-drizzle'

import { resolveSqlExpression } from './types-drizzle'
import type { DatabaseAdapter } from './adapters/base-adapter'

export class QueryBuilder<TSchema extends Record<string, any> = Record<string, any>> {
  constructor(private databaseAdapter: DatabaseAdapter) {}

  /**
   * Build dynamic selections for measures, dimensions, and time dimensions
   * Works for both single and multi-cube queries
   */
  buildSelections(
    cubes: Map<string, Cube<TSchema>> | Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>
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
    
    // Add measures with aggregations
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.measures && cube.measures[fieldName]) {
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
   * Build measure expression for HAVING clause, handling CTE references correctly
   */
  private buildHavingMeasureExpression(
    cubeName: string,
    fieldKey: string,
    measure: any,
    context: QueryContext<TSchema>,
    queryPlan?: QueryPlan<TSchema>
  ): SQL {
    // Check if this measure is from a CTE cube
    if (queryPlan && queryPlan.preAggregationCTEs) {
      const cteInfo = queryPlan.preAggregationCTEs.find(cte => cte.cube.name === cubeName)
      if (cteInfo && cteInfo.measures.includes(`${cubeName}.${fieldKey}`)) {
        // This measure is from a CTE - reference the CTE alias instead of the original table
        const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldKey)}`
        
        // Apply aggregation function based on measure type
        // Since CTE is already pre-aggregated, we need to aggregate the pre-aggregated values
        switch (measure.type) {
          case 'count':
          case 'countDistinct':
          case 'sum':
            return sum(cteColumn)
          case 'avg':
            // For average of averages, we should use a weighted average, but for now use simple avg
            return this.databaseAdapter.buildAvg(cteColumn)
          case 'min':
            return min(cteColumn)
          case 'max':
            return max(cteColumn)
          case 'number':
            // For number type, use sum to combine values
            return sum(cteColumn)
          default:
            return sum(cteColumn)
        }
      }
    }
    
    // Not from CTE - use regular measure expression
    return this.buildMeasureExpression(measure, context)
  }

  /**
   * Build measure expression with aggregation and filters
   */
  buildMeasureExpression(
    measure: any, 
    context: QueryContext<TSchema>
  ): SQL {
    let baseExpr = resolveSqlExpression(measure.sql, context)
    
    // Apply measure filters if they exist
    if (measure.filters && measure.filters.length > 0) {
      const filterConditions = measure.filters.map((filter: (ctx: QueryContext<TSchema>) => SQL) => {
        return filter(context)
      }).filter(Boolean) // Remove any undefined conditions
      
      if (filterConditions.length > 0) {
        // Use CASE WHEN for conditional aggregation via adapter
        const andCondition = filterConditions.length === 1 ? filterConditions[0] : and(...filterConditions)
        const caseExpr = this.databaseAdapter.buildCaseWhen([
          { when: andCondition!, then: baseExpr }
        ])
        baseExpr = caseExpr
      }
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
        return this.databaseAdapter.buildAvg(baseExpr)
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
  buildTimeDimensionExpression(
    dimensionSql: any,
    granularity: string | undefined,
    context: QueryContext<TSchema>
  ): SQL {
    const baseExpr = resolveSqlExpression(dimensionSql, context)
    
    if (!granularity) {
      // Ensure we return SQL even when no granularity is applied
      return baseExpr instanceof SQL ? baseExpr : sql`${baseExpr}`
    }
    
    // Use database adapter for database-specific time dimension building
    return this.databaseAdapter.buildTimeDimension(granularity as TimeGranularity, baseExpr)
  }

  /**
   * Build WHERE conditions from semantic query filters (dimensions only)
   * Works for both single and multi-cube queries
   */
  buildWhereConditions(
    cubes: Map<string, Cube<TSchema>> | Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>,
    queryPlan?: QueryPlan<TSchema>
  ): SQL[] {
    const conditions: SQL[] = []
    
    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])
    
    // Process regular filters (dimensions only for WHERE clause)
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
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
    cubes: Map<string, Cube<TSchema>> | Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>,
    queryPlan?: QueryPlan<TSchema>
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
    cubes: Map<string, Cube<TSchema>>,
    context: QueryContext<TSchema>,
    filterType: 'where' | 'having',
    queryPlan?: QueryPlan<TSchema>
  ): SQL | null {
    // Handle logical filters (AND/OR)
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
      if (queryPlan?.preAggregationCTEs) {
        const isInCTE = queryPlan.preAggregationCTEs.some((cte: any) => cte.cube.name === cubeName)
        if (isInCTE) {
          return null // Skip this filter - it's handled in the CTE
        }
      }
      
      // WHERE clause: use raw dimension expression
      const fieldExpr = resolveSqlExpression(dimension.sql, context)
      return this.buildFilterCondition(fieldExpr, filterCondition.operator, filterCondition.values, field)
    } else if (filterType === 'where' && measure) {
      // NEVER apply measure filters in WHERE clause - they should only be in HAVING
      // This prevents incorrect behavior where measure filters are applied before aggregation
      return null
    } else if (filterType === 'having' && measure) {
      // HAVING clause: use aggregated measure expression
      // Check if this measure is from a CTE cube
      const measureExpr = this.buildHavingMeasureExpression(cubeName, fieldKey, measure, context, queryPlan)
      return this.buildFilterCondition(measureExpr, filterCondition.operator, filterCondition.values, field)
    }
    
    // Skip if this filter doesn't match the type we're processing
    return null
  }

  /**
   * Build filter condition using Drizzle operators
   */
  private buildFilterCondition(
    fieldExpr: AnyColumn | SQL, 
    operator: FilterOperator, 
    values: any[],
    field?: any
  ): SQL | null {
    // Handle empty values
    if (!values || values.length === 0) {
      // For empty equals filter, return condition that matches nothing
      if (operator === 'equals') {
        return this.databaseAdapter.buildBooleanLiteral(false)
      }
      return null
    }

    // Filter out empty/null values and values containing null bytes for security
    // For date operators, don't convert values yet - we'll normalize to Date first    
    const filteredValues = values.filter(v => {
      if (v === null || v === undefined || v === '') return false
      // Reject values containing null bytes for security
      if (typeof v === 'string' && v.includes('\x00')) return false
      return true
    }).map(this.databaseAdapter.convertFilterValue)
        
    // For certain operators, we need at least one non-empty value
    if (filteredValues.length === 0 && !['set', 'notSet'].includes(operator)) {
      // For empty equals filter, return condition that matches nothing
      if (operator === 'equals') {
        return this.databaseAdapter.buildBooleanLiteral(false)
      }
      return null
    }

    const value = filteredValues[0]
    
    switch (operator) {
      case 'equals':
        if (filteredValues.length > 1) {
          // For time-type fields, normalize all values
          if (field?.type === 'time') {
            const normalizedValues = filteredValues.map(v => this.normalizeDate(v) || v)
            return inArray(fieldExpr as AnyColumn, normalizedValues)
          }
          return inArray(fieldExpr as AnyColumn, filteredValues)
        } else if (filteredValues.length === 1) {
          // For time-type fields, normalize the single value
          const finalValue = field?.type === 'time' ? this.normalizeDate(value) || value : value
          return eq(fieldExpr as AnyColumn, finalValue)
        }
        return this.databaseAdapter.buildBooleanLiteral(false)
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
  buildDateRangeCondition(
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
   * Parse relative date range expressions like "today", "yesterday", "last 7 days", "this month", etc.
   * Handles all 14 DATE_RANGE_OPTIONS from the client
   */
  private parseRelativeDateRange(dateRange: string): { start: Date; end: Date } | null {
    const now = new Date()
    const lowerRange = dateRange.toLowerCase().trim()
    
    // Extract UTC date components for consistent calculations
    const utcYear = now.getUTCFullYear()
    const utcMonth = now.getUTCMonth()
    const utcDate = now.getUTCDate()
    const utcDay = now.getUTCDay()

    // Handle "today"
    if (lowerRange === 'today') {
      const start = new Date(now)
      start.setUTCHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "yesterday"
    if (lowerRange === 'yesterday') {
      const start = new Date(now)
      start.setUTCDate(utcDate - 1)
      start.setUTCHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setUTCDate(utcDate - 1)
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "this week" (Monday to Sunday)
    if (lowerRange === 'this week') {
      const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay // If Sunday, go back 6 days, otherwise go to Monday
      const start = new Date(now)
      start.setUTCDate(utcDate + mondayOffset)
      start.setUTCHours(0, 0, 0, 0)
      
      const end = new Date(start)
      end.setUTCDate(start.getUTCDate() + 6) // Sunday
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "this month"
    if (lowerRange === 'this month') {
      const start = new Date(Date.UTC(utcYear, utcMonth, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(utcYear, utcMonth + 1, 0, 23, 59, 59, 999))
      return { start, end }
    }

    // Handle "this quarter"
    if (lowerRange === 'this quarter') {
      const quarter = Math.floor(utcMonth / 3)
      const start = new Date(Date.UTC(utcYear, quarter * 3, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(utcYear, quarter * 3 + 3, 0, 23, 59, 59, 999))
      return { start, end }
    }

    // Handle "this year"
    if (lowerRange === 'this year') {
      const start = new Date(Date.UTC(utcYear, 0, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(utcYear, 11, 31, 23, 59, 59, 999))
      return { start, end }
    }

    // Handle "last N days" pattern
    const lastDaysMatch = lowerRange.match(/^last\s+(\d+)\s+days?$/)
    if (lastDaysMatch) {
      const days = parseInt(lastDaysMatch[1], 10)
      const start = new Date(now)
      start.setUTCDate(utcDate - days + 1) // Include today in the count
      start.setUTCHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "last week" (previous Monday to Sunday)
    if (lowerRange === 'last week') {
      const lastMondayOffset = utcDay === 0 ? -13 : -6 - utcDay // Go to previous Monday
      const start = new Date(now)
      start.setUTCDate(utcDate + lastMondayOffset)
      start.setUTCHours(0, 0, 0, 0)
      
      const end = new Date(start)
      end.setUTCDate(start.getUTCDate() + 6) // Previous Sunday
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "last month"
    if (lowerRange === 'last month') {
      const start = new Date(Date.UTC(utcYear, utcMonth - 1, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(utcYear, utcMonth, 0, 23, 59, 59, 999))
      return { start, end }
    }

    // Handle "last quarter"
    if (lowerRange === 'last quarter') {
      const currentQuarter = Math.floor(utcMonth / 3)
      const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
      const year = currentQuarter === 0 ? utcYear - 1 : utcYear
      const start = new Date(Date.UTC(year, lastQuarter * 3, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(year, lastQuarter * 3 + 3, 0, 23, 59, 59, 999))
      return { start, end }
    }

    // Handle "last year"
    if (lowerRange === 'last year') {
      const start = new Date(Date.UTC(utcYear - 1, 0, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(utcYear - 1, 11, 31, 23, 59, 59, 999))
      return { start, end }
    }

    // Handle "last 12 months" (rolling 12 months)
    if (lowerRange === 'last 12 months') {
      const start = new Date(Date.UTC(utcYear, utcMonth - 11, 1, 0, 0, 0, 0))
      const end = new Date(now)
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "last N months" pattern (legacy support)
    const lastMonthsMatch = lowerRange.match(/^last\s+(\d+)\s+months?$/)
    if (lastMonthsMatch) {
      const months = parseInt(lastMonthsMatch[1], 10)
      const start = new Date(Date.UTC(utcYear, utcMonth - months + 1, 1, 0, 0, 0, 0))
      const end = new Date(now)
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    // Handle "last N years" pattern (legacy support)
    const lastYearsMatch = lowerRange.match(/^last\s+(\d+)\s+years?$/)
    if (lastYearsMatch) {
      const years = parseInt(lastYearsMatch[1], 10)
      const start = new Date(Date.UTC(utcYear - years, 0, 1, 0, 0, 0, 0))
      const end = new Date(now)
      end.setUTCHours(23, 59, 59, 999)
      return { start, end }
    }

    return null
  }

  /**
   * Normalize date values to handle strings, numbers, and Date objects
   * Always returns a JavaScript Date object or null
   * Database-agnostic - just ensures we have a valid Date
   */
  private normalizeDate(value: any): Date | null {
    if (!value) return null
    
    // If it's already a Date object, validate it
    if (value instanceof Date) {
      return !isNaN(value.getTime()) ? value : null
    }
    
    // If it's a number, assume it's a timestamp
    if (typeof value === 'number') {
      // If it's a reasonable Unix timestamp in seconds (10 digits), convert to milliseconds
      // Otherwise assume it's already in milliseconds
      const timestamp = value < 10000000000 ? value * 1000 : value
      const date = new Date(timestamp)
      return !isNaN(date.getTime()) ? date : null
    }
    
    // If it's a string, try to parse it as a Date
    if (typeof value === 'string') {
      const parsed = new Date(value)
      return !isNaN(parsed.getTime()) ? parsed : null
    }
    
    // Try to parse any other type as date
    const parsed = new Date(value)
    return !isNaN(parsed.getTime()) ? parsed : null
  }

  /**
   * Build GROUP BY fields from dimensions and time dimensions
   * Works for both single and multi-cube queries
   */
  buildGroupByFields(
    cubes: Map<string, Cube<TSchema>> | Cube<TSchema>, 
    query: SemanticQuery, 
    context: QueryContext<TSchema>,
    queryPlan?: any // Optional QueryPlan for CTE handling
  ): (SQL | AnyColumn)[] {
    const groupFields: (SQL | AnyColumn)[] = []
    
    // Only add GROUP BY if we have measures (aggregations)
    const hasMeasures = query.measures && query.measures.length > 0
    if (!hasMeasures) {
      return []
    }
    
    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])
    
    // Add dimensions to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {
          
          // Check if this dimension is from a CTE cube
          const isFromCTE = queryPlan?.preAggregationCTEs?.some((cte: any) => cte.cube.name === cubeName)
          
          if (isFromCTE) {
            // For dimensions from CTE cubes, check if this is a join key that maps to the main table
            const cteInfo = queryPlan.preAggregationCTEs.find((cte: any) => cte.cube.name === cubeName)
            const matchingJoinKey = cteInfo.joinKeys.find((jk: any) => jk.targetColumn === fieldName)
            
            if (matchingJoinKey && matchingJoinKey.sourceColumnObj) {
              // Use the source column from the main table for GROUP BY instead of the CTE dimension
              groupFields.push(matchingJoinKey.sourceColumnObj)
            } else {
              // This dimension from CTE cube is not a join key - we need to reference it from the CTE
              // But only if it was included in the CTE selections
              const cteDimensionExpr = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
              groupFields.push(cteDimensionExpr)
            }
          } else {
            // Regular dimension from non-CTE cube
            const dimension = cube.dimensions[fieldName]
            const dimensionExpr = resolveSqlExpression(dimension.sql, context)
            groupFields.push(dimensionExpr)
          }
        }
      }
    }
    
    // Add time dimensions to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {
          
          // Check if this time dimension is from a CTE cube
          const isFromCTE = queryPlan?.preAggregationCTEs?.some((cte: any) => cte.cube.name === cubeName)
          
          if (isFromCTE) {
            // For time dimensions from CTE cubes, check if this is a join key that maps to the main table
            const cteInfo = queryPlan.preAggregationCTEs.find((cte: any) => cte.cube.name === cubeName)
            const matchingJoinKey = cteInfo.joinKeys.find((jk: any) => jk.targetColumn === fieldName)
            
            if (matchingJoinKey && matchingJoinKey.sourceColumnObj) {
              // Use the source column from the main table for GROUP BY with time granularity
              // const dimension = cube.dimensions[fieldName] // Unused
              const timeExpr = this.buildTimeDimensionExpression(
                matchingJoinKey.sourceColumnObj, 
                timeDim.granularity, 
                context
              )
              groupFields.push(timeExpr)
            } else {
              // This time dimension from CTE cube is not a join key - reference it from the CTE
              // The CTE already has the time dimension expression applied, so just reference the column
              const cteDimensionExpr = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
              groupFields.push(cteDimensionExpr)
            }
          } else {
            // Regular time dimension from non-CTE cube
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
    }
    
    // Note: We used to add join keys from CTEs to GROUP BY, but this is unnecessary
    // Join keys are only needed for the JOIN condition, not for grouping
    // The GROUP BY should only contain columns that are actually selected or used for aggregation
    
    return groupFields
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
  collectNumericFields(cubes: Map<string, Cube<TSchema>> | Cube<TSchema>, query: SemanticQuery): string[] {
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
}
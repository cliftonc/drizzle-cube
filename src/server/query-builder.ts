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
  TimeGranularity,
  Cube,
  QueryContext,
  QueryPlan,
  JoinKeyInfo
} from './types'

import { resolveSqlExpression } from './cube-utils'
import type { DatabaseAdapter } from './adapters/base-adapter'
import { CalculatedMeasureResolver } from './calculated-measure-resolver'
import { substituteTemplate, getMemberReferences, type ResolvedMeasures } from './template-substitution'

export class QueryBuilder {
  constructor(private databaseAdapter: DatabaseAdapter) {}

  /**
   * Build resolvedMeasures map for a set of measures
   * This centralizes the logic for building both regular and calculated measures
   * in dependency order, avoiding duplication across main queries and CTEs
   *
   * @param measureNames - Array of measure names to resolve (e.g., ["Employees.count", "Employees.activePercentage"])
   * @param cubeMap - Map of all cubes involved in the query
   * @param context - Query context with database and security context
   * @param customMeasureBuilder - Optional function to override how individual measures are built
   * @returns Map of measure names to SQL builder functions
   */
  buildResolvedMeasures(
    measureNames: string[],
    cubeMap: Map<string, Cube>,
    context: QueryContext,
    customMeasureBuilder?: (measureName: string, measure: any, cube: Cube) => SQL
  ): ResolvedMeasures {
    const resolvedMeasures: ResolvedMeasures = new Map()
    const regularMeasures: string[] = []
    const calculatedMeasures: string[] = []
    const allMeasuresToResolve = new Set<string>(measureNames)

    // Build dependency graph
    const resolver = new CalculatedMeasureResolver(cubeMap)
    for (const cube of cubeMap.values()) {
      resolver.buildGraph(cube)
    }

    // First pass: classify user-requested measures and collect dependencies
    for (const measureName of measureNames) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)
      if (cube && cube.measures && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]
        if (CalculatedMeasureResolver.isCalculatedMeasure(measure)) {
          calculatedMeasures.push(measureName)
          // Add all dependencies to measures that need to be resolved
          const deps = getMemberReferences(measure.calculatedSql!, cubeName)
          deps.forEach(dep => allMeasuresToResolve.add(dep))

          // Also add transitive calculated measure dependencies
          const calculatedDeps = resolver.getAllDependencies(measureName)
          calculatedDeps.forEach(dep => {
            const [depCubeName, depFieldName] = dep.split('.')
            const depCube = cubeMap.get(depCubeName)
            if (depCube && depCube.measures[depFieldName]) {
              const depMeasure = depCube.measures[depFieldName]
              if (CalculatedMeasureResolver.isCalculatedMeasure(depMeasure)) {
                const nestedDeps = getMemberReferences(depMeasure.calculatedSql!, depCubeName)
                nestedDeps.forEach(nestedDep => allMeasuresToResolve.add(nestedDep))
              }
            }
          })
        } else {
          regularMeasures.push(measureName)
        }
      }
    }

    // Second pass: classify all measures that need to be resolved (including dependencies)
    for (const measureName of allMeasuresToResolve) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)
      if (cube && cube.measures && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]
        if (!CalculatedMeasureResolver.isCalculatedMeasure(measure)) {
          if (!regularMeasures.includes(measureName)) {
            regularMeasures.push(measureName)
          }
        } else {
          if (!calculatedMeasures.includes(measureName)) {
            calculatedMeasures.push(measureName)
          }
        }
      }
    }

    // Build regular measures first
    for (const measureName of regularMeasures) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)!
      const measure = cube.measures[fieldName]

      // Use custom builder if provided, otherwise use default
      if (customMeasureBuilder) {
        const builtExpr = customMeasureBuilder(measureName, measure, cube)
        resolvedMeasures.set(measureName, () => builtExpr)
      } else {
        // Store a FUNCTION that builds the SQL expression to avoid mutation issues
        resolvedMeasures.set(measureName, () => this.buildMeasureExpression(measure, context))
      }
    }

    // Build calculated measures in dependency order
    if (calculatedMeasures.length > 0) {
      const sortedCalculated = resolver.topologicalSort(calculatedMeasures)

      for (const measureName of sortedCalculated) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = cubeMap.get(cubeName)!
        const measure = cube.measures[fieldName]

        // Store a FUNCTION that builds the calculated measure SQL
        resolvedMeasures.set(measureName, () => this.buildCalculatedMeasure(
          measure,
          cube,
          cubeMap,
          resolvedMeasures,
          context
        ))
      }
    }

    return resolvedMeasures
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
   * with resolved SQL expressions
   */
  public buildCalculatedMeasure(
    measure: any,
    cube: Cube,
    allCubes: Map<string, Cube>,
    resolvedMeasures: ResolvedMeasures,
    context: QueryContext
  ): SQL {
    if (!measure.calculatedSql) {
      throw new Error(
        `Calculated measure '${cube.name}.${measure.name}' missing calculatedSql property`
      )
    }

    // Preprocess template for database-specific transformations (e.g., SQLite float division)
    const preprocessedSql = this.databaseAdapter.preprocessCalculatedTemplate(measure.calculatedSql)

    // Substitute {member} references with resolved SQL
    const substitutedSql = substituteTemplate(preprocessedSql, {
      cube,
      allCubes,
      resolvedMeasures,
      queryContext: context
    })

    return substitutedSql
  }

  /**
   * Build resolved measures map for a calculated measure from CTE columns
   * This handles re-aggregating pre-aggregated CTE columns for calculated measures
   *
   * IMPORTANT: For calculated measures in CTEs, we cannot sum/avg pre-computed ratios.
   * We must recalculate from the base measures that were pre-aggregated in the CTE.
   *
   * @param measure - The calculated measure to build
   * @param cube - The cube containing this measure
   * @param cteInfo - CTE metadata (alias, measures, cube reference)
   * @param allCubes - Map of all cubes in the query
   * @param context - Query context
   * @returns SQL expression for the calculated measure using CTE column references
   */
  public buildCTECalculatedMeasure(
    measure: any,
    cube: Cube,
    cteInfo: { cteAlias: string; measures: string[]; cube: Cube },
    allCubes: Map<string, Cube>,
    context: QueryContext
  ): SQL {
    if (!measure.calculatedSql) {
      throw new Error(
        `Calculated measure '${cube.name}.${measure.name || 'unknown'}' missing calculatedSql property`
      )
    }

    // Build a resolvedMeasures map with CTE column references
    const cteResolvedMeasures = new Map<string, () => SQL>()

    // Get all dependencies for this calculated measure
    const deps = getMemberReferences(measure.calculatedSql, cube.name)

    for (const depMeasureName of deps) {
      const [depCubeName, depFieldName] = depMeasureName.split('.')
      const depCube = allCubes.get(depCubeName)

      if (depCube && depCube.measures[depFieldName]) {
        const depMeasure = depCube.measures[depFieldName]

        // Check if this dependency is also in the CTE
        if (cteInfo.measures.includes(depMeasureName)) {
          // Reference the CTE column and apply appropriate aggregation
          const cteDepColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(depFieldName)}`

          // Apply aggregation based on the dependency's type
          // For pre-aggregated values in CTEs, we need to re-aggregate them properly:
          // - count/sum values should be summed
          // - avg values should be averaged (though ideally weighted average)
          // - min/max values should take min/max
          let aggregatedDep: SQL
          switch (depMeasure.type) {
            case 'count':
            case 'countDistinct':
            case 'sum':
              aggregatedDep = sum(cteDepColumn)
              break
            case 'avg':
              aggregatedDep = this.databaseAdapter.buildAvg(cteDepColumn)
              break
            case 'min':
              aggregatedDep = min(cteDepColumn)
              break
            case 'max':
              aggregatedDep = max(cteDepColumn)
              break
            case 'number':
              aggregatedDep = sum(cteDepColumn)
              break
            default:
              aggregatedDep = sum(cteDepColumn)
          }

          // Store the aggregated CTE column as a builder function
          cteResolvedMeasures.set(depMeasureName, () => aggregatedDep)
        }
      }
    }

    // Re-apply the calculated measure template with CTE-based dependencies
    return this.buildCalculatedMeasure(
      measure,
      cube,
      allCubes,
      cteResolvedMeasures,
      context
    )
  }

  /**
   * Build measure expression for HAVING clause, handling CTE references correctly
   */
  private buildHavingMeasureExpression(
    cubeName: string,
    fieldKey: string,
    measure: any,
    context: QueryContext,
    queryPlan?: QueryPlan
  ): SQL {
    // Check if this measure is from a CTE cube
    if (queryPlan && queryPlan.preAggregationCTEs) {
      const cteInfo = queryPlan.preAggregationCTEs.find(cte => cte.cube.name === cubeName)
      if (cteInfo && cteInfo.measures.includes(`${cubeName}.${fieldKey}`)) {
        // This measure is from a CTE - reference the CTE alias instead of the original table

        if (measure.type === 'calculated' && measure.calculatedSql) {
          // Get the cube for this measure
          const cube = queryPlan.primaryCube.name === cubeName
            ? queryPlan.primaryCube
            : queryPlan.joinCubes?.find(jc => jc.cube.name === cubeName)?.cube

          if (!cube) {
            throw new Error(`Cube ${cubeName} not found in query plan`)
          }

          // Build a cubeMap for the calculated measure builder
          const cubeMap = new Map<string, Cube>([[queryPlan.primaryCube.name, queryPlan.primaryCube]])
          if (queryPlan.joinCubes) {
            for (const jc of queryPlan.joinCubes) {
              cubeMap.set(jc.cube.name, jc.cube)
            }
          }

          // Use the shared helper to build calculated measure from CTE columns
          return this.buildCTECalculatedMeasure(
            measure,
            cube,
            cteInfo,
            cubeMap,
            context
          )
        } else {
          // For non-calculated measures, aggregate the CTE column directly
          const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldKey)}`

          // Apply aggregation function based on measure type
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
    }

    // Not from CTE - use regular measure expression
    return this.buildMeasureExpression(measure, context)
  }

  /**
   * Build measure expression with aggregation and filters
   * Note: This should NOT be called for calculated measures
   */
  buildMeasureExpression(
    measure: any,
    context: QueryContext
  ): SQL {
    // Calculated measures should be built via buildCalculatedMeasure
    if (measure.type === 'calculated') {
      throw new Error(
        `Cannot build calculated measure '${measure.name}' directly. ` +
        `Use buildCalculatedMeasure instead.`
      )
    }

    let baseExpr = resolveSqlExpression(measure.sql, context)

    // CRITICAL FIX: Force fresh SQL object to avoid Drizzle mutation issues
    // Wrap in sql template to ensure independent queryChunks
    if (baseExpr && typeof baseExpr === 'object') {
      baseExpr = sql`${baseExpr}`
    }

    // Apply measure filters if they exist
    if (measure.filters && measure.filters.length > 0) {
      const filterConditions = measure.filters.map((filter: (ctx: QueryContext) => SQL) => {
        const filterResult = filter(context)
        // CRITICAL FIX: Wrap filter SQL in fresh template to avoid column reuse issues
        // Filter functions may create SQL with column objects that get reused
        return filterResult ? sql`(${filterResult})` : undefined
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
    context: QueryContext
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
    cubes: Map<string, Cube> | Cube, 
    query: SemanticQuery, 
    context: QueryContext,
    queryPlan?: QueryPlan
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
          let endDate = this.normalizeDate(filteredValues[1])

          if (startDate && endDate) {
            // For date-only strings in original values, treat end date as end-of-day
            // Check original values array (before filtering/conversion)
            const originalEndValue = values[1]
            if (typeof originalEndValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(originalEndValue.trim())) {
              const endDateObj = typeof endDate === 'number'
                ? new Date(endDate * (this.databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
                : new Date(endDate)
              const endOfDay = new Date(endDateObj)
              endOfDay.setUTCHours(23, 59, 59, 999)
              if (this.databaseAdapter.isTimestampInteger()) {
                endDate = this.databaseAdapter.getEngineType() === 'sqlite'
                  ? Math.floor(endOfDay.getTime() / 1000)
                  : endOfDay.getTime()
              } else {
                // PostgreSQL and MySQL need ISO strings
                endDate = endOfDay.toISOString()
              }
            }

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
      case 'between':
        if (filteredValues.length >= 2) {
          return and(
            gte(fieldExpr as AnyColumn, filteredValues[0]),
            lte(fieldExpr as AnyColumn, filteredValues[1])
          ) as SQL
        }
        return null
      case 'notBetween':
        if (filteredValues.length >= 2) {
          return or(
            lt(fieldExpr as AnyColumn, filteredValues[0]),
            gt(fieldExpr as AnyColumn, filteredValues[1])
          ) as SQL
        }
        return null
      case 'in':
        if (filteredValues.length > 0) {
          return inArray(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      case 'notIn':
        if (filteredValues.length > 0) {
          return notInArray(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      case 'like':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'like', value)
      case 'notLike':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notLike', value)
      case 'ilike':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'ilike', value)
      case 'regex':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'regex', value)
      case 'notRegex':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notRegex', value)
      case 'isEmpty':
        return or(
          isNull(fieldExpr as AnyColumn),
          eq(fieldExpr as AnyColumn, '')
        ) as SQL
      case 'isNotEmpty':
        return and(
          isNotNull(fieldExpr as AnyColumn),
          ne(fieldExpr as AnyColumn, '')
        ) as SQL
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
      let endDate = this.normalizeDate(dateRange[1])

      if (!startDate || !endDate) return null

      // For date-only strings, treat end date as end-of-day (23:59:59.999)
      // to include all records on that day
      if (typeof dateRange[1] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateRange[1].trim())) {
        const endDateObj = typeof endDate === 'number'
          ? new Date(endDate * (this.databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
          : new Date(endDate)
        const endOfDay = new Date(endDateObj)
        endOfDay.setUTCHours(23, 59, 59, 999)
        if (this.databaseAdapter.isTimestampInteger()) {
          endDate = this.databaseAdapter.getEngineType() === 'sqlite'
            ? Math.floor(endOfDay.getTime() / 1000)
            : endOfDay.getTime()
        } else {
          // PostgreSQL and MySQL need ISO strings
          endDate = endOfDay.toISOString()
        }
      }

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
        // Convert Date objects to appropriate format for the database
        let start: string | number
        let end: string | number

        if (this.databaseAdapter.isTimestampInteger()) {
          if (this.databaseAdapter.getEngineType() === 'sqlite') {
            start = Math.floor(relativeDates.start.getTime() / 1000)
            end = Math.floor(relativeDates.end.getTime() / 1000)
          } else {
            start = relativeDates.start.getTime()
            end = relativeDates.end.getTime()
          }
        } else {
          // PostgreSQL and MySQL need ISO strings
          start = relativeDates.start.toISOString()
          end = relativeDates.end.toISOString()
        }

        return and(
          gte(fieldExpr as AnyColumn, start),
          lte(fieldExpr as AnyColumn, end)
        ) as SQL
      }

      // Handle absolute date (single date)
      const normalizedDate = this.normalizeDate(dateRange)
      if (!normalizedDate) return null

      // For single date, create range for the whole day
      // normalizedDate might be a timestamp (number) or ISO string depending on database
      const dateObj = typeof normalizedDate === 'number'
        ? new Date(normalizedDate * (this.databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
        : new Date(normalizedDate)
      const startOfDay = new Date(dateObj)
      startOfDay.setUTCHours(0, 0, 0, 0)  // Ensure we start at midnight UTC
      const endOfDay = new Date(dateObj)
      endOfDay.setUTCHours(23, 59, 59, 999)  // Ensure we end at 11:59:59.999 UTC

      // Convert to appropriate format for the database
      let startValue: string | number
      let endValue: string | number

      if (this.databaseAdapter.isTimestampInteger()) {
        if (this.databaseAdapter.getEngineType() === 'sqlite') {
          startValue = Math.floor(startOfDay.getTime() / 1000)
          endValue = Math.floor(endOfDay.getTime() / 1000)
        } else {
          startValue = startOfDay.getTime()
          endValue = endOfDay.getTime()
        }
      } else {
        // PostgreSQL and MySQL need ISO strings
        startValue = startOfDay.toISOString()
        endValue = endOfDay.toISOString()
      }

      return and(
        gte(fieldExpr as AnyColumn, startValue),
        lte(fieldExpr as AnyColumn, endValue)
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
   * Returns ISO string for PostgreSQL/MySQL, Unix timestamp for SQLite, or null
   * Ensures dates are in the correct format for each database engine
   */
  private normalizeDate(value: any): string | number | null {
    if (!value) return null

    // If it's already a Date object, validate and convert to appropriate format
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null
      // Return timestamp for integer-based databases, ISO string for others
      // SQLite stores timestamps as Unix seconds (not milliseconds)
      if (this.databaseAdapter.isTimestampInteger()) {
        return this.databaseAdapter.getEngineType() === 'sqlite'
          ? Math.floor(value.getTime() / 1000)
          : value.getTime()
      }
      // PostgreSQL and MySQL need ISO strings, not Date objects
      return value.toISOString()
    }

    // If it's a number, assume it's a timestamp
    if (typeof value === 'number') {
      // If it's a reasonable Unix timestamp in seconds (10 digits), convert to milliseconds
      // Otherwise assume it's already in milliseconds
      const timestamp = value < 10000000000 ? value * 1000 : value
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return null
      // Return timestamp for integer-based databases, ISO string for others
      // SQLite stores timestamps as Unix seconds (not milliseconds)
      if (this.databaseAdapter.isTimestampInteger()) {
        return this.databaseAdapter.getEngineType() === 'sqlite'
          ? Math.floor(timestamp / 1000)
          : timestamp
      }
      // PostgreSQL and MySQL need ISO strings, not Date objects
      return date.toISOString()
    }

    // If it's a string, try to parse it as a Date
    if (typeof value === 'string') {
      // Check if it's a date-only string (YYYY-MM-DD format)
      // Parse as UTC midnight to avoid timezone/DST issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        const parsed = new Date(value + 'T00:00:00Z')
        if (isNaN(parsed.getTime())) return null
        // Return timestamp for integer-based databases, ISO string for others
        // SQLite stores timestamps as Unix seconds (not milliseconds)
        if (this.databaseAdapter.isTimestampInteger()) {
          return this.databaseAdapter.getEngineType() === 'sqlite'
            ? Math.floor(parsed.getTime() / 1000)
            : parsed.getTime()
        }
        // PostgreSQL and MySQL need ISO strings, not Date objects
        return parsed.toISOString()
      }

      // For other formats (with time components), use default parsing
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) return null
      // Return timestamp for integer-based databases, ISO string for others
      // SQLite stores timestamps as Unix seconds (not milliseconds)
      if (this.databaseAdapter.isTimestampInteger()) {
        return this.databaseAdapter.getEngineType() === 'sqlite'
          ? Math.floor(parsed.getTime() / 1000)
          : parsed.getTime()
      }
      // PostgreSQL and MySQL need ISO strings, not Date objects
      return parsed.toISOString()
    }

    // Try to parse any other type as date
    const parsed = new Date(value)
    if (isNaN(parsed.getTime())) return null
    // Return timestamp for integer-based databases, ISO string for others
    // SQLite stores timestamps as Unix seconds (not milliseconds)
    if (this.databaseAdapter.isTimestampInteger()) {
      return this.databaseAdapter.getEngineType() === 'sqlite'
        ? Math.floor(parsed.getTime() / 1000)
        : parsed.getTime()
    }
    // PostgreSQL and MySQL need ISO strings, not Date objects
    return parsed.toISOString()
  }

  /**
   * Build GROUP BY fields from dimensions and time dimensions
   * Works for both single and multi-cube queries
   */
  buildGroupByFields(
    cubes: Map<string, Cube> | Cube, 
    query: SemanticQuery, 
    context: QueryContext,
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
            const matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)
            
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
            const matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)
            
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
}
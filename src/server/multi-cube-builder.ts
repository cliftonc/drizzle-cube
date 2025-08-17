/**
 * Multi-Cube Query Builder for Dynamic Approach
 * Handles cross-cube queries by building CTEs for each cube and joining them
 */

import { 
  sql, 
  and, 
  eq,
  type SQL,
  type AnyColumn
} from 'drizzle-orm'

import type { 
  Cube,
  CubeWithJoins,
  QueryContext,
  MultiCubeQueryPlan
} from './types-drizzle'

import type { 
  SemanticQuery,
  SecurityContext
} from './types'

import { resolveSqlExpression, createMultiCubeContext } from './types-drizzle'

export class MultiCubeBuilder<TSchema extends Record<string, any> = Record<string, any>> {
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
    cubes: Map<string, CubeWithJoins<TSchema>>,
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
    const joinCubes = this.buildJoinPlan(cubes, primaryCube, cubeNames, ctx.securityContext)
    
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
    cubes: Map<string, CubeWithJoins<TSchema>>,
    primaryCube: CubeWithJoins<TSchema>,
    cubeNames: string[],
    securityContext: SecurityContext
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
        {
          db: {} as any, // Will be filled in during execution
          schema: {} as any, // Will be filled in during execution
          securityContext
        },
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
    cubes: Map<string, CubeWithJoins<TSchema>>,
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
          selections[dimensionName] = sqlExpr
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
          selections[measureName] = aggregatedExpr
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
          selections[timeDim.dimension] = timeExpr
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
    
    // Apply aggregation function based on measure type
    switch (measure.type) {
      case 'count':
        return sql`COUNT(${baseExpr})`
      case 'countDistinct':
        return sql`COUNT(DISTINCT ${baseExpr})`
      case 'sum':
        return sql`SUM(${baseExpr})`
      case 'avg':
        return sql`AVG(${baseExpr})`
      case 'min':
        return sql`MIN(${baseExpr})`
      case 'max':
        return sql`MAX(${baseExpr})`
      case 'number':
        return baseExpr as SQL
      default:
        return sql`COUNT(${baseExpr})`
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
    
    // Apply date truncation based on granularity (PostgreSQL specific)
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
   * Build WHERE conditions for multi-cube query
   */
  private buildMultiCubeWhereConditions(
    cubes: Map<string, CubeWithJoins<TSchema>>,
    query: SemanticQuery,
    ctx: QueryContext<TSchema>
  ): SQL[] {
    const conditions: SQL[] = []
    
    // Process filters from query
    if (query.filters) {
      for (const filter of query.filters) {
        // Extract cube name from filter member
        if ('member' in filter) {
          const [cubeName] = filter.member.split('.')
          const cube = cubes.get(cubeName)
          
          if (cube) {
            // Build filter condition using single-cube logic
            // This is simplified - in reality you'd reuse the filter building logic
            // from DrizzleExecutor
            const condition = this.buildFilterCondition(filter, cube, ctx)
            if (condition) {
              conditions.push(condition)
            }
          }
        }
      }
    }
    
    return conditions
  }

  /**
   * Filter condition builder (would reuse logic from DrizzleExecutor)
   */
  private buildFilterCondition(
    filter: any, 
    cube: Cube<TSchema>, 
    ctx: QueryContext<TSchema>
  ): SQL | null {
    // Extract filter building logic from DrizzleExecutor
    // For now, implement basic equals condition
    if (filter.operator === 'equals' && filter.values && filter.values.length > 0) {
      const [cubeName, fieldName] = filter.member.split('.')
      if (cubeName === cube.name) {
        const field = cube.dimensions[fieldName] || cube.measures[fieldName]
        if (field) {
          const fieldExpr = typeof field.sql === 'function' 
            ? field.sql(ctx)
            : field.sql
          return eq(fieldExpr as any, filter.values[0])
        }
      }
    }
    return null
  }

  /**
   * Build GROUP BY fields for multi-cube query
   */
  private buildMultiCubeGroupByFields(
    cubes: Map<string, CubeWithJoins<TSchema>>,
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
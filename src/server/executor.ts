/**
 * Unified Drizzle Query Executor
 * Handles both single and multi-cube queries through a unified execution path
 * Uses QueryBuilder for SQL generation and QueryPlanner for query planning
 */

import { 
  and,
  SQL
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
  QueryContext
} from './types-drizzle'

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
   * Build unified query that works for both single and multi-cube queries
   */
  private buildUnifiedQuery(
    queryPlan: any,
    query: SemanticQuery,
    context: QueryContext<TSchema>
  ) {
    // Get primary cube's base SQL definition
    const primaryCubeBase = queryPlan.primaryCube.sql(context)
    
    // Build selections using QueryBuilder
    const selections = this.queryBuilder.buildSelections(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context
    )
    
    // Start building the query from the primary cube
    let drizzleQuery = context.db
      .select(selections)
      .from(primaryCubeBase.from)

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
        const joinCubeBase = joinCube.cube.sql(context)
        
        try {
          switch (joinCube.joinType || 'left') {
            case 'left':
              drizzleQuery = drizzleQuery.leftJoin(joinCubeBase.from, joinCube.joinCondition)
              break
            case 'inner':
              drizzleQuery = drizzleQuery.innerJoin(joinCubeBase.from, joinCube.joinCondition)
              break
            case 'right':
              drizzleQuery = drizzleQuery.rightJoin(joinCubeBase.from, joinCube.joinCondition)
              break
            case 'full':
              drizzleQuery = drizzleQuery.fullJoin(joinCubeBase.from, joinCube.joinCondition)
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
      context
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
      context
    )
    if (groupByFields.length > 0) {
      drizzleQuery = drizzleQuery.groupBy(...groupByFields)
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
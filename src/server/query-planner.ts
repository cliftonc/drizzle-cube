/**
 * Query Planner for Unified Query Architecture
 * Handles query planning, cube analysis, and join resolution
 * All SQL building has been moved to QueryBuilder
 */

import type { 
  Cube,
  QueryContext,
  QueryPlan,
  CubeJoin,
  SemanticQuery
} from './types'

import { 
  resolveCubeReference, 
  getJoinType 
} from './cube-utils'

import { eq, and, sql, type SQL } from 'drizzle-orm'


/**
 * Pre-aggregation plan for handling hasMany relationships
 */
// interface PreAggregationPlan {
//   cube: Cube
//   alias: string
//   joinKeys: Array<{
//     sourceColumn: string
//     targetColumn: string
//   }>
//   needsPreAggregation: boolean
//   measures: string[]
// }

export class QueryPlanner {
  
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
    
    // Extract cube names from filters
    if (query.filters) {
      for (const filter of query.filters) {
        this.extractCubeNamesFromFilter(filter, cubesUsed)
      }
    }
    
    return cubesUsed
  }

  /**
   * Recursively extract cube names from filters (handles logical filters)
   */
  private extractCubeNamesFromFilter(filter: any, cubesUsed: Set<string>): void {
    // Handle logical filters (AND/OR)
    if ('and' in filter || 'or' in filter) {
      const logicalFilters = filter.and || filter.or || []
      for (const subFilter of logicalFilters) {
        this.extractCubeNamesFromFilter(subFilter, cubesUsed)
      }
      return
    }

    // Handle simple filter condition
    if ('member' in filter) {
      const [cubeName] = filter.member.split('.')
      if (cubeName) {
        cubesUsed.add(cubeName)
      }
    }
  }

  /**
   * Extract measures referenced in filters (for CTE inclusion)
   */
  private extractMeasuresFromFilters(query: SemanticQuery, cubeName: string): string[] {
    const measures: string[] = []
    
    if (!query.filters) {
      return measures
    }
    
    for (const filter of query.filters) {
      this.extractMeasuresFromFilter(filter, cubeName, measures)
    }
    
    return measures
  }

  /**
   * Recursively extract measures from filters for a specific cube
   */
  private extractMeasuresFromFilter(filter: any, targetCubeName: string, measures: string[]): void {
    // Handle logical filters (AND/OR)
    if ('and' in filter || 'or' in filter) {
      const logicalFilters = filter.and || filter.or || []
      for (const subFilter of logicalFilters) {
        this.extractMeasuresFromFilter(subFilter, targetCubeName, measures)
      }
      return
    }

    // Handle simple filter condition
    if ('member' in filter) {
      const memberName = filter.member
      const [cubeName] = memberName.split('.')
      if (cubeName === targetCubeName) {
        // This is a filter on the target cube - check if it's a measure
        // We'll include it and let the CTE building logic determine if it's actually a measure
        measures.push(memberName)
      }
    }
  }

  /**
   * Create a unified query plan that works for both single and multi-cube queries
   */
  createQueryPlan(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    _ctx: QueryContext
  ): QueryPlan {
    const cubesUsed = this.analyzeCubeUsage(query)
    const cubeNames = Array.from(cubesUsed)
    
    if (cubeNames.length === 0) {
      throw new Error('No cubes found in query')
    }
    
    // Choose primary cube
    const primaryCubeName = this.choosePrimaryCube(cubeNames, query, cubes)
    const primaryCube = cubes.get(primaryCubeName)
    
    if (!primaryCube) {
      throw new Error(`Primary cube '${primaryCubeName}' not found`)
    }
    
    // For single cube queries, return simple plan with empty join array
    if (cubeNames.length === 1) {
      return {
        primaryCube,
        joinCubes: [], // Empty for single cube
        selections: {}, // Will be built by QueryBuilder
        whereConditions: [], // Will be built by QueryBuilder
        groupByFields: [] // Will be built by QueryBuilder
      }
    }
    
    // For multi-cube queries, build join plan
    const joinCubes = this.buildJoinPlan(cubes, primaryCube, cubeNames)
    
    // Detect hasMany relationships and plan pre-aggregation CTEs
    const preAggregationCTEs = this.planPreAggregationCTEs(cubes, primaryCube, joinCubes, query)
    
    return {
      primaryCube,
      joinCubes,
      selections: {}, // Will be built by QueryBuilder
      whereConditions: [], // Will be built by QueryBuilder
      groupByFields: [], // Will be built by QueryBuilder
      preAggregationCTEs
    }
  }

  /**
   * Choose the primary cube based on query analysis
   * Uses a consistent strategy to avoid measure order dependencies
   */
  choosePrimaryCube(cubeNames: string[], query: SemanticQuery, cubes?: Map<string, Cube>): string {
    // Strategy: Prefer the cube that has dimensions in the query
    // This represents the "grain" of the analysis
    if (query.dimensions && query.dimensions.length > 0 && cubes) {
      const dimensionCubes = query.dimensions.map(d => d.split('.')[0])
      
      // Find the cube with the most dimensions in the query
      const cubeDimensionCount = new Map<string, number>()
      for (const cube of dimensionCubes) {
        cubeDimensionCount.set(cube, (cubeDimensionCount.get(cube) || 0) + 1)
      }
      
      if (cubeDimensionCount.size > 0) {
        // Return the cube with the most dimensions, but verify connectivity first
        const maxDimensions = Math.max(...cubeDimensionCount.values())
        const primaryCandidates = [...cubeDimensionCount.entries()]
          .filter(([, count]) => count === maxDimensions)
          .map(([name]) => name)
          .sort()
          
        // Check if the primary candidate can reach all other required cubes
        for (const candidate of primaryCandidates) {
          if (this.canReachAllCubes(candidate, cubeNames, cubes)) {
            return candidate
          }
        }
      }
    }
    
    // Fallback: Choose cube with most connectivity that can reach all other cubes
    if (cubes) {
      const connectivityScores = new Map<string, number>()
      
      for (const cubeName of cubeNames) {
        if (this.canReachAllCubes(cubeName, cubeNames, cubes)) {
          const cube = cubes.get(cubeName)
          const joinCount = cube?.joins ? Object.keys(cube.joins).length : 0
          connectivityScores.set(cubeName, joinCount)
        }
      }
      
      if (connectivityScores.size > 0) {
        // Find cube with highest connectivity, break ties alphabetically
        const maxConnectivity = Math.max(...connectivityScores.values())
        const mostConnectedCubes = [...connectivityScores.entries()]
          .filter(([, count]) => count === maxConnectivity)
          .map(([name]) => name)
          .sort()
          
        return mostConnectedCubes[0]
      }
    }
    
    // Final fallback: alphabetical order for consistency
    return [...cubeNames].sort()[0]
  }

  /**
   * Check if a cube can reach all other cubes in the list via joins
   */
  private canReachAllCubes(fromCube: string, allCubes: string[], cubes: Map<string, Cube>): boolean {
    const otherCubes = allCubes.filter(name => name !== fromCube)
    
    for (const targetCube of otherCubes) {
      const path = this.findJoinPath(cubes, fromCube, targetCube, new Set())
      if (!path || path.length === 0) {
        return false
      }
    }
    
    return true
  }

  /**
   * Build join plan for multi-cube query
   * Supports both direct joins and transitive joins through intermediate cubes
   */
  private buildJoinPlan(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cubeNames: string[]
  ): QueryPlan['joinCubes'] {
    const joinCubes: QueryPlan['joinCubes'] = []
    const processedCubes = new Set([primaryCube.name])
    
    // Find cubes to join (all except primary)
    const cubesToJoin = cubeNames.filter(name => name !== primaryCube.name)
    
    for (const cubeName of cubesToJoin) {
      if (processedCubes.has(cubeName)) {
        continue // Already processed
      }
      
      const joinPath = this.findJoinPath(cubes, primaryCube.name, cubeName, processedCubes)
      if (!joinPath || joinPath.length === 0) {
        throw new Error(`No join path found from '${primaryCube.name}' to '${cubeName}'`)
      }
      
      // Add all cubes in the join path
      for (const { toCube, joinDef } of joinPath) {
        if (processedCubes.has(toCube)) {
          continue // Skip if already processed
        }
        
        const cube = cubes.get(toCube)
        if (!cube) {
          throw new Error(`Cube '${toCube}' not found`)
        }
        
        // Build join condition using new array-based format
        // For regular table joins, we don't use artificial aliases - use actual table references
        const joinCondition = this.buildJoinCondition(
          joinDef as CubeJoin,
          null, // No source alias needed - use the actual column
          null // No target alias needed - use the actual column 
        )
        
        // Derive join type from relationship
        const joinType = getJoinType(joinDef.relationship, joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'
        
        joinCubes.push({
          cube,
          alias: `${toCube.toLowerCase()}_cube`,
          joinType,
          joinCondition
        })
        
        processedCubes.add(toCube)
      }
    }
    
    return joinCubes
  }

  /**
   * Build join condition from new array-based join definition
   */
  private buildJoinCondition(
    joinDef: CubeJoin,
    sourceAlias: string | null,
    targetAlias: string | null
  ): SQL {
    const conditions: SQL[] = []
    
    // Process array of join conditions
    for (const joinOn of joinDef.on) {
      // Use actual column objects instead of aliases for regular table joins
      const sourceCol = sourceAlias 
        ? sql`${sql.identifier(sourceAlias)}.${sql.identifier(joinOn.source.name)}`
        : joinOn.source
        
      const targetCol = targetAlias
        ? sql`${sql.identifier(targetAlias)}.${sql.identifier(joinOn.target.name)}`
        : joinOn.target
      
      // Use custom comparator or default to eq
      const comparator = joinOn.as || eq
      conditions.push(comparator(sourceCol as any, targetCol as any))
    }
    
    return and(...conditions)!
  }

  /**
   * Find join path from source cube to target cube
   * Returns array of join steps to reach target
   */
  private findJoinPath(
    cubes: Map<string, Cube>,
    fromCube: string,
    toCube: string,
    alreadyProcessed: Set<string>
  ): Array<{ fromCube: string, toCube: string, joinDef: any }> | null {
    if (fromCube === toCube) {
      return []
    }

    // BFS to find shortest path
    const queue: Array<{ cube: string, path: Array<{ fromCube: string, toCube: string, joinDef: any }> }> = [
      { cube: fromCube, path: [] }
    ]
    const visited = new Set([fromCube, ...alreadyProcessed])

    while (queue.length > 0) {
      const { cube: currentCube, path } = queue.shift()!
      const cubeDefinition = cubes.get(currentCube)

      if (!cubeDefinition?.joins) {
        continue
      }

      // Check all joins from current cube - resolve lazy references
      for (const [, joinDef] of Object.entries(cubeDefinition.joins)) {
        // Resolve cube reference to get actual cube name
        const resolvedTargetCube = resolveCubeReference(joinDef.targetCube)
        const actualTargetName = resolvedTargetCube.name
        
        if (visited.has(actualTargetName)) {
          continue
        }

        const newPath = [...path, {
          fromCube: currentCube,
          toCube: actualTargetName,
          joinDef
        }]

        if (actualTargetName === toCube) {
          return newPath
        }

        visited.add(actualTargetName)
        queue.push({ cube: actualTargetName, path: newPath })
      }
    }

    // If no direct path found, try looking for reverse joins
    // (where other cubes join to the current cube chain)
    return null
  }

  /**
   * Plan pre-aggregation CTEs for hasMany relationships to prevent fan-out
   */
  private planPreAggregationCTEs(
    _cubes: Map<string, Cube>,
    primaryCube: Cube,
    joinCubes: QueryPlan['joinCubes'],
    query: SemanticQuery
  ): QueryPlan['preAggregationCTEs'] {
    const preAggCTEs: QueryPlan['preAggregationCTEs'] = []
    
    if (!query.measures || query.measures.length === 0) {
      return preAggCTEs // No measures, no fan-out risk
    }
    
    // Check each join cube for hasMany relationships
    for (const joinCube of joinCubes) {
      const hasManyJoinDef = this.findHasManyJoinDef(primaryCube, joinCube.cube.name)
      if (!hasManyJoinDef) {
        continue // Not a hasMany relationship
      }
      
      // Check if we have measures from this hasMany cube (from SELECT clause)
      const measuresFromSelect = query.measures ? query.measures.filter(m => 
        m.startsWith(joinCube.cube.name + '.')
      ) : []
      
      // Also check for measures referenced in filters (for HAVING clause)
      const measuresFromFilters = this.extractMeasuresFromFilters(query, joinCube.cube.name)
      
      // Combine and deduplicate measures from both SELECT and filters
      const allMeasuresFromThisCube = [...new Set([...measuresFromSelect, ...measuresFromFilters])]
      
      if (allMeasuresFromThisCube.length === 0) {
        continue // No measures from this cube, no fan-out risk
      }
      
      // Extract join keys from the new array-based format
      const joinKeys = hasManyJoinDef.on.map(joinOn => ({
        sourceColumn: joinOn.source.name,
        targetColumn: joinOn.target.name,
        sourceColumnObj: joinOn.source,
        targetColumnObj: joinOn.target
      }))
      
      preAggCTEs!.push({
        cube: joinCube.cube,
        alias: joinCube.alias,
        cteAlias: `${joinCube.cube.name.toLowerCase()}_agg`,
        joinKeys,
        measures: allMeasuresFromThisCube
      })
    }
    
    return preAggCTEs
  }

  /**
   * Find hasMany join definition from primary cube to target cube
   */
  private findHasManyJoinDef(
    primaryCube: Cube,
    targetCubeName: string
  ): CubeJoin | null {
    if (!primaryCube.joins) {
      return null
    }
    
    // Look through all joins from primary cube
    for (const [, joinDef] of Object.entries(primaryCube.joins)) {
      const resolvedTargetCube = resolveCubeReference(joinDef.targetCube)
      if (resolvedTargetCube.name === targetCubeName && joinDef.relationship === 'hasMany') {
        return joinDef as CubeJoin
      }
    }
    
    return null
  }
}
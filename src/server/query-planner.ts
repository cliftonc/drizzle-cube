/**
 * Query Planner for Unified Query Architecture
 * Handles query planning, cube analysis, and join resolution
 * All SQL building has been moved to QueryBuilder
 */

import type { 
  Cube,
  QueryContext,
  QueryPlan
} from './types-drizzle'

import type { 
  SemanticQuery
} from './types'

import { createMultiCubeContext } from './types-drizzle'

export class QueryPlanner<TSchema extends Record<string, any> = Record<string, any>> {
  
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
   * Create a unified query plan that works for both single and multi-cube queries
   */
  createQueryPlan(
    cubes: Map<string, Cube<TSchema>>,
    query: SemanticQuery,
    ctx: QueryContext<TSchema>
  ): QueryPlan<TSchema> {
    const cubesUsed = this.analyzeCubeUsage(query)
    const cubeNames = Array.from(cubesUsed)
    
    if (cubeNames.length === 0) {
      throw new Error('No cubes found in query')
    }
    
    // Choose primary cube
    const primaryCubeName = this.choosePrimaryCube(cubeNames, query)
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
    const joinCubes = this.buildJoinPlan(cubes, primaryCube, cubeNames, ctx)
    
    return {
      primaryCube,
      joinCubes,
      selections: {}, // Will be built by QueryBuilder
      whereConditions: [], // Will be built by QueryBuilder
      groupByFields: [] // Will be built by QueryBuilder
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
   * Supports both direct joins and transitive joins through intermediate cubes
   */
  private buildJoinPlan(
    cubes: Map<string, Cube<TSchema>>,
    primaryCube: Cube<TSchema>,
    cubeNames: string[],
    ctx: QueryContext<TSchema>
  ): QueryPlan<TSchema>['joinCubes'] {
    const joinCubes: QueryPlan<TSchema>['joinCubes'] = []
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
      for (const { fromCube, toCube, joinDef } of joinPath) {
        if (processedCubes.has(toCube)) {
          continue // Skip if already processed
        }
        
        const cube = cubes.get(toCube)
        if (!cube) {
          throw new Error(`Cube '${toCube}' not found`)
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
          alias: `${toCube.toLowerCase()}_cube`,
          joinType: joinDef.type || 'left',
          joinCondition
        })
        
        processedCubes.add(toCube)
      }
    }
    
    return joinCubes
  }

  /**
   * Find join path from source cube to target cube
   * Returns array of join steps to reach target
   */
  private findJoinPath(
    cubes: Map<string, Cube<TSchema>>,
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

      // Check all joins from current cube
      for (const [joinTargetCube, joinDef] of Object.entries(cubeDefinition.joins)) {
        if (visited.has(joinTargetCube)) {
          continue
        }

        const newPath = [...path, {
          fromCube: currentCube,
          toCube: joinTargetCube,
          joinDef
        }]

        if (joinTargetCube === toCube) {
          return newPath
        }

        visited.add(joinTargetCube)
        queue.push({ cube: joinTargetCube, path: newPath })
      }
    }

    // If no direct path found, try looking for reverse joins
    // (where other cubes join to the current cube chain)
    return null
  }
}
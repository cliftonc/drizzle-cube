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
    
    return cubesUsed
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
   */
  private buildJoinPlan(
    cubes: Map<string, Cube<TSchema>>,
    primaryCube: Cube<TSchema>,
    cubeNames: string[],
    ctx: QueryContext<TSchema>
  ): QueryPlan<TSchema>['joinCubes'] {
    const joinCubes: QueryPlan<TSchema>['joinCubes'] = []
    
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
}
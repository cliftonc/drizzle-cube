import type { SemanticCube, SemanticJoin, QueryContext } from './types'

export interface JoinPath {
  fromCube: string
  toCube: string
  join: SemanticJoin
  direction: 'forward' | 'reverse'
}

export interface ResolvedJoin {
  cube: SemanticCube
  alias: string
  joinSql?: string
  relationship?: string
}

/**
 * Join Path Resolver
 * Handles resolution of cube-to-cube joins and path finding
 */
export class JoinPathResolver {
  private cubes: Map<string, SemanticCube>

  constructor(cubes: Map<string, SemanticCube>) {
    this.cubes = cubes
  }

  /**
   * Find the shortest join path between two cubes
   */
  findJoinPath(fromCube: string, toCube: string): JoinPath[] | null {
    if (fromCube === toCube) {
      return []
    }

    // BFS to find shortest path
    const queue: { cube: string; path: JoinPath[] }[] = [{ cube: fromCube, path: [] }]
    const visited = new Set<string>([fromCube])

    while (queue.length > 0) {
      const { cube: currentCube, path } = queue.shift()!
      const cubeDefinition = this.cubes.get(currentCube)

      if (!cubeDefinition?.joins) {
        continue
      }

      // Check all joins from current cube
      for (const [joinName, join] of Object.entries(cubeDefinition.joins)) {
        if (visited.has(joinName)) {
          continue
        }

        const newPath = [...path, {
          fromCube: currentCube,
          toCube: joinName,
          join,
          direction: 'forward' as const
        }]

        if (joinName === toCube) {
          return newPath
        }

        visited.add(joinName)
        queue.push({ cube: joinName, path: newPath })
      }

      // Also check reverse joins (where other cubes join to current cube)
      for (const [cubeName, otherCube] of Array.from(this.cubes.entries())) {
        if (visited.has(cubeName) || !otherCube.joins) {
          continue
        }

        for (const [joinName, join] of Object.entries(otherCube.joins)) {
          if (joinName === currentCube) {
            // Found a reverse join
            const newPath: JoinPath[] = [...path, {
              fromCube: currentCube,
              toCube: cubeName,
              join,
              direction: 'reverse' as const
            }]

            if (cubeName === toCube) {
              return newPath
            }

            visited.add(cubeName)
            queue.push({ cube: cubeName, path: newPath })
          }
        }
      }
    }

    return null // No path found
  }

  /**
   * Resolve all cubes needed for a query and their join relationships
   */
  resolveQueryCubes(query: {
    measures?: string[]
    dimensions?: string[]
    timeDimensions?: Array<{ dimension: string }>
  }): ResolvedJoin[] {
    const referencedCubes = new Set<string>()

    // Extract cube names from measures
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName] = measure.split('.')
        if (cubeName && this.cubes.has(cubeName)) {
          referencedCubes.add(cubeName)
        }
      }
    }

    // Extract cube names from dimensions
    if (query.dimensions) {
      for (const dimension of query.dimensions) {
        const [cubeName] = dimension.split('.')
        if (cubeName && this.cubes.has(cubeName)) {
          referencedCubes.add(cubeName)
        }
      }
    }

    // Extract cube names from time dimensions
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName] = timeDim.dimension.split('.')
        if (cubeName && this.cubes.has(cubeName)) {
          referencedCubes.add(cubeName)
        }
      }
    }

    if (referencedCubes.size === 0) {
      return []
    }

    if (referencedCubes.size === 1) {
      // Single cube query - no joins needed
      const cubeName = Array.from(referencedCubes)[0]
      const cube = this.cubes.get(cubeName)!
      return [{
        cube,
        alias: `t_${cubeName.toLowerCase()}`
      }]
    }

    // Multi-cube query - resolve join paths
    return this.resolveMultiCubeJoins(Array.from(referencedCubes))
  }

  /**
   * Resolve joins for multiple cubes, finding optimal join tree
   */
  private resolveMultiCubeJoins(cubeNames: string[]): ResolvedJoin[] {
    // Choose the first cube as the primary/root cube
    const primaryCube = cubeNames[0]
    const resolved: ResolvedJoin[] = []
    const processedCubes = new Set<string>()

    // Add primary cube (no join needed)
    const primaryCubeDefinition = this.cubes.get(primaryCube)!
    resolved.push({
      cube: primaryCubeDefinition,
      alias: `t_${primaryCube.toLowerCase()}`
    })
    processedCubes.add(primaryCube)

    // Build a join tree by finding the shortest path to each target cube
    // and adding any intermediate cubes needed
    for (let i = 1; i < cubeNames.length; i++) {
      const targetCube = cubeNames[i]
      
      if (processedCubes.has(targetCube)) {
        continue // Already processed
      }

      // Find the best join path to this cube from any already resolved cube
      let bestPath: JoinPath[] | null = null
      
      // Try to find a path from any already resolved cube
      for (const resolvedCube of resolved) {
        const path = this.findJoinPath(resolvedCube.cube.name, targetCube)
        if (path && (bestPath === null || path.length < bestPath.length)) {
          bestPath = path
        }
      }

      if (!bestPath) {
        // No join path found to target cube
        continue
      }

      // Add all intermediate cubes from the best path
      for (const pathStep of bestPath) {
        if (processedCubes.has(pathStep.toCube)) {
          continue // Already resolved
        }

        const toCube = this.cubes.get(pathStep.toCube)!
        const joinSql = typeof pathStep.join.sql === 'function' 
          ? 'FUNCTION_PLACEHOLDER' 
          : pathStep.join.sql
        
        resolved.push({
          cube: toCube,
          alias: `t_${pathStep.toCube.toLowerCase()}`,
          joinSql: typeof joinSql === 'string' ? joinSql : joinSql?.toString(),
          relationship: pathStep.join.relationship
        })
        
        processedCubes.add(pathStep.toCube)
      }
    }

    return resolved
  }

  /**
   * Substitute cube references in join SQL
   * Converts ${CUBE}.field and ${otherCube.field} to proper aliases
   */
  substituteCubeReferences(joinSql: string | ((context: QueryContext) => any), _context: QueryContext, fromCubeAlias: string, resolvedCubes: ResolvedJoin[]): string {
    if (typeof joinSql === 'function') {
      // For function-based SQL, we'd need to call it and convert to string
      // For now, return a placeholder
      return 'FUNCTION_JOIN_PLACEHOLDER'
    }

    let result = joinSql

    // Replace ${CUBE} with the from cube alias
    result = result.replace(/\$\{CUBE\}/g, fromCubeAlias)

    // Replace ${cubeName.field} references
    const cubeRefPattern = /\$\{(\w+)\.(\w+)\}/g
    result = result.replace(cubeRefPattern, (match, cubeName, fieldName) => {
      const resolvedCube = resolvedCubes.find(r => r.cube.name === cubeName)
      if (!resolvedCube) {
        // Referenced cube not found in resolved cubes
        return match
      }

      // Look up the field in the cube's dimensions or use as-is
      const cube = resolvedCube.cube
      const dimension = cube.dimensions[fieldName]
      
      if (dimension) {
        // If it's a defined dimension, use its SQL expression
        const dimensionSql = typeof dimension.sql === 'string' ? dimension.sql : fieldName
        return `${resolvedCube.alias}.${dimensionSql}`
      } else {
        // Otherwise, treat as a direct field reference
        return `${resolvedCube.alias}.${fieldName}`
      }
    })

    return result
  }

  /**
   * Validate that all join paths are valid
   */
  validateJoinPaths(resolvedCubes: ResolvedJoin[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const resolved of resolvedCubes) {
      if (!resolved.joinSql) {
        continue // Primary cube doesn't need join validation
      }

      // Check for circular references
      // This is a simplified check - could be more sophisticated
      if (resolved.joinSql.includes(resolved.alias)) {
        errors.push(`Potential circular reference in join for cube ${resolved.cube.name}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
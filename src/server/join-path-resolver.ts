/**
 * JoinPathResolver - Handles join path finding and connectivity analysis
 *
 * Extracted from QueryPlanner for single responsibility.
 * Uses BFS algorithm to find shortest paths between cubes.
 * Includes connectivity caching for performance optimization.
 */

import type { Cube, CubeJoin } from './types'
import { resolveCubeReference, isolateSqlExpression } from './cube-utils'
import { eq, and, sql, type SQL } from 'drizzle-orm'

/**
 * Internal representation of a join path step
 * Used during path finding - simpler than the public JoinPathStep analysis type
 */
export interface InternalJoinPathStep {
  /** Source cube name */
  fromCube: string
  /** Target cube name */
  toCube: string
  /** The join definition from the source cube */
  joinDef: CubeJoin
}

/**
 * Cache entry for connectivity between cubes
 * Simple cache without TTL since cube config is set once at startup
 */
interface ConnectivityCacheEntry {
  path: InternalJoinPathStep[] | null
}

/**
 * Resolves join paths between cubes and manages connectivity caching
 */
export class JoinPathResolver {
  private cubes: Map<string, Cube>
  private connectivityCache: Map<string, ConnectivityCacheEntry> = new Map()

  /**
   * @param cubes Map of cube name to cube definition
   */
  constructor(cubes: Map<string, Cube>) {
    this.cubes = cubes
  }

  /**
   * Find the shortest join path from source cube to target cube
   * Uses BFS algorithm for optimal path discovery
   *
   * @param fromCube Source cube name
   * @param toCube Target cube name
   * @param alreadyProcessed Set of cubes to exclude from path finding
   * @returns Array of join steps or null if no path exists
   */
  findPath(
    fromCube: string,
    toCube: string,
    alreadyProcessed: Set<string> = new Set()
  ): InternalJoinPathStep[] | null {
    if (fromCube === toCube) {
      return []
    }

    // Check cache first
    const cacheKey = this.getCacheKey(fromCube, toCube, alreadyProcessed)
    const cached = this.getFromCache(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // BFS to find shortest path
    const queue: Array<{ cube: string; path: InternalJoinPathStep[] }> = [
      { cube: fromCube, path: [] }
    ]
    const visited = new Set([fromCube, ...alreadyProcessed])

    while (queue.length > 0) {
      const { cube: currentCube, path } = queue.shift()!
      const cubeDefinition = this.cubes.get(currentCube)

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

        const newPath: InternalJoinPathStep[] = [
          ...path,
          {
            fromCube: currentCube,
            toCube: actualTargetName,
            joinDef
          }
        ]

        if (actualTargetName === toCube) {
          // Cache successful path
          this.setInCache(cacheKey, newPath)
          return newPath
        }

        visited.add(actualTargetName)
        queue.push({ cube: actualTargetName, path: newPath })
      }
    }

    // No path found - cache the negative result
    this.setInCache(cacheKey, null)
    return null
  }

  /**
   * Find path that prefers going through specified cubes when possible
   * Used when certain cubes have measures in the query - ensures joins go through
   * the semantically correct path (e.g., through junction tables when their measures are used)
   *
   * IMPORTANT: This method allows paths to go THROUGH already-processed cubes (as intermediate
   * steps) but won't return them as new cubes to add. This is crucial for preferring paths
   * through cubes that have measures (like junction tables).
   *
   * Path scoring priority (highest to lowest):
   * 1. Paths using joins with `preferredFor` that includes the target cube (score +10)
   * 2. Paths going through cubes with measures in the query (score +1 per cube)
   * 3. Paths reusing already-processed cubes
   * 4. Shorter paths
   *
   * @param fromCube Source cube name
   * @param toCube Target cube name
   * @param preferredCubes Set of cube names to prefer in the path (usually cubes with measures)
   * @param alreadyProcessed Set of cubes already in the join plan (can be used as intermediates)
   * @returns Array of join steps or null if no path exists
   */
  findPathPreferring(
    fromCube: string,
    toCube: string,
    preferredCubes: Set<string>,
    alreadyProcessed: Set<string> = new Set()
  ): InternalJoinPathStep[] | null {
    // Find ALL paths WITHOUT excluding already-processed cubes from intermediate steps
    // This allows us to find paths through cubes that are already in the join plan
    // (e.g., going through EmployeeTeams to reach Teams)
    const allPaths = this.findAllPaths(fromCube, toCube, new Set()) // Note: empty exclusion set
    if (allPaths.length === 0) {
      // Fall back to standard path finding with exclusions
      return this.findPath(fromCube, toCube, alreadyProcessed)
    }

    // Score paths with multiple criteria
    const scored = allPaths.map(path => {
      let score = 0

      // +10 for paths using joins with preferredFor that includes the target cube
      // ONLY apply this bonus when the preferredFor is on the FIRST hop from the starting cube.
      // This ensures preferredFor only matters when we're actually routing FROM the cube
      // that defines the preference, not when we're just passing through it.
      // Example: Employees.joins.EmployeeTeams has preferredFor: ['Teams']
      // - When routing FROM Employees TO Teams: preferredFor applies (first hop)
      // - When routing FROM Departments TO Teams: preferredFor should NOT apply
      //   even if the path goes through Employees
      const usesPreferredJoin = path.some((step, index) =>
        step.joinDef.preferredFor?.includes(toCube) && index === 0
      )

      if (usesPreferredJoin) {
        score += 10
      }

      // +1 for each preferred cube (cubes with measures) in the path
      // BUT penalize longer paths to prevent unnecessarily routing through preferred cubes
      // when a shorter direct path exists
      const preferredCubesInPath = path.filter(step => preferredCubes.has(step.toCube)).length
      score += preferredCubesInPath

      // Penalize path length: subtract (length - 1) to favor shorter paths
      // This ensures a direct path (length 1, penalty 0) beats a path through
      // preferred cubes (e.g., length 4, +1 for preferred, -3 for length = -2)
      score -= (path.length - 1)

      return {
        path,
        score,
        usesProcessed: path.some(step => alreadyProcessed.has(step.toCube))
      }
    })

    // Sort: prefer higher score, then prefer paths using already-processed cubes, then shorter
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.usesProcessed !== b.usesProcessed) return a.usesProcessed ? -1 : 1
      return a.path.length - b.path.length
    })

    return scored[0].path
  }

  /**
   * Find all possible paths between two cubes (up to maxDepth)
   * Used by findPathPreferring to evaluate multiple paths
   *
   * @param fromCube Source cube name
   * @param toCube Target cube name
   * @param alreadyProcessed Set of cubes to exclude from path finding
   * @param maxDepth Maximum path length to search (default 4 to avoid explosion)
   * @returns Array of all valid paths
   */
  private findAllPaths(
    fromCube: string,
    toCube: string,
    alreadyProcessed: Set<string>,
    maxDepth: number = 4
  ): InternalJoinPathStep[][] {
    if (fromCube === toCube) {
      return [[]]
    }

    const allPaths: InternalJoinPathStep[][] = []
    const queue: Array<{ cube: string; path: InternalJoinPathStep[]; visited: Set<string> }> = [
      { cube: fromCube, path: [], visited: new Set([fromCube, ...alreadyProcessed]) }
    ]

    while (queue.length > 0) {
      const { cube: currentCube, path, visited } = queue.shift()!

      // Stop if path is too long
      if (path.length >= maxDepth) {
        continue
      }

      const cubeDefinition = this.cubes.get(currentCube)
      if (!cubeDefinition?.joins) {
        continue
      }

      // Check all joins from current cube
      for (const [, joinDef] of Object.entries(cubeDefinition.joins)) {
        const resolvedTargetCube = resolveCubeReference(joinDef.targetCube)
        const actualTargetName = resolvedTargetCube.name

        if (visited.has(actualTargetName)) {
          continue
        }

        const newPath: InternalJoinPathStep[] = [
          ...path,
          {
            fromCube: currentCube,
            toCube: actualTargetName,
            joinDef
          }
        ]

        if (actualTargetName === toCube) {
          // Found a path - add to results but don't stop (collect all paths)
          allPaths.push(newPath)
        } else {
          // Continue searching - create new visited set for this branch
          const newVisited = new Set(visited)
          newVisited.add(actualTargetName)
          queue.push({ cube: actualTargetName, path: newPath, visited: newVisited })
        }
      }
    }

    return allPaths
  }

  /**
   * Check if a cube can reach all other cubes in the list via joins
   *
   * @param fromCube Starting cube name
   * @param allCubes List of all cubes that must be reachable
   * @returns true if all cubes are reachable
   */
  canReachAll(fromCube: string, allCubes: string[]): boolean {
    const otherCubes = allCubes.filter(name => name !== fromCube)

    for (const targetCube of otherCubes) {
      const path = this.findPath(fromCube, targetCube, new Set())
      if (!path || path.length === 0) {
        return false
      }
    }

    return true
  }

  /**
   * Build SQL join condition from join definition
   *
   * @param joinDef The cube join definition
   * @param sourceAlias Optional alias for source table (null uses actual column)
   * @param targetAlias Optional alias for target table (null uses actual column)
   * @returns SQL condition for the join
   */
  buildJoinCondition(
    joinDef: CubeJoin,
    sourceAlias: string | null,
    targetAlias: string | null
  ): SQL {
    const conditions: SQL[] = []

    // Process array of join conditions
    for (const joinOn of joinDef.on) {
      // Use actual column objects instead of aliases for regular table joins
      // Apply SQL isolation when using raw column objects to prevent mutation issues
      // (See CLAUDE.md SQL Object Isolation Pattern)
      const sourceCol = sourceAlias
        ? sql`${sql.identifier(sourceAlias)}.${sql.identifier(joinOn.source.name)}`
        : isolateSqlExpression(joinOn.source)

      const targetCol = targetAlias
        ? sql`${sql.identifier(targetAlias)}.${sql.identifier(joinOn.target.name)}`
        : isolateSqlExpression(joinOn.target)

      // Use custom comparator or default to eq
      const comparator = joinOn.as || eq
      conditions.push(comparator(sourceCol as any, targetCol as any))
    }

    return and(...conditions)!
  }

  /**
   * Get all reachable cubes from a starting cube
   * Useful for analyzing cube connectivity
   *
   * @param fromCube Starting cube name
   * @returns Set of all reachable cube names
   */
  getReachableCubes(fromCube: string): Set<string> {
    const reachable = new Set<string>([fromCube])
    const queue = [fromCube]

    while (queue.length > 0) {
      const currentCube = queue.shift()!
      const cubeDefinition = this.cubes.get(currentCube)

      if (!cubeDefinition?.joins) {
        continue
      }

      for (const [, joinDef] of Object.entries(cubeDefinition.joins)) {
        const resolvedTargetCube = resolveCubeReference(joinDef.targetCube)
        const targetName = resolvedTargetCube.name

        if (!reachable.has(targetName)) {
          reachable.add(targetName)
          queue.push(targetName)
        }
      }
    }

    return reachable
  }

  // Private cache management

  private getCacheKey(fromCube: string, toCube: string, excluded: Set<string>): string {
    const excludedStr = Array.from(excluded).sort().join(',')
    return `${fromCube}:${toCube}:${excludedStr}`
  }

  private getFromCache(key: string): InternalJoinPathStep[] | null | undefined {
    const entry = this.connectivityCache.get(key)
    if (!entry) {
      return undefined
    }
    return entry.path
  }

  private setInCache(key: string, path: InternalJoinPathStep[] | null): void {
    this.connectivityCache.set(key, { path })
  }
}

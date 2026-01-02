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
 */
interface ConnectivityCacheEntry {
  reachable: boolean
  path: InternalJoinPathStep[] | null
  timestamp: number
}

/**
 * Resolves join paths between cubes and manages connectivity caching
 */
export class JoinPathResolver {
  private cubes: Map<string, Cube>
  private connectivityCache: Map<string, ConnectivityCacheEntry> = new Map()
  private cacheTTL: number

  /**
   * @param cubes Map of cube name to cube definition
   * @param cacheTTL Cache time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(cubes: Map<string, Cube>, cacheTTL: number = 5 * 60 * 1000) {
    this.cubes = cubes
    this.cacheTTL = cacheTTL
  }

  /**
   * Update the cubes map (e.g., when cubes are registered)
   */
  updateCubes(cubes: Map<string, Cube>): void {
    this.cubes = cubes
    this.invalidateCache()
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

  /**
   * Invalidate the connectivity cache
   * Call this when cube definitions change
   */
  invalidateCache(): void {
    this.connectivityCache.clear()
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.connectivityCache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses
    }
  }

  // Private cache management
  private cacheHits = 0
  private cacheMisses = 0

  private getCacheKey(fromCube: string, toCube: string, excluded: Set<string>): string {
    const excludedStr = Array.from(excluded).sort().join(',')
    return `${fromCube}:${toCube}:${excludedStr}`
  }

  private getFromCache(key: string): InternalJoinPathStep[] | null | undefined {
    const entry = this.connectivityCache.get(key)
    if (!entry) {
      this.cacheMisses++
      return undefined
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.connectivityCache.delete(key)
      this.cacheMisses++
      return undefined
    }

    this.cacheHits++
    return entry.path
  }

  private setInCache(key: string, path: InternalJoinPathStep[] | null): void {
    this.connectivityCache.set(key, {
      reachable: path !== null,
      path,
      timestamp: Date.now()
    })
  }
}

/**
 * JoinPathResolver - Handles join path finding and connectivity analysis
 *
 * Extracted from LogicalPlanner for single responsibility.
 * Uses BFS algorithm to find shortest paths between cubes.
 * Includes connectivity caching for performance optimization.
 */

import type { Cube, CubeJoin } from '../types'
import { resolveCubeReference, isolateSqlExpression } from '../cube-utils'
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
  /** True when this step was discovered via a reversed edge (target cube defines the join back to source) */
  reversed?: boolean
}

/**
 * Score breakdown for a candidate preferred path.
 */
export interface PreferredPathScoreBreakdown {
  preferredJoinBonus: number
  preferredCubeBonus: number
  lengthPenalty: number
}

/**
 * A scored candidate path considered by preferred-path selection.
 */
export interface PreferredPathCandidateScore {
  path: InternalJoinPathStep[]
  score: number
  usesPreferredJoin: boolean
  preferredCubesInPath: number
  usesProcessed: boolean
  scoreBreakdown: PreferredPathScoreBreakdown
}

/**
 * Detailed preferred-path selection output for analysis/debug UIs.
 */
export interface PreferredPathSelection {
  strategy: 'preferred' | 'fallbackShortest'
  preferredCubes: string[]
  selectedIndex: number
  candidates: PreferredPathCandidateScore[]
  selectedPath: InternalJoinPathStep[] | null
}

/**
 * Cache entry for connectivity between cubes
 * Simple cache without TTL since cube config is set once at startup
 */
interface ConnectivityCacheEntry {
  path: InternalJoinPathStep[] | null
}

/**
 * Resolves join paths between cubes and manages connectivity caching.
 * Supports bidirectional path finding: both forward (outgoing) joins and
 * reverse (incoming) joins are traversable. Reversed steps are marked with
 * `reversed: true` so downstream code can adjust join type and analysis.
 */
export class JoinPathResolver {
  private cubes: Map<string, Cube>
  private connectivityCache: Map<string, ConnectivityCacheEntry> = new Map()
  /** Maps cubeName → joins that TARGET that cube (incoming edges) */
  private reverseIndex: Map<string, Array<{ definingCube: string; joinDef: CubeJoin }>>

  /**
   * @param cubes Map of cube name to cube definition
   */
  constructor(cubes: Map<string, Cube>) {
    this.cubes = cubes
    this.reverseIndex = this.buildReverseIndex()
  }

  /**
   * Build reverse adjacency index: for each cube's outgoing join A→B,
   * store an entry under B pointing back to A.
   *
   * Excludes belongsToMany joins because reversing them requires swapping
   * sourceKey/targetKey in the junction table configuration, which is
   * error-prone. The 2-hop forward path through the junction table handles
   * these relationships correctly.
   */
  private buildReverseIndex(): Map<string, Array<{ definingCube: string; joinDef: CubeJoin }>> {
    const index = new Map<string, Array<{ definingCube: string; joinDef: CubeJoin }>>()

    for (const [cubeName, cube] of this.cubes) {
      if (!cube.joins) continue

      for (const [, joinDef] of Object.entries(cube.joins)) {
        // Skip belongsToMany — reversing junction table joins is complex
        // and already handled by the forward 2-hop path
        if (joinDef.relationship === 'belongsToMany') continue

        const resolvedTarget = resolveCubeReference(joinDef.targetCube)
        const targetName = resolvedTarget.name

        let entries = index.get(targetName)
        if (!entries) {
          entries = []
          index.set(targetName, entries)
        }
        entries.push({ definingCube: cubeName, joinDef: joinDef as CubeJoin })
      }
    }

    return index
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

    // BFS to find shortest path (bidirectional: forward + reverse edges)
    const queue: Array<{ cube: string; path: InternalJoinPathStep[] }> = [
      { cube: fromCube, path: [] }
    ]
    const visited = new Set([fromCube, ...alreadyProcessed])

    while (queue.length > 0) {
      const { cube: currentCube, path } = queue.shift()!

      // --- Forward edges: outgoing joins from currentCube ---
      const cubeDefinition = this.cubes.get(currentCube)
      if (cubeDefinition?.joins) {
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
            this.setInCache(cacheKey, newPath)
            return newPath
          }

          visited.add(actualTargetName)
          queue.push({ cube: actualTargetName, path: newPath })
        }
      }

      // --- Reverse edges: incoming joins that target currentCube ---
      const incomingJoins = this.reverseIndex.get(currentCube) || []
      for (const { definingCube, joinDef } of incomingJoins) {
        if (visited.has(definingCube)) {
          continue
        }

        const newPath: InternalJoinPathStep[] = [
          ...path,
          {
            fromCube: currentCube,
            toCube: definingCube,
            joinDef,
            reversed: true
          }
        ]

        if (definingCube === toCube) {
          this.setInCache(cacheKey, newPath)
          return newPath
        }

        visited.add(definingCube)
        queue.push({ cube: definingCube, path: newPath })
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
    return this.findPathPreferringDetailed(fromCube, toCube, preferredCubes, alreadyProcessed).selectedPath
  }

  /**
   * Find preferred path with candidate scoring telemetry.
   * Used by analysis/debug panels to explain planner decisions.
   */
  findPathPreferringDetailed(
    fromCube: string,
    toCube: string,
    preferredCubes: Set<string>,
    alreadyProcessed: Set<string> = new Set()
  ): PreferredPathSelection {
    // Find ALL paths WITHOUT excluding already-processed cubes from intermediate steps
    // This allows us to find paths through cubes that are already in the join plan
    // (e.g., going through EmployeeTeams to reach Teams)
    const allPaths = this.findAllPaths(fromCube, toCube, new Set()) // Note: empty exclusion set
    if (allPaths.length === 0) {
      // Fall back to standard path finding with exclusions
      const fallbackPath = this.findPath(fromCube, toCube, alreadyProcessed)
      const fallbackCandidate: PreferredPathCandidateScore[] = fallbackPath
        ? [{
            path: fallbackPath,
            score: 0,
            usesPreferredJoin: false,
            preferredCubesInPath: 0,
            usesProcessed: fallbackPath.some(step => alreadyProcessed.has(step.toCube)),
            scoreBreakdown: {
              preferredJoinBonus: 0,
              preferredCubeBonus: 0,
              lengthPenalty: 0
            }
          }]
        : []

      return {
        strategy: 'fallbackShortest',
        preferredCubes: Array.from(preferredCubes).sort(),
        selectedIndex: fallbackPath ? 0 : -1,
        candidates: fallbackCandidate,
        selectedPath: fallbackPath
      }
    }

    // Score paths with multiple criteria
    const scored: PreferredPathCandidateScore[] = allPaths.map(path => {
      let preferredJoinBonus = 0

      // +10 for paths using joins with preferredFor that includes the target cube
      // ONLY apply this bonus when the preferredFor is on the FIRST hop from the starting cube.
      // This ensures preferredFor only matters when we're actually routing FROM the cube
      // that defines the preference, not when we're just passing through it.
      // Example: Employees.joins.EmployeeTeams has preferredFor: ['Teams']
      // - When routing FROM Employees TO Teams: preferredFor applies (first hop)
      // - When routing FROM Departments TO Teams: preferredFor should NOT apply
      //   even if the path goes through Employees
      //
      // For reversed steps: the joinDef's preferredFor lists the original targets.
      // When reversed, fromCube is the search origin so we check if preferredFor
      // includes the fromCube of the path (which equals the overall search origin).
      const usesPreferredJoin = path.some((step, index) => {
        if (index !== 0) return false
        if (step.reversed) {
          // Reversed: joinDef.preferredFor was set on the toCube's join definition
          // and lists cubes it prefers to be the route for. fromCube is the search origin.
          return step.joinDef.preferredFor?.includes(fromCube) ?? false
        }
        return step.joinDef.preferredFor?.includes(toCube) ?? false
      })

      if (usesPreferredJoin) {
        preferredJoinBonus = 10
      }

      // +1 for each preferred cube (cubes with measures) in the path
      // BUT penalize longer paths to prevent unnecessarily routing through preferred cubes
      // when a shorter direct path exists
      const preferredCubesInPath = path.filter(step => preferredCubes.has(step.toCube)).length
      const preferredCubeBonus = preferredCubesInPath

      // Penalize path length: subtract (length - 1) to favor shorter paths
      // This ensures a direct path (length 1, penalty 0) beats a path through
      // preferred cubes (e.g., length 4, +1 for preferred, -3 for length = -2)
      const lengthPenalty = path.length - 1
      const score = preferredJoinBonus + preferredCubeBonus - lengthPenalty

      return {
        path,
        score,
        usesPreferredJoin,
        preferredCubesInPath,
        usesProcessed: path.some(step => alreadyProcessed.has(step.toCube)),
        scoreBreakdown: {
          preferredJoinBonus,
          preferredCubeBonus,
          lengthPenalty
        }
      }
    })

    // Sort: prefer higher score, then prefer paths using already-processed cubes, then shorter
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.usesProcessed !== b.usesProcessed) return a.usesProcessed ? -1 : 1
      return a.path.length - b.path.length
    })

    return {
      strategy: 'preferred',
      preferredCubes: Array.from(preferredCubes).sort(),
      selectedIndex: scored.length > 0 ? 0 : -1,
      candidates: scored,
      selectedPath: scored[0]?.path ?? null
    }
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

      // --- Forward edges ---
      const cubeDefinition = this.cubes.get(currentCube)
      if (cubeDefinition?.joins) {
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
            allPaths.push(newPath)
          } else {
            const newVisited = new Set(visited)
            newVisited.add(actualTargetName)
            queue.push({ cube: actualTargetName, path: newPath, visited: newVisited })
          }
        }
      }

      // --- Reverse edges ---
      const incomingJoins = this.reverseIndex.get(currentCube) || []
      for (const { definingCube, joinDef } of incomingJoins) {
        if (visited.has(definingCube)) {
          continue
        }

        const newPath: InternalJoinPathStep[] = [
          ...path,
          {
            fromCube: currentCube,
            toCube: definingCube,
            joinDef,
            reversed: true
          }
        ]

        if (definingCube === toCube) {
          allPaths.push(newPath)
        } else {
          const newVisited = new Set(visited)
          newVisited.add(definingCube)
          queue.push({ cube: definingCube, path: newPath, visited: newVisited })
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
      // Use forward-only path finding for primary cube selection stability.
      // Bidirectional path finding (findPath) is used for actual path resolution,
      // but primary selection should only consider explicit outgoing joins to avoid
      // changing join semantics (reversed belongsTo becomes hasMany, triggering CTEs).
      const path = this.findForwardOnlyPath(fromCube, targetCube, new Set())
      if (!path || path.length === 0) {
        return false
      }
    }

    return true
  }

  /**
   * Forward-only path finding (no reverse edges).
   * Used by canReachAll for primary cube selection to preserve join semantics.
   */
  private findForwardOnlyPath(
    fromCube: string,
    toCube: string,
    alreadyProcessed: Set<string>
  ): InternalJoinPathStep[] | null {
    if (fromCube === toCube) return []

    const queue: Array<{ cube: string; path: InternalJoinPathStep[] }> = [
      { cube: fromCube, path: [] }
    ]
    const visited = new Set([fromCube, ...alreadyProcessed])

    while (queue.length > 0) {
      const { cube: currentCube, path } = queue.shift()!
      const cubeDefinition = this.cubes.get(currentCube)

      if (!cubeDefinition?.joins) continue

      for (const [, joinDef] of Object.entries(cubeDefinition.joins)) {
        const resolvedTargetCube = resolveCubeReference(joinDef.targetCube)
        const actualTargetName = resolvedTargetCube.name

        if (visited.has(actualTargetName)) continue

        const newPath: InternalJoinPathStep[] = [
          ...path,
          { fromCube: currentCube, toCube: actualTargetName, joinDef }
        ]

        if (actualTargetName === toCube) return newPath

        visited.add(actualTargetName)
        queue.push({ cube: actualTargetName, path: newPath })
      }
    }

    return null
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

      // Forward edges
      const cubeDefinition = this.cubes.get(currentCube)
      if (cubeDefinition?.joins) {
        for (const [, joinDef] of Object.entries(cubeDefinition.joins)) {
          const resolvedTargetCube = resolveCubeReference(joinDef.targetCube)
          const targetName = resolvedTargetCube.name

          if (!reachable.has(targetName)) {
            reachable.add(targetName)
            queue.push(targetName)
          }
        }
      }

      // Reverse edges
      const incomingJoins = this.reverseIndex.get(currentCube) || []
      for (const { definingCube } of incomingJoins) {
        if (!reachable.has(definingCube)) {
          reachable.add(definingCube)
          queue.push(definingCube)
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

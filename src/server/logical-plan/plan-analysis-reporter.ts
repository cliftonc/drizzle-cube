/**
 * PlanAnalysisReporter — produces the human-readable planning trace used by
 * dry-run / EXPLAIN output: primary-cube selection reasoning, join-path
 * analysis, and query warnings. Pure presentation over the planning phases;
 * generates no SQL. Extracted from LogicalPlanner.
 */

import type {
  Cube,
  PhysicalQueryPlan,
  SemanticQuery,
  PrimaryCubeAnalysis,
  PrimaryCubeCandidate,
  JoinPathAnalysis,
  JoinPathStep,
  QueryWarning
} from '../types/index.js'
import {
  getJoinType,
  reverseRelationship
} from '../cube-utils.js'
import {
  type InternalJoinPathStep,
  type PreferredPathCandidateScore,
  type PreferredPathSelection
} from '../resolvers/join-path-resolver.js'
import { ResolverCache, analyzeCubeUsage } from './planner-utils.js'

export class PlanAnalysisReporter {
  constructor(private readonly resolverCache: ResolverCache) {}

  /**
   * Analyze why a particular cube was chosen as primary
   */
  analyzePrimaryCubeSelection(
    cubeNames: string[],
    query: SemanticQuery,
    cubes: Map<string, Cube>
  ): PrimaryCubeAnalysis {
    // Single cube case
    if (cubeNames.length === 1) {
      return {
        selectedCube: cubeNames[0],
        reason: 'single_cube',
        explanation: 'Only one cube is used in this query'
      }
    }

    const candidates = this.buildPrimaryCubeCandidates(cubeNames, query, cubes)

    // Tier 1: dimension-based selection
    const byDimensions = this.selectByDimensions(query, candidates)
    if (byDimensions) return byDimensions

    // Tier 2: connectivity-based selection
    const byConnectivity = this.selectByConnectivity(candidates)
    if (byConnectivity) return byConnectivity

    // Tier 3: alphabetical fallback
    return {
      selectedCube: [...cubeNames].sort()[0],
      reason: 'alphabetical_fallback',
      explanation: 'Selected alphabetically as fallback (no cube could reach all others)',
      candidates
    }
  }

  /**
   * Build the scored candidate list (dimension count, join count, reachability).
   */
  private buildPrimaryCubeCandidates(
    cubeNames: string[],
    query: SemanticQuery,
    cubes: Map<string, Cube>
  ): PrimaryCubeCandidate[] {
    const cubeDimensionCount = new Map<string, number>()
    for (const dim of query.dimensions || []) {
      const cube = dim.split('.')[0]
      cubeDimensionCount.set(cube, (cubeDimensionCount.get(cube) || 0) + 1)
    }

    const resolver = this.resolverCache.get(cubes)
    return cubeNames.map(cubeName => {
      const cube = cubes.get(cubeName)
      return {
        cubeName,
        dimensionCount: cubeDimensionCount.get(cubeName) || 0,
        joinCount: cube?.joins ? Object.keys(cube.joins).length : 0,
        canReachAll: resolver.canReachAll(cubeName, cubeNames)
      }
    })
  }

  /**
   * Tier 1: select the cube with the most query dimensions that can reach all
   * others. Returns null when no dimension-based winner applies.
   */
  private selectByDimensions(
    query: SemanticQuery,
    candidates: PrimaryCubeCandidate[]
  ): PrimaryCubeAnalysis | null {
    if (!query.dimensions || query.dimensions.length === 0) return null

    const maxDimensions = Math.max(...candidates.map(c => c.dimensionCount))
    if (maxDimensions === 0) return null

    const primaryCandidates = candidates
      .filter(c => c.dimensionCount === maxDimensions)
      .sort((a, b) => a.cubeName.localeCompare(b.cubeName))

    for (const candidate of primaryCandidates) {
      if (candidate.canReachAll) {
        return {
          selectedCube: candidate.cubeName,
          reason: 'most_dimensions',
          explanation: `Selected because it has ${candidate.dimensionCount} dimension${candidate.dimensionCount !== 1 ? 's' : ''} in the query (defines the analytical grain)`,
          candidates
        }
      }
    }

    return null
  }

  /**
   * Tier 2: among cubes that can reach all others, select the most connected.
   * Returns null when no candidate can reach all others.
   */
  private selectByConnectivity(
    candidates: PrimaryCubeCandidate[]
  ): PrimaryCubeAnalysis | null {
    const reachableCandidates = candidates.filter(c => c.canReachAll)
    if (reachableCandidates.length === 0) return null

    const maxConnectivity = Math.max(...reachableCandidates.map(c => c.joinCount))
    const mostConnected = reachableCandidates
      .filter(c => c.joinCount === maxConnectivity)
      .sort((a, b) => a.cubeName.localeCompare(b.cubeName))[0]

    return {
      selectedCube: mostConnected.cubeName,
      reason: 'most_connected',
      explanation: `Selected because it has ${mostConnected.joinCount} join relationship${mostConnected.joinCount !== 1 ? 's' : ''} and can reach all other cubes`,
      candidates
    }
  }

  /**
   * Analyze the join path between two cubes with detailed step information
   *
   * Uses JoinPathResolver.findPath() for the actual path finding,
   * then converts the result to human-readable analysis format.
   */
  analyzeJoinPath(
    cubes: Map<string, Cube>,
    fromCube: string,
    toCube: string,
    query?: SemanticQuery
  ): JoinPathAnalysis {
    // Use the resolver for BFS path finding (cached, optimized)
    const resolver = this.resolverCache.get(cubes)
    const preferredPathCubes = query ? analyzeCubeUsage(query) : new Set<string>()
    const preferredSelection: PreferredPathSelection | null = preferredPathCubes.size > 0
      ? resolver.findPathPreferringDetailed(fromCube, toCube, preferredPathCubes)
      : null
    const internalPath = preferredSelection?.selectedPath ?? resolver.findPath(fromCube, toCube)

    // Build visited cubes list from path
    const visitedCubes = [fromCube]
    if (internalPath) {
      for (const step of internalPath) {
        visitedCubes.push(step.toCube)
      }
    }

    // No path found
    if (!internalPath || internalPath.length === 0) {
      return {
        targetCube: toCube,
        pathFound: false,
        error: `No join path found from '${fromCube}' to '${toCube}'. Ensure the target cube has a relationship defined (belongsTo, hasOne, hasMany, or belongsToMany).`,
        visitedCubes,
        selection: this.buildJoinPathSelectionAnalysis(preferredSelection)
      }
    }

    // Convert internal path to analysis format
    const pathSteps = this.convertInternalPathToJoinPathSteps(internalPath)

    return {
      targetCube: toCube,
      pathFound: true,
      path: pathSteps,
      pathLength: pathSteps.length,
      visitedCubes,
      selection: this.buildJoinPathSelectionAnalysis(preferredSelection)
    }
  }

  private convertInternalPathToJoinPathSteps(internalPath: InternalJoinPathStep[]): JoinPathStep[] {
    return internalPath.map(step => {
      // Use effective relationship (reversed if applicable)
      const effectiveRelationship = step.reversed
        ? reverseRelationship(step.joinDef.relationship)
        : step.joinDef.relationship
      const joinType = getJoinType(effectiveRelationship, step.joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'

      const joinColumns = step.joinDef.on.map(joinOn => ({
        sourceColumn: joinOn.source.name,
        targetColumn: joinOn.target.name
      }))

      const result: JoinPathStep = {
        fromCube: step.fromCube,
        toCube: step.toCube,
        relationship: effectiveRelationship as JoinPathStep['relationship'],
        joinType,
        joinColumns
      }

      // Add reversed flag for analysis transparency
      if (step.reversed) {
        result.reversed = true
      }

      // Add junction table info for belongsToMany
      if (effectiveRelationship === 'belongsToMany' && step.joinDef.through) {
        const through = step.joinDef.through
        result.junctionTable = {
          tableName: (through.table as any)[Symbol.for('drizzle:Name')] || 'junction_table',
          sourceColumns: through.sourceKey.map(k => k.target.name),
          targetColumns: through.targetKey.map(k => k.source.name)
        }
      }

      return result
    })
  }

  private buildJoinPathSelectionAnalysis(
    selection: PreferredPathSelection | null
  ): JoinPathAnalysis['selection'] {
    if (!selection) {
      return { strategy: 'shortest' }
    }

    const candidates = selection.candidates.map((candidate, index) =>
      this.mapPreferredCandidate(candidate, index + 1)
    )

    return {
      strategy: selection.strategy,
      preferredCubes: selection.preferredCubes,
      selectedRank: selection.selectedIndex >= 0 ? selection.selectedIndex + 1 : undefined,
      selectedScore: selection.selectedIndex >= 0
        ? selection.candidates[selection.selectedIndex]?.score
        : undefined,
      candidates
    }
  }

  private mapPreferredCandidate(
    candidate: PreferredPathCandidateScore,
    rank: number
  ): NonNullable<NonNullable<JoinPathAnalysis['selection']>['candidates']>[number] {
    return {
      rank,
      score: candidate.score,
      usesPreferredJoin: candidate.usesPreferredJoin,
      preferredCubesInPath: candidate.preferredCubesInPath,
      usesProcessed: candidate.usesProcessed,
      scoreBreakdown: candidate.scoreBreakdown,
      path: this.convertInternalPathToJoinPathSteps(candidate.path)
    }
  }

  /**
   * Generate warnings for query edge cases that users should be aware of.
   * Currently detects:
   * - FAN_OUT_NO_DIMENSIONS: Query has hasMany CTEs but no dimensions to group by
   *
   * Note: AVG measures in hasMany CTEs can produce mathematically imprecise results
   * (average of averages vs weighted average), but this warning was removed as it
   * fired too aggressively. The issue only occurs when the outer grouping is coarser
   * than the CTE grouping, which is rare in practice. The limitation is documented
   * in executor.ts comments.
   */
  generateWarnings(
    query: SemanticQuery,
    preAggregationCTEs?: PhysicalQueryPlan['preAggregationCTEs']
  ): QueryWarning[] {
    const warnings: QueryWarning[] = []

    // Check for fan-out without dimensions warning
    const fanOutWarning = this.checkFanOutNoDimensions(query, preAggregationCTEs)
    if (fanOutWarning) {
      warnings.push(fanOutWarning)
    }

    return warnings
  }

  /**
   * Detect when a query has measures from multiple cubes with hasMany relationships
   * but no dimensions to provide grouping context.
   *
   * This is an edge case where:
   * - Query has measures from 2+ cubes
   * - At least one CTE exists (indicating hasMany relationship)
   * - Query has NO dimensions AND NO time dimensions with granularity
   *
   * The SQL is technically correct (CTEs with GROUP BY on join keys), but users
   * may be confused by the aggregated results without visible grouping.
   */
  private checkFanOutNoDimensions(
    query: SemanticQuery,
    preAggregationCTEs?: PhysicalQueryPlan['preAggregationCTEs']
  ): QueryWarning | null {
    // Must have CTEs (hasMany relationships)
    if (!preAggregationCTEs || preAggregationCTEs.length === 0) {
      return null
    }

    // Must have measures from multiple cubes
    if (!query.measures || query.measures.length === 0) {
      return null
    }

    const cubesWithMeasures = new Set<string>()
    for (const measure of query.measures) {
      const [cubeName] = measure.split('.')
      cubesWithMeasures.add(cubeName)
    }

    if (cubesWithMeasures.size < 2) {
      return null
    }

    // Check if query has any dimensions
    const hasDimensions = query.dimensions && query.dimensions.length > 0

    // Check if query has time dimensions with granularity (which act as grouping)
    const hasTimeGranularity = query.timeDimensions?.some(td => td.granularity)

    // If there are dimensions or time granularity, no warning needed
    if (hasDimensions || hasTimeGranularity) {
      return null
    }

    // Build the warning
    return {
      code: 'FAN_OUT_NO_DIMENSIONS',
      message:
        'Query combines measures from multiple cubes with hasMany relationships but has no dimensions. ' +
        'Results are aggregated at the join key level, which may produce unexpected totals.',
      severity: 'warning',
      cubes: [...cubesWithMeasures].sort(),
      measures: query.measures,
      suggestion: 'Add a dimension to see per-group breakdowns, or add a time dimension with granularity.'
    }
  }
}

/**
 * CTEPlanner — decides which joined cubes require pre-aggregation CTEs to
 * prevent measure inflation (fan-out), and computes the CTE specifications.
 *
 * This is the most intricate planning phase: it handles multi-hop fan-out
 * absorption (intermediate hasMany tables folded into a CTE), propagating
 * filters, downstream join-key inclusion, and calculated-measure dependency
 * expansion. Extracted from LogicalPlanner.
 */

import type {
  Cube,
  QueryContext,
  PhysicalQueryPlan,
  CubeJoin,
  SemanticQuery,
  IntermediateJoinInfo
} from '../types/index.js'
import {
  resolveCubeReference,
  reverseRelationship
} from '../cube-utils.js'
import { categorizeForPostAggregation } from '../measure-classification.js'
import { ResolverCache, analyzeCubeUsage } from './planner-utils.js'
import { FilterPropagation } from './filter-propagation.js'
import type { JoinRef } from './types.js'
import {
  type CTEJoinKey,
  type FoundJoinInfo,
  collectDimensionCubeNames,
  deriveCTEJoinKeys,
  deriveDownstreamJoinKeys,
  findJoinInfoForCube
} from './cte-planner-helpers.js'

export class CTEPlanner {
  constructor(
    private readonly resolverCache: ResolverCache,
    private readonly filterPropagation: FilterPropagation
  ) {}

  /**
   * Plan pre-aggregation CTEs for hasMany relationships to prevent fan-out
   * Note: belongsToMany relationships handle fan-out differently through their junction table structure
   * and don't require CTEs - the two-hop join with the junction table provides natural grouping
   *
   * CRITICAL FAN-OUT PREVENTION LOGIC:
   * When a query contains ANY hasMany relationship in the join graph, ALL cubes with measures
   * that could be affected by row multiplication need CTEs. This includes:
   *
   * 1. Cubes with direct hasMany FROM primary (existing logic)
   * 2. Cubes with measures that would be multiplied due to hasMany elsewhere in the query
   *    - Example: Query has Departments.totalBudget + Productivity.recordCount
   *    - Employees hasMany → Productivity causes row multiplication
   *    - Departments.totalBudget would be inflated without CTE pre-aggregation
   */
  planPreAggregationCTEs(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    joinCubes: JoinRef[],
    query: SemanticQuery,
    _ctx: QueryContext
  ): PhysicalQueryPlan['preAggregationCTEs'] {
    const preAggCTEs: PhysicalQueryPlan['preAggregationCTEs'] = []

    if (!query.measures || query.measures.length === 0) {
      return preAggCTEs // No measures, no fan-out risk
    }

    // Step 1: Compute CTE reasons from the actual join plan (not all registered cubes)
    const cteReasons = this.computeCTEReasons(primaryCube, joinCubes, query)

    // Step 2: If no CTE reasons, no CTEs needed
    if (cteReasons.size === 0) {
      return preAggCTEs
    }

    // Step 3: For each join cube that needs a CTE, build it
    for (const joinCubeEntry of joinCubes) {
      const cteReason = cteReasons.get(joinCubeEntry.target.name)
      if (!cteReason) continue

      const cte = this.buildCTEForJoinCube(
        joinCubeEntry,
        cteReason,
        cubes,
        primaryCube,
        query
      )
      if (cte) {
        preAggCTEs.push(cte)
      }
    }

    return preAggCTEs
  }

  /**
   * Build a single pre-aggregation CTE for one join-cube entry, or return null
   * when the cube contributes no aggregate measures / has no resolvable join.
   */
  private buildCTEForJoinCube(
    joinCubeEntry: JoinRef,
    cteReason: 'hasMany' | 'fanOutPrevention',
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    query: SemanticQuery
  ): NonNullable<PhysicalQueryPlan['preAggregationCTEs']>[number] | null {
    const cube = joinCubeEntry.target.cube
    const alias = joinCubeEntry.alias

    // Get measures from this cube (SELECT + filters)
    const measuresFromSelect = (query.measures ?? []).filter(m => m.startsWith(cube.name + '.'))
    const measuresFromFilters = this.extractMeasuresFromFilters(query, cube)
    const allMeasuresFromThisCube = [...new Set([...measuresFromSelect, ...measuresFromFilters])]

    if (allMeasuresFromThisCube.length === 0) {
      return null // No measures from this cube
    }

    // Resolve join keys + any intermediate joins to absorb (multi-hop fan-out)
    const resolved = this.resolveCTEJoinKeys(cubes, primaryCube, cube, query)
    if (!resolved) {
      return null // No join info found
    }
    const { joinKeys, intermediateJoins } = resolved

    // Find propagating filters from related cubes that should apply to this CTE
    const propagatingFilters = this.filterPropagation.findPropagatingFilters(query, cube, cubes)

    // Categorize measures for post-aggregation window function handling
    const cubeMap = new Map([[cube.name, cube]])
    const { aggregateMeasures, requiredBaseMeasures } = categorizeForPostAggregation(
      allMeasuresFromThisCube,
      cubeMap
    )

    // Combine aggregate measures with base measures required by window functions
    const allAggregateMeasures = [...new Set([
      ...aggregateMeasures,
      ...Array.from(requiredBaseMeasures).filter(m => m.startsWith(cube.name + '.'))
    ])]

    if (allAggregateMeasures.length === 0) {
      return null
    }

    // Expand calculated measures to include their dependencies
    const expandedAggregateMeasures = this.expandCalculatedMeasureDependencies(
      cube,
      allAggregateMeasures
    )

    // Detect downstream cubes that need join keys in the CTE
    const downstreamJoinKeys = this.findDownstreamJoinKeys(cube, query, cubes)

    return {
      cube,
      alias,
      cteAlias: `${cube.name.toLowerCase()}_agg`,
      joinKeys,
      measures: expandedAggregateMeasures,
      propagatingFilters: propagatingFilters.length > 0 ? propagatingFilters : undefined,
      downstreamJoinKeys: downstreamJoinKeys.length > 0 ? downstreamJoinKeys : undefined,
      intermediateJoins: intermediateJoins && intermediateJoins.length > 0 ? intermediateJoins : undefined,
      cteType: 'aggregate',
      cteReason
    }
  }

  /**
   * Resolve the join keys (and any intermediate joins to absorb) for a CTE cube.
   *
   * Analyses the path from primary to the CTE cube: if an intermediate hasMany
   * exists, returns the corrected keys plus intermediate joins; otherwise locates
   * the join definition and derives keys from it.
   */
  private resolveCTEJoinKeys(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cube: Cube,
    query: SemanticQuery
  ): { joinKeys: CTEJoinKey[]; intermediateJoins: IntermediateJoinInfo[] | undefined } | null {
    const pathAnalysis = this.analyzeJoinPathToPrimary(cubes, primaryCube, cube.name, query)

    if (pathAnalysis?.hasIntermediateHasMany && pathAnalysis.intermediateJoins.length > 0) {
      // Multi-hop fan-out scenario: corrected keys + absorbed intermediate joins
      return {
        joinKeys: pathAnalysis.correctJoinKeys,
        intermediateJoins: pathAnalysis.intermediateJoins as IntermediateJoinInfo[]
      }
    }

    // Standard path: find the join definition (from path tail or by search).
    const joinInfo = this.locateJoinInfo(cubes, primaryCube, cube, pathAnalysis)
    if (!joinInfo) {
      return null
    }

    return {
      joinKeys: deriveCTEJoinKeys(joinInfo, primaryCube),
      intermediateJoins: undefined
    }
  }

  /**
   * Locate the join definition for a CTE cube, preferring the final step of the
   * analysed path and falling back to a primary/reverse/any-cube search.
   */
  private locateJoinInfo(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cube: Cube,
    pathAnalysis: ReturnType<CTEPlanner['analyzeJoinPathToPrimary']>
  ): FoundJoinInfo | null {
    if (pathAnalysis?.path && pathAnalysis.path.length > 0) {
      const lastStep = pathAnalysis.path[pathAnalysis.path.length - 1]
      const sourceCube = cubes.get(lastStep.fromCube)
      if (sourceCube) {
        return {
          sourceCube,
          joinDef: lastStep.joinDef as CubeJoin,
          reversed: lastStep.reversed
        }
      }
    }

    return findJoinInfoForCube(cubes, primaryCube, cube.name)
  }

  /**
   * Analyze the join path from primary cube to a target CTE cube.
   * Detects if there are intermediate hasMany relationships that would cause fan-out.
   *
   * Returns information about:
   * - The full join path
   * - Whether there are hasMany relationships ON the path (not just at the end)
   * - Which intermediate tables need to be absorbed into the CTE
   * - The correct join key to use (from primary cube's connection point)
   *
   * @param cubes Map of all registered cubes
   * @param primaryCube The primary cube (FROM clause)
   * @param targetCubeName The CTE cube we're analyzing the path to
   * @param query The semantic query (drives query-aware path selection)
   */
  private analyzeJoinPathToPrimary(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    targetCubeName: string,
    query: SemanticQuery
  ): {
    path: { fromCube: string; toCube: string; joinDef: CubeJoin; reversed?: boolean }[]
    hasIntermediateHasMany: boolean
    intermediateJoins: IntermediateJoinInfo[]
    correctJoinKeys: Array<{
      sourceColumn: string
      targetColumn: string
      sourceColumnObj: any
      targetColumnObj: any
    }>
  } | null {
    const resolver = this.resolverCache.get(cubes)
    const preferredPathCubes = analyzeCubeUsage(query)

    const joinPath = preferredPathCubes.size > 0
      ? resolver.findPathPreferring(primaryCube.name, targetCubeName, preferredPathCubes, new Set())
      : resolver.findPath(primaryCube.name, targetCubeName)

    if (!joinPath || joinPath.length === 0) {
      return null
    }

    // Analyze the path for hasMany relationships (accounting for reversed steps)
    const pathWithRelationships: { fromCube: string; toCube: string; joinDef: CubeJoin; reversed?: boolean }[] = joinPath.map(step => ({
      fromCube: step.fromCube,
      toCube: step.toCube,
      joinDef: step.joinDef as CubeJoin,
      reversed: step.reversed
    }))

    // Check if there are hasMany relationships BEFORE the final step
    // (the final step to the CTE cube will be handled by CTE pre-aggregation)
    // Use effective relationship for reversed steps
    const intermediateSteps = pathWithRelationships.slice(0, -1)
    const hasManyOnPath = intermediateSteps.some(step => {
      const effectiveRel = step.reversed
        ? reverseRelationship(step.joinDef.relationship)
        : step.joinDef.relationship
      return effectiveRel === 'hasMany'
    })

    if (!hasManyOnPath) {
      // No intermediate hasMany - use existing logic
      return {
        path: pathWithRelationships,
        hasIntermediateHasMany: false,
        intermediateJoins: [],
        correctJoinKeys: []
      }
    }

    // There's a hasMany on the intermediate path!
    // We need to absorb intermediate tables into the CTE

    // Build intermediate join info for tables between primary and CTE cube
    const intermediateJoins: IntermediateJoinInfo[] = []

    // Find all intermediate cubes on the path
    for (let i = 0; i < pathWithRelationships.length - 1; i++) {
      const step = pathWithRelationships[i]
      const nextStep = pathWithRelationships[i + 1]
      const intermediateCube = cubes.get(step.toCube)

      if (!intermediateCube) continue

      // The intermediate cube's security WHERE is materialized symbolically:
      // the physical builder calls intermediateCube.sql(context) when it
      // absorbs this join into the CTE, so no SQL is baked into the plan here.

      // Find the join column from this intermediate to the NEXT step
      // This is the column that connects to the CTE cube (or next intermediate)
      const cteJoinColumn = nextStep.joinDef.on[0]?.source

      // Find the join column from primary to this intermediate
      // This is the column that we'll GROUP BY in the CTE
      const primaryJoinColumn = step.joinDef.on[0]?.target

      intermediateJoins.push({
        cube: intermediateCube,
        joinDef: nextStep.joinDef as CubeJoin,
        primaryJoinColumn,
        cteJoinColumn
      })
    }

    // Calculate the correct join keys
    // When there are intermediate hasMany, the CTE should:
    // 1. JOIN to intermediate tables
    // 2. GROUP BY the primary cube's join column (not the intermediate's)
    // 3. Join directly to primary cube
    const firstStep = pathWithRelationships[0]
    const correctJoinKeys = firstStep.joinDef.on.map(joinOn => ({
      sourceColumn: joinOn.source.name,  // Column on primary cube
      targetColumn: joinOn.target.name,  // Column on first intermediate (which CTE will include via JOIN)
      sourceColumnObj: joinOn.source,
      targetColumnObj: joinOn.target
    }))

    return {
      path: pathWithRelationships,
      hasIntermediateHasMany: true,
      intermediateJoins,
      correctJoinKeys
    }
  }

  /**
   * Compute CTE reasons from the actual join plan entries.
   *
   * Instead of scanning all registered cubes (which causes false positives when
   * unrelated hasMany relationships exist), this walks only the planned joins
   * using the `relationship` field now stored on each JoinCubePlanEntry.
   *
   * Algorithm:
   * 1. Scan join plan entries for hasMany/belongsToMany relationships
   * 2. If none found → return empty map (no CTEs needed)
   * 3. hasMany/belongsToMany targets with measures → 'hasMany'
   * 4. Other join cubes with measures (not hasMany source) → 'fanOutPrevention'
   */
  private computeCTEReasons(
    _primaryCube: Cube,
    joinCubes: JoinRef[],
    query: SemanticQuery
  ): Map<string, 'hasMany' | 'fanOutPrevention'> {
    const reasons = new Map<string, 'hasMany' | 'fanOutPrevention'>()

    // Step 1: Classify join relationships from the actual join plan.
    //
    // Two kinds of grain mismatch cause measure inflation:
    //
    // A) hasMany / belongsToMany: the joined cube's rows multiply the primary's rows.
    //    → The joined cube needs a 'hasMany' CTE (SUM in outer query).
    //    → Other cubes with measures also need 'fanOutPrevention' (MAX in outer query).
    //
    // B) belongsTo: the primary has MULTIPLE rows per joined row (many-to-one).
    //    Even without any hasMany, SUM(joinedCube.measure) is inflated by the number
    //    of primary rows per join key (e.g., SUM(dept.budget) inflated by employee count).
    //    → The belongsTo-joined cube with measures needs 'fanOutPrevention'.
    const hasManyTargets = new Set<string>()
    const belongsToTargetsWithMeasures = new Set<string>()

    // Identify cubes with measures in the query (needed for both paths)
    const cubesWithMeasures = new Set<string>()
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName] = measure.split('.')
        cubesWithMeasures.add(cubeName)
      }
    }

    for (const jc of joinCubes) {
      if (jc.relationship === 'hasMany' || jc.relationship === 'belongsToMany') {
        hasManyTargets.add(jc.target.name)
      } else if (jc.relationship === 'belongsTo' && cubesWithMeasures.has(jc.target.name)) {
        // belongsTo from primary → primary has many rows per joined row
        // The joined cube's measures are at risk of inflation
        belongsToTargetsWithMeasures.add(jc.target.name)
      }
    }

    // Step 2: No multiplication risk → no CTEs needed
    if (hasManyTargets.size === 0 && belongsToTargetsWithMeasures.size === 0) {
      return reasons
    }

    // Step 3: Assign CTE reasons
    for (const jc of joinCubes) {
      if (!cubesWithMeasures.has(jc.target.name)) continue

      if (hasManyTargets.has(jc.target.name)) {
        // Direct hasMany/belongsToMany target → 'hasMany' (SUM in outer query)
        reasons.set(jc.target.name, 'hasMany')
      } else if (belongsToTargetsWithMeasures.has(jc.target.name)) {
        // belongsTo join with measures → grain mismatch with primary
        reasons.set(jc.target.name, 'fanOutPrevention')
      } else if (hasManyTargets.size > 0) {
        // There's a hasMany elsewhere that multiplies rows.
        // This cube has measures and is not the hasMany target → fanOutPrevention.
        reasons.set(jc.target.name, 'fanOutPrevention')
      }
    }

    return reasons
  }

  // NOTE: The former detectHasManyInQuery() and getCTEReason() methods were removed
  // as part of the P3 refactor. They scanned ALL registered cubes (not just those in
  // the join plan), causing false-positive hasMany detection. Their logic has been
  // replaced by computeCTEReasons() above, which walks only the actual join plan.
  //
  // The former findJoinInfoToCube() reverse-lookup helper was also removed: it was
  // only ever reached behind an `isPrimary` flag that was hard-coded to false, so it
  // was unreachable. findJoinInfoForCube() (below) subsumes its behaviour.

  /**
   * Find downstream cubes that need join keys included in the CTE.
   *
   * When a query has dimensions from a cube (e.g., Teams.name) and measures from
   * a junction cube (e.g., EmployeeTeams.count), the junction CTE needs to include
   * the join key to the dimension cube (team_id) so the dimension cube can be
   * joined through the CTE instead of via an alternative path.
   *
   * @param cteCube The cube being converted to a CTE (e.g., EmployeeTeams)
   * @param query The semantic query with dimensions and measures
   * @param allCubes Map of all registered cubes
   * @returns Array of downstream join key info for cubes needing join through this CTE
   */
  private findDownstreamJoinKeys(
    cteCube: Cube,
    query: SemanticQuery,
    _allCubes: Map<string, Cube>
  ): Array<{ targetCubeName: string; joinKeys: CTEJoinKey[] }> {
    const downstreamJoinKeys: Array<{ targetCubeName: string; joinKeys: CTEJoinKey[] }> = []

    // Cubes contributing dimensions / time dimensions / filter members (excluding CTE cube)
    const dimensionCubeNames = collectDimensionCubeNames(query, cteCube.name)

    if (!cteCube.joins) {
      return downstreamJoinKeys
    }

    // For each dimension cube directly joinable from the CTE cube, include join keys
    // so the dimension cube can be joined through the CTE.
    for (const [, joinDef] of Object.entries(cteCube.joins)) {
      const targetCube = resolveCubeReference(joinDef.targetCube, _allCubes)
      if (!targetCube) continue
      const targetCubeName = targetCube.name

      if (dimensionCubeNames.has(targetCubeName)) {
        downstreamJoinKeys.push({
          targetCubeName,
          joinKeys: deriveDownstreamJoinKeys(joinDef as CubeJoin)
        })
      }
    }

    return downstreamJoinKeys
  }

  /**
   * Expand calculated measures to include their dependencies
   */
  private expandCalculatedMeasureDependencies(
    cube: Cube,
    measures: string[]
  ): string[] {
    const expandedSet = new Set<string>()
    const toProcess = [...measures]

    while (toProcess.length > 0) {
      const measureName = toProcess.pop()!
      if (expandedSet.has(measureName)) {
        continue
      }

      expandedSet.add(measureName)

      const [, fieldName] = measureName.split('.')
      if (!cube.measures || !cube.measures[fieldName]) {
        continue
      }

      const measure = cube.measures[fieldName]

      // If it's a calculated measure, extract its dependencies
      if (measure.type === 'calculated' && measure.calculatedSql) {
        const deps = this.extractDependenciesFromTemplate(measure.calculatedSql, cube.name)
        for (const dep of deps) {
          if (!expandedSet.has(dep)) {
            toProcess.push(dep)
          }
        }
      }
    }

    return Array.from(expandedSet)
  }

  /**
   * Extract measure references from calculatedSql template
   */
  private extractDependenciesFromTemplate(calculatedSql: string, cubeName: string): string[] {

    // Guard against excessive input length to prevent ReDoS
    if (calculatedSql.length > 1000) return []

    const regex = /\{([^}]+)\}/g
    const matches = calculatedSql.matchAll(regex)
    const deps: string[] = []

    for (const match of matches) {
      const ref = match[1].trim()
      // Handle both {measure} and {Cube.measure} formats
      if (ref.includes('.')) {
        deps.push(ref)
      } else {
        deps.push(`${cubeName}.${ref}`)
      }
    }

    return deps
  }

  /**
   * Extract measures referenced in filters (for CTE inclusion)
   */
  private extractMeasuresFromFilters(query: SemanticQuery, cube: Cube): string[] {
    const measures: string[] = []

    if (!query.filters) {
      return measures
    }

    for (const filter of query.filters) {
      this.extractMeasuresFromFilter(filter, cube, measures)
    }

    return measures
  }

  /**
   * Recursively extract measures from filters for a specific cube
   * Only includes filter members that are actually measures (not dimensions)
   */
  private extractMeasuresFromFilter(filter: any, targetCube: Cube, measures: string[]): void {
    // Handle logical filters (AND/OR)
    if ('and' in filter || 'or' in filter) {
      const logicalFilters = filter.and || filter.or || []
      for (const subFilter of logicalFilters) {
        this.extractMeasuresFromFilter(subFilter, targetCube, measures)
      }
      return
    }

    // Handle simple filter condition
    if ('member' in filter) {
      const memberName = filter.member
      const [cubeName, fieldName] = memberName.split('.')
      if (cubeName === targetCube.name) {
        // Only include if this is actually a measure, not a dimension
        // Dimension filters should not trigger CTE creation
        if (targetCube.measures && targetCube.measures[fieldName]) {
          measures.push(memberName)
        }
        // Dimension filters are intentionally excluded - they don't cause fan-out
        // and shouldn't trigger pre-aggregation CTEs
      }
    }
  }
}

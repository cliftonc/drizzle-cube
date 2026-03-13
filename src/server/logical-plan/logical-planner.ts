/**
 * Query Planner for Unified Query Architecture
 * Handles query planning, cube analysis, and join resolution
 * All SQL building has been moved to DrizzleSqlBuilder
 */

import type {
  Cube,
  QueryContext,
  PhysicalQueryPlan,
  CubeJoin,
  SemanticQuery,
  PrimaryCubeAnalysis,
  PrimaryCubeCandidate,
  JoinPathAnalysis,
  JoinPathStep,
  PropagatingFilter,
  Filter,
  IntermediateJoinInfo,
  QueryWarning
} from '../types'

import {
  resolveCubeReference,
  getJoinType,
  reverseRelationship,
  expandBelongsToManyJoin
} from '../cube-utils'

import {
  JoinPathResolver,
  type InternalJoinPathStep,
  type PreferredPathCandidateScore,
  type PreferredPathSelection
} from '../resolvers/join-path-resolver'
import { MeasureBuilder } from '../builders/measure-builder'


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

export class LogicalPlanner {
  // Cache resolver per cubes map to avoid repeated instantiation
  private resolverCache: WeakMap<Map<string, Cube>, JoinPathResolver> = new WeakMap()

  /**
   * Get or create a JoinPathResolver for the given cubes map
   */
  private getResolver(cubes: Map<string, Cube>): JoinPathResolver {
    let resolver = this.resolverCache.get(cubes)
    if (!resolver) {
      resolver = new JoinPathResolver(cubes)
      this.resolverCache.set(cubes, resolver)
    }
    return resolver
  }

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

    // Extract cube names from ORDER BY members
    if (query.order) {
      for (const member of Object.keys(query.order)) {
        const [cubeName] = member.split('.')
        if (cubeName) {
          cubesUsed.add(cubeName)
        }
      }
    }
    
    return cubesUsed
  }

  /**
   * Build query-level path hints (Cube-style) from all query members:
   * measures, dimensions, time dimensions, filters, and order-by.
   * These hints guide path selection toward the semantic query grain.
   */
  private collectPathHintCubes(query: SemanticQuery): Set<string> {
    return this.analyzeCubeUsage(query)
  }

  /**
   * Recursively extract cube names from filters (handles logical filters)
   */
  private extractCubeNamesFromFilter(filter: any, cubesUsed: Set<string>): void {
    // Handle logical filters (AND/OR) - Server format: { and: [...] } or { or: [...] }
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

  /**
   * Choose the primary cube based on query analysis
   * Uses a consistent strategy to avoid measure order dependencies
   *
   * Delegates to analyzePrimaryCubeSelection() for the actual logic,
   * ensuring a single source of truth for primary cube selection.
   */
  choosePrimaryCube(cubeNames: string[], query: SemanticQuery, cubes?: Map<string, Cube>): string {
    // For single cube, return immediately
    if (cubeNames.length === 1) {
      return cubeNames[0]
    }

    // Without cubes map, fall back to alphabetical
    if (!cubes) {
      return [...cubeNames].sort()[0]
    }

    // Use the detailed analysis method and extract just the selected cube
    const analysis = this.analyzePrimaryCubeSelection(cubeNames, query, cubes)
    return analysis.selectedCube
  }

  /**
   * Analyze primary cube selection with candidate details.
   * Exposed for LogicalPlanBuilder so dry-run/analyze can report
   * exactly which selection rule was used.
   */
  analyzePrimaryCube(
    cubeNames: string[],
    query: SemanticQuery,
    cubes: Map<string, Cube>
  ): PrimaryCubeAnalysis {
    return this.analyzePrimaryCubeSelection(cubeNames, query, cubes)
  }

  /**
   * Analyze join path for a specific target cube.
   * Exposed for LogicalPlanBuilder to provide join decision trace.
   */
  analyzeJoinPathForTarget(
    cubes: Map<string, Cube>,
    fromCube: string,
    toCube: string,
    query?: SemanticQuery
  ): JoinPathAnalysis {
    return this.analyzeJoinPath(cubes, fromCube, toCube, query)
  }

  /**
   * Build join plan for a known primary cube.
   * Exposed for LogicalPlanBuilder so logical planning can compose
   * planner phases directly.
   */
  buildJoinPlanForPrimary(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cubeNames: string[],
    ctx: QueryContext,
    query: SemanticQuery
  ): PhysicalQueryPlan['joinCubes'] {
    return this.buildJoinPlan(cubes, primaryCube, cubeNames, ctx, query)
  }

  /**
   * Build pre-aggregation CTE plan from a primary cube and join plan.
   * Exposed for LogicalPlanBuilder phase composition.
   */
  buildPreAggregationCTEs(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    joinCubes: PhysicalQueryPlan['joinCubes'],
    query: SemanticQuery,
    ctx: QueryContext
  ): PhysicalQueryPlan['preAggregationCTEs'] {
    return this.planPreAggregationCTEs(cubes, primaryCube, joinCubes, query, ctx)
  }

  /**
   * Generate query warnings from pre-aggregation analysis.
   * Exposed for LogicalPlanBuilder phase composition.
   */
  buildWarnings(
    query: SemanticQuery,
    preAggregationCTEs?: PhysicalQueryPlan['preAggregationCTEs']
  ): QueryWarning[] {
    return this.generateWarnings(query, preAggregationCTEs)
  }

  /**
   * Build join plan for multi-cube query
   * Supports both direct joins and transitive joins through intermediate cubes
   *
   * Uses query-aware path selection to prefer joining through cubes that have
   * measures in the query (e.g., joining Teams through EmployeeTeams when
   * EmployeeTeams.count is a measure)
   */
  private buildJoinPlan(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cubeNames: string[],
    ctx: QueryContext,
    query: SemanticQuery
  ): PhysicalQueryPlan['joinCubes'] {
    const resolver = this.getResolver(cubes)
    const joinCubes: PhysicalQueryPlan['joinCubes'] = []
    const processedCubes = new Set([primaryCube.name])

    // Cubes with measures are still needed for CTE pre-detection.
    const cubesWithMeasures = new Set<string>()
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName] = measure.split('.')
        cubesWithMeasures.add(cubeName)
      }
    }

    // Rust-style hinting: include all query member cubes to drive path selection.
    const preferredPathCubes = this.collectPathHintCubes(query)

    // Pre-identify cubes that will become CTEs (hasMany relationships with measures)
    // IMPORTANT: We must NOT give "already processed" preference to CTE'd cubes because
    // when a cube becomes a CTE, its original table columns are replaced by CTE columns.
    // If we route join paths through a CTE'd cube, the join conditions will reference
    // the original table (e.g., productivity.departmentId) instead of the CTE alias,
    // causing "missing FROM-clause entry" errors.
    const willBeCTEd = new Set<string>()
    for (const cubeName of cubesWithMeasures) {
      if (cubeName === primaryCube.name) continue
      // Check if this cube has hasMany relationship from primary
      const hasManyJoin = this.findHasManyJoinDef(primaryCube, cubeName, cubes)
      if (hasManyJoin) {
        willBeCTEd.add(cubeName)
      }
    }

    // Find cubes to join (all except primary)
    const cubesToJoin = cubeNames.filter(name => name !== primaryCube.name)

    for (const cubeName of cubesToJoin) {
      if (processedCubes.has(cubeName)) {
        continue // Already processed
      }

      // When finding join paths, filter out CTE'd cubes from the "already processed" set.
      // This prevents the path scorer from preferring longer paths through CTE'd cubes
      // when shorter direct paths exist.
      // Example: Without this fix, Employees → Productivity → Departments would be chosen
      // over Employees → Departments because Productivity is "already processed", even though
      // Productivity is a CTE and its join conditions won't work.
      const effectiveProcessed = new Set(
        [...processedCubes].filter(c => !willBeCTEd.has(c))
      )

      // Use preferring method to route through cubes with measures when possible
      const joinPath = resolver.findPathPreferring(
        primaryCube.name,
        cubeName,
        preferredPathCubes,
        effectiveProcessed
      )
      if (!joinPath || joinPath.length === 0) {
        throw new Error(`No join path found from '${primaryCube.name}' to '${cubeName}'`)
      }

      // Add all cubes in the join path
      for (const { fromCube: pathFromCube, toCube, joinDef, reversed } of joinPath) {
        if (processedCubes.has(toCube)) {
          continue // Skip if already processed
        }

        const cube = cubes.get(toCube)
        if (!cube) {
          throw new Error(`Cube '${toCube}' not found`)
        }

        // Compute effective relationship: reversed belongsTo↔hasMany
        const effectiveRelationship = reversed
          ? reverseRelationship(joinDef.relationship)
          : joinDef.relationship

        // Check if this is a belongsToMany relationship
        if (effectiveRelationship === 'belongsToMany' && joinDef.through) {
          // Expand the belongsToMany join into junction table joins
          const expanded = expandBelongsToManyJoin(joinDef, ctx.securityContext)

          // Add the join with junction table information
          joinCubes.push({
            cube,
            alias: `${toCube.toLowerCase()}_cube`,
            joinType: expanded.junctionJoins[1].joinType, // Use the target join type
            joinCondition: expanded.junctionJoins[1].condition, // Target join condition
            relationship: 'belongsToMany',
            junctionTable: {
              table: joinDef.through.table,
              alias: `junction_${toCube.toLowerCase()}`,
              joinType: expanded.junctionJoins[0].joinType,
              joinCondition: expanded.junctionJoins[0].condition,
              securitySql: joinDef.through.securitySql,
              sourceCubeName: pathFromCube
            }
          })
        } else {
          // Regular join (belongsTo, hasOne, hasMany)
          // Build join condition using new array-based format
          // For regular table joins, we don't use artificial aliases - use actual table references
          // Join condition is symmetric (eq(a,b) = eq(b,a)) so no change needed for reversed joins
          const joinCondition = resolver.buildJoinCondition(
            joinDef as CubeJoin,
            null, // No source alias needed - use the actual column
            null // No target alias needed - use the actual column
          )

          // Derive join type from effective (possibly reversed) relationship
          const joinType = getJoinType(effectiveRelationship, joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'

          joinCubes.push({
            cube,
            alias: `${toCube.toLowerCase()}_cube`,
            joinType,
            joinCondition,
            relationship: effectiveRelationship as 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
          })
        }

        processedCubes.add(toCube)
      }
    }

    return joinCubes
  }

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
  private planPreAggregationCTEs(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    joinCubes: PhysicalQueryPlan['joinCubes'],
    query: SemanticQuery,
    ctx: QueryContext
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
      const cteReason = cteReasons.get(joinCubeEntry.cube.name)
      if (!cteReason) continue

      const cube = joinCubeEntry.cube
      const alias = joinCubeEntry.alias
      const isPrimary = false

      // Get measures from this cube
      const measuresFromSelect = query.measures.filter(m =>
        m.startsWith(cube.name + '.')
      )
      const measuresFromFilters = this.extractMeasuresFromFilters(query, cube)
      const allMeasuresFromThisCube = [...new Set([...measuresFromSelect, ...measuresFromFilters])]

      if (allMeasuresFromThisCube.length === 0) {
        continue // No measures from this cube
      }

      // Analyze the full join path to detect multi-hop fan-out scenarios
      // Example: Departments → Employees → EmployeeTeams
      // If there's a hasMany on the intermediate path, we need to absorb
      // intermediate tables into the CTE
      const pathAnalysis = this.analyzeJoinPathToPrimary(cubes, primaryCube, cube.name, ctx, query)

      let joinKeys: Array<{
        sourceColumn: string
        targetColumn: string
        sourceColumnObj: any
        targetColumnObj: any
      }>
      let intermediateJoins: IntermediateJoinInfo[] | undefined

      if (pathAnalysis?.hasIntermediateHasMany && pathAnalysis.intermediateJoins.length > 0) {
        // Multi-hop fan-out scenario: use the corrected join keys
        // and include intermediate joins to be absorbed into the CTE
        joinKeys = pathAnalysis.correctJoinKeys
        intermediateJoins = pathAnalysis.intermediateJoins as IntermediateJoinInfo[]
      } else {
        // Standard path: use existing join key logic
        // Find the join definition - could be from primary or from any cube in the chain
        // For the primary cube, we need to find a join FROM another cube TO the primary
        const joinInfoFromPath =
          !isPrimary && pathAnalysis?.path && pathAnalysis.path.length > 0
            ? (() => {
                const lastStep = pathAnalysis.path[pathAnalysis.path.length - 1]
                const sourceCube = cubes.get(lastStep.fromCube)
                if (!sourceCube) return null
                return {
                  sourceCube,
                  joinDef: lastStep.joinDef as CubeJoin,
                  reversed: lastStep.reversed
                }
              })()
            : null

        const joinInfo = isPrimary
          ? this.findJoinInfoToCube(cubes, primaryCube.name)
          : joinInfoFromPath ?? this.findJoinInfoForCube(cubes, primaryCube, cube.name)

        if (!joinInfo) {
          continue // No join info found
        }

        // Extract join keys from the join definition
        // For belongsToMany, join keys come from through configuration (on[] is empty)
        if (joinInfo.joinDef.relationship === 'belongsToMany' && joinInfo.joinDef.through) {
          // Direction matters: when belongsToMany is defined on the primary cube,
          // sourceKey connects primary->junction and targetKey connects junction->CTE.
          // When defined on the CTE cube (or reversed), sourceKey connects CTE->junction.
          const isDefinedOnPrimary = joinInfo.sourceCube?.name === primaryCube.name
            && !('reversed' in joinInfo && joinInfo.reversed)

          if (isDefinedOnPrimary) {
            // targetKey connects junction -> CTE cube
            joinKeys = joinInfo.joinDef.through.targetKey.map(tk => ({
              sourceColumn: tk.source.name,     // junction table column
              targetColumn: tk.target.name,     // CTE cube column
              sourceColumnObj: tk.source,
              targetColumnObj: tk.target
            }))
          } else {
            // sourceKey connects CTE -> junction (existing logic)
            // sourceKey[].source = CTE cube's column (goes into CTE SELECT/GROUP BY via targetColumnObj)
            // sourceKey[].target = junction table's column (used in outer query join condition via sourceColumnObj)
            joinKeys = joinInfo.joinDef.through.sourceKey.map(sk => ({
              sourceColumn: sk.target.name,
              targetColumn: sk.source.name,
              sourceColumnObj: sk.target,
              targetColumnObj: sk.source
            }))
          }
        } else {
          // For primary cube, the join keys are reversed (target becomes source)
          // For reversed joins (CTE cube has belongsTo back to primary), also swap
          // source/target so that sourceColumnObj references the primary cube's column
          // and targetColumnObj references the CTE cube's column
          const shouldReverse = isPrimary || ('reversed' in joinInfo && joinInfo.reversed)
          joinKeys = shouldReverse
            ? joinInfo.joinDef.on.map(joinOn => ({
                sourceColumn: joinOn.target.name,
                targetColumn: joinOn.source.name,
                sourceColumnObj: joinOn.target,
                targetColumnObj: joinOn.source
              }))
            : joinInfo.joinDef.on.map(joinOn => ({
                sourceColumn: joinOn.source.name,
                targetColumn: joinOn.target.name,
                sourceColumnObj: joinOn.source,
                targetColumnObj: joinOn.target
              }))
        }
        intermediateJoins = undefined
      }

      // Find propagating filters from related cubes that should apply to this CTE
      const propagatingFilters = this.findPropagatingFilters(query, cube, cubes)

      // Categorize measures for post-aggregation window function handling
      const cubeMap = new Map([[cube.name, cube]])
      const { aggregateMeasures, requiredBaseMeasures } = MeasureBuilder.categorizeForPostAggregation(
        allMeasuresFromThisCube,
        cubeMap
      )

      // Combine aggregate measures with base measures required by window functions
      const allAggregateMeasures = [...new Set([
        ...aggregateMeasures,
        ...Array.from(requiredBaseMeasures).filter(m => m.startsWith(cube.name + '.'))
      ])]

      // Create aggregate CTE if we have any aggregate measures
      if (allAggregateMeasures.length > 0) {
        // Expand calculated measures to include their dependencies
        const expandedAggregateMeasures = this.expandCalculatedMeasureDependencies(
          cube,
          allAggregateMeasures
        )

        // Detect downstream cubes that need join keys in the CTE
        const downstreamJoinKeys = this.findDownstreamJoinKeys(
          cube,
          query,
          cubes
        )

        preAggCTEs.push({
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
        })
      }
    }

    return preAggCTEs
  }

  /**
   * Find join information TO a cube (reverse lookup)
   * Used when the primary cube needs a CTE and we need to find how other cubes join to it
   */
  private findJoinInfoToCube(
    cubes: Map<string, Cube>,
    targetCubeName: string
  ): { sourceCube: Cube; joinDef: CubeJoin } | null {
    for (const [, cube] of cubes) {
      if (cube.name === targetCubeName) continue
      if (cube.joins) {
        for (const [, joinDef] of Object.entries(cube.joins)) {
          const resolvedTarget = resolveCubeReference(joinDef.targetCube, cubes)
          if (!resolvedTarget) continue
          if (resolvedTarget.name === targetCubeName) {
            return { sourceCube: cube, joinDef: joinDef as CubeJoin }
          }
        }
      }
    }
    return null
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
   * @param ctx Query context for security filtering
   */
  private analyzeJoinPathToPrimary(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    targetCubeName: string,
    ctx: QueryContext,
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
    const resolver = this.getResolver(cubes)
    const preferredPathCubes = this.collectPathHintCubes(query)

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

      // Get the security filter for this intermediate cube
      const cubeBase = intermediateCube.sql(ctx)
      const securityFilter = cubeBase.where

      // Find the join column from this intermediate to the NEXT step
      // This is the column that connects to the CTE cube (or next intermediate)
      const cteJoinColumn = nextStep.joinDef.on[0]?.source

      // Find the join column from primary to this intermediate
      // This is the column that we'll GROUP BY in the CTE
      const primaryJoinColumn = step.joinDef.on[0]?.target

      intermediateJoins.push({
        cube: intermediateCube,
        joinDef: nextStep.joinDef as CubeJoin,
        securityFilter,
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
    joinCubes: PhysicalQueryPlan['joinCubes'],
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
        hasManyTargets.add(jc.cube.name)
      } else if (jc.relationship === 'belongsTo' && cubesWithMeasures.has(jc.cube.name)) {
        // belongsTo from primary → primary has many rows per joined row
        // The joined cube's measures are at risk of inflation
        belongsToTargetsWithMeasures.add(jc.cube.name)
      }
    }

    // Step 2: No multiplication risk → no CTEs needed
    if (hasManyTargets.size === 0 && belongsToTargetsWithMeasures.size === 0) {
      return reasons
    }

    // Step 3: Assign CTE reasons
    for (const jc of joinCubes) {
      if (!cubesWithMeasures.has(jc.cube.name)) continue

      if (hasManyTargets.has(jc.cube.name)) {
        // Direct hasMany/belongsToMany target → 'hasMany' (SUM in outer query)
        reasons.set(jc.cube.name, 'hasMany')
      } else if (belongsToTargetsWithMeasures.has(jc.cube.name)) {
        // belongsTo join with measures → grain mismatch with primary
        reasons.set(jc.cube.name, 'fanOutPrevention')
      } else if (hasManyTargets.size > 0) {
        // There's a hasMany elsewhere that multiplies rows.
        // This cube has measures and is not the hasMany target → fanOutPrevention.
        reasons.set(jc.cube.name, 'fanOutPrevention')
      }
    }

    return reasons
  }

  // NOTE: The former detectHasManyInQuery() and getCTEReason() methods were removed
  // as part of the P3 refactor. They scanned ALL registered cubes (not just those in
  // the join plan), causing false-positive hasMany detection. Their logic has been
  // replaced by computeCTEReasons() above, which walks only the actual join plan.

  /**
   * Find join information for a cube from any cube in the query
   * This extends findHasManyJoinDef to work with any relationship type
   * and to search from any source cube, not just the primary
   */
  private findJoinInfoForCube(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    targetCubeName: string
  ): { sourceCube: Cube; joinDef: CubeJoin; reversed?: boolean } | null {
    // First check primary cube for a direct join to the target
    if (primaryCube.joins) {
      for (const [, joinDef] of Object.entries(primaryCube.joins)) {
        const resolvedTarget = resolveCubeReference(joinDef.targetCube, cubes)
        if (!resolvedTarget) continue
        if (resolvedTarget.name === targetCubeName) {
          return { sourceCube: primaryCube, joinDef: joinDef as CubeJoin }
        }
      }
    }

    // Check if the target cube has a direct join BACK to the primary cube (reverse lookup)
    // This handles the common case where a CTE cube has a belongsTo relationship
    // to the primary cube (e.g., SurveyResponses.belongsTo(Users) via userId).
    // This is preferred over searching all cubes because it uses a direct relationship
    // to the primary cube, ensuring the CTE join keys reference columns that are
    // actually in the FROM clause.
    const targetCube = cubes.get(targetCubeName)
    if (targetCube?.joins) {
      for (const [, joinDef] of Object.entries(targetCube.joins)) {
        const resolvedTarget = resolveCubeReference(joinDef.targetCube, cubes)
        if (!resolvedTarget) continue
        if (resolvedTarget.name === primaryCube.name) {
          // Found: target cube has a join back to primary cube
          // Mark as reversed so the caller can swap source/target columns
          return { sourceCube: targetCube, joinDef: joinDef as CubeJoin, reversed: true }
        }
      }
    }

    // Fallback: check all other cubes in the query
    for (const [, cube] of cubes) {
      if (cube.name === primaryCube.name || cube.name === targetCubeName) continue
      if (cube.joins) {
        for (const [, joinDef] of Object.entries(cube.joins)) {
          const resolvedTarget = resolveCubeReference(joinDef.targetCube, cubes)
          if (!resolvedTarget) continue
          if (resolvedTarget.name === targetCubeName) {
            return { sourceCube: cube, joinDef: joinDef as CubeJoin }
          }
        }
      }
    }

    return null
  }

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
  ): Array<{ targetCubeName: string; joinKeys: Array<{ sourceColumn: string; targetColumn: string; sourceColumnObj?: any; targetColumnObj?: any }> }> {
    const downstreamJoinKeys: Array<{ targetCubeName: string; joinKeys: Array<{ sourceColumn: string; targetColumn: string; sourceColumnObj?: any; targetColumnObj?: any }> }> = []

    // Get cubes that have dimensions in the query (excluding the CTE cube itself)
    const dimensionCubeNames = new Set<string>()
    if (query.dimensions) {
      for (const dim of query.dimensions) {
        const [cubeName] = dim.split('.')
        if (cubeName !== cteCube.name) {
          dimensionCubeNames.add(cubeName)
        }
      }
    }
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName] = timeDim.dimension.split('.')
        if (cubeName !== cteCube.name) {
          dimensionCubeNames.add(cubeName)
        }
      }
    }
    // Also collect cube names from filters - filters can reference cubes that need
    // to join through the CTE (e.g., Repositories.id filter when PullRequests is a CTE)
    if (query.filters) {
      for (const filter of query.filters) {
        this.extractCubeNamesFromFilter(filter, dimensionCubeNames)
      }
      // Remove the CTE cube itself (it might have been added from filters)
      dimensionCubeNames.delete(cteCube.name)
    }

    // For each dimension cube, check if it's directly joinable from the CTE cube
    if (cteCube.joins) {
      for (const [, joinDef] of Object.entries(cteCube.joins)) {
        const targetCube = resolveCubeReference(joinDef.targetCube, _allCubes)
        if (!targetCube) continue
        const targetCubeName = targetCube.name

        // Check if this target cube has dimensions in the query
        if (dimensionCubeNames.has(targetCubeName)) {
          // This cube's dimensions are in the query and it's joinable from the CTE cube
          // Include the join keys so the dimension cube can be joined through the CTE
          let joinKeys
          if (joinDef.relationship === 'belongsToMany' && joinDef.through) {
            // For belongsToMany, use through.sourceKey (on[] is empty)
            // sourceKey[].source = CTE cube's column (included in CTE SELECT via sourceColumnObj)
            // sourceKey[].target = junction table column
            joinKeys = joinDef.through.sourceKey.map(sk => ({
              sourceColumn: sk.source.name,
              targetColumn: sk.target.name,
              sourceColumnObj: sk.source,
              targetColumnObj: sk.target
            }))
          } else {
            joinKeys = joinDef.on.map(joinOn => ({
              sourceColumn: joinOn.source.name,
              targetColumn: joinOn.target.name,
              sourceColumnObj: joinOn.source,
              targetColumnObj: joinOn.target
            }))
          }

          downstreamJoinKeys.push({
            targetCubeName,
            joinKeys
          })
        }
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

    // codeql[js/polynomial-redos] input is from validated cube definition templates, not user input
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
   * Find hasMany join definition from primary cube to target cube
   */
  private findHasManyJoinDef(
    primaryCube: Cube,
    targetCubeName: string,
    cubes?: Map<string, Cube>
  ): CubeJoin | null {
    if (!primaryCube.joins) {
      return null
    }

    // Look through all joins from primary cube
    for (const [, joinDef] of Object.entries(primaryCube.joins)) {
      const resolvedTargetCube = resolveCubeReference(joinDef.targetCube, cubes)
      if (!resolvedTargetCube) continue
      if (resolvedTargetCube.name === targetCubeName && joinDef.relationship === 'hasMany') {
        return joinDef as CubeJoin
      }
    }

    return null
  }

  /**
   * Find filters that need to propagate from related cubes to a CTE cube.
   * When cube A has filters and a hasMany relationship to cube B (the CTE cube),
   * A's filters should propagate into B's CTE via a subquery.
   *
   * Example: Employees.createdAt filter should propagate to Productivity CTE
   * via: employee_id IN (SELECT id FROM employees WHERE created_at >= $date)
   */
  private findPropagatingFilters(
    query: SemanticQuery,
    cteCube: Cube,
    allCubes: Map<string, Cube>
  ): PropagatingFilter[] {
    const result: PropagatingFilter[] = []
    if (!query.filters) return result

    // Extract all cube names referenced in filters
    const filterCubeNames = new Set<string>()
    this.extractFilterCubeNamesToSet(query.filters, filterCubeNames)

    // Also check time dimension filters which may have date ranges
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        if (timeDim.dateRange) {
          const [cubeName] = timeDim.dimension.split('.')
          if (cubeName) {
            filterCubeNames.add(cubeName)
          }
        }
      }
    }

    // For each filter cube, check if it has a hasMany relationship TO the CTE cube
    for (const filterCubeName of filterCubeNames) {
      if (filterCubeName === cteCube.name) continue // Same cube, handled elsewhere

      const filterCube = allCubes.get(filterCubeName)
      if (!filterCube?.joins) continue

      // Check if filterCube has hasMany -> cteCube
      for (const [, joinDef] of Object.entries(filterCube.joins)) {
        const targetCube = resolveCubeReference(joinDef.targetCube, allCubes)
        if (!targetCube) continue
        if (targetCube.name === cteCube.name && joinDef.relationship === 'hasMany') {
          // Found: filterCube hasMany -> cteCube
          // Extract the filters for this cube
          const filtersForCube = this.extractFiltersForCube(query.filters, filterCubeName)

          // Also add time dimension date ranges as filters
          const timeFilters = this.extractTimeDimensionFiltersForCube(query, filterCubeName)
          const allFilters = [...filtersForCube, ...timeFilters]

          if (allFilters.length > 0 && joinDef.on.length > 0) {
            result.push({
              sourceCube: filterCube,
              filters: allFilters,
              // Map all join keys for composite key support
              // source = filterCube PK (e.g., employees.id)
              // target = cteCube FK (e.g., productivity.employeeId)
              joinConditions: joinDef.on.map(key => ({
                source: key.source,
                target: key.target
              }))
            })
          }
        }
      }
    }
    return result
  }

  /**
   * Extract cube names from filters into a Set (helper for findPropagatingFilters)
   */
  private extractFilterCubeNamesToSet(filters: Filter[], cubesSet: Set<string>): void {
    for (const filter of filters) {
      // Handle logical filters (AND/OR)
      if ('and' in filter || 'or' in filter) {
        const logicalFilters = (filter as any).and || (filter as any).or || []
        this.extractFilterCubeNamesToSet(logicalFilters, cubesSet)
        continue
      }

      // Handle simple filter condition
      if ('member' in filter) {
        const [cubeName] = (filter as any).member.split('.')
        if (cubeName) {
          cubesSet.add(cubeName)
        }
      }
    }
  }

  /**
   * Extract filters for a specific cube from the filter array
   *
   * Logic for preserving filter semantics:
   * - AND: Safe to extract only matching branches (AND of fewer conditions is more permissive)
   * - OR: Must include ALL branches or skip entirely (partial OR changes semantics)
   *       If any branch belongs to another cube, skip the entire OR to be safe
   *       since we can't evaluate the other cube's conditions
   */
  private extractFiltersForCube(filters: Filter[], targetCubeName: string): Filter[] {
    const result: Filter[] = []

    for (const filter of filters) {
      // Handle AND filters - safe to extract only matching branches
      if ('and' in filter) {
        const subFilters = this.extractFiltersForCube((filter as any).and || [], targetCubeName)
        if (subFilters.length > 0) {
          result.push({ and: subFilters })
        }
        continue
      }

      // Handle OR filters - must check if ALL branches belong to target cube
      // If any branch belongs to another cube, skip the entire OR
      if ('or' in filter) {
        const orFilters = (filter as any).or || []

        // Check if all simple filters in this OR belong to target cube
        // If any belong to other cubes, skip this OR entirely
        const allBelongToTarget = this.allFiltersFromCube(orFilters, targetCubeName)

        if (allBelongToTarget) {
          // All branches belong to target cube, safe to include
          const subFilters = this.extractFiltersForCube(orFilters, targetCubeName)
          if (subFilters.length > 0) {
            result.push({ or: subFilters })
          }
        }
        // If not all belong to target, skip this OR filter entirely
        // This is the safe choice for CTE propagation - we can't evaluate
        // conditions from other cubes, so we shouldn't filter rows based on
        // partial OR conditions
        continue
      }

      // Handle simple filter condition
      if ('member' in filter) {
        const [cubeName] = (filter as any).member.split('.')
        if (cubeName === targetCubeName) {
          result.push(filter)
        }
      }
    }

    return result
  }

  /**
   * Check if all simple filters in a filter array belong to the specified cube
   * Recursively checks nested AND/OR filters
   */
  private allFiltersFromCube(filters: Filter[], targetCubeName: string): boolean {
    for (const filter of filters) {
      if ('and' in filter) {
        if (!this.allFiltersFromCube((filter as any).and || [], targetCubeName)) {
          return false
        }
        continue
      }
      if ('or' in filter) {
        if (!this.allFiltersFromCube((filter as any).or || [], targetCubeName)) {
          return false
        }
        continue
      }
      if ('member' in filter) {
        const [cubeName] = (filter as any).member.split('.')
        if (cubeName !== targetCubeName) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Extract time dimension date range filters as regular filters for a specific cube
   */
  private extractTimeDimensionFiltersForCube(query: SemanticQuery, targetCubeName: string): Filter[] {
    const result: Filter[] = []

    if (!query.timeDimensions) return result

    for (const timeDim of query.timeDimensions) {
      const [cubeName] = timeDim.dimension.split('.')
      if (cubeName === targetCubeName && timeDim.dateRange) {
        // Convert time dimension dateRange to an inDateRange filter
        result.push({
          member: timeDim.dimension,
          operator: 'inDateRange',
          values: Array.isArray(timeDim.dateRange) ? timeDim.dateRange : [timeDim.dateRange]
        })
      }
    }

    return result
  }

  /**
   * Analyze why a particular cube was chosen as primary
   */
  private analyzePrimaryCubeSelection(
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

    // Build candidates list
    const candidates: PrimaryCubeCandidate[] = []
    const dimensionCubes = (query.dimensions || []).map(d => d.split('.')[0])
    const cubeDimensionCount = new Map<string, number>()

    for (const cube of dimensionCubes) {
      cubeDimensionCount.set(cube, (cubeDimensionCount.get(cube) || 0) + 1)
    }

    const resolver = this.getResolver(cubes)
    for (const cubeName of cubeNames) {
      const cube = cubes.get(cubeName)
      const dimensionCount = cubeDimensionCount.get(cubeName) || 0
      const joinCount = cube?.joins ? Object.keys(cube.joins).length : 0
      const canReachAll = resolver.canReachAll(cubeName, cubeNames)

      candidates.push({
        cubeName,
        dimensionCount,
        joinCount,
        canReachAll
      })
    }

    // Tier 1: Check for dimension-based selection
    if (query.dimensions && query.dimensions.length > 0) {
      const maxDimensions = Math.max(...candidates.map(c => c.dimensionCount))

      if (maxDimensions > 0) {
        const primaryCandidates = candidates
          .filter(c => c.dimensionCount === maxDimensions)
          .sort((a, b) => a.cubeName.localeCompare(b.cubeName))

        // Check if candidate can reach all other cubes
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
      }
    }

    // Tier 2: Connectivity-based selection
    const reachableCandidates = candidates.filter(c => c.canReachAll)

    if (reachableCandidates.length > 0) {
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

    // Tier 3: Alphabetical fallback
    const fallback = [...cubeNames].sort()[0]
    return {
      selectedCube: fallback,
      reason: 'alphabetical_fallback',
      explanation: 'Selected alphabetically as fallback (no cube could reach all others)',
      candidates
    }
  }

  /**
   * Analyze the join path between two cubes with detailed step information
   *
   * Uses JoinPathResolver.findPath() for the actual path finding,
   * then converts the result to human-readable analysis format.
   */
  private analyzeJoinPath(
    cubes: Map<string, Cube>,
    fromCube: string,
    toCube: string,
    query?: SemanticQuery
  ): JoinPathAnalysis {
    // Use the resolver for BFS path finding (cached, optimized)
    const resolver = this.getResolver(cubes)
    const preferredPathCubes = query ? this.collectPathHintCubes(query) : new Set<string>()
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
  private generateWarnings(
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

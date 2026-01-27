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
  SemanticQuery,
  QueryAnalysis,
  PrimaryCubeAnalysis,
  PrimaryCubeCandidate,
  JoinPathAnalysis,
  JoinPathStep,
  PreAggregationAnalysis,
  PropagatingFilter,
  Filter
} from './types'

import {
  resolveCubeReference,
  getJoinType,
  expandBelongsToManyJoin
} from './cube-utils'

import { JoinPathResolver } from './join-path-resolver'
import { MeasureBuilder } from './builders/measure-builder'


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
    
    return cubesUsed
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
   * Create a unified query plan that works for both single and multi-cube queries
   */
  createQueryPlan(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    ctx: QueryContext
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
    const joinCubes = this.buildJoinPlan(cubes, primaryCube, cubeNames, ctx, query)
    
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
  ): QueryPlan['joinCubes'] {
    const resolver = this.getResolver(cubes)
    const joinCubes: QueryPlan['joinCubes'] = []
    const processedCubes = new Set([primaryCube.name])

    // Identify cubes that have measures in the query - these should be preferred
    // in join path selection to ensure semantically correct joins
    const cubesWithMeasures = new Set<string>()
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName] = measure.split('.')
        cubesWithMeasures.add(cubeName)
      }
    }

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
      const hasManyJoin = this.findHasManyJoinDef(primaryCube, cubeName)
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
        cubesWithMeasures,
        effectiveProcessed
      )
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

        // Check if this is a belongsToMany relationship
        if (joinDef.relationship === 'belongsToMany' && joinDef.through) {
          // Expand the belongsToMany join into junction table joins
          const expanded = expandBelongsToManyJoin(joinDef, ctx.securityContext)

          // Add the join with junction table information
          joinCubes.push({
            cube,
            alias: `${toCube.toLowerCase()}_cube`,
            joinType: expanded.junctionJoins[1].joinType, // Use the target join type
            joinCondition: expanded.junctionJoins[1].condition, // Target join condition
            junctionTable: {
              table: joinDef.through.table,
              alias: `junction_${toCube.toLowerCase()}`,
              joinType: expanded.junctionJoins[0].joinType,
              joinCondition: expanded.junctionJoins[0].condition,
              securitySql: joinDef.through.securitySql
            }
          })
        } else {
          // Regular join (belongsTo, hasOne, hasMany)
          // Build join condition using new array-based format
          // For regular table joins, we don't use artificial aliases - use actual table references
          const joinCondition = resolver.buildJoinCondition(
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
      // Only actual measures are included - dimension filters don't trigger CTE creation
      const measuresFromFilters = this.extractMeasuresFromFilters(query, joinCube.cube)

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

      // Find propagating filters from related cubes that should apply to this CTE
      const propagatingFilters = this.findPropagatingFilters(query, joinCube.cube, _cubes)

      // Categorize measures for post-aggregation window function handling
      // Window functions now operate on aggregated data, so we need to:
      // 1. Collect regular aggregate measures
      // 2. Collect base measures required by post-aggregation window functions
      // 3. Window functions themselves are applied in the outer query, not in CTEs
      const cubeMap = new Map([[joinCube.cube.name, joinCube.cube]])
      const { aggregateMeasures, requiredBaseMeasures } = MeasureBuilder.categorizeForPostAggregation(
        allMeasuresFromThisCube,
        cubeMap
      )

      // Combine aggregate measures with base measures required by window functions
      // This ensures the CTE contains all data needed for window function computation
      const allAggregateMeasures = [...new Set([
        ...aggregateMeasures,
        ...Array.from(requiredBaseMeasures).filter(m => m.startsWith(joinCube.cube.name + '.'))
      ])]

      // Create aggregate CTE if we have any aggregate measures (including window base measures)
      if (allAggregateMeasures.length > 0) {
        // Expand calculated measures to include their dependencies
        const expandedAggregateMeasures = this.expandCalculatedMeasureDependencies(
          joinCube.cube,
          allAggregateMeasures
        )

        // Detect downstream cubes that need join keys in the CTE
        // Example: If query has Teams.name dimension and EmployeeTeams.count measure,
        // the EmployeeTeams CTE needs to include team_id so Teams can be joined through it
        const downstreamJoinKeys = this.findDownstreamJoinKeys(
          joinCube.cube,
          query,
          _cubes
        )

        preAggCTEs!.push({
          cube: joinCube.cube,
          alias: joinCube.alias,
          cteAlias: `${joinCube.cube.name.toLowerCase()}_agg`,
          joinKeys,
          measures: expandedAggregateMeasures,
          propagatingFilters: propagatingFilters.length > 0 ? propagatingFilters : undefined,
          downstreamJoinKeys: downstreamJoinKeys.length > 0 ? downstreamJoinKeys : undefined,
          cteType: 'aggregate'
        })
      }

      // NOTE: Window CTEs are no longer created here.
      // Post-aggregation window functions are applied in the outer query (executor.ts)
      // after the data has been aggregated. This follows the analytics pattern:
      // 1. Aggregate data in CTE (GROUP BY dimensions)
      // 2. Apply window functions to aggregated results in outer SELECT
    }

    return preAggCTEs
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

    // For each dimension cube, check if it's directly joinable from the CTE cube
    if (cteCube.joins) {
      for (const [, joinDef] of Object.entries(cteCube.joins)) {
        const targetCube = resolveCubeReference(joinDef.targetCube)
        const targetCubeName = targetCube.name

        // Check if this target cube has dimensions in the query
        if (dimensionCubeNames.has(targetCubeName)) {
          // This cube's dimensions are in the query and it's joinable from the CTE cube
          // Include the join keys so the dimension cube can be joined through the CTE
          const joinKeys = joinDef.on.map(joinOn => ({
            sourceColumn: joinOn.source.name,
            targetColumn: joinOn.target.name,
            sourceColumnObj: joinOn.source,
            targetColumnObj: joinOn.target
          }))

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
        const targetCube = resolveCubeReference(joinDef.targetCube)
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
   * Analyze query planning decisions without building the full query
   * Returns detailed metadata about how the query plan would be constructed
   * Used for debugging and transparency in the playground UI
   */
  analyzeQueryPlan(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    _ctx: QueryContext
  ): QueryAnalysis {
    const cubesUsed = this.analyzeCubeUsage(query)
    const cubeNames = Array.from(cubesUsed)

    // Handle empty query
    if (cubeNames.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        cubeCount: 0,
        cubesInvolved: [],
        primaryCube: {
          selectedCube: '',
          reason: 'single_cube',
          explanation: 'No cubes found in query'
        },
        joinPaths: [],
        preAggregations: [],
        querySummary: {
          queryType: 'single_cube',
          joinCount: 0,
          cteCount: 0,
          hasPreAggregation: false
        },
        warnings: ['No cubes found in query - add measures or dimensions']
      }
    }

    // Analyze primary cube selection
    const primaryCubeAnalysis = this.analyzePrimaryCubeSelection(cubeNames, query, cubes)
    const primaryCubeName = primaryCubeAnalysis.selectedCube

    // Build analysis object
    const analysis: QueryAnalysis = {
      timestamp: new Date().toISOString(),
      cubeCount: cubeNames.length,
      cubesInvolved: cubeNames.sort(),
      primaryCube: primaryCubeAnalysis,
      joinPaths: [],
      preAggregations: [],
      querySummary: {
        queryType: 'single_cube',
        joinCount: 0,
        cteCount: 0,
        hasPreAggregation: false
      },
      warnings: []
    }

    // If multi-cube, analyze join paths
    if (cubeNames.length > 1) {
      const cubesToJoin = cubeNames.filter(name => name !== primaryCubeName)

      for (const targetCube of cubesToJoin) {
        analysis.joinPaths.push(
          this.analyzeJoinPath(cubes, primaryCubeName, targetCube)
        )
      }

      // Analyze pre-aggregation requirements
      const primaryCube = cubes.get(primaryCubeName)
      if (primaryCube) {
        analysis.preAggregations = this.analyzePreAggregations(
          cubes,
          primaryCube,
          cubesToJoin,
          query
        )
      }

      // Update summary
      const successfulPaths = analysis.joinPaths.filter(p => p.pathFound)
      const failedPaths = analysis.joinPaths.filter(p => !p.pathFound)

      analysis.querySummary.joinCount = successfulPaths.length
      analysis.querySummary.cteCount = analysis.preAggregations.length
      analysis.querySummary.hasPreAggregation = analysis.preAggregations.length > 0

      // Detect post-aggregation window functions in the query
      const allCubes = new Map<string, Cube>()
      for (const name of cubeNames) {
        const cube = cubes.get(name)
        if (cube) allCubes.set(name, cube)
      }
      const hasPostAggWindows = MeasureBuilder.hasPostAggregationWindows(
        query.measures || [],
        allCubes
      )
      analysis.querySummary.hasWindowFunctions = hasPostAggWindows

      if (analysis.preAggregations.length > 0) {
        analysis.querySummary.queryType = 'multi_cube_cte'
      } else {
        analysis.querySummary.queryType = 'multi_cube_join'
      }

      // Add warnings for failed paths
      for (const failedPath of failedPaths) {
        analysis.warnings!.push(
          `No join path found to cube '${failedPath.targetCube}'. Check that joins are defined correctly.`
        )
      }

      // Add info about post-aggregation window functions
      if (hasPostAggWindows) {
        analysis.warnings!.push(
          `Query contains post-aggregation window functions which will be applied to aggregated results.`
        )
      }
    }

    return analysis
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
    toCube: string
  ): JoinPathAnalysis {
    // Use the resolver for BFS path finding (cached, optimized)
    const resolver = this.getResolver(cubes)
    const internalPath = resolver.findPath(fromCube, toCube)

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
        visitedCubes
      }
    }

    // Convert internal path to analysis format
    const pathSteps: JoinPathStep[] = internalPath.map(step => {
      const joinType = getJoinType(step.joinDef.relationship, step.joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'

      const joinColumns = step.joinDef.on.map(joinOn => ({
        sourceColumn: joinOn.source.name,
        targetColumn: joinOn.target.name
      }))

      const result: JoinPathStep = {
        fromCube: step.fromCube,
        toCube: step.toCube,
        relationship: step.joinDef.relationship,
        joinType,
        joinColumns
      }

      // Add junction table info for belongsToMany
      if (step.joinDef.relationship === 'belongsToMany' && step.joinDef.through) {
        const through = step.joinDef.through
        result.junctionTable = {
          tableName: (through.table as any)[Symbol.for('drizzle:Name')] || 'junction_table',
          sourceColumns: through.sourceKey.map(k => k.target.name),
          targetColumns: through.targetKey.map(k => k.source.name)
        }
      }

      return result
    })

    return {
      targetCube: toCube,
      pathFound: true,
      path: pathSteps,
      pathLength: pathSteps.length,
      visitedCubes
    }
  }

  /**
   * Analyze pre-aggregation requirements for hasMany relationships
   * This mirrors the logic in planPreAggregationCTEs to ensure analysis matches execution
   */
  private analyzePreAggregations(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cubesToJoin: string[],
    query: SemanticQuery
  ): PreAggregationAnalysis[] {
    const preAggregations: PreAggregationAnalysis[] = []

    // No measures in query means no fan-out risk, no CTEs needed
    if (!query.measures || query.measures.length === 0) {
      return preAggregations
    }

    for (const targetCubeName of cubesToJoin) {
      const hasManyJoinDef = this.findHasManyJoinDef(primaryCube, targetCubeName)
      if (!hasManyJoinDef) {
        continue
      }

      const targetCube = cubes.get(targetCubeName)
      if (!targetCube) {
        continue
      }

      // Check if we have measures from this cube (from SELECT clause)
      const measuresFromSelect = query.measures.filter(m =>
        m.startsWith(targetCubeName + '.')
      )

      // Also check for measures referenced in filters (for HAVING clause)
      // Only actual measures are included - dimension filters don't trigger CTE creation
      const measuresFromFilters = this.extractMeasuresFromFilters(query, targetCube)

      // Combine and deduplicate measures from both SELECT and filters
      const allMeasuresFromThisCube = [...new Set([...measuresFromSelect, ...measuresFromFilters])]

      if (allMeasuresFromThisCube.length === 0) {
        continue
      }

      // Extract join keys
      const joinKeys = hasManyJoinDef.on.map(joinOn => ({
        sourceColumn: joinOn.source.name,
        targetColumn: joinOn.target.name
      }))

      // Categorize measures for post-aggregation window function handling
      const cubeMap = new Map([[targetCubeName, targetCube]])
      const { aggregateMeasures, postAggWindowMeasures, requiredBaseMeasures } = MeasureBuilder.categorizeForPostAggregation(
        allMeasuresFromThisCube,
        cubeMap
      )

      // Combine aggregate measures with base measures required by window functions
      const allAggregateMeasures = [...new Set([
        ...aggregateMeasures,
        ...Array.from(requiredBaseMeasures).filter(m => m.startsWith(targetCubeName + '.'))
      ])]

      // Create analysis for aggregate CTE if we have any aggregate measures
      if (allAggregateMeasures.length > 0) {
        const hasWindowDeps = postAggWindowMeasures.length > 0
        preAggregations.push({
          cubeName: targetCubeName,
          cteAlias: `${targetCubeName.toLowerCase()}_agg`,
          reason: hasWindowDeps
            ? `hasMany relationship from ${primaryCube.name} - requires pre-aggregation; includes base measures for post-aggregation window functions`
            : `hasMany relationship from ${primaryCube.name} - requires pre-aggregation to prevent row duplication (fan-out)`,
          measures: allAggregateMeasures,
          joinKeys,
          cteType: 'aggregate'
        })
      }

      // Note: Window CTEs are no longer created - post-aggregation windows are applied in outer query
    }

    return preAggregations
  }
}
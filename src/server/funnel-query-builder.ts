/**
 * Funnel Query Builder
 * Handles server-side funnel analysis with query-time flexibility
 * Generates SQL with CTEs for step-based conversion analysis
 *
 * REFACTORED: Now uses Drizzle's query builder pattern with $with() for CTEs
 * instead of raw SQL templates. This enables proper .toSQL() support for dry-run.
 */

import { sql, SQL, and, eq } from 'drizzle-orm'
import type { DatabaseAdapter } from './adapters/base-adapter'
import type {
  FunnelQueryConfig,
  FunnelStep,
  FunnelResultRow
} from './types/funnel'
import type {
  Cube,
  QueryContext,
  SemanticQuery,
  Filter,
  FilterCondition,
  LogicalFilter
} from './types'
import { resolveSqlExpression } from './cube-utils'
import { FilterBuilder } from './builders/filter-builder'
import { DateTimeBuilder } from './builders/date-time-builder'
import { JoinPathResolver } from './join-path-resolver'

/**
 * Info about a joined cube needed for cross-cube filtering
 */
interface JoinedCubeInfo {
  /** The target cube being joined */
  cube: Cube
  /** The join path from base cube to this cube */
  joinPath: Array<{ fromCube: string; toCube: string; joinDef: any }>
}

/**
 * Internal step resolution with resolved cube and SQL expressions
 */
interface ResolvedStep {
  name: string
  index: number
  cube: Cube
  bindingKeyExpr: SQL
  timeExpr: SQL
  filterConditions: SQL[]
  timeToConvert?: string
  /** Cubes that need to be JOINed for cross-cube filters */
  joinedCubes: JoinedCubeInfo[]
}

/**
 * Type for CTE objects created by db.$with()
 * These can be used with db.with(...ctes).select().from(cte)
 */
type WithSubquery = ReturnType<ReturnType<any['$with']>['as']>

export class FunnelQueryBuilder {
  private filterBuilder: FilterBuilder
  private dateTimeBuilder: DateTimeBuilder

  constructor(private databaseAdapter: DatabaseAdapter) {
    this.dateTimeBuilder = new DateTimeBuilder(databaseAdapter)
    this.filterBuilder = new FilterBuilder(databaseAdapter, this.dateTimeBuilder)
  }

  /**
   * Check if query contains funnel configuration
   */
  hasFunnel(query: SemanticQuery): boolean {
    return query.funnel !== undefined && query.funnel.steps.length >= 2
  }

  /**
   * Validate funnel configuration
   */
  validateConfig(
    config: FunnelQueryConfig,
    cubes: Map<string, Cube>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check minimum steps
    if (config.steps.length < 2) {
      errors.push('Funnel must have at least 2 steps')
    }

    // Validate binding key
    if (typeof config.bindingKey === 'string') {
      const [cubeName, dimName] = config.bindingKey.split('.')
      if (!cubeName || !dimName) {
        errors.push(`Invalid binding key format: ${config.bindingKey}. Expected 'CubeName.dimensionName'`)
      } else {
        const cube = cubes.get(cubeName)
        if (!cube) {
          errors.push(`Binding key cube not found: ${cubeName}`)
        } else if (!cube.dimensions?.[dimName]) {
          errors.push(`Binding key dimension not found: ${dimName} in cube ${cubeName}`)
        }
      }
    } else if (Array.isArray(config.bindingKey)) {
      for (const mapping of config.bindingKey) {
        const cube = cubes.get(mapping.cube)
        if (!cube) {
          errors.push(`Binding key mapping cube not found: ${mapping.cube}`)
        } else {
          const [, dimName] = mapping.dimension.split('.')
          if (!cube.dimensions?.[dimName]) {
            errors.push(`Binding key dimension not found: ${dimName} in cube ${mapping.cube}`)
          }
        }
      }
    }

    // Validate time dimension
    if (typeof config.timeDimension === 'string') {
      const [cubeName, dimName] = config.timeDimension.split('.')
      if (!cubeName || !dimName) {
        errors.push(`Invalid time dimension format: ${config.timeDimension}. Expected 'CubeName.dimensionName'`)
      } else {
        const cube = cubes.get(cubeName)
        if (!cube) {
          errors.push(`Time dimension cube not found: ${cubeName}`)
        } else if (!cube.dimensions?.[dimName]) {
          errors.push(`Time dimension not found: ${dimName} in cube ${cubeName}`)
        }
      }
    }

    // Validate steps
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i]

      if (!step.name) {
        errors.push(`Step ${i} must have a name`)
      }

      // For multi-cube steps, validate cube exists
      if ('cube' in step && step.cube) {
        const cube = cubes.get(step.cube)
        if (!cube) {
          errors.push(`Step ${i} cube not found: ${step.cube}`)
        }
      }

      // Validate filters reference valid dimensions (NOT measures)
      // Also validate join paths for cross-cube filters
      if (step.filter) {
        // Determine the step's cube for cross-cube validation
        let stepCubeName: string | undefined
        if ('cube' in step && step.cube) {
          stepCubeName = step.cube
        } else if (typeof config.bindingKey === 'string') {
          [stepCubeName] = config.bindingKey.split('.')
        }

        const resolver = stepCubeName ? new JoinPathResolver(cubes) : null

        const stepFilters = Array.isArray(step.filter) ? step.filter : [step.filter]
        for (const filter of stepFilters) {
          if ('member' in filter) {
            const [filterCubeName, filterField] = (filter as FilterCondition).member.split('.')
            const filterCube = cubes.get(filterCubeName)
            if (!filterCube) {
              errors.push(`Step ${i} filter cube not found: ${filterCubeName}`)
            } else {
              // Check if it's a dimension
              if (!filterCube.dimensions?.[filterField]) {
                // Check if it's a measure - provide helpful error message
                if (filterCube.measures?.[filterField]) {
                  errors.push(
                    `Step ${i} filter '${filterCubeName}.${filterField}' is a measure. ` +
                    `Funnel step filters only support dimensions, not measures.`
                  )
                } else {
                  errors.push(`Step ${i} filter member not found: ${filterField} in cube ${filterCubeName}`)
                }
              }

              // For cross-cube filters, validate that a join path exists
              if (stepCubeName && filterCubeName !== stepCubeName && resolver) {
                const joinPath = resolver.findPath(stepCubeName, filterCubeName)
                if (!joinPath || joinPath.length === 0) {
                  errors.push(
                    `Step ${i} filter '${filterCubeName}.${filterField}' requires a join from '${stepCubeName}' ` +
                    `but no join path was found. Define a join relationship between these cubes.`
                  )
                }
              }
            }
          }
        }
      }

      // Validate timeToConvert format (ISO 8601 duration)
      if (step.timeToConvert && i > 0) {
        const durationPattern = /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/
        if (!durationPattern.test(step.timeToConvert)) {
          errors.push(`Step ${i} timeToConvert must be ISO 8601 duration format: ${step.timeToConvert}`)
        }
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Build complete funnel query using Drizzle's query builder pattern
   *
   * Uses the industry-standard "sequential CTEs" pattern where each step
   * joins to the previous step CTE. This automatically enforces funnel
   * constraints (monotonically decreasing counts).
   *
   * Returns a Drizzle query builder that supports .toSQL() for dry-run
   * and can be executed directly for results.
   */
  buildFunnelQuery(
    config: FunnelQueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): ReturnType<typeof context.db.select> {
    // Resolve steps with their cube, expressions, and filters
    const resolvedSteps = this.resolveSteps(config, cubes, context)

    // Build step CTEs sequentially - each step references the previous
    // This is the key to the sequential funnel pattern
    const stepCTEs: WithSubquery[] = []
    for (let i = 0; i < resolvedSteps.length; i++) {
      const previousCTE = i > 0 ? stepCTEs[i - 1] : undefined
      stepCTEs.push(this.buildStepCTE(resolvedSteps[i], context, previousCTE))
    }

    // Build funnel results CTE that joins all steps for time metrics
    // (simpler than before - no CASE expressions needed)
    const resultsCTE = this.buildFunnelResultsCTE(stepCTEs, resolvedSteps, config, context)

    // Build aggregation CTE
    const aggCTE = this.buildAggregationCTE(resultsCTE, stepCTEs, resolvedSteps, config, context)

    // Chain all CTEs and build final query
    const allCTEs = [...stepCTEs, resultsCTE, aggCTE]

    return context.db
      .with(...allCTEs)
      .select()
      .from(aggCTE)
  }

  /**
   * Transform raw SQL result to FunnelResultRow[]
   */
  transformResult(
    rawResult: Record<string, unknown>[],
    config: FunnelQueryConfig
  ): FunnelResultRow[] {
    if (!rawResult || rawResult.length === 0) {
      return []
    }

    // The result is a single row with aggregated counts and time metrics
    const aggRow = rawResult[0]
    const results: FunnelResultRow[] = []
    const firstStepCount = Number(aggRow['step_0_count']) || 0

    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i]
      const count = Number(aggRow[`step_${i}_count`]) || 0
      const prevCount = i > 0 ? Number(aggRow[`step_${i - 1}_count`]) || 0 : 0

      const result: FunnelResultRow = {
        step: step.name,
        stepIndex: i,
        count,
        conversionRate: i === 0 ? null : (prevCount > 0 ? count / prevCount : 0),
        cumulativeConversionRate: firstStepCount > 0 ? count / firstStepCount : 0
      }

      // Add time metrics if requested
      if (config.includeTimeMetrics && i > 0) {
        result.avgSecondsToConvert = aggRow[`step_${i}_avg_seconds`] !== null
          ? Number(aggRow[`step_${i}_avg_seconds`])
          : null
        result.minSecondsToConvert = aggRow[`step_${i}_min_seconds`] !== null
          ? Number(aggRow[`step_${i}_min_seconds`])
          : null
        result.maxSecondsToConvert = aggRow[`step_${i}_max_seconds`] !== null
          ? Number(aggRow[`step_${i}_max_seconds`])
          : null

        // Median/P90 may be null for databases that don't support PERCENTILE_CONT
        if (aggRow[`step_${i}_median_seconds`] !== undefined) {
          result.medianSecondsToConvert = aggRow[`step_${i}_median_seconds`] !== null
            ? Number(aggRow[`step_${i}_median_seconds`])
            : null
        }
        if (aggRow[`step_${i}_p90_seconds`] !== undefined) {
          result.p90SecondsToConvert = aggRow[`step_${i}_p90_seconds`] !== null
            ? Number(aggRow[`step_${i}_p90_seconds`])
            : null
        }
      }

      results.push(result)
    }

    return results
  }

  /**
   * Extract cube names referenced in step filters
   */
  private extractFilterCubeNames(step: FunnelStep): Set<string> {
    const cubeNames = new Set<string>()

    if (!step.filter) return cubeNames

    const filters = Array.isArray(step.filter) ? step.filter : [step.filter]

    const extractFromFilter = (filter: Filter) => {
      // Handle logical filters
      if ('and' in filter && filter.and) {
        for (const subFilter of filter.and) {
          extractFromFilter(subFilter as Filter)
        }
      } else if ('or' in filter && filter.or) {
        for (const subFilter of filter.or) {
          extractFromFilter(subFilter as Filter)
        }
      } else if ('type' in filter && 'filters' in filter) {
        // Client format: { type: 'and' | 'or', filters: [...] }
        const groupFilter = filter as { type: string; filters: Filter[] }
        for (const subFilter of groupFilter.filters || []) {
          extractFromFilter(subFilter)
        }
      } else if ('member' in filter) {
        // Simple filter
        const [cubeName] = (filter as FilterCondition).member.split('.')
        cubeNames.add(cubeName)
      }
    }

    for (const filter of filters) {
      extractFromFilter(filter)
    }

    return cubeNames
  }

  /**
   * Resolve steps with their cube, SQL expressions, and filter conditions
   */
  private resolveSteps(
    config: FunnelQueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): ResolvedStep[] {
    const resolver = new JoinPathResolver(cubes)

    return config.steps.map((step, index) => {
      const cube = this.resolveCubeForStep(step, config, cubes)
      const bindingKeyExpr = this.resolveBindingKey(config, cube, context)
      const timeExpr = this.resolveTimeDimension(config, cube, context)
      const filterConditions = this.buildStepFilters(step, cube, cubes, context)

      // Find cubes that need to be JOINed for cross-cube filters
      const filterCubeNames = this.extractFilterCubeNames(step)
      const joinedCubes: JoinedCubeInfo[] = []

      for (const filterCubeName of filterCubeNames) {
        if (filterCubeName !== cube.name) {
          const filterCube = cubes.get(filterCubeName)
          if (filterCube) {
            const joinPath = resolver.findPath(cube.name, filterCubeName)
            if (joinPath && joinPath.length > 0) {
              joinedCubes.push({ cube: filterCube, joinPath })
            }
          }
        }
      }

      return {
        name: step.name,
        index,
        cube,
        bindingKeyExpr,
        timeExpr,
        filterConditions,
        timeToConvert: step.timeToConvert,
        joinedCubes
      }
    })
  }

  /**
   * Resolve the cube for a step
   */
  private resolveCubeForStep(
    step: FunnelStep,
    config: FunnelQueryConfig,
    cubes: Map<string, Cube>
  ): Cube {
    // Multi-cube step specifies cube directly
    if ('cube' in step && step.cube) {
      const cube = cubes.get(step.cube)
      if (!cube) {
        throw new Error(`Cube not found for step: ${step.cube}`)
      }
      return cube
    }

    // Single-cube funnel - derive cube from binding key
    if (typeof config.bindingKey === 'string') {
      const [cubeName] = config.bindingKey.split('.')
      const cube = cubes.get(cubeName)
      if (!cube) {
        throw new Error(`Cube not found for binding key: ${config.bindingKey}`)
      }
      return cube
    }

    throw new Error('Cannot resolve cube for step - multi-cube funnel requires cube specification in each step')
  }

  /**
   * Resolve binding key expression for a cube
   */
  private resolveBindingKey(
    config: FunnelQueryConfig,
    cube: Cube,
    context: QueryContext
  ): SQL {
    if (typeof config.bindingKey === 'string') {
      const [, dimName] = config.bindingKey.split('.')
      const dimension = cube.dimensions?.[dimName]
      if (!dimension) {
        throw new Error(`Binding key dimension not found: ${config.bindingKey}`)
      }
      return resolveSqlExpression(dimension.sql, context) as SQL
    }

    // Multi-cube binding key - find the mapping for this cube
    const mapping = config.bindingKey.find(m => m.cube === cube.name)
    if (!mapping) {
      throw new Error(`No binding key mapping found for cube: ${cube.name}`)
    }
    const [, dimName] = mapping.dimension.split('.')
    const dimension = cube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(`Binding key dimension not found: ${mapping.dimension}`)
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  /**
   * Resolve time dimension expression for a cube
   */
  private resolveTimeDimension(
    config: FunnelQueryConfig,
    cube: Cube,
    context: QueryContext
  ): SQL {
    if (typeof config.timeDimension === 'string') {
      const [, dimName] = config.timeDimension.split('.')
      const dimension = cube.dimensions?.[dimName]
      if (!dimension) {
        throw new Error(`Time dimension not found: ${config.timeDimension}`)
      }
      return resolveSqlExpression(dimension.sql, context) as SQL
    }

    // Multi-cube time dimension - find the mapping for this cube
    const mapping = config.timeDimension.find(m => m.cube === cube.name)
    if (!mapping) {
      throw new Error(`No time dimension mapping found for cube: ${cube.name}`)
    }
    const [, dimName] = mapping.dimension.split('.')
    const dimension = cube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(`Time dimension not found: ${mapping.dimension}`)
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  /**
   * Build filter conditions for a step
   * @param step - The funnel step
   * @param baseCube - The step's primary cube
   * @param cubes - All cubes available for cross-cube filtering
   * @param context - Query context with security context
   */
  private buildStepFilters(
    step: FunnelStep,
    baseCube: Cube,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL[] {
    if (!step.filter) {
      return []
    }

    const filters = Array.isArray(step.filter) ? step.filter : [step.filter]
    const conditions: SQL[] = []

    for (const filter of filters) {
      const condition = this.buildFilterCondition(filter, baseCube, cubes, context)
      if (condition) {
        conditions.push(condition)
      }
    }

    return conditions
  }

  /**
   * Build a single filter condition
   * @param filter - The filter to build
   * @param baseCube - The step's primary cube
   * @param cubes - All cubes available for cross-cube filtering
   * @param context - Query context with security context
   */
  private buildFilterCondition(
    filter: Filter,
    baseCube: Cube,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL | null {
    // Handle logical filters - support both server format ({ and: [...] }) and client format ({ type: 'and', filters: [...] })
    const isServerLogicalFilter = 'and' in filter || 'or' in filter
    const isClientGroupFilter = 'type' in filter && ('filters' in filter) && (filter.type === 'and' || filter.type === 'or')

    if (isServerLogicalFilter || isClientGroupFilter) {
      const subConditions: SQL[] = []
      let isAndFilter: boolean

      if (isClientGroupFilter) {
        // Client format: { type: 'and' | 'or', filters: [...] }
        const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
        isAndFilter = groupFilter.type === 'and'
        for (const subFilter of groupFilter.filters || []) {
          const condition = this.buildFilterCondition(subFilter, baseCube, cubes, context)
          if (condition) {
            subConditions.push(condition)
          }
        }
      } else {
        // Server format: { and: [...] } or { or: [...] }
        const logicalFilter = filter as LogicalFilter
        isAndFilter = 'and' in logicalFilter && !!logicalFilter.and
        const filterList = logicalFilter.and || logicalFilter.or || []
        for (const subFilter of filterList) {
          const condition = this.buildFilterCondition(subFilter, baseCube, cubes, context)
          if (condition) {
            subConditions.push(condition)
          }
        }
      }

      if (subConditions.length === 0) return null
      if (subConditions.length === 1) return subConditions[0]

      if (isAndFilter) {
        return and(...subConditions) as SQL
      } else {
        // OR conditions
        return sql`(${sql.join(subConditions, sql` OR `)})`
      }
    }

    // Handle simple filter condition
    const simpleFilter = filter as FilterCondition
    const [filterCubeName, dimName] = simpleFilter.member.split('.')

    // For date range filters with dateRange property, empty values is OK
    // The FilterBuilder handles dateRange properly
    const hasDateRange = simpleFilter.dateRange !== undefined
    const needsValues = simpleFilter.operator !== 'set' && simpleFilter.operator !== 'notSet' && !hasDateRange

    // Skip filters with empty or undefined values (except for set/notSet and dateRange filters)
    if (needsValues && (!simpleFilter.values || simpleFilter.values.length === 0 || simpleFilter.values[0] === undefined || simpleFilter.values[0] === '')) {
      return null
    }

    // Resolve the cube for the filter - support cross-cube filtering
    const filterCube = cubes.get(filterCubeName)
    if (!filterCube) {
      // Cube not found in available cubes
      return null
    }

    // If filtering on a different cube, check if join path exists
    if (filterCubeName !== baseCube.name) {
      const resolver = new JoinPathResolver(cubes)
      const joinPath = resolver.findPath(baseCube.name, filterCubeName)
      if (!joinPath || joinPath.length === 0) {
        // No join path exists - cannot filter on this cube
        console.warn(
          `Funnel filter: Cannot filter by '${filterCubeName}.${dimName}' in step using '${baseCube.name}'. ` +
          `No join path found. Filter will be skipped.`
        )
        return null
      }
      // Note: The actual JOIN for cross-cube filters is handled in buildStepCTE
    }

    const dimension = filterCube.dimensions?.[dimName]
    if (!dimension) return null

    const fieldExpr = resolveSqlExpression(dimension.sql, context)

    // Delegate to FilterBuilder which handles all filter operators including date ranges
    return this.filterBuilder.buildFilterCondition(
      fieldExpr,
      simpleFilter.operator,
      simpleFilter.values || [],
      dimension,
      simpleFilter.dateRange
    )
  }

  /**
   * Build CTE for a single step using Drizzle's $with() pattern
   *
   * For step 0 (entry point): queries raw data directly
   * For subsequent steps: joins to the previous step CTE to enforce sequential progression
   *
   * This implements the industry-standard "sequential CTEs" pattern where each step
   * only includes binding_keys that successfully completed the previous step.
   *
   * @param step - The resolved step configuration
   * @param context - Query context with security context
   * @param previousStepCTE - Reference to the previous step's CTE (undefined for step 0)
   */
  private buildStepCTE(
    step: ResolvedStep,
    context: QueryContext,
    previousStepCTE?: WithSubquery
  ): WithSubquery {
    if (step.index === 0) {
      // First step: query raw data (entry point)
      return this.buildFirstStepCTE(step, context)
    }

    // Subsequent steps: join to previous step CTE
    return this.buildSubsequentStepCTE(step, context, previousStepCTE!)
  }

  /**
   * Build CTE for the first step (step 0) - entry point
   *
   * Queries raw data directly with security context and step filters.
   * Gets the first occurrence per binding key.
   */
  private buildFirstStepCTE(
    step: ResolvedStep,
    context: QueryContext
  ): WithSubquery {
    const alias = `step_${step.index}`

    // Get cube base with security context
    const cubeBase = step.cube.sql(context)

    // Combine security context with step filters
    const whereConditions: SQL[] = []
    if (cubeBase.where) {
      whereConditions.push(cubeBase.where)
    }
    whereConditions.push(...step.filterConditions)

    // Build the step CTE query
    let stepQuery: any = context.db
      .select({
        binding_key: sql`${step.bindingKeyExpr}`.as('binding_key'),
        step_time: sql`MIN(${step.timeExpr})`.as('step_time')
      })
      .from(cubeBase.from)

    // Add JOINs for cross-cube filters
    stepQuery = this.addCrossJoinsToQuery(stepQuery, step, context, whereConditions)

    // Apply WHERE conditions
    if (whereConditions.length > 0) {
      const combinedWhere = whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions) as SQL
      stepQuery = stepQuery.where(combinedWhere)
    }

    // Group by binding key
    stepQuery = stepQuery.groupBy(step.bindingKeyExpr)

    return context.db.$with(alias).as(stepQuery)
  }

  /**
   * Build CTE for subsequent steps (step 1+) - joins to previous step
   *
   * This is the key to the sequential funnel pattern:
   * - INNER JOINs to the previous step CTE (only includes binding_keys that completed previous step)
   * - Applies temporal constraints (must occur after previous step)
   * - Applies step-specific filters and time-to-convert windows
   *
   * This automatically ensures monotonically decreasing counts.
   */
  private buildSubsequentStepCTE(
    step: ResolvedStep,
    context: QueryContext,
    previousStepCTE: WithSubquery
  ): WithSubquery {
    const alias = `step_${step.index}`
    const prevStepAlias = `step_${step.index - 1}`

    // Get cube base with security context
    const cubeBase = step.cube.sql(context)

    // Combine security context with step filters
    const whereConditions: SQL[] = []
    if (cubeBase.where) {
      whereConditions.push(cubeBase.where)
    }
    whereConditions.push(...step.filterConditions)

    // Temporal constraint: must occur after previous step
    // Reference the previous step by its CTE alias (step_0, step_1, etc.)
    const prevStepTimeRef = sql`${sql.identifier(prevStepAlias)}.step_time`
    let temporalConstraint: SQL = sql`${step.timeExpr} > ${prevStepTimeRef}`

    // Add time-to-convert window if specified
    if (step.timeToConvert) {
      const windowEnd = this.databaseAdapter.buildDateAddInterval(prevStepTimeRef, step.timeToConvert)
      temporalConstraint = sql`${temporalConstraint} AND ${step.timeExpr} <= ${windowEnd}`
    }
    whereConditions.push(temporalConstraint)

    // Build the step CTE query
    // INNER JOIN to previous step ensures only binding_keys that completed previous step are included
    // The CTE is referenced by its name (step_0, step_1, etc.)
    let stepQuery: any = context.db
      .select({
        binding_key: sql`${step.bindingKeyExpr}`.as('binding_key'),
        step_time: sql`MIN(${step.timeExpr})`.as('step_time')
      })
      .from(cubeBase.from)
      .innerJoin(
        previousStepCTE,
        sql`${step.bindingKeyExpr} = ${sql.identifier(prevStepAlias)}.binding_key`
      )

    // Add JOINs for cross-cube filters
    stepQuery = this.addCrossJoinsToQuery(stepQuery, step, context, whereConditions)

    // Apply WHERE conditions
    if (whereConditions.length > 0) {
      const combinedWhere = whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions) as SQL
      stepQuery = stepQuery.where(combinedWhere)
    }

    // Group by binding key
    stepQuery = stepQuery.groupBy(step.bindingKeyExpr)

    return context.db.$with(alias).as(stepQuery)
  }

  /**
   * Helper to add cross-cube JOINs to a step query
   * Extracted to avoid duplication between first and subsequent step methods
   */
  private addCrossJoinsToQuery(
    stepQuery: any,
    step: ResolvedStep,
    context: QueryContext,
    whereConditions: SQL[]
  ): any {
    if (step.joinedCubes.length === 0) {
      return stepQuery
    }

    for (const joinedCubeInfo of step.joinedCubes) {
      // For each step in the join path, add a JOIN
      for (const pathStep of joinedCubeInfo.joinPath) {
        const joinDef = pathStep.joinDef

        // Build the join condition from the joinDef.on array
        const joinConditions: SQL[] = []
        for (const onCondition of joinDef.on) {
          if (onCondition.as) {
            // Custom comparator
            joinConditions.push(onCondition.as(onCondition.source, onCondition.target))
          } else {
            // Default: equality
            joinConditions.push(eq(onCondition.source, onCondition.target) as SQL)
          }
        }

        const joinCondition = joinConditions.length === 1
          ? joinConditions[0]
          : and(...joinConditions) as SQL

        // Get the target cube's table
        const targetCube = joinedCubeInfo.cube
        const targetCubeBase = targetCube.sql(context)

        // Add LEFT JOIN
        stepQuery = stepQuery.leftJoin(targetCubeBase.from, joinCondition)

        // Add security context for the joined cube
        if (targetCubeBase.where) {
          whereConditions.push(targetCubeBase.where)
        }
      }
    }

    return stepQuery
  }

  /**
   * Build funnel results CTE that joins all step times for time metric calculation
   *
   * With the sequential CTE pattern, each step CTE already contains only the
   * binding_keys that successfully completed that step. This CTE simply joins
   * them together to enable time difference calculations.
   *
   * No CASE expressions needed - the temporal filtering is already done in each step CTE.
   */
  private buildFunnelResultsCTE(
    _stepCTEs: WithSubquery[],
    steps: ResolvedStep[],
    _config: FunnelQueryConfig,
    context: QueryContext
  ): WithSubquery {
    // Build SELECT fields - just the binding key and each step's time
    const selectFields: Record<string, SQL> = {
      binding_key: sql`s0.binding_key`,
      step_0_time: sql`s0.step_time`
    }

    // Add step times for subsequent steps
    for (let i = 1; i < steps.length; i++) {
      selectFields[`step_${i}_time`] = sql`s${sql.raw(String(i))}.step_time`
    }

    // Build FROM clause with LEFT JOINs
    // Start from step_0 and LEFT JOIN subsequent steps
    // We use LEFT JOIN so we keep all step_0 entries even if they didn't complete later steps
    let joinClause = sql`${sql.identifier('step_0')} s0`
    for (let i = 1; i < steps.length; i++) {
      joinClause = sql`${joinClause}
      LEFT JOIN ${sql.identifier(`step_${i}`)} s${sql.raw(String(i))} ON s0.binding_key = s${sql.raw(String(i))}.binding_key`
    }

    // Build complete SELECT statement
    const selectParts = Object.entries(selectFields).map(([alias, expr]) =>
      sql`${expr} AS ${sql.identifier(alias)}`
    )

    const joinQuery = sql`SELECT ${sql.join(selectParts, sql`, `)} FROM ${joinClause}`

    // Build explicit column references for the CTE select
    // This fixes DuckDB compatibility - using SELECT * loses column aliases in DuckDB
    const cteSelectFields: Record<string, any> = {
      binding_key: sql`binding_key`.as('binding_key'),
      step_0_time: sql`step_0_time`.as('step_0_time')
    }
    for (let i = 1; i < steps.length; i++) {
      cteSelectFields[`step_${i}_time`] = sql`${sql.identifier(`step_${i}_time`)}`.as(`step_${i}_time`)
    }

    // Wrap in Drizzle CTE with explicit column selection
    return context.db.$with('funnel_joined').as(
      context.db.select(cteSelectFields).from(sql`(${joinQuery}) as _inner`)
    )
  }

  /**
   * Build aggregation CTE with counts and optional time metrics
   *
   * OPTIMIZATION: Uses single-pass aggregation over funnel_joined CTE instead of
   * multiple scalar subqueries. This reduces table scans from 13+ to 1 for a typical
   * 3-step funnel with time metrics.
   *
   * - Step counts: COUNT(*) for step_0, COUNT(step_N_time) for subsequent steps
   * - Time metrics: Uses database-specific conditional aggregation (FILTER clause for
   *   PostgreSQL, CASE WHEN for MySQL/SQLite)
   * - Percentiles: Still use subqueries since PERCENTILE_CONT with FILTER is non-standard
   *
   * Important: All SQL fields must have explicit aliases via .as() for Drizzle
   * to properly reference them when selecting from the CTE
   */
  private buildAggregationCTE(
    funnelResultsCTE: WithSubquery,
    _stepCTEs: WithSubquery[],
    steps: ResolvedStep[],
    config: FunnelQueryConfig,
    context: QueryContext
  ): WithSubquery {
    // Build SELECT fields for single-pass aggregation over funnel_joined
    const selectFields: Record<string, any> = {}

    // Step counts using single-pass aggregation:
    // - step_0_count = COUNT(*) since funnel_joined contains all step_0 entries
    // - step_N_count = COUNT(step_N_time) counts non-NULL values (successful conversions)
    selectFields['step_0_count'] = sql`COUNT(*)`.as('step_0_count')
    for (let i = 1; i < steps.length; i++) {
      selectFields[`step_${i}_count`] = sql`COUNT(${sql.identifier(`step_${i}_time`)})`.as(`step_${i}_count`)
    }

    // Add time metrics if requested using conditional aggregation
    if (config.includeTimeMetrics) {
      for (let i = 1; i < steps.length; i++) {
        const currentStepTime = sql.identifier(`step_${i}_time`)
        const prevStepTime = sql.identifier(`step_${i - 1}_time`)

        // Time difference in seconds (only for rows where both times exist)
        const timeDiff = this.databaseAdapter.buildTimeDifferenceSeconds(
          sql`${currentStepTime}`,
          sql`${prevStepTime}`
        )

        // Condition for filtering: current step must be completed (non-NULL time)
        const condition = sql`${currentStepTime} IS NOT NULL`

        // Average time to convert using conditional aggregation (single-pass)
        selectFields[`step_${i}_avg_seconds`] = this.databaseAdapter
          .buildConditionalAggregation('avg', timeDiff, condition)
          .as(`step_${i}_avg_seconds`)

        // Min/Max time using conditional aggregation (single-pass)
        selectFields[`step_${i}_min_seconds`] = this.databaseAdapter
          .buildConditionalAggregation('min', timeDiff, condition)
          .as(`step_${i}_min_seconds`)
        selectFields[`step_${i}_max_seconds`] = this.databaseAdapter
          .buildConditionalAggregation('max', timeDiff, condition)
          .as(`step_${i}_max_seconds`)

        // Median (if supported) - keep subquery since PERCENTILE_CONT with FILTER is non-standard
        // Skip percentile subqueries for databases that don't support them (e.g., DuckDB)
        const capabilities = this.databaseAdapter.getCapabilities()
        const medianExpr = this.databaseAdapter.buildPercentile(timeDiff, 50)
        if (medianExpr && capabilities.supportsPercentileSubqueries) {
          selectFields[`step_${i}_median_seconds`] = sql`(SELECT ${medianExpr} FROM ${sql.identifier('funnel_joined')} WHERE ${currentStepTime} IS NOT NULL)`.as(`step_${i}_median_seconds`)
        }

        // P90 (if supported) - keep subquery since PERCENTILE_CONT with FILTER is non-standard
        const p90Expr = this.databaseAdapter.buildPercentile(timeDiff, 90)
        if (p90Expr && capabilities.supportsPercentileSubqueries) {
          selectFields[`step_${i}_p90_seconds`] = sql`(SELECT ${p90Expr} FROM ${sql.identifier('funnel_joined')} WHERE ${currentStepTime} IS NOT NULL)`.as(`step_${i}_p90_seconds`)
        }
      }
    }

    // Build aggregation query from funnel_joined CTE (single-pass)
    const aggQuery = context.db
      .select(selectFields)
      .from(funnelResultsCTE)

    return context.db.$with('funnel_metrics').as(aggQuery)
  }
}

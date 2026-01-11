/**
 * Flow Query Builder
 * Handles server-side bidirectional flow analysis with Sankey diagram output
 * Generates SQL with CTEs for exploring paths BEFORE and AFTER a starting step
 *
 * Uses a multi-CTE strategy:
 * 1. starting_entities - Find entities matching the starting step
 * 2. before_step_N - For each depth, find the Nth event before starting point
 * 3. after_step_N - For each depth, find the Nth event after starting point
 * 4. nodes_aggregation - Count unique nodes per layer
 * 5. links_aggregation - Count transitions between adjacent nodes
 *
 * Built using Drizzle's query builder pattern for type safety and consistency.
 */

import { sql, SQL, and } from 'drizzle-orm'
import type { DatabaseAdapter } from './adapters/base-adapter'
import type {
  FlowQueryConfig,
  FlowResultRow,
  SankeyNode,
  SankeyLink,
  FlowValidationResult,
} from './types/flow'
import type {
  Cube,
  QueryContext,
  SemanticQuery,
  Filter,
  FilterCondition,
  LogicalFilter,
} from './types'
import { resolveSqlExpression } from './cube-utils'
import { FilterBuilder } from './builders/filter-builder'
import { DateTimeBuilder } from './builders/date-time-builder'

/**
 * Type for CTE objects created by db.$with()
 */
type WithSubquery = ReturnType<ReturnType<any['$with']>['as']>

/**
 * Resolved flow configuration with SQL expressions
 */
interface ResolvedFlowConfig {
  cube: Cube
  cubeBase: { from: any; where?: SQL }
  bindingKeyExpr: SQL
  timeExpr: SQL
  eventExpr: SQL
  startingStepFilters: SQL[]
}

export class FlowQueryBuilder {
  private filterBuilder: FilterBuilder
  private dateTimeBuilder: DateTimeBuilder
  private databaseAdapter: DatabaseAdapter

  constructor(databaseAdapter: DatabaseAdapter) {
    this.databaseAdapter = databaseAdapter
    this.dateTimeBuilder = new DateTimeBuilder(databaseAdapter)
    this.filterBuilder = new FilterBuilder(databaseAdapter, this.dateTimeBuilder)
  }

  /**
   * Check if query contains flow configuration
   */
  hasFlow(query: SemanticQuery): boolean {
    return (
      query.flow !== undefined &&
      query.flow.startingStep !== undefined &&
      query.flow.eventDimension !== undefined
    )
  }

  /**
   * Validate flow configuration
   */
  validateConfig(
    config: FlowQueryConfig,
    cubes: Map<string, Cube>
  ): FlowValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const engine = this.databaseAdapter.getEngineType()
    const supportsLateral = this.databaseAdapter.supportsLateralJoins()

    if (engine === 'sqlite') {
      errors.push(
        'Flow queries are not supported on SQLite. Use PostgreSQL or MySQL for flow analysis.'
      )
      return { isValid: false, errors, warnings }
    }

    // Validate binding key
    if (typeof config.bindingKey === 'string') {
      const [cubeName, dimName] = config.bindingKey.split('.')
      if (!cubeName || !dimName) {
        errors.push(
          `Invalid binding key format: ${config.bindingKey}. Expected 'CubeName.dimensionName'`
        )
      } else {
        const cube = cubes.get(cubeName)
        if (!cube) {
          errors.push(`Binding key cube not found: ${cubeName}`)
        } else if (!cube.dimensions?.[dimName]) {
          errors.push(
            `Binding key dimension not found: ${dimName} in cube ${cubeName}`
          )
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
            errors.push(
              `Binding key dimension not found: ${dimName} in cube ${mapping.cube}`
            )
          }
        }
      }
    }

    // Validate time dimension
    if (typeof config.timeDimension === 'string') {
      const [cubeName, dimName] = config.timeDimension.split('.')
      if (!cubeName || !dimName) {
        errors.push(
          `Invalid time dimension format: ${config.timeDimension}. Expected 'CubeName.dimensionName'`
        )
      } else {
        const cube = cubes.get(cubeName)
        if (!cube) {
          errors.push(`Time dimension cube not found: ${cubeName}`)
        } else if (!cube.dimensions?.[dimName]) {
          errors.push(`Time dimension not found: ${dimName} in cube ${cubeName}`)
        }
      }
    }

    // Validate event dimension
    if (config.eventDimension) {
      const [cubeName, dimName] = config.eventDimension.split('.')
      if (!cubeName || !dimName) {
        errors.push(
          `Invalid event dimension format: ${config.eventDimension}. Expected 'CubeName.dimensionName'`
        )
      } else {
        const cube = cubes.get(cubeName)
        if (!cube) {
          errors.push(`Event dimension cube not found: ${cubeName}`)
        } else if (!cube.dimensions?.[dimName]) {
          errors.push(
            `Event dimension not found: ${dimName} in cube ${cubeName}`
          )
        }
      }
    } else {
      errors.push('Event dimension is required for flow analysis')
    }

    // Validate starting step
    if (!config.startingStep) {
      errors.push('Starting step is required for flow analysis')
    } else {
      if (!config.startingStep.filter) {
        errors.push('Starting step must have at least one filter')
      }
      if (!config.startingStep.name) {
        warnings.push('Starting step has no name - using default')
      }
    }

    // Validate depth bounds
    if (config.stepsBefore < 0 || config.stepsBefore > 5) {
      errors.push(`stepsBefore must be between 0 and 5, got: ${config.stepsBefore}`)
    }
    if (config.stepsAfter < 0 || config.stepsAfter > 5) {
      errors.push(`stepsAfter must be between 0 and 5, got: ${config.stepsAfter}`)
    }

    // Performance warnings for high depth
    if (config.stepsBefore >= 4 || config.stepsAfter >= 4) {
      warnings.push(
        'High step depth (4-5) may impact query performance on large datasets'
      )
    }

    // Validate join strategy
    if (
      config.joinStrategy &&
      !['auto', 'lateral', 'window'].includes(config.joinStrategy)
    ) {
      errors.push(`Invalid joinStrategy: ${config.joinStrategy}`)
    } else if (config.joinStrategy === 'lateral' && !supportsLateral) {
      errors.push('Lateral joins are not supported on this database')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Build complete flow query using Drizzle's query builder pattern
   *
   * Creates a series of CTEs to:
   * 1. Find entities at the starting step
   * 2. Walk backwards N steps to find preceding events
   * 3. Walk forwards N steps to find following events
   * 4. Aggregate into nodes and links for Sankey visualization
   */
  buildFlowQuery(
    config: FlowQueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): ReturnType<typeof context.db.select> {
    const engine = this.databaseAdapter.getEngineType()
    if (engine === 'sqlite') {
      throw new Error(
        'Flow queries are not supported on SQLite. Use PostgreSQL or MySQL for flow analysis.'
      )
    }
    const supportsLateral = this.databaseAdapter.supportsLateralJoins()
    const joinStrategy = config.joinStrategy ?? 'auto'
    const useLateral =
      joinStrategy === 'lateral' || (joinStrategy === 'auto' && supportsLateral)

    if (joinStrategy === 'lateral' && !supportsLateral) {
      throw new Error('Lateral joins are not supported on this database')
    }

    // Normalize config for execution
    const effectiveConfig: FlowQueryConfig = {
      ...config,
      stepsBefore: config.outputMode === 'sunburst' ? 0 : config.stepsBefore,
    }

    // Resolve all expressions once
    const resolved = this.resolveFlowConfig(effectiveConfig, cubes, context)

    // Build all CTEs
    const ctes: WithSubquery[] = []

    // 1. Starting entities CTE - finds entities matching the starting step
    const startingEntitiesCTE = this.buildStartingEntitiesCTE(effectiveConfig, resolved, context)
    ctes.push(startingEntitiesCTE)

    // 2. Before step CTEs - walk backwards from starting step
    const beforeCTEs = useLateral
      ? this.buildBeforeCTEsLateral(effectiveConfig, resolved, context)
      : this.buildBeforeCTEsWindow(effectiveConfig, resolved, context)
    ctes.push(...beforeCTEs)

    // 3. After step CTEs - walk forwards from starting step
    const afterCTEs = useLateral
      ? this.buildAfterCTEsLateral(effectiveConfig, resolved, context)
      : this.buildAfterCTEsWindow(effectiveConfig, resolved, context)
    ctes.push(...afterCTEs)

    // 4. Nodes aggregation CTE - count entities per (layer, event_type)
    const nodesAggCTE = this.buildNodesAggregationCTE(effectiveConfig, context)
    ctes.push(nodesAggCTE)

    // 5. Links aggregation CTE - count transitions between layers
    const linksAggCTE = this.buildLinksAggregationCTE(effectiveConfig, context)
    ctes.push(linksAggCTE)

    // 6. Final result CTE - combine nodes and links
    const finalCTE = this.buildFinalResultCTE(context)
    ctes.push(finalCTE)

    // Chain all CTEs and select from final result
    return context.db.with(...ctes).select().from(finalCTE)
  }

  /**
   * Transform raw SQL result to FlowResultRow
   * The raw result contains rows with record_type = 'node' or 'link'
   */
  transformResult(rawResult: Record<string, unknown>[]): FlowResultRow {
    if (!rawResult || rawResult.length === 0) {
      return { nodes: [], links: [] }
    }

    const nodes: SankeyNode[] = []
    const links: SankeyLink[] = []

    for (const row of rawResult) {
      const recordType = row.record_type as string

      if (recordType === 'node') {
        nodes.push({
          id: String(row.id),
          name: String(row.name),
          layer: Number(row.layer),
          value: Number(row.value),
        })
      } else if (recordType === 'link') {
        links.push({
          source: String(row.source_id),
          target: String(row.target_id),
          value: Number(row.value),
        })
      }
    }

    // Sort nodes by layer for consistent Sankey rendering
    nodes.sort((a, b) => a.layer - b.layer)

    return { nodes, links }
  }

  // ============================================================================
  // Private: Resolution Methods
  // ============================================================================

  /**
   * Resolve flow configuration to SQL expressions
   */
  private resolveFlowConfig(
    config: FlowQueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): ResolvedFlowConfig {
    const cube = this.resolveCube(config, cubes)
    const cubeBase = cube.sql(context)

    return {
      cube,
      cubeBase,
      bindingKeyExpr: this.resolveBindingKey(config, cube, context),
      timeExpr: this.resolveTimeDimension(config, cube, context),
      eventExpr: this.resolveEventDimension(config, cube, context),
      startingStepFilters: this.buildStartingStepFilters(config, cube, context),
    }
  }

  /**
   * Resolve the cube for flow analysis
   */
  private resolveCube(config: FlowQueryConfig, cubes: Map<string, Cube>): Cube {
    let cubeName: string

    if (typeof config.bindingKey === 'string') {
      ;[cubeName] = config.bindingKey.split('.')
    } else if (Array.isArray(config.bindingKey) && config.bindingKey.length > 0) {
      cubeName = config.bindingKey[0].cube
    } else {
      throw new Error('Cannot resolve cube for flow query')
    }

    const cube = cubes.get(cubeName)
    if (!cube) {
      throw new Error(`Cube not found: ${cubeName}`)
    }
    return cube
  }

  /**
   * Resolve binding key expression
   */
  private resolveBindingKey(
    config: FlowQueryConfig,
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

    const mapping = config.bindingKey.find((m) => m.cube === cube.name)
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
   * Resolve time dimension expression
   */
  private resolveTimeDimension(
    config: FlowQueryConfig,
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

    const mapping = config.timeDimension.find((m) => m.cube === cube.name)
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
   * Resolve event dimension expression
   */
  private resolveEventDimension(
    config: FlowQueryConfig,
    cube: Cube,
    context: QueryContext
  ): SQL {
    const [, dimName] = config.eventDimension.split('.')
    const dimension = cube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(`Event dimension not found: ${config.eventDimension}`)
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  /**
   * Build filter conditions for the starting step
   */
  private buildStartingStepFilters(
    config: FlowQueryConfig,
    cube: Cube,
    context: QueryContext
  ): SQL[] {
    if (!config.startingStep.filter) {
      return []
    }

    const filters = Array.isArray(config.startingStep.filter)
      ? config.startingStep.filter
      : [config.startingStep.filter]

    const conditions: SQL[] = []

    for (const filter of filters) {
      const condition = this.buildFilterCondition(filter, cube, context)
      if (condition) {
        conditions.push(condition)
      }
    }

    return conditions
  }

  /**
   * Build a single filter condition
   */
  private buildFilterCondition(
    filter: Filter,
    cube: Cube,
    context: QueryContext
  ): SQL | null {
    // Handle logical filters (AND/OR)
    if ('and' in filter || 'or' in filter) {
      const logicalFilter = filter as LogicalFilter
      const subConditions: SQL[] = []
      const filterList = logicalFilter.and || logicalFilter.or || []

      for (const subFilter of filterList) {
        const condition = this.buildFilterCondition(subFilter, cube, context)
        if (condition) {
          subConditions.push(condition)
        }
      }

      if (subConditions.length === 0) return null
      if (subConditions.length === 1) return subConditions[0]

      if ('and' in filter) {
        return and(...subConditions) as SQL
      } else {
        return sql`(${sql.join(subConditions, sql` OR `)})`
      }
    }

    // Handle client-style group filters
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const subConditions: SQL[] = []

      for (const subFilter of groupFilter.filters || []) {
        const condition = this.buildFilterCondition(subFilter, cube, context)
        if (condition) {
          subConditions.push(condition)
        }
      }

      if (subConditions.length === 0) return null
      if (subConditions.length === 1) return subConditions[0]

      if (groupFilter.type === 'and') {
        return and(...subConditions) as SQL
      } else {
        return sql`(${sql.join(subConditions, sql` OR `)})`
      }
    }

    // Handle simple filter condition
    const simpleFilter = filter as FilterCondition
    const [, dimName] = simpleFilter.member.split('.')

    const dimension = cube.dimensions?.[dimName]
    if (!dimension) return null

    const fieldExpr = resolveSqlExpression(dimension.sql, context)

    return this.filterBuilder.buildFilterCondition(
      fieldExpr,
      simpleFilter.operator,
      simpleFilter.values || [],
      dimension,
      simpleFilter.dateRange
    )
  }

  // ============================================================================
  // Private: CTE Builder Methods
  // ============================================================================

  /**
   * Build the starting entities CTE
   * Finds all entities matching the starting step filter with their start time and event type
   * For sunburst mode, also initializes event_path with the starting event type
   */
  private buildStartingEntitiesCTE(
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr, startingStepFilters } = resolved

    // Build WHERE conditions: security context + starting step filters
    const whereConditions: SQL[] = []
    if (cubeBase.where) {
      whereConditions.push(cubeBase.where)
    }
    whereConditions.push(...startingStepFilters)

    // Build query using Drizzle's select pattern
    // Include event_path for sunburst mode - initialized to just the event_type
    let query = context.db
      .select({
        binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
        start_time: sql`MIN(${timeExpr})`.as('start_time'),
        event_type: sql`${eventExpr}`.as('event_type'),
        // event_path starts as just the event_type at layer 0
        event_path: sql`${eventExpr}`.as('event_path'),
      })
      .from(cubeBase.from)

    // Apply WHERE conditions
    if (whereConditions.length > 0) {
      const combinedWhere =
        whereConditions.length === 1
          ? whereConditions[0]
          : (and(...whereConditions) as SQL)
      query = query.where(combinedWhere)
    }

    // Group by binding key and event type
    query = query.groupBy(bindingKeyExpr, eventExpr)

    // Apply entity limit if specified
    if (config.entityLimit) {
      query = query.limit(config.entityLimit)
    }

    return context.db.$with('starting_entities').as(query)
  }

  /**
   * Build CTEs for steps BEFORE the starting point using LATERAL joins
   * Uses ORDER BY ... DESC LIMIT 1 to fetch immediate predecessor via index
   */
  private buildBeforeCTEsLateral(
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery[] {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr } = resolved
    const ctes: WithSubquery[] = []
    const isSunburst = config.outputMode === 'sunburst'

    for (let depth = 1; depth <= config.stepsBefore; depth++) {
      const prevAlias = depth === 1 ? 'starting_entities' : `before_step_${depth - 1}`
      const prevTimeColumn = depth === 1 ? 'start_time' : 'step_time'
      const alias = `before_step_${depth}`

      const whereConditions: SQL[] = []
      if (cubeBase.where) {
        whereConditions.push(cubeBase.where)
      }
      whereConditions.push(
        sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`,
        sql`${timeExpr} < ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`
      )
      const combinedWhere =
        whereConditions.length === 1
          ? whereConditions[0]
          : (and(...whereConditions) as SQL)

      const eventPathExpr = isSunburst
        ? sql`${eventExpr} || ${'→'} || ${sql.identifier(prevAlias)}.event_path`
        : sql`${eventExpr}`

      const lateralSubquery = context.db
        .select({
          binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
          step_time: sql`${timeExpr}`.as('step_time'),
          event_type: sql`${eventExpr}`.as('event_type'),
          event_path: eventPathExpr.as('event_path'),
        })
        .from(cubeBase.from)
        .where(combinedWhere)
        .orderBy(sql`${timeExpr} DESC`)
        .limit(1)

      const cte = context.db.$with(alias).as(
        context.db
          .select({
            binding_key: sql`e.binding_key`.as('binding_key'),
            step_time: sql`e.step_time`.as('step_time'),
            event_type: sql`e.event_type`.as('event_type'),
            event_path: sql`e.event_path`.as('event_path'),
          })
          .from(sql`${sql.identifier(prevAlias)}`)
          .crossJoinLateral(lateralSubquery.as('e'))
      )

      ctes.push(cte)
    }

    return ctes
  }

  /**
   * Build CTEs for steps AFTER the starting point using LATERAL joins
   * Uses ORDER BY ... ASC LIMIT 1 to fetch immediate successor via index
   */
  private buildAfterCTEsLateral(
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery[] {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr } = resolved
    const ctes: WithSubquery[] = []
    const isSunburst = config.outputMode === 'sunburst'

    for (let depth = 1; depth <= config.stepsAfter; depth++) {
      const prevAlias = depth === 1 ? 'starting_entities' : `after_step_${depth - 1}`
      const prevTimeColumn = depth === 1 ? 'start_time' : 'step_time'
      const alias = `after_step_${depth}`

      const whereConditions: SQL[] = []
      if (cubeBase.where) {
        whereConditions.push(cubeBase.where)
      }
      whereConditions.push(
        sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`,
        sql`${timeExpr} > ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`
      )
      const combinedWhere =
        whereConditions.length === 1
          ? whereConditions[0]
          : (and(...whereConditions) as SQL)

      const eventPathExpr = isSunburst
        ? sql`${sql.identifier(prevAlias)}.event_path || ${'→'} || ${eventExpr}`
        : sql`${eventExpr}`

      const lateralSubquery = context.db
        .select({
          binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
          step_time: sql`${timeExpr}`.as('step_time'),
          event_type: sql`${eventExpr}`.as('event_type'),
          event_path: eventPathExpr.as('event_path'),
        })
        .from(cubeBase.from)
        .where(combinedWhere)
        .orderBy(sql`${timeExpr} ASC`)
        .limit(1)

      const cte = context.db.$with(alias).as(
        context.db
          .select({
            binding_key: sql`e.binding_key`.as('binding_key'),
            step_time: sql`e.step_time`.as('step_time'),
            event_type: sql`e.event_type`.as('event_type'),
            event_path: sql`e.event_path`.as('event_path'),
          })
          .from(sql`${sql.identifier(prevAlias)}`)
          .crossJoinLateral(lateralSubquery.as('e'))
      )

      ctes.push(cte)
    }

    return ctes
  }

  /**
   * Build CTEs for steps BEFORE the starting point
   * Each CTE finds the immediate predecessor event for entities from the previous CTE
   *
   * Uses ROW_NUMBER() window function to get exactly the Nth previous event
   * For sunburst mode, accumulates event_path by prepending to previous path
   */
  private buildBeforeCTEsWindow(
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery[] {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr } = resolved
    const ctes: WithSubquery[] = []
    const isSunburst = config.outputMode === 'sunburst'

    for (let depth = 1; depth <= config.stepsBefore; depth++) {
      const prevAlias = depth === 1 ? 'starting_entities' : `before_step_${depth - 1}`
      const prevTimeColumn = depth === 1 ? 'start_time' : 'step_time'
      const alias = `before_step_${depth}`

      // Build WHERE conditions
      const whereConditions: SQL[] = []
      if (cubeBase.where) {
        whereConditions.push(cubeBase.where)
      }

      // Time constraint: event must be BEFORE the reference time
      whereConditions.push(
        sql`${timeExpr} < ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`
      )

      const combinedWhere =
        whereConditions.length === 1
          ? whereConditions[0]
          : (and(...whereConditions) as SQL)

      // Build event_path expression for sunburst mode
      // For before steps, prepend current event to previous path (reverse order)
      const eventPathExpr = isSunburst
        ? sql`${eventExpr} || ${'→'} || ${sql.identifier(prevAlias)}.event_path`
        : sql`${eventExpr}` // For sankey mode, just use event_type as path

      // Build the CTE using a subquery with ROW_NUMBER window function
      // ROW_NUMBER() OVER (PARTITION BY binding_key ORDER BY time DESC) gives us the Nth previous event
      const rankedQuery = context.db
        .select({
          binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
          step_time: sql`${timeExpr}`.as('step_time'),
          event_type: sql`${eventExpr}`.as('event_type'),
          event_path: eventPathExpr.as('event_path'),
          rn: sql`ROW_NUMBER() OVER (PARTITION BY ${bindingKeyExpr} ORDER BY ${timeExpr} DESC)`.as('rn'),
        })
        .from(cubeBase.from)
        .innerJoin(
          sql`${sql.identifier(prevAlias)}`,
          sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`
        )
        .where(combinedWhere)

      // Wrap to filter for rn = 1 (immediate predecessor)
      const filteredQuery = context.db
        .select({
          binding_key: sql`binding_key`.as('binding_key'),
          step_time: sql`step_time`.as('step_time'),
          event_type: sql`event_type`.as('event_type'),
          event_path: sql`event_path`.as('event_path'),
        })
        .from(rankedQuery.as('ranked'))
        .where(sql`rn = 1`)

      ctes.push(context.db.$with(alias).as(filteredQuery))
    }

    return ctes
  }

  /**
   * Build CTEs for steps AFTER the starting point
   * Each CTE finds the immediate successor event for entities from the previous CTE
   *
   * Uses ROW_NUMBER() window function to get exactly the Nth following event
   * For sunburst mode, accumulates event_path by concatenating with previous path
   */
  private buildAfterCTEsWindow(
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery[] {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr } = resolved
    const ctes: WithSubquery[] = []
    const isSunburst = config.outputMode === 'sunburst'

    for (let depth = 1; depth <= config.stepsAfter; depth++) {
      const prevAlias = depth === 1 ? 'starting_entities' : `after_step_${depth - 1}`
      const prevTimeColumn = depth === 1 ? 'start_time' : 'step_time'
      const alias = `after_step_${depth}`

      // Build WHERE conditions
      const whereConditions: SQL[] = []
      if (cubeBase.where) {
        whereConditions.push(cubeBase.where)
      }

      // Time constraint: event must be AFTER the reference time
      whereConditions.push(
        sql`${timeExpr} > ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`
      )

      const combinedWhere =
        whereConditions.length === 1
          ? whereConditions[0]
          : (and(...whereConditions) as SQL)

      // Build event_path expression for sunburst mode
      // Concatenates previous path with current event type using arrow separator
      const eventPathExpr = isSunburst
        ? sql`${sql.identifier(prevAlias)}.event_path || ${'→'} || ${eventExpr}`
        : sql`${eventExpr}` // For sankey mode, just use event_type as path

      // Build the CTE using a subquery with ROW_NUMBER window function
      // ROW_NUMBER() OVER (PARTITION BY binding_key ORDER BY time ASC) gives us the Nth following event
      const rankedQuery = context.db
        .select({
          binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
          step_time: sql`${timeExpr}`.as('step_time'),
          event_type: sql`${eventExpr}`.as('event_type'),
          event_path: eventPathExpr.as('event_path'),
          rn: sql`ROW_NUMBER() OVER (PARTITION BY ${bindingKeyExpr} ORDER BY ${timeExpr} ASC)`.as('rn'),
        })
        .from(cubeBase.from)
        .innerJoin(
          sql`${sql.identifier(prevAlias)}`,
          sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`
        )
        .where(combinedWhere)

      // Wrap to filter for rn = 1 (immediate successor)
      const filteredQuery = context.db
        .select({
          binding_key: sql`binding_key`.as('binding_key'),
          step_time: sql`step_time`.as('step_time'),
          event_type: sql`event_type`.as('event_type'),
          event_path: sql`event_path`.as('event_path'),
        })
        .from(rankedQuery.as('ranked'))
        .where(sql`rn = 1`)

      ctes.push(context.db.$with(alias).as(filteredQuery))
    }

    return ctes
  }

  /**
   * Build the nodes aggregation CTE
   * Aggregates counts per (layer, event_type) combination using UNION ALL
   * For sunburst mode, aggregates by event_path for unique tree branches
   */
  private buildNodesAggregationCTE(
    config: FlowQueryConfig,
    context: QueryContext
  ): WithSubquery {
    // Build UNION ALL of counts from all layers
    const unionParts: SQL[] = []
    const isSunburst = config.outputMode === 'sunburst'

    // Before steps (negative layers, furthest first)
    for (let depth = config.stepsBefore; depth >= 1; depth--) {
      const layer = -depth
      const alias = `before_step_${depth}`
      if (isSunburst) {
        // Sunburst: Group by event_path for unique branches
        unionParts.push(sql`
          SELECT
            ${'before_' + depth + '_'} || event_path AS node_id,
            event_type AS name,
            ${sql.raw(String(layer))} AS layer,
            COUNT(*) AS value
          FROM ${sql.identifier(alias)}
          GROUP BY event_path, event_type
        `)
      } else {
        // Sankey: Group by event_type (paths can converge)
        unionParts.push(sql`
          SELECT
            ${'before_' + depth + '_'} || event_type AS node_id,
            event_type AS name,
            ${sql.raw(String(layer))} AS layer,
            COUNT(*) AS value
          FROM ${sql.identifier(alias)}
          GROUP BY event_type
        `)
      }
    }

    // Starting step (layer 0) - same for both modes since it's the root
    unionParts.push(sql`
      SELECT
        ${'start_'} || event_type AS node_id,
        event_type AS name,
        0 AS layer,
        COUNT(*) AS value
      FROM starting_entities
      GROUP BY event_type
    `)

    // After steps (positive layers)
    for (let depth = 1; depth <= config.stepsAfter; depth++) {
      const layer = depth
      const alias = `after_step_${depth}`
      if (isSunburst) {
        // Sunburst: Group by event_path for unique branches
        unionParts.push(sql`
          SELECT
            ${'after_' + depth + '_'} || event_path AS node_id,
            event_type AS name,
            ${sql.raw(String(layer))} AS layer,
            COUNT(*) AS value
          FROM ${sql.identifier(alias)}
          GROUP BY event_path, event_type
        `)
      } else {
        // Sankey: Group by event_type (paths can converge)
        unionParts.push(sql`
          SELECT
            ${'after_' + depth + '_'} || event_type AS node_id,
            event_type AS name,
            ${sql.raw(String(layer))} AS layer,
            COUNT(*) AS value
          FROM ${sql.identifier(alias)}
          GROUP BY event_type
        `)
      }
    }

    const unionQuery = sql.join(unionParts, sql` UNION ALL `)

    const query = context.db
      .select({
        node_id: sql`node_id`.as('node_id'),
        name: sql`name`.as('name'),
        layer: sql`layer`.as('layer'),
        value: sql`value`.as('value'),
      })
      .from(sql`(${unionQuery}) AS nodes_union`)

    return context.db.$with('nodes_agg').as(query)
  }

  /**
   * Build the links aggregation CTE
   * Counts transitions between adjacent layers
   * For sunburst mode, uses event_path for unique branch identification
   */
  private buildLinksAggregationCTE(
    config: FlowQueryConfig,
    context: QueryContext
  ): WithSubquery {
    const linkParts: SQL[] = []
    const isSunburst = config.outputMode === 'sunburst'

    // Links between before steps (towards start)
    for (let depth = config.stepsBefore; depth >= 2; depth--) {
      const fromAlias = `before_step_${depth}`
      const toAlias = `before_step_${depth - 1}`

      if (isSunburst) {
        // Sunburst: Use event_path for unique branches
        linkParts.push(sql`
          SELECT
            ${'before_' + depth + '_'} || f.event_path AS source_id,
            ${'before_' + (depth - 1) + '_'} || t.event_path AS target_id,
            COUNT(*) AS value
          FROM ${sql.identifier(fromAlias)} f
          INNER JOIN ${sql.identifier(toAlias)} t ON f.binding_key = t.binding_key
          GROUP BY f.event_path, t.event_path
        `)
      } else {
        // Sankey: Use event_type (paths can converge)
        linkParts.push(sql`
          SELECT
            ${'before_' + depth + '_'} || f.event_type AS source_id,
            ${'before_' + (depth - 1) + '_'} || t.event_type AS target_id,
            COUNT(*) AS value
          FROM ${sql.identifier(fromAlias)} f
          INNER JOIN ${sql.identifier(toAlias)} t ON f.binding_key = t.binding_key
          GROUP BY f.event_type, t.event_type
        `)
      }
    }

    // Link from before_step_1 to start
    if (config.stepsBefore >= 1) {
      if (isSunburst) {
        linkParts.push(sql`
          SELECT
            ${'before_1_'} || b.event_path AS source_id,
            ${'start_'} || s.event_type AS target_id,
            COUNT(*) AS value
          FROM before_step_1 b
          INNER JOIN starting_entities s ON b.binding_key = s.binding_key
          GROUP BY b.event_path, s.event_type
        `)
      } else {
        linkParts.push(sql`
          SELECT
            ${'before_1_'} || b.event_type AS source_id,
            ${'start_'} || s.event_type AS target_id,
            COUNT(*) AS value
          FROM before_step_1 b
          INNER JOIN starting_entities s ON b.binding_key = s.binding_key
          GROUP BY b.event_type, s.event_type
        `)
      }
    }

    // Link from start to after_step_1
    if (config.stepsAfter >= 1) {
      if (isSunburst) {
        // For sunburst, link from start to path-qualified after_step_1
        linkParts.push(sql`
          SELECT
            ${'start_'} || s.event_type AS source_id,
            ${'after_1_'} || a.event_path AS target_id,
            COUNT(*) AS value
          FROM starting_entities s
          INNER JOIN after_step_1 a ON s.binding_key = a.binding_key
          GROUP BY s.event_type, a.event_path
        `)
      } else {
        linkParts.push(sql`
          SELECT
            ${'start_'} || s.event_type AS source_id,
            ${'after_1_'} || a.event_type AS target_id,
            COUNT(*) AS value
          FROM starting_entities s
          INNER JOIN after_step_1 a ON s.binding_key = a.binding_key
          GROUP BY s.event_type, a.event_type
        `)
      }
    }

    // Links between after steps (away from start)
    for (let depth = 1; depth < config.stepsAfter; depth++) {
      const fromAlias = `after_step_${depth}`
      const toAlias = `after_step_${depth + 1}`

      if (isSunburst) {
        // Sunburst: Use event_path for unique branches
        linkParts.push(sql`
          SELECT
            ${'after_' + depth + '_'} || f.event_path AS source_id,
            ${'after_' + (depth + 1) + '_'} || t.event_path AS target_id,
            COUNT(*) AS value
          FROM ${sql.identifier(fromAlias)} f
          INNER JOIN ${sql.identifier(toAlias)} t ON f.binding_key = t.binding_key
          GROUP BY f.event_path, t.event_path
        `)
      } else {
        // Sankey: Use event_type (paths can converge)
        linkParts.push(sql`
          SELECT
            ${'after_' + depth + '_'} || f.event_type AS source_id,
            ${'after_' + (depth + 1) + '_'} || t.event_type AS target_id,
            COUNT(*) AS value
          FROM ${sql.identifier(fromAlias)} f
          INNER JOIN ${sql.identifier(toAlias)} t ON f.binding_key = t.binding_key
          GROUP BY f.event_type, t.event_type
        `)
      }
    }

    // If no links possible, return empty result
    if (linkParts.length === 0) {
      const emptyQuery = context.db
        .select({
          source_id: sql`NULL`.as('source_id'),
          target_id: sql`NULL`.as('target_id'),
          value: sql`0`.as('value'),
        })
        .from(sql`(SELECT 1) AS empty`)
        .where(sql`1 = 0`)

      return context.db.$with('links_agg').as(emptyQuery)
    }

    const unionQuery = sql.join(linkParts, sql` UNION ALL `)

    const query = context.db
      .select({
        source_id: sql`source_id`.as('source_id'),
        target_id: sql`target_id`.as('target_id'),
        value: sql`value`.as('value'),
      })
      .from(sql`(${unionQuery}) AS links_union`)

    return context.db.$with('links_agg').as(query)
  }

  /**
   * Build the final result CTE
   * Combines nodes and links into a single result set with record_type discriminator
   */
  private buildFinalResultCTE(context: QueryContext): WithSubquery {
    // UNION ALL of nodes and links with type discriminator
    const unionQuery = sql`
      SELECT
        'node' AS record_type,
        node_id AS id,
        name AS name,
        layer AS layer,
        value AS value,
        NULL AS source_id,
        NULL AS target_id
      FROM nodes_agg
      UNION ALL
      SELECT
        'link' AS record_type,
        NULL AS id,
        NULL AS name,
        NULL AS layer,
        value AS value,
        source_id AS source_id,
        target_id AS target_id
      FROM links_agg
      WHERE source_id IS NOT NULL
    `

    const query = context.db
      .select({
        record_type: sql`record_type`.as('record_type'),
        id: sql`id`.as('id'),
        name: sql`name`.as('name'),
        layer: sql`layer`.as('layer'),
        value: sql`value`.as('value'),
        source_id: sql`source_id`.as('source_id'),
        target_id: sql`target_id`.as('target_id'),
      })
      .from(sql`(${unionQuery}) AS final_union`)

    return context.db.$with('final_result').as(query)
  }
}

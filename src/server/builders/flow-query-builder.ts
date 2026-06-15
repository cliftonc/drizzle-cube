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
import { t } from '../../i18n/runtime'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import type {
  FlowQueryConfig,
  FlowResultRow,
  SankeyNode,
  SankeyLink,
} from '../types/flow'
import type { AnalysisConfigValidationResult } from '../types/validation'
import type {
  Cube,
  QueryContext,
  SemanticQuery,
  Filter,
  FilterCondition,
  LogicalFilter,
} from '../types'
import { resolveSqlExpression, resolveFilterFieldExpr } from '../cube-utils'
import { hasFlowMode } from '../query-modes'
import { combineWhere, resolveBindingKeyExpr, bindingKeyErrorsForPrefix, resolveTimeDimensionExpr, asGroupFilter, type WithSubquery } from './analysis-utils'
import { FilterBuilder } from './filter-builder'
import { DateTimeBuilder } from './date-time-builder'

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
    return hasFlowMode(query)
  }

  /**
   * Validate flow configuration
   */
  validateConfig(
    config: FlowQueryConfig,
    cubes: Map<string, Cube>
  ): AnalysisConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const engine = this.databaseAdapter.getEngineType()
    const capabilities = this.databaseAdapter.getCapabilities()
    // Flow queries use LATERAL joins inside CTEs referencing other CTEs,
    // which requires supportsLateralSubqueriesInCTE (not just supportsLateralJoins)
    const supportsLateral = capabilities.supportsLateralSubqueriesInCTE

    if (engine === 'sqlite') {
      errors.push(t('server.validation.flow.sqliteNotSupported'))
      return { isValid: false, errors, warnings }
    }

    this.validateBindingKey(config, cubes, errors)

    // Validate time dimension
    if (typeof config.timeDimension === 'string') {
      this.validateMemberDimension(config.timeDimension, cubes, errors, {
        invalidFormat: () => t('server.validation.flow.invalidTimeDimFormat', { timeDimension: config.timeDimension as string }),
        cubeNotFound: (cubeName) => t('server.validation.flow.timeDimCubeNotFound', { cubeName }),
        dimNotFound: (dimName, cubeName) => t('server.validation.flow.timeDimNotFound', { dimName, cubeName })
      })
    }

    // Validate event dimension
    if (config.eventDimension) {
      this.validateMemberDimension(config.eventDimension, cubes, errors, {
        invalidFormat: () => t('server.validation.flow.invalidEventDimFormat', { eventDimension: config.eventDimension as string }),
        cubeNotFound: (cubeName) => t('server.validation.flow.eventDimCubeNotFound', { cubeName }),
        dimNotFound: (dimName, cubeName) => t('server.validation.flow.eventDimNotFound', { dimName, cubeName })
      })
    } else {
      errors.push(t('server.validation.flow.eventDimRequired'))
    }

    this.validateStartingStep(config, errors, warnings)
    this.validateDepthBounds(config, errors, warnings)
    this.validateJoinStrategy(config, supportsLateral, errors)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate a `Cube.dimension` member string: format, cube existence, and
   * dimension existence. i18n message factories let each call site supply its
   * own keys while sharing the branch structure.
   */
  private validateMemberDimension(
    member: string,
    cubes: Map<string, Cube>,
    errors: string[],
    messages: {
      invalidFormat: () => string
      cubeNotFound: (cubeName: string) => string
      dimNotFound: (dimName: string, cubeName: string) => string
    }
  ): void {
    const [cubeName, dimName] = member.split('.')
    if (!cubeName || !dimName) {
      errors.push(messages.invalidFormat())
      return
    }
    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.push(messages.cubeNotFound(cubeName))
    } else if (!cube.dimensions?.[dimName]) {
      errors.push(messages.dimNotFound(dimName, cubeName))
    }
  }

  /** Validate the flow binding key (single member or per-cube mappings). */
  private validateBindingKey(
    config: FlowQueryConfig,
    cubes: Map<string, Cube>,
    errors: string[]
  ): void {
    if (typeof config.bindingKey === 'string') {
      this.validateMemberDimension(config.bindingKey, cubes, errors, {
        invalidFormat: () => t('server.validation.flow.invalidBindingKeyFormat', { bindingKey: config.bindingKey as string }),
        cubeNotFound: (cubeName) => t('server.validation.flow.bindingKeyCubeNotFound', { cubeName }),
        dimNotFound: (dimName, cubeName) => t('server.validation.flow.bindingKeyDimNotFound', { dimName, cubeName })
      })
      return
    }

    if (Array.isArray(config.bindingKey)) {
      for (const mapping of config.bindingKey) {
        const cube = cubes.get(mapping.cube)
        if (!cube) {
          errors.push(t('server.validation.flow.bindingKeyMappingCubeNotFound', { cubeName: mapping.cube }))
          continue
        }
        const [, dimName] = mapping.dimension.split('.')
        if (!cube.dimensions?.[dimName]) {
          errors.push(t('server.validation.flow.bindingKeyDimNotFound', { dimName, cubeName: mapping.cube }))
        }
      }
    }
  }

  /** Validate the flow starting step (required + filter + name warning). */
  private validateStartingStep(
    config: FlowQueryConfig,
    errors: string[],
    warnings: string[]
  ): void {
    if (!config.startingStep) {
      errors.push(t('server.validation.flow.startingStepRequired'))
      return
    }
    if (!config.startingStep.filter) {
      errors.push(t('server.validation.flow.startingStepFilterRequired'))
    }
    if (!config.startingStep.name) {
      warnings.push(t('server.validation.flow.startingStepNameMissing'))
    }
  }

  /** Validate flow step-depth bounds and emit high-depth performance warnings. */
  private validateDepthBounds(
    config: FlowQueryConfig,
    errors: string[],
    warnings: string[]
  ): void {
    if (config.stepsBefore < 0 || config.stepsBefore > 5) {
      errors.push(t('server.validation.flow.stepsBeforeRange', { value: config.stepsBefore }))
    }
    if (config.stepsAfter < 0 || config.stepsAfter > 5) {
      errors.push(t('server.validation.flow.stepsAfterRange', { value: config.stepsAfter }))
    }
    if (config.stepsBefore >= 4 || config.stepsAfter >= 4) {
      warnings.push(t('server.validation.flow.highStepDepthWarning'))
    }
  }

  /** Validate the flow join strategy and its engine support. */
  private validateJoinStrategy(
    config: FlowQueryConfig,
    supportsLateral: boolean,
    errors: string[]
  ): void {
    if (config.joinStrategy && !['auto', 'lateral', 'window'].includes(config.joinStrategy)) {
      errors.push(t('server.validation.flow.invalidJoinStrategy', { joinStrategy: config.joinStrategy }))
    } else if (config.joinStrategy === 'lateral' && !supportsLateral) {
      errors.push(t('server.validation.flow.lateralNotSupported'))
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
      throw new Error(t('server.validation.flow.sqliteNotSupported'))
    }
    const capabilities = this.databaseAdapter.getCapabilities()
    // Flow CTEs use correlated LATERAL subqueries that reference other CTEs,
    // so we need the stricter supportsLateralSubqueriesInCTE capability
    const supportsLateral = capabilities.supportsLateralSubqueriesInCTE
    const joinStrategy = config.joinStrategy ?? 'auto'
    const useLateral =
      joinStrategy === 'lateral' || (joinStrategy === 'auto' && supportsLateral)

    if (joinStrategy === 'lateral' && !supportsLateral) {
      throw new Error(t('server.validation.flow.lateralNotSupportedExec'))
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
      ? this.buildDirectionalCTEsLateral('before', effectiveConfig, resolved, context)
      : this.buildDirectionalCTEsWindow('before', effectiveConfig, resolved, context)
    ctes.push(...beforeCTEs)

    // 3. After step CTEs - walk forwards from starting step
    const afterCTEs = useLateral
      ? this.buildDirectionalCTEsLateral('after', effectiveConfig, resolved, context)
      : this.buildDirectionalCTEsWindow('after', effectiveConfig, resolved, context)
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
      throw new Error(t('server.errors.flow.cannotResolveCube'))
    }

    const cube = cubes.get(cubeName)
    if (!cube) {
      throw new Error(t('server.errors.flow.cubeNotFound', { cubeName }))
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
    return resolveBindingKeyExpr(config.bindingKey, cube, context, bindingKeyErrorsForPrefix('server.errors.flow'))
  }

  /**
   * Resolve time dimension expression
   */
  private resolveTimeDimension(
    config: FlowQueryConfig,
    cube: Cube,
    context: QueryContext
  ): SQL {
    return resolveTimeDimensionExpr(config.timeDimension, cube, context, 'server.errors.flow')
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
      throw new Error(t('server.errors.flow.eventDimNotFound', { eventDimension: config.eventDimension }))
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
      const filterList = logicalFilter.and || logicalFilter.or || []
      const subConditions = this.buildSubConditions(filterList, cube, context)
      return this.combineConditions(subConditions, 'and' in filter)
    }

    // Handle client-style group filters ({ type: 'and' | 'or', filters: [...] })
    const group = asGroupFilter(filter)
    if (group) {
      const subConditions = this.buildSubConditions(group.filters, cube, context)
      return this.combineConditions(subConditions, group.isAnd)
    }

    // Handle simple filter condition
    const simpleFilter = filter as FilterCondition
    const [, dimName] = simpleFilter.member.split('.')

    const dimension = cube.dimensions?.[dimName]
    if (!dimension) return null

    const fieldExpr = resolveFilterFieldExpr(dimension, context)

    return this.filterBuilder.buildFilterCondition(
      fieldExpr,
      simpleFilter.operator,
      simpleFilter.values || [],
      dimension,
      simpleFilter.dateRange
    )
  }

  /** Build the non-null sub-conditions of a logical/group filter. */
  private buildSubConditions(
    filterList: Filter[],
    cube: Cube,
    context: QueryContext
  ): SQL[] {
    const subConditions: SQL[] = []
    for (const subFilter of filterList) {
      const condition = this.buildFilterCondition(subFilter, cube, context)
      if (condition) {
        subConditions.push(condition)
      }
    }
    return subConditions
  }

  /** Combine sub-conditions with AND/OR, collapsing the 0- and 1-element cases. */
  private combineConditions(subConditions: SQL[], isAnd: boolean): SQL | null {
    if (subConditions.length === 0) return null
    if (subConditions.length === 1) return subConditions[0]
    return isAnd
      ? and(...subConditions) as SQL
      : sql`(${sql.join(subConditions, sql` OR `)})`
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
      query = query.where(combineWhere(whereConditions))
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
   * Build CTEs for steps BEFORE/AFTER the starting point using LATERAL joins
   *
   * Direction-parameterised: 'before' walks backwards (time `<` reference,
   * ORDER BY DESC, `before_step_N` aliases, bounded by `stepsBefore`); 'after'
   * walks forwards (time `>`, ORDER BY ASC, `after_step_N`, `stepsAfter`).
   * Uses ORDER BY ... LIMIT 1 to fetch the immediate predecessor/successor via index.
   */
  private buildDirectionalCTEsLateral(
    direction: 'before' | 'after',
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery[] {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr } = resolved
    const ctes: WithSubquery[] = []
    const isSunburst = config.outputMode === 'sunburst'

    const isBefore = direction === 'before'
    const stepBound = isBefore ? config.stepsBefore : config.stepsAfter
    const timeOp = isBefore ? sql`<` : sql`>`
    const orderDir = isBefore ? sql`DESC` : sql`ASC`

    for (let depth = 1; depth <= stepBound; depth++) {
      const prevAlias = depth === 1 ? 'starting_entities' : `${direction}_step_${depth - 1}`
      const prevTimeColumn = depth === 1 ? 'start_time' : 'step_time'
      const alias = `${direction}_step_${depth}`

      const whereConditions: SQL[] = []
      if (cubeBase.where) {
        whereConditions.push(cubeBase.where)
      }
      whereConditions.push(
        sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`,
        sql`${timeExpr} ${timeOp} ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`
      )
      const combinedWhere = combineWhere(whereConditions)

      const eventPathExpr = isSunburst
        ? (isBefore
            ? sql`${eventExpr} || ${'→'} || ${sql.identifier(prevAlias)}.event_path`
            : sql`${sql.identifier(prevAlias)}.event_path || ${'→'} || ${eventExpr}`)
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
        .orderBy(sql`${timeExpr} ${orderDir}`)
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
   * Build CTEs for steps BEFORE/AFTER the starting point using ROW_NUMBER()
   *
   * Direction-parameterised: 'before' finds the immediate predecessor (time `<`
   * reference, ROW_NUMBER ORDER BY DESC, `before_step_N` aliases, bounded by
   * `stepsBefore`); 'after' finds the immediate successor (time `>`, ORDER BY ASC,
   * `after_step_N`, `stepsAfter`). For sunburst mode, accumulates event_path
   * (prepend for before, append for after).
   */
  private buildDirectionalCTEsWindow(
    direction: 'before' | 'after',
    config: FlowQueryConfig,
    resolved: ResolvedFlowConfig,
    context: QueryContext
  ): WithSubquery[] {
    const { cubeBase, bindingKeyExpr, timeExpr, eventExpr } = resolved
    const ctes: WithSubquery[] = []
    const isSunburst = config.outputMode === 'sunburst'

    const isBefore = direction === 'before'
    const stepBound = isBefore ? config.stepsBefore : config.stepsAfter
    const timeOp = isBefore ? sql`<` : sql`>`
    const orderDir = isBefore ? sql`DESC` : sql`ASC`

    for (let depth = 1; depth <= stepBound; depth++) {
      const prevAlias = depth === 1 ? 'starting_entities' : `${direction}_step_${depth - 1}`
      const prevTimeColumn = depth === 1 ? 'start_time' : 'step_time'
      const alias = `${direction}_step_${depth}`

      // Build WHERE conditions
      const whereConditions: SQL[] = []
      if (cubeBase.where) {
        whereConditions.push(cubeBase.where)
      }

      // Time constraint: event must be BEFORE/AFTER the reference time
      whereConditions.push(
        sql`${timeExpr} ${timeOp} ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`
      )

      const combinedWhere = combineWhere(whereConditions)

      // Build event_path expression for sunburst mode
      // For before steps, prepend current event to previous path (reverse order);
      // for after steps, append current event to previous path
      const eventPathExpr = isSunburst
        ? (isBefore
            ? sql`${eventExpr} || ${'→'} || ${sql.identifier(prevAlias)}.event_path`
            : sql`${sql.identifier(prevAlias)}.event_path || ${'→'} || ${eventExpr}`)
        : sql`${eventExpr}` // For sankey mode, just use event_type as path

      // Build the CTE using a subquery with ROW_NUMBER window function
      // ROW_NUMBER() OVER (PARTITION BY binding_key ORDER BY time DESC/ASC) gives us the Nth previous/following event
      const rankedQuery = context.db
        .select({
          binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
          step_time: sql`${timeExpr}`.as('step_time'),
          event_type: sql`${eventExpr}`.as('event_type'),
          event_path: eventPathExpr.as('event_path'),
          rn: sql`ROW_NUMBER() OVER (PARTITION BY ${bindingKeyExpr} ORDER BY ${timeExpr} ${orderDir})`.as('rn'),
        })
        .from(cubeBase.from)
        .innerJoin(
          sql`${sql.identifier(prevAlias)}`,
          sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`
        )
        .where(combinedWhere)

      // Wrap to filter for rn = 1 (immediate predecessor/successor)
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
   * Build a single node-aggregation UNION arm for a before/after step.
   *
   * Sankey groups by `event_type` (converging paths); sunburst groups by
   * `event_path` (unique tree branches). The node-id prefix and layer are
   * emitted via sql.raw() because they're hardcoded constants (not user input)
   * and avoid multi-digit parameter issues in DuckDB.
   */
  private buildNodeArm(prefix: string, layer: number, fromAlias: string, isSunburst: boolean): SQL {
    const prefixLit = sql.raw(`'${prefix}_'`)
    const layerLit = sql.raw(String(layer))
    const from = sql.identifier(fromAlias)
    if (isSunburst) {
      return sql`
          SELECT
            ${prefixLit} || event_path AS node_id,
            event_type AS name,
            ${layerLit} AS layer,
            COUNT(*) AS value
          FROM ${from}
          GROUP BY event_path, event_type
        `
    }
    return sql`
          SELECT
            ${prefixLit} || event_type AS node_id,
            event_type AS name,
            ${layerLit} AS layer,
            COUNT(*) AS value
          FROM ${from}
          GROUP BY event_type
        `
  }

  /**
   * Build a single link-aggregation UNION arm between two adjacent step CTEs
   * (before→before or after→after). Sankey keys transitions on `event_type`,
   * sunburst on `event_path`. Source/target id prefixes are sql.raw() constants.
   */
  private buildAdjacentLinkArm(
    sourcePrefix: string,
    targetPrefix: string,
    fromAlias: string,
    toAlias: string,
    isSunburst: boolean
  ): SQL {
    const srcLit = sql.raw(`'${sourcePrefix}_'`)
    const tgtLit = sql.raw(`'${targetPrefix}_'`)
    const from = sql.identifier(fromAlias)
    const to = sql.identifier(toAlias)
    if (isSunburst) {
      return sql`
          SELECT
            ${srcLit} || f.event_path AS source_id,
            ${tgtLit} || t.event_path AS target_id,
            COUNT(*) AS value
          FROM ${from} f
          INNER JOIN ${to} t ON f.binding_key = t.binding_key
          GROUP BY f.event_path, t.event_path
        `
    }
    return sql`
          SELECT
            ${srcLit} || f.event_type AS source_id,
            ${tgtLit} || t.event_type AS target_id,
            COUNT(*) AS value
          FROM ${from} f
          INNER JOIN ${to} t ON f.binding_key = t.binding_key
          GROUP BY f.event_type, t.event_type
        `
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
    // Note: Using sql.raw() for prefix strings to avoid multi-digit parameter issues in DuckDB
    // These are hardcoded constants (not user input), so sql.raw() is safe here
    for (let depth = config.stepsBefore; depth >= 1; depth--) {
      unionParts.push(this.buildNodeArm(`before_${depth}`, -depth, `before_step_${depth}`, isSunburst))
    }

    // Starting step (layer 0) - same for both modes since it's the root
    unionParts.push(sql`
      SELECT
        ${sql.raw("'start_'")} || event_type AS node_id,
        event_type AS name,
        0 AS layer,
        COUNT(*) AS value
      FROM starting_entities
      GROUP BY event_type
    `)

    // After steps (positive layers)
    for (let depth = 1; depth <= config.stepsAfter; depth++) {
      unionParts.push(this.buildNodeArm(`after_${depth}`, depth, `after_step_${depth}`, isSunburst))
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
    // Note: Using sql.raw() for prefix strings to avoid multi-digit parameter issues in DuckDB
    // These are hardcoded constants (not user input), so sql.raw() is safe here
    for (let depth = config.stepsBefore; depth >= 2; depth--) {
      linkParts.push(this.buildAdjacentLinkArm(
        `before_${depth}`, `before_${depth - 1}`,
        `before_step_${depth}`, `before_step_${depth - 1}`,
        isSunburst
      ))
    }

    // Link from before_step_1 to start
    if (config.stepsBefore >= 1) {
      if (isSunburst) {
        linkParts.push(sql`
          SELECT
            ${sql.raw("'before_1_'")} || b.event_path AS source_id,
            ${sql.raw("'start_'")} || s.event_type AS target_id,
            COUNT(*) AS value
          FROM before_step_1 b
          INNER JOIN starting_entities s ON b.binding_key = s.binding_key
          GROUP BY b.event_path, s.event_type
        `)
      } else {
        linkParts.push(sql`
          SELECT
            ${sql.raw("'before_1_'")} || b.event_type AS source_id,
            ${sql.raw("'start_'")} || s.event_type AS target_id,
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
            ${sql.raw("'start_'")} || s.event_type AS source_id,
            ${sql.raw("'after_1_'")} || a.event_path AS target_id,
            COUNT(*) AS value
          FROM starting_entities s
          INNER JOIN after_step_1 a ON s.binding_key = a.binding_key
          GROUP BY s.event_type, a.event_path
        `)
      } else {
        linkParts.push(sql`
          SELECT
            ${sql.raw("'start_'")} || s.event_type AS source_id,
            ${sql.raw("'after_1_'")} || a.event_type AS target_id,
            COUNT(*) AS value
          FROM starting_entities s
          INNER JOIN after_step_1 a ON s.binding_key = a.binding_key
          GROUP BY s.event_type, a.event_type
        `)
      }
    }

    // Links between after steps (away from start)
    for (let depth = 1; depth < config.stepsAfter; depth++) {
      linkParts.push(this.buildAdjacentLinkArm(
        `after_${depth}`, `after_${depth + 1}`,
        `after_step_${depth}`, `after_step_${depth + 1}`,
        isSunburst
      ))
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

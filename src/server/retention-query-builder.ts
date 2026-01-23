/**
 * Retention Query Builder
 * Handles server-side retention analysis with cohort-based tracking
 * Generates SQL with CTEs for retention rate calculation
 *
 * Supports:
 * - Classic (bounded) retention: User returned exactly in period N
 * - Rolling (unbounded) retention: User returned in period N or later
 * - Single-cube and multi-cube configurations
 */

import { sql, SQL, and } from 'drizzle-orm'
import type { DatabaseAdapter } from './adapters/base-adapter'
import type {
  RetentionQueryConfig,
  RetentionResultRow,
  RetentionBindingKeyMapping,
  RetentionDateRange
} from './types/retention'
import {
  isRetentionMultiCubeBindingKey,
  extractCubeFromTimeDimension,
  extractDimensionFromTimeDimension
} from './types/retention'
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

/**
 * Resolved retention configuration with SQL expressions
 * Simplified: same cube/dimension used for both cohort and activity
 */
interface ResolvedRetentionConfig {
  cube: Cube
  bindingKeyExpr: SQL
  timeExpr: SQL
  cohortFilterConditions: SQL[]
  activityFilterConditions: SQL[]
  /** Resolved breakdown expressions with their dimension names */
  breakdowns: Array<{ dimension: string; expr: SQL }>
}

/**
 * Type for CTE objects created by db.$with()
 */
type WithSubquery = ReturnType<ReturnType<any['$with']>['as']>

export class RetentionQueryBuilder {
  private filterBuilder: FilterBuilder
  private dateTimeBuilder: DateTimeBuilder

  constructor(private databaseAdapter: DatabaseAdapter) {
    this.dateTimeBuilder = new DateTimeBuilder(databaseAdapter)
    this.filterBuilder = new FilterBuilder(databaseAdapter, this.dateTimeBuilder)
  }

  /**
   * Check if query contains retention configuration
   */
  hasRetention(query: SemanticQuery): boolean {
    return (
      query.retention !== undefined &&
      query.retention.timeDimension != null &&
      query.retention.bindingKey != null
    )
  }

  /**
   * Validate retention configuration against registered cubes
   */
  validateConfig(
    config: RetentionQueryConfig,
    cubes: Map<string, Cube>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate time dimension (used for both cohort entry and activity)
    try {
      const cubeName = extractCubeFromTimeDimension(config.timeDimension)
      const dimName = extractDimensionFromTimeDimension(config.timeDimension)
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(`Cube not found: ${cubeName}`)
      } else if (!cube.dimensions?.[dimName]) {
        errors.push(`Time dimension not found: ${dimName} in cube ${cubeName}`)
      }
    } catch {
      errors.push(`Invalid time dimension format: ${config.timeDimension}`)
    }

    // Validate binding key
    if (isRetentionMultiCubeBindingKey(config.bindingKey)) {
      for (const mapping of config.bindingKey) {
        const cube = cubes.get(mapping.cube)
        if (!cube) {
          errors.push(`Binding key mapping cube not found: ${mapping.cube}`)
        } else {
          const dimName = this.extractDimensionName(mapping.dimension)
          if (!cube.dimensions?.[dimName]) {
            errors.push(`Binding key dimension not found: ${dimName} in cube ${mapping.cube}`)
          }
        }
      }
    } else {
      // Single string format: 'CubeName.dimensionName'
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
    }

    // Validate breakdown dimensions (optional)
    if (config.breakdownDimensions && config.breakdownDimensions.length > 0) {
      for (const breakdownDim of config.breakdownDimensions) {
        const [breakdownCubeName, breakdownDimName] = breakdownDim.split('.')
        if (!breakdownCubeName || !breakdownDimName) {
          errors.push(`Invalid breakdown dimension format: ${breakdownDim}. Expected 'CubeName.dimensionName'`)
        } else {
          const cube = cubes.get(breakdownCubeName)
          if (!cube) {
            errors.push(`Breakdown dimension cube not found: ${breakdownCubeName}`)
          } else if (!cube.dimensions?.[breakdownDimName]) {
            errors.push(`Breakdown dimension not found: ${breakdownDimName} in cube ${breakdownCubeName}`)
          }
        }
      }
    }

    // Validate periods
    if (config.periods < 1) {
      errors.push('Periods must be at least 1')
    }
    if (config.periods > 52) {
      errors.push('Periods cannot exceed 52 (performance limit)')
    }

    // Validate granularity
    const validGranularities = ['day', 'week', 'month']
    if (!validGranularities.includes(config.granularity)) {
      errors.push(`Invalid granularity: ${config.granularity}`)
    }

    // Validate retention type
    const validRetentionTypes = ['classic', 'rolling']
    if (!validRetentionTypes.includes(config.retentionType)) {
      errors.push(`Invalid retention type: ${config.retentionType}`)
    }

    // Validate date range (required)
    if (!config.dateRange) {
      errors.push('Date range is required')
    } else {
      if (!config.dateRange.start) {
        errors.push('Date range start is required')
      } else {
        const start = new Date(config.dateRange.start)
        if (isNaN(start.getTime())) {
          errors.push('Invalid date range start format')
        }
      }

      if (!config.dateRange.end) {
        errors.push('Date range end is required')
      } else {
        const end = new Date(config.dateRange.end)
        if (isNaN(end.getTime())) {
          errors.push('Invalid date range end format')
        }
      }

      // Validate start is before end
      if (config.dateRange.start && config.dateRange.end) {
        const start = new Date(config.dateRange.start)
        const end = new Date(config.dateRange.end)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
          errors.push('Date range start must be before or equal to end')
        }
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Build the retention SQL query using CTEs
   *
   * CTE Structure (Simplified Mixpanel-style):
   * 1. cohort_base - Users entering the cohort (first event in date range)
   *    - When breakdown is specified, includes breakdown_value
   * 2. activity_periods - All activity with period_number relative to cohort entry
   * 3. cohort_sizes - Aggregate cohort sizes (per breakdown value if applicable)
   * 4. retention_counts - Retained users per period (and breakdown value)
   * 5. Final SELECT - Join with retention rate calculation
   */
  buildRetentionQuery(
    config: RetentionQueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): any {
    // Resolve cohort configuration (same cube/dimension for both cohort and activity)
    const resolvedConfig = this.resolveConfig(config, cubes, context)

    // Build CTEs
    const breakdownCount = resolvedConfig.breakdowns.length
    const cohortBaseCTE = this.buildCohortBaseCTE(config, resolvedConfig, context)
    const activityPeriodsCTE = this.buildActivityPeriodsCTE(config, resolvedConfig, context)
    const cohortSizesCTE = this.buildCohortSizesCTE(config, context, breakdownCount)
    const retentionCountsCTE = this.buildRetentionCountsCTE(config, context, breakdownCount)

    // Build final query with all CTEs
    const hasBreakdowns = resolvedConfig.breakdowns.length > 0

    const selectFields: Record<string, any> = {
      period: sql`rc.period_number`.as('period'),
      cohort_size: sql`cs.cohort_size`.as('cohort_size'),
      retained_users: sql`rc.retained_users`.as('retained_users'),
      retention_rate: sql`CAST(rc.retained_users AS NUMERIC) / NULLIF(cs.cohort_size, 0)`.as('retention_rate')
    }

    // Add each breakdown column to select
    for (let i = 0; i < resolvedConfig.breakdowns.length; i++) {
      selectFields[`breakdown_${i}`] = sql.raw(`rc.breakdown_${i}`).as(`breakdown_${i}`)
    }

    let query = context.db
      .with(cohortBaseCTE, activityPeriodsCTE, cohortSizesCTE, retentionCountsCTE)
      .select(selectFields)
      .from(sql`retention_counts rc`)

    // Join condition includes all breakdown columns if applicable
    if (hasBreakdowns) {
      // Build join condition matching all breakdown columns
      const joinConditions = resolvedConfig.breakdowns.map((_, i) =>
        sql`COALESCE(CAST(rc.breakdown_${sql.raw(String(i))} AS TEXT), '') = COALESCE(CAST(cs.breakdown_${sql.raw(String(i))} AS TEXT), '')`
      )
      const joinCondition = joinConditions.length === 1
        ? joinConditions[0]
        : sql.join(joinConditions, sql` AND `)

      query = query.innerJoin(sql`cohort_sizes cs`, joinCondition)
    } else {
      query = query.innerJoin(sql`cohort_sizes cs`, sql`1 = 1`)
    }

    // Order by breakdown columns (if present), then period_number
    const orderByClauses: SQL[] = []
    for (let i = 0; i < resolvedConfig.breakdowns.length; i++) {
      orderByClauses.push(sql.raw(`rc.breakdown_${i}`))
    }
    orderByClauses.push(sql`rc.period_number`)
    query = query.orderBy(...orderByClauses)

    return query
  }

  /**
   * Transform raw SQL results to RetentionResultRow[]
   */
  transformResult(
    rawResult: unknown[],
    config: RetentionQueryConfig
  ): RetentionResultRow[] {
    const breakdownDimensions = config.breakdownDimensions || []
    const hasBreakdowns = breakdownDimensions.length > 0

    return (rawResult as any[]).map(row => {
      const result: RetentionResultRow = {
        period: Number(row.period),
        cohortSize: Number(row.cohort_size),
        retainedUsers: Number(row.retained_users),
        retentionRate: row.retention_rate !== null ? Number(row.retention_rate) : 0
      }

      if (hasBreakdowns) {
        const breakdownValues: Record<string, string | null> = {}
        for (let i = 0; i < breakdownDimensions.length; i++) {
          const dimName = breakdownDimensions[i]
          const value = row[`breakdown_${i}`]
          breakdownValues[dimName] = value !== undefined ? String(value) : null
        }
        result.breakdownValues = breakdownValues
      }

      return result
    })
  }

  /**
   * Resolve retention configuration with SQL expressions
   * Same cube/dimension used for both cohort entry and activity detection
   */
  private resolveConfig(
    config: RetentionQueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): ResolvedRetentionConfig {
    const cubeName = extractCubeFromTimeDimension(config.timeDimension)
    const dimName = extractDimensionFromTimeDimension(config.timeDimension)

    const cube = cubes.get(cubeName)
    if (!cube) {
      throw new Error(`Cube not found: ${cubeName}`)
    }

    const timeDimension = cube.dimensions?.[dimName]
    if (!timeDimension) {
      throw new Error(`Time dimension not found: ${dimName}`)
    }

    const timeExpr = resolveSqlExpression(timeDimension.sql, context) as SQL
    const bindingKeyExpr = this.resolveBindingKey(config.bindingKey, cube, cubes, context)
    const cohortFilterConditions = this.buildFilterConditions(config.cohortFilters, cube, cubes, context)
    const activityFilterConditions = this.buildFilterConditions(config.activityFilters, cube, cubes, context)

    // Resolve breakdown dimensions if specified
    const breakdowns: Array<{ dimension: string; expr: SQL }> = []
    if (config.breakdownDimensions && config.breakdownDimensions.length > 0) {
      for (const breakdownDim of config.breakdownDimensions) {
        const [breakdownCubeName, breakdownDimName] = breakdownDim.split('.')
        const breakdownCube = cubes.get(breakdownCubeName)
        if (breakdownCube && breakdownCube.dimensions?.[breakdownDimName]) {
          const expr = resolveSqlExpression(breakdownCube.dimensions[breakdownDimName].sql, context) as SQL
          breakdowns.push({ dimension: breakdownDim, expr })
        }
      }
    }

    return { cube, bindingKeyExpr, timeExpr, cohortFilterConditions, activityFilterConditions, breakdowns }
  }

  /**
   * Resolve binding key expression for a cube
   */
  private resolveBindingKey(
    bindingKey: string | RetentionBindingKeyMapping[],
    cube: Cube,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL {
    if (isRetentionMultiCubeBindingKey(bindingKey)) {
      // Find the mapping for this cube
      const mapping = bindingKey.find(m => m.cube === cube.name)
      if (!mapping) {
        throw new Error(`No binding key mapping found for cube: ${cube.name}`)
      }
      const dimName = this.extractDimensionName(mapping.dimension)
      const targetCube = cubes.get(mapping.cube)
      if (!targetCube) {
        throw new Error(`Binding key cube not found: ${mapping.cube}`)
      }
      const dimension = targetCube.dimensions?.[dimName]
      if (!dimension) {
        throw new Error(`Binding key dimension not found: ${mapping.dimension}`)
      }
      return resolveSqlExpression(dimension.sql, context) as SQL
    }

    // Single string format
    const [cubeName, dimName] = bindingKey.split('.')
    const targetCube = cubes.get(cubeName)
    if (!targetCube) {
      throw new Error(`Binding key cube not found: ${cubeName}`)
    }
    const dimension = targetCube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(`Binding key dimension not found: ${bindingKey}`)
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  /**
   * Build filter conditions from config filters
   */
  private buildFilterConditions(
    filters: Filter | Filter[] | undefined,
    baseCube: Cube,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL[] {
    if (!filters) return []

    const filterArray = Array.isArray(filters) ? filters : [filters]
    const conditions: SQL[] = []

    for (const filter of filterArray) {
      const condition = this.buildSingleFilterCondition(filter, baseCube, cubes, context)
      if (condition) {
        conditions.push(condition)
      }
    }

    return conditions
  }

  /**
   * Build a single filter condition
   */
  private buildSingleFilterCondition(
    filter: Filter,
    baseCube: Cube,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL | null {
    // Handle logical filters
    if ('and' in filter || 'or' in filter) {
      const logicalFilter = filter as LogicalFilter
      const subConditions: SQL[] = []
      const isAndFilter = 'and' in logicalFilter && !!logicalFilter.and
      const filterList = logicalFilter.and || logicalFilter.or || []

      for (const subFilter of filterList) {
        const condition = this.buildSingleFilterCondition(subFilter, baseCube, cubes, context)
        if (condition) {
          subConditions.push(condition)
        }
      }

      if (subConditions.length === 0) return null
      if (subConditions.length === 1) return subConditions[0]

      if (isAndFilter) {
        return and(...subConditions) as SQL
      } else {
        return sql`(${sql.join(subConditions, sql` OR `)})`
      }
    }

    // Handle simple filter
    const simpleFilter = filter as FilterCondition
    const [filterCubeName, dimName] = simpleFilter.member.split('.')

    const filterCube = cubes.get(filterCubeName)
    if (!filterCube) return null

    const dimension = filterCube.dimensions?.[dimName]
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

  /**
   * Build cohort_base CTE
   * Groups users by their first activity (cohort entry) within the date range.
   * When breakdowns are specified, includes breakdown values for each dimension.
   */
  private buildCohortBaseCTE(
    config: RetentionQueryConfig,
    resolvedConfig: ResolvedRetentionConfig,
    context: QueryContext
  ): WithSubquery {
    // Get cube base with security context
    const cubeBase = resolvedConfig.cube.sql(context)

    // Build WHERE conditions
    const whereConditions: SQL[] = []
    if (cubeBase.where) {
      whereConditions.push(cubeBase.where)
    }
    whereConditions.push(...resolvedConfig.cohortFilterConditions)

    // Add date range filter to WHERE clause
    if (config.dateRange) {
      const dateRangeCondition = this.buildDateRangeCondition(
        resolvedConfig.timeExpr,
        config.dateRange
      )
      whereConditions.push(dateRangeCondition)
    }

    // Build truncated cohort entry date (use same granularity for viewing)
    const truncatedCohortDate = this.databaseAdapter.buildTimeDimension(
      config.granularity,
      resolvedConfig.timeExpr
    )

    // Build SELECT fields
    const selectFields: Record<string, any> = {
      binding_key: sql`${resolvedConfig.bindingKeyExpr}`.as('binding_key'),
      cohort_entry: sql`MIN(${truncatedCohortDate})`.as('cohort_entry')
    }

    // Add each breakdown column (using MIN for consistency with first event)
    for (let i = 0; i < resolvedConfig.breakdowns.length; i++) {
      const { expr } = resolvedConfig.breakdowns[i]
      selectFields[`breakdown_${i}`] = sql`MIN(${expr})`.as(`breakdown_${i}`)
    }

    // Build grouped query
    let groupedQuery = context.db
      .select(selectFields)
      .from(cubeBase.from)

    // Apply WHERE conditions
    if (whereConditions.length > 0) {
      const combinedWhere = whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions) as SQL
      groupedQuery = groupedQuery.where(combinedWhere)
    }

    // Group by binding key AND all breakdown dimensions
    // When breakdowns are specified, we need to track users per breakdown value
    const groupByFields: SQL[] = [resolvedConfig.bindingKeyExpr]
    for (let i = 0; i < resolvedConfig.breakdowns.length; i++) {
      groupByFields.push(resolvedConfig.breakdowns[i].expr)
    }
    groupedQuery = groupedQuery.groupBy(...groupByFields)

    // Add HAVING clause to ensure cohort_entry falls within the date range
    if (config.dateRange) {
      const havingCondition = this.buildDateRangeHavingCondition(
        truncatedCohortDate,
        config.dateRange
      )
      groupedQuery = groupedQuery.having(havingCondition)
    }

    return context.db.$with('cohort_base').as(groupedQuery)
  }

  /**
   * Build date range condition for WHERE clause
   * Filters records to those within the specified date range
   */
  private buildDateRangeCondition(
    timeExpr: SQL,
    dateRange: RetentionDateRange
  ): SQL {
    // Use database adapter for date comparison
    return sql`${timeExpr} >= ${dateRange.start}::date AND ${timeExpr} < (${dateRange.end}::date + interval '1 day')`
  }

  /**
   * Build date range condition for HAVING clause
   * Used to filter aggregated cohort_period values
   */
  private buildDateRangeHavingCondition(
    truncatedDate: SQL,
    dateRange: RetentionDateRange
  ): SQL {
    return sql`MIN(${truncatedDate}) >= ${dateRange.start}::date AND MIN(${truncatedDate}) < (${dateRange.end}::date + interval '1 day')`
  }

  /**
   * Build activity_periods CTE
   * Joins activity events to cohort_base and calculates period_number.
   * Includes breakdown values from cohort_base when breakdowns are specified.
   */
  private buildActivityPeriodsCTE(
    config: RetentionQueryConfig,
    resolvedConfig: ResolvedRetentionConfig,
    context: QueryContext
  ): WithSubquery {
    // Get cube base with security context
    const cubeBase = resolvedConfig.cube.sql(context)

    // Build WHERE conditions
    const whereConditions: SQL[] = []
    if (cubeBase.where) {
      whereConditions.push(cubeBase.where)
    }
    whereConditions.push(...resolvedConfig.activityFilterConditions)

    // Activity must be >= cohort entry
    whereConditions.push(sql`${resolvedConfig.timeExpr} >= cohort_base.cohort_entry`)

    // Build truncated activity date
    const truncatedActivityDate = this.databaseAdapter.buildTimeDimension(
      config.granularity,
      resolvedConfig.timeExpr
    )

    // Calculate period number using DATE_DIFF
    const periodNumber = this.buildPeriodNumberExpression(
      sql`cohort_base.cohort_entry`,
      truncatedActivityDate,
      config.granularity
    )

    // Build SELECT fields
    const selectFields: Record<string, any> = {
      binding_key: sql`cohort_base.binding_key`.as('binding_key'),
      period_number: periodNumber.as('period_number')
    }

    // Add each breakdown column from cohort_base
    for (let i = 0; i < resolvedConfig.breakdowns.length; i++) {
      selectFields[`breakdown_${i}`] = sql.raw(`cohort_base.breakdown_${i}`).as(`breakdown_${i}`)
    }

    // Build query with GROUP BY to get distinct combinations (prevents double-counting)
    let query = context.db
      .select(selectFields)
      .from(cubeBase.from)
      .innerJoin(
        sql`cohort_base`,
        sql`${resolvedConfig.bindingKeyExpr} = cohort_base.binding_key`
      )

    // Apply WHERE conditions
    if (whereConditions.length > 0) {
      const combinedWhere = whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions) as SQL
      query = query.where(combinedWhere)
    }

    // Group by to get distinct binding_key/period_number (and breakdown columns) combinations
    const groupByFields: SQL[] = [
      sql`cohort_base.binding_key`,
      periodNumber
    ]
    for (let i = 0; i < resolvedConfig.breakdowns.length; i++) {
      groupByFields.push(sql.raw(`cohort_base.breakdown_${i}`))
    }
    query = query.groupBy(...groupByFields)

    return context.db.$with('activity_periods').as(query)
  }

  /**
   * Build cohort_sizes CTE
   * Aggregates the size of the cohort (or per breakdown combination if specified).
   */
  private buildCohortSizesCTE(
    _config: RetentionQueryConfig,
    context: QueryContext,
    breakdownCount: number
  ): WithSubquery {
    const hasBreakdowns = breakdownCount > 0

    if (hasBreakdowns) {
      // When breakdowns are specified, group by all breakdown columns
      const selectFields: Record<string, any> = {
        cohort_size: sql`COUNT(*)`.as('cohort_size')
      }
      const groupByFields: SQL[] = []

      for (let i = 0; i < breakdownCount; i++) {
        selectFields[`breakdown_${i}`] = sql.raw(`breakdown_${i}`).as(`breakdown_${i}`)
        groupByFields.push(sql.raw(`breakdown_${i}`))
      }

      const query = context.db
        .select(selectFields)
        .from(sql`cohort_base`)
        .groupBy(...groupByFields)

      return context.db.$with('cohort_sizes').as(query)
    }

    // No breakdown - single cohort
    const query = context.db
      .select({
        cohort_size: sql`COUNT(*)`.as('cohort_size')
      })
      .from(sql`cohort_base`)

    return context.db.$with('cohort_sizes').as(query)
  }

  /**
   * Build retention_counts CTE
   * Aggregates retained users per period (and breakdown combination if specified).
   */
  private buildRetentionCountsCTE(
    config: RetentionQueryConfig,
    context: QueryContext,
    breakdownCount: number
  ): WithSubquery {
    // For classic retention: COUNT DISTINCT binding keys per period
    // For rolling retention: would need a different approach (cumulative)

    let query: any

    if (config.retentionType === 'rolling') {
      // Rolling retention: user retained in period N or later
      query = this.buildRollingRetentionCountsQuery(config, context, breakdownCount)
    } else {
      // Classic retention: user retained exactly in period N
      const selectFields: Record<string, any> = {
        period_number: sql`period_number`.as('period_number'),
        retained_users: sql`COUNT(DISTINCT binding_key)`.as('retained_users')
      }
      const groupByFields: SQL[] = [sql`period_number`]

      // Add breakdown columns
      for (let i = 0; i < breakdownCount; i++) {
        selectFields[`breakdown_${i}`] = sql.raw(`breakdown_${i}`).as(`breakdown_${i}`)
        groupByFields.push(sql.raw(`breakdown_${i}`))
      }

      query = context.db
        .select(selectFields)
        .from(sql`activity_periods`)
        .where(sql`period_number >= 0 AND period_number <= ${config.periods}`)
        .groupBy(...groupByFields)
    }

    return context.db.$with('retention_counts').as(query)
  }

  /**
   * Build rolling retention counts query
   * For rolling retention, a user is retained in period N if they were active
   * in period N or any later period
   */
  private buildRollingRetentionCountsQuery(
    config: RetentionQueryConfig,
    context: QueryContext,
    breakdownCount: number
  ): any {
    // Build breakdown column list for GROUP BY
    const breakdownColumns = []
    for (let i = 0; i < breakdownCount; i++) {
      breakdownColumns.push(`breakdown_${i}`)
    }
    const breakdownGroupBy = breakdownColumns.length > 0
      ? `, ${breakdownColumns.join(', ')}`
      : ''

    // Get the max period each user reached (grouped by breakdown if applicable)
    const userMaxPeriods = sql`(
      SELECT
        binding_key,
        ${sql.raw(breakdownColumns.map(c => `${c}`).join(', ') + (breakdownColumns.length > 0 ? ',' : ''))}
        MAX(period_number) as max_period
      FROM activity_periods
      WHERE period_number >= 0 AND period_number <= ${config.periods}
      GROUP BY binding_key${sql.raw(breakdownGroupBy)}
    )`

    // Generate period numbers (0 to config.periods) using database-specific method
    const periodSeriesSubquery = this.databaseAdapter.buildPeriodSeriesSubquery(config.periods)

    // Build SELECT fields
    const selectFields: Record<string, any> = {
      period_number: sql`p.period_number`.as('period_number'),
      retained_users: sql`COUNT(DISTINCT CASE WHEN ump.max_period >= p.period_number THEN ump.binding_key END)`.as('retained_users')
    }
    const groupByFields: SQL[] = [sql`p.period_number`]

    for (let i = 0; i < breakdownCount; i++) {
      selectFields[`breakdown_${i}`] = sql.raw(`ump.breakdown_${i}`).as(`breakdown_${i}`)
      groupByFields.push(sql.raw(`ump.breakdown_${i}`))
    }

    // Cross join and count
    return context.db
      .select(selectFields)
      .from(sql`${userMaxPeriods} ump`)
      .crossJoin(periodSeriesSubquery)
      .groupBy(...groupByFields)
  }

  /**
   * Build period number expression using database-specific DATE_DIFF
   */
  private buildPeriodNumberExpression(
    cohortPeriod: SQL,
    activityPeriod: SQL,
    granularity: 'day' | 'week' | 'month'
  ): SQL {
    // Use the database adapter's date difference method
    return this.databaseAdapter.buildDateDiffPeriods(
      cohortPeriod,
      activityPeriod,
      granularity
    )
  }

  /**
   * Extract dimension name from a dimension reference
   * Handles both 'CubeName.dimName' and just 'dimName' formats
   */
  private extractDimensionName(dimension: string): string {
    const parts = dimension.split('.')
    return parts.length > 1 ? parts[1] : parts[0]
  }
}

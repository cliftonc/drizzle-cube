/**
 * Databend Database Adapter
 * Implements Databend-specific SQL generation for time dimensions, string matching, and type casting
 * Databend uses pgcore (extends PgDialect) so is largely PostgreSQL-compatible
 * Key differences: no ILIKE, uses CASE WHEN for conditional aggregation, TIMESTAMPDIFF for time diffs
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities, type WindowFunctionType, type WindowFunctionConfig } from './base-adapter'

export class DatabendAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'databend' {
    return 'databend'
  }

  /**
   * Databend does not support LATERAL joins
   */
  supportsLateralJoins(): boolean {
    return false
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build Databend INTERVAL from ISO 8601 duration
   * Databend supports INTERVAL n UNIT syntax (e.g., INTERVAL 7 DAY)
   */
  buildIntervalFromISO(duration: string): SQL {
    const parsed = this.parseISODuration(duration)
    const parts: string[] = []

    if (parsed.years) parts.push(`${parsed.years} YEAR`)
    if (parsed.months) parts.push(`${parsed.months} MONTH`)
    if (parsed.days) parts.push(`${parsed.days} DAY`)
    if (parsed.hours) parts.push(`${parsed.hours} HOUR`)
    if (parsed.minutes) parts.push(`${parsed.minutes} MINUTE`)
    if (parsed.seconds) parts.push(`${parsed.seconds} SECOND`)

    // Databend INTERVAL syntax: INTERVAL n UNIT
    // For multiple parts, chain additions
    if (parts.length === 0) return sql`INTERVAL 0 SECOND`
    if (parts.length === 1) return sql`INTERVAL ${sql.raw(parts[0])}`

    // For multiple parts, use addition
    const intervals = parts.map(p => `INTERVAL ${p}`)
    return sql`(${sql.raw(intervals.join(' + '))})`
  }

  /**
   * Build Databend time difference in seconds
   * Uses TIMESTAMPDIFF(SECOND, start, end)
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL {
    return sql`EXTRACT(EPOCH FROM TIMESTAMP_DIFF(${end}, ${start}))`
  }

  /**
   * Build Databend timestamp + interval expression
   * Uses timestamp + INTERVAL n UNIT syntax (Databend doesn't support DATE_ADD function)
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL {
    const interval = this.buildIntervalFromISO(duration)
    return sql`(${timestamp} + ${interval})`
  }

  /**
   * Build Databend conditional aggregation using CASE WHEN
   * FILTER clause support is uncertain in Databend, so use CASE WHEN for safety
   */
  buildConditionalAggregation(
    aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum',
    expr: SQL | null,
    condition: SQL
  ): SQL {
    const fnName = aggFn.toUpperCase()
    if (aggFn === 'count' && !expr) {
      return sql`${sql.raw(fnName)}(CASE WHEN ${condition} THEN 1 END)`
    }
    return sql`${sql.raw(fnName)}(CASE WHEN ${condition} THEN ${expr} END)`
  }

  /**
   * Build Databend date difference in periods using DATE_DIFF
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    return sql`DATE_DIFF('${sql.raw(unit)}', ${startDate}::TIMESTAMP, ${endDate}::TIMESTAMP)`
  }

  /**
   * Build Databend period series using generate_series via numbers table
   * Databend has a numbers() table function that can be used similarly
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL {
    return sql`(SELECT number as period_number FROM numbers(${maxPeriod + 1})) p`
  }

  /**
   * Build Databend time dimension using DATE_TRUNC function
   * Databend supports DATE_TRUNC with quoted granularity like PostgreSQL
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    switch (granularity) {
      case 'year':
        return sql`DATE_TRUNC(YEAR, ${fieldExpr}::TIMESTAMP)`
      case 'quarter':
        return sql`DATE_TRUNC(QUARTER, ${fieldExpr}::TIMESTAMP)`
      case 'month':
        return sql`DATE_TRUNC(MONTH, ${fieldExpr}::TIMESTAMP)`
      case 'week':
        return sql`DATE_TRUNC(WEEK, ${fieldExpr}::TIMESTAMP)`
      case 'day':
        return sql`DATE_TRUNC(DAY, ${fieldExpr}::TIMESTAMP)::TIMESTAMP`
      case 'hour':
        return sql`DATE_TRUNC(HOUR, ${fieldExpr}::TIMESTAMP)`
      case 'minute':
        return sql`DATE_TRUNC(MINUTE, ${fieldExpr}::TIMESTAMP)`
      case 'second':
        return sql`DATE_TRUNC(SECOND, ${fieldExpr}::TIMESTAMP)`
      default:
        return fieldExpr as SQL
    }
  }

  /**
   * Build Databend string matching conditions using LOWER+LIKE fallback
   * Databend does not support ILIKE
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL {
    switch (operator) {
      case 'contains':
        return sql`LOWER(${fieldExpr}) LIKE LOWER(${`%${value}%`})`
      case 'notContains':
        return sql`LOWER(${fieldExpr}) NOT LIKE LOWER(${`%${value}%`})`
      case 'startsWith':
        return sql`LOWER(${fieldExpr}) LIKE LOWER(${`${value}%`})`
      case 'endsWith':
        return sql`LOWER(${fieldExpr}) LIKE LOWER(${`%${value}`})`
      case 'like':
        return sql`${fieldExpr} LIKE ${value}`
      case 'notLike':
        return sql`${fieldExpr} NOT LIKE ${value}`
      case 'ilike':
        return sql`LOWER(${fieldExpr}) LIKE LOWER(${value})`
      case 'regex':
        return sql`${fieldExpr} REGEXP ${value}`
      case 'notRegex':
        return sql`NOT (${fieldExpr} REGEXP ${value})`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build Databend type casting
   * Databend supports both :: syntax and CAST() function
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL {
    switch (targetType) {
      case 'timestamp':
        return sql`${fieldExpr}::TIMESTAMP`
      case 'decimal':
        return sql`${fieldExpr}::DECIMAL`
      case 'integer':
        return sql`${fieldExpr}::INTEGER`
      default:
        throw new Error(`Unsupported cast type: ${targetType}`)
    }
  }

  /**
   * Build Databend AVG aggregation with COALESCE for NULL handling
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COALESCE(AVG(${fieldExpr}), 0)`
  }

  /**
   * Build Databend CASE WHEN conditional expression
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)

    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build Databend boolean literal
   * Databend uses TRUE/FALSE keywords
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values - Databend uses native types
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare date value for Databend
   * Databend accepts Date objects directly
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * Databend stores timestamps as native timestamp types
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * Databend time dimensions already return proper values
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * Databend capabilities - start conservative
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: false,
      supportsWindowFunctions: true,
      supportsFrameClause: true,
      supportsLateralJoins: false,
      supportsPercentileSubqueries: false,
      supportsDerivedTablesInCTE: false // Databend doesn't support derived tables (subqueries) in FROM inside CTEs
    }
  }

  /**
   * Build Databend STDDEV aggregation
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build Databend VARIANCE aggregation
   * Databend doesn't have VAR_POP/VAR_SAMP, but COVAR_POP(x,x) = VAR_POP(x)
   * and COVAR_SAMP(x,x) = VAR_SAMP(x) mathematically
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'COVAR_SAMP' : 'COVAR_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}, ${fieldExpr}), 0)`
  }

  /**
   * Build Databend PERCENTILE aggregation
   * Databend may support QUANTILE or PERCENTILE_CONT - start with unsupported
   */
  buildPercentile(_fieldExpr: AnyColumn | SQL, _percentile: number): SQL {
    throw new Error('Percentile functions are not yet supported for Databend')
  }

  /**
   * Build Databend window function expression
   * Databend has full window function support
   */
  buildWindowFunction(
    type: WindowFunctionType,
    fieldExpr: AnyColumn | SQL | null,
    partitionBy?: (AnyColumn | SQL)[],
    orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>,
    config?: WindowFunctionConfig
  ): SQL {
    // Build OVER clause components
    const partitionClause = partitionBy && partitionBy.length > 0
      ? sql`PARTITION BY ${sql.join(partitionBy, sql`, `)}`
      : sql``

    const orderClause = orderBy && orderBy.length > 0
      ? sql`ORDER BY ${sql.join(orderBy.map(o =>
          o.direction === 'desc' ? sql`${o.field} DESC` : sql`${o.field} ASC`
        ), sql`, `)}`
      : sql``

    // Build frame clause if specified
    let frameClause = sql``
    if (config?.frame) {
      const { type: frameType, start, end } = config.frame
      const frameTypeStr = frameType.toUpperCase()

      const startStr = start === 'unbounded' ? 'UNBOUNDED PRECEDING'
        : typeof start === 'number' ? `${start} PRECEDING`
        : 'CURRENT ROW'

      const endStr = end === 'unbounded' ? 'UNBOUNDED FOLLOWING'
        : end === 'current' ? 'CURRENT ROW'
        : typeof end === 'number' ? `${end} FOLLOWING`
        : 'CURRENT ROW'

      frameClause = sql`${sql.raw(frameTypeStr)} BETWEEN ${sql.raw(startStr)} AND ${sql.raw(endStr)}`
    }

    // Combine OVER clause
    const overParts: SQL[] = []
    if (partitionBy && partitionBy.length > 0) overParts.push(partitionClause)
    if (orderBy && orderBy.length > 0) overParts.push(orderClause)
    if (config?.frame) overParts.push(frameClause)

    const overContent = overParts.length > 0 ? sql.join(overParts, sql` `) : sql``
    const over = sql`OVER (${overContent})`

    // Build the window function based on type
    switch (type) {
      case 'lag':
        return sql`LAG(${fieldExpr}, ${config?.offset ?? 1}${config?.defaultValue !== undefined ? sql`, ${config.defaultValue}` : sql``}) ${over}`
      case 'lead':
        return sql`LEAD(${fieldExpr}, ${config?.offset ?? 1}${config?.defaultValue !== undefined ? sql`, ${config.defaultValue}` : sql``}) ${over}`
      case 'rank':
        return sql`RANK() ${over}`
      case 'denseRank':
        return sql`DENSE_RANK() ${over}`
      case 'rowNumber':
        return sql`ROW_NUMBER() ${over}`
      case 'ntile':
        return sql`NTILE(${config?.nTile ?? 4}) ${over}`
      case 'firstValue':
        return sql`FIRST_VALUE(${fieldExpr}) ${over}`
      case 'lastValue':
        return sql`LAST_VALUE(${fieldExpr}) ${over}`
      case 'movingAvg':
        return sql`AVG(${fieldExpr}) ${over}`
      case 'movingSum':
        return sql`SUM(${fieldExpr}) ${over}`
      default:
        throw new Error(`Unsupported window function: ${type}`)
    }
  }
}

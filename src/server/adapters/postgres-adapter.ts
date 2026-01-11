/**
 * PostgreSQL Database Adapter
 * Implements PostgreSQL-specific SQL generation for time dimensions, string matching, and type casting
 * Extracted from hardcoded logic in executor.ts and multi-cube-builder.ts
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities, type WindowFunctionType, type WindowFunctionConfig } from './base-adapter'

export class PostgresAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'postgres' {
    return 'postgres'
  }

  /**
   * PostgreSQL supports LATERAL joins since version 9.3
   */
  supportsLateralJoins(): boolean {
    return true
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build PostgreSQL INTERVAL from ISO 8601 duration
   * PostgreSQL supports INTERVAL literal syntax: INTERVAL '7 days'
   */
  buildIntervalFromISO(duration: string): SQL {
    const parsed = this.parseISODuration(duration)
    const parts: string[] = []

    if (parsed.years) parts.push(`${parsed.years} years`)
    if (parsed.months) parts.push(`${parsed.months} months`)
    if (parsed.days) parts.push(`${parsed.days} days`)
    if (parsed.hours) parts.push(`${parsed.hours} hours`)
    if (parsed.minutes) parts.push(`${parsed.minutes} minutes`)
    if (parsed.seconds) parts.push(`${parsed.seconds} seconds`)

    const intervalStr = parts.join(' ') || '0 seconds'
    return sql`INTERVAL '${sql.raw(intervalStr)}'`
  }

  /**
   * Build PostgreSQL time difference in seconds using EXTRACT(EPOCH FROM ...)
   * Returns (end - start) as seconds
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL {
    return sql`EXTRACT(EPOCH FROM (${end} - ${start}))`
  }

  /**
   * Build PostgreSQL timestamp + interval expression
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL {
    const interval = this.buildIntervalFromISO(duration)
    return sql`(${timestamp} + ${interval})`
  }

  /**
   * Build PostgreSQL conditional aggregation using FILTER clause
   * PostgreSQL supports the standard SQL FILTER clause for efficient conditional aggregation
   * Example: AVG(time_diff) FILTER (WHERE step_1_time IS NOT NULL)
   */
  buildConditionalAggregation(
    aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum',
    expr: SQL | null,
    condition: SQL
  ): SQL {
    const fnName = aggFn.toUpperCase()
    if (aggFn === 'count' && !expr) {
      return sql`COUNT(*) FILTER (WHERE ${condition})`
    }
    return sql`${sql.raw(fnName)}(${expr}) FILTER (WHERE ${condition})`
  }

  /**
   * Build PostgreSQL time dimension using DATE_TRUNC function
   * Extracted from executor.ts:649-670 and multi-cube-builder.ts:306-320
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // PostgreSQL uses DATE_TRUNC with explicit timestamp casting
    switch (granularity) {
      case 'year':
        return sql`DATE_TRUNC('year', ${fieldExpr}::timestamp)`
      case 'quarter':
        return sql`DATE_TRUNC('quarter', ${fieldExpr}::timestamp)`
      case 'month':
        return sql`DATE_TRUNC('month', ${fieldExpr}::timestamp)`
      case 'week':
        return sql`DATE_TRUNC('week', ${fieldExpr}::timestamp)`
      case 'day':
        // Ensure we return the truncated date as a timestamp
        return sql`DATE_TRUNC('day', ${fieldExpr}::timestamp)::timestamp`
      case 'hour':
        return sql`DATE_TRUNC('hour', ${fieldExpr}::timestamp)`
      case 'minute':
        return sql`DATE_TRUNC('minute', ${fieldExpr}::timestamp)`
      case 'second':
        return sql`DATE_TRUNC('second', ${fieldExpr}::timestamp)`
      default:
        // Fallback to the original expression if granularity is not recognized
        return fieldExpr as SQL
    }
  }

  /**
   * Build PostgreSQL string matching conditions using ILIKE (case-insensitive)
   * Extracted from executor.ts:807-813 and multi-cube-builder.ts:468-474
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL {
    switch (operator) {
      case 'contains':
        return sql`${fieldExpr} ILIKE ${`%${value}%`}`
      case 'notContains':
        return sql`${fieldExpr} NOT ILIKE ${`%${value}%`}`
      case 'startsWith':
        return sql`${fieldExpr} ILIKE ${`${value}%`}`
      case 'endsWith':
        return sql`${fieldExpr} ILIKE ${`%${value}`}`
      case 'like':
        return sql`${fieldExpr} LIKE ${value}`
      case 'notLike':
        return sql`${fieldExpr} NOT LIKE ${value}`
      case 'ilike':
        return sql`${fieldExpr} ILIKE ${value}`
      case 'regex':
        return sql`${fieldExpr} ~* ${value}`
      case 'notRegex':
        return sql`${fieldExpr} !~* ${value}`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build PostgreSQL type casting using :: syntax
   * Extracted from various locations where ::timestamp was used
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL {
    switch (targetType) {
      case 'timestamp':
        return sql`${fieldExpr}::timestamp`
      case 'decimal':
        return sql`${fieldExpr}::decimal`
      case 'integer':
        return sql`${fieldExpr}::integer`
      default:
        throw new Error(`Unsupported cast type: ${targetType}`)
    }
  }


  /**
   * Build PostgreSQL AVG aggregation with COALESCE for NULL handling
   * PostgreSQL AVG returns NULL for empty sets, so we use COALESCE for consistent behavior
   * Extracted from multi-cube-builder.ts:284
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COALESCE(AVG(${fieldExpr}), 0)`
  }


  /**
   * Build PostgreSQL CASE WHEN conditional expression
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)
    
    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build PostgreSQL boolean literal
   * PostgreSQL uses TRUE/FALSE keywords
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values - PostgreSQL uses native types
   * No conversion needed for PostgreSQL
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare date value for PostgreSQL
   * PostgreSQL accepts Date objects directly
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * PostgreSQL stores timestamps as native timestamp types
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * PostgreSQL time dimensions already return proper values
   * No conversion needed
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * PostgreSQL has full support for statistical and window functions
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: true,
      supportsWindowFunctions: true,
      supportsFrameClause: true,
      supportsLateralJoins: true
    }
  }

  /**
   * Build PostgreSQL STDDEV aggregation
   * Uses STDDEV_POP for population, STDDEV_SAMP for sample
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build PostgreSQL VARIANCE aggregation
   * Uses VAR_POP for population, VAR_SAMP for sample
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'VAR_SAMP' : 'VAR_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build PostgreSQL PERCENTILE_CONT aggregation
   * Uses ordered-set aggregate function
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL {
    const pct = percentile / 100
    return sql`PERCENTILE_CONT(${pct}) WITHIN GROUP (ORDER BY ${fieldExpr})`
  }

  /**
   * Build PostgreSQL window function expression
   * PostgreSQL has full window function support
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
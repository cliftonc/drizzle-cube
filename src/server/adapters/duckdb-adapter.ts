/**
 * DuckDB Database Adapter
 * Implements DuckDB-specific SQL generation for time dimensions, string matching, and type casting
 * DuckDB is largely PostgreSQL-compatible but has some differences in funnel functions and advanced features
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities, type WindowFunctionType, type WindowFunctionConfig } from './base-adapter'

export class DuckDBAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'duckdb' {
    return 'duckdb'
  }

  /**
   * DuckDB does not support non-constant LIMIT in correlated subqueries,
   * which is required for the LATERAL join strategy in flow queries.
   * Use window function strategy instead.
   */
  supportsLateralJoins(): boolean {
    return false
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build DuckDB INTERVAL from ISO 8601 duration
   * DuckDB supports PostgreSQL-style INTERVAL literal syntax: INTERVAL '7 days'
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
   * Build DuckDB time difference in seconds using EPOCH() function
   * DuckDB uses EPOCH(timestamp) instead of EXTRACT(EPOCH FROM timestamp)
   * Returns (end - start) as seconds
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL {
    return sql`(EPOCH(${end}) - EPOCH(${start}))`
  }

  /**
   * Build DuckDB timestamp + interval expression
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL {
    const interval = this.buildIntervalFromISO(duration)
    return sql`(${timestamp} + ${interval})`
  }

  /**
   * Build DuckDB conditional aggregation using CASE WHEN
   * DuckDB supports FILTER clause, but CASE WHEN provides broader compatibility
   * Using FILTER clause as DuckDB does support it
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
   * Build DuckDB date difference in periods using DATE_DIFF
   * DuckDB has native DATE_DIFF function with unit support
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    // DuckDB uses DATE_DIFF(part, start, end)
    return sql`DATE_DIFF('${sql.raw(unit)}', ${startDate}::timestamp, ${endDate}::timestamp)`
  }

  /**
   * Build DuckDB time dimension using DATE_TRUNC function
   * DuckDB uses DATE_TRUNC like PostgreSQL
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
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
        return sql`DATE_TRUNC('day', ${fieldExpr}::timestamp)::timestamp`
      case 'hour':
        return sql`DATE_TRUNC('hour', ${fieldExpr}::timestamp)`
      case 'minute':
        return sql`DATE_TRUNC('minute', ${fieldExpr}::timestamp)`
      case 'second':
        return sql`DATE_TRUNC('second', ${fieldExpr}::timestamp)`
      default:
        return fieldExpr as SQL
    }
  }

  /**
   * Build DuckDB string matching conditions using ILIKE (case-insensitive)
   * DuckDB supports ILIKE like PostgreSQL
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
        return sql`regexp_matches(${fieldExpr}, ${value})`
      case 'notRegex':
        return sql`NOT regexp_matches(${fieldExpr}, ${value})`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build DuckDB type casting
   * DuckDB supports both :: syntax and CAST() function
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
   * Build DuckDB AVG aggregation with COALESCE for NULL handling
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COALESCE(AVG(${fieldExpr}), 0)`
  }

  /**
   * Build DuckDB CASE WHEN conditional expression
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)

    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build DuckDB boolean literal
   * DuckDB uses TRUE/FALSE keywords
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values - DuckDB uses native types
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare date value for DuckDB
   * DuckDB accepts Date objects directly
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * DuckDB stores timestamps as native timestamp types
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * DuckDB time dimensions already return proper values
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * DuckDB has full support for statistical and window functions
   * Note: supportsPercentileSubqueries is false because DuckDB's QUANTILE_CONT
   * doesn't work well in scalar subqueries against CTEs in funnel queries
   * Note: supportsLateralJoins is false because DuckDB doesn't support non-constant
   * LIMIT in correlated subqueries, which is required for flow query LATERAL joins
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: true,
      supportsWindowFunctions: true,
      supportsFrameClause: true,
      supportsLateralJoins: false,
      supportsPercentileSubqueries: false
    }
  }

  /**
   * Build DuckDB STDDEV aggregation
   * Uses STDDEV_POP for population, STDDEV_SAMP for sample
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build DuckDB VARIANCE aggregation
   * Uses VAR_POP for population, VAR_SAMP for sample
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'VAR_SAMP' : 'VAR_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build DuckDB PERCENTILE aggregation
   * DuckDB uses QUANTILE_CONT instead of PERCENTILE_CONT
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL {
    const pct = percentile / 100
    return sql`QUANTILE_CONT(${fieldExpr}, ${pct})`
  }

  /**
   * Build DuckDB window function expression
   * DuckDB has full window function support
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

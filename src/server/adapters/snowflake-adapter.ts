/**
 * Snowflake Database Adapter
 * Implements Snowflake-specific SQL generation for time dimensions, string matching, and type casting
 * Snowflake is more SQL-capable than Databend: supports LATERAL joins, native ILIKE,
 * VAR_POP/VAR_SAMP, PERCENTILE_CONT, and window functions.
 * Key difference: uses DATEADD(unit, amount, ts) instead of INTERVAL arithmetic,
 * and TABLE(GENERATOR(ROWCOUNT => n)) instead of generate_series()
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities, type WindowFunctionType, type WindowFunctionConfig } from './base-adapter'

export class SnowflakeAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'snowflake' {
    return 'snowflake'
  }

  /**
   * Snowflake supports LATERAL joins
   */
  supportsLateralJoins(): boolean {
    return true
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build Snowflake INTERVAL from ISO 8601 duration
   * Snowflake doesn't support INTERVAL literal syntax directly in all contexts,
   * so we chain DATEADD calls. For standalone interval expressions, we return
   * a DATEADD chain applied to TIMESTAMP '1970-01-01' and subtract it back.
   * However, buildIntervalFromISO is typically used with buildDateAddInterval,
   * so we return a structured representation.
   */
  buildIntervalFromISO(duration: string): SQL {
    // Snowflake doesn't have a standalone INTERVAL type like PostgreSQL.
    // We convert to total seconds for use in DATEADD.
    const totalSeconds = this.durationToSeconds(duration)
    // Return as a seconds value - callers should use buildDateAddInterval instead
    return sql`${totalSeconds}`
  }

  /**
   * Build Snowflake time difference in seconds
   * Uses DATEDIFF('SECOND', start, end)
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL {
    return sql`DATEDIFF('SECOND', ${start}, ${end})`
  }

  /**
   * Build Snowflake timestamp + interval expression
   * Uses chained DATEADD(unit, amount, timestamp) calls
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL {
    const parsed = this.parseISODuration(duration)
    let result = timestamp

    if (parsed.years) result = sql`DATEADD('YEAR', ${parsed.years}, ${result})`
    if (parsed.months) result = sql`DATEADD('MONTH', ${parsed.months}, ${result})`
    if (parsed.days) result = sql`DATEADD('DAY', ${parsed.days}, ${result})`
    if (parsed.hours) result = sql`DATEADD('HOUR', ${parsed.hours}, ${result})`
    if (parsed.minutes) result = sql`DATEADD('MINUTE', ${parsed.minutes}, ${result})`
    if (parsed.seconds) result = sql`DATEADD('SECOND', ${parsed.seconds}, ${result})`

    return result
  }

  /**
   * Build Snowflake conditional aggregation using CASE WHEN
   * Snowflake supports FILTER clause but CASE WHEN is more portable
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
   * Build Snowflake date difference in periods using DATEDIFF
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    const snowflakeUnit = unit.toUpperCase()
    return sql`DATEDIFF('${sql.raw(snowflakeUnit)}', ${startDate}::TIMESTAMP, ${endDate}::TIMESTAMP)`
  }

  /**
   * Build Snowflake period series using TABLE(GENERATOR(ROWCOUNT => n)) + ROW_NUMBER()
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL {
    return sql`(SELECT ROW_NUMBER() OVER (ORDER BY 1) - 1 AS period_number FROM TABLE(GENERATOR(ROWCOUNT => ${maxPeriod + 1}))) p`
  }

  /**
   * Build Snowflake time dimension using DATE_TRUNC function
   * Snowflake supports DATE_TRUNC with quoted granularity like PostgreSQL
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    switch (granularity) {
      case 'year':
        return sql`DATE_TRUNC('YEAR', ${fieldExpr}::TIMESTAMP)`
      case 'quarter':
        return sql`DATE_TRUNC('QUARTER', ${fieldExpr}::TIMESTAMP)`
      case 'month':
        return sql`DATE_TRUNC('MONTH', ${fieldExpr}::TIMESTAMP)`
      case 'week':
        return sql`DATE_TRUNC('WEEK', ${fieldExpr}::TIMESTAMP)`
      case 'day':
        return sql`DATE_TRUNC('DAY', ${fieldExpr}::TIMESTAMP)::TIMESTAMP`
      case 'hour':
        return sql`DATE_TRUNC('HOUR', ${fieldExpr}::TIMESTAMP)`
      case 'minute':
        return sql`DATE_TRUNC('MINUTE', ${fieldExpr}::TIMESTAMP)`
      case 'second':
        return sql`DATE_TRUNC('SECOND', ${fieldExpr}::TIMESTAMP)`
      default:
        return fieldExpr as SQL
    }
  }

  /**
   * Build Snowflake string matching conditions using native ILIKE
   * Snowflake supports ILIKE natively
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
        return sql`REGEXP_LIKE(${fieldExpr}, ${value})`
      case 'notRegex':
        return sql`NOT REGEXP_LIKE(${fieldExpr}, ${value})`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build Snowflake type casting using :: syntax
   * Snowflake supports both :: syntax and CAST() function
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
   * Build Snowflake AVG aggregation with COALESCE for NULL handling
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COALESCE(AVG(${fieldExpr}), 0)`
  }

  /**
   * Build Snowflake CASE WHEN conditional expression
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)

    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build Snowflake boolean literal
   * Snowflake uses TRUE/FALSE keywords
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values - Snowflake uses native types
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare date value for Snowflake
   * Snowflake accepts Date objects directly
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * Snowflake stores timestamps as native timestamp types
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * Snowflake time dimensions already return proper values
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * Snowflake capabilities - full SQL support
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: true,
      supportsWindowFunctions: true,
      supportsFrameClause: true,
      supportsLateralJoins: true,
      supportsPercentileSubqueries: true,
      supportsDerivedTablesInCTE: true,
      supportsLateralSubqueriesInCTE: false // Snowflake can't correlate LATERAL subqueries with CTE references
    }
  }

  /**
   * Build Snowflake STDDEV aggregation
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build Snowflake VARIANCE aggregation
   * Snowflake supports native VAR_POP/VAR_SAMP
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'VAR_SAMP' : 'VAR_POP'
    return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build Snowflake PERCENTILE_CONT aggregation
   * Uses ordered-set aggregate function
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL {
    // Snowflake requires PERCENTILE_CONT argument to be a constant literal, not a bind variable
    const pct = (percentile / 100).toString()
    return sql`PERCENTILE_CONT(${sql.raw(pct)}) WITHIN GROUP (ORDER BY ${fieldExpr})`
  }

  /**
   * Build Snowflake window function expression
   * Snowflake has full window function support
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

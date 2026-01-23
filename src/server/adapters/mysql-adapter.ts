/**
 * MySQL Database Adapter  
 * Implements MySQL-specific SQL generation for time dimensions, string matching, and type casting
 * Provides MySQL equivalents to PostgreSQL functions
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities, type WindowFunctionType, type WindowFunctionConfig } from './base-adapter'

export class MySQLAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'mysql' | 'singlestore' {
    return 'mysql'
  }

  /**
   * MySQL supports LATERAL joins since version 8.0.14
   */
  supportsLateralJoins(): boolean {
    return true
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build MySQL INTERVAL from ISO 8601 duration
   * MySQL uses DATE_ADD with INTERVAL syntax but intervals must be added separately
   * For simplicity, we convert to seconds for consistent handling
   */
  buildIntervalFromISO(duration: string): SQL {
    const parsed = this.parseISODuration(duration)
    const parts: string[] = []

    // MySQL allows multiple interval additions but for simplicity convert to a single unit
    // We'll use the most significant unit
    if (parsed.years) parts.push(`${parsed.years} YEAR`)
    if (parsed.months) parts.push(`${parsed.months} MONTH`)
    if (parsed.days) parts.push(`${parsed.days} DAY`)
    if (parsed.hours) parts.push(`${parsed.hours} HOUR`)
    if (parsed.minutes) parts.push(`${parsed.minutes} MINUTE`)
    if (parsed.seconds) parts.push(`${parsed.seconds} SECOND`)

    // For MySQL, return the interval as seconds for consistent arithmetic
    const totalSeconds = this.durationToSeconds(duration)
    return sql`${totalSeconds}`
  }

  /**
   * Build MySQL time difference in seconds using TIMESTAMPDIFF
   * Returns (end - start) as seconds
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL {
    return sql`TIMESTAMPDIFF(SECOND, ${start}, ${end})`
  }

  /**
   * Build MySQL timestamp + interval expression
   * Uses DATE_ADD function
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL {
    const parsed = this.parseISODuration(duration)

    // MySQL DATE_ADD supports multiple interval additions
    // Build a chain of DATE_ADD calls for each component
    let result: SQL = timestamp

    if (parsed.years) result = sql`DATE_ADD(${result}, INTERVAL ${parsed.years} YEAR)`
    if (parsed.months) result = sql`DATE_ADD(${result}, INTERVAL ${parsed.months} MONTH)`
    if (parsed.days) result = sql`DATE_ADD(${result}, INTERVAL ${parsed.days} DAY)`
    if (parsed.hours) result = sql`DATE_ADD(${result}, INTERVAL ${parsed.hours} HOUR)`
    if (parsed.minutes) result = sql`DATE_ADD(${result}, INTERVAL ${parsed.minutes} MINUTE)`
    if (parsed.seconds) result = sql`DATE_ADD(${result}, INTERVAL ${parsed.seconds} SECOND)`

    return result
  }

  /**
   * Build MySQL conditional aggregation using CASE WHEN
   * MySQL doesn't support FILTER clause, so we use CASE WHEN pattern
   * Example: AVG(CASE WHEN step_1_time IS NOT NULL THEN time_diff END)
   */
  buildConditionalAggregation(
    aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum',
    expr: SQL | null,
    condition: SQL
  ): SQL {
    const fnName = aggFn.toUpperCase()
    if (aggFn === 'count' && !expr) {
      // COUNT(*) with condition -> COUNT(CASE WHEN condition THEN 1 END)
      return sql`COUNT(CASE WHEN ${condition} THEN 1 END)`
    }
    // AVG/MIN/MAX/SUM -> AGG(CASE WHEN condition THEN expr END)
    return sql`${sql.raw(fnName)}(CASE WHEN ${condition} THEN ${expr} END)`
  }

  /**
   * Build MySQL date difference in periods using TIMESTAMPDIFF
   * For retention analysis period calculations
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    // MySQL TIMESTAMPDIFF returns the number of intervals between two dates
    const mysqlUnit = unit.toUpperCase()
    return sql`TIMESTAMPDIFF(${sql.raw(mysqlUnit)}, ${startDate}, ${endDate})`
  }

  /**
   * Build MySQL time dimension using DATE_FORMAT function
   * MySQL equivalent to PostgreSQL's DATE_TRUNC
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // MySQL uses DATE_FORMAT with specific format strings for truncation
    const formatMap: Record<TimeGranularity, string> = {
      year: '%Y-01-01 00:00:00',
      quarter: '%Y-%q-01 00:00:00', // %q gives quarter (1,2,3,4), but we need to map this properly
      month: '%Y-%m-01 00:00:00', 
      week: '%Y-%u-01 00:00:00', // %u gives week of year
      day: '%Y-%m-%d 00:00:00',
      hour: '%Y-%m-%d %H:00:00',
      minute: '%Y-%m-%d %H:%i:00',
      second: '%Y-%m-%d %H:%i:%s'
    }

    // Special handling for quarter and week since MySQL doesn't have direct equivalents to PostgreSQL
    switch (granularity) {
      case 'quarter':
        // Calculate quarter start date using QUARTER() function
        return sql`DATE_ADD(MAKEDATE(YEAR(${fieldExpr}), 1), INTERVAL (QUARTER(${fieldExpr}) - 1) * 3 MONTH)`
      case 'week':
        // Get start of week (Monday) using MySQL's week functions
        return sql`DATE_SUB(${fieldExpr}, INTERVAL WEEKDAY(${fieldExpr}) DAY)`
      default: {
        const format = formatMap[granularity]
        if (!format) {
          // Fallback to original expression if granularity not recognized
          return fieldExpr as SQL
        }
        return sql`STR_TO_DATE(DATE_FORMAT(${fieldExpr}, ${format}), '%Y-%m-%d %H:%i:%s')`
      }
    }
  }

  /**
   * Build MySQL string matching conditions using LIKE
   * MySQL LIKE is case-insensitive by default (depending on collation)
   * For guaranteed case-insensitive matching, we use LOWER() functions
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL {
    switch (operator) {
      case 'contains':
        return sql`LOWER(${fieldExpr}) LIKE ${`%${value.toLowerCase()}%`}`
      case 'notContains':
        return sql`LOWER(${fieldExpr}) NOT LIKE ${`%${value.toLowerCase()}%`}`
      case 'startsWith':
        return sql`LOWER(${fieldExpr}) LIKE ${`${value.toLowerCase()}%`}`
      case 'endsWith':
        return sql`LOWER(${fieldExpr}) LIKE ${`%${value.toLowerCase()}`}`
      case 'like':
        return sql`${fieldExpr} LIKE ${value}`
      case 'notLike':
        return sql`${fieldExpr} NOT LIKE ${value}`
      case 'ilike':
        // MySQL doesn't have ILIKE, use LOWER() + LIKE for case-insensitive
        return sql`LOWER(${fieldExpr}) LIKE ${value.toLowerCase()}`
      case 'regex':
        return sql`${fieldExpr} REGEXP ${value}`
      case 'notRegex':
        return sql`${fieldExpr} NOT REGEXP ${value}`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build MySQL type casting using CAST() function
   * MySQL equivalent to PostgreSQL's :: casting syntax
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL {
    switch (targetType) {
      case 'timestamp':
        return sql`CAST(${fieldExpr} AS DATETIME)`
      case 'decimal':
        return sql`CAST(${fieldExpr} AS DECIMAL(10,2))`
      case 'integer':
        return sql`CAST(${fieldExpr} AS SIGNED INTEGER)`
      default:
        throw new Error(`Unsupported cast type: ${targetType}`)
    }
  }


  /**
   * Build MySQL AVG aggregation with IFNULL for NULL handling
   * MySQL AVG returns NULL for empty sets, using IFNULL for consistency
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`IFNULL(AVG(${fieldExpr}), 0)`
  }


  /**
   * Build MySQL CASE WHEN conditional expression
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)
    
    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build MySQL boolean literal
   * MySQL uses TRUE/FALSE keywords (equivalent to 1/0)
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values - MySQL uses native types
   * No conversion needed for MySQL
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare date value for MySQL
   * MySQL accepts Date objects directly
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * MySQL stores timestamps as native timestamp types
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * MySQL time dimensions already return proper values
   * No conversion needed
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * MySQL 8.0+ has support for statistical and window functions
   * but not PERCENTILE_CONT
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: false, // MySQL doesn't have PERCENTILE_CONT
      supportsWindowFunctions: true,
      supportsFrameClause: true,
      supportsLateralJoins: true, // MySQL 8.0.14+
      supportsPercentileSubqueries: false // No percentile support anyway
    }
  }

  /**
   * Build MySQL STDDEV aggregation
   * Uses STDDEV_POP for population, STDDEV_SAMP for sample
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
    return sql`IFNULL(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * Build MySQL VARIANCE aggregation
   * Uses VAR_POP for population, VAR_SAMP for sample
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample = false): SQL {
    const fn = useSample ? 'VAR_SAMP' : 'VAR_POP'
    return sql`IFNULL(${sql.raw(fn)}(${fieldExpr}), 0)`
  }

  /**
   * MySQL does not support PERCENTILE_CONT
   * Returns null for graceful degradation
   */
  buildPercentile(_fieldExpr: AnyColumn | SQL, _percentile: number): SQL | null {
    // MySQL doesn't have native PERCENTILE_CONT
    // Return null to trigger graceful degradation
    return null
  }

  /**
   * Build MySQL window function expression
   * MySQL 8.0+ has full window function support
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
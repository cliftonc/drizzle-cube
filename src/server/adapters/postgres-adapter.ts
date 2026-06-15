/**
 * PostgreSQL Database Adapter
 * Implements PostgreSQL-specific SQL generation for time dimensions, string matching, and type casting
 * Extracted from hardcoded logic in executor.ts and multi-cube-builder.ts
 *
 * Inherits shared defaults from BaseDatabaseAdapter (ILIKE string matching, ~* regex,
 * COALESCE null-handling, standard window functions, etc.). Only PostgreSQL-specific
 * SQL generation is implemented here.
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities } from './base-adapter'

export class PostgresAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'postgres' {
    return 'postgres'
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
   * Build PostgreSQL date difference in periods using AGE and EXTRACT
   * For retention analysis period calculations
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    switch (unit) {
      case 'day':
        // Use date subtraction for days
        return sql`(${endDate}::date - ${startDate}::date)`
      case 'week':
        // Calculate week difference
        return sql`FLOOR((${endDate}::date - ${startDate}::date) / 7)`
      case 'month':
        // Use AGE function for accurate month difference
        return sql`(EXTRACT(YEAR FROM AGE(${endDate}::timestamp, ${startDate}::timestamp)) * 12 + EXTRACT(MONTH FROM AGE(${endDate}::timestamp, ${startDate}::timestamp)))::integer`
      default:
        throw new Error(`Unsupported date diff unit: ${unit}`)
    }
  }

  /**
   * Build PostgreSQL period series using generate_series
   * PostgreSQL's generate_series returns a set directly usable as a table
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL {
    return sql`(SELECT generate_series(0, ${maxPeriod}) as period_number) p`
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

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * PostgreSQL has full support for statistical and window functions
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsPercentile: true,
      supportsLateralJoins: true,
      supportsPercentileSubqueries: true,
      supportsLateralSubqueriesInCTE: true
    }
  }

  /**
   * Build PostgreSQL PERCENTILE_CONT aggregation
   * Uses ordered-set aggregate function
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL {
    const pct = percentile / 100
    return sql`PERCENTILE_CONT(${pct}) WITHIN GROUP (ORDER BY ${fieldExpr})`
  }
}

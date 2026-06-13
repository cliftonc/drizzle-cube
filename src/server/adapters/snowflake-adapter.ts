/**
 * Snowflake Database Adapter
 * Implements Snowflake-specific SQL generation for time dimensions, string matching, and type casting
 * Snowflake is more SQL-capable than Databend: supports LATERAL joins, native ILIKE,
 * VAR_POP/VAR_SAMP, PERCENTILE_CONT, and window functions.
 * Key difference: uses DATEADD(unit, amount, ts) instead of INTERVAL arithmetic,
 * and TABLE(GENERATOR(ROWCOUNT => n)) instead of generate_series()
 *
 * Inherits shared defaults from BaseDatabaseAdapter (ILIKE matching, CASE WHEN conditional
 * aggregation, COALESCE null-handling, standard window functions). Only Snowflake-specific SQL is here.
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities } from './base-adapter'

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
   * Snowflake doesn't have a standalone INTERVAL type like PostgreSQL.
   * We convert to total seconds for use in DATEADD; callers should prefer buildDateAddInterval.
   */
  buildIntervalFromISO(duration: string): SQL {
    const totalSeconds = this.durationToSeconds(duration)
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
   * Snowflake uses function-style regex matching: REGEXP_LIKE(field, pattern)
   */
  protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL {
    return negated
      ? sql`NOT REGEXP_LIKE(${fieldExpr}, ${value})`
      : sql`REGEXP_LIKE(${fieldExpr}, ${value})`
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
   * Build Snowflake PERCENTILE_CONT aggregation
   * Uses ordered-set aggregate function
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL {
    // Snowflake requires PERCENTILE_CONT argument to be a constant literal, not a bind variable
    const pct = (percentile / 100).toString()
    return sql`PERCENTILE_CONT(${sql.raw(pct)}) WITHIN GROUP (ORDER BY ${fieldExpr})`
  }
}

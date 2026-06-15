/**
 * MySQL Database Adapter
 * Implements MySQL-specific SQL generation for time dimensions, string matching, and type casting
 * Provides MySQL equivalents to PostgreSQL functions
 *
 * Inherits shared defaults from BaseDatabaseAdapter (CASE WHEN conditional aggregation,
 * standard window functions). Overrides null-handling (IFNULL), the string-matching hooks
 * (no native ILIKE), and the percentile/cast methods.
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities } from './base-adapter'

export class MySQLAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'mysql' | 'singlestore' {
    return 'mysql'
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build MySQL INTERVAL from ISO 8601 duration
   * MySQL has no standalone interval literal usable in arithmetic, so we convert
   * to total seconds for consistent handling.
   */
  buildIntervalFromISO(duration: string): SQL {
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
   * Uses a chain of DATE_ADD calls, one per duration component
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
   * Build MySQL date difference in periods using TIMESTAMPDIFF
   * For retention analysis period calculations
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    // MySQL TIMESTAMPDIFF returns the number of intervals between two dates
    const mysqlUnit = unit.toUpperCase()
    return sql`TIMESTAMPDIFF(${sql.raw(mysqlUnit)}, ${startDate}, ${endDate})`
  }

  /**
   * Build MySQL period series using recursive CTE
   * MySQL 8.0+ supports recursive CTEs for generating sequences
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL {
    return sql`(
      WITH RECURSIVE periods(period_number) AS (
        SELECT 0
        UNION ALL
        SELECT period_number + 1 FROM periods WHERE period_number < ${maxPeriod}
      )
      SELECT period_number FROM periods
    ) p`
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
        // Get start of week (Monday), zeroing the time-of-day so all rows in a
        // week collapse to a single bucket. Keeping the original time component
        // would break GROUP BY (one row per distinct timestamp) and prevent gap
        // filling from matching real rows to generated week buckets.
        return sql`STR_TO_DATE(DATE_FORMAT(DATE_SUB(${fieldExpr}, INTERVAL WEEKDAY(${fieldExpr}) DAY), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H:%i:%s')`
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
   * MySQL has no ILIKE — use LOWER()+LIKE with the pattern lowercased in JS.
   */
  protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL {
    const lowered = pattern.toLowerCase()
    return negated
      ? sql`LOWER(${fieldExpr}) NOT LIKE ${lowered}`
      : sql`LOWER(${fieldExpr}) LIKE ${lowered}`
  }

  /**
   * MySQL regex matching uses the REGEXP operator
   */
  protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL {
    return negated
      ? sql`${fieldExpr} NOT REGEXP ${value}`
      : sql`${fieldExpr} REGEXP ${value}`
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
   * MySQL AVG/STDDEV/VARIANCE use IFNULL (no COALESCE-for-zero idiom mismatch,
   * but IFNULL is the MySQL-idiomatic null guard).
   */
  protected nullToZero(expr: SQL): SQL {
    return sql`IFNULL(${expr}, 0)`
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
      supportsPercentile: false, // MySQL doesn't have PERCENTILE_CONT
      supportsLateralJoins: true, // MySQL 8.0.14+
      supportsPercentileSubqueries: false, // No percentile support anyway
      supportsLateralSubqueriesInCTE: true
    }
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
}

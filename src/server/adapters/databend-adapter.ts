/**
 * Databend Database Adapter
 * Implements Databend-specific SQL generation for time dimensions, string matching, and type casting
 * Databend uses pgcore (extends PgDialect) so is largely PostgreSQL-compatible
 * Key differences: no ILIKE, uses CASE WHEN for conditional aggregation, TIMESTAMPDIFF for time diffs
 *
 * Inherits shared defaults from BaseDatabaseAdapter (CASE WHEN conditional aggregation,
 * COALESCE null-handling, standard window functions). Overrides the string-matching hooks
 * (no native ILIKE) and VARIANCE (no native VAR_POP/VAR_SAMP).
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities } from './base-adapter'

export class DatabendAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'databend' {
    return 'databend'
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
   * Databend supports DATE_TRUNC with unquoted granularity keywords
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
   * Databend has no ILIKE — use LOWER()+LIKE with SQL-side LOWER() on the pattern.
   */
  protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL {
    return negated
      ? sql`LOWER(${fieldExpr}) NOT LIKE LOWER(${pattern})`
      : sql`LOWER(${fieldExpr}) LIKE LOWER(${pattern})`
  }

  /**
   * Databend regex matching uses the REGEXP operator
   */
  protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL {
    return negated
      ? sql`NOT (${fieldExpr} REGEXP ${value})`
      : sql`${fieldExpr} REGEXP ${value}`
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

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * Databend capabilities - start conservative
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsPercentile: false,
      supportsLateralJoins: false,
      supportsPercentileSubqueries: false,
      supportsLateralSubqueriesInCTE: false // Databend doesn't support LATERAL
    }
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
}

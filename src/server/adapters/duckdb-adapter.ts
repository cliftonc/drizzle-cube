/**
 * DuckDB Database Adapter
 * Implements DuckDB-specific SQL generation for time dimensions, string matching, and type casting
 * DuckDB is largely PostgreSQL-compatible but has some differences in funnel functions and advanced features
 *
 * Inherits shared defaults from BaseDatabaseAdapter (ILIKE string matching, COALESCE
 * null-handling, standard window functions, etc.). Only DuckDB-specific SQL is here.
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities } from './base-adapter'

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
   * Build DuckDB conditional aggregation using the FILTER clause
   * DuckDB supports the standard SQL FILTER clause like PostgreSQL
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
   * Build DuckDB period series using UNNEST(generate_series(...))
   * DuckDB's generate_series returns an array, so we need to UNNEST it to get a table
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL {
    return sql`(SELECT UNNEST(generate_series(0, ${maxPeriod})) as period_number) p`
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
   * DuckDB uses function-style regex matching: regexp_matches(field, pattern)
   */
  protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL {
    return negated
      ? sql`NOT regexp_matches(${fieldExpr}, ${value})`
      : sql`regexp_matches(${fieldExpr}, ${value})`
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
      supportsPercentileSubqueries: false,
      supportsDerivedTablesInCTE: true,
      supportsLateralSubqueriesInCTE: false // DuckDB doesn't support LATERAL
    }
  }

  /**
   * Build DuckDB PERCENTILE aggregation
   * DuckDB uses QUANTILE_CONT instead of PERCENTILE_CONT
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL {
    const pct = percentile / 100
    return sql`QUANTILE_CONT(${fieldExpr}, ${pct})`
  }
}

import { SQL, AnyColumn } from 'drizzle-orm';
import { TimeGranularity } from '../types/index.js';
import { BaseDatabaseAdapter, DatabaseCapabilities } from './base-adapter.js';
export declare class DuckDBAdapter extends BaseDatabaseAdapter {
    getEngineType(): 'duckdb';
    /**
     * DuckDB does not support non-constant LIMIT in correlated subqueries,
     * which is required for the LATERAL join strategy in flow queries.
     * Use window function strategy instead.
     */
    /**
     * Build DuckDB INTERVAL from ISO 8601 duration
     * DuckDB supports PostgreSQL-style INTERVAL literal syntax: INTERVAL '7 days'
     */
    buildIntervalFromISO(duration: string): SQL;
    /**
     * Build DuckDB time difference in seconds using EPOCH() function
     * DuckDB uses EPOCH(timestamp) instead of EXTRACT(EPOCH FROM timestamp)
     * Returns (end - start) as seconds
     */
    buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL;
    /**
     * Build DuckDB timestamp + interval expression
     */
    buildDateAddInterval(timestamp: SQL, duration: string): SQL;
    /**
     * Build DuckDB conditional aggregation using the FILTER clause
     * DuckDB supports the standard SQL FILTER clause like PostgreSQL
     */
    buildConditionalAggregation(aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum', expr: SQL | null, condition: SQL): SQL;
    /**
     * Build DuckDB date difference in periods using DATE_DIFF
     * DuckDB has native DATE_DIFF function with unit support
     */
    buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL;
    /**
     * Build DuckDB period series using UNNEST(generate_series(...))
     * DuckDB's generate_series returns an array, so we need to UNNEST it to get a table
     */
    buildPeriodSeriesSubquery(maxPeriod: number): SQL;
    /**
     * Build DuckDB time dimension using DATE_TRUNC function
     * DuckDB uses DATE_TRUNC like PostgreSQL
     */
    buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL;
    /**
     * DuckDB uses function-style regex matching: regexp_matches(field, pattern)
     */
    protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL;
    /**
     * Build DuckDB type casting
     * DuckDB supports both :: syntax and CAST() function
     */
    castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Build DuckDB tolerant type casting using the native TRY_CAST function, which returns
     * NULL on conversion failure instead of raising an error (unlike `::`/CAST).
     */
    tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * DuckDB has full support for statistical and window functions
     * Note: supportsPercentileSubqueries is false because DuckDB's QUANTILE_CONT
     * doesn't work well in scalar subqueries against CTEs in funnel queries
     * Note: supportsLateralJoins is false because DuckDB doesn't support non-constant
     * LIMIT in correlated subqueries, which is required for flow query LATERAL joins
     */
    getCapabilities(): DatabaseCapabilities;
    /**
     * Build DuckDB PERCENTILE aggregation
     * DuckDB uses QUANTILE_CONT instead of PERCENTILE_CONT
     */
    buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL;
}

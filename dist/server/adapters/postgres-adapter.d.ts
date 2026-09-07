import { SQL, AnyColumn } from 'drizzle-orm';
import { TimeGranularity } from '../types/index.js';
import { BaseDatabaseAdapter, DatabaseCapabilities } from './base-adapter.js';
export declare class PostgresAdapter extends BaseDatabaseAdapter {
    getEngineType(): 'postgres';
    /**
     * Build PostgreSQL INTERVAL from ISO 8601 duration
     * PostgreSQL supports INTERVAL literal syntax: INTERVAL '7 days'
     */
    buildIntervalFromISO(duration: string): SQL;
    /**
     * Build PostgreSQL time difference in seconds using EXTRACT(EPOCH FROM ...)
     * Returns (end - start) as seconds
     */
    buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL;
    /**
     * Build PostgreSQL timestamp + interval expression
     */
    buildDateAddInterval(timestamp: SQL, duration: string): SQL;
    /**
     * Build PostgreSQL conditional aggregation using FILTER clause
     * PostgreSQL supports the standard SQL FILTER clause for efficient conditional aggregation
     * Example: AVG(time_diff) FILTER (WHERE step_1_time IS NOT NULL)
     */
    buildConditionalAggregation(aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum', expr: SQL | null, condition: SQL): SQL;
    /**
     * Build PostgreSQL date difference in periods using AGE and EXTRACT
     * For retention analysis period calculations
     */
    buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL;
    /**
     * Build PostgreSQL period series using generate_series
     * PostgreSQL's generate_series returns a set directly usable as a table
     */
    buildPeriodSeriesSubquery(maxPeriod: number): SQL;
    /**
     * Build PostgreSQL time dimension using DATE_TRUNC function
     * Extracted from executor.ts:649-670 and multi-cube-builder.ts:306-320
     */
    buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL;
    /**
     * Build PostgreSQL type casting using :: syntax
     * Extracted from various locations where ::timestamp was used
     */
    castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Build PostgreSQL tolerant type casting: NULL on unparseable input instead of an error.
     * PostgreSQL has no TRY_CAST, and `CAST(x AS type DEFAULT NULL ON ERROR)` (added in a
     * recent PostgreSQL release) requires a minimum server version. This repo pins no minimum
     * PostgreSQL version anywhere (CI/dev docker-compose both run `postgres:18`, but nothing
     * documents that as a floor for consumers), so we don't assume newer syntax is available.
     * Instead, guard the cast with a POSIX regex (`~`) so we only ever attempt to cast values
     * that already look like the target type; anything else short-circuits to NULL before the
     * cast runs, so PostgreSQL never gets a chance to raise.
     *
     * The timestamp guard only validates ISO 8601 *shape* (see timestampTryCastPattern) — it
     * will not catch calendar-invalid dates like 2024-02-30, which would still error. A full
     * guarantee would need a helper SQL function (out of scope here).
     */
    tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * PostgreSQL has full support for statistical and window functions
     */
    getCapabilities(): DatabaseCapabilities;
    /**
     * Build PostgreSQL PERCENTILE_CONT aggregation
     * Uses ordered-set aggregate function
     */
    buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL;
}

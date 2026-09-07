import { SQL, AnyColumn } from 'drizzle-orm';
import { TimeGranularity } from '../types/index.js';
import { BaseDatabaseAdapter, DatabaseCapabilities } from './base-adapter.js';
export declare class SnowflakeAdapter extends BaseDatabaseAdapter {
    getEngineType(): 'snowflake';
    /**
     * Build Snowflake INTERVAL from ISO 8601 duration
     * Snowflake doesn't have a standalone INTERVAL type like PostgreSQL.
     * We convert to total seconds for use in DATEADD; callers should prefer buildDateAddInterval.
     */
    buildIntervalFromISO(duration: string): SQL;
    /**
     * Build Snowflake time difference in seconds
     * Uses DATEDIFF('SECOND', start, end)
     */
    buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL;
    /**
     * Build Snowflake timestamp + interval expression
     * Uses chained DATEADD(unit, amount, timestamp) calls
     */
    buildDateAddInterval(timestamp: SQL, duration: string): SQL;
    /**
     * Build Snowflake date difference in periods using DATEDIFF
     */
    buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL;
    /**
     * Build Snowflake period series using TABLE(GENERATOR(ROWCOUNT => n)) + ROW_NUMBER()
     */
    buildPeriodSeriesSubquery(maxPeriod: number): SQL;
    /**
     * Build Snowflake time dimension using DATE_TRUNC function
     * Snowflake supports DATE_TRUNC with quoted granularity like PostgreSQL
     */
    buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL;
    /**
     * Snowflake uses function-style regex matching: REGEXP_LIKE(field, pattern)
     */
    protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL;
    /**
     * Build Snowflake type casting using :: syntax
     * Snowflake supports both :: syntax and CAST() function
     */
    castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Build Snowflake tolerant type casting using the native TRY_CAST function, which returns
     * NULL on conversion failure instead of raising an error (unlike `::`/CAST). Snowflake's
     * TRY_CAST supports VARCHAR, NUMBER-family types (including DECIMAL) and TIMESTAMP.
     */
    tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Snowflake capabilities - full SQL support
     */
    getCapabilities(): DatabaseCapabilities;
    /**
     * Build Snowflake PERCENTILE_CONT aggregation
     * Uses ordered-set aggregate function
     */
    buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL;
}

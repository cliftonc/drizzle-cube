import { SQL, AnyColumn } from 'drizzle-orm';
import { TimeGranularity } from '../types/index.js';
import { BaseDatabaseAdapter, DatabaseCapabilities } from './base-adapter.js';
export declare class DatabendAdapter extends BaseDatabaseAdapter {
    getEngineType(): 'databend';
    /**
     * Build Databend INTERVAL from ISO 8601 duration
     * Databend supports INTERVAL n UNIT syntax (e.g., INTERVAL 7 DAY)
     */
    buildIntervalFromISO(duration: string): SQL;
    /**
     * Build Databend time difference in seconds
     * Uses TIMESTAMPDIFF(SECOND, start, end)
     */
    buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL;
    /**
     * Build Databend timestamp + interval expression
     * Uses timestamp + INTERVAL n UNIT syntax (Databend doesn't support DATE_ADD function)
     */
    buildDateAddInterval(timestamp: SQL, duration: string): SQL;
    /**
     * Build Databend date difference in periods using DATE_DIFF
     */
    buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL;
    /**
     * Build Databend period series using generate_series via numbers table
     * Databend has a numbers() table function that can be used similarly
     */
    buildPeriodSeriesSubquery(maxPeriod: number): SQL;
    /**
     * Build Databend time dimension using DATE_TRUNC function
     * Databend supports DATE_TRUNC with unquoted granularity keywords
     */
    buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL;
    /**
     * Databend has no ILIKE — use LOWER()+LIKE with SQL-side LOWER() on the pattern.
     */
    protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL;
    /**
     * Databend regex matching uses the REGEXP operator
     */
    protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL;
    /**
     * Build Databend type casting
     * Databend supports both :: syntax and CAST() function
     */
    castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Build Databend tolerant type casting using the native TRY_CAST function, which returns
     * NULL on conversion failure instead of raising an error (unlike `::`/CAST).
     */
    tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Databend capabilities - start conservative
     */
    getCapabilities(): DatabaseCapabilities;
    /**
     * Build Databend VARIANCE aggregation
     * Databend doesn't have VAR_POP/VAR_SAMP, but COVAR_POP(x,x) = VAR_POP(x)
     * and COVAR_SAMP(x,x) = VAR_SAMP(x) mathematically
     */
    buildVariance(fieldExpr: AnyColumn | SQL, useSample?: boolean): SQL;
    /**
     * Build Databend PERCENTILE aggregation
     * Databend may support QUANTILE or PERCENTILE_CONT - start with unsupported
     */
    buildPercentile(_fieldExpr: AnyColumn | SQL, _percentile: number): SQL;
}

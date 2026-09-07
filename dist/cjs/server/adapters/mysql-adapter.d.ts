import { SQL, AnyColumn } from 'drizzle-orm';
import { TimeGranularity } from '../types/index.js';
import { BaseDatabaseAdapter, DatabaseCapabilities } from './base-adapter.js';
export declare class MySQLAdapter extends BaseDatabaseAdapter {
    getEngineType(): 'mysql' | 'singlestore';
    /**
     * Build MySQL INTERVAL from ISO 8601 duration
     * MySQL has no standalone interval literal usable in arithmetic, so we convert
     * to total seconds for consistent handling.
     */
    buildIntervalFromISO(duration: string): SQL;
    /**
     * Build MySQL time difference in seconds using TIMESTAMPDIFF
     * Returns (end - start) as seconds
     */
    buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL;
    /**
     * Build MySQL timestamp + interval expression
     * Uses a chain of DATE_ADD calls, one per duration component
     */
    buildDateAddInterval(timestamp: SQL, duration: string): SQL;
    /**
     * Build MySQL date difference in periods using TIMESTAMPDIFF
     * For retention analysis period calculations
     */
    buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL;
    /**
     * Build MySQL period series using recursive CTE
     * MySQL 8.0+ supports recursive CTEs for generating sequences
     */
    buildPeriodSeriesSubquery(maxPeriod: number): SQL;
    /**
     * Build MySQL time dimension using DATE_FORMAT function
     * MySQL equivalent to PostgreSQL's DATE_TRUNC
     */
    buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL;
    /**
     * MySQL has no ILIKE — use LOWER()+LIKE with the pattern lowercased in JS.
     */
    protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL;
    /**
     * MySQL regex matching uses the REGEXP operator
     */
    protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL;
    /**
     * Build MySQL type casting using CAST() function
     * MySQL equivalent to PostgreSQL's :: casting syntax
     */
    castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Build MySQL tolerant type casting: NULL on unparseable input instead of MySQL's usual
     * lenient-but-wrong behaviour. `CAST(x AS DECIMAL/SIGNED)` parses a leading numeric prefix
     * (or returns 0 with a warning if there's no numeric prefix at all) rather than erroring —
     * so a dirty value like 'n/a' silently becomes 0. `CAST(x AS DATETIME)` on a string that
     * merely looks date-shaped but is calendar-invalid can, depending on sql_mode, raise an
     * error (strict mode, the MySQL 8 default) rather than returning NULL. Guard all three with
     * REGEXP so we only ever attempt the cast on input that already looks like the target type;
     * anything else short-circuits to NULL first.
     *
     * The timestamp guard only validates ISO 8601 *shape* — it will not catch calendar-invalid
     * dates like 2024-02-30, which could still error under strict SQL mode.
     */
    tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * MySQL AVG/STDDEV/VARIANCE use IFNULL (no COALESCE-for-zero idiom mismatch,
     * but IFNULL is the MySQL-idiomatic null guard).
     */
    protected nullToZero(expr: SQL): SQL;
    /**
     * MySQL 8.0+ has support for statistical and window functions
     * but not PERCENTILE_CONT
     */
    getCapabilities(): DatabaseCapabilities;
    /**
     * MySQL does not support PERCENTILE_CONT
     * Returns null for graceful degradation
     */
    buildPercentile(_fieldExpr: AnyColumn | SQL, _percentile: number): SQL | null;
}

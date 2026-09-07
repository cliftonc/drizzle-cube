import { SQL, AnyColumn } from 'drizzle-orm';
import { TimeGranularity } from '../types/index.js';
import { BaseDatabaseAdapter, DatabaseCapabilities } from './base-adapter.js';
export declare class SQLiteAdapter extends BaseDatabaseAdapter {
    getEngineType(): 'sqlite';
    /**
     * Build SQLite INTERVAL from ISO 8601 duration
     * SQLite doesn't have native interval types, so we convert to seconds
     * for arithmetic operations on Unix timestamps
     */
    buildIntervalFromISO(duration: string): SQL;
    /**
     * Build SQLite time difference in seconds
     * SQLite timestamps are stored as Unix seconds, so simple subtraction works
     * Returns (end - start) as seconds
     */
    buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL;
    /**
     * Build SQLite timestamp + interval expression
     * Since SQLite stores timestamps as Unix seconds, just add the seconds
     */
    buildDateAddInterval(timestamp: SQL, duration: string): SQL;
    /**
     * Build SQLite date difference in periods
     * SQLite uses Julian day calculations for date arithmetic
     * Note: SQLite timestamps are stored as Unix seconds
     */
    buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL;
    /**
     * Build SQLite period series using recursive CTE
     * SQLite 3.8.3+ supports recursive CTEs for generating sequences
     */
    buildPeriodSeriesSubquery(maxPeriod: number): SQL;
    /**
     * Build SQLite time dimension using date/datetime functions with modifiers
     * For integer timestamp columns (milliseconds), first convert to datetime
     * SQLite doesn't have DATE_TRUNC like PostgreSQL, so we use strftime and date modifiers
     * Returns datetime strings for consistency with other databases
     */
    buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL;
    /**
     * SQLite has no ILIKE — use LOWER()+LIKE with the pattern lowercased in JS.
     */
    protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL;
    /**
     * SQLite regex requires loading an extension, so GLOB is used as a fallback.
     */
    protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL;
    /**
     * Build SQLite type casting using CAST() function
     * SQLite has dynamic typing but supports CAST for consistency
     */
    castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * Build SQLite tolerant type casting: NULL on unparseable input instead of SQLite's usual
     * dynamic-typing behaviour. SQLite's CAST-to-numeric applies "prefix" conversion — the
     * longest numeric prefix of the string is used, or 0 if there is none — so `CAST('n/a' AS
     * REAL)` silently yields 0.0 rather than erroring or returning NULL.
     *
     * SQLite has no REGEXP operator by default (it requires loading an extension, same
     * limitation regexCondition() works around with GLOB). GLOB's `*`/`?`/`[...]` syntax can't
     * express "one or more digits" directly, but the standard SQLite idiom for "string contains
     * only characters from a set" is `NOT x GLOB '*[^set]*'` — true only if no character outside
     * the set appears anywhere. That's what's used below to validate the trimmed value contains
     * only the characters a valid decimal/integer/epoch-ms value could use, before attempting
     * the cast; empty/whitespace-only strings are excluded separately.
     *
     * Known limitation: this is a character-set check, not a full grammar check, so a malformed
     * value that still only uses allowed characters (e.g. '1.2.3' or '+-5') passes the guard and
     * is then handled by SQLite's own prefix-based numeric parsing (never an error, but not
     * necessarily NULL either). Clearly non-numeric input (letters, 'n/a', punctuation outside
     * the allowed set) is reliably rejected to NULL, which is the case this method exists for.
     */
    tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL;
    /**
     * SQLite AVG uses IFNULL rather than COALESCE for null-to-zero handling.
     */
    protected nullToZero(expr: SQL): SQL;
    /**
     * Build SQLite CASE WHEN conditional expression.
     * Unlike the base implementation, SQLite must detect embedded SQL objects in THEN/ELSE
     * and inline them rather than binding them as parameters.
     */
    buildCaseWhen(conditions: Array<{
        when: SQL;
        then: any;
    }>, elseValue?: any): SQL;
    /**
     * Build SQLite boolean literal
     * SQLite uses 1/0 for true/false
     */
    buildBooleanLiteral(value: boolean): SQL;
    /**
     * Preprocess calculated measure templates for SQLite-specific handling
     *
     * SQLite performs integer division by default (5/2 = 2 instead of 2.5).
     * This method wraps division operands with CAST to REAL to ensure float division.
     *
     * Pattern matched: {measure1} / {measure2} or {measure1} / NULLIF({measure2}, 0)
     * Transforms to: CAST({measure1} AS REAL) / ...
     *
     * @param calculatedSql - Template string with {member} references
     * @returns Preprocessed template with CAST for division operations
     */
    preprocessCalculatedTemplate(calculatedSql: string): string;
    /**
     * Convert filter values to SQLite-compatible types
     * SQLite doesn't support boolean types - convert boolean to integer (1/0)
     * Convert Date objects to milliseconds for integer timestamp columns
     */
    convertFilterValue(value: any): any;
    /**
     * Prepare date value for SQLite integer timestamp storage
     * Convert Date objects to milliseconds (Unix timestamp * 1000)
     */
    prepareDateValue(date: Date): any;
    /**
     * SQLite stores timestamps as integers (milliseconds)
     */
    isTimestampInteger(): boolean;
    /**
     * SQLite has limited statistical support (no native STDDEV/VARIANCE/PERCENTILE)
     * but supports window functions since SQLite 3.25
     */
    getCapabilities(): DatabaseCapabilities;
    /**
     * SQLite does not have native STDDEV
     * Returns null for graceful degradation
     */
    buildStddev(_fieldExpr: AnyColumn | SQL, _useSample?: boolean): SQL | null;
    /**
     * SQLite does not have native VARIANCE
     * Returns null for graceful degradation
     */
    buildVariance(_fieldExpr: AnyColumn | SQL, _useSample?: boolean): SQL | null;
    /**
     * SQLite does not have native PERCENTILE
     * Returns null for graceful degradation
     */
    buildPercentile(_fieldExpr: AnyColumn | SQL, _percentile: number): SQL | null;
}

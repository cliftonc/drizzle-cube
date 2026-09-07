import { SQL, AnyColumn } from 'drizzle-orm';
import { QueryContext } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
export declare class DateTimeBuilder {
    private databaseAdapter;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Build time dimension expression with granularity using database adapter
     */
    buildTimeDimensionExpression(dimensionSql: any, granularity: string | undefined, context: QueryContext): SQL;
    /**
     * Build date range condition for time dimensions
     */
    buildDateRangeCondition(fieldExpr: AnyColumn | SQL, dateRange: string | string[]): SQL | null;
    private rangeBetween;
    /** Shift a normalized end value to end-of-day when its source was a date-only string. */
    private endOfDayValue;
    private buildArrayDateRangeCondition;
    private buildStringDateRangeCondition;
    /**
     * Parse relative date range expressions like "today", "yesterday", "last 7 days", "this month", etc.
     * Handles all 14 DATE_RANGE_OPTIONS from the client
     */
    parseRelativeDateRange(dateRange: string): {
        start: Date;
        end: Date;
    } | null;
    /**
     * Normalize date values to handle strings, numbers, and Date objects
     * Returns ISO string for PostgreSQL/MySQL, Unix timestamp for SQLite, or null
     * Ensures dates are in the correct format for each database engine
     */
    normalizeDate(value: any): string | number | null;
}

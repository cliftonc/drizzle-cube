import { DatabaseAdapter } from '../adapters/base-adapter.js';
/**
 * Convert a millisecond epoch to the engine's wire format:
 * - SQLite: Unix seconds (integer)
 * - other integer-timestamp engines: Unix milliseconds (integer)
 * - PostgreSQL/MySQL: ISO string
 */
export declare function epochMsToEngineValue(databaseAdapter: DatabaseAdapter, timeMs: number): string | number;
/**
 * Convert a Date to the engine's wire format (see epochMsToEngineValue).
 */
export declare function dateToEngineValue(databaseAdapter: DatabaseAdapter, date: Date): string | number;
/**
 * Reconstruct a Date from a normalized value (the output of normalizeDate):
 * a SQLite Unix-seconds integer, a millisecond integer, or an ISO string.
 */
export declare function engineValueToDate(databaseAdapter: DatabaseAdapter, value: string | number): Date;
/** Detect a date-only string (YYYY-MM-DD). */
export declare function isDateOnlyString(value: unknown): value is string;
/**
 * Normalize a date value to the engine's wire format, or null when falsy or
 * unparseable.
 */
export declare function normalizeDateValue(databaseAdapter: DatabaseAdapter, value: any): string | number | null;
type DateRange = {
    start: Date;
    end: Date;
};
/**
 * Parse relative date range expressions like "today", "yesterday",
 * "last 7 days", "this month", etc. Handles all 14 DATE_RANGE_OPTIONS.
 */
export declare function parseRelativeDateRangeValue(dateRange: string): DateRange | null;
export {};

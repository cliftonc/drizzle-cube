import { SemanticQuery } from './types/query.js';
import { TimeGranularity } from './types/core.js';
/**
 * Maximum number of time buckets gap filling will generate. Beyond this, gap
 * filling is skipped entirely (data is returned unmodified) to avoid both
 * runaway memory use and silent truncation of real rows.
 */
export declare const MAX_GAP_FILL_BUCKETS = 10000;
export interface GapFillerConfig {
    /** The time dimension key (e.g., 'Sales.date') */
    timeDimensionKey: string;
    /** Time granularity for bucket generation */
    granularity: TimeGranularity;
    /** Date range [start, end] */
    dateRange: [Date, Date];
    /** Value to fill for missing measures (default: 0) */
    fillValue: number | null;
    /** List of measure keys in the data */
    measures: string[];
    /** List of dimension keys in the data (excluding time dimensions) */
    dimensions: string[];
}
/**
 * Generate all time buckets for a given date range and granularity
 */
export declare function generateTimeBuckets(startDate: Date, endDate: Date, granularity: TimeGranularity): Date[];
/**
 * Fill time series gaps in query result data
 *
 * @param data - Original query result data
 * @param config - Gap filling configuration
 * @returns Data with gaps filled
 */
export declare function fillTimeSeriesGaps(data: Record<string, unknown>[], config: GapFillerConfig): Record<string, unknown>[];
/**
 * Parse date range from query time dimension
 * Handles both array format ['2024-01-01', '2024-01-31'] and string format
 */
export declare function parseDateRange(dateRange: string | string[] | undefined): [Date, Date] | null;
/**
 * Apply gap filling to query result data based on query configuration
 *
 * @param data - Original query result data
 * @param query - The semantic query
 * @param measures - List of measure names in the result
 * @returns Data with gaps filled (if applicable)
 */
export declare function applyGapFilling(data: Record<string, unknown>[], query: SemanticQuery, measures: string[]): Record<string, unknown>[];

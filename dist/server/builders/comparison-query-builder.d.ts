import { SemanticQuery, TimeDimension, QueryResult, TimeGranularity } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
/**
 * Normalized period range with start/end dates and metadata
 */
export interface NormalizedPeriod {
    /** Start date of the period */
    start: Date;
    /** End date of the period */
    end: Date;
    /** Human-readable label for the period */
    label: string;
    /** Index in the comparison (0 = first/current, 1 = second/prior, etc.) */
    index: number;
}
/**
 * Extended result row with period metadata for alignment
 */
export interface ComparisonResultRow extends Record<string, unknown> {
    /** Period label (e.g., "2024-01-01 - 2024-01-31") */
    __period: string;
    /** Period index (0 = current, 1 = prior, etc.) */
    __periodIndex: number;
    /** Day-of-period index for alignment in overlay mode */
    __periodDayIndex: number;
}
export declare class ComparisonQueryBuilder {
    private dateTimeBuilder;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Check if a query contains compareDateRange
     */
    hasComparison(query: SemanticQuery): boolean;
    /**
     * Get the time dimension with compareDateRange
     */
    getComparisonTimeDimension(query: SemanticQuery): TimeDimension | undefined;
    /**
     * Normalize compareDateRange entries to concrete date ranges
     * Handles both relative strings ('last 30 days') and explicit arrays (['2024-01-01', '2024-01-31'])
     */
    normalizePeriods(compareDateRange: (string | [string, string])[]): NormalizedPeriod[];
    /**
     * Create sub-query for a specific period
     * Replaces compareDateRange with a concrete dateRange for that period
     */
    createPeriodQuery(query: SemanticQuery, period: NormalizedPeriod): SemanticQuery;
    /**
     * Calculate the day-of-period index for a date
     * Used for aligning data points across periods in overlay mode
     */
    calculatePeriodDayIndex(date: Date | string, periodStart: Date, granularity: TimeGranularity): number;
    /**
     * Add period metadata to result rows
     */
    addPeriodMetadata(data: Record<string, unknown>[], period: NormalizedPeriod, timeDimensionKey: string, granularity: TimeGranularity): ComparisonResultRow[];
    /**
     * Merge results from multiple period queries
     * Adds period metadata and creates combined result with annotation
     */
    mergeComparisonResults(periodResults: Array<{
        result: QueryResult;
        period: NormalizedPeriod;
    }>, timeDimension: TimeDimension, granularity: TimeGranularity): QueryResult;
    /**
     * Sort merged results by period index and then by time dimension
     * Ensures consistent ordering for client-side processing
     */
    sortComparisonResults(data: ComparisonResultRow[], timeDimensionKey: string): ComparisonResultRow[];
}

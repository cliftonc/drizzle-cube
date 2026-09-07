import { CubeMetadata } from '../types/metadata.js';
/** Format a Date as a YYYY-MM-DD string (UTC). */
export declare function formatDate(d: Date): string;
/** Resolve a numeric "last N days/weeks/months" expression. */
export declare function parseRelativeNExpression(n: number, lowerText: string): {
    dateRange: [string, string];
    granularity?: string;
} | null;
/** Resolve a "Q1".."Q4" quarter expression for the current year. */
export declare function parseQuarterExpression(quarterMatch: string): {
    dateRange: [string, string];
    granularity?: string;
};
/**
 * Match measures in the primary cube against keywords in the text.
 * Mutates `measures`/`reasoning` and returns the confidence delta to apply.
 */
export declare function matchMeasuresInText(primaryCube: CubeMetadata, lowerText: string, measures: string[], reasoning: string[]): number;
/** Aggregation intent shape produced by detectAggregationIntent. */
export interface AggregationIntent {
    type: 'sum' | 'count' | 'avg' | 'max' | 'min';
    confidence: number;
}
/**
 * Backfill measures when none matched directly, using the aggregation intent.
 * Mutates `measures`/`reasoning`.
 */
export declare function applyAggregationFallback(primaryCube: CubeMetadata, aggregationIntent: AggregationIntent, measures: string[], reasoning: string[]): void;
/**
 * Resolve grouping dimensions from grouping keywords and explicit "by/per X" text.
 * Mutates `dimensions`/`reasoning` and returns the confidence delta to apply.
 */
export declare function matchDimensions(relevantCubes: CubeMetadata[], groupingKeywords: string[], lowerText: string, dimensions: string[], reasoning: string[]): number;

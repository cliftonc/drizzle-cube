import { CubeResultSet, CubeQuery, QueryMergeStrategy } from '../types.js';
/**
 * Metadata fields injected into multi-query data
 */
export interface MultiQueryMetadata {
    __queryIndex: number;
    __queryLabel: string;
}
/**
 * Check if data contains multi-query metadata
 */
export declare function isMultiQueryData(data: unknown[]): boolean;
/**
 * Get unique query labels from multi-query data
 */
export declare function getQueryLabels(data: unknown[]): string[];
/**
 * Get query indices from multi-query data
 */
export declare function getQueryIndices(data: unknown[]): number[];
/**
 * Merge results using 'concat' strategy
 * Appends all rows with __queryIndex and __queryLabel metadata
 *
 * @param resultSets - Array of CubeResultSet from each query
 * @param queries - Original CubeQuery objects
 * @param labels - Optional user-defined labels per query
 * @returns Merged data array with query metadata
 */
export declare function mergeResultsConcat(resultSets: CubeResultSet[], _queries: CubeQuery[], labels?: string[]): unknown[];
/**
 * Merge results using 'merge' strategy
 * Aligns data by common dimensions (composite key), combining measures from all queries
 *
 * Example:
 *   Query 1: [{ date: '2024-01', revenue: 100 }]
 *   Query 2: [{ date: '2024-01', cost: 50 }]
 *   Result:  [{ date: '2024-01', revenue: 100, cost: 50 }]
 *
 * If multiple queries have the same measure, the first query's value is used.
 *
 * @param resultSets - Array of CubeResultSet from each query
 * @param queries - Original CubeQuery objects
 * @param mergeKeys - Dimension fields to align data on (composite key)
 * @param _labels - Optional user-defined labels per query (unused, kept for API compatibility)
 * @returns Merged data array with combined measures
 */
export declare function mergeResultsByKey(resultSets: CubeResultSet[], queries: CubeQuery[], mergeKeys: string[], _labels?: string[]): unknown[];
/**
 * Main entry point for merging query results
 * Delegates to appropriate strategy implementation
 *
 * @param resultSets - Array of CubeResultSet from each query
 * @param queries - Original CubeQuery objects
 * @param strategy - Merge strategy ('concat' or 'merge')
 * @param mergeKeys - Dimension fields to align on (required for 'merge' strategy)
 * @param labels - Optional user-defined labels per query
 * @returns Merged data array
 */
export declare function mergeQueryResults(resultSets: CubeResultSet[], queries: CubeQuery[], strategy: QueryMergeStrategy, mergeKeys?: string[], labels?: string[]): unknown[];
/**
 * Get combined fields from all queries
 * Used for chart configuration to show all available measures/dimensions
 *
 * @param queries - Array of CubeQuery objects
 * @param _labels - Optional user-defined labels per query (unused, kept for API compatibility)
 * @returns Object containing combined measures, dimensions, and time dimensions
 */
export declare function getCombinedFields(queries: CubeQuery[], _labels?: string[]): {
    measures: string[];
    dimensions: string[];
    timeDimensions: string[];
};
/**
 * Generate a default label for a query based on its measures
 * Used when user doesn't provide custom labels
 */
export declare function generateQueryLabel(query: CubeQuery, index: number): string;
/**
 * Validate merge key exists in all queries
 * Returns validation result with details
 */
export declare function validateMergeKey(queries: CubeQuery[], mergeKey: string): {
    isValid: boolean;
    missingInQueries: number[];
};

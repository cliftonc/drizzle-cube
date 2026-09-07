import { CubeQuery, QueryMergeStrategy } from '../types.js';
type TimeDimension = NonNullable<CubeQuery['timeDimensions']>[number];
/**
 * Validation error for multi-query configuration
 */
export interface MultiQueryValidationError {
    type: 'missing_time_dimension' | 'granularity_mismatch' | 'missing_merge_key';
    queryIndex: number;
    message: string;
    details?: {
        field?: string;
        expectedGranularity?: string;
        actualGranularity?: string;
    };
}
/**
 * Validation warning for multi-query configuration
 */
export interface MultiQueryValidationWarning {
    type: 'measure_collision' | 'asymmetric_date_range';
    queryIndices: number[];
    message: string;
    affectedMeasures?: string[];
}
/**
 * Result of multi-query validation
 */
export interface MultiQueryValidationResult {
    isValid: boolean;
    errors: MultiQueryValidationError[];
    warnings: MultiQueryValidationWarning[];
}
/**
 * Extract time dimension info from a query
 */
export declare function extractTimeDimensions(query: CubeQuery): TimeDimension[];
/**
 * Validate that all queries have matching time dimension granularities
 * Only relevant for 'merge' strategy where data needs to align
 */
export declare function validateTimeDimensionAlignment(queries: CubeQuery[]): MultiQueryValidationError[];
/**
 * Validate that merge keys exist in all queries
 */
export declare function validateMergeKeys(queries: CubeQuery[], mergeKeys: string[]): MultiQueryValidationError[];
/**
 * Detect when the same measure appears in multiple queries
 * This is a warning since the first value wins in merge mode
 */
export declare function detectMeasureCollisions(queries: CubeQuery[]): MultiQueryValidationWarning[];
/**
 * Check if queries have different date ranges
 */
export declare function detectAsymmetricDateRanges(queries: CubeQuery[]): MultiQueryValidationWarning[];
/**
 * Validate a multi-query configuration
 * For 'merge' strategy: strict validation (errors block execution)
 * For 'concat' and 'funnel' strategies: only warnings
 */
export declare function validateMultiQueryConfig(queries: CubeQuery[], mergeStrategy: QueryMergeStrategy, mergeKeys?: string[]): MultiQueryValidationResult;
/**
 * Check if a multi-query configuration is valid for execution
 */
export declare function isMultiQueryValid(queries: CubeQuery[]): boolean;
/**
 * Get human-readable validation summary
 */
export declare function getValidationSummary(result: MultiQueryValidationResult): string;
export {};

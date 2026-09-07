/**
 * Utility functions for handling target values in charts
 */
/**
 * Parse target values from string format
 * @param targetString - String containing target values (e.g., "100" or "50,75,100")
 * @returns Array of numeric target values
 */
export declare function parseTargetValues(targetString: string): number[];
/**
 * Spread target values across data points
 * @param targets - Array of target values
 * @param dataLength - Number of data points to spread across
 * @returns Array of target values for each data point
 */
export declare function spreadTargetValues(targets: number[], dataLength: number): number[];
/**
 * Calculate variance between actual and target values
 * @param actual - Actual value
 * @param target - Target value
 * @returns Variance as percentage
 */
export declare function calculateVariance(actual: number, target: number): number;
/**
 * Format variance as percentage string with appropriate sign and color indication
 * @param variance - Variance percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted variance string (e.g., "+12.5%" or "-8.3%")
 */
export declare function formatVariance(variance: number, decimals?: number): string;
/**
 * Get unique target values for reference lines
 * @param targets - Array of target values (may contain duplicates)
 * @returns Array of unique target values
 */
export declare function getUniqueTargets(targets: number[]): number[];

/**
 * Utility functions for detecting incomplete time periods in KPI charts
 */
/**
 * Get the end date of a period based on granularity
 * @param date - The date within the period
 * @param granularity - The time granularity (day, week, month, quarter, year)
 * @returns The end date of the period (end of day)
 */
export declare function getPeriodEndDate(date: Date, granularity: string): Date;
/**
 * Check if the last period in the data is complete based on granularity
 * @param lastDataPoint - The last data point in the sorted dataset
 * @param timeDimensionField - The field name containing the time value
 * @param granularity - The time granularity
 * @returns true if the period is complete, false if it's incomplete
 */
export declare function isLastPeriodComplete(lastDataPoint: any, timeDimensionField: string, granularity: string): boolean;
/**
 * Extract granularity from a query object
 * @param queryObject - The CubeQuery object
 * @param dimensionField - Optional specific dimension field to match
 * @returns The granularity string or null if not found
 */
export declare function getQueryGranularity(queryObject: any, dimensionField?: string): string | null;
/**
 * Filter data to exclude incomplete or last period
 * @param data - The data array sorted by time
 * @param timeDimensionField - The field containing time values
 * @param queryObject - The query object containing timeDimensions
 * @param useLastCompletePeriod - Whether to check for incomplete periods
 * @param skipLastPeriod - Whether to always skip the last period (overrides useLastCompletePeriod)
 * @returns Object with filtered data and whether filtering was applied
 */
export declare function filterIncompletePeriod(data: any[], timeDimensionField: string | undefined, queryObject: any, useLastCompletePeriod: boolean, skipLastPeriod?: boolean): {
    filteredData: any[];
    excludedIncompletePeriod: boolean;
    skippedLastPeriod: boolean;
    granularity: string | null;
};

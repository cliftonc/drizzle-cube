/**
 * Comparison Data Utilities
 * Handles period-over-period comparison data transformation for charts
 *
 * These utilities detect comparison query results (with __periodIndex metadata)
 * and transform them for visualization in either 'separate' or 'overlay' mode.
 */
/**
 * Check if data contains comparison period metadata
 */
export declare function isComparisonData(data: any[]): boolean;
/**
 * Get unique period labels from comparison data
 */
export declare function getPeriodLabels(data: any[]): string[];
/**
 * Get period indices from comparison data
 */
export declare function getPeriodIndices(data: any[]): number[];
/**
 * Generate a short label for a period (used in legends)
 * Uses simple "Current" / "Prior" labels for clarity
 */
export declare function generatePeriodShortLabel(_periodLabel: string, index: number): string;
/**
 * Transform comparison data for 'separate' mode
 * Returns data with each row having its original measure values
 * Series are created per period (e.g., "totalLinesOfCode (Current)", "totalLinesOfCode (Prior)")
 */
export declare function transformForSeparateMode(data: any[], measures: string[], _timeDimensionKey: string): {
    data: any[];
    seriesKeys: string[];
};
/**
 * Transform comparison data for 'overlay' mode
 * Pivots data so each row represents a day-of-period index,
 * with separate columns for each period's values.
 *
 * When dimensions are present, creates series keys that include
 * dimension values: "Engineering - Total Lines of Code (Current)"
 *
 * Input (without dimensions):
 *   [
 *     { date: '2024-01-01', value: 100, __periodIndex: 0, __periodDayIndex: 0 },
 *     { date: '2024-01-02', value: 110, __periodIndex: 0, __periodDayIndex: 1 },
 *     { date: '2023-01-01', value: 80, __periodIndex: 1, __periodDayIndex: 0 },
 *     { date: '2023-01-02', value: 85, __periodIndex: 1, __periodDayIndex: 1 },
 *   ]
 *
 * Output (without dimensions):
 *   [
 *     { __periodDayIndex: 0, 'value (Current)': 100, 'value (Prior)': 80 },
 *     { __periodDayIndex: 1, 'value (Current)': 110, 'value (Prior)': 85 },
 *   ]
 *
 * Input (with dimensions):
 *   [
 *     { date: '2024-01-01', 'Dept.name': 'Engineering', value: 100, __periodIndex: 0, __periodDayIndex: 0 },
 *     { date: '2024-01-01', 'Dept.name': 'Sales', value: 50, __periodIndex: 0, __periodDayIndex: 0 },
 *     { date: '2023-01-01', 'Dept.name': 'Engineering', value: 80, __periodIndex: 1, __periodDayIndex: 0 },
 *     { date: '2023-01-01', 'Dept.name': 'Sales', value: 40, __periodIndex: 1, __periodDayIndex: 0 },
 *   ]
 *
 * Output (with dimensions):
 *   [
 *     {
 *       __periodDayIndex: 0,
 *       'Engineering - value (Current)': 100,
 *       'Engineering - value (Prior)': 80,
 *       'Sales - value (Current)': 50,
 *       'Sales - value (Prior)': 40,
 *     },
 *   ]
 */
export declare function transformForOverlayMode(data: any[], measures: string[], timeDimensionKey: string, getFieldLabel?: (fieldName: string) => string): {
    data: any[];
    seriesKeys: string[];
    xAxisKey: string;
};
/**
 * Format the period day index for display on X-axis
 * Can show as "Day 1", "Day 2", etc., or as the original date
 */
export declare function formatPeriodDayIndex(dayIndex: number, displayDate?: string | Date, options?: {
    showDayNumber?: boolean;
    dateFormat?: 'short' | 'long';
}): string;
/**
 * Check if a series key represents a prior period (not the first period)
 * Used for applying different styling to prior period lines
 */
export declare function isPriorPeriodSeries(seriesKey: string, periodLabels: string[]): boolean;
/**
 * Get the stroke dash array for prior period styling
 */
export declare function getPriorPeriodStrokeDashArray(style?: 'solid' | 'dashed' | 'dotted'): string | undefined;

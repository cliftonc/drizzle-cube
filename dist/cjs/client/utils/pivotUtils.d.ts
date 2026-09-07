import { CubeQuery, CubeMeta } from '../types.js';
/**
 * Derives ordered column list from a CubeQuery object.
 * Order: dimensions, timeDimensions (as field names), measures
 *
 * @param queryObject The CubeQuery object
 * @returns Array of field names in order
 */
export declare function getOrderedColumnsFromQuery(queryObject?: CubeQuery): string[];
/**
 * Configuration for pivoting based on query structure
 */
export interface PivotConfig {
    /** Time dimension field name (e.g., "Sales.date") */
    timeDimension: string;
    /** Time granularity (e.g., "month", "day", "year") */
    granularity: string;
    /** Non-time dimension fields */
    dimensions: string[];
    /** Measure fields */
    measures: string[];
}
/**
 * Column definition for pivoted table
 */
export interface PivotColumn {
    /** Column key for data access */
    key: string;
    /** Display label for column header */
    label: string;
    /** Whether this is a time column (vs row identifier column) */
    isTimeColumn: boolean;
    /** Whether this is the measure column */
    isMeasureColumn?: boolean;
}
/**
 * Row in the pivoted table
 */
export interface PivotRow {
    /** Unique row identifier */
    id: string;
    /** The measure field name (for icon lookup) */
    measureField: string;
    /** Values keyed by column key */
    values: Record<string, any>;
    /** Whether this is the first row in a dimension group (for row spanning) */
    isFirstInGroup?: boolean;
    /** Number of rows to span for dimension cells (only set on first row in group) */
    dimensionRowSpan?: number;
}
/**
 * Result of pivoting table data
 */
export interface PivotedTableData {
    /** Whether data was pivoted (has time dimension with granularity) */
    isPivoted: boolean;
    /** Column definitions for the pivoted table */
    columns: PivotColumn[];
    /** Rows of pivoted data */
    rows: PivotRow[];
}
/**
 * Determines if a query has a time dimension with granularity that should trigger pivoting
 * @param queryObject The CubeQuery object
 * @param xAxisOverride Optional array of fields to use for filtering dimensions and measures
 *                      (for respecting chartConfig.xAxis configuration)
 * @returns PivotConfig if pivoting should occur, null otherwise
 */
export declare function hasTimeDimensionForPivot(queryObject?: CubeQuery, xAxisOverride?: string[]): PivotConfig | null;
/**
 * Pivots flat data into time-columned table structure
 *
 * @param data Raw data array from query result
 * @param config Pivot configuration
 * @param getFieldLabel Function to get display label for a field
 * @param meta Optional cube metadata for looking up measure types
 * @returns Pivoted table data structure
 */
export declare function pivotTableData(data: any[], config: PivotConfig, getFieldLabel: (field: string) => string, _meta?: CubeMeta | null): PivotedTableData;
/**
 * Looks up the measure type from metadata
 *
 * @param measureField The fully qualified measure field name (e.g., "Sales.revenue")
 * @param meta Cube metadata
 * @returns The measure type (e.g., "sum", "count", "avg") or undefined
 */
export declare function getMeasureType(measureField: string, meta: CubeMeta | null): string | undefined;

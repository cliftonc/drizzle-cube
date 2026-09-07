import { CubeQuery } from '../../types.js';
export interface GridCell {
    x: number;
    y: number;
    value: number;
    date: Date;
    label: string;
}
export interface GridMapping {
    extractX: (date: Date) => number;
    extractY: (date: Date) => number;
    xLabels: string[];
    yLabels: string[];
    xFormat: (value: number) => string;
    yFormat: (value: number) => string;
    cellWidth: number;
    cellHeight: number;
    hasHierarchicalLabels?: boolean;
    getYearFromX?: (value: number) => number;
}
/** Week-of-year (1-53) with the ISO-aligned year for the given date. */
export declare function getWeekOfYear(date: Date): {
    year: number;
    week: number;
};
/** Get the grid coordinate mapping for a granularity (null when unsupported). */
export declare function getGridMapping(granularity: string): GridMapping | null;
/** Resolve the first matching field (string | array) for a date config value. */
export declare function firstDateField(value: string | string[] | undefined): string | undefined;
/** Get the query granularity for the date field, falling back to 'day'. */
export declare function getQueryGranularity(queryObject: CubeQuery | undefined, dateField: string): string;
/** Transform query rows into grid cells, skipping invalid dates. */
export declare function buildGridData(data: Record<string, any>[], dateField: string, valueField: string, gridMapping: GridMapping, granularity: string): GridCell[];

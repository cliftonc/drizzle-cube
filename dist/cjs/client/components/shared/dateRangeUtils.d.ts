import { DateRangeType } from '../../shared/types.js';
/**
 * Date preset configuration for compact filter bar
 */
export interface DatePreset {
    id: string;
    label: string;
    value: string;
}
export declare const DATE_PRESETS: DatePreset[];
export declare const XTD_OPTIONS: DatePreset[];
type DateRange = {
    start: Date;
    end: Date;
};
/**
 * Calculate actual date range from a preset string
 * Returns start and end dates for display purposes
 */
export declare function calculateDateRange(preset: string): DateRange | null;
/**
 * Format a date range for display (e.g., "Jan 1, 2024 - Jan 31, 2024")
 */
export declare function formatDateRangeDisplay(start: Date, end: Date): string;
/**
 * Detect preset ID from a date range value
 * Returns the preset ID (e.g., '7d', 'mtd') or 'custom' if not a preset
 */
export declare function detectPresetFromDateRange(dateRange: string | string[] | undefined): string | null;
export interface DerivedRange {
    rangeType: DateRangeType;
    /** Present only when the range encodes an explicit "last N" count. */
    numberValue?: number;
}
/**
 * Resolve the rangeType (and optional numberValue) that corresponds to a
 * filter's stored `dateRange`. Returns `null` when there is nothing to derive.
 */
export declare function deriveRangeFromDateRange(dateRange: string | string[] | undefined): DerivedRange | null;
export {};

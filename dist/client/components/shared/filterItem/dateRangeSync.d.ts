import { DateRangeType } from '../types.js';
export interface ResolvedDateRangeState {
    rangeType: DateRangeType;
    customDates?: {
        startDate: string;
        endDate: string;
    };
    numberValue?: number;
}
/**
 * Resolve the UI date-range state for a stored filter dateRange.
 * Returns null when there is nothing to sync.
 */
export declare function resolveDateRangeState(dateRange: string | string[] | undefined): ResolvedDateRangeState | null;

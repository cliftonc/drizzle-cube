import { ChangeEvent } from 'react';
import { SimpleFilter } from '../../types.js';
import { DateRangeType } from '../../shared/types.js';
interface UseDateRangeStateParams {
    localFilter: SimpleFilter;
    setLocalFilter: (filter: SimpleFilter) => void;
    shouldShowDateRange: boolean;
    setIsDateRangeDropdownOpen: (open: boolean) => void;
}
export declare function useDateRangeState({ localFilter, setLocalFilter, shouldShowDateRange, setIsDateRangeDropdownOpen }: UseDateRangeStateParams): {
    rangeType: DateRangeType;
    numberValue: number;
    handleRangeTypeChange: (newRangeType: DateRangeType) => void;
    handleNumberValueChange: (value: number) => void;
    handleCustomStartDate: (e: ChangeEvent<HTMLInputElement>) => void;
    handleCustomEndDate: (e: ChangeEvent<HTMLInputElement>) => void;
};
export type UseDateRangeState = ReturnType<typeof useDateRangeState>;
export {};

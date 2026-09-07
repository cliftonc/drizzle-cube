import { DateRangeType } from '../types.js';
interface FilterDateRangeSelectorProps {
    rangeType: DateRangeType;
    selectedRangeLabel: string;
    numberValue: number;
    customDates: {
        startDate: string;
        endDate: string;
    };
    isDropdownOpen: boolean;
    onDropdownToggle: () => void;
    onRangeTypeChange: (rangeType: DateRangeType) => void;
    onCustomDateChange: (field: 'startDate' | 'endDate', value: string) => void;
    onNumberChange: (value: number) => void;
}
export declare function FilterDateRangeSelector({ rangeType, selectedRangeLabel, numberValue, customDates, isDropdownOpen, onDropdownToggle, onRangeTypeChange, onCustomDateChange, onNumberChange }: FilterDateRangeSelectorProps): import("react").JSX.Element;
export {};

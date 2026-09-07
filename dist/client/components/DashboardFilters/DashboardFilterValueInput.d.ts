import { ChangeEvent } from 'react';
import { SimpleFilter } from '../../types.js';
import { DateRangeType } from '../../shared/types.js';
type OperatorMeta = {
    requiresValues?: boolean;
    valueType?: string;
    supportsMultipleValues?: boolean;
} | undefined;
export interface DashboardFilterValueInputProps {
    filter: SimpleFilter;
    operatorMeta: OperatorMeta;
    shouldShowDateRange: boolean;
    shouldShowComboBox: boolean;
    rangeType: DateRangeType;
    numberValue: number;
    dateRangeLabel: string;
    isDateRangeDropdownOpen: boolean;
    setIsOperatorDropdownOpen: (open: boolean) => void;
    setIsValueDropdownOpen: (open: boolean) => void;
    setIsDateRangeDropdownOpen: (open: boolean) => void;
    handleRangeTypeChange: (rangeType: DateRangeType) => void;
    handleNumberValueChange: (value: number) => void;
    handleCustomStartDate: (e: ChangeEvent<HTMLInputElement>) => void;
    handleCustomEndDate: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBetweenStartInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBetweenEndInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDateInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDirectInput: (e: ChangeEvent<HTMLInputElement>) => void;
    isValueDropdownOpen: boolean;
    distinctValues: unknown[];
    valuesLoading: boolean;
    valuesError: unknown;
    searchText: string;
    setSearchText: (text: string) => void;
    handleValueSelect: (value: unknown) => void;
    handleValueRemove: (value: unknown) => void;
}
export default function DashboardFilterValueInput(props: DashboardFilterValueInputProps): import("react").JSX.Element;
export {};

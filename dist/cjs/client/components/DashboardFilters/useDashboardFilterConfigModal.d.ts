import { ChangeEvent } from 'react';
import { DashboardFilter, SimpleFilter, FilterOperator } from '../../types.js';
import { MetaResponse, MetaField } from '../../shared/types.js';
import { FieldType } from '../AnalysisBuilder/types.js';
interface UseDashboardFilterConfigModalParams {
    initialFilter: DashboardFilter;
    fullSchema: MetaResponse | null;
    filteredSchema: MetaResponse | null;
    isOpen: boolean;
    onSave: (filter: DashboardFilter) => void;
}
export declare function useDashboardFilterConfigModal({ initialFilter, fullSchema, filteredSchema, isOpen, onSave }: UseDashboardFilterConfigModalParams): {
    localLabel: string;
    setLocalLabel: import('react').Dispatch<import('react').SetStateAction<string>>;
    localFilter: SimpleFilter;
    showAllFields: boolean;
    setShowAllFields: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    showFieldSearch: boolean;
    setShowFieldSearch: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    field: {
        activeSchema: MetaResponse | null;
        isTimeField: boolean;
        isMeasureField: boolean;
        fieldTitle: string;
        operatorMeta: import('../../shared/types.js').FilterOperatorMeta;
        availableOperators: {
            operator: string;
            label: string;
        }[];
        operatorLabel: string;
        shouldShowDateRange: boolean;
        shouldShowComboBox: boolean;
    };
    dropdowns: {
        containerRef: import('react').RefObject<HTMLDivElement>;
        isOperatorDropdownOpen: boolean;
        setIsOperatorDropdownOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
        isValueDropdownOpen: boolean;
        setIsValueDropdownOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
        isDateRangeDropdownOpen: boolean;
        setIsDateRangeDropdownOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    };
    values: {
        searchText: string;
        setSearchText: import('react').Dispatch<import('react').SetStateAction<string>>;
        distinctValues: any[];
        valuesLoading: boolean;
        valuesError: string | null;
        handleValueSelect: (value: unknown) => void;
        handleValueRemove: (valueToRemove: unknown) => void;
    };
    dateRange: {
        dateRangeLabel: string;
        rangeType: import('../shared/types.js').DateRangeType;
        numberValue: number;
        handleRangeTypeChange: (newRangeType: import('../shared/types.js').DateRangeType) => void;
        handleNumberValueChange: (value: number) => void;
        handleCustomStartDate: (e: ChangeEvent<HTMLInputElement>) => void;
        handleCustomEndDate: (e: ChangeEvent<HTMLInputElement>) => void;
    };
    handleFieldSelected: (field: MetaField, _fieldType: FieldType) => void;
    handleOperatorChange: (operator: FilterOperator) => void;
    handleDirectInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBetweenStartInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBetweenEndInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDateInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSave: () => void;
};
export {};

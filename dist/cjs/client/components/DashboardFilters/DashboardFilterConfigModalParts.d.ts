import { MetaResponse } from '../../shared/types.js';
import { SimpleFilter, FilterOperator } from '../../types.js';
interface FieldSelectionSectionProps {
    localFilter: SimpleFilter;
    activeSchema: MetaResponse | null;
    isTimeField: boolean;
    isMeasureField: boolean;
    showAllFields: boolean;
    setShowAllFields: (next: boolean) => void;
    setShowFieldSearch: (next: boolean) => void;
}
export declare function FieldSelectionSection({ localFilter, activeSchema, isTimeField, isMeasureField, showAllFields, setShowAllFields, setShowFieldSearch }: FieldSelectionSectionProps): import("react").JSX.Element;
interface OperatorSectionProps {
    localFilter: SimpleFilter;
    operatorLabel: string;
    availableOperators: {
        operator: string;
        label: string;
    }[];
    isOperatorDropdownOpen: boolean;
    setIsOperatorDropdownOpen: (next: boolean) => void;
    setIsValueDropdownOpen: (next: boolean) => void;
    setIsDateRangeDropdownOpen: (next: boolean) => void;
    handleOperatorChange: (operator: FilterOperator) => void;
}
export declare function OperatorSection({ localFilter, operatorLabel, availableOperators, isOperatorDropdownOpen, setIsOperatorDropdownOpen, setIsValueDropdownOpen, setIsDateRangeDropdownOpen, handleOperatorChange }: OperatorSectionProps): import("react").JSX.Element;
export {};

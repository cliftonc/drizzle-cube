import { SimpleFilter } from '../../types.js';
interface OperatorMetaLike {
    supportsMultipleValues?: boolean;
}
interface UseFilterValueFetchParams {
    localFilter: SimpleFilter;
    setLocalFilter: (filter: SimpleFilter) => void;
    operatorMeta: OperatorMetaLike | undefined;
    shouldShowComboBox: boolean;
    isValueDropdownOpen: boolean;
    setIsValueDropdownOpen: (open: boolean) => void;
}
export declare function useFilterValueFetch({ localFilter, setLocalFilter, operatorMeta, shouldShowComboBox, isValueDropdownOpen, setIsValueDropdownOpen }: UseFilterValueFetchParams): {
    searchText: string;
    setSearchText: import('react').Dispatch<import('react').SetStateAction<string>>;
    distinctValues: any[];
    valuesLoading: boolean;
    valuesError: string | null;
    handleValueSelect: (value: unknown) => void;
    handleValueRemove: (valueToRemove: unknown) => void;
};
export type UseFilterValueFetch = ReturnType<typeof useFilterValueFetch>;
export {};

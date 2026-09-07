import { default as React } from 'react';
import { MetaField } from '../types.js';
interface FilterFieldDropdownProps {
    isOpen: boolean;
    selectedField: MetaField | undefined;
    selectedMember: string | undefined;
    fieldSearchTerm: string;
    filteredQueryFields: MetaField[];
    filteredAllFields: MetaField[];
    searchInputRef: React.RefObject<HTMLInputElement>;
    onToggle: () => void;
    onSearchTermChange: (term: string) => void;
    onFieldChange: (fieldName: string) => void;
}
export declare function FilterFieldDropdown({ isOpen, selectedField, selectedMember, fieldSearchTerm, filteredQueryFields, filteredAllFields, searchInputRef, onToggle, onSearchTermChange, onFieldChange }: FilterFieldDropdownProps): React.JSX.Element;
export {};

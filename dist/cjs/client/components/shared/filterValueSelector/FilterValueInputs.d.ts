import { default as React } from 'react';
type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;
export declare function NoValueInput(): React.JSX.Element;
interface DateRangeInputProps {
    values: any[];
    onStartChange: ChangeHandler;
    onEndChange: ChangeHandler;
}
export declare function DateRangeInput({ values, onStartChange, onEndChange }: DateRangeInputProps): React.JSX.Element;
interface BetweenInputProps {
    values: any[];
    onStartChange: ChangeHandler;
    onEndChange: ChangeHandler;
}
export declare function BetweenInput({ values, onStartChange, onEndChange }: BetweenInputProps): React.JSX.Element;
interface SingleDateInputProps {
    values: any[];
    onChange: ChangeHandler;
}
export declare function SingleDateInput({ values, onChange }: SingleDateInputProps): React.JSX.Element;
interface NumberInputProps {
    values: any[];
    onChange: ChangeHandler;
}
export declare function NumberInput({ values, onChange }: NumberInputProps): React.JSX.Element;
interface TextInputProps {
    values: any[];
    onChange: ChangeHandler;
    valueType: string;
}
export declare function TextInput({ values, onChange, valueType }: TextInputProps): React.JSX.Element;
interface MultiDateInputProps {
    values: any[];
    onValuesChange: (values: any[]) => void;
    onValueRemove: (value: any) => void;
}
export declare function MultiDateInput({ values, onValuesChange, onValueRemove }: MultiDateInputProps): React.JSX.Element;
interface ComboBoxInputProps {
    dropdownRef: React.RefObject<HTMLDivElement>;
    supportsMultipleValues: boolean;
    values: any[];
    isOpen: boolean;
    searchText: string;
    hasLoadedInitial: boolean;
    valuesLoading: boolean;
    valuesError: any;
    distinctValues: any[];
    onValuesChange: (values: any[]) => void;
    onValueRemove: (value: any) => void;
    onValueSelect: (value: any) => void;
    onToggle: () => void;
    onSearchChange: ChangeHandler;
}
export declare function ComboBoxInput({ dropdownRef, supportsMultipleValues, values, isOpen, searchText, hasLoadedInitial, valuesLoading, valuesError, distinctValues, onValuesChange, onValueRemove, onValueSelect, onToggle, onSearchChange }: ComboBoxInputProps): React.JSX.Element;
export {};

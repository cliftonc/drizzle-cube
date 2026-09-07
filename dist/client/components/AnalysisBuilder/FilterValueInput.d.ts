import { ChangeEvent, MouseEvent, KeyboardEvent, RefObject } from 'react';
import { SimpleFilter } from '../../types.js';
import { DateRangeType } from '../../shared/types.js';
type OperatorMeta = {
    requiresValues?: boolean;
    valueType?: string;
    supportsMultipleValues?: boolean;
} | undefined;
/** Which control to render: the filter being edited and its operator metadata. */
export interface FilterFieldContext {
    filter: SimpleFilter;
    operatorMeta: OperatorMeta;
    shouldShowDateRange: boolean;
    shouldShowComboBox: boolean;
}
/** State + handlers for the date-range selector (inDateRange on time fields). */
export interface DateRangeGroup {
    rangeType: DateRangeType;
    numberValue: number;
    label: string;
    isOpen: boolean;
    onToggle: (open: boolean) => void;
    onRangeTypeChange: (rangeType: DateRangeType) => void;
    onNumberValueChange: (value: number) => void;
    onCustomStartDate: (e: ChangeEvent<HTMLInputElement>) => void;
    onCustomEndDate: (e: ChangeEvent<HTMLInputElement>) => void;
    /** Close sibling dropdowns when this one opens. */
    onOpen: () => void;
}
/** Async distinct-value combo-box state + handlers (equals/in on dimensions). */
export interface ComboBoxGroup {
    isOpen: boolean;
    options: unknown[];
    loading: boolean;
    error: unknown;
    searchText: string;
    highlightedIndex: number;
    listRef: RefObject<HTMLDivElement>;
    onSearchTextChange: (text: string) => void;
    onHighlightedIndexChange: (index: number) => void;
    onSelect: (value: unknown, event?: MouseEvent | {
        shiftKey: boolean;
    }) => void;
    onRemove: (value: unknown) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    /** Open the combo-box, closing sibling dropdowns. */
    onOpen: () => void;
}
/** Handlers for the plain between/date/number/text inputs. */
export interface SimpleInputHandlers {
    onBetweenStart: (e: ChangeEvent<HTMLInputElement>) => void;
    onBetweenEnd: (e: ChangeEvent<HTMLInputElement>) => void;
    onDate: (e: ChangeEvent<HTMLInputElement>) => void;
    onDirect: (e: ChangeEvent<HTMLInputElement>) => void;
}
export interface FilterValueInputProps {
    field: FilterFieldContext;
    dateRange: DateRangeGroup;
    combo: ComboBoxGroup;
    inputs: SimpleInputHandlers;
}
export default function FilterValueInput({ field, dateRange, combo, inputs }: FilterValueInputProps): import("react").JSX.Element;
export {};

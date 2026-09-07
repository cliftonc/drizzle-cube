import { FieldOption } from './types.js';
import { MetaResponse } from '../../shared/types.js';
interface FieldSearchResultsProps {
    mode: 'metrics' | 'breakdown' | 'filter' | 'dimensionFilter';
    schema: MetaResponse | null;
    searchTerm: string;
    recentOptions: FieldOption[];
    groupedFields: Map<string, FieldOption[]>;
    filteredCount: number;
    selectedFields: string[];
    focusedIndex: number;
    onSelectField: (field: FieldOption, fieldIndex: number, shiftKey: boolean) => void;
    onFocusField: (field: FieldOption, index: number) => void;
}
declare const FieldSearchResults: import('react').MemoExoticComponent<({ mode, schema, searchTerm, recentOptions, groupedFields, filteredCount, selectedFields, focusedIndex, onSelectField, onFocusField }: FieldSearchResultsProps) => import("react").JSX.Element>;
export default FieldSearchResults;

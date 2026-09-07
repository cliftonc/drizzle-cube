import { KeyboardEvent, RefObject } from 'react';
import { FieldOption } from '../types.js';
export interface FieldSearchKeyboardApi {
    focusedField: FieldOption | null;
    setFocusedField: (field: FieldOption | null) => void;
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
    resultsContainerRef: RefObject<HTMLDivElement>;
    handleKeyDown: (e: KeyboardEvent) => void;
}
export declare function useFieldSearchKeyboard(flatFieldsList: FieldOption[], onSelectField: (field: FieldOption, fieldIndex: number, shiftKey: boolean) => void, onClose: () => void): FieldSearchKeyboardApi;

import { default as React } from 'react';
import { SimpleFilter } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface FilterConfigModalProps {
    /** The filter being edited */
    filter: SimpleFilter;
    /** Schema for field metadata */
    schema: MetaResponse | null;
    /** Callback when user saves changes */
    onSave: (filter: SimpleFilter) => void;
    /** Callback when user cancels */
    onCancel: () => void;
    /** Element to position the modal near */
    anchorElement?: HTMLElement | null;
}
export default function FilterConfigModal({ filter: initialFilter, schema, onSave, onCancel, anchorElement }: FilterConfigModalProps): React.JSX.Element;
export {};

import { DashboardFilter } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface DashboardFilterConfigModalProps {
    /** The dashboard filter being edited */
    filter: DashboardFilter;
    /** Full schema (unfiltered) */
    fullSchema: MetaResponse | null;
    /** Filtered schema (dashboard fields only) */
    filteredSchema: MetaResponse | null;
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when user saves changes */
    onSave: (filter: DashboardFilter) => void;
    /** Callback when user deletes the filter */
    onDelete: () => void;
    /** Callback when user closes/cancels */
    onClose: () => void;
}
export default function DashboardFilterConfigModal({ filter: initialFilter, fullSchema, filteredSchema, isOpen, onSave, onDelete, onClose }: DashboardFilterConfigModalProps): import("react").JSX.Element | null;
export {};

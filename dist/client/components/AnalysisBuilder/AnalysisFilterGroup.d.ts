import { GroupFilter } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface AnalysisFilterGroupProps {
    /** The group filter to render */
    group: GroupFilter;
    /** Schema for field metadata */
    schema: MetaResponse | null;
    /** Callback when group changes */
    onUpdate: (group: GroupFilter) => void;
    /** Callback to remove this group */
    onRemove: () => void;
    /** Callback to add a new filter - receives path relative to this group */
    onAddFilter: (relativePath?: number[]) => void;
    /** Depth level for styling */
    depth?: number;
    /** Whether to hide the remove button (for top-level groups) */
    hideRemoveButton?: boolean;
}
export default function AnalysisFilterGroup({ group, schema, onUpdate, onRemove, onAddFilter, depth, hideRemoveButton }: AnalysisFilterGroupProps): import("react").JSX.Element;
export {};

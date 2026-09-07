import { SimpleFilter } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface AnalysisFilterItemProps {
    /** The filter to display */
    filter: SimpleFilter;
    /** Schema for field metadata */
    schema: MetaResponse | null;
    /** Callback to remove this filter */
    onRemove: () => void;
    /** Callback to update this filter */
    onUpdate: (filter: SimpleFilter) => void;
}
export default function AnalysisFilterItem({ filter, schema, onRemove, onUpdate }: AnalysisFilterItemProps): import("react").JSX.Element;
export {};

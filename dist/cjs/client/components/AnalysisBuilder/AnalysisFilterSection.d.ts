import { Filter } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface AnalysisFilterSectionProps {
    /** Current filters */
    filters: Filter[];
    /** Schema for field metadata */
    schema: MetaResponse | null;
    /** Callback when filters change */
    onFiltersChange: (filters: Filter[]) => void;
    /** Callback when a field is dropped from another section */
    onFieldDropped?: (field: string) => void;
    /** Only allow dimension filters (no measures) - used for funnel step filters */
    dimensionsOnly?: boolean;
}
export default function AnalysisFilterSection({ filters, schema, onFiltersChange, onFieldDropped, dimensionsOnly }: AnalysisFilterSectionProps): import("react").JSX.Element;
export {};

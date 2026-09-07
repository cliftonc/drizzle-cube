import { DashboardFilter } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface DashboardFilterItemProps {
    /** The dashboard filter to display */
    filter: DashboardFilter;
    /** Schema for field metadata */
    schema: MetaResponse | null;
    /** Callback when filter chip is clicked (opens edit modal) */
    onClick: () => void;
    /** Callback to remove this filter */
    onRemove: () => void;
}
export default function DashboardFilterItem({ filter, schema, onClick, onRemove }: DashboardFilterItemProps): import("react").JSX.Element;
export {};

import { default as React } from 'react';
import { DashboardFilter, CubeMeta } from '../../types.js';
interface FilterChipProps {
    filter: DashboardFilter;
    schema: CubeMeta | null;
    isEditMode: boolean;
    onChange: (updatedFilter: DashboardFilter) => void;
    onEdit?: () => void;
    onRemove?: () => void;
}
declare const FilterChip: React.FC<FilterChipProps>;
export default FilterChip;

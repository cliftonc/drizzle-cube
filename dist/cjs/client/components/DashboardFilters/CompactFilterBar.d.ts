import { default as React } from 'react';
import { DashboardFilter, CubeMeta } from '../../types.js';
interface CompactFilterBarProps {
    dashboardFilters: DashboardFilter[];
    schema: CubeMeta | null;
    isEditMode: boolean;
    onDashboardFiltersChange: (filters: DashboardFilter[]) => void;
    onAddFilter?: () => void;
    onEditFilter?: (filterId: string) => void;
    onRemoveFilter?: (filterId: string) => void;
}
declare const CompactFilterBar: React.FC<CompactFilterBarProps>;
export default CompactFilterBar;

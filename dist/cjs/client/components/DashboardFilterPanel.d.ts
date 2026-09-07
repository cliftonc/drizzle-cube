import { default as React } from 'react';
import { DashboardFilter, CubeMeta, DashboardConfig } from '../types.js';
interface DashboardFilterPanelProps {
    dashboardFilters: DashboardFilter[];
    editable: boolean;
    schema: CubeMeta | null;
    dashboardConfig: DashboardConfig;
    onDashboardFiltersChange: (filters: DashboardFilter[]) => void;
    onSaveFilters?: (filters: DashboardFilter[]) => void | Promise<void>;
    selectedFilterId?: string | null;
    onFilterSelect?: (filterId: string) => void;
    isEditMode?: boolean;
}
declare const DashboardFilterPanel: React.FC<DashboardFilterPanelProps>;
export default DashboardFilterPanel;

import { default as React } from 'react';
import { DashboardFilter } from '../../types.js';
interface EditModeFilterListProps {
    dashboardFilters: DashboardFilter[];
    onAddFilter: () => void;
    onAddTimeFilter: () => void;
    onEditFilter: (filterId: string) => void;
    onRemoveFilter: (filterId: string) => void;
    selectedFilterId?: string | null;
    onFilterSelect?: (filterId: string) => void;
}
declare const EditModeFilterList: React.FC<EditModeFilterListProps>;
export default EditModeFilterList;

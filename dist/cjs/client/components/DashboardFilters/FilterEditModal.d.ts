import { default as React } from 'react';
import { DashboardFilter, CubeMeta, DashboardConfig } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface FilterEditModalProps {
    filter: DashboardFilter;
    schema: CubeMeta | null;
    dashboardConfig: DashboardConfig;
    isOpen: boolean;
    onSave: (filter: DashboardFilter) => void | Promise<void>;
    onClose: () => void;
    onDelete: () => void;
    convertToMetaResponse: (cubeMeta: CubeMeta | null) => MetaResponse | null;
}
declare const FilterEditModal: React.FC<FilterEditModalProps>;
export default FilterEditModal;

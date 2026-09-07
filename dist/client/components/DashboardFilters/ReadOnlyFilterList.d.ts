import { default as React } from 'react';
import { DashboardFilter, CubeMeta } from '../../types.js';
import { MetaResponse } from '../../shared/types.js';
interface ReadOnlyFilterListProps {
    dashboardFilters: DashboardFilter[];
    schema: CubeMeta | null;
    onFilterChange: (filterId: string, updatedFilter: DashboardFilter) => void;
    onDateRangeChange: (filterId: string, dateRange: string | string[]) => void;
    convertToMetaResponse: (cubeMeta: CubeMeta | null) => MetaResponse | null;
    isTimeDimensionField: (fieldName: string) => boolean;
}
declare const ReadOnlyFilterList: React.FC<ReadOnlyFilterListProps>;
export default ReadOnlyFilterList;

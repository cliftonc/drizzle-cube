import { DashboardFilter } from '../../types.js';
export declare function useCompactFilterBar(dashboardFilters: DashboardFilter[], onDashboardFiltersChange: (filters: DashboardFilter[]) => void): {
    localFilters: DashboardFilter[];
    showCustomDropdown: boolean;
    setShowCustomDropdown: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    showXTDDropdown: boolean;
    setShowXTDDropdown: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    customButtonRef: import('react').RefObject<HTMLButtonElement>;
    xtdButtonRef: import('react').RefObject<HTMLButtonElement>;
    currentDateRange: string | any[] | null;
    activePresetId: string | null;
    activeXTDId: string | null;
    nonDateFilters: DashboardFilter[];
    handlePresetSelect: (presetValue: string) => void;
    handleXTDSelect: (xtdValue: string) => void;
    handleCustomDateSelect: (dateRange: string | string[]) => void;
    handleFilterChange: (filterId: string, updatedFilter: DashboardFilter) => void;
    dateRangeTooltip: string | null;
};

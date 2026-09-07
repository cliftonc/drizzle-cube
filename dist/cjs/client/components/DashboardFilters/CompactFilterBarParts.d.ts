import { RefObject } from 'react';
import { DashboardFilter, CubeMeta } from '../../types.js';
export interface CompactFilterBarViewProps {
    schema: CubeMeta | null;
    isEditMode: boolean;
    onAddFilter?: () => void;
    onEditFilter?: (filterId: string) => void;
    onRemoveFilter?: (filterId: string) => void;
    currentDateRange: string | string[] | null;
    activePresetId: string | null;
    activeXTDId: string | null;
    nonDateFilters: DashboardFilter[];
    dateRangeTooltip: string | null;
    showCustomDropdown: boolean;
    setShowCustomDropdown: (next: boolean) => void;
    showXTDDropdown: boolean;
    setShowXTDDropdown: (next: boolean) => void;
    customButtonRef: RefObject<HTMLButtonElement>;
    xtdButtonRef: RefObject<HTMLButtonElement>;
    handlePresetSelect: (presetValue: string) => void;
    handleXTDSelect: (xtdValue: string) => void;
    handleCustomDateSelect: (dateRange: string | string[]) => void;
    handleFilterChange: (filterId: string, updatedFilter: DashboardFilter) => void;
}
export declare function DesktopLayout(props: CompactFilterBarViewProps): import("react").JSX.Element;
export declare function MobileLayout(props: CompactFilterBarViewProps): import("react").JSX.Element;

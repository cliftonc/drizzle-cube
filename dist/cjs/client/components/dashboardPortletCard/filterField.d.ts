import { DashboardFilter, PortletConfig } from '../../types.js';
export interface EffectiveFilterField {
    field: string;
    isOverride: boolean;
}
export declare function resolveEffectiveFilterField(params: {
    isInSelectionMode: boolean;
    hasSelectedFilter: boolean;
    selectedFilterId: string | null | undefined;
    dashboardFilters?: DashboardFilter[];
    dashboardFilterMapping: PortletConfig['dashboardFilterMapping'];
}): EffectiveFilterField | null;

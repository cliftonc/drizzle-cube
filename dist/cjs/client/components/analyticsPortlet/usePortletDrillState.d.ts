import { ChartAxisConfig, CubeQuery, DashboardFilter, DashboardFilterMapping } from '../../types.js';
export interface UsePortletDrillStateParams {
    queryObject: CubeQuery | null;
    chartConfig?: ChartAxisConfig;
    dashboardFilters?: DashboardFilter[];
    dashboardFilterMapping?: DashboardFilterMapping;
    isMultiQuery: boolean;
    isFunnelMode: boolean;
    isFlowMode: boolean;
    isRetentionMode: boolean;
}
export declare function usePortletDrillState(params: UsePortletDrillStateParams): {
    drill: import('../../types.js').DrillInteraction;
    activeQuery: CubeQuery | null;
    handleNavigateBack: () => void;
    handleNavigateToLevel: (index: number) => void;
};
